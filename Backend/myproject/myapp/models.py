from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import RegexValidator
import uuid


class User(AbstractUser):
    """Extended user model for citizens and administrators"""
    USER_TYPES = [
        ('citizen', 'Citizen'),
        ('admin', 'Administrator'),
        ('operator', 'Operator'),
        ('authority', 'Authority'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='citizen')
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$')],
        blank=True,
        null=True
    )
    preferred_language = models.CharField(
        max_length=10,
        choices=[('en', 'English'), ('rw', 'Kinyarwanda'), ('fr', 'French')],
        default='rw'
    )
    location_lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    location_lng = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)  # Changed to CharField
    push_notifications_enabled = models.BooleanField(default=True)
    sms_notifications_enabled = models.BooleanField(default=True)
    email_notifications_enabled = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


class Location(models.Model):
    """Administrative locations (Districts, Sectors, Cells)"""
    LOCATION_TYPES = [
        ('country', 'Country'),
        ('province', 'Province'),
        ('district', 'District'),
        ('sector', 'Sector'),
        ('cell', 'Cell'),
        ('village', 'Village'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    name_rw = models.CharField(max_length=100, blank=True)  # Kinyarwanda name
    name_fr = models.CharField(max_length=100, blank=True)  # French name
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPES)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True)
    boundary_coordinates = models.JSONField(blank=True, null=True)  # GeoJSON polygon
    center_lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    center_lng = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    population = models.IntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['name', 'location_type', 'parent']
        ordering = ['location_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_location_type_display()})"


class DisasterType(models.Model):
    """Types of disasters (floods, earthquakes, fires, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    name_rw = models.CharField(max_length=50, blank=True)
    name_fr = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    description_rw = models.TextField(blank=True)
    description_fr = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # Icon class or URL
    color_code = models.CharField(max_length=7, default='#FF0000')  # Hex color
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Alert(models.Model):
    """Main alert/disaster notification model"""
    SEVERITY_LEVELS = [
        ('info', 'Information'),
        ('minor', 'Minor'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
        ('extreme', 'Extreme'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    title_rw = models.CharField(max_length=200, blank=True)
    title_fr = models.CharField(max_length=200, blank=True)
    
    message = models.TextField()
    message_rw = models.TextField(blank=True)
    message_fr = models.TextField(blank=True)
    
    disaster_type = models.ForeignKey(DisasterType, on_delete=models.CASCADE)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    
    # Geographic targeting
    affected_locations = models.ManyToManyField(Location, blank=True)
    geofence_coordinates = models.JSONField(blank=True, null=True)  # Custom polygon
    radius_km = models.FloatField(blank=True, null=True)  # For circular alerts
    center_lat = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    center_lng = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    # Timing
    issued_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    # Alert management
    issued_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issued_alerts')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='approved_alerts')
    
    # Delivery channels
    send_sms = models.BooleanField(default=True)
    send_push = models.BooleanField(default=True)
    send_email = models.BooleanField(default=False)
    publish_web = models.BooleanField(default=True)
    
    # Additional information
    instructions = models.TextField(blank=True)
    instructions_rw = models.TextField(blank=True)
    instructions_fr = models.TextField(blank=True)
    
    contact_info = models.TextField(blank=True)
    resources_urls = models.JSONField(blank=True, null=True)  # Links to resources
    
    # Metrics
    estimated_affected_population = models.IntegerField(blank=True, null=True)
    priority_score = models.IntegerField(default=5)  # 1-10 scale
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.get_severity_display()}"


class AlertDelivery(models.Model):
    """Track delivery status of alerts to users"""
    DELIVERY_METHODS = [
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
        ('email', 'Email'),
        ('web', 'Web'),
    ]
    
    DELIVERY_STATUS = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('read', 'Read'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name='deliveries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alert_deliveries')
    delivery_method = models.CharField(max_length=10, choices=DELIVERY_METHODS)
    status = models.CharField(max_length=10, choices=DELIVERY_STATUS, default='pending')
    sent_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    read_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['alert', 'user', 'delivery_method']

    def __str__(self):
        return f"{self.alert.title} -> {self.user.username} ({self.delivery_method})"


class IncidentReport(models.Model):
    """Citizen-generated incident reports"""
    REPORT_TYPES = [
        ('emergency', 'Emergency'),
        ('hazard', 'Hazard'),
        ('infrastructure', 'Infrastructure Damage'),
        ('health', 'Health Emergency'),
        ('security', 'Security Incident'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('verified', 'Verified'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incident_reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    disaster_type = models.ForeignKey(DisasterType, on_delete=models.SET_NULL, blank=True, null=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Location
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    address = models.TextField(blank=True)
    
    # Status and handling
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='submitted')
    priority = models.IntegerField(default=3)  # 1-5 scale
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='assigned_incidents')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='verified_incidents')
    
    # Media attachments
    images = models.JSONField(blank=True, null=True)  # Store image URLs/paths
    videos = models.JSONField(blank=True, null=True)  # Store video URLs/paths
    
    # Additional details
    casualties = models.IntegerField(blank=True, null=True)
    property_damage = models.TextField(blank=True)
    immediate_needs = models.TextField(blank=True)
    
    # Follow-up
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolution_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


class EmergencyContact(models.Model):
    """Emergency contact information"""
    CONTACT_TYPES = [
        ('police', 'Police'),
        ('fire', 'Fire Department'),
        ('medical', 'Medical/Hospital'),
        ('disaster_management', 'Disaster Management'),
        ('utility', 'Utility Company'),
        ('government', 'Government Office'),
        ('ngo', 'NGO/Relief Organization'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    name_rw = models.CharField(max_length=100, blank=True)
    name_fr = models.CharField(max_length=100, blank=True)
    
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPES)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    
    # Location coverage
    locations = models.ManyToManyField(Location, blank=True)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    # Service details
    services_offered = models.TextField(blank=True)
    availability = models.CharField(max_length=100, default="24/7")
    languages_supported = models.CharField(max_length=50, default="rw,en,fr")
    
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_contact_type_display()})"


class SafetyGuide(models.Model):
    """Safety guidelines and preparedness information"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    title_rw = models.CharField(max_length=200, blank=True)
    title_fr = models.CharField(max_length=200, blank=True)
    
    content = models.TextField()
    content_rw = models.TextField(blank=True)
    content_fr = models.TextField(blank=True)
    
    disaster_types = models.ManyToManyField(DisasterType, blank=True)
    category = models.CharField(
        max_length=20,
        choices=[
            ('before', 'Before Disaster'),
            ('during', 'During Disaster'),
            ('after', 'After Disaster'),
            ('general', 'General Preparedness'),
        ],
        default='general'
    )
    
    # Media
    featured_image = models.CharField(max_length=255, blank=True)  # Image URL/path
    attachments = models.JSONField(blank=True, null=True)  # Additional media
    
    # Targeting
    target_audience = models.CharField(
        max_length=20,
        choices=[
            ('general', 'General Public'),
            ('families', 'Families with Children'),
            ('elderly', 'Elderly'),
            ('disabled', 'People with Disabilities'),
            ('business', 'Businesses'),
            ('schools', 'Schools'),
        ],
        default='general'
    )
    
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'title']

    def __str__(self):
        return self.title


