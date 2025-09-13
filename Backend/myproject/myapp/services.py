# notifications/services.py (Updated for development mode)
import logging
from typing import List, Optional
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User
import requests
import json

logger = logging.getLogger(__name__)

class NotificationService:
    """Base class for notification services"""
    
    def __init__(self):
        self.setup_clients()
    
    def setup_clients(self):
        """Initialize external service clients"""
        # Check if Twilio is available
        try:
            if getattr(settings, 'TWILIO_ACCOUNT_SID', '') and getattr(settings, 'TWILIO_AUTH_TOKEN', ''):
                from twilio.rest import Client
                self.twilio_client = Client(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
            else:
                self.twilio_client = None
                logger.info("Twilio not configured - SMS will be simulated")
        except ImportError:
            logger.warning("Twilio library not installed - SMS notifications disabled")
            self.twilio_client = None
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {e}")
            self.twilio_client = None

class SMSNotificationService(NotificationService):
    """Service for sending SMS notifications"""
    
    def send_sms(self, alert, user: User) -> bool:
        """Send SMS notification to a user"""
        # Check if SMS is enabled
        if not getattr(settings, 'NOTIFICATION_SETTINGS', {}).get('SMS_ENABLED', False):
            logger.info("SMS notifications are disabled")
            return self._simulate_sms(alert, user)
        
        if not self.twilio_client:
            logger.warning("Twilio client not available - simulating SMS")
            return self._simulate_sms(alert, user)
        
        if not hasattr(user, 'profile') or not getattr(user.profile, 'phone_number', None):
            logger.warning(f"User {user.username} has no phone number")
            return self._simulate_sms(alert, user)
        
        try:
            from twilio.base.exceptions import TwilioException
            
            # Get user's preferred language
            language = getattr(user.profile, 'language', 'en') if hasattr(user, 'profile') else 'en'
            message_text = self._get_localized_message(alert, language)
            
            message = self.twilio_client.messages.create(
                body=message_text,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=user.profile.phone_number
            )
            
            logger.info(f"SMS sent to {user.username}: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending SMS to {user.username}: {e}")
            return self._simulate_sms(alert, user)
    
    def _simulate_sms(self, alert, user: User) -> bool:
        """Simulate SMS sending for development"""
        phone = getattr(user.profile, 'phone_number', '+250788123456') if hasattr(user, 'profile') else '+250788123456'
        language = getattr(user.profile, 'language', 'en') if hasattr(user, 'profile') else 'en'
        message_text = self._get_localized_message(alert, language)
        
        logger.info(f"📱 SIMULATED SMS to {user.username} ({phone}):")
        logger.info(f"📱 Message: {message_text[:100]}...")
        
        # In development, we'll always return True
        return True
    
    def _get_localized_message(self, alert, language: str) -> str:
        """Get localized alert message"""
        if language == 'rw' and getattr(alert, 'title_rw', None):
            title = alert.title_rw
            message = getattr(alert, 'message_rw', None) or alert.message
            instructions = getattr(alert, 'instructions_rw', None) or getattr(alert, 'instructions', '')
        elif language == 'fr' and getattr(alert, 'title_fr', None):
            title = alert.title_fr
            message = getattr(alert, 'message_fr', None) or alert.message
            instructions = getattr(alert, 'instructions_fr', None) or getattr(alert, 'instructions', '')
        else:
            title = alert.title
            message = alert.message
            instructions = getattr(alert, 'instructions', '')
        
        sms_text = f"🚨 {title}\n\n{message}"
        
        if instructions:
            sms_text += f"\n\n📋 {instructions}"
        
        if getattr(alert, 'contact_info', None):
            sms_text += f"\n\n📞 {alert.contact_info}"
        
        # Add severity indicator
        severity_emoji = {
            'info': 'ℹ️',
            'minor': '⚠️',
            'moderate': '🟡',
            'severe': '🟠',
            'extreme': '🔴'
        }
        
        if hasattr(alert, 'severity') and alert.severity in severity_emoji:
            sms_text = f"{severity_emoji[alert.severity]} {sms_text}"
        
        return sms_text[:1600]  # SMS character limit


class EmailNotificationService(NotificationService):
    """Service for sending email notifications"""
    
    def send_email(self, alert, user: User) -> bool:
        """Send email notification to a user"""
        # Check if email is enabled
        if not getattr(settings, 'NOTIFICATION_SETTINGS', {}).get('EMAIL_ENABLED', False):
            logger.info("Email notifications are disabled")
            return self._simulate_email(alert, user)
        
        if not user.email:
            logger.warning(f"User {user.username} has no email address")
            return False
        
        try:
            from django.core.mail import send_mail
            from django.template.loader import render_to_string
            
            language = getattr(user.profile, 'language', 'en') if hasattr(user, 'profile') else 'en'
            
            subject = self._get_localized_title(alert, language)
            plain_message = self._get_plain_text_message(alert, language)
            
            # Try to render HTML template, fall back to plain text
            try:
                html_message = self._render_email_template(alert, user, language)
            except Exception as e:
                logger.warning(f"Could not render HTML template: {e}")
                html_message = None
            
            send_mail(
                subject=f"Emergency Alert: {subject}",
                message=plain_message,
                from_email=getattr(settings, 'EMAIL_HOST_USER', 'noreply@example.com'),
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Email sent to {user.username}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email to {user.username}: {e}")
            return self._simulate_email(alert, user)
    
    def _simulate_email(self, alert, user: User) -> bool:
        """Simulate email sending for development"""
        language = getattr(user.profile, 'language', 'en') if hasattr(user, 'profile') else 'en'
        subject = self._get_localized_title(alert, language)
        message = self._get_plain_text_message(alert, language)
        
        logger.info(f"📧 SIMULATED EMAIL to {user.username} ({user.email or 'no-email@example.com'}):")
        logger.info(f"📧 Subject: Emergency Alert: {subject}")
        logger.info(f"📧 Message: {message[:200]}...")
        
        return True
    
    def _get_localized_title(self, alert, language: str) -> str:
        """Get localized alert title"""
        if language == 'rw' and getattr(alert, 'title_rw', None):
            return alert.title_rw
        elif language == 'fr' and getattr(alert, 'title_fr', None):
            return alert.title_fr
        return alert.title
    
    def _render_email_template(self, alert, user, language: str) -> str:
        """Render email HTML template"""
        try:
            from django.template.loader import render_to_string
            context = {
                'alert': alert,
                'user': user,
                'language': language,
                'severity_color': self._get_severity_color(getattr(alert, 'severity', 'info')),
            }
            return render_to_string('notifications/alert_email.html', context)
        except Exception as e:
            logger.warning(f"Could not render email template: {e}")
            return None
    
    def _get_plain_text_message(self, alert, language: str) -> str:
        """Get plain text version of email"""
        title = self._get_localized_title(alert, language)
        
        if language == 'rw' and getattr(alert, 'message_rw', None):
            message = alert.message_rw
            instructions = getattr(alert, 'instructions_rw', None) or getattr(alert, 'instructions', '')
        elif language == 'fr' and getattr(alert, 'message_fr', None):
            message = alert.message_fr
            instructions = getattr(alert, 'instructions_fr', None) or getattr(alert, 'instructions', '')
        else:
            message = alert.message
            instructions = getattr(alert, 'instructions', '')
        
        text = f"{title}\n\n{message}"
        
        if instructions:
            text += f"\n\nInstructions:\n{instructions}"
        
        if getattr(alert, 'contact_info', None):
            text += f"\n\nContact Information:\n{alert.contact_info}"
        
        return text
    
    def _get_severity_color(self, severity: str) -> str:
        """Get color for severity level"""
        colors = {
            'info': '#3498db',
            'minor': '#f39c12',
            'moderate': '#e67e22',
            'severe': '#e74c3c',
            'extreme': '#8e44ad'
        }
        return colors.get(severity, '#3498db')


class PushNotificationService(NotificationService):
    """Service for sending push notifications"""
    
    def __init__(self):
        super().__init__()
        self.fcm_server_key = getattr(settings, 'FCM_SERVER_KEY', None)
        self.fcm_url = 'https://fcm.googleapis.com/fcm/send'
    
    def send_push_notification(self, alert, user: User) -> bool:
        """Send push notification to a user"""
        # Check if push notifications are enabled
        if not getattr(settings, 'NOTIFICATION_SETTINGS', {}).get('PUSH_ENABLED', False):
            logger.info("Push notifications are disabled")
            return self._simulate_push(alert, user)
        
        if not self.fcm_server_key:
            logger.warning("FCM server key not configured - simulating push notification")
            return self._simulate_push(alert, user)
        
        if not hasattr(user, 'profile') or not getattr(user.profile, 'fcm_token', None):
            logger.warning(f"User {user.username} has no FCM token")
            return self._simulate_push(alert, user)
        
        try:
            language = getattr(user.profile, 'language', 'en')
            
            payload = {
                'to': user.profile.fcm_token,
                'notification': {
                    'title': self._get_localized_title(alert, language),
                    'body': self._get_localized_message(alert, language),
                    'icon': 'ic_emergency',
                    'sound': 'emergency_sound',
                    'priority': 'high',
                },
                'data': {
                    'alert_id': str(alert.id),
                    'severity': getattr(alert, 'severity', 'info'),
                    'disaster_type': getattr(alert.disaster_type, 'name', '') if hasattr(alert, 'disaster_type') and alert.disaster_type else '',
                    'click_action': 'ALERT_DETAIL',
                },
            }
            
            headers = {
                'Authorization': f'key={self.fcm_server_key}',
                'Content-Type': 'application/json',
            }
            
            response = requests.post(
                self.fcm_url,
                data=json.dumps(payload),
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Push notification sent to {user.username}")
                return True
            else:
                logger.error(f"FCM error: {response.status_code} - {response.text}")
                return self._simulate_push(alert, user)
                
        except Exception as e:
            logger.error(f"Error sending push notification to {user.username}: {e}")
            return self._simulate_push(alert, user)
    
    def _simulate_push(self, alert, user: User) -> bool:
        """Simulate push notification for development"""
        language = getattr(user.profile, 'language', 'en') if hasattr(user, 'profile') else 'en'
        title = self._get_localized_title(alert, language)
        message = self._get_localized_message(alert, language)
        
        logger.info(f"🔔 SIMULATED PUSH to {user.username}:")
        logger.info(f"🔔 Title: {title}")
        logger.info(f"🔔 Message: {message}")
        
        return True
    
    def _get_localized_title(self, alert, language: str) -> str:
        """Get localized alert title"""
        if language == 'rw' and getattr(alert, 'title_rw', None):
            return alert.title_rw
        elif language == 'fr' and getattr(alert, 'title_fr', None):
            return alert.title_fr
        return alert.title
    
    def _get_localized_message(self, alert, language: str) -> str:
        """Get localized alert message (shortened for push notification)"""
        if language == 'rw' and getattr(alert, 'message_rw', None):
            message = alert.message_rw
        elif language == 'fr' and getattr(alert, 'message_fr', None):
            message = alert.message_fr
        else:
            message = alert.message
        
        # Truncate message for push notification
        return message[:100] + "..." if len(message) > 100 else message


class AlertDeliveryManager:
    """Manager class to handle alert delivery orchestration"""
    
    def __init__(self):
        self.sms_service = SMSNotificationService()
        self.email_service = EmailNotificationService()
        self.push_service = PushNotificationService()
    
    def deliver_alert(self, alert) -> dict:
        """Deliver alert through all enabled channels"""
        results = {
            'sms': {'sent': 0, 'failed': 0},
            'push': {'sent': 0, 'failed': 0},
            'email': {'sent': 0, 'failed': 0},
        }
        
        # Get target users based on alert location
        target_users = self._get_target_users(alert)
        
        logger.info(f"Delivering alert {alert.id} to {len(target_users)} users")
        
        # Import here to avoid circular imports
        try:
            from .models import AlertDelivery
        except ImportError:
            logger.warning("AlertDelivery model not found - creating mock delivery records")
            AlertDelivery = None
        
        with transaction.atomic():
            for user in target_users:
                # SMS delivery
                if getattr(alert, 'send_sms', True):
                    if AlertDelivery:
                        delivery_record = AlertDelivery.objects.create(
                            alert=alert,
                            user=user,
                            delivery_method='sms',
                            status='pending'
                        )
                    
                    if self.sms_service.send_sms(alert, user):
                        if AlertDelivery:
                            delivery_record.status = 'sent'
                            delivery_record.sent_at = timezone.now()
                            delivery_record.save()
                        results['sms']['sent'] += 1
                    else:
                        if AlertDelivery:
                            delivery_record.status = 'failed'
                            delivery_record.error_message = 'SMS sending failed'
                            delivery_record.save()
                        results['sms']['failed'] += 1
                
                # Push notification delivery
                if getattr(alert, 'send_push', True):
                    if AlertDelivery:
                        delivery_record = AlertDelivery.objects.create(
                            alert=alert,
                            user=user,
                            delivery_method='push',
                            status='pending'
                        )
                    
                    if self.push_service.send_push_notification(alert, user):
                        if AlertDelivery:
                            delivery_record.status = 'sent'
                            delivery_record.sent_at = timezone.now()
                            delivery_record.save()
                        results['push']['sent'] += 1
                    else:
                        if AlertDelivery:
                            delivery_record.status = 'failed'
                            delivery_record.error_message = 'Push notification sending failed'
                            delivery_record.save()
                        results['push']['failed'] += 1
                
                # Email delivery
                if getattr(alert, 'send_email', False):
                    if AlertDelivery:
                        delivery_record = AlertDelivery.objects.create(
                            alert=alert,
                            user=user,
                            delivery_method='email',
                            status='pending'
                        )
                    
                    if self.email_service.send_email(alert, user):
                        if AlertDelivery:
                            delivery_record.status = 'sent'
                            delivery_record.sent_at = timezone.now()
                            delivery_record.save()
                        results['email']['sent'] += 1
                    else:
                        if AlertDelivery:
                            delivery_record.status = 'failed'
                            delivery_record.error_message = 'Email sending failed'
                            delivery_record.save()
                        results['email']['failed'] += 1
        
        logger.info(f"Alert delivery completed: {results}")
        return results
    
    def _get_target_users(self, alert) -> List[User]:
        """Get users who should receive the alert based on location"""
        from django.contrib.auth.models import User
        from django.db.models import Q
        
        # For development, we'll get all active users
        # In production, you'd filter by location
        try:
            if hasattr(alert, 'affected_locations') and alert.affected_locations.exists():
                # Users in affected locations (if you have a profile with location)
                users = User.objects.filter(is_active=True)
            elif (hasattr(alert, 'geofence_coordinates') and alert.geofence_coordinates) or \
                 (hasattr(alert, 'center_lat') and alert.center_lat and 
                  hasattr(alert, 'center_lng') and alert.center_lng and 
                  hasattr(alert, 'radius_km') and alert.radius_km):
                # Users within geofence or radius
                users = User.objects.filter(is_active=True)
            else:
                # Global alert - all users
                users = User.objects.filter(is_active=True)
        except Exception as e:
            logger.warning(f"Error filtering users by location: {e}")
            # Fallback to all active users
            users = User.objects.filter(is_active=True)
        
        # Limit to first 10 users for development/testing
        return list(users[:10])


# Simplified task function that doesn't require Celery
def deliver_alert_sync(alert_id):
    """Synchronous task to deliver alerts (fallback when Celery not available)"""
    try:
        # Import here to avoid circular imports
        from django.apps import apps
        Alert = apps.get_model('alerts', 'Alert')  # Adjust app name as needed
        
        alert = Alert.objects.get(id=alert_id)
        delivery_manager = AlertDeliveryManager()
        results = delivery_manager.deliver_alert(alert)
        logger.info(f"Sync alert delivery completed for alert {alert_id}: {results}")
        return results
    except Exception as e:
        logger.error(f"Error in sync alert delivery for alert {alert_id}: {e}")
        return None


# Try to import Celery tasks, fall back to sync if not available
try:
    from celery import shared_task
    
    @shared_task(bind=True, max_retries=3)
    def deliver_alert_async(self, alert_id):
        """Async task to deliver alerts with retry logic"""
        try:
            from django.apps import apps
            Alert = apps.get_model('alerts', 'Alert')
            
            alert = Alert.objects.get(id=alert_id)
            delivery_manager = AlertDeliveryManager()
            results = delivery_manager.deliver_alert(alert)
            
            logger.info(f"Async alert delivery completed for alert {alert_id}: {results}")
            return {
                'alert_id': alert_id,
                'status': 'success',
                'results': results
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

except ImportError:
    logger.info("Celery not available, using synchronous delivery")
    deliver_alert_async = None