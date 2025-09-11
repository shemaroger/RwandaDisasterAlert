// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Shield, Clock } from 'lucide-react';

const ProtectedRoute = ({ 
  children, 
  requiredUserType = null, 
  requiredUserTypes = [],
  requireVerification = false,
  fallbackPath = '/login',
  showUnauthorized = true
}) => {
  const { user, loading, isAuthenticated, hasUserType, hasAnyUserType, isInitialized } = useAuth();
  const location = useLocation();

  // Show loading spinner while initializing auth
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
          <p className="text-sm text-gray-500 mt-2">RwandaDisasterAlert</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ 
          from: location,
          message: 'Please sign in to access this page.'
        }} 
        replace 
      />
    );
  }

  // Check if user account is verified (if required)
  if (requireVerification && user && !user.is_verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-yellow-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Verification Required</h2>
          <p className="text-gray-600 mb-6">
            Your account is currently being reviewed by MINEMA administrators. 
            Citizens have immediate access to essential features, while operator and authority 
            roles require verification for enhanced system access.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Check Verification Status
            </button>
            <button
              onClick={() => {
                const { logout } = useAuth();
                logout();
              }}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need immediate access?</strong><br />
              Contact MINEMA Emergency Operations: +250-788-000-000
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check specific user type requirement
  if (requiredUserType && !hasUserType(requiredUserType)) {
    if (showUnauthorized) {
      return <UnauthorizedAccess requiredUserType={requiredUserType} userType={user?.user_type} />;
    }
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location,
          requiredUserType,
          userType: user?.user_type
        }} 
        replace 
      />
    );
  }

  // Check multiple user types requirement
  if (requiredUserTypes.length > 0 && !hasAnyUserType(requiredUserTypes)) {
    if (showUnauthorized) {
      return <UnauthorizedAccess requiredUserTypes={requiredUserTypes} userType={user?.user_type} />;
    }
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location,
          requiredUserTypes,
          userType: user?.user_type
        }} 
        replace 
      />
    );
  }

  // All checks passed, render the protected component
  return children;
};