class AlertResponse(models.Model):
    """User responses to alerts (acknowledgment, feedback, etc.)"""
    RESPONSE_TYPES = [
        ('acknowledged', 'Acknowledged'),
        ('safe', 'I am safe'),
        ('need_help', 'Need help'),
        ('evacuated', 'Evacuated'),
        ('feedback', 'Feedback'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name='responses')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alert_responses')
    response_type = models.CharField(max_length=15, choices=RESPONSE_TYPES)
    message = models.TextField(blank=True)
    
    # Location when response was made
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['alert', 'user', 'response_type']

    def __str__(self):
        return f"{self.user.username} -> {self.alert.title}: {self.get_response_type_display()}"


class NotificationTemplate(models.Model):
    """Templates for different types of notifications"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    disaster_type = models.ForeignKey(DisasterType, on_delete=models.CASCADE, blank=True, null=True)
    severity = models.CharField(max_length=10, choices=Alert.SEVERITY_LEVELS, blank=True)
    
    # Templates for different languages
    title_template = models.CharField(max_length=200)
    title_template_rw = models.CharField(max_length=200, blank=True)
    title_template_fr = models.CharField(max_length=200, blank=True)
    
    message_template = models.TextField()
    message_template_rw = models.TextField(blank=True)
    message_template_fr = models.TextField(blank=True)
    
    sms_template = models.TextField(blank=True)  # Shorter version for SMS
    sms_template_rw = models.TextField(blank=True)
    sms_template_fr = models.TextField(blank=True)
    
    # Template variables documentation
    available_variables = models.JSONField(
        blank=True, 
        null=True,
        help_text="List of available template variables"
    )
    
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name