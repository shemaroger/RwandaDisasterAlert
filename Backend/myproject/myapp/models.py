from django.db import models
from django.db.models import Q
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import RegexValidator, FileExtensionValidator
from django.conf import settings
import uuid
import os


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


# class SafetyGuide(models.Model):
#     """Safety guidelines and preparedness information"""
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     title = models.CharField(max_length=200)
#     title_rw = models.CharField(max_length=200, blank=True)
#     title_fr = models.CharField(max_length=200, blank=True)
    
#     content = models.TextField()
#     content_rw = models.TextField(blank=True)
#     content_fr = models.TextField(blank=True)
    
#     disaster_types = models.ManyToManyField(DisasterType, blank=True)
#     category = models.CharField(
#         max_length=20,
#         choices=[
#             ('before', 'Before Disaster'),
#             ('during', 'During Disaster'),
#             ('after', 'After Disaster'),
#             ('general', 'General Preparedness'),
#         ],
#         default='general'
#     )
    
#     # Media
#     featured_image = models.CharField(max_length=255, blank=True)  # Image URL/path
#     attachments = models.JSONField(blank=True, null=True)  # Additional media
    
#     # Targeting
#     target_audience = models.CharField(
#         max_length=20,
#         choices=[
#             ('general', 'General Public'),
#             ('families', 'Families with Children'),
#             ('elderly', 'Elderly'),
#             ('disabled', 'People with Disabilities'),
#             ('business', 'Businesses'),
#             ('schools', 'Schools'),
#         ],
#         default='general'
#     )
    
#     is_featured = models.BooleanField(default=False)
#     is_published = models.BooleanField(default=True)
#     display_order = models.IntegerField(default=0)
    
#     created_by = models.ForeignKey(User, on_delete=models.CASCADE)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         ordering = ['display_order', 'title']

#     def __str__(self):
#         return self.title
def safety_guide_image_upload_path(instance, filename):
    """Generate upload path for safety guide images"""
    import datetime
    now = datetime.datetime.now()
    return f'safety_guides/images/{now.year}/{now.month:02d}/{filename}'


def safety_guide_attachment_upload_path(instance, filename):
    """Generate upload path for safety guide attachments"""
    import datetime
    now = datetime.datetime.now()
    return f'safety_guides/attachments/{now.year}/{now.month:02d}/{instance.id}/{filename}'


