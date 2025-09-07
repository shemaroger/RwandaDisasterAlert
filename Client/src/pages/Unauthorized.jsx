// pages/Unauthorized.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, ArrowLeft, AlertTriangle, Phone, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Get information from route state if available
  const requiredRole = location.state?.requiredRole;
  const requiredRoles = location.state?.requiredRoles;
  const userRole = location.state?.userRole || user?.role;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
  };

  const getHomeRoute = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'operator':
        return '/operator/dashboard';
      case 'citizen':
        return '/citizen/dashboard';
      default:
        return '/dashboard';
    }
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
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
        {/* Access Denied Icon */}
        <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="text-red-600 w-10 h-10" />
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Access Restricted
        </h1>
        
        <p className="text-gray-600 mb-2">
          This page is restricted to <strong>{getRequiredRolesText()}</strong> only.
        </p>
        
        {userRole && (
          <p className="text-sm text-gray-500 mb-6">
            Your current role: <span className="font-medium capitalize">{getRoleDisplayName(userRole)}</span>
          </p>
        )}

        {/* Navigation Options */}
        <div className="space-y-3 mb-8">
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
          
          <Link
            to={getHomeRoute()}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to My Dashboard
          </Link>
          
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          )}
        </div>

        {/* Role Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-blue-800">Role-Based Access Control</h3>
              <p className="text-xs text-blue-700 mt-1">
                RwandaDisasterAlert uses role-based permissions to ensure system security. 
                Different user roles have access to specific features based on their responsibilities 
                in emergency management.
              </p>
            </div>
          </div>
        </div>

        {/* Access Request Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-yellow-800">Need Higher Access?</h3>
              <p className="text-xs text-yellow-700 mt-1">
                Contact your system administrator or MINEMA IT support to request role changes 
                or elevated permissions. All access changes require approval for security purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <Phone className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-red-800">Emergency Access</h3>
              <p className="text-xs text-red-700 mt-1">
                In case of emergency, call <strong>112</strong> for immediate assistance or 
                contact MINEMA Operations at <strong>+250-788-000-000</strong>
              </p>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-6 text-xs text-gray-500">
          <p>RwandaDisasterAlert - Emergency Management System</p>
          <p className="mt-1">© 2024 MINEMA - Ministry of Emergency Management</p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;