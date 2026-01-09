// components/ProtectedRoute.jsx - Updated for Hierarchical Escalation System with Cell Level
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
  showUnauthorized = true,
  requireLevel = null, // New: specific level requirement
  requireLevelOrHigher = null // New: level or higher requirement
}) => {
  const { 
    user, 
    loading, 
    isAuthenticated, 
    hasUserType, 
    hasAnyUserType, 
    isInitialized,
    isLevelOrHigher,
    hasAdminLevel,
    debugUserInfo // Added for debugging
  } = useAuth();
  const location = useLocation();

  // Debug logging - can be removed in production
  React.useEffect(() => {
    if (requiredUserTypes.length > 0 && user) {
      console.log('🔍 ProtectedRoute Debug:');
      console.log('  - User Type:', user?.user_type);
      console.log('  - Required Types:', requiredUserTypes);
      console.log('  - hasAnyUserType result:', hasAnyUserType(requiredUserTypes));
      console.log('  - User object:', user);
    }
  }, [user, requiredUserTypes, hasAnyUserType]);

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
            Citizens have immediate access to essential features, while administrative 
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

  // Check hierarchical level requirement (level or higher)
  if (requireLevelOrHigher !== null && !isLevelOrHigher(requireLevelOrHigher)) {
    if (showUnauthorized) {
      return <UnauthorizedAccess 
        requiredLevel={requireLevelOrHigher} 
        userType={user?.user_type}
        requireLevelOrHigher={true}
      />;
    }
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location,
          requiredLevel: requireLevelOrHigher,
          userType: user?.user_type,
          requireLevelOrHigher: true
        }} 
        replace 
      />
    );
  }

  // Check specific level requirement (exact match)
  if (requireLevel !== null && !hasAdminLevel(requireLevel)) {
    if (showUnauthorized) {
      return <UnauthorizedAccess 
        requiredLevel={requireLevel} 
        userType={user?.user_type}
      />;
    }
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location,
          requiredLevel: requireLevel,
          userType: user?.user_type
        }} 
        replace 
      />
    );
  }

  // Check specific user type requirement
  if (requiredUserType !== null && !hasUserType(requiredUserType)) {
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
    console.log('Access denied - User type:', user?.user_type, 'not in', requiredUserTypes);
    
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
const UnauthorizedAccess = ({ 
  requiredUserType, 
  requiredUserTypes, 
  requiredLevel,
  userType,
  requireLevelOrHigher = false
}) => {
  const { logout, getUserType } = useAuth();

  const handleGoToDashboard = () => {
    // Get the normalized user type
    const normalizedUserType = getUserType();
    
    // Redirect based on user type with hierarchical levels including Cell
    switch (normalizedUserType) {
      case 'admin':
        window.location.href = '/admin/dashboard';
        break;
      case 'national':
        window.location.href = '/national/dashboard';
        break;
      case 'province':
        window.location.href = '/province/dashboard';
        break;
      case 'district':
        window.location.href = '/district/dashboard';
        break;
      case 'sector':
        window.location.href = '/sector/dashboard';
        break;
      case 'cell': // ✅ ADDED: Cell level
        window.location.href = '/cell/dashboard';
        break;
      case 'village':
        window.location.href = '/village/dashboard';
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

  const getUserTypeDisplayName = (userType) => {
    // Normalize user type for display
    const normalizedType = userType ? userType.toLowerCase() : userType;
    
    switch (normalizedType) {
      case 'admin':
        return 'System Administrator';
      case 'national':
        return 'National Level Administrator';
      case 'province':
        return 'Province Level Administrator';
      case 'district':
        return 'District Level Administrator';
      case 'sector':
        return 'Sector Level Administrator';
      case 'cell': // ✅ ADDED: Cell level display name
        return 'Cell Level Administrator';
      case 'village':
        return 'Village Level Administrator';
      case 'citizen':
        return 'Citizen';
      default:
        return userType || 'Unknown';
    }
  };

  const getRequiredUserTypesText = () => {
    if (requiredLevel) {
      const levelText = getUserTypeDisplayName(requiredLevel);
      return requireLevelOrHigher ? `${levelText} or higher` : levelText;
    }
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
          Your current access level: <span className="font-medium">{getUserTypeDisplayName(userType)}</span>
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

// Higher-order component for level-based access
export const withLevelAccess = (WrappedComponent, requiredLevel) => {
  return function LevelProtectedComponent(props) {
    return (
      <ProtectedRoute requireLevel={requiredLevel}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// Higher-order component for level or higher access
export const withLevelOrHigherAccess = (WrappedComponent, requiredLevel) => {
  return function LevelOrHigherProtectedComponent(props) {
    return (
      <ProtectedRoute requireLevelOrHigher={requiredLevel}>
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
    isCitizen,
    isVillageLevel,
    isCellLevel, // ✅ ADDED: Cell level check
    isSectorLevel,
    isDistrictLevel,
    isProvinceLevel,
    isNationalLevel,
    isAdministrativeLevel,
    isLevelOrHigher,
    canHandleIncidentAtLevel,
    canViewIncidentAtLevel,
    canEscalateIncidents,
    canResolveIncidents,
    canManageAlerts,
    canManageIncidents,
    canAssignIncidents,
    canViewAnalytics,
    debugUserInfo // Added for debugging
  } = useAuth();

  // Alert management permissions
  const canAccessAlerts = () => isAdministrativeLevel() || isAdmin();
  const canCreateAlerts = () => canManageAlerts();
  
  // User management permissions
  const canManageUsers = () => isAdmin();
  const canVerifyUsers = () => isAdmin();
  const canApproveAccounts = () => isAdmin();
  
  // System management permissions
  const canManageSystem = () => isAdmin();
  const canManageLocations = () => isAdmin();
  const canViewLocations = () => true; // All users can view locations
  
  // Analytics and reporting
  const canViewReports = () => canViewAnalytics();
  const canViewDeliveryReports = () => canViewAnalytics();
  // ✅ UPDATED: All admin levels can export data
  const canExportData = () => isAdministrativeLevel() || isAdmin();
  
  // Incident management permissions
  const canReportIncidents = () => true; // All authenticated users
  const canVerifyIncidents = () => isAdministrativeLevel() || isAdmin();
  const canCloseIncidents = () => canResolveIncidents();
  const canDeleteIncidents = () => isAdmin();
  const canEditAnyIncident = () => isAdmin() || isNationalLevel();
  
  // Communication permissions
  const canSendBulkNotifications = () => isLevelOrHigher('district');
  const canManageNotificationTemplates = () => isLevelOrHigher('district');
  const canSendTestNotifications = () => isAdministrativeLevel() || isAdmin();
  
  // Emergency resources
  const canAccessEmergencyContacts = () => true; // All authenticated users
  const canManageEmergencyContacts = () => isLevelOrHigher('sector');
  const canAccessSafetyGuides = () => true; // All authenticated users
  const canManageSafetyGuides = () => isLevelOrHigher('district');
  
  // Dashboard access
  const canAccessDashboard = () => true; // All authenticated users have some dashboard
  const canAccessAdminDashboard = () => isAdministrativeLevel() || isAdmin();
  const canAccessCitizenDashboard = () => isCitizen();
  
  // Level-specific permissions including Cell
  const canAccessVillageDashboard = () => isLevelOrHigher('village');
  const canAccessCellDashboard = () => isLevelOrHigher('cell'); // ✅ ADDED
  const canAccessSectorDashboard = () => isLevelOrHigher('sector');
  const canAccessDistrictDashboard = () => isLevelOrHigher('district');
  const canAccessProvinceDashboard = () => isLevelOrHigher('province');
  const canAccessNationalDashboard = () => isNationalLevel() || isAdmin();
  
  // Resource management - ✅ UPDATED: Cell level can manage resources
  const canManageResources = () => isLevelOrHigher('cell');
  const canDeployResources = () => isAdministrativeLevel() || isAdmin();
  const canRequestResources = () => isAdministrativeLevel() || isAdmin();
  
  // Coordination permissions - ✅ UPDATED: Cell level can coordinate
  const canCoordinateResponse = () => isAdministrativeLevel() || isAdmin();
  const canInitiateEvacuation = () => isLevelOrHigher('cell'); // ✅ UPDATED: Cell can initiate evacuations
  const canDeclareEmergency = () => isLevelOrHigher('sector'); // ✅ UPDATED: Sector+ can declare emergencies

  return {
    user,
    
    // Level checking functions
    isAdmin,
    isCitizen,
    isVillageLevel,
    isCellLevel, // ✅ ADDED
    isSectorLevel,
    isDistrictLevel,
    isProvinceLevel,
    isNationalLevel,
    isAdministrativeLevel,
    isLevelOrHigher,
    
    // Alert permissions
    canAccessAlerts,
    canCreateAlerts,
    canManageAlerts,
    
    // User management permissions
    canManageUsers,
    canVerifyUsers,
    canApproveAccounts,
    
    // System management
    canManageSystem,
    canManageLocations,
    canViewLocations,
    
    // Incident management
    canReportIncidents,
    canManageIncidents,
    canVerifyIncidents,
    canAssignIncidents,
    canEscalateIncidents,
    canResolveIncidents,
    canCloseIncidents,
    canDeleteIncidents,
    canEditAnyIncident,
    canHandleIncidentAtLevel,
    canViewIncidentAtLevel,
    
    // Analytics and reporting
    canViewAnalytics,
    canViewReports,
    canViewDeliveryReports,
    canExportData, // ✅ UPDATED: All admin levels can export
    
    // Communication
    canSendBulkNotifications,
    canManageNotificationTemplates,
    canSendTestNotifications,
    
    // Emergency resources
    canAccessEmergencyContacts,
    canManageEmergencyContacts,
    canAccessSafetyGuides,
    canManageSafetyGuides,
    
    // Dashboard access
    canAccessDashboard,
    canAccessAdminDashboard,
    canAccessCitizenDashboard,
    canAccessVillageDashboard,
    canAccessCellDashboard, // ✅ ADDED
    canAccessSectorDashboard,
    canAccessDistrictDashboard,
    canAccessProvinceDashboard,
    canAccessNationalDashboard,
    
    // Resource management
    canManageResources,
    canDeployResources,
    canRequestResources,
    
    // Coordination
    canCoordinateResponse,
    canInitiateEvacuation,
    canDeclareEmergency,
    
    // Core functions
    hasUserType,
    hasAnyUserType,
    
    // Debug function
    debugUserInfo,
    
    // Legacy functions for backward compatibility
    hasRole: hasUserType,
    hasAnyRole: hasAnyUserType,
    isOperator: isAdministrativeLevel, // Legacy
    isAuthority: () => isLevelOrHigher('district') // Legacy
  };
};

export default ProtectedRoute;