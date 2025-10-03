# views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count, Prefetch
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import check_password
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied
from datetime import timedelta
from .models import *
from .serializers import *
import logging
from .services import AlertDeliveryManager, deliver_alert_async
from django.http import HttpResponse
import json

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
        logger.info(f"DEBUG: Attempting to activate alert {alert.id} - current status: {alert.status}")
        
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
            
            logger.info(f"DEBUG: Alert {alert.id} status updated to active")
            logger.info(f"DEBUG: Alert notification settings - SMS: {alert.send_sms}, Email: {alert.send_email}, Push: {alert.send_push}")
            
            # Trigger notification delivery
            delivery_manager = AlertDeliveryManager()
            logger.info(f"DEBUG: Created AlertDeliveryManager instance")
            
            # Check if async delivery is available
            use_async = request.data.get('async', True)
            logger.info(f"DEBUG: Using async delivery: {use_async}, deliver_alert_async available: {deliver_alert_async is not None}")
            
            if deliver_alert_async and use_async:
                # Use Celery for async delivery
                task = deliver_alert_async.delay(str(alert.id))
                delivery_results = {'task_id': task.id, 'status': 'queued'}
                logger.info(f"Alert {alert.id} queued for async delivery with task ID: {task.id}")
            else:
                # Synchronous delivery
                logger.info(f"DEBUG: Starting synchronous delivery for alert {alert.id}")
                delivery_results = delivery_manager.deliver_alert(alert)
                logger.info(f"Alert {alert.id} delivered synchronously: {delivery_results}")
            
            serializer = self.get_serializer(alert)
            response_data = serializer.data
            response_data['delivery_results'] = delivery_results
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error activating alert {alert.id}: {e}", exc_info=True)
            return Response(
                {'error': f'Failed to activate alert: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def resend_notifications(self, request, pk=None):
        """Resend failed notifications for an alert"""
        alert = self.get_object()
        logger.info(f"DEBUG: Resending notifications for alert {alert.id}")
        
        if alert.status != 'active':
            return Response(
                {'error': 'Can only resend notifications for active alerts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get failed deliveries
            failed_deliveries = alert.deliveries.filter(status='failed')
            logger.info(f"DEBUG: Found {failed_deliveries.count()} failed deliveries")
            
            # Always trigger delivery regardless of failed deliveries count
            # This will create new delivery records for all users
            delivery_manager = AlertDeliveryManager()
            logger.info(f"DEBUG: Created delivery manager for resend")
            
            # Reset failed deliveries and retry
            if failed_deliveries.exists():
                failed_deliveries.update(status='pending', error_message='')
                logger.info(f"DEBUG: Reset {failed_deliveries.count()} failed deliveries to pending")
            
            # Trigger delivery again
            use_async = request.data.get('async', False)  # Default to sync for debugging
            logger.info(f"DEBUG: Using async for resend: {use_async}")
            
            if deliver_alert_async and use_async:
                task = deliver_alert_async.delay(str(alert.id))
                delivery_results = {'task_id': task.id, 'status': 'queued'}
                logger.info(f"DEBUG: Queued resend task {task.id}")
            else:
                logger.info(f"DEBUG: Starting synchronous resend delivery")
                delivery_results = delivery_manager.deliver_alert(alert)
                logger.info(f"DEBUG: Resend delivery results: {delivery_results}")
            
            return Response({
                'message': f'Resending notifications for alert {alert.id}',
                'delivery_results': delivery_results,
                'failed_deliveries_reset': failed_deliveries.count()
            })
            
        except Exception as e:
            logger.error(f"Error resending notifications for alert {alert.id}: {e}", exc_info=True)
            return Response(
                {'error': f'Failed to resend notifications: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def delivery_status(self, request, pk=None):
        """Get detailed delivery status for an alert"""
        alert = self.get_object()
        
        deliveries = alert.deliveries.all()
        logger.info(f"DEBUG: Found {deliveries.count()} delivery records for alert {alert.id}")
        
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
# views.py - Updated IncidentReportViewSet with additional endpoints

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import IncidentReport, User
from .serializers import IncidentReportSerializer, IncidentReportCreateSerializer


class IncidentReportViewSet(viewsets.ModelViewSet):
    """ViewSet for incident reports with full CRUD operations"""
    queryset = IncidentReport.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['report_type', 'disaster_type', 'status', 'priority', 'location']
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['created_at', 'priority', 'status', 'updated_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return IncidentReportCreateSerializer
        return IncidentReportSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            # Anyone authenticated can create incidents
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['list', 'retrieve']:
            # Anyone authenticated can view incidents (filtered by get_queryset)
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            # Citizens can edit their own, admins can edit any
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['destroy']:
            # Only admins can delete
            permission_classes = [permissions.IsAdminUser]
        else:
            # Custom actions require authentication
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter queryset based on user type and permissions
        """
        queryset = IncidentReport.objects.select_related(
            'reporter', 'disaster_type', 'location', 'assigned_to', 'verified_by'
        ).prefetch_related().order_by('-created_at')
        
        user = self.request.user
        
        # Citizens can only see their own incidents
        if hasattr(user, 'user_type') and user.user_type == 'citizen':
            return queryset.filter(reporter=user)
        
        # Admin, operator, authority can see all incidents
        return queryset
    
    def perform_create(self, serializer):
        """Set the reporter to the current user when creating an incident"""
        serializer.save(reporter=self.request.user)
    
    def perform_update(self, serializer):
        """Handle update permissions - citizens can only edit their own submitted incidents"""
        instance = self.get_object()
        user = self.request.user
        
        # Citizens can only edit their own incidents that haven't been processed
        if (hasattr(user, 'user_type') and user.user_type == 'citizen' and
            (instance.reporter != user or instance.status != 'submitted')):
            raise PermissionError("Citizens can only edit their own unprocessed incidents")
        
        serializer.save()

    # ========================================
    # CUSTOM ACTION ENDPOINTS
    # ========================================

    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """
        Get current user's incident reports (citizens only)
        Endpoint: /incidents/my-reports/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type != 'citizen':
            return Response(
                {'error': 'This endpoint is only available for citizens'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get user's incidents with filtering and pagination
        queryset = self.filter_queryset(
            IncidentReport.objects.filter(reporter=request.user)
            .select_related('disaster_type', 'location', 'assigned_to', 'verified_by')
            .order_by('-created_at')
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def assigned_to_me(self, request):
        """
        Get incidents assigned to current user (operators/authorities)
        Endpoint: /incidents/assigned-to-me/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type == 'citizen':
            return Response(
                {'error': 'This endpoint is not available for citizens'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.filter_queryset(
            IncidentReport.objects.filter(assigned_to=request.user)
            .select_related('reporter', 'disaster_type', 'location', 'verified_by')
            .order_by('-created_at')
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def priority(self, request):
        """
        Get high priority incidents (priority 1-2)
        Endpoint: /incidents/priority/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type == 'citizen':
            return Response(
                {'error': 'This endpoint is not available for citizens'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.filter_queryset(
            self.get_queryset().filter(priority__lte=2, status__in=['submitted', 'under_review', 'verified'])
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent incidents (last 24 hours)
        Endpoint: /incidents/recent/
        """
        from datetime import timedelta
        
        recent_time = timezone.now() - timedelta(hours=24)
        queryset = self.filter_queryset(
            self.get_queryset().filter(created_at__gte=recent_time)
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export incidents data (admin/operator only)
        Endpoint: /incidents/export/?format=csv|xlsx|json
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type not in ['admin', 'operator']:
            return Response(
                {'error': 'Export is only available for administrators and operators'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        export_format = request.query_params.get('format', 'csv').lower()
        
        if export_format == 'json':
            # Return JSON data
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            
            response = Response(serializer.data)
            response['Content-Disposition'] = f'attachment; filename="incidents_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json"'
            return response
        
        elif export_format in ['csv', 'xlsx']:
            # For CSV/Excel, you'd typically use a library like pandas or create custom export
            return Response(
                {'message': f'{export_format.upper()} export functionality to be implemented'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )
        
        else:
            return Response(
                {'error': 'Invalid export format. Use: csv, xlsx, or json'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    # ========================================
    # INCIDENT STATUS MANAGEMENT
    # ========================================

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign incident to a user
        Endpoint: /incidents/{id}/assign/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type not in ['admin', 'authority', 'operator']:
            return Response(
                {'error': 'Only administrators, authorities, and operators can assign incidents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        incident = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if not assigned_to_id:
            return Response(
                {'error': 'assigned_to user ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assigned_user = User.objects.get(id=assigned_to_id)
            
            # Validate that assigned user can handle incidents
            if not hasattr(assigned_user, 'user_type') or assigned_user.user_type == 'citizen':
                return Response(
                    {'error': 'Cannot assign incidents to citizen users'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            incident.assigned_to = assigned_user
            incident.status = 'under_review'
            incident.save()
            
            serializer = self.get_serializer(incident)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Assigned user not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verify an incident report
        Endpoint: /incidents/{id}/verify/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type not in ['admin', 'authority', 'operator']:
            return Response(
                {'error': 'Only administrators, authorities, and operators can verify incidents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        incident = self.get_object()
        
        if incident.status not in ['submitted', 'under_review']:
            return Response(
                {'error': f'Cannot verify incident with status: {incident.status}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        incident.status = 'verified'
        incident.verified_by = request.user
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Mark incident as resolved
        Endpoint: /incidents/{id}/resolve/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type not in ['admin', 'authority', 'operator']:
            return Response(
                {'error': 'Only administrators, authorities, and operators can resolve incidents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        incident = self.get_object()
        resolution_notes = request.data.get('resolution_notes', '')
        
        if incident.status not in ['verified', 'under_review']:
            return Response(
                {'error': f'Cannot resolve incident with status: {incident.status}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        incident.status = 'resolved'
        incident.resolved_at = timezone.now()
        incident.resolution_notes = resolution_notes
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """
        Dismiss an incident report
        Endpoint: /incidents/{id}/dismiss/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type not in ['admin', 'authority']:
            return Response(
                {'error': 'Only administrators and authorities can dismiss incidents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        incident = self.get_object()
        dismissal_reason = request.data.get('dismissal_reason', '')
        
        if incident.status == 'resolved':
            return Response(
                {'error': 'Cannot dismiss a resolved incident'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        incident.status = 'dismissed'
        incident.resolution_notes = f"Dismissed: {dismissal_reason}" if dismissal_reason else "Dismissed by administrator"
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """
        Reopen a resolved or dismissed incident
        Endpoint: /incidents/{id}/reopen/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type not in ['admin', 'authority']:
            return Response(
                {'error': 'Only administrators and authorities can reopen incidents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        incident = self.get_object()
        reopen_reason = request.data.get('reopen_reason', '')
        
        if incident.status not in ['resolved', 'dismissed']:
            return Response(
                {'error': f'Cannot reopen incident with status: {incident.status}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        incident.status = 'under_review'
        incident.resolved_at = None
        incident.resolution_notes = f"Reopened: {reopen_reason}" if reopen_reason else "Reopened by administrator"
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    # ========================================
    # STATISTICS AND REPORTING
    # ========================================

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get incident statistics
        Endpoint: /incidents/stats/
        """
        if not hasattr(request.user, 'user_type') or request.user.user_type == 'citizen':
            return Response(
                {'error': 'Statistics are not available for citizens'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        # Count by status
        status_counts = {}
        for status_choice in IncidentReport.STATUS_CHOICES:
            status_value = status_choice[0]
            status_counts[status_value] = queryset.filter(status=status_value).count()
        
        # Count by report type
        type_counts = {}
        for type_choice in IncidentReport.REPORT_TYPES:
            type_value = type_choice[0]
            type_counts[type_value] = queryset.filter(report_type=type_value).count()
        
        # Recent activity (last 7 days)
        from datetime import timedelta
        recent_time = timezone.now() - timedelta(days=7)
        recent_count = queryset.filter(created_at__gte=recent_time).count()
        
        stats = {
            'total_incidents': queryset.count(),
            'status_breakdown': status_counts,
            'type_breakdown': type_counts,
            'recent_incidents_7_days': recent_count,
            'high_priority_open': queryset.filter(
                priority__lte=2, 
                status__in=['submitted', 'under_review', 'verified']
            ).count(),
            'unassigned_incidents': queryset.filter(
                assigned_to__isnull=True, 
                status__in=['submitted', 'under_review']
            ).count()
        }
        
        return Response(stats)
# class IncidentReportViewSet(viewsets.ModelViewSet):
#     """ViewSet for incident reports"""
#     queryset = IncidentReport.objects.all()
#     filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
#     filterset_fields = ['report_type', 'disaster_type', 'status', 'priority', 'location']
#     search_fields = ['title', 'description']
#     ordering_fields = ['created_at', 'priority', 'status']
#     ordering = ['-created_at']
    
#     def get_serializer_class(self):
#         if self.action == 'create':
#             return IncidentReportCreateSerializer
#         return IncidentReportSerializer
    
#     def get_permissions(self):
#         if self.action in ['create']:
#             return [permissions.IsAuthenticated()]
#         elif self.action in ['list', 'retrieve']:
#             return [permissions.IsAuthenticated()]
#         return [permissions.IsAdminUser()]
    
#     def get_queryset(self):
#         queryset = IncidentReport.objects.select_related(
#             'reporter', 'disaster_type', 'location', 'assigned_to', 'verified_by'
#         )
        
#         # Citizens can only see their 
#         if hasattr(self.request.user, 'user_type') and self.request.user.user_type == 'citizen':
#             return queryset.filter(reporter=self.request.user)
        
#         return queryset
    
    
#     @action(detail=True, methods=['post'])
#     def assign(self, request, pk=None):
#         """Assign incident to a user"""
#         incident = self.get_object()
#         assigned_to_id = request.data.get('assigned_to')
        
#         try:
#             assigned_user = User.objects.get(id=assigned_to_id)
#             incident.assigned_to = assigned_user
#             incident.status = 'under_review'
#             incident.save()
            
#             serializer = self.get_serializer(incident)
#             return Response(serializer.data)
#         except User.DoesNotExist:
#             return Response(
#                 {'error': 'User not found'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
    
#     @action(detail=True, methods=['post'])
#     def verify(self, request, pk=None):
#         """Verify an incident report"""
#         incident = self.get_object()
#         incident.status = 'verified'
#         incident.verified_by = request.user
#         incident.save()
        
#         serializer = self.get_serializer(incident)
#         return Response(serializer.data)
    
#     @action(detail=True, methods=['post'])
#     def resolve(self, request, pk=None):
#         """Mark incident as resolved"""
#         incident = self.get_object()
#         resolution_notes = request.data.get('resolution_notes', '')
        
#         incident.status = 'resolved'
#         incident.resolved_at = timezone.now()
#         incident.resolution_notes = resolution_notes
#         incident.save()
        
#         serializer = self.get_serializer(incident)
#         return Response(serializer.data)


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

class IsAdminOrAuthority(permissions.BasePermission):
    """
    Custom permission to only allow admin, authority, or operator users
    to perform write operations.
    """
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                hasattr(request.user, 'user_type') and
                request.user.user_type in ['admin', 'authority', 'operator'])
class SafetyGuideViewSet(viewsets.ModelViewSet):
    """ViewSet for safety guides with role-based permissions and file upload support"""
    queryset = SafetyGuide.objects.all()
    serializer_class = SafetyGuideSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['disaster_types', 'category', 'target_audience', 'is_featured', 'is_published']
    search_fields = ['title', 'title_rw', 'title_fr', 'content']
    ordering = ['display_order', 'title']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return SafetyGuideListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SafetyGuideCreateUpdateSerializer
        return SafetyGuideSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve', 'featured', 'stats', 'export']:
            # Read operations - allow everyone
            permission_classes = [permissions.AllowAny]
        else:
            # Write operations - admin/authority only
            permission_classes = [permissions.IsAuthenticated]  # Add your custom permission class here
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = SafetyGuide.objects.select_related('created_by', 'updated_by').prefetch_related(
            'disaster_types'
        )
        
        # Apply permission-based filtering
        if self.request.user.is_authenticated and hasattr(self.request.user, 'user_type'):
            if self.request.user.user_type in ['admin', 'authority', 'operator']:
                # Admin users see all guides
                pass
            else:
                # Regular users only see published guides
                queryset = queryset.filter(is_published=True)
        else:
            # Anonymous users only see published guides
            queryset = queryset.filter(is_published=True)
        
        # Handle additional filtering
        is_published = self.request.GET.get('is_published')
        if is_published is not None:
            if is_published.lower() in ['true', '1']:
                queryset = queryset.filter(is_published=True)
            elif is_published.lower() in ['false', '0']:
                queryset = queryset.filter(is_published=False)
        
        is_featured = self.request.GET.get('is_featured')
        if is_featured is not None:
            if is_featured.lower() in ['true', '1']:
                queryset = queryset.filter(is_featured=True)
            elif is_featured.lower() in ['false', '0']:
                queryset = queryset.filter(is_featured=False)
        
        created_by = self.request.GET.get('created_by')
        if created_by:
            queryset = queryset.filter(created_by=created_by)
            
        return queryset
    
    def perform_create(self, serializer):
        """Set the created_by field when creating a safety guide"""
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()
    
    def perform_update(self, serializer):
        """Set the updated_by field when updating a safety guide"""
        if self.request.user.is_authenticated:
            serializer.save(updated_by=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def update_attachment(self, request, pk=None):
        """Update a specific attachment on a safety guide"""
        try:
            safety_guide = self.get_object()
            attachment_slot = request.data.get('attachment_slot')  # e.g., "1", "2", etc.
            file = request.FILES.get('file')
            name = request.data.get('name', '')
            description = request.data.get('description', '')
            
            if not attachment_slot or attachment_slot not in ['1', '2', '3', '4', '5']:
                return Response(
                    {'error': 'Valid attachment_slot (1-5) is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the attachment fields
            if file:
                setattr(safety_guide, f'attachment_{attachment_slot}', file)
            
            if name:
                setattr(safety_guide, f'attachment_{attachment_slot}_name', name)
            
            if description:
                setattr(safety_guide, f'attachment_{attachment_slot}_description', description)
            
            safety_guide.save()
            
            # Return updated attachment info
            attachment_data = {
                'slot': attachment_slot,
                'file': getattr(safety_guide, f'attachment_{attachment_slot}').url if getattr(safety_guide, f'attachment_{attachment_slot}') else None,
                'name': getattr(safety_guide, f'attachment_{attachment_slot}_name', ''),
                'description': getattr(safety_guide, f'attachment_{attachment_slot}_description', ''),
                'size_display': safety_guide._get_file_size_display(
                    getattr(safety_guide, f'attachment_{attachment_slot}').size
                ) if getattr(safety_guide, f'attachment_{attachment_slot}') else None
            }
            
            return Response(attachment_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to update attachment: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'])
    def delete_attachment(self, request, pk=None):
        """Delete a specific attachment from a safety guide"""
        try:
            safety_guide = self.get_object()
            attachment_slot = request.data.get('attachment_slot')
            
            if not attachment_slot or attachment_slot not in ['1', '2', '3', '4', '5']:
                return Response(
                    {'error': 'Valid attachment_slot (1-5) is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Clear the attachment fields
            setattr(safety_guide, f'attachment_{attachment_slot}', None)
            setattr(safety_guide, f'attachment_{attachment_slot}_name', '')
            setattr(safety_guide, f'attachment_{attachment_slot}_description', '')
            
            safety_guide.save()
            
            return Response(
                {'message': f'Attachment {attachment_slot} deleted successfully'}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete attachment: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def attachments(self, request, pk=None):
        """Get all attachments for a safety guide"""
        try:
            safety_guide = self.get_object()
            attachments = safety_guide.get_all_attachments()
            
            # Add absolute URLs if request context is available
            for attachment in attachments:
                if attachment.get('url') and not attachment['url'].startswith(('http://', 'https://')):
                    attachment['url'] = request.build_absolute_uri(attachment['url'])
            
            return Response({
                'safety_guide_id': safety_guide.id,
                'attachments': attachments,
                'total_count': len(attachments)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get attachments: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured safety guides"""
        featured = self.get_queryset().filter(is_featured=True)
        page = self.paginate_queryset(featured)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get safety guide statistics"""
        try:
            queryset = self.get_queryset()
            
            # Basic counts
            total = queryset.count()
            published = queryset.filter(is_published=True).count()
            featured = queryset.filter(is_featured=True).count()
            drafts = queryset.filter(is_published=False).count()
            
            # Recent guides (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent = queryset.filter(created_at__gte=thirty_days_ago).count()
            
            # Stats by category
            by_category = dict(
                queryset.values('category')
                .annotate(count=Count('category'))
                .values_list('category', 'count')
            )
            
            # Stats by target audience
            by_audience = dict(
                queryset.values('target_audience')
                .annotate(count=Count('target_audience'))
                .values_list('target_audience', 'count')
            )
            
            # Attachment stats
            total_attachments = sum(guide.attachment_count for guide in queryset)
            
            # Guides with attachments
            guides_with_attachments = sum(1 for guide in queryset if guide.has_attachments())
            
            stats_data = {
                'total': total,
                'published': published,
                'featured': featured,
                'drafts': drafts,
                'recent': recent,
                'total_attachments': total_attachments,
                'guides_with_attachments': guides_with_attachments,
                'by_category': by_category,
                'by_audience': by_audience,
            }
            
            return Response(stats_data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate stats: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a safety guide"""
        try:
            original = self.get_object()
            
            # Create a copy with modified title
            duplicate_data = {
                'title': f"{original.title} (Copy)",
                'title_rw': f"{original.title_rw} (Copy)" if original.title_rw else '',
                'title_fr': f"{original.title_fr} (Copy)" if original.title_fr else '',
                'content': original.content,
                'content_rw': original.content_rw or '',
                'content_fr': original.content_fr or '',
                'category': original.category,
                'target_audience': original.target_audience,
                'legacy_attachments': original.legacy_attachments,  # Copy legacy JSON attachments
                'is_featured': False,  # New copies shouldn't be featured
                'is_published': False,  # New copies should be drafts
                'display_order': (original.display_order or 0) + 1,
                'created_by': request.user if request.user.is_authenticated else None
            }
            
            # Copy attachment files (reference same files, don't duplicate)
            for i in range(1, 6):
                attachment = getattr(original, f'attachment_{i}')
                if attachment:
                    duplicate_data[f'attachment_{i}'] = attachment
                    duplicate_data[f'attachment_{i}_name'] = getattr(original, f'attachment_{i}_name', '')
                    duplicate_data[f'attachment_{i}_description'] = getattr(original, f'attachment_{i}_description', '')
            
            # Create the duplicate
            serializer = SafetyGuideCreateUpdateSerializer(data=duplicate_data)
            if serializer.is_valid():
                duplicate = serializer.save()
                
                # Copy disaster types relationship
                if original.disaster_types.exists():
                    duplicate.disaster_types.set(original.disaster_types.all())
                
                # Return full duplicate data
                response_serializer = SafetyGuideSerializer(duplicate, context={'request': request})
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to duplicate safety guide: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update safety guides"""
        try:
            guide_ids = request.data.get('guide_ids', [])
            update_data = request.data.get('update_data', {})
            
            if not guide_ids:
                return Response(
                    {'error': 'No guide IDs provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Filter to only guides the user can modify
            queryset = self.get_queryset().filter(id__in=guide_ids)
            
            # Add updated_by to update_data if user is authenticated
            if request.user.is_authenticated:
                update_data['updated_by'] = request.user
            
            # Perform bulk update
            updated_count = queryset.update(**update_data)
            
            return Response({
                'message': f'Successfully updated {updated_count} safety guides',
                'updated_count': updated_count,
                'total_requested': len(guide_ids)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Bulk update failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete safety guides"""
        try:
            guide_ids = request.data.get('guide_ids', [])
            
            if not guide_ids:
                return Response(
                    {'error': 'No guide IDs provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Filter to only guides the user can modify
            queryset = self.get_queryset().filter(id__in=guide_ids)
            deleted_count = queryset.count()
            
            # Delete the guides
            queryset.delete()
            
            return Response({
                'message': f'Successfully deleted {deleted_count} safety guides',
                'deleted_count': deleted_count,
                'total_requested': len(guide_ids)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Bulk delete failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export safety guides"""
        try:
            export_format = request.GET.get('export_format', 'json')
            queryset = self.get_queryset()
            
            if export_format.lower() == 'json':
                # Export as JSON
                serializer = SafetyGuideSerializer(queryset, many=True, context={'request': request})
                data = {
                    'export_date': timezone.now().isoformat(),
                    'total_count': queryset.count(),
                    'safety_guides': serializer.data
                }
                
                response = HttpResponse(
                    json.dumps(data, indent=2, ensure_ascii=False),
                    content_type='application/json'
                )
                response['Content-Disposition'] = f'attachment; filename="safety_guides_{timezone.now().strftime("%Y%m%d_%H%M%S")}.json"'
                return response
            
            elif export_format.lower() == 'csv':
                # Export as CSV
                import csv
                from io import StringIO
                
                output = StringIO()
                writer = csv.writer(output)
                
                # Write headers
                headers = [
                    'ID', 'Title', 'Category', 'Target Audience', 'Published', 
                    'Featured', 'Attachment Count', 'Created By', 'Created At'
                ]
                writer.writerow(headers)
                
                # Write data
                for guide in queryset:
                    writer.writerow([
                        guide.id,
                        guide.title,
                        guide.category,
                        guide.target_audience,
                        guide.is_published,
                        guide.is_featured,
                        guide.attachment_count,
                        guide.created_by.username if guide.created_by else '',
                        guide.created_at.isoformat()
                    ])
                
                response = HttpResponse(output.getvalue(), content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="safety_guides_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
                return response
            
            else:
                return Response(
                    {'error': 'Unsupported export format. Use "json" or "csv".'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Export failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reorder_attachments(self, request, pk=None):
        """Reorder attachments within a safety guide"""
        try:
            safety_guide = self.get_object()
            new_order = request.data.get('attachment_order', [])
            
            if not new_order or len(new_order) > 5:
                return Response(
                    {'error': 'attachment_order must be a list of 1-5 slot numbers'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Store current attachment data
            current_attachments = {}
            for i in range(1, 6):
                attachment = getattr(safety_guide, f'attachment_{i}')
                if attachment:
                    current_attachments[i] = {
                        'file': attachment,
                        'name': getattr(safety_guide, f'attachment_{i}_name', ''),
                        'description': getattr(safety_guide, f'attachment_{i}_description', '')
                    }
            
            # Clear all attachments
            for i in range(1, 6):
                setattr(safety_guide, f'attachment_{i}', None)
                setattr(safety_guide, f'attachment_{i}_name', '')
                setattr(safety_guide, f'attachment_{i}_description', '')
            
            # Reorder according to new_order
            for new_pos, old_slot in enumerate(new_order, 1):
                if old_slot in current_attachments:
                    attachment_data = current_attachments[old_slot]
                    setattr(safety_guide, f'attachment_{new_pos}', attachment_data['file'])
                    setattr(safety_guide, f'attachment_{new_pos}_name', attachment_data['name'])
                    setattr(safety_guide, f'attachment_{new_pos}_description', attachment_data['description'])
            
            safety_guide.save()
            
            return Response({
                'message': 'Attachments reordered successfully',
                'new_order': new_order,
                'attachment_count': safety_guide.attachment_count
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to reorder attachments: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
    
# https://www.youtube.com/watch?v=cpvFzFHZTXI    

class ChatViewSet(viewsets.ModelViewSet):
    """Chat management viewset"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get chat rooms for current user"""
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(user1=user) | Q(user2=user)
        ).select_related('user1', 'user2').order_by('-updated_at')
    
    def get_serializer_class(self):
        return ChatRoomSerializer
    
    @action(detail=False, methods=['get'])
    def available_users(self, request):
        """
        Get list of users available for chat.
        Citizens can only chat with operators and admins.
        Operators and admins can chat with anyone.
        """
        user = request.user
        
        if user.user_type == 'citizen':
            # Citizens can only chat with operators and admins
            users = User.objects.filter(
                user_type__in=['operator', 'admin'],
                is_active=True
            ).exclude(id=user.id).order_by('first_name', 'last_name', 'username')
            
        elif user.user_type in ['operator', 'admin']:
            # Operators and admins can chat with anyone
            users = User.objects.filter(
                is_active=True
            ).exclude(id=user.id).order_by('user_type', 'first_name', 'last_name', 'username')
            
        else:
            # Default: no users available
            users = User.objects.none()
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def start_chat(self, request):
        """Start or get existing chat with another user"""
        try:
            other_user_id = request.data.get('user_id')
            
            # Validation
            if not other_user_id:
                return Response({
                    'error': 'User ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the other user
            try:
                other_user = User.objects.get(id=other_user_id, is_active=True)
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if trying to chat with self
            if other_user == request.user:
                return Response({
                    'error': 'Cannot chat with yourself'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Permission check: Citizens can only chat with operators/admins
            if request.user.user_type == 'citizen':
                if other_user.user_type not in ['operator', 'admin']:
                    return Response({
                        'error': 'Citizens can only chat with operators and administrators'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            # Use atomic transaction to prevent race conditions
            with transaction.atomic():
                # Use the model method to get or create chat room
                chat_room = ChatRoom.get_or_create_chat_room(request.user, other_user)
            
            logger.info(f"Chat room accessed between {request.user.id} and {other_user_id}")
            
            serializer = ChatRoomSerializer(chat_room, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            logger.error(f"ValueError in start_chat: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Unexpected error in start_chat: {str(e)}", exc_info=True)
            return Response({
                'error': 'An unexpected error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages for a chat room"""
        try:
            chat_room = self.get_object()
            
            # Verify user has access to this chat room
            if request.user not in [chat_room.user1, chat_room.user2]:
                return Response({
                    'error': 'Access denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            messages = chat_room.messages.select_related('sender').order_by('timestamp')
            
            # Mark messages as read for current user (only messages from other user)
            unread_messages = messages.filter(is_read=False).exclude(sender=request.user)
            if unread_messages.exists():
                unread_messages.update(is_read=True)
            
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error getting messages: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to load messages'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message to a chat room"""
        try:
            chat_room = self.get_object()
            
            # Verify user has access to this chat room
            if request.user not in [chat_room.user1, chat_room.user2]:
                return Response({
                    'error': 'Access denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            content = request.data.get('content', '').strip()
            
            if not content:
                return Response({
                    'error': 'Message content is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate message length
            MAX_MESSAGE_LENGTH = 5000
            if len(content) > MAX_MESSAGE_LENGTH:
                return Response({
                    'error': f'Message too long (max {MAX_MESSAGE_LENGTH} characters)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create message
            message = Message.objects.create(
                chat_room=chat_room,
                sender=request.user,
                content=content
            )
            
            logger.info(f"Message sent by {request.user.id} to chat room {chat_room.id}")
            
            serializer = MessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to send message'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark all messages in chat room as read"""
        try:
            chat_room = self.get_object()
            
            # Verify user has access to this chat room
            if request.user not in [chat_room.user1, chat_room.user2]:
                return Response({
                    'error': 'Access denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Mark all unread messages from other user as read
            updated_count = chat_room.messages.filter(
                is_read=False
            ).exclude(sender=request.user).update(is_read=True)
            
            logger.info(f"Marked {updated_count} messages as read for user {request.user.id}")
            
            return Response({
                'message': f'{updated_count} messages marked as read',
                'count': updated_count
            })
            
        except Exception as e:
            logger.error(f"Error marking messages as read: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to mark messages as read'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Message management viewset - READ ONLY
    All message creation should go through ChatViewSet.send_message
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get messages for chat rooms user is part of"""
        user = self.request.user
        chat_rooms = ChatRoom.objects.filter(
            Q(user1=user) | Q(user2=user)
        )
        return Message.objects.filter(
            chat_room__in=chat_rooms
        ).select_related('sender', 'chat_room').order_by('-timestamp')

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_dashboard(request):
    """Get dashboard analytics"""
    time_range = request.GET.get('timeRange', 'today')
    
    # Calculate date range
    now = timezone.now()
    if time_range == 'today':
        start_date = now.replace(hour=0, minute=0, second=0)
    elif time_range == 'week':
        start_date = now - timedelta(days=7)
    else:  # month
        start_date = now - timedelta(days=30)
    
    # Get counts
    active_alerts = Alert.objects.filter(status='active').count()
    pending_incidents = IncidentReport.objects.filter(
        status__in=['submitted', 'under_review']
    ).count()
    resolved_today = IncidentReport.objects.filter(
        status='resolved',
        resolved_at__gte=start_date
    ).count()
    active_users = User.objects.filter(
        is_active=True,
        last_login__gte=now - timedelta(days=30)
    ).count()
    
    return Response({
        'active_alerts': active_alerts,
        'pending_incidents': pending_incidents,
        'resolved_today': resolved_today,
        'active_users': active_users,
        'avg_response_time': '8.5 min',  # Calculate based on your logic
        'alerts_change': 0,
        'incidents_change': 0,
        'resolved_change': 0,
        'users_change': 0
    })