// Unauthorized Access Component
const UnauthorizedAccess = ({ requiredUserType, requiredUserTypes, userType }) => {
  const { logout } = useAuth();

  const handleGoToDashboard = () => {
    // Redirect based on user type
    switch (userType) {
      case 'admin':
        window.location.href = '/admin/dashboard';
        break;
      case 'operator':
        window.location.href = '/operator/dashboard';
        break;
      case 'citizen':
        window.location.href = '/dashboard';
        break;
      default:
        window.location.href = '/dashboard';
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getUserTypeDisplayName = (userType) => {
    switch (userType) {
      case 'admin':
        return 'Administrator';
      case 'operator':
        return 'Emergency Operator';
      case 'authority':
        return 'Emergency Authority';
      case 'citizen':
        return 'Citizen';
      default:
        return userType || 'Unknown';
    }
  };

  const getRequiredUserTypesText = () => {
    if (requiredUserType) {
      return getUserTypeDisplayName(requiredUserType);
    }
    if (requiredUserTypes && requiredUserTypes.length > 0) {
      return requiredUserTypes.map(getUserTypeDisplayName).join(' or ');
    }
    return 'authorized personnel';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="text-red-600 w-8 h-8" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-4">Access Restricted</h2>
        
        <p className="text-gray-600 mb-2">
          This page is restricted to <strong>{getRequiredUserTypesText()}</strong> only.
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          Your current access level: <span className="font-medium capitalize">{getUserTypeDisplayName(userType)}</span>
        </p>

        <div className="space-y-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to My Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-yellow-800">
                <strong>Need elevated access?</strong>
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Contact your system administrator or MINEMA IT support for role upgrade requests.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-red-800">
            <strong>Emergency Access:</strong> Call 112 or +250-788-000-000
          </p>
        </div>
      </div>
    </div>
  );
};

// Higher-order component for user type-based access
export const withUserTypeAccess = (WrappedComponent, requiredUserType) => {
  return function UserTypeProtectedComponent(props) {
    return (
      <ProtectedRoute requiredUserType={requiredUserType}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// Higher-order component for multiple user types access
export const withMultiUserTypeAccess = (WrappedComponent, requiredUserTypes) => {
  return function MultiUserTypeProtectedComponent(props) {
    return (
      <ProtectedRoute requiredUserTypes={requiredUserTypes}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// Legacy HOCs for backward compatibility
export const withRoleAccess = (WrappedComponent, requiredRole) => {
  console.warn('withRoleAccess is deprecated, use withUserTypeAccess instead');
  return withUserTypeAccess(WrappedComponent, requiredRole);
};

export const withMultiRoleAccess = (WrappedComponent, requiredRoles) => {
  console.warn('withMultiRoleAccess is deprecated, use withMultiUserTypeAccess instead');
  return withMultiUserTypeAccess(WrappedComponent, requiredRoles);
};

// Hook for checking permissions in components
export const usePermissions = () => {
  const { 
    user, 
    hasUserType, 
    hasAnyUserType, 
    isAdmin, 
    isOperator, 
    isAuthority, 
    isCitizen,
    canManageAlerts,
    canManageIncidents 
  } = useAuth();

  // Updated permission functions for RwandaDisasterAlert
  const canAccessAlerts = () => hasAnyUserType(['admin', 'authority', 'operator']);
  const canCreateAlerts = () => hasAnyUserType(['admin', 'authority']);
  const canManageUsers = () => hasUserType('admin');
  const canManageSystem = () => hasUserType('admin');
  const canViewAnalytics = () => hasAnyUserType(['admin', 'authority', 'operator']);
  const canReportIncidents = () => true; // All authenticated users
  const canAccessEmergencyContacts = () => true; // All authenticated users
  const canManageEmergencyContacts = () => hasAnyUserType(['admin', 'authority']);
  const canAccessSafetyGuides = () => true; // All authenticated users
  const canManageSafetyGuides = () => hasAnyUserType(['admin', 'authority']);
  const canVerifyIncidents = () => hasAnyUserType(['admin', 'authority', 'operator']);
  const canAssignIncidents = () => hasAnyUserType(['admin', 'authority', 'operator']);
  const canManageNotificationTemplates = () => hasAnyUserType(['admin', 'authority']);
  const canAccessDashboard = () => true; // All authenticated users have some dashboard
  const canViewDeliveryReports = () => hasAnyUserType(['admin', 'authority', 'operator']);
  const canSendTestNotifications = () => hasAnyUserType(['admin', 'authority']);

  // Location and district management
  const canManageLocations = () => hasUserType('admin');
  const canViewLocations = () => true; // All users can view locations
  
  // User verification and approval
  const canVerifyUsers = () => hasUserType('admin');
  const canApproveAccounts = () => hasUserType('admin');

  return {
    user,
    isAdmin,
    isOperator,
    isAuthority,
    isCitizen,
    
    // Core permissions
    canAccessAlerts,
    canCreateAlerts,
    canManageAlerts,
    canManageUsers,
    canManageIncidents,
    canVerifyIncidents,
    canAssignIncidents,
    canViewAnalytics,
    canManageSystem,
    canReportIncidents,
    canAccessEmergencyContacts,
    canManageEmergencyContacts,
    canAccessSafetyGuides,
    canManageSafetyGuides,
    canManageNotificationTemplates,
    canAccessDashboard,
    canViewDeliveryReports,
    canSendTestNotifications,
    
    // Location permissions
    canManageLocations,
    canViewLocations,
    
    // User management permissions
    canVerifyUsers,
    canApproveAccounts,
    
    // Core functions
    hasUserType,
    hasAnyUserType,
    
    // Legacy functions for backward compatibility
    hasRole: hasUserType,
    hasAnyRole: hasAnyUserType
  };
};

export default ProtectedRoute;