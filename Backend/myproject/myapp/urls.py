# myapp/urls.py (your app-specific urls)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import *
from . import views
from .views import *
from django.conf.urls.static import static
from django.conf import settings

# Create router and register viewsets
router = DefaultRouter()
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'disaster-types', DisasterTypeViewSet, basename='disastertype')
router.register(r'users', UserViewSet, basename='user')
router.register(r'alerts', AlertViewSet, basename='alert')
router.register(r'alert-deliveries', AlertDeliveryViewSet, basename='alertdelivery')
router.register(r'incidents', IncidentReportViewSet, basename='incidentreport')
router.register(r'emergency-contacts', EmergencyContactViewSet, basename='emergencycontact')
router.register(r'safety-guides', SafetyGuideViewSet, basename='safetyguide')
router.register(r'notification-templates', NotificationTemplateViewSet, basename='notificationtemplate')
router.register(r'chats', ChatViewSet, basename='chat')
router.register(r'messages', MessageViewSet, basename='message')
# router.register(r'safety-guide-attachments', SafetyGuideAttachmentViewSet, basename='safetyguideattachment')


urlpatterns = [
    # Authentication endpoints
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="api_logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/password-reset/", PasswordResetView.as_view(), name="password_reset"),
    path("auth/password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    
    # User profile and preferences
    path("profile/", UserProfileView.as_view(), name="user_profile"),
    path("profile/preferences/", NotificationPreferencesView.as_view(), name="notification_preferences"),
    path("profile/location/", UpdateLocationView.as_view(), name="update_location"),
    
    # Dashboard and statistics
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard_stats"),
    path("dashboard/recent-alerts/", RecentAlertsView.as_view(), name="recent_alerts"),
    path("dashboard/recent-incidents/", RecentIncidentsView.as_view(), name="recent_incidents"),
    
    # Alert-specific endpoints
    path("alerts/nearby/", NearbyAlertsView.as_view(), name="nearby_alerts"),
    path("alerts/my-responses/", MyAlertResponsesView.as_view(), name="my_alert_responses"),
    path("alerts/bulk-send/", BulkSendAlertView.as_view(), name="bulk_send_alert"),
    path("alerts/<uuid:alert_id>/delivery-status/", AlertDeliveryStatusView.as_view(), name="alert_delivery_status"),
    
    # Incident-specific endpoints
    path("incidents/my-reports/", MyIncidentReportsView.as_view(), name="my_incident_reports"),
    path("incidents/assigned-to-me/", AssignedIncidentsView.as_view(), name="assigned_incidents"),
    path("incidents/priority/", PriorityIncidentsView.as_view(), name="priority_incidents"),
    
    # Emergency and safety endpoints
    path("emergency-contacts/nearby/", NearbyEmergencyContactsView.as_view(), name="nearby_emergency_contacts"),
    path("safety-guides/by-disaster/", SafetyGuidesByDisasterView.as_view(), name="safety_guides_by_disaster"),
    
    # Location-specific endpoints
    path("locations/search/", LocationSearchView.as_view(), name="location_search"),
    path("locations/hierarchy/", LocationHierarchyView.as_view(), name="location_hierarchy"),
    
    # Notification and messaging
    path("notifications/send-test/", SendTestNotificationView.as_view(), name="send_test_notification"),
    path("notifications/delivery-reports/", NotificationDeliveryReportsView.as_view(), name="delivery_reports"),
    
    # System health and monitoring
    path("system/health/", SystemHealthView.as_view(), name="system_health"),
    path("system/metrics/", SystemMetricsView.as_view(), name="system_metrics"),
    
    # Webhook endpoints (for Twilio, etc.)
    path("webhooks/twilio/sms-status/", TwilioSMSStatusWebhookView.as_view(), name="twilio_sms_status"),
    path("webhooks/twilio/delivery-report/", TwilioDeliveryReportWebhookView.as_view(), name="twilio_delivery_report"),
    
    # File upload endpoints
    path("upload/incident-media/", IncidentMediaUploadView.as_view(), name="incident_media_upload"),
    path("upload/safety-guide-media/", SafetyGuideMediaUploadView.as_view(), name="safety_guide_media_upload"),
    
    # Public API endpoints (no authentication required)
    path("public/active-alerts/", PublicActiveAlertsView.as_view(), name="public_active_alerts"),
    path("public/emergency-contacts/", PublicEmergencyContactsView.as_view(), name="public_emergency_contacts"),
    path("public/safety-tips/", PublicSafetyTipsView.as_view(), name="public_safety_tips"),
    
    # Mobile app specific endpoints
    path("mobile/app-config/", MobileAppConfigView.as_view(), name="mobile_app_config"),
    path("mobile/force-update-check/", ForceUpdateCheckView.as_view(), name="force_update_check"),
    path('analytics/', analytics_dashboard, name='analytics'),
    
    # Include router URLs
    path("", include(router.urls)),
]
# Add static file serving for development and production
if settings.DEBUG:
    # Development: Serve media files directly
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Also serve any additional static files
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # Production: You should use a web server (nginx/apache) to serve static files
    # But for testing, you can still add this:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)