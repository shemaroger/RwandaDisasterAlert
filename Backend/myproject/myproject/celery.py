# celery.py (in your project root directory)
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')

app = Celery('alert_system')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


# tasks.py (in your notifications app)
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
import logging
from datetime import timedelta

logger = logging.getLogger('notifications')


@shared_task(bind=True, max_retries=3)
def deliver_alert_async(self, alert_id):
    """Async task to deliver alerts with retry logic"""
    from myapp.models import Alert
    from myapp.services import AlertDeliveryManager
    
    try:
        alert = Alert.objects.get(id=alert_id)
        delivery_manager = AlertDeliveryManager()
        results = delivery_manager.deliver_alert(alert)
        
        logger.info(f"Async alert delivery completed for alert {alert_id}: {results}")
        return {
            'alert_id': alert_id,
            'status': 'success',
            'results': results
        }
        
    except Alert.DoesNotExist:
        logger.error(f"Alert {alert_id} not found for async delivery")
        return {
            'alert_id': alert_id,
            'status': 'error',
            'error': 'Alert not found'
        }
        
    except Exception as e:
        logger.error(f"Error in async alert delivery for alert {alert_id}: {e}")
        
        # Retry with exponential backoff
        try:
            raise self.retry(
                countdown=60 * (2 ** self.request.retries),
                max_retries=3
            )
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for alert {alert_id}")
            return {
                'alert_id': alert_id,
                'status': 'failed',
                'error': str(e)
            }


@shared_task
def deliver_single_notification(alert_id, user_id, delivery_method):
    """Deliver a single notification to a specific user"""
    from myapp.models import Alert, AlertDelivery
    from myapp.services import SMSNotificationService, EmailNotificationService, PushNotificationService
    from django.contrib.auth.models import User
    
    try:
        alert = Alert.objects.get(id=alert_id)
        user = User.objects.get(id=user_id)
        
        # Get or create delivery record
        delivery, created = AlertDelivery.objects.get_or_create(
            alert=alert,
            user=user,
            delivery_method=delivery_method,
            defaults={'status': 'pending'}
        )
        
        success = False
        error_message = ''
        
        try:
            if delivery_method == 'sms':
                service = SMSNotificationService()
                success = service.send_sms(alert, user)
            elif delivery_method == 'email':
                service = EmailNotificationService()
                success = service.send_email(alert, user)
            elif delivery_method == 'push':
                service = PushNotificationService()
                success = service.send_push_notification(alert, user)
            
            if success:
                delivery.status = 'sent'
                delivery.sent_at = timezone.now()
            else:
                delivery.status = 'failed'
                delivery.error_message = f'{delivery_method} sending failed'
                
        except Exception as e:
            delivery.status = 'failed'
            delivery.error_message = str(e)
            error_message = str(e)
            
        delivery.save()
        
        return {
            'alert_id': alert_id,
            'user_id': user_id,
            'delivery_method': delivery_method,
            'success': success,
            'error': error_message
        }
        
    except Exception as e:
        logger.error(f"Error delivering {delivery_method} to user {user_id} for alert {alert_id}: {e}")
        return {
            'alert_id': alert_id,
            'user_id': user_id,
            'delivery_method': delivery_method,
            'success': False,
            'error': str(e)
        }


@shared_task
def batch_deliver_notifications(alert_id, user_ids, delivery_methods):
    """Deliver notifications to a batch of users"""
    from celery import group
    
    # Create a group of tasks for parallel execution
    job = group(
        deliver_single_notification.s(alert_id, user_id, method)
        for user_id in user_ids
        for method in delivery_methods
    )
    
    result = job.apply_async()
    return f"Batch delivery started for alert {alert_id}"


@shared_task
def update_expired_alerts():
    """Update status of expired alerts"""
    from myapp.models import Alert
    
    now = timezone.now()
    expired_count = Alert.objects.filter(
        status='active',
        expires_at__lt=now
    ).update(status='expired')
    
    if expired_count > 0:
        logger.info(f"Updated {expired_count} expired alerts")
    
    return f"Updated {expired_count} expired alerts"


@shared_task
def cleanup_old_deliveries():
    """Clean up old delivery records"""
    from myapp.models import AlertDelivery
    
    # Keep delivery records for 90 days
    cutoff_date = timezone.now() - timedelta(days=90)
    
    old_deliveries = AlertDelivery.objects.filter(
        created_at__lt=cutoff_date
    )
    
    count = old_deliveries.count()
    old_deliveries.delete()
    
    logger.info(f"Cleaned up {count} old delivery records")
    return f"Cleaned up {count} old delivery records"


