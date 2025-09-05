from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.conf import settings


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Roles.CITIZEN)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Roles.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user for RwandaDisasterAlert:
    - Email is the unique login field
    - Roles: admin, operator, citizen
    """
    class Roles(models.TextChoices):
        ADMIN = "admin", "Admin"
        OPERATOR = "operator", "Operator"
        CITIZEN = "citizen", "Citizen"

    username = None
    email = models.EmailField(unique=True, db_index=True)

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CITIZEN)
    phone = models.CharField(max_length=30, blank=True)

    # Signup/profile extras
    PREFERRED_LANG_CHOICES = (("rw", "Kinyarwanda"), ("en", "English"), ("fr", "French"))
    preferred_language = models.CharField(max_length=5, choices=PREFERRED_LANG_CHOICES, default="rw")
    district = models.CharField(max_length=80, blank=True)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)

    is_approved = models.BooleanField(default=True)

    # Auditing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    def mark_seen(self):
        self.last_seen = timezone.now()
        self.save(update_fields=["last_seen"])


# =============================================================================
# Enums
# =============================================================================

class AlertType(models.TextChoices):
    FLOOD = "flood", "Flood"
    EARTHQUAKE = "earthquake", "Earthquake"
    FIRE = "fire", "Fire"
    EPIDEMIC = "epidemic", "Epidemic"
    STORM = "storm", "Storm"
    OTHER = "other", "Other"


class Severity(models.TextChoices):
    INFO = "info", "Information"
    WATCH = "watch", "Watch"
    WARNING = "warning", "Warning"
    EMERGENCY = "emergency", "Emergency"


class AlertStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SCHEDULED = "scheduled", "Scheduled"
    SENDING = "sending", "Sending"
    SENT = "sent", "Sent"
    CANCELLED = "cancelled", "Cancelled"


class Channel(models.TextChoices):
    SMS = "sms", "SMS"
    PUSH = "push", "Mobile Push"
    EMAIL = "email", "Email"
    WEB = "web", "Web"


class IncidentType(models.TextChoices):
    REPORT = "report", "Incident Report"
    HELP = "help", "Help Request"


class CaseStatus(models.TextChoices):
    NEW = "new", "New"
    TRIAGED = "triaged", "Triaged"
    IN_PROGRESS = "in_progress", "In Progress"
    RESOLVED = "resolved", "Resolved"
    REJECTED = "rejected", "Rejected"


class CheckinStatus(models.TextChoices):
    SAFE = "safe", "I'm Safe"
    NEED_HELP = "need_help", "I Need Help"


# =============================================================================
# Geography
# =============================================================================

class GeoZone(models.Model):
    """
    Administrative area used for targeting & maps.
    Start with simple fields; upgrade to PostGIS later.
    """
    name = models.CharField(max_length=120)
    level = models.CharField(max_length=40, help_text="e.g., country, province, district, sector")
    code = models.CharField(max_length=40, unique=True, help_text="e.g., RW-KIGALI-GASABO")

    # Non-GIS MVP:
    bbox = models.CharField(max_length=255, blank=True, help_text="Optional: minx,miny,maxx,maxy")
    center_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    center_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # PostGIS alternative:
    # boundary = gis_models.MultiPolygonField(srid=4326, null=True, blank=True)
    # center = gis_models.PointField(srid=4326, null=True, blank=True)

    class Meta:
        unique_together = [("name", "level")]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["level"]),
        ]
        ordering = ["level", "name"]

    def __str__(self):
        return f"{self.name} ({self.level})"


# =============================================================================
# Subscribers & Devices (for citizens)
# =============================================================================

class Subscriber(models.Model):
    """
    Citizen contact surface. It can map 1:1 to an app account by email or be
    purely phone-based for SMS-only recipients (no login required).
    """
    phone = models.CharField(max_length=30, unique=True)
    email = models.EmailField(blank=True)
    preferred_language = models.CharField(
        max_length=5,
        choices=[("rw", "Kinyarwanda"), ("en", "English"), ("fr", "French")],
        default="rw",
    )
    allow_sms = models.BooleanField(default=True)
    allow_push = models.BooleanField(default=True)
    allow_email = models.BooleanField(default=False)

    # Last known location (non-GIS MVP)
    last_known_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_known_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Optional association to a logged-in user (citizen)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="subscriber"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["phone"])]
        ordering = ["-created_at"]

    def __str__(self):
        return self.phone


class Device(models.Model):
    """
    Mobile app device registration for push notifications.
    """
    ANDROID = "android"
    IOS = "ios"
    WEB = "web"

    subscriber = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name="devices")
    platform = models.CharField(max_length=10, choices=[(ANDROID, "Android"), (IOS, "iOS"), (WEB, "Web")])
    push_token = models.CharField(max_length=255, unique=True)
    app_version = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["platform"])]
        ordering = ["-registered_at"]

    def __str__(self):
        return f"{self.platform}:{self.push_token[:12]}..."


# =============================================================================
# Alerts & Delivery
# =============================================================================

class Alert(models.Model):
    """
    Core alert entity. Includes multilingual content, targeting, scheduling, and counters.
    """
    ref = models.CharField(max_length=36, unique=True, help_text="External reference/UUID")
    type = models.CharField(max_length=20, choices=AlertType.choices)
    severity = models.CharField(max_length=15, choices=Severity.choices, default=Severity.INFO)
    status = models.CharField(max_length=15, choices=AlertStatus.choices, default=AlertStatus.DRAFT)

    # Multilingual titles/messages
    title_rw = models.CharField(max_length=160)
    message_rw = models.TextField()
    title_en = models.CharField(max_length=160, blank=True)
    message_en = models.TextField(blank=True)
    title_fr = models.CharField(max_length=160, blank=True)
    message_fr = models.TextField(blank=True)

    # Targeting & channels
    target_zones = models.ManyToManyField(GeoZone, blank=True, related_name="alerts")
    channels = models.JSONField(default=list, help_text="List, e.g., ['sms','push','email','web']")

    # Timing
    send_immediately = models.BooleanField(default=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    effective_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Counters (for analytics)
    total_targeted = models.PositiveIntegerField(default=0)
    total_delivered = models.PositiveIntegerField(default=0)
    total_failed = models.PositiveIntegerField(default=0)

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_alerts"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_alerts"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["type", "severity"]),
            models.Index(fields=["effective_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_severity_display().upper()} - {self.title_rw[:48]}"


class AlertDelivery(models.Model):
    """
    Per-recipient, per-channel delivery log for retries and analytics.
    """
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name="deliveries")
    subscriber = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name="deliveries")
    channel = models.CharField(max_length=10, choices=Channel.choices)
    success = models.BooleanField(default=False)
    status_code = models.CharField(max_length=40, blank=True, help_text="Provider response code, e.g., 0, 200, 05, 91")
    provider_msg_id = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["alert", "channel"]),
            models.Index(fields=["subscriber", "channel"]),
            models.Index(fields=["success"]),
        ]
        ordering = ["-attempted_at"]


# =============================================================================
# Citizen Engagement
# =============================================================================

def upload_incident(instance, filename):
    return f"incidents/{instance.created_at.date()}/{filename}"


class Incident(models.Model):
    """
    Citizen incident/help submission managed by Admin/Operator.
    """
    subscriber = models.ForeignKey(Subscriber, on_delete=models.SET_NULL, null=True, related_name="incidents")
    incident_type = models.CharField(max_length=10, choices=IncidentType.choices, default=IncidentType.REPORT)
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)

    # Location (non-GIS MVP)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    zone = models.ForeignKey(GeoZone, null=True, blank=True, on_delete=models.SET_NULL, related_name="incidents")

    # Media
    photo = models.ImageField(upload_to=upload_incident, null=True, blank=True)

    status = models.CharField(max_length=20, choices=CaseStatus.choices, default=CaseStatus.NEW)
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="handled_incidents"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_incident_type_display()} - {self.title[:40]}"


class SafeCheckin(models.Model):
    """
    'I'm Safe' / 'Need Help' response tied to a specific alert.
    """
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name="checkins")
    subscriber = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name="checkins")
    status = models.CharField(max_length=15, choices=CheckinStatus.choices)
    note = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("alert", "subscriber")]
        indexes = [models.Index(fields=["status"]), models.Index(fields=["created_at"])]
        ordering = ["-created_at"]


# =============================================================================
# Resources (Shelters / Safe Areas)
# =============================================================================

class Shelter(models.Model):
    name = models.CharField(max_length=120)
    zone = models.ForeignKey(GeoZone, on_delete=models.PROTECT, related_name="shelters")
    address = models.CharField(max_length=200, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    capacity = models.PositiveIntegerField(default=0)
    occupancy = models.PositiveIntegerField(default=0)
    contact_phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [models.Index(fields=["is_active"]), models.Index(fields=["zone"])]
        ordering = ["name"]

    def __str__(self):
        return self.name


# =============================================================================
# Admin & Integrations
# =============================================================================

class ProviderIntegration(models.Model):
    """
    Stores credentials/config for SMS, Email, Push providers (per environment).
    """
    PROVIDER_CHOICES = (
        ("mno", "Telecom/MNO SMS Gateway"),
        ("twilio", "Twilio"),
        ("africas_talking", "Africa's Talking"),
        ("smtp", "SMTP Email"),
        ("fcm", "Firebase Cloud Messaging"),
        ("other", "Other"),
    )
    name = models.CharField(max_length=80)
    provider = models.CharField(max_length=30, choices=PROVIDER_CHOICES)
    is_active = models.BooleanField(default=True)
    config = models.JSONField(default=dict, blank=True)  # keys, sender IDs, callback URLs, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.provider})"


class MessageTemplate(models.Model):
    """
    Reusable templates for alerts (multilingual).
    """
    code = models.SlugField(max_length=50, unique=True)
    title_rw = models.CharField(max_length=160)
    message_rw = models.TextField()
    title_en = models.CharField(max_length=160, blank=True)
    message_en = models.TextField(blank=True)
    title_fr = models.CharField(max_length=160, blank=True)
    message_fr = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.code


class AuditLog(models.Model):
    """
    Immutable audit for sensitive actions (create/approve/send alerts, change roles, etc.)
    """
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="audit_logs")
    action = models.CharField(max_length=80)
    entity = models.CharField(max_length=80, help_text="Model name, e.g., Alert")
    entity_id = models.CharField(max_length=64)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["entity", "entity_id"]), models.Index(fields=["created_at"])]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} {self.entity}({self.entity_id})"
