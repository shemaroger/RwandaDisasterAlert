# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
import re
from .models import *
User = get_user_model()


class LocationSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Location
        fields = [
            'id', 'name', 'name_rw', 'name_fr', 'location_type', 'parent', 
            'parent_name', 'boundary_coordinates', 'center_lat', 'center_lng',
            'population', 'is_active', 'children', 'created_at'
        ]
    
    def get_children(self, obj):
        if hasattr(obj, 'location_set'):
            children = obj.location_set.filter(is_active=True)
            return LocationSerializer(children, many=True, context=self.context).data
        return []


HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")

class DisasterTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisasterType
        fields = [
            'id', 'name', 'name_rw', 'name_fr',
            'description', 'description_rw', 'description_fr',
            'icon', 'color_code', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_color_code(self, value):
        if value and not HEX_RE.match(value):
            raise serializers.ValidationError("Color must be a hex like #FF0000 or #F00.")
        return value

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name is required.")
        return value.strip()


class UserSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'user_type', 'phone_number', 'preferred_language', 'location_lat',
            'location_lng', 'district', 'district_name', 'push_notifications_enabled',
            'sms_notifications_enabled', 'email_notifications_enabled', 
            'is_verified', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name',
            'last_name', 'phone_number', 'preferred_language', 'district'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AlertDeliverySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AlertDelivery
        fields = [
            'id', 'alert', 'user', 'user_name', 'delivery_method', 'status',
            'sent_at', 'delivered_at', 'read_at', 'error_message', 'created_at'
        ]


class AlertResponseSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AlertResponse
        fields = [
            'id', 'alert', 'user', 'user_name', 'response_type', 'message',
            'latitude', 'longitude', 'created_at'
        ]


class AlertSerializer(serializers.ModelSerializer):
    disaster_type_name = serializers.CharField(source='disaster_type.name', read_only=True)
    issued_by_name = serializers.CharField(source='issued_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    affected_locations_data = LocationSerializer(source='affected_locations', many=True, read_only=True)
    deliveries = AlertDeliverySerializer(many=True, read_only=True)
    responses = AlertResponseSerializer(many=True, read_only=True)
    delivery_stats = serializers.SerializerMethodField()
    response_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = Alert
        fields = [
            'id', 'title', 'title_rw', 'title_fr', 'message', 'message_rw',
            'message_fr', 'disaster_type', 'disaster_type_name', 'severity', 
            'status', 'affected_locations', 'affected_locations_data',
            'geofence_coordinates', 'radius_km', 'center_lat', 'center_lng',
            'issued_at', 'expires_at', 'issued_by', 'issued_by_name',
            'approved_by', 'approved_by_name', 'send_sms', 'send_push',
            'send_email', 'publish_web', 'instructions', 'instructions_rw',
            'instructions_fr', 'contact_info', 'resources_urls',
            'estimated_affected_population', 'priority_score', 'deliveries',
            'responses', 'delivery_stats', 'response_stats', 'created_at',
            'updated_at'
        ]
    
    def get_delivery_stats(self, obj):
        deliveries = obj.deliveries.all()
        total = deliveries.count()
        if total == 0:
            return {}
        
        stats = {
            'total': total,
            'sent': deliveries.filter(status='sent').count(),
            'delivered': deliveries.filter(status='delivered').count(),
            'failed': deliveries.filter(status='failed').count(),
            'read': deliveries.filter(status='read').count(),
        }
        stats['delivery_rate'] = round((stats['delivered'] / total) * 100, 2) if total > 0 else 0
        return stats
    
    def get_response_stats(self, obj):
        responses = obj.responses.all()
        total = responses.count()
        if total == 0:
            return {}
        
        return {
            'total': total,
            'acknowledged': responses.filter(response_type='acknowledged').count(),
            'safe': responses.filter(response_type='safe').count(),
            'need_help': responses.filter(response_type='need_help').count(),
            'evacuated': responses.filter(response_type='evacuated').count(),
            'feedback': responses.filter(response_type='feedback').count(),
        }


class AlertCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating alerts"""
    class Meta:
        model = Alert
        fields = [
            'title', 'title_rw', 'title_fr', 'message', 'message_rw',
            'message_fr', 'disaster_type', 'severity', 'affected_locations',
            'geofence_coordinates', 'radius_km', 'center_lat', 'center_lng',
            'expires_at', 'send_sms', 'send_push', 'send_email', 'publish_web',
            'instructions', 'instructions_rw', 'instructions_fr', 'contact_info',
            'resources_urls', 'estimated_affected_population', 'priority_score'
        ]
    
    def create(self, validated_data):
        validated_data['issued_by'] = self.context['request'].user
        return super().create(validated_data)


class IncidentReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    disaster_type_name = serializers.CharField(source='disaster_type.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.username', read_only=True)
    
    class Meta:
        model = IncidentReport
        fields = [
            'id', 'reporter', 'reporter_name', 'report_type', 'disaster_type',
            'disaster_type_name', 'title', 'description', 'location',
            'location_name', 'latitude', 'longitude', 'address', 'status',
            'priority', 'assigned_to', 'assigned_to_name', 'verified_by',
            'verified_by_name', 'images', 'videos', 'casualties',
            'property_damage', 'immediate_needs', 'resolved_at',
            'resolution_notes', 'created_at', 'updated_at'
        ]


class IncidentReportCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for citizens to create incident reports"""
    
    class Meta:
        model = IncidentReport
        fields = [
            'report_type', 'disaster_type', 'title', 'description', 'location',
            'latitude', 'longitude', 'address', 'casualties',
            'property_damage', 'immediate_needs'
        ]
    
    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        
        # Handle file uploads from FormData
        request = self.context['request']
        images = []
        videos = []
        
        # Process uploaded files
        for key, file in request.FILES.items():
            if key.startswith('images['):
                # Save image file and store URL/path
                # You'll need to implement your file storage logic
                file_url = self.save_uploaded_file(file, 'images')
                images.append(file_url)
            elif key.startswith('videos['):
                # Save video file and store URL/path
                file_url = self.save_uploaded_file(file, 'videos')
                videos.append(file_url)
        
        # Store file URLs in JSONField
        if images:
            validated_data['images'] = images
        if videos:
            validated_data['videos'] = videos
            
        return super().create(validated_data)
    
    def save_uploaded_file(self, file, file_type):
        """
        Save uploaded file and return URL/path
        Implement based on your storage backend (local, S3, etc.)
        """
        # Example for local storage:
        import os
        from django.conf import settings
        from django.core.files.storage import default_storage
        
        # Create filename with timestamp to avoid conflicts
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{file_type}/{timestamp}_{file.name}"
        
        # Save file
        path = default_storage.save(filename, file)
        
        # Return URL that can be accessed by frontend
        return default_storage.url(path)

class EmergencyContactSerializer(serializers.ModelSerializer):
    locations_data = LocationSerializer(source='locations', many=True, read_only=True)
    
    class Meta:
        model = EmergencyContact
        fields = [
            'id', 'name', 'name_rw', 'name_fr', 'contact_type', 'phone_number',
            'email', 'website', 'locations', 'locations_data', 'address',
            'latitude', 'longitude', 'services_offered', 'availability',
            'languages_supported', 'is_active', 'display_order', 'created_at',
            'updated_at'
        ]


class SafetyGuideSerializer(serializers.ModelSerializer):
    disaster_types_data = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    all_attachments = serializers.SerializerMethodField()
    attachment_count = serializers.ReadOnlyField()
    
    # Individual attachment URLs for direct access
    attachment_1_url = serializers.SerializerMethodField()
    attachment_2_url = serializers.SerializerMethodField()
    attachment_3_url = serializers.SerializerMethodField()
    attachment_4_url = serializers.SerializerMethodField()
    attachment_5_url = serializers.SerializerMethodField()
    
    # Individual attachment file size displays
    attachment_1_size_display = serializers.SerializerMethodField()
    attachment_2_size_display = serializers.SerializerMethodField()
    attachment_3_size_display = serializers.SerializerMethodField()
    attachment_4_size_display = serializers.SerializerMethodField()
    attachment_5_size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SafetyGuide
        fields = [
            'id', 'title', 'title_rw', 'title_fr', 'content', 'content_rw',
            'content_fr', 'disaster_types', 'disaster_types_data', 'category',
            'featured_image', 'featured_image_url', 
            # Attachment fields
            'attachment_1', 'attachment_1_name', 'attachment_1_description', 'attachment_1_url', 'attachment_1_size_display',
            'attachment_2', 'attachment_2_name', 'attachment_2_description', 'attachment_2_url', 'attachment_2_size_display',
            'attachment_3', 'attachment_3_name', 'attachment_3_description', 'attachment_3_url', 'attachment_3_size_display',
            'attachment_4', 'attachment_4_name', 'attachment_4_description', 'attachment_4_url', 'attachment_4_size_display',
            'attachment_5', 'attachment_5_name', 'attachment_5_description', 'attachment_5_url', 'attachment_5_size_display',
            'legacy_attachments', 'all_attachments', 'attachment_count', 
            'target_audience', 'is_featured', 'is_published', 'display_order', 
            'created_by', 'created_by_name', 'updated_by', 'updated_by_name', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_disaster_types_data(self, obj):
        # Assuming you have a DisasterTypeSerializer
        from .serializers import DisasterTypeSerializer
        return DisasterTypeSerializer(obj.disaster_types.all(), many=True).data
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None
    
    def get_all_attachments(self, obj):
        """Get all attachments with proper URLs"""
        attachments = obj.get_all_attachments()
        request = self.context.get('request')
        
        # Convert relative URLs to absolute URLs
        if request:
            for attachment in attachments:
                if attachment.get('url') and not attachment['url'].startswith(('http://', 'https://')):
                    attachment['url'] = request.build_absolute_uri(attachment['url'])
        
        return attachments
    
    def _get_attachment_url(self, obj, attachment_number):
        """Helper method to get attachment URL"""
        attachment = getattr(obj, f'attachment_{attachment_number}')
        if attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(attachment.url)
            return attachment.url
        return None
    
    def _get_attachment_size_display(self, obj, attachment_number):
        """Helper method to get attachment file size display"""
        attachment = getattr(obj, f'attachment_{attachment_number}')
        if attachment and hasattr(attachment, 'size'):
            return obj._get_file_size_display(attachment.size)
        return None
    
    # Attachment URL methods
    def get_attachment_1_url(self, obj):
        return self._get_attachment_url(obj, 1)
    
    def get_attachment_2_url(self, obj):
        return self._get_attachment_url(obj, 2)
    
    def get_attachment_3_url(self, obj):
        return self._get_attachment_url(obj, 3)
    
    def get_attachment_4_url(self, obj):
        return self._get_attachment_url(obj, 4)
    
    def get_attachment_5_url(self, obj):
        return self._get_attachment_url(obj, 5)
    
    # Attachment size display methods
    def get_attachment_1_size_display(self, obj):
        return self._get_attachment_size_display(obj, 1)
    
    def get_attachment_2_size_display(self, obj):
        return self._get_attachment_size_display(obj, 2)
    
    def get_attachment_3_size_display(self, obj):
        return self._get_attachment_size_display(obj, 3)
    
    def get_attachment_4_size_display(self, obj):
        return self._get_attachment_size_display(obj, 4)
    
    def get_attachment_5_size_display(self, obj):
        return self._get_attachment_size_display(obj, 5)


class SafetyGuideListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    disaster_types_data = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    attachment_count = serializers.ReadOnlyField()
    
    class Meta:
        model = SafetyGuide
        fields = [
            'id', 'title', 'title_rw', 'title_fr', 'category',
            'featured_image_url', 'disaster_types_data', 'target_audience',
            'is_featured', 'is_published', 'display_order', 'attachment_count',
            'created_by_name', 'created_at', 'updated_at'
        ]
    
    def get_disaster_types_data(self, obj):
        from .serializers import DisasterTypeSerializer
        return DisasterTypeSerializer(obj.disaster_types.all(), many=True).data
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None


class SafetyGuideCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for create/update operations"""
    
    class Meta:
        model = SafetyGuide
        fields = [
            'title', 'title_rw', 'title_fr', 'content', 'content_rw',
            'content_fr', 'disaster_types', 'category', 'featured_image',
            'attachment_1', 'attachment_1_name', 'attachment_1_description',
            'attachment_2', 'attachment_2_name', 'attachment_2_description',
            'attachment_3', 'attachment_3_name', 'attachment_3_description',
            'attachment_4', 'attachment_4_name', 'attachment_4_description',
            'attachment_5', 'attachment_5_name', 'attachment_5_description',
            'target_audience', 'is_featured', 'is_published', 'display_order'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)

class NotificationTemplateSerializer(serializers.ModelSerializer):
    disaster_type_name = serializers.CharField(source='disaster_type.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'disaster_type', 'disaster_type_name', 'severity',
            'title_template', 'title_template_rw', 'title_template_fr',
            'message_template', 'message_template_rw', 'message_template_fr',
            'sms_template', 'sms_template_rw', 'sms_template_fr',
            'available_variables', 'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]