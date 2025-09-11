// components/Sidebar.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Bell, Users, Shield, MapPin, FileText, Settings, 
  Radio, Eye, BarChart3, Clock, Globe, MessageSquare, Home,
  X, ChevronDown, ChevronRight, Activity, Zap, Phone, Building2
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
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleQuickAction = (actionType) => {
    if (onQuickAction) {
      onQuickAction(actionType);
    } else {
      // Default quick action behavior - navigate to alerts page
      navigate('/alerts/create', { state: { alertType: actionType } });
    }
  };

  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/alerts')) return 'alerts';
    if (path.includes('/incidents')) return 'incidents';
    if (path.includes('/distribution')) return 'distribution';
    if (path.includes('/geozones')) return 'geozones';
    if (path.includes('/subscribers')) return 'subscribers';
    if (path.includes('/shelters')) return 'shelters';
    if (path.includes('/monitoring')) return 'monitoring';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/channels')) return 'channels';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/audit')) return 'audit';
    if (path.includes('/integrations')) return 'integrations';
    if(path.includes('/user/management')) return 'management';
    return 'dashboard';
  };

  // Navigation structure based on user role
  const getNavigationItems = () => {
    const baseNavigation = [
      {
        name: 'Dashboard',
        id: 'dashboard',
        path: `/${user?.role || 'citizen'}/dashboard`,
        icon: Home,
        description: 'Overview and statistics',
        roles: ['admin', 'operator', 'citizen']
      },
      {
        name: 'Emergency Alerts',
        id: 'alerts',
        path: '/alerts',
        icon: AlertTriangle,
        description: 'Create and manage alerts',
        badge: user?.role === 'admin' ? 'Admin' : null,
        roles: ['admin', 'operator']
      },
      {
        name: 'Incident Reports',
        id: 'incidents',
        path: '/incidents',
        icon: FileText,
        description: 'Citizen reports and cases',
        roles: ['admin', 'operator', 'citizen']
      },
      {
        name: 'Alert Distribution',
        id: 'distribution',
        path: '/distribution',
        icon: Radio,
        description: 'SMS, Push, Email delivery',
        roles: ['admin', 'operator']
      },
      {
        name: 'Geographic Zones',
        id: 'geozones',
        path: '/geozones',
        icon: MapPin,
        description: 'Districts and targeting',
        roles: ['admin', 'operator']
      },
      {
        name: 'User Management',
        id: 'management',
        path: '/user/management',
        icon: Users,
        description: 'Manage system users',
        roles: ['admin', 'operator']
      },
      {
        name: 'Citizens & Subscribers',
        id: 'subscribers',
        path: '/subscribers',
        icon: Users,
        description: 'User management',
        roles: ['admin', 'operator']
      },
      {
        name: 'Emergency Shelters',
        id: 'shelters',
        path: '/shelters',
        icon: Shield,
        description: 'Safe areas and capacity',
        roles: ['admin', 'operator', 'citizen']
      },
      {
        name: 'Live Monitoring',
        id: 'monitoring',
        path: '/monitoring',
        icon: Eye,
        description: 'Real-time event tracking',
        roles: ['admin', 'operator']
      }
    ];

    const operatorNavigation = [
      {
        name: 'Analytics & Reports',
        id: 'analytics',
        path: '/analytics',
        icon: BarChart3,
        description: 'Performance metrics',
        roles: ['admin', 'operator']
      },
      {
        name: 'Communication Channels',
        id: 'channels',
        path: '/channels',
        icon: MessageSquare,
        description: 'SMS, Email, Push setup',
        roles: ['admin', 'operator']
      }
    ];

    const adminNavigation = [
      {
        name: 'System Settings',
        id: 'settings',
        path: '/admin/settings',
        icon: Settings,
        description: 'System configuration',
        roles: ['admin']
      },
      {
        name: 'Audit Logs',
        id: 'audit',
        path: '/admin/audit',
        icon: Clock,
        description: 'System activity logs',
        roles: ['admin']
      },
      {
        name: 'Integration Setup',
        id: 'integrations',
        path: '/admin/integrations',
        icon: Globe,
        description: 'Third-party services',
        roles: ['admin']
      }
    ];

    // Citizen-specific navigation
    const citizenNavigation = [
      {
        name: 'Safety Check-in',
        id: 'checkin',
        path: '/citizen/checkin',
        icon: Activity,
        description: 'Report your safety status',
        roles: ['citizen']
      },
      {
        name: 'Emergency Contacts',
        id: 'contacts',
        path: '/citizen/contacts',
        icon: Phone,
        description: 'Important phone numbers',
        roles: ['citizen']
      },
      {
        name: 'Profile & Settings',
        id: 'profile',
        path: '/citizen/profile',
        icon: Settings,
        description: 'Update your information',
        roles: ['citizen']
      }
    ];

    let navigation = [...baseNavigation];

    if (user?.role === 'operator' || user?.role === 'admin') {
      navigation = [...navigation, ...operatorNavigation];
    }

    if (user?.role === 'admin') {
      navigation = [...navigation, ...adminNavigation];
    }

    if (user?.role === 'citizen') {
      navigation = [...navigation, ...citizenNavigation];
    }

    // Filter navigation based on user role
    return navigation.filter(item => item.roles.includes(user?.role || 'citizen'));
  };

  const quickActions = [
    { 
      name: 'Emergency Broadcast', 
      action: 'emergency', 
      color: 'bg-red-600 hover:bg-red-700',
      icon: AlertTriangle,
      description: 'Send immediate alert'
    },
    { 
      name: 'Weather Alert', 
      action: 'weather', 
      color: 'bg-yellow-600 hover:bg-yellow-700',
      icon: Activity,
      description: 'Weather conditions'
    },
    { 
      name: 'Health Advisory', 
      action: 'health', 
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: Zap,
      description: 'Health emergency'
    }
  ];

  const navigationItems = getNavigationItems();
  const currentPage = getCurrentPage();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="bg-red-600 p-1.5 rounded-md">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Menu</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* Quick Actions */}
          {(user?.role === 'admin' || user?.role === 'operator') && (
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

          {/* Emergency Contacts for Citizens */}
          {user?.role === 'citizen' && (
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

          {/* Main Navigation */}
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

          {/* System Status */}
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
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-600 text-xs">Slow</span>
                </div>
              </div>
              {user?.role === 'citizen' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Your District</span>
                  <span className="text-gray-900 text-xs font-medium">{user?.district || 'Not Set'}</span>
                </div>
              )}
            </div>
          </div>

          {/* User Info Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                {user?.role === 'admin' ? (
                  <Shield className="h-4 w-4 text-red-600" />
                ) : user?.role === 'operator' ? (
                  <Users className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.role} {user?.district && `• ${user.district}`}
                </p>
              </div>
            </div>
            
            {/* Last seen / status for operators and admins */}
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Status:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">On Duty</span>
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