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


# class IncidentReportSerializer(serializers.ModelSerializer):
#     reporter_name = serializers.CharField(source='reporter.username', read_only=True)
#     disaster_type_name = serializers.CharField(source='disaster_type.name', read_only=True)
#     location_name = serializers.CharField(source='location.name', read_only=True)
#     assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
#     verified_by_name = serializers.CharField(source='verified_by.username', read_only=True)
    
#     class Meta:
#         model = IncidentReport
#         fields = [
#             'id', 'reporter', 'reporter_name', 'report_type', 'disaster_type',
#             'disaster_type_name', 'title', 'description', 'location',
#             'location_name', 'latitude', 'longitude', 'address', 'status',
#             'priority', 'assigned_to', 'assigned_to_name', 'verified_by',
#             'verified_by_name', 'images', 'videos', 'casualties',
#             'property_damage', 'immediate_needs', 'resolved_at',
#             'resolution_notes', 'created_at', 'updated_at'
#         ]


# class IncidentReportCreateSerializer(serializers.ModelSerializer):
#     """Simplified serializer for citizens to create incident reports"""
    
#     class Meta:
#         model = IncidentReport
#         fields = [
#             'report_type', 'disaster_type', 'title', 'description', 'location',
#             'latitude', 'longitude', 'address', 'casualties',
#             'property_damage', 'immediate_needs'
#         ]
    
#     def create(self, validated_data):
#         validated_data['reporter'] = self.context['request'].user
        
#         # Handle file uploads from FormData
#         request = self.context['request']
#         images = []
#         videos = []
        
#         # Process uploaded files
#         for key, file in request.FILES.items():
#             if key.startswith('images['):
#                 # Save image file and store URL/path
#                 # You'll need to implement your file storage logic
#                 file_url = self.save_uploaded_file(file, 'images')
#                 images.append(file_url)
#             elif key.startswith('videos['):
#                 # Save video file and store URL/path
#                 file_url = self.save_uploaded_file(file, 'videos')
#                 videos.append(file_url)
        
#         # Store file URLs in JSONField
#         if images:
#             validated_data['images'] = images
#         if videos:
#             validated_data['videos'] = videos
            
#         return super().create(validated_data)
    
#     def save_uploaded_file(self, file, file_type):
#         """
#         Save uploaded file and return URL/path
#         Implement based on your storage backend (local, S3, etc.)
#         """
#         # Example for local storage:
#         import os
#         from django.conf import settings
#         from django.core.files.storage import default_storage
        
#         # Create filename with timestamp to avoid conflicts
#         timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
#         filename = f"{file_type}/{timestamp}_{file.name}"
        
#         # Save file
#         path = default_storage.save(filename, file)
        
#         # Return URL that can be accessed by frontend
#         return default_storage.url(path)

class IncidentMediaSerializer(serializers.ModelSerializer):
    """Serializer for incident media files"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = IncidentMedia
        fields = [
            'id', 'media_type', 'file', 'file_url', 'caption', 
            'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']
    
    def get_file_url(self, obj):
        """Return the full URL for the file"""
        if obj.file:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.file.url)
            # Fallback if request is not available
            return obj.file.url
        return None


class IncidentLevelResponseSerializer(serializers.ModelSerializer):
    """Serializer for level responses"""
    responder_name = serializers.CharField(source='responder.username', read_only=True)
    admin_level_display = serializers.CharField(source='get_admin_level_display', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = IncidentLevelResponse
        fields = [
            'id', 'incident', 'responder', 'responder_name', 'admin_level',
            'admin_level_display', 'action_type', 'action_type_display',
            'notes', 'resources_deployed', 'outcome', 'escalation_needed',
            'escalation_reason', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class IncidentReportSerializer(serializers.ModelSerializer):
    """Main serializer for incident reports with full details"""
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    disaster_type_name = serializers.CharField(source='disaster_type.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    
    # Display values for choice fields
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    current_level_display = serializers.CharField(source='get_current_level_display', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    
    # Nested serializers for related data
    level_responses = IncidentLevelResponseSerializer(many=True, read_only=True)
    media_files = IncidentMediaSerializer(many=True, read_only=True)
    
    # Calculated fields
    next_level = serializers.SerializerMethodField()
    can_escalate = serializers.SerializerMethodField()
    
    class Meta:
        model = IncidentReport
        fields = [
            'id', 'reporter', 'reporter_name', 'report_type', 'report_type_display',
            'disaster_type', 'disaster_type_name', 'title', 'description',
            'location', 'location_name', 'latitude', 'longitude', 'address',
            'status', 'status_display', 'priority', 'priority_display',
            'current_level', 'current_level_display', 'assigned_to', 'assigned_to_name',
            'needs_escalation', 'escalation_reason', 'casualties',
            'property_damage', 'immediate_needs', 'resolved_at',
            'resolution_notes', 'created_at', 'updated_at',
            'level_responses', 'media_files', 'next_level', 'can_escalate'
        ]
        read_only_fields = ['id', 'reporter', 'created_at', 'updated_at']
    
    def get_next_level(self, obj):
        """Get the next escalation level"""
        return obj.get_next_level()
    
    def get_can_escalate(self, obj):
        """Check if incident can be escalated"""
        return obj.can_escalate()


class IncidentReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing incidents"""
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_level_display = serializers.CharField(source='get_current_level_display', read_only=True)
    media_count = serializers.SerializerMethodField()
    response_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IncidentReport
        fields = [
            'id', 'title', 'report_type', 'status', 'status_display',
            'priority', 'current_level', 'current_level_display',
            'reporter_name', 'location_name', 'latitude', 'longitude',
            'casualties', 'needs_escalation', 'created_at', 'updated_at',
            'media_count', 'response_count'
        ]
    
    def get_media_count(self, obj):
        return obj.media_files.count()
    
    def get_response_count(self, obj):
        return obj.level_responses.count()


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
        # Set the reporter from request user
        validated_data['reporter'] = self.context['request'].user
        
        # Create the incident report
        incident = super().create(validated_data)
        
        # Handle file uploads from FormData
        request = self.context['request']
        
        # Process uploaded files and create IncidentMedia objects
        for key, file in request.FILES.items():
            media_type = None
            
            if key.startswith('images['):
                media_type = 'image'
            elif key.startswith('videos['):
                media_type = 'video'
            elif key.startswith('documents['):
                media_type = 'document'
            
            if media_type:
                IncidentMedia.objects.create(
                    incident=incident,
                    media_type=media_type,
                    file=file,
                    uploaded_by=request.user
                )
        
        return incident


class IncidentLevelResponseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating level responses"""
    
    class Meta:
        model = IncidentLevelResponse
        fields = [
            'incident', 'action_type', 'notes', 'resources_deployed',
            'outcome', 'escalation_needed', 'escalation_reason', 'attachments'
        ]
    
    def validate(self, data):
        """Validate that the user can respond at this level"""
        request = self.context['request']
        incident = data['incident']
        
        # Check if user's type matches the incident's current level
        if request.user.user_type != incident.current_level:
            raise serializers.ValidationError(
                f"You can only respond to incidents at your level ({request.user.get_user_type_display()}). "
                f"This incident is at {incident.get_current_level_display()} level."
            )
        
        return data
    
    def create(self, validated_data):
        # Set the responder and admin level
        request = self.context['request']
        validated_data['responder'] = request.user
        validated_data['admin_level'] = request.user.user_type
        
        # Create the response
        response = super().create(validated_data)
        
        # Update incident status
        incident = validated_data['incident']
        if validated_data['action_type'] == 'resolved':
            incident.status = 'resolved'
            incident.resolved_at = timezone.now()
        elif incident.status == 'submitted':
            incident.status = 'in_progress'
        
        incident.save()
        
        return response


class IncidentEscalateSerializer(serializers.Serializer):
    """Serializer for escalating an incident"""
    reason = serializers.CharField(required=True, max_length=500)
    
    def validate_reason(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Escalation reason must be at least 10 characters long."
            )
        return value


class IncidentAssignSerializer(serializers.Serializer):
    """Serializer for assigning an incident to a user"""
    assigned_to = serializers.UUIDField(required=True)
    
    def validate_assigned_to(self, value):
        from .models import User
        try:
            user = User.objects.get(id=value)
            # Validate that user is at the appropriate level
            incident = self.context.get('incident')
            if incident and user.user_type != incident.current_level:
                raise serializers.ValidationError(
                    f"User must be at {incident.get_current_level_display()} level."
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")


class IncidentUpdateStatusSerializer(serializers.ModelSerializer):
    """Serializer for updating incident status"""
    
    class Meta:
        model = IncidentReport
        fields = ['status', 'resolution_notes']
    
    def validate_status(self, value):
        """Validate status transitions"""
        instance = self.instance
        valid_transitions = {
            'submitted': ['under_review', 'dismissed'],
            'under_review': ['in_progress', 'dismissed'],
            'in_progress': ['escalated', 'resolved', 'dismissed'],
            'escalated': ['in_progress', 'resolved', 'dismissed'],
        }
        
        if instance.status not in valid_transitions:
            raise serializers.ValidationError(
                f"Cannot change status from {instance.get_status_display()}"
            )
        
        if value not in valid_transitions[instance.status]:
            raise serializers.ValidationError(
                f"Cannot transition from {instance.get_status_display()} to {dict(IncidentReport.STATUS_CHOICES)[value]}"
            )
        
        return value
    
    def update(self, instance, validated_data):
        if validated_data.get('status') == 'resolved':
            validated_data['resolved_at'] = timezone.now()
        return super().update(instance, validated_data)


class IncidentMediaUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading additional media to an incident"""
    
    class Meta:
        model = IncidentMedia
        fields = ['incident', 'media_type', 'file', 'caption']
    
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
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

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'sender', 'content', 'is_read', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class ChatRoomSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'user1', 'user2', 'created_at', 'last_message', 'unread_count', 'other_user']
        read_only_fields = ['id', 'created_at']
    
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-timestamp').first()
        if last_message:
            # Use a helper method to get display name
            sender_name = self.get_user_display_name(last_message.sender)
            return {
                'content': last_message.content,
                'timestamp': last_message.timestamp,
                'sender': sender_name,
                'sender_id': last_message.sender.id
            }
        return None
    
    def get_unread_count(self, obj):
        current_user = self.context.get('request').user
        return obj.messages.filter(is_read=False).exclude(sender=current_user).count()
    
    def get_other_user(self, obj):
        current_user = self.context.get('request').user
        other_user = obj.get_other_user(current_user)
        return UserSerializer(other_user).data
    
    def get_user_display_name(self, user):
        """
        Helper method to get user display name with fallbacks
        """
        # Try different display name options in order of preference
        if hasattr(user, 'display_name') and user.display_name:
            return user.display_name
        elif user.first_name and user.last_name:
            return f"{user.first_name} {user.last_name}".strip()
        elif user.first_name:
            return user.first_name
        elif user.last_name:
            return user.last_name
        elif hasattr(user, 'profile') and hasattr(user.profile, 'full_name') and user.profile.full_name:
            return user.profile.full_name
        else:
            return user.username or user.email or f"User {user.id}"