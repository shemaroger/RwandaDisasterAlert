# views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count, Prefetch
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import check_password
from rest_framework.authtoken.models import Token
from datetime import timedelta
from .models import *
from .serializers import *
import logging
from .services import AlertDeliveryManager, deliver_alert_async


logger = logging.getLogger(__name__)


# ======================== AUTHENTICATION VIEWS ========================

class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserSerializer(user).data,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        if user:
            # Create or get authentication token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    """Get current user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """Change user password"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({
                'error': 'Both old and new passwords are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not check_password(old_password, request.user.password):
            return Response({
                'error': 'Invalid old password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 8:
            return Response({
                'error': 'New password must be at least 8 characters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        request.user.set_password(new_password)
        request.user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


# ======================== VIEWSETS ========================

class LocationViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for locations.
    - Anyone can read (list/retrieve and the custom endpoints).
    - Only authenticated staff can create/update/delete.
    """
    queryset = Location.objects.all().select_related('parent')
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['location_type', 'parent', 'is_active']
    search_fields = ['name', 'name_rw', 'name_fr']

    def get_queryset(self):
        qs = super().get_queryset()
        # Optional: filter only active by default for read operations
        if self.action in ('list', 'retrieve', 'children', 'districts', 'hierarchy'):
            qs = qs.filter(is_active=True)
        # Optional "has_coordinates" filter (?has_coordinates=true/false)
        has_coords = self.request.query_params.get('has_coordinates')
        if has_coords in ('true', 'false'):
            want = has_coords == 'true'
            if want:
                qs = qs.exclude(center_lat__isnull=True).exclude(center_lng__isnull=True)
            else:
                qs = qs.filter(center_lat__isnull=True) | qs.filter(center_lng__isnull=True)
        return qs

    @action(detail=False, methods=['get'])
    def districts(self, request):
        districts = self.get_queryset().filter(location_type='district')
        data = self.get_serializer(districts, many=True).data
        return Response(data)

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        location = self.get_object()
        children = self.get_queryset().filter(parent=location)
        data = self.get_serializer(children, many=True).data
        return Response(data)

    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """
        Returns a nested tree starting from provinces.
        Adjust the root type if you prefer to start from country.
        """
        def serialize_node(loc):
            kids = list(self.get_queryset().filter(parent=loc))
            return {
                "id": loc.id,
                "name": loc.name,
                "name_rw": loc.name_rw,
                "name_fr": loc.name_fr,
                "location_type": loc.location_type,
                "parent": loc.parent_id,
                "parent_name": loc.parent.name if loc.parent else None,
                "center_lat": loc.center_lat,
                "center_lng": loc.center_lng,
                "population": loc.population,
                "is_active": loc.is_active,
                "created_at": getattr(loc, "created_at", None),
                "children": [serialize_node(c) for c in kids],
            }

        roots = self.get_queryset().filter(location_type='province')
        data = [serialize_node(p) for p in roots]
        return Response({"hierarchy": data})


class DisasterTypeViewSet(viewsets.ModelViewSet):
    """
    CRUD for disaster types.
    - Public can list/retrieve
    - Admin can create/update/delete
    - `?is_active=true/false` filter
    - search by name fields
    """
    queryset = DisasterType.objects.all().order_by('name')
    serializer_class = DisasterTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'name_rw', 'name_fr']
    ordering_fields = ['name', 'created_at']

    # Soft-delete (flip is_active to False) while still supporting hard delete if you want
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        hard = request.query_params.get('hard', 'false').lower() == 'true'
        if hard:
            return super().destroy(request, *args, **kwargs)
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def activate(self, request, pk=None):
        obj = self.get_object()
        obj.is_active = True
        obj.save(update_fields=['is_active'])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def deactivate(self, request, pk=None):
        obj = self.get_object()
        obj.is_active = False
        obj.save(update_fields=['is_active'])
        return Response(self.get_serializer(obj).data)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['user_type', 'district', 'is_verified']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer
    
    def get_queryset(self):
        if self.request.user.is_superuser or self.request.user.user_type == 'admin':
            return User.objects.all()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return User.objects.filter(id=self.request.user.id)
        return User.objects.none()
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AlertViewSet(viewsets.ModelViewSet):
    """ViewSet for alerts with integrated notification delivery"""
    queryset = Alert.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['disaster_type', 'severity', 'status', 'affected_locations']
    search_fields = ['title', 'title_rw', 'title_fr', 'message']
    ordering_fields = ['created_at', 'issued_at', 'severity', 'priority_score']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AlertCreateSerializer
        return AlertSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        elif self.action in ['create', 'update', 'partial_update']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        queryset = Alert.objects.select_related(
            'disaster_type', 'issued_by', 'approved_by'
        ).prefetch_related(
            'affected_locations', 'deliveries', 'responses'
        )
        
        # Filter based on user permissions
        if self.request.user.is_anonymous:
            return queryset.filter(status='active', publish_web=True)
        elif hasattr(self.request.user, 'user_type') and self.request.user.user_type == 'citizen':
            return queryset.filter(status__in=['active', 'expired'], publish_web=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active alerts"""
        active_alerts = self.get_queryset().filter(
            status='active',
            issued_at__lte=timezone.now(),
            expires_at__gte=timezone.now()
        )
        
        # Filter by user location if provided
        if request.user.is_authenticated and hasattr(request.user, 'district') and request.user.district:
            active_alerts = active_alerts.filter(
                Q(affected_locations=request.user.district) |
                Q(affected_locations__isnull=True)  # Global alerts
            )
        
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an alert and trigger notification delivery"""
        alert = self.get_object()
        if alert.status != 'draft':
            return Response(
                {'error': 'Only draft alerts can be activated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Update alert status
            alert.status = 'active'
            alert.issued_at = timezone.now()
            alert.approved_by = request.user
            alert.save()
            
            # Trigger notification delivery
            delivery_manager = AlertDeliveryManager()
            
            # Check if async delivery is available
            use_async = request.data.get('async', True)
            
            if deliver_alert_async and use_async:
                # Use Celery for async delivery
                task = deliver_alert_async.delay(str(alert.id))
                delivery_results = {'task_id': task.id, 'status': 'queued'}
                logger.info(f"Alert {alert.id} queued for async delivery")
            else:
                # Synchronous delivery
                delivery_results = delivery_manager.deliver_alert(alert)
                logger.info(f"Alert {alert.id} delivered synchronously")
            
            serializer = self.get_serializer(alert)
            response_data = serializer.data
            response_data['delivery_results'] = delivery_results
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error activating alert {alert.id}: {e}")
            return Response(
                {'error': f'Failed to activate alert: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def resend_notifications(self, request, pk=None):
        """Resend failed notifications for an alert"""
        alert = self.get_object()
        
        if alert.status != 'active':
            return Response(
                {'error': 'Can only resend notifications for active alerts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get failed deliveries
            failed_deliveries = alert.deliveries.filter(status='failed')
            
            if not failed_deliveries.exists():
                return Response(
                    {'message': 'No failed deliveries to resend'},
                    status=status.HTTP_200_OK
                )
            
            delivery_manager = AlertDeliveryManager()
            
            # Reset failed deliveries and retry
            failed_deliveries.update(status='pending', error_message='')
            
            # Trigger delivery again
            use_async = request.data.get('async', True)
            
            if deliver_alert_async and use_async:
                task = deliver_alert_async.delay(str(alert.id))
                delivery_results = {'task_id': task.id, 'status': 'queued'}
            else:
                delivery_results = delivery_manager.deliver_alert(alert)
            
            return Response({
                'message': f'Resending notifications for {failed_deliveries.count()} failed deliveries',
                'delivery_results': delivery_results
            })
            
        except Exception as e:
            logger.error(f"Error resending notifications for alert {alert.id}: {e}")
            return Response(
                {'error': f'Failed to resend notifications: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def delivery_status(self, request, pk=None):
        """Get detailed delivery status for an alert"""
        alert = self.get_object()
        
        deliveries = alert.deliveries.all()
        
        # Aggregate statistics
        stats_by_method = {}
        for method in ['sms', 'push', 'email']:
            method_deliveries = deliveries.filter(delivery_method=method)
            stats_by_method[method] = {
                'total': method_deliveries.count(),
                'pending': method_deliveries.filter(status='pending').count(),
                'sent': method_deliveries.filter(status='sent').count(),
                'delivered': method_deliveries.filter(status='delivered').count(),
                'failed': method_deliveries.filter(status='failed').count(),
                'read': method_deliveries.filter(status='read').count(),
            }
            
            # Calculate success rate
            total = stats_by_method[method]['total']
            if total > 0:
                successful = stats_by_method[method]['sent'] + stats_by_method[method]['delivered']
                stats_by_method[method]['success_rate'] = round((successful / total) * 100, 2)
            else:
                stats_by_method[method]['success_rate'] = 0
        
        # Recent deliveries for debugging
        recent_deliveries = AlertDeliverySerializer(
            deliveries.order_by('-created_at')[:20], 
            many=True
        ).data
        
        return Response({
            'alert_id': alert.id,
            'alert_title': alert.title,
            'issued_at': alert.issued_at,
            'stats_by_method': stats_by_method,
            'recent_deliveries': recent_deliveries,
            'total_target_users': deliveries.values('user').distinct().count()
        })
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Submit response to an alert"""
        alert = self.get_object()
        serializer = AlertResponseSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(alert=alert, user=request.user)
            
            # Mark relevant deliveries as "read" when user responds
            AlertDelivery.objects.filter(
                alert=alert,
                user=request.user,
                status__in=['sent', 'delivered']
            ).update(
                status='read',
                read_at=timezone.now()
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an active alert"""
        alert = self.get_object()
        
        if alert.status != 'active':
            return Response(
                {'error': 'Only active alerts can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.status = 'cancelled'
        alert.save()
        
        # TODO: Send cancellation notifications to users who received the original alert
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)


class AlertDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for alert deliveries - read-only with enhanced filtering"""
    queryset = AlertDelivery.objects.all()
    serializer_class = AlertDeliverySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['delivery_method', 'status', 'alert']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = AlertDelivery.objects.select_related('alert', 'user')
        
        if self.request.user.is_superuser or getattr(self.request.user, 'user_type', None) in ['admin', 'operator']:
            return queryset
        return queryset.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get delivery statistics"""
        queryset = self.get_queryset()
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        # Aggregate statistics
        total_deliveries = queryset.count()
        
        stats = {
            'total_deliveries': total_deliveries,
            'by_method': {},
            'by_status': {},
            'success_rate': 0
        }
        
        # Statistics by delivery method
        for method in ['sms', 'push', 'email']:
            method_count = queryset.filter(delivery_method=method).count()
            stats['by_method'][method] = method_count
        
        # Statistics by status
        for status_choice in ['pending', 'sent', 'delivered', 'failed', 'read']:
            status_count = queryset.filter(status=status_choice).count()
            stats['by_status'][status_choice] = status_count
        
        # Calculate success rate
        if total_deliveries > 0:
            successful = stats['by_status']['sent'] + stats['by_status']['delivered'] + stats['by_status']['read']
            stats['success_rate'] = round((successful / total_deliveries) * 100, 2)
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a delivery as read (for tracking purposes)"""
        delivery = self.get_object()
        
        if delivery.user != request.user and not request.user.is_superuser:
            return Response(
                {'error': 'Can only mark your own deliveries as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if delivery.status in ['sent', 'delivered']:
            delivery.status = 'read'
            delivery.read_at = timezone.now()
            delivery.save()
            
            serializer = self.get_serializer(delivery)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Can only mark sent or delivered notifications as read'},
            status=status.HTTP_400_BAD_REQUEST
        )


class IncidentReportViewSet(viewsets.ModelViewSet):
    """ViewSet for incident reports"""
    queryset = IncidentReport.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['report_type', 'disaster_type', 'status', 'priority', 'location']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return IncidentReportCreateSerializer
        return IncidentReportSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        queryset = IncidentReport.objects.select_related(
            'reporter', 'disaster_type', 'location', 'assigned_to', 'verified_by'
        )
        
        # Citizens can only see their own reports
        if hasattr(self.request.user, 'user_type') and self.request.user.user_type == 'citizen':
            return queryset.filter(reporter=self.request.user)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign incident to a user"""
        incident = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        try:
            assigned_user = User.objects.get(id=assigned_to_id)
            incident.assigned_to = assigned_user
            incident.status = 'under_review'
            incident.save()
            
            serializer = self.get_serializer(incident)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify an incident report"""
        incident = self.get_object()
        incident.status = 'verified'
        incident.verified_by = request.user
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark incident as resolved"""
        incident = self.get_object()
        resolution_notes = request.data.get('resolution_notes', '')
        
        incident.status = 'resolved'
        incident.resolved_at = timezone.now()
        incident.resolution_notes = resolution_notes
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)


class EmergencyContactViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for emergency contacts - read-only"""
    queryset = EmergencyContact.objects.filter(is_active=True)
    serializer_class = EmergencyContactSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['contact_type', 'locations']
    search_fields = ['name', 'name_rw', 'name_fr', 'services_offered']
    ordering = ['display_order', 'name']
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def by_location(self, request):
        """Get contacts by location"""
        location_id = request.query_params.get('location_id')
        if location_id:
            contacts = self.queryset.filter(locations=location_id)
            serializer = self.get_serializer(contacts, many=True)
            return Response(serializer.data)
        return Response({'error': 'location_id parameter required'}, 
                       status=status.HTTP_400_BAD_REQUEST)


class SafetyGuideViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for safety guides - read-only for citizens"""
    queryset = SafetyGuide.objects.filter(is_published=True)
    serializer_class = SafetyGuideSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['disaster_types', 'category', 'target_audience', 'is_featured']
    search_fields = ['title', 'title_rw', 'title_fr', 'content']
    ordering = ['display_order', 'title']
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured safety guides"""
        featured = self.queryset.filter(is_featured=True)
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for notification templates - admin only"""
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['disaster_type', 'severity', 'is_active']
    search_fields = ['name', 'title_template', 'message_template']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AlertResponseViewSet(viewsets.ModelViewSet):
    """ViewSet for alert responses"""
    queryset = AlertResponse.objects.all()
    serializer_class = AlertResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['response_type', 'alert']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.user.is_superuser or self.request.user.user_type in ['admin', 'operator']:
            return AlertResponse.objects.all()
        return AlertResponse.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ======================== ADDITIONAL VIEWS ========================

class PasswordResetView(APIView):
    """Password reset request"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            # TODO: Implement password reset email logic
            return Response({'message': 'Password reset email sent'})
        except User.DoesNotExist:
            return Response({'message': 'Password reset email sent'})  # Don't reveal if email exists


class PasswordResetConfirmView(APIView):
    """Password reset confirmation"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not token or not new_password:
            return Response({'error': 'Token and new password are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # TODO: Implement token validation and password reset
        return Response({'message': 'Password reset successful'})


class UserProfileView(APIView):
    """Get/Update user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationPreferencesView(APIView):
    """Manage notification preferences"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'push_notifications_enabled': user.push_notifications_enabled,
            'sms_notifications_enabled': user.sms_notifications_enabled,
            'email_notifications_enabled': user.email_notifications_enabled,
            'preferred_language': user.preferred_language,
        })
    
    def patch(self, request):
        user = request.user
        data = request.data
        
        if 'push_notifications_enabled' in data:
            user.push_notifications_enabled = data['push_notifications_enabled']
        if 'sms_notifications_enabled' in data:
            user.sms_notifications_enabled = data['sms_notifications_enabled']
        if 'email_notifications_enabled' in data:
            user.email_notifications_enabled = data['email_notifications_enabled']
        if 'preferred_language' in data:
            user.preferred_language = data['preferred_language']
        
        user.save()
        return Response({'message': 'Preferences updated successfully'})


class UpdateLocationView(APIView):
    """Update user location"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        district_id = request.data.get('district_id')
        
        if latitude and longitude:
            user.location_lat = latitude
            user.location_lng = longitude
        
        if district_id:
            try:
                district = Location.objects.get(id=district_id, location_type='district')
                user.district = district
            except Location.DoesNotExist:
                return Response({'error': 'Invalid district'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.save()
        return Response({'message': 'Location updated successfully'})


class DashboardView(APIView):
    """Dashboard overview"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get user-specific data based on role
        if hasattr(user, 'user_type') and user.user_type == 'citizen':
            return self.citizen_dashboard(user)
        elif hasattr(user, 'user_type') and user.user_type in ['admin', 'operator', 'authority']:
            return self.admin_dashboard(user)
        
        return Response({'error': 'Invalid user type'}, status=status.HTTP_400_BAD_REQUEST)
    
    def citizen_dashboard(self, user):
        # Active alerts for user's area
        active_alerts = Alert.objects.filter(
            status='active',
            issued_at__lte=timezone.now(),
            expires_at__gte=timezone.now()
        )
        
        if hasattr(user, 'district') and user.district:
            active_alerts = active_alerts.filter(
                Q(affected_locations=user.district) | Q(affected_locations__isnull=True)
            )
        
        # User's incident reports
        my_reports = IncidentReport.objects.filter(reporter=user).order_by('-created_at')[:5]
        
        # User's alert responses
        my_responses = AlertResponse.objects.filter(user=user).order_by('-created_at')[:5]
        
        return Response({
            'active_alerts_count': active_alerts.count(),
            'my_reports_count': my_reports.count(),
            'my_responses_count': my_responses.count(),
            'recent_reports': [{'id': str(r.id), 'title': r.title, 'status': r.status} for r in my_reports],
        })
    
    def admin_dashboard(self, user):
        # System-wide statistics
        total_users = User.objects.filter(user_type='citizen').count()
        active_alerts = Alert.objects.filter(status='active').count()
        pending_incidents = IncidentReport.objects.filter(status='submitted').count()
        
        # Recent activity
        recent_alerts = Alert.objects.order_by('-created_at')[:5]
        recent_incidents = IncidentReport.objects.order_by('-created_at')[:5]
        
        return Response({
            'total_users': total_users,
            'active_alerts': active_alerts,
            'pending_incidents': pending_incidents,
            'recent_alerts': [{'id': str(a.id), 'title': a.title, 'severity': a.severity} for a in recent_alerts],
            'recent_incidents': [{'id': str(i.id), 'title': i.title, 'status': i.status} for i in recent_incidents],
        })


class NearbyAlertsView(APIView):
    """Get alerts near user's location"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not (hasattr(user, 'location_lat') and user.location_lat and user.location_lng):
            return Response({'error': 'User location not set'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get radius from query params (default 50km)
        radius_km = float(request.query_params.get('radius', 50))
        
        alerts = Alert.objects.filter(
            status='active',
            center_lat__isnull=False,
            center_lng__isnull=False
        )
        
        # Filter by distance (simple calculation for now)
        nearby_alerts = []
        for alert in alerts:
            if alert.center_lat and alert.center_lng:
                # Simple distance calculation (should use PostGIS in production)
                lat_diff = abs(float(user.location_lat) - float(alert.center_lat))
                lng_diff = abs(float(user.location_lng) - float(alert.center_lng))
                # Rough distance check (1 degree ≈ 111km)
                if lat_diff < (radius_km / 111) and lng_diff < (radius_km / 111):
                    nearby_alerts.append(alert)
        
        serializer = AlertSerializer(nearby_alerts, many=True)
        return Response(serializer.data)


class PublicActiveAlertsView(APIView):
    """Public endpoint for active alerts"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        alerts = Alert.objects.filter(
            status='active',
            publish_web=True,
            issued_at__lte=timezone.now(),
            expires_at__gte=timezone.now()
        ).order_by('-issued_at')
        
        serializer = AlertSerializer(alerts, many=True)
        return Response(serializer.data)


class SystemHealthView(APIView):
    """System health check"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        from django.db import connection
        
        # Check database
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_status = "healthy"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        return Response({
            'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
            'database': db_status,
            'timestamp': timezone.now().isoformat(),
        })


class TwilioSMSStatusWebhookView(APIView):
    """Webhook for Twilio SMS delivery status"""
    permission_classes = [permissions.AllowAny]  # Twilio webhook
    
    def post(self, request):
        # Verify webhook signature in production
        data = request.data
        
        message_sid = data.get('MessageSid')
        status = data.get('MessageStatus')
        
        if message_sid and status:
            try:
                # You'll need to store Twilio SID in AlertDelivery model
                delivery = AlertDelivery.objects.get(
                    error_message__contains=message_sid  # Temporary solution
                )
                
                # Map Twilio status to our status
                status_mapping = {
                    'queued': 'pending',
                    'sent': 'sent',
                    'delivered': 'delivered',
                    'failed': 'failed',
                    'undelivered': 'failed',
                }
                
                if status in status_mapping:
                    delivery.status = status_mapping[status]
                    if status == 'delivered':
                        delivery.delivered_at = timezone.now()
                    delivery.save()
                
                return Response({'status': 'ok'})
            except AlertDelivery.DoesNotExist:
                pass
        
        return Response({'status': 'ignored'})


# ======================== PLACEHOLDER VIEWS ========================

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'stats': 'placeholder'})

class RecentAlertsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'alerts': []})

class RecentIncidentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'incidents': []})

class MyAlertResponsesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'responses': []})

class BulkSendAlertView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request):
        return Response({'message': 'Bulk alert sent'})

class AlertDeliveryStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, alert_id):
        return Response({'status': 'placeholder'})

class MyIncidentReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'reports': []})

class AssignedIncidentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'incidents': []})

class PriorityIncidentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response({'incidents': []})

class NearbyEmergencyContactsView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({'contacts': []})

class SafetyGuidesByDisasterView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({'guides': []})

class LocationSearchView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Query parameter "q" is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        locations = Location.objects.filter(
            Q(name__icontains=query) |
            Q(name_rw__icontains=query) |
            Q(name_fr__icontains=query),
            is_active=True
        )[:20]  # Limit to 20 results
        
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)


class LocationHierarchyView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Get complete location hierarchy"""
        provinces = Location.objects.filter(location_type='province', is_active=True)
        hierarchy = []
        
        for province in provinces:
            province_data = LocationSerializer(province).data
            districts = Location.objects.filter(parent=province, is_active=True)
            province_data['districts'] = []
            
            for district in districts:
                district_data = LocationSerializer(district).data
                sectors = Location.objects.filter(parent=district, is_active=True)
                district_data['sectors'] = LocationSerializer(sectors, many=True).data
                province_data['districts'].append(district_data)
            
            hierarchy.append(province_data)
        
        return Response({'hierarchy': hierarchy})


class SendTestNotificationView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        message = request.data.get('message', 'Test notification from RwandaDisasterAlert')
        
        if not recipient_id:
            return Response({'error': 'recipient_id is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            recipient = User.objects.get(id=recipient_id)
            # TODO: Implement actual notification sending logic
            # This would integrate with Twilio, Firebase, etc.
            
            return Response({
                'message': f'Test notification sent to {recipient.username}',
                'recipient': recipient.username,
                'content': message
            })
        except User.DoesNotExist:
            return Response({'error': 'Recipient not found'}, 
                          status=status.HTTP_404_NOT_FOUND)


class NotificationDeliveryReportsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Get delivery reports for the last 30 days
        start_date = timezone.now() - timedelta(days=30)
        
        deliveries = AlertDelivery.objects.filter(
            created_at__gte=start_date
        ).values('delivery_method', 'status').annotate(
            count=Count('id')
        )
        
        # Group by delivery method and status
        reports = {}
        for delivery in deliveries:
            method = delivery['delivery_method']
            status = delivery['status']
            count = delivery['count']
            
            if method not in reports:
                reports[method] = {}
            reports[method][status] = count
        
        return Response({
            'period': '30 days',
            'reports': reports,
            'total_deliveries': AlertDelivery.objects.filter(created_at__gte=start_date).count()
        })


class SystemMetricsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        # Get system metrics
        total_users = User.objects.count()
        active_users = User.objects.filter(last_login__gte=timezone.now() - timedelta(days=30)).count()
        total_alerts = Alert.objects.count()
        active_alerts = Alert.objects.filter(status='active').count()
        total_incidents = IncidentReport.objects.count()
        pending_incidents = IncidentReport.objects.filter(status='submitted').count()
        
        # Alert metrics by severity
        alert_severity_stats = Alert.objects.values('severity').annotate(
            count=Count('id')
        )
        
        # Incident metrics by type
        incident_type_stats = IncidentReport.objects.values('report_type').annotate(
            count=Count('id')
        )
        
        return Response({
            'users': {
                'total': total_users,
                'active_30_days': active_users,
                'activity_rate': round((active_users / total_users * 100), 2) if total_users > 0 else 0
            },
            'alerts': {
                'total': total_alerts,
                'active': active_alerts,
                'severity_breakdown': {item['severity']: item['count'] for item in alert_severity_stats}
            },
            'incidents': {
                'total': total_incidents,
                'pending': pending_incidents,
                'type_breakdown': {item['report_type']: item['count'] for item in incident_type_stats}
            },
            'timestamp': timezone.now().isoformat()
        })


class TwilioDeliveryReportWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Handle Twilio delivery report webhooks"""
        data = request.data
        
        # Extract relevant information from Twilio webhook
        message_sid = data.get('MessageSid')
        account_sid = data.get('AccountSid')
        message_status = data.get('MessageStatus')
        error_code = data.get('ErrorCode')
        error_message = data.get('ErrorMessage')
        
        if message_sid:
            try:
                # Find the corresponding delivery record
                delivery = AlertDelivery.objects.get(
                    # You'll need to add a twilio_sid field to store this
                    error_message__contains=message_sid
                )
                
                # Update delivery status
                status_mapping = {
                    'delivered': 'delivered',
                    'sent': 'sent',
                    'failed': 'failed',
                    'undelivered': 'failed'
                }
                
                if message_status in status_mapping:
                    delivery.status = status_mapping[message_status]
                    
                    if message_status == 'delivered':
                        delivery.delivered_at = timezone.now()
                    elif message_status in ['failed', 'undelivered']:
                        delivery.error_message = error_message or f"Error code: {error_code}"
                    
                    delivery.save()
                
                return Response({'status': 'processed'})
            except AlertDelivery.DoesNotExist:
                return Response({'status': 'delivery_not_found'})
        
        return Response({'status': 'ignored'})


class IncidentMediaUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Handle media upload for incident reports"""
        uploaded_file = request.FILES.get('file')
        incident_id = request.data.get('incident_id')
        
        if not uploaded_file:
            return Response({'error': 'No file provided'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi']
        if uploaded_file.content_type not in allowed_types:
            return Response({'error': 'File type not allowed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 10MB)
        if uploaded_file.size > 10 * 1024 * 1024:
            return Response({'error': 'File size too large (max 10MB)'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # TODO: Implement actual file upload logic
        # This would typically involve saving to a cloud storage service
        # like AWS S3, Google Cloud Storage, or local file system
        
        file_url = f"/media/incidents/{uploaded_file.name}"  # Placeholder
        
        # If incident_id is provided, update the incident record
        if incident_id:
            try:
                incident = IncidentReport.objects.get(id=incident_id, reporter=request.user)
                if incident.images is None:
                    incident.images = []
                incident.images.append(file_url)
                incident.save()
            except IncidentReport.DoesNotExist:
                return Response({'error': 'Incident not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'url': file_url,
            'filename': uploaded_file.name,
            'size': uploaded_file.size,
            'content_type': uploaded_file.content_type
        })


class SafetyGuideMediaUploadView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        """Handle media upload for safety guides"""
        uploaded_file = request.FILES.get('file')
        
        if not uploaded_file:
            return Response({'error': 'No file provided'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type (images and documents)
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if uploaded_file.content_type not in allowed_types:
            return Response({'error': 'File type not allowed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # TODO: Implement actual file upload logic
        file_url = f"/media/safety-guides/{uploaded_file.name}"  # Placeholder
        
        return Response({
            'url': file_url,
            'filename': uploaded_file.name,
            'size': uploaded_file.size,
            'content_type': uploaded_file.content_type
        })


class PublicEmergencyContactsView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Public endpoint for emergency contacts"""
        contacts = EmergencyContact.objects.filter(is_active=True).order_by('display_order', 'name')
        
        # Filter by location if provided
        location_id = request.query_params.get('location')
        if location_id:
            contacts = contacts.filter(locations=location_id)
        
        # Filter by contact type if provided
        contact_type = request.query_params.get('type')
        if contact_type:
            contacts = contacts.filter(contact_type=contact_type)
        
        serializer = EmergencyContactSerializer(contacts, many=True)
        return Response(serializer.data)


