// pages/NotFound.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle, Phone, Search, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const getHomeRoute = () => {
    if (!isAuthenticated()) return '/login';
    
    switch (user?.role) {
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

  const getQuickLinks = () => {
    if (!isAuthenticated()) {
      return [
        { name: 'Sign In', path: '/login', icon: Home },
        { name: 'Create Account', path: '/signup', icon: Home },
        { name: 'Emergency Guide', path: '/emergency-guide', icon: AlertTriangle }
      ];
    }

    const commonLinks = [
      { name: 'Dashboard', path: getHomeRoute(), icon: Home },
      { name: 'Emergency Contacts', path: '/emergency/contacts', icon: Phone }
    ];

    if (user?.role === 'citizen') {
      return [
        ...commonLinks,
        { name: 'Report Incident', path: '/citizen/incidents/new', icon: AlertTriangle },
        { name: 'Find Shelters', path: '/citizen/shelters', icon: MapPin }
      ];
    }

    if (user?.role === 'operator' || user?.role === 'admin') {
      return [
        ...commonLinks,
        { name: 'Manage Alerts', path: '/alerts', icon: AlertTriangle },
        { name: 'View Incidents', path: '/incidents', icon: Search }
      ];
    }

    return commonLinks;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
        {/* 404 Visual */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-red-600 mb-2">404</div>
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Search className="text-red-600 w-10 h-10" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or may have been moved. 
          Use the links below to navigate to safety.
        </p>

        {/* Navigation Buttons */}
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
            Go to Dashboard
          </Link>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Quick Links
          </h3>
          
          <div className="grid grid-cols-1 gap-2">
            {getQuickLinks().map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="flex items-center justify-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <link.icon className="w-4 h-4 mr-2" />
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Emergency Information */}
        <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-left">
              <h4 className="text-sm font-medium text-red-800">Emergency Access</h4>
              <p className="text-xs text-red-700 mt-1">
                In case of emergency, call <strong>112</strong> or contact MINEMA at <strong>+250-788-000-000</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-500">
          © 2024 MINEMA - Ministry of Emergency Management
        </div>
      </div>
    </div>
  );
};

export default NotFound;