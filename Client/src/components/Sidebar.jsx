// components/Sidebar.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Bell, Users, Shield, MapPin, FileText, Settings, 
  Radio, Eye, BarChart3, Clock, Globe, MessageSquare, Home,
  X, ChevronDown, ChevronRight, Activity, Zap, Phone, Building2, BookOpen, Heart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  onQuickAction
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleQuickAction = (actionType) => {
    if (onQuickAction) {
      onQuickAction(actionType);
    } else {
      navigate('/admin/alerts', { state: { alertType: actionType } });
    }
  };

  // ---- ACTIVE PAGE DETECTION ----
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/admin/alerts') || path.includes('/alerts')) return 'alerts';
    if (path.includes('/incidents/citizen/reports')) return 'report-incident';   // NEW
    if (path.includes('/incidents/my-reports')) return 'my-reports';
    if (path.includes('/incidents')) return 'incidents';
    if (path.includes('/locations')) return 'locations';
    if (path.includes('/emergency-contacts')) return 'emergency-contacts';
    if (path.includes('/safety-guides')) return 'safety-guides';
    if (path.includes('/users')) return 'users';
    if (path.includes('/deliveries')) return 'deliveries';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/settings') || path.includes('/admin/settings')) return 'settings';
    if (path.includes('/audit')) return 'audit';
    if (path.includes('/templates') || path.includes('/notification-templates')) return 'templates';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/admin/disaster-types')) return 'disaster-types';
    if (path.includes('/deliveries') || path.includes('/admin/deliveries')) return 'deliveries';
    return 'dashboard';
  };

  // ---- NAV ITEMS ----
  const getNavigationItems = () => {
    const baseNavigation = [
      {
        name: 'Dashboard',
        id: 'dashboard',
        path: '/dashboard',
        icon: Home,
        description: 'Overview and statistics',
        userTypes: ['admin', 'operator', 'authority', 'citizen']
      }
    ];

    const alertNavigation = [
      {
        name: 'Emergency Alerts',
        id: 'alerts',
        path: '/admin/alerts', // admin hub
        icon: AlertTriangle,
        description: 'Create and manage alerts',
        badge: user?.user_type === 'admin' ? 'Admin' : null,
        userTypes: ['admin', 'authority', 'operator']
      }
    ];

    const incidentNavigation = [
      // Admin/ops can see management hub
      {
        name: 'Incident Reports',
        id: 'incidents',
        path: '/incidents',
        icon: FileText,
        description: 'Report and manage incidents',
        userTypes: ['admin', 'authority', 'operator', 'citizen']
      }
    ];

    const emergencyNavigation = [
      {
        name: 'Emergency Contacts',
        id: 'emergency-contacts',
        path: '/emergency-contacts',
        icon: Phone,
        description: 'Emergency services directory',
        userTypes: ['admin', 'authority', 'operator', 'citizen']
      },
      {
        name: 'Safety Guides',
        id: 'safety-guides',
        path: '/safety-guides',
        icon: BookOpen,
        description: 'Preparedness information',
        userTypes: ['admin', 'authority', 'operator', 'citizen']
      }
    ];

    const managementNavigation = [
      {
        name: 'User Management',
        id: 'users',
        path: '/users',
        icon: Users,
        description: 'Manage system users',
        userTypes: ['admin']
      },
      {
        name: 'Location Management',
        id: 'locations',
        path: '/locations',
        icon: MapPin,
        description: 'Rwanda districts and sectors',
        userTypes: ['admin', 'authority']
      },
      {
  name: 'Alert Deliveries',
  id: 'deliveries',
  path: '/admin/deliveries',
  icon: Radio,
  description: 'Monitor notification delivery status',
  userTypes: ['admin','operator']
}
    ];
    
    const analyticsNavigation = [
      {
        name: 'Analytics & Reports',
        id: 'analytics',
        path: '/analytics',
        icon: BarChart3,
        description: 'Performance metrics',
        userTypes: ['admin', 'authority', 'operator']
      },
      {
        name: 'Message Templates',
        id: 'templates',
        path: '/notification-templates',
        icon: MessageSquare,
        description: 'Notification templates',
        userTypes: ['admin', 'authority']
      }
    ];

    const adminNavigation = [
      {
        name: 'System Settings',
        id: 'settings',
        path: '/admin/settings',
        icon: Settings,
        description: 'System configuration',
        userTypes: ['admin']
      },
      {
        name: 'Disaster Types',
        id: 'disaster-types',
        path: '/admin/disaster-types',
        icon: Zap,
        description: 'Manage disaster categories',
        userTypes: ['admin', 'authority']
      },
      {
        name: 'System Health',
        id: 'health',
        path: '/system/health',
        icon: Activity,
        description: 'System status monitoring',
        userTypes: ['admin']
      }
    ];

    // Citizen-specific: add Report Incident + My Reports
    const citizenNavigation = [
      {
        name: 'Report Incident',
        id: 'report-incident',
        path: '/incidents/citizen/reports',   // NEW link matches your route
        icon: AlertTriangle,
        description: 'Submit a new incident',
        userTypes: ['citizen']
      },
      {
        name: 'My Reports',
        id: 'my-reports',
        path: '/incidents/my-reports',
        icon: FileText,
        description: 'Your incident reports',
        userTypes: ['citizen']
      },
      {
        name: 'My Alert Responses',
        id: 'my-responses',
        path: '/alerts/my-responses',
        icon: Bell,
        description: 'Your alert responses',
        userTypes: ['citizen']
      },
      {
        name: 'Profile & Settings',
        id: 'profile',
        path: '/profile',
        icon: Settings,
        description: 'Update your information',
        userTypes: ['citizen']
      }
    ];

    let navigation = [...baseNavigation];

    if (user?.user_type === 'admin' || user?.user_type === 'authority' || user?.user_type === 'operator') {
      navigation = [...navigation, ...alertNavigation];
    }

    navigation = [...navigation, ...incidentNavigation, ...emergencyNavigation];

    if (user?.user_type === 'admin' || user?.user_type === 'authority' || user?.user_type === 'operator') {
      navigation = [...navigation, ...managementNavigation, ...analyticsNavigation];
    }

    if (user?.user_type === 'admin') {
      navigation = [...navigation, ...adminNavigation];
    }

    if (user?.user_type === 'citizen') {
      navigation = [...navigation, ...citizenNavigation];
    }

    return navigation.filter(item => item.userTypes.includes(user?.user_type || 'citizen'));
  };

  const quickActions = [
    { 
      name: 'Emergency Alert', 
      action: 'emergency', 
      color: 'bg-red-600 hover:bg-red-700',
      icon: AlertTriangle,
      description: 'Send immediate emergency alert'
    },
    { 
      name: 'Weather Warning', 
      action: 'weather', 
      color: 'bg-yellow-600 hover:bg-yellow-700',
      icon: Activity,
      description: 'Weather-related alert'
    },
    { 
      name: 'Health Advisory', 
      action: 'health', 
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: Heart,
      description: 'Health emergency or advisory'
    }
  ];

  const navigationItems = getNavigationItems();
  const currentPage = getCurrentPage();

  return (
    <>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="bg-red-600 p-1.5 rounded-md">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">RwandaDisasterAlert</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {(user?.user_type === 'admin' || user?.user_type === 'authority') && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.action}
                    onClick={() => handleQuickAction(action.action)}
                    className={`w-full ${action.color} text-white text-sm py-2.5 px-3 rounded-md transition-colors flex items-center space-x-2 group`}
                    title={action.description}
                  >
                    <action.icon className="h-4 w-4" />
                    <span className="font-medium">{action.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {user?.user_type === 'citizen' && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Emergency Contacts
              </h3>
              <div className="space-y-2">
                <a 
                  href="tel:112" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 px-3 rounded-md transition-colors flex items-center space-x-2"
                >
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Call 112 - Emergency</span>
                </a>
                <a 
                  href="tel:+250788000000" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 px-3 rounded-md transition-colors flex items-center space-x-2"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">MINEMA Operations</span>
                </a>
              </div>
            </div>
          )}

          {user?.user_type === 'citizen' && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Safety Status
              </h3>
              <button
                onClick={() => handleNavigation('/alerts/respond')}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 px-3 rounded-md transition-colors flex items-center space-x-2"
              >
                <Activity className="h-4 w-4" />
                <span className="font-medium">Report I'm Safe</span>
              </button>
            </div>
          )}

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Navigation
            </h3>
            {navigationItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-red-50 border-r-2 border-red-600 text-red-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              System Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">SMS Gateway</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 text-xs">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Push Service</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 text-xs">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Email Service</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 text-xs">Operational</span>
                </div>
              </div>
              {user?.user_type === 'citizen' && user?.district && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Your District</span>
                  <span className="text-gray-900 text-xs font-medium">{user.district}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                {user?.user_type === 'admin' ? (
                  <Shield className="h-4 w-4 text-red-600" />
                ) : user?.user_type === 'authority' ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : user?.user_type === 'operator' ? (
                  <Users className="h-4 w-4 text-red-600" />
                ) : (
                  <Heart className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.user_type === 'admin' ? 'Administrator' :
                   user?.user_type === 'authority' ? 'Authority' :
                   user?.user_type === 'operator' ? 'Operator' : 'Citizen'}
                  {user?.district && ` • ${user.district}`}
                </p>
              </div>
            </div>
            {user?.is_verified !== undefined && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Status:</span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${user.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className={user.is_verified ? 'text-green-600' : 'text-yellow-600'}>
                    {user.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
