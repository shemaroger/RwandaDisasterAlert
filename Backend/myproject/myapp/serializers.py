from django.contrib.auth import authenticate, get_user_model, password_validation
from django.utils import timezone
from rest_framework import serializers
from .models import *

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "preferred_language",
            "district",
            "role",
            "is_approved",
            "created_at",
            "last_seen",
        )
        read_only_fields = ("role", "is_approved", "created_at", "last_seen")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, style={"input_type": "password"})
    accepted_terms = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
            "phone",
            "preferred_language",
            "district",
            "accepted_terms",
        )

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value
    
    def validate_phone(self, value):
        """Validate Rwandan phone number format"""
        import re
        if value:
            # Rwanda phone numbers: +250XXXXXXXXX or 07XXXXXXXX format
            pattern = r'^(\+250|0)[7]\d{8}$'
            if not re.match(pattern, value):
                raise serializers.ValidationError(
                    "Phone number must be in format: +25078XXXXXXX or 078XXXXXXX"
                )
        return value

    def validate_district(self, value):
        """Validate district against Rwanda's 30 districts"""
        RWANDA_DISTRICTS = [
            'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi',
            'Gisagara', 'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro',
            'Kirehe', 'Muhanga', 'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu',
            'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge',
            'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
        ]
        if value and value not in RWANDA_DISTRICTS:
            raise serializers.ValidationError(f"Invalid district. Must be one of: {', '.join(RWANDA_DISTRICTS)}")
        return value

    def validate(self, attrs):
        # Password validation
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        password_validation.validate_password(attrs.get("password"))

        # Terms validation
        if not attrs.get("accepted_terms"):
            raise serializers.ValidationError({"accepted_terms": "You must accept the Terms & Conditions."})

        # Language validation
        if attrs.get("preferred_language") not in {"rw", "en", "fr"}:
            raise serializers.ValidationError({"preferred_language": "Use one of: rw, en, fr."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2", None)
        validated_data.pop("accepted_terms", None)
        password = validated_data.pop("password")

        # Create user with approval required for sensitive roles
        user = User.objects.create_user(
            role=User.Roles.CITIZEN,
            is_approved=True,  # Citizens auto-approved, others need manual approval
            **validated_data
        )
        user.terms_accepted_at = timezone.now()
        user.set_password(password)
        user.save(update_fields=["password", "terms_accepted_at"])
        
        # Send welcome email (implement separately)
        # self.send_welcome_email(user)
        
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        email = data.get("email", "").lower().strip()
        password = data.get("password")
        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not getattr(user, "is_approved", True):
            raise serializers.ValidationError("Account not approved yet.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        data["user"] = user
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("first_name", "last_name", "phone", "preferred_language", "district")


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password2 = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Old password is incorrect."})
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        password_validation.validate_password(attrs["new_password"], user)
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user

# ---------------------------
# Helpers / Validations
# ---------------------------

def validate_channels(channels: list[str]) -> list[str]:
    allowed = {c for c, _ in Channel.choices}
    if not isinstance(channels, list):
        raise serializers.ValidationError("channels must be a list, e.g., ['sms','push'].")
    unknown = [c for c in channels if c not in allowed]
    if unknown:
        raise serializers.ValidationError(f"Unknown channels: {unknown}. Allowed: {sorted(allowed)}")
    return channels


# ---------------------------
# Core Serializers
# ---------------------------

class GeoZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeoZone
        fields = "__all__"


class SubscriberSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Subscriber
        fields = (
            "id", "phone", "email", "preferred_language",
            "allow_sms", "allow_push", "allow_email",
            "last_known_lat", "last_known_lng",
            "user", "user_email", "created_at"
        )
        read_only_fields = ("user", "created_at")


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ("id", "subscriber", "platform", "push_token", "app_version", "is_active", "registered_at")
        read_only_fields = ("registered_at",)


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = "__all__"


class ProviderIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderIntegration
        fields = "__all__"


class AlertSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    approved_by_email = serializers.EmailField(source="approved_by.email", read_only=True)
    target_zones = serializers.PrimaryKeyRelatedField(queryset=GeoZone.objects.all(), many=True, required=False)

    class Meta:
        model = Alert
        fields = (
            "id", "ref", "type", "severity", "status",
            "title_rw", "message_rw", "title_en", "message_en", "title_fr", "message_fr",
            "target_zones", "channels",
            "send_immediately", "scheduled_at", "effective_at", "expires_at",
            "total_targeted", "total_delivered", "total_failed",
            "created_by", "created_by_email", "approved_by", "approved_by_email",
            "created_at", "sent_at",
        )
        read_only_fields = (
            "status", "total_targeted", "total_delivered", "total_failed",
            "created_by", "approved_by", "created_at", "sent_at",
        )

    def validate_channels(self, value):
        return validate_channels(value)

    def create(self, validated_data):
        zones = validated_data.pop("target_zones", [])
        alert = super().create(validated_data)
        if zones:
            alert.target_zones.set(zones)
        return alert

    def update(self, instance, validated_data):
        zones = validated_data.pop("target_zones", None)
        alert = super().update(instance, validated_data)
        if zones is not None:
            alert.target_zones.set(zones)
        return alert


class AlertDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertDelivery
        fields = ("id", "alert", "subscriber", "channel", "success", "status_code", "provider_msg_id", "error_message", "attempted_at")
        read_only_fields = fields


class IncidentSerializer(serializers.ModelSerializer):
    handled_by_email = serializers.EmailField(source="handled_by.email", read_only=True)
    subscriber_phone = serializers.CharField(source="subscriber.phone", read_only=True)

    class Meta:
        model = Incident
        fields = (
            "id", "subscriber", "subscriber_phone", "incident_type",
            "title", "description", "lat", "lng", "zone", "photo",
            "status", "handled_by", "handled_by_email",
            "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class SafeCheckinSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafeCheckin
        fields = ("id", "alert", "subscriber", "status", "note", "created_at")
        read_only_fields = ("created_at",)

    def validate_status(self, value):
        allowed = {c for c, _ in CheckinStatus.choices}
        if value not in allowed:
            raise serializers.ValidationError(f"Invalid status. Allowed: {sorted(allowed)}")
        return value


class ShelterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelter
        fields = "__all__"


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)

    class Meta:
        model = AuditLog  # type: ignore  # imported implicitly by .models
        fields = ("id", "actor", "actor_email", "action", "entity", "entity_id", "meta", "created_at")
        read_only_fields = fields

        