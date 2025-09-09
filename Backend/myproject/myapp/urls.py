from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r"zones", GeoZoneViewSet, basename="zone")
router.register(r"subscribers", SubscriberViewSet, basename="subscriber")
router.register(r"devices", DeviceViewSet, basename="device")
router.register(r"alerts", AlertViewSet, basename="alert")
router.register(r"deliveries", AlertDeliveryViewSet, basename="delivery")
router.register(r"incidents", IncidentViewSet, basename="incident")
router.register(r"checkins", SafeCheckinViewSet, basename="checkin")
router.register(r"shelters", ShelterViewSet, basename="shelter")
router.register(r"providers", ProviderIntegrationViewSet, basename="provider")
router.register(r"templates", MessageTemplateViewSet, basename="template")
router.register(r"audit", AuditLogViewSet, basename="audit")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/",    LoginView.as_view(),    name="login"),
    path("auth/logout/",   LogoutView.as_view(),   name="api_logout"),
    path("auth/me/",       MeView.as_view(),       name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("", include(router.urls)),
]  