class PublicSafetyTipsView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Public endpoint for safety tips"""
        guides = SafetyGuide.objects.filter(is_published=True).order_by('display_order', 'title')
        
        # Filter by disaster type if provided
        disaster_type = request.query_params.get('disaster_type')
        if disaster_type:
            guides = guides.filter(disaster_types=disaster_type)
        
        # Filter by category if provided
        category = request.query_params.get('category')
        if category:
            guides = guides.filter(category=category)
        
        # Get featured tips if requested
        featured = request.query_params.get('featured')
        if featured == 'true':
            guides = guides.filter(is_featured=True)
        
        serializer = SafetyGuideSerializer(guides, many=True)
        return Response(serializer.data)


class MobileAppConfigView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Configuration for mobile app"""
        config = {
            'app_version': '1.0.0',
            'min_supported_version': '1.0.0',
            'force_update': False,
            'maintenance_mode': False,
            'features': {
                'incident_reporting': True,
                'alert_responses': True,
                'location_tracking': True,
                'offline_mode': True
            },
            'settings': {
                'default_language': 'rw',
                'supported_languages': ['rw', 'en', 'fr'],
                'location_update_interval': 300,  # seconds
                'alert_check_interval': 60,  # seconds
                'max_image_size': 5242880,  # 5MB in bytes
                'max_video_size': 52428800  # 50MB in bytes
            },
            'endpoints': {
                'base_url': request.build_absolute_uri('/api/'),
                'websocket_url': None,  # Add if implementing real-time features
            },
            'emergency_contacts': {
                'police': '999',
                'fire': '998',
                'medical': '997',
                'disaster_management': '+250788311111'  # Placeholder
            }
        }
        
        return Response(config)


class ForceUpdateCheckView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Check if app force update is required"""
        app_version = request.query_params.get('version', '1.0.0')
        platform = request.query_params.get('platform', 'android')  # android or ios
        
        # Define minimum required versions
        min_versions = {
            'android': '1.0.0',
            'ios': '1.0.0'
        }
        
        current_versions = {
            'android': '1.0.0',
            'ios': '1.0.0'
        }
        
        min_version = min_versions.get(platform, '1.0.0')
        current_version = current_versions.get(platform, '1.0.0')
        
        # Simple version comparison (should use proper version parsing in production)
        force_update = app_version < min_version
        update_available = app_version < current_version
        
        response = {
            'force_update': force_update,
            'update_available': update_available,
            'current_version': current_version,
            'min_version': min_version,
            'download_url': {
                'android': 'https://play.google.com/store/apps/details?id=rw.gov.disasteralert',
                'ios': 'https://apps.apple.com/app/rwanda-disaster-alert/id123456789'
            }.get(platform),
            'release_notes': 'Bug fixes and performance improvements'
        }
        
        return Response(response)