@shared_task
def retry_failed_deliveries():
    """Retry failed deliveries that are recent"""
    from myapp.models import AlertDelivery, Alert
    
    # Retry failures from the last 24 hours
    cutoff_time = timezone.now() - timedelta(hours=24)
    
    failed_deliveries = AlertDelivery.objects.filter(
        status='failed',
        created_at__gte=cutoff_time,
        alert__status='active'
    ).select_related('alert', 'user')
    
    retry_count = 0
    for delivery in failed_deliveries:
        # Reset status and retry
        delivery.status = 'pending'
        delivery.error_message = ''
        delivery.save()
        
        # Queue for retry
        deliver_single_notification.delay(
            str(delivery.alert.id),
            delivery.user.id,
            delivery.delivery_method
        )
        retry_count += 1
    
    logger.info(f"Queued {retry_count} failed deliveries for retry")
    return f"Queued {retry_count} failed deliveries for retry"


@shared_task
def send_delivery_report():
    """Send daily delivery report to administrators"""
    from myapp.models import AlertDelivery, Alert
    from django.contrib.auth.models import User
    from django.core.mail import send_mail
    from django.db.models import Count
    
    # Get stats for the last 24 hours
    yesterday = timezone.now() - timedelta(days=1)
    
    # Alert statistics
    alerts_created = Alert.objects.filter(created_at__gte=yesterday).count()
    alerts_activated = Alert.objects.filter(issued_at__gte=yesterday).count()
    
    # Delivery statistics
    deliveries = AlertDelivery.objects.filter(created_at__gte=yesterday)
    delivery_stats = deliveries.aggregate(
        total=Count('id'),
        sent=Count('id', filter=Q(status='sent')),
        delivered=Count('id', filter=Q(status='delivered')),
        failed=Count('id', filter=Q(status='failed')),
        read=Count('id', filter=Q(status='read'))
    )
    
    # Calculate success rate
    total = delivery_stats['total']
    success_rate = 0
    if total > 0:
        successful = delivery_stats['sent'] + delivery_stats['delivered'] + delivery_stats['read']
        success_rate = round((successful / total) * 100, 2)
    
    # Create report
    report = f"""
    Daily Alert System Report - {timezone.now().strftime('%Y-%m-%d')}
    
    Alerts Created: {alerts_created}
    Alerts Activated: {alerts_activated}
    
    Delivery Statistics:
    - Total Deliveries: {total}
    - Sent: {delivery_stats['sent']}
    - Delivered: {delivery_stats['delivered']}
    - Failed: {delivery_stats['failed']}
    - Read: {delivery_stats['read']}
    - Success Rate: {success_rate}%
    """
    
    # Send to administrators
    admin_users = User.objects.filter(is_superuser=True, email__isnull=False)
    admin_emails = [user.email for user in admin_users if user.email]
    
    if admin_emails:
        send_mail(
            subject=f'Alert System Daily Report - {timezone.now().strftime("%Y-%m-%d")}',
            message=report,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=admin_emails,
            fail_silently=True
        )
        
        logger.info(f"Daily report sent to {len(admin_emails)} administrators")
    
    return f"Report generated and sent to {len(admin_emails)} administrators"


@shared_task
def update_delivery_status_from_webhooks():
    """Update delivery status based on webhook data (for future implementation)"""
    # This task would process webhook data from SMS/email providers
    # to update delivery status (delivered, bounced, etc.)
    pass


# Periodic task to monitor system health
@shared_task
def system_health_check():
    """Monitor system health and alert if issues detected"""
    from myapp.models import AlertDelivery
    
    # Check recent failure rate
    recent_deliveries = AlertDelivery.objects.filter(
        created_at__gte=timezone.now() - timedelta(hours=1)
    )
    
    total_recent = recent_deliveries.count()
    if total_recent > 0:
        failed_recent = recent_deliveries.filter(status='failed').count()
        failure_rate = (failed_recent / total_recent) * 100
        
        # Alert if failure rate is too high
        if failure_rate > 50:  # More than 50% failure rate
            logger.warning(f"High failure rate detected: {failure_rate}%")
            # TODO: Send alert to system administrators
    
    return f"Health check completed. Recent failure rate: {failure_rate if total_recent > 0 else 0}%"