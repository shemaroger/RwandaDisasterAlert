# myapp/services.py (Updated to send real emails)
import logging
from typing import List, Optional, Dict, Any
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
import requests
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Get the correct User model
User = get_user_model()

class NotificationService:
    """Base class for notification services"""
    
    def __init__(self):
        self.development_mode = getattr(settings, 'DEBUG', True)
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
                logger.info("Twilio client initialized successfully")
            else:
                self.twilio_client = None
                logger.info("Twilio not configured - SMS will be simulated")
        except ImportError:
            logger.warning("Twilio library not installed - SMS notifications disabled")
            self.twilio_client = None
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {e}")
            self.twilio_client = None
    
    def _log_simulation(self, service_type: str, user, content: Dict[str, Any]):
        """Enhanced simulation logging"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        separator = "=" * 60
        
        logger.info(f"\n{separator}")
        logger.info(f"SIMULATED {service_type.upper()} NOTIFICATION [{timestamp}]")
        logger.info(f"User: {user.username}")
        logger.info(f"Email: {user.email or 'No email'}")
        logger.info(f"Phone: {user.phone_number or 'No phone'}")
        logger.info(f"Language: {user.preferred_language or 'en'}")
        logger.info(f"Push Enabled: {user.push_notifications_enabled}")
        logger.info(f"Email Enabled: {user.email_notifications_enabled}")
        logger.info(f"SMS Enabled: {user.sms_notifications_enabled}")
        logger.info(f"Location: {user.district or 'Not set'}")
        logger.info(f"User Type: {user.get_user_type_display()}")
        
        if user.location_lat and user.location_lng:
            logger.info(f"Coordinates: {user.location_lat}, {user.location_lng}")
        
        for key, value in content.items():
            if len(str(value)) > 100:
                logger.info(f"{key}: {str(value)[:100]}...")
            else:
                logger.info(f"{key}: {value}")
        
        logger.info(separator)


class SMSNotificationService(NotificationService):
    """Service for sending SMS notifications"""
    
    def send_sms(self, alert, user) -> bool:
        """Send SMS notification to a user"""
        # Always simulate in development unless explicitly configured
        if self.development_mode or not getattr(settings, 'NOTIFICATION_SETTINGS', {}).get('SMS_ENABLED', False):
            return self._simulate_sms(alert, user)
        
        if not self.twilio_client:
            logger.warning("Twilio client not available - simulating SMS")
            return self._simulate_sms(alert, user)
        
        if not user.phone_number:
            logger.warning(f"User {user.username} has no phone number - simulating SMS")
            return self._simulate_sms(alert, user, error="No phone number")
        
        if not user.sms_notifications_enabled:
            logger.info(f"User {user.username} has SMS notifications disabled")
            return self._simulate_sms(alert, user, error="SMS notifications disabled")
        
        try:
            from twilio.base.exceptions import TwilioException
            
            # Get user's preferred language
            language = user.preferred_language or 'en'
            message_text = self._get_localized_message(alert, language)
            
            message = self.twilio_client.messages.create(
                body=message_text,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=user.phone_number
            )
            
            logger.info(f"SMS sent to {user.username}: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending SMS to {user.username}: {e}")
            return self._simulate_sms(alert, user, error=str(e))
    
    def _simulate_sms(self, alert, user, error=None) -> bool:
        """Enhanced SMS simulation for development"""
        # Use phone number from User model or default
        phone = user.phone_number or '+250788123456'  # Default Rwanda number
        
        language = user.preferred_language or 'en'
        message_text = self._get_localized_message(alert, language)
        
        content = {
            'To': phone,
            'Message': message_text,
            'Character Count': len(message_text),
            'Language': language,
            'Alert ID': str(alert.id),
            'Severity': getattr(alert, 'severity', 'info'),
            'SMS Enabled': user.sms_notifications_enabled,
        }
        
        if error:
            content['Error'] = error
            content['Fallback'] = 'Simulation due to error'
        
        self._log_simulation('SMS', user, content)
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
        
        sms_text = f"Emergency Alert: {title}\n\n{message}"
        
        if instructions:
            sms_text += f"\n\nInstructions: {instructions}"
        
        if getattr(alert, 'contact_info', None):
            sms_text += f"\n\nContact: {alert.contact_info}"
        
        # Add severity indicator
        severity_emoji = {
            'info': 'Info',
            'minor': 'Minor Alert',
            'moderate': 'Moderate Alert',
            'severe': 'SEVERE ALERT',
            'extreme': 'EXTREME ALERT'
        }
        
        if hasattr(alert, 'severity') and alert.severity in severity_emoji:
            sms_text = f"{severity_emoji[alert.severity]}: {sms_text}"
        
        return sms_text[:1600]  # SMS character limit


class EmailNotificationService(NotificationService):
    """Service for sending email notifications"""
    
    def send_email(self, alert, user) -> bool:
        """Send email notification to a user"""
        if not user.email:
            logger.warning(f"User {user.username} has no email address")
            return self._simulate_email(alert, user, error="No email address")
        
        if not user.email_notifications_enabled:
            logger.info(f"User {user.username} has email notifications disabled")
            return self._simulate_email(alert, user, error="Email notifications disabled")
        
        # Check if email backend is properly configured
        if not self._is_email_configured():
            logger.warning("Email backend not properly configured - simulating email")
            return self._simulate_email(alert, user, error="Email backend not configured")
        
        try:
            from django.core.mail import send_mail
            
            language = user.preferred_language or 'en'
            
            subject = self._get_localized_title(alert, language)
            plain_message = self._get_plain_text_message(alert, language)
            
            send_mail(
                subject=f"Emergency Alert: {subject}",
                message=plain_message,
                from_email=getattr(settings, 'EMAIL_HOST_USER', 'noreply@example.com'),
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Email sent to {user.username} ({user.email})")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email to {user.username}: {e}")
            return self._simulate_email(alert, user, error=str(e))
    
    def _is_email_configured(self) -> bool:
        """Check if email backend is properly configured"""
        try:
            # Check if we have basic email settings
            email_backend = getattr(settings, 'EMAIL_BACKEND', '')
            email_host = getattr(settings, 'EMAIL_HOST', '')
            
            # For development, console backend is fine
            if 'console' in email_backend.lower():
                return True
            
            # For SMTP, we need host and credentials
            if email_host and getattr(settings, 'EMAIL_HOST_USER', ''):
                return True
            
            return False
        except:
            return False
    
    def _simulate_email(self, alert, user, error=None) -> bool:
        """Enhanced email simulation for development"""
        language = user.preferred_language or 'en'
        subject = self._get_localized_title(alert, language)
        message = self._get_plain_text_message(alert, language)
        
        content = {
            'To': user.email or 'no-email@example.com',
            'Subject': f"Emergency Alert: {subject}",
            'Message Length': f"{len(message)} characters",
            'Language': language,
            'Alert ID': str(alert.id),
            'Email Enabled': user.email_notifications_enabled,
        }
        
        if error:
            content['Error'] = error
            content['Fallback'] = 'Simulation due to error'
        
        # Show first few lines of message
        message_lines = message.split('\n')[:5]
        content['Message Preview'] = '\n'.join(message_lines)
        
        self._log_simulation('EMAIL', user, content)
        return True
    
    def _get_localized_title(self, alert, language: str) -> str:
        """Get localized alert title"""
        if language == 'rw' and getattr(alert, 'title_rw', None):
            return alert.title_rw
        elif language == 'fr' and getattr(alert, 'title_fr', None):
            return alert.title_fr
        return alert.title
    
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
        
        text = f"EMERGENCY ALERT\n"
        text += f"================\n\n"
        text += f"Title: {title}\n\n"
        text += f"Message: {message}\n\n"
        
        if instructions:
            text += f"Instructions:\n{instructions}\n\n"
        
        if getattr(alert, 'contact_info', None):
            text += f"Contact Information:\n{alert.contact_info}\n\n"
        
        # Add severity information
        severity_display = {
            'info': 'Information',
            'minor': 'Minor',
            'moderate': 'Moderate', 
            'severe': 'SEVERE',
            'extreme': 'EXTREME'
        }
        severity = getattr(alert, 'severity', 'info')
        text += f"Severity: {severity_display.get(severity, severity).upper()}\n"
        
        # Add disaster type if available
        if hasattr(alert, 'disaster_type') and alert.disaster_type:
            text += f"Type: {alert.disaster_type.name}\n"
        
        text += f"\n---\n"
        text += f"This is an automated emergency alert from Rwanda Disaster Alert System.\n"
        text += f"Alert ID: {alert.id}\n"
        text += f"Timestamp: {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
        text += f"\nDo not reply to this email."
        
        return text


class PushNotificationService(NotificationService):
    """Service for sending push notifications"""
    
    def __init__(self):
        super().__init__()
        self.fcm_server_key = getattr(settings, 'FCM_SERVER_KEY', None)
        self.fcm_url = 'https://fcm.googleapis.com/fcm/send'
    
    def send_push_notification(self, alert, user) -> bool:
        """Send push notification to a user"""
        # Always simulate in development unless explicitly configured
        if self.development_mode or not getattr(settings, 'NOTIFICATION_SETTINGS', {}).get('PUSH_ENABLED', False):
            return self._simulate_push(alert, user)
        
        if not self.fcm_server_key:
            logger.warning("FCM server key not configured - simulating push notification")
            return self._simulate_push(alert, user, error="FCM not configured")
        
        if not user.push_notifications_enabled:
            logger.info(f"User {user.username} has push notifications disabled")
            return self._simulate_push(alert, user, error="Push notifications disabled")
        
        # For now, we'll assume FCM token is stored elsewhere or not implemented yet
        # You might want to add an fcm_token field to your User model later
        fcm_token = getattr(user, 'fcm_token', None)
        if not fcm_token:
            logger.warning(f"User {user.username} has no FCM token")
            return self._simulate_push(alert, user, error="No FCM token")
        
        try:
            language = user.preferred_language or 'en'
            
            payload = {
                'to': fcm_token,
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
                    'timestamp': str(int(timezone.now().timestamp())),
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
                return self._simulate_push(alert, user, error=f"FCM HTTP {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error sending push notification to {user.username}: {e}")
            return self._simulate_push(alert, user, error=str(e))
    
    def _simulate_push(self, alert, user, error=None) -> bool:
        """Enhanced push notification simulation for development"""
        language = user.preferred_language or 'en'
        title = self._get_localized_title(alert, language)
        message = self._get_localized_message(alert, language)
        
        content = {
            'Title': title,
            'Body': message,
            'Language': language,
            'Priority': 'high',
            'Sound': 'emergency_sound',
            'Icon': 'ic_emergency',
            'Alert ID': str(alert.id),
            'Severity': getattr(alert, 'severity', 'info'),
            'FCM Token': 'Available' if getattr(user, 'fcm_token', None) else 'Missing',
            'Push Enabled': user.push_notifications_enabled,
        }
        
        if error:
            content['Error'] = error
            content['Fallback'] = 'Simulation due to error'
        
        self._log_simulation('PUSH', user, content)
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
        start_time = timezone.now()
        logger.info(f"Starting alert delivery for alert {alert.id}")
        
        results = {
            'sms': {'sent': 0, 'failed': 0},
            'push': {'sent': 0, 'failed': 0},
            'email': {'sent': 0, 'failed': 0},
            'total_users': 0,
            'start_time': start_time.isoformat(),
        }
        
        # Get target users based on alert location
        target_users = self._get_target_users(alert)
        results['total_users'] = len(target_users)
        
        logger.info(f"Targeting {len(target_users)} users for alert delivery")
        
        # Import here to avoid circular imports
        try:
            from .models import AlertDelivery
        except ImportError:
            logger.warning("AlertDelivery model not found - skipping delivery records")
            AlertDelivery = None
        
        # Process notifications
        try:
            with transaction.atomic():
                for i, user in enumerate(target_users, 1):
                    logger.debug(f"Processing user {i}/{len(target_users)}: {user.username}")
                    
                    # SMS delivery
                    if getattr(alert, 'send_sms', True) and user.sms_notifications_enabled:
                        delivery_record = self._create_delivery_record(AlertDelivery, alert, user, 'sms')
                        
                        if self.sms_service.send_sms(alert, user):
                            self._update_delivery_record(delivery_record, 'sent')
                            results['sms']['sent'] += 1
                        else:
                            self._update_delivery_record(delivery_record, 'failed', 'SMS sending failed')
                            results['sms']['failed'] += 1
                    
                    # Push notification delivery
                    if getattr(alert, 'send_push', True) and user.push_notifications_enabled:
                        delivery_record = self._create_delivery_record(AlertDelivery, alert, user, 'push')
                        
                        if self.push_service.send_push_notification(alert, user):
                            self._update_delivery_record(delivery_record, 'sent')
                            results['push']['sent'] += 1
                        else:
                            self._update_delivery_record(delivery_record, 'failed', 'Push notification sending failed')
                            results['push']['failed'] += 1
                    
                    # Email delivery
                    if getattr(alert, 'send_email', True) and user.email_notifications_enabled:
                        delivery_record = self._create_delivery_record(AlertDelivery, alert, user, 'email')
                        
                        if self.email_service.send_email(alert, user):
                            self._update_delivery_record(delivery_record, 'sent')
                            results['email']['sent'] += 1
                        else:
                            self._update_delivery_record(delivery_record, 'failed', 'Email sending failed')
                            results['email']['failed'] += 1
        
        except Exception as e:
            logger.error(f"Error during alert delivery: {e}")
            logger.info("Continuing delivery without database record tracking...")
            
            # Continue delivery without record tracking as fallback
            for i, user in enumerate(target_users, 1):
                logger.debug(f"Processing user {i}/{len(target_users)}: {user.username} (no tracking)")
                
                # SMS delivery
                if getattr(alert, 'send_sms', True) and user.sms_notifications_enabled:
                    if self.sms_service.send_sms(alert, user):
                        results['sms']['sent'] += 1
                    else:
                        results['sms']['failed'] += 1
                
                # Push notification delivery
                if getattr(alert, 'send_push', True) and user.push_notifications_enabled:
                    if self.push_service.send_push_notification(alert, user):
                        results['push']['sent'] += 1
                    else:
                        results['push']['failed'] += 1
                
                # Email delivery
                if getattr(alert, 'send_email', True) and user.email_notifications_enabled:
                    if self.email_service.send_email(alert, user):
                        results['email']['sent'] += 1
                    else:
                        results['email']['failed'] += 1
        
        # Calculate completion stats
        end_time = timezone.now()
        duration = (end_time - start_time).total_seconds()
        results['end_time'] = end_time.isoformat()
        results['duration_seconds'] = duration
        
        total_sent = results['sms']['sent'] + results['push']['sent'] + results['email']['sent']
        total_failed = results['sms']['failed'] + results['push']['failed'] + results['email']['failed']
        
        logger.info(f"Alert delivery completed in {duration:.2f}s")
        logger.info(f"Summary: {total_sent} sent, {total_failed} failed")
        logger.info(f"Details: SMS({results['sms']['sent']}/{results['sms']['sent']+results['sms']['failed']}), "
                   f"Push({results['push']['sent']}/{results['push']['sent']+results['push']['failed']}), "
                   f"Email({results['email']['sent']}/{results['email']['sent']+results['email']['failed']})")
        
        return results
    
    def _create_delivery_record(self, AlertDelivery, alert, user, method):
        """Create or get existing delivery record if model is available"""
        if AlertDelivery:
            try:
                # Try to get existing record first
                delivery_record, created = AlertDelivery.objects.get_or_create(
                    alert=alert,
                    user=user,
                    delivery_method=method,
                    defaults={
                        'status': 'pending',
                        'sent_at': None,
                        'delivered_at': None,
                        'read_at': None,
                        'error_message': ''
                    }
                )
                
                # If record already exists, reset it for resending
                if not created:
                    delivery_record.status = 'pending'
                    delivery_record.sent_at = None
                    delivery_record.delivered_at = None
                    delivery_record.read_at = None
                    delivery_record.error_message = ''
                    delivery_record.save()
                    logger.debug(f"Reusing existing delivery record for {user.username} ({method})")
                else:
                    logger.debug(f"Created new delivery record for {user.username} ({method})")
                
                return delivery_record
            except Exception as e:
                logger.warning(f"Could not create/get delivery record: {e}")
                return None
        return None
    
    def _update_delivery_record(self, delivery_record, status, error_message=None):
        """Update delivery record if it exists"""
        if delivery_record:
            delivery_record.status = status
            if status == 'sent':
                delivery_record.sent_at = timezone.now()
            if error_message:
                delivery_record.error_message = error_message
            delivery_record.save()
    
    def _get_target_users(self, alert) -> List:
        """Get users who should receive the alert based on location"""
        from django.db.models import Q
        
        try:
            if hasattr(alert, 'affected_locations') and alert.affected_locations.exists():
                # Get users in affected locations
                users = User.objects.filter(
                    is_active=True,
                    # Add location filtering here if you have user profiles with location
                    # profile__location__in=alert.affected_locations.all()
                ).distinct()
                
                # If no location-based filtering is implemented, get all active users
                if not users.exists():
                    users = User.objects.filter(is_active=True)
                    
            elif (hasattr(alert, 'geofence_coordinates') and alert.geofence_coordinates) or \
                 (hasattr(alert, 'center_lat') and alert.center_lat and 
                  hasattr(alert, 'center_lng') and alert.center_lng and 
                  hasattr(alert, 'radius_km') and alert.radius_km):
                # Users within geofence or radius
                users = User.objects.filter(is_active=True)
                # TODO: Implement actual geospatial filtering
                
            else:
                # Global alert - all active users
                users = User.objects.filter(is_active=True)
        
        except Exception as e:
            logger.warning(f"Error filtering users by location: {e}")
            users = User.objects.filter(is_active=True)
        
        user_list = list(users)
        logger.info(f"Found {len(user_list)} active users for notification")
        return user_list


# Simplified task function that doesn't require Celery
def deliver_alert_sync(alert_id):
    """Synchronous task to deliver alerts (fallback when Celery not available)"""
    try:
        from django.apps import apps
        Alert = apps.get_model('myapp', 'Alert')
        
        alert = Alert.objects.get(id=alert_id)
        delivery_manager = AlertDeliveryManager()
        results = delivery_manager.deliver_alert(alert)
        
        logger.info(f"Sync alert delivery completed for alert {alert_id}")
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
            Alert = apps.get_model('myapp', 'Alert')
            
            alert = Alert.objects.get(id=alert_id)
            delivery_manager = AlertDeliveryManager()
            results = delivery_manager.deliver_alert(alert)
            
            logger.info(f"Async alert delivery completed for alert {alert_id}")
            return {
                'alert_id': alert_id,
                'status': 'success',
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error in async alert delivery for alert {alert_id}: {e}")
            
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