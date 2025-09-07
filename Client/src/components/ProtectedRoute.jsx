// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Shield, Clock } from 'lucide-react';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = [],
  requireApproval = true,
  fallbackPath = '/login',
  showUnauthorized = true
}) => {
  const { user, loading, isAuthenticated, hasRole, hasAnyRole, isInitialized } = useAuth();
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

  // Check if user account is approved (if required)
  if (requireApproval && user && !user.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-yellow-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your account is currently being reviewed by MINEMA administrators. 
            You will receive access once your account has been approved.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Check Status
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

  // Check specific role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    if (showUnauthorized) {
      return <UnauthorizedAccess requiredRole={requiredRole} userRole={user?.role} />;
    }
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location,
          requiredRole,
          userRole: user?.role
        }} 
        replace 
      />
    );
  }

  // Check multiple roles requirement
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    if (showUnauthorized) {
      return <UnauthorizedAccess requiredRoles={requiredRoles} userRole={user?.role} />;
    }
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location,
          requiredRoles,
          userRole: user?.role
        }} 
        replace 
      />
    );
  }

  // All checks passed, render the protected component
  return children;
};

// Unauthorized Access Component
const UnauthorizedAccess = ({ requiredRole, requiredRoles, userRole }) => {
  const { logout } = useAuth();

  const handleGoToDashboard = () => {
    // Redirect based on user role
    switch (userRole) {
      case 'admin':
        window.location.href = '/admin/dashboard';
        break;
      case 'operator':
        window.location.href = '/operator/dashboard';
        break;
      case 'citizen':
        window.location.href = '/citizen/dashboard';
        break;
      default:
        window.location.href = '/dashboard';
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'operator':
        return 'Emergency Operator';
      case 'citizen':
        return 'Citizen';
      default:
        return role;
    }
  };

  const getRequiredRolesText = () => {
    if (requiredRole) {
      return getRoleDisplayName(requiredRole);
    }
    if (requiredRoles && requiredRoles.length > 0) {
      return requiredRoles.map(getRoleDisplayName).join(' or ');
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
          This page is restricted to <strong>{getRequiredRolesText()}</strong> only.
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          Your current role: <span className="font-medium capitalize">{getRoleDisplayName(userRole)}</span>
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

// Higher-order component for role-based access
export const withRoleAccess = (WrappedComponent, requiredRole) => {
  return function RoleProtectedComponent(props) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// Higher-order component for multiple roles access
export const withMultiRoleAccess = (WrappedComponent, requiredRoles) => {
  return function MultiRoleProtectedComponent(props) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// Hook for checking permissions in components
export const usePermissions = () => {
  const { user, hasRole, hasAnyRole, isAdmin, isOperator, isCitizen } = useAuth();

  const canAccessAlerts = () => hasAnyRole(['admin', 'operator']);
  const canManageUsers = () => hasRole('admin');
  const canManageIncidents = () => hasAnyRole(['admin', 'operator']);
  const canViewAnalytics = () => hasAnyRole(['admin', 'operator']);
  const canManageSystem = () => hasRole('admin');
  const canReportIncidents = () => true; // All authenticated users
  const canAccessShelters = () => true; // All authenticated users can view shelters
  const canManageShelters = () => hasAnyRole(['admin', 'operator']);

  return {
    user,
    isAdmin,
    isOperator,
    isCitizen,
    canAccessAlerts,
    canManageUsers,
    canManageIncidents,
    canViewAnalytics,
    canManageSystem,
    canReportIncidents,
    canAccessShelters,
    canManageShelters,
    hasRole,
    hasAnyRole
  };
};

export default ProtectedRoute;