from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import *
from .permissions import *
from .models import *
from .serializers import *

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()  # creates a CITIZEN
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        token, _ = Token.objects.get_or_create(user=user)
        # Optional UX: update last_seen
        try:
            user.mark_seen()
        except Exception:
            pass

        return Response({"token": token.key, "user": UserSerializer(user).data}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


# If you add an AuditLog.create helper, you can call it here.
def audit(actor, action, entity, entity_id, meta=None):
    from .models import AuditLog  # local import to avoid cycles
    AuditLog.objects.create(actor=actor, action=action, entity=entity, entity_id=str(entity_id), meta=meta or {})

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Delete the user's token
            request.user.auth_token.delete()
            return Response({'message': 'Successfully logged out'}, status=200)
        except Token.DoesNotExist:
            return Response({'message': 'Token not found'}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
# ---------------------------
# Core ViewSets
# ---------------------------
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrOperator]  # Fixed permission
    filterset_fields = ['role', 'is_active', 'is_approved', 'district']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    
    def get_queryset(self):
        # Operators can only see citizens, admins see all
        if self.request.user.role == User.Roles.OPERATOR:
            return self.queryset.filter(role=User.Roles.CITIZEN)
        return self.queryset
    
class GeoZoneViewSet(viewsets.ModelViewSet):
    queryset = GeoZone.objects.all()
    serializer_class = GeoZoneSerializer
    permission_classes = [IsAuthenticated & IsAdmin]  # only admins manage zones
    filterset_fields = ["level", "code"]
    search_fields = ["name", "code"]


class SubscriberViewSet(viewsets.ModelViewSet):
    queryset = Subscriber.objects.all().select_related("user")
    serializer_class = SubscriberSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Citizens can create/update their own subscriber record (if linked), admins/operators can manage all.
        if self.action in {"list", "destroy"}:
            return [IsAdminOrOperator()]
        return super().get_permissions()

    def perform_create(self, serializer):
        # If the requester is a citizen and has no subscriber yet, link it.
        user = self.request.user
        instance = serializer.save()
        if getattr(user, "role", None) == "citizen" and user.subscriber is None:
            instance.user = user
            instance.save(update_fields=["user"])

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) in {"admin", "operator"}:
            return super().get_queryset()
        # citizen -> only own subscriber (if any)
        return Subscriber.objects.filter(user=user)


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all().select_related("subscriber")
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) in {"admin", "operator"}:
            return super().get_queryset()
        # citizen -> devices under their subscriber
        if hasattr(user, "subscriber") and user.subscriber:
            return Device.objects.filter(subscriber=user.subscriber)
        return Device.objects.none()


class MessageTemplateViewSet(viewsets.ModelViewSet):
    queryset = MessageTemplate.objects.all()
    serializer_class = MessageTemplateSerializer
    permission_classes = [IsAuthenticated & IsAdmin]
    search_fields = ["code", "title_rw", "title_en", "title_fr"]


class ProviderIntegrationViewSet(viewsets.ModelViewSet):
    queryset = ProviderIntegration.objects.all()
    serializer_class = ProviderIntegrationSerializer
    permission_classes = [IsAuthenticated & IsAdmin]


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().prefetch_related("target_zones")
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated & IsAdminOrOperator]
    filterset_fields = ["status", "type", "severity"]
    search_fields = ["title_rw", "title_en", "title_fr", "ref"]

    def perform_create(self, serializer):
        alert = serializer.save(created_by=self.request.user)
        audit(self.request.user, "create", "Alert", alert.id, {"ref": alert.ref})

    def perform_update(self, serializer):
        alert = serializer.save()
        audit(self.request.user, "update", "Alert", alert.id, {"status": alert.status})

    # ---- custom actions ----

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated & IsAdmin])
    def approve(self, request, pk=None):
        alert = self.get_object()
        alert.approved_by = request.user
        alert.status = AlertStatus.SCHEDULED if alert.scheduled_at else AlertStatus.SENT if alert.send_immediately else AlertStatus.SCHEDULED
        # if send_immediately and approved, we will send in send_now endpoint for explicitness
        alert.save(update_fields=["approved_by", "status"])
        audit(request.user, "approve", "Alert", alert.id)
        return Response({"detail": "Alert approved.", "status": alert.status})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated & IsAdmin])
    def send_now(self, request, pk=None):
        """
        Trigger immediate delivery (Celery task recommended).
        """
        alert = self.get_object()
        if alert.status in {AlertStatus.SENT, AlertStatus.CANCELLED}:
            return Response({"detail": f"Cannot send alert in status {alert.status}."}, status=400)

        # Mark as sending; an async task should fan-out and update counters/deliveries.
        alert.status = AlertStatus.SENDING
        alert.sent_at = timezone.now()
        alert.save(update_fields=["status", "sent_at"])
        audit(request.user, "send_now", "Alert", alert.id)

        # TODO: enqueue Celery job here, e.g.:
        # from .tasks import send_alert_task
        # send_alert_task.delay(alert_id=alert.id)

        return Response({"detail": "Alert dispatch started."}, status=202)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated & IsAdmin])
    def cancel(self, request, pk=None):
        alert = self.get_object()
        if alert.status in {AlertStatus.SENT, AlertStatus.CANCELLED}:
            return Response({"detail": f"Cannot cancel alert in status {alert.status}."}, status=400)
        alert.status = AlertStatus.CANCELLED
        alert.save(update_fields=["status"])
        audit(request.user, "cancel", "Alert", alert.id)
        return Response({"detail": "Alert cancelled."}, status=200)


class AlertDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AlertDelivery.objects.all().select_related("alert", "subscriber")
    serializer_class = AlertDeliverySerializer
    permission_classes = [IsAuthenticated & IsAdminOrOperator]
    filterset_fields = ["alert", "subscriber", "channel", "success"]
    search_fields = ["status_code", "provider_msg_id"]


class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all().select_related("subscriber", "handled_by", "zone")
    serializer_class = IncidentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) in {"admin", "operator"}:
            return super().get_queryset()
        # citizen: only incidents they created (via their subscriber)
        if hasattr(user, "subscriber") and user.subscriber:
            return Incident.objects.filter(subscriber=user.subscriber)
        return Incident.objects.none()

    def perform_create(self, serializer):
        # If citizen has a subscriber, bind automatically
        user = self.request.user
        subscriber = getattr(user, "subscriber", None)
        instance = serializer.save(subscriber=subscriber if subscriber else serializer.validated_data.get("subscriber"))
        audit(user, "create", "Incident", instance.id, {"status": instance.status})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated & IsAdminOrOperator])
    def triage(self, request, pk=None):
        incident = self.get_object()
        if incident.status not in {CaseStatus.NEW, CaseStatus.TRIAGED, CaseStatus.IN_PROGRESS}:
            return Response({"detail": f"Cannot triage incident in status {incident.status}."}, status=400)
        incident.status = CaseStatus.TRIAGED
        incident.handled_by = request.user
        incident.save(update_fields=["status", "handled_by"])
        audit(request.user, "triage", "Incident", incident.id)
        return Response({"detail": "Incident triaged."})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated & IsAdminOrOperator])
    def resolve(self, request, pk=None):
        incident = self.get_object()
        incident.status = CaseStatus.RESOLVED
        incident.handled_by = request.user
        incident.save(update_fields=["status", "handled_by"])
        audit(request.user, "resolve", "Incident", incident.id)
        return Response({"detail": "Incident resolved."})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated & IsAdminOrOperator])
    def reject(self, request, pk=None):
        incident = self.get_object()
        incident.status = CaseStatus.REJECTED
        incident.handled_by = request.user
        incident.save(update_fields=["status", "handled_by"])
        audit(request.user, "reject", "Incident", incident.id)
        return Response({"detail": "Incident rejected."})


class SafeCheckinViewSet(viewsets.ModelViewSet):
    queryset = SafeCheckin.objects.all().select_related("alert", "subscriber")
    serializer_class = SafeCheckinSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) in {"admin", "operator"}:
            return super().get_queryset()
        if hasattr(user, "subscriber") and user.subscriber:
            return SafeCheckin.objects.filter(subscriber=user.subscriber)
        return SafeCheckin.objects.none()

    def perform_create(self, serializer):
        # citizen shortcut: bind to their subscriber
        user = self.request.user
        subscriber = getattr(user, "subscriber", None)
        instance = serializer.save(subscriber=subscriber if subscriber else serializer.validated_data["subscriber"])
        audit(user, "create", "SafeCheckin", instance.id)


class ShelterViewSet(viewsets.ModelViewSet):
    queryset = Shelter.objects.all().select_related("zone")
    serializer_class = ShelterSerializer
    permission_classes = [IsAuthenticated & IsAdminOrOperator]
    filterset_fields = ["zone", "is_active"]
    search_fields = ["name", "address"]


# Read-only audit endpoint (admins only)
from .models import AuditLog  # noqa: E402


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related("actor")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated & IsAdmin]
    filterset_fields = ["entity", "actor"]
    search_fields = ["action", "entity", "entity_id"]