class SafetyGuide(models.Model):
    """Safety guidelines and preparedness information with integrated attachments"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    title_rw = models.CharField(max_length=200, blank=True)
    title_fr = models.CharField(max_length=200, blank=True)
    
    content = models.TextField()
    content_rw = models.TextField(blank=True)
    content_fr = models.TextField(blank=True)
    
    disaster_types = models.ManyToManyField('DisasterType', blank=True)
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
    
    # Featured image
    featured_image = models.ImageField(
        upload_to=safety_guide_image_upload_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'webp'])],
        help_text="Featured image for the safety guide (JPG, PNG, GIF, WebP)"
    )
    
    # Multiple attachment files - supports up to 10 attachments
    attachment_1 = models.FileField(
        upload_to=safety_guide_attachment_upload_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=[
            'pdf', 'doc', 'docx', 'txt', 'rtf',  # Documents
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',  # Images
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',  # Videos
            'mp3', 'wav', 'ogg', 'aac',  # Audio
            'zip', 'rar', '7z', 'tar', 'gz'  # Archives
        ])],
        help_text="First attachment file"
    )
    attachment_1_name = models.CharField(max_length=255, blank=True, help_text="Display name for attachment 1")
    attachment_1_description = models.TextField(blank=True, help_text="Description for attachment 1")
    
    attachment_2 = models.FileField(
        upload_to=safety_guide_attachment_upload_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=[
            'pdf', 'doc', 'docx', 'txt', 'rtf',
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',
            'mp3', 'wav', 'ogg', 'aac',
            'zip', 'rar', '7z', 'tar', 'gz'
        ])]
    )
    attachment_2_name = models.CharField(max_length=255, blank=True)
    attachment_2_description = models.TextField(blank=True)
    
    attachment_3 = models.FileField(
        upload_to=safety_guide_attachment_upload_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=[
            'pdf', 'doc', 'docx', 'txt', 'rtf',
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',
            'mp3', 'wav', 'ogg', 'aac',
            'zip', 'rar', '7z', 'tar', 'gz'
        ])]
    )
    attachment_3_name = models.CharField(max_length=255, blank=True)
    attachment_3_description = models.TextField(blank=True)
    
    attachment_4 = models.FileField(
        upload_to=safety_guide_attachment_upload_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=[
            'pdf', 'doc', 'docx', 'txt', 'rtf',
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',
            'mp3', 'wav', 'ogg', 'aac',
            'zip', 'rar', '7z', 'tar', 'gz'
        ])]
    )
    attachment_4_name = models.CharField(max_length=255, blank=True)
    attachment_4_description = models.TextField(blank=True)
    
    attachment_5 = models.FileField(
        upload_to=safety_guide_attachment_upload_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=[
            'pdf', 'doc', 'docx', 'txt', 'rtf',
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',
            'mp3', 'wav', 'ogg', 'aac',
            'zip', 'rar', '7z', 'tar', 'gz'
        ])]
    )
    attachment_5_name = models.CharField(max_length=255, blank=True)
    attachment_5_description = models.TextField(blank=True)
    
    # Keep legacy JSONField for backward compatibility
    legacy_attachments = models.JSONField(
        blank=True,
        null=True,
        default=list,
        help_text="Legacy attachment data from previous version"
    )
    
    # Targeting and metadata
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
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_safety_guides')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_safety_guides')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'title']
        verbose_name = 'Safety Guide'
        verbose_name_plural = 'Safety Guides'
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """Auto-populate attachment names if not provided"""
        for i in range(1, 6):
            attachment_field = f'attachment_{i}'
            name_field = f'attachment_{i}_name'
            
            attachment = getattr(self, attachment_field)
            name = getattr(self, name_field)
            
            if attachment and not name:
                setattr(self, name_field, os.path.basename(attachment.name))
        
        super().save(*args, **kwargs)
    
    def get_featured_image_url(self):
        """Get the full URL for featured image"""
        if self.featured_image:
            return self.featured_image.url
        return None
    
    def get_all_attachments(self):
        """Get all attachments with metadata"""
        attachments = []
        
        # Get file-based attachments
        for i in range(1, 6):
            attachment_field = f'attachment_{i}'
            name_field = f'attachment_{i}_name'
            description_field = f'attachment_{i}_description'
            
            attachment = getattr(self, attachment_field)
            if attachment:
                name = getattr(self, name_field) or os.path.basename(attachment.name)
                description = getattr(self, description_field, '')
                
                # Get file info
                file_size = attachment.size if hasattr(attachment, 'size') else 0
                file_type = attachment.name.split('.')[-1].lower() if '.' in attachment.name else 'unknown'
                
                attachments.append({
                    'id': f'attachment_{i}',
                    'name': name,
                    'description': description,
                    'url': attachment.url,
                    'size': file_size,
                    'size_display': self._get_file_size_display(file_size),
                    'type': file_type,
                    'source': 'file'
                })
        
        # Get legacy JSON attachments
        if self.legacy_attachments:
            for idx, attachment in enumerate(self.legacy_attachments):
                if isinstance(attachment, dict):
                    attachment_copy = attachment.copy()
                    attachment_copy['id'] = f'legacy_{idx}'
                    attachment_copy['source'] = 'legacy'
                    
                    # Fix URL if needed
                    if 'url' in attachment_copy and attachment_copy['url']:
                        if not attachment_copy['url'].startswith(('http://', 'https://')):
                            if attachment_copy['url'].startswith('/'):
                                attachment_copy['url'] = attachment_copy['url'][1:]
                            attachment_copy['url'] = f"{settings.MEDIA_URL}{attachment_copy['url']}"
                    
                    attachments.append(attachment_copy)
        
        return attachments
    
    @property
    def attachment_count(self):
        """Get total number of attachments"""
        count = 0
        
        # Count file attachments
        for i in range(1, 6):
            if getattr(self, f'attachment_{i}'):
                count += 1
        
        # Count legacy attachments
        if self.legacy_attachments:
            count += len(self.legacy_attachments)
        
        return count
    
    def has_attachments(self):
        """Check if guide has any attachments"""
        return self.attachment_count > 0
    
    def get_attachment_by_id(self, attachment_id):
        """Get specific attachment by ID"""
        all_attachments = self.get_all_attachments()
        for attachment in all_attachments:
            if attachment.get('id') == attachment_id:
                return attachment
        return None
    
    @staticmethod
    def _get_file_size_display(file_size):
        """Get human-readable file size"""
        if not file_size:
            return "Unknown size"
        
        size = float(file_size)
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
    
    def get_attachment_fields(self):
        """Get list of attachment field names for forms/admin"""
        fields = []
        for i in range(1, 6):
            fields.extend([
                f'attachment_{i}',
                f'attachment_{i}_name',
                f'attachment_{i}_description'
            ])
        return fields


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

class ChatRoom(models.Model):
    """
    Represents a one-to-one chat room (conversation) between two users.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_user2')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Remove unique_together as it doesn't handle bidirectional properly
        # We'll handle uniqueness in the view logic instead
        pass
    
    def __str__(self):
        user1_name = self.user1.get_full_name() or self.user1.username or self.user1.email or f"User {self.user1.id}"
        user2_name = self.user2.get_full_name() or self.user2.username or self.user2.email or f"User {self.user2.id}"
        return f"Chat between {user1_name} and {user2_name}"
    
    def get_other_user(self, user):
        """Get the other user in this chat room."""
        return self.user2 if self.user1 == user else self.user1
    
    @classmethod
    def get_or_create_chat_room(cls, user1, user2):
        """
        Get existing chat room or create new one between two users.
        Handles bidirectional relationship properly.
        """
        if user1.id == user2.id:
            raise ValueError("Cannot create chat room with same user")
        
        # Ensure consistent ordering to avoid duplicates
        if user1.id > user2.id:
            user1, user2 = user2, user1
        
        # Try to find existing chat room (bidirectional)
        chat_room = cls.objects.filter(
            Q(user1=user1, user2=user2) | Q(user1=user2, user2=user1)
        ).first()
        
        if not chat_room:
            # Create new chat room with consistent ordering
            chat_room = cls.objects.create(user1=user1, user2=user2)
        
        return chat_room


class Message(models.Model):
    """
    Represents a single message within a ChatRoom.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender.get_full_name() or self.sender.username}: {self.content[:30]}"    