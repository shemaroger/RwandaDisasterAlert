// components/Sidebar.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Bell, Users, Shield, MapPin, FileText, Settings, 
  Radio, Eye, BarChart3, Clock, Globe, MessageSquare, Home,
  X, ChevronDown, ChevronRight, Activity, Zap, Phone, Building2, BookOpen, Heart,
  List, Plus, Download, Edit, BookOpenCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  onQuickAction,
  isMobile,
  isTablet
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
    if (isMobile || isTablet) setSidebarOpen(false);
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
    if (path.includes('/incidents/citizen/reports')) return 'report-incident';
    if (path.includes('/incidents/citizen/my-reports')) return 'my-reports';
    if (path.includes('/incidents/admin/list')) return 'admin-incidents';
    if (path.includes('/incidents/export')) return 'incidents-export';
    if (path.includes('/incidents')) return 'incidents';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/locations')) return 'locations';
    if (path.includes('/emergency-contacts')) return 'emergency-contacts';
    if (path.includes('/safety-guides/admin') || (path.includes('/safety-guides') && user?.user_type === 'admin')) return 'safety-guides-admin';
    if (path.includes('/safety-guides/public') || (path.includes('/safety-guides') && user?.user_type === 'citizen')) return 'safety-guides-public';
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
        userTypes: ['admin', 'operator', 'citizen']
      }
    ];

    const alertNavigation = [
      {
        name: 'Emergency Alerts',
        id: 'alerts',
        path: '/admin/alerts',
        icon: AlertTriangle,
        description: 'Create and manage alerts',
        badge: 'Staff',
        userTypes: ['admin', 'operator']
      }
    ];

    // Chat/Messages navigation - available to all users
    const chatNavigation = [
      {
        name: 'Messages',
        id: 'chat',
        path: '/chat',
        icon: MessageSquare,
        description: 'Chat with team members',
        userTypes: ['admin', 'operator', 'citizen']
      }
    ];

    // Updated incident navigation based on user type
    const getIncidentNavigation = () => {
      if (user?.user_type === 'citizen') {
        return [
          {
            name: 'Report Incident',
            id: 'report-incident',
            path: '/incidents/citizen/reports',
            icon: Plus,
            description: 'Submit a new incident report',
            userTypes: ['citizen']
          },
          {
            name: 'My Reports',
            id: 'my-reports',
            path: '/incidents/citizen/my-reports',
            icon: List,
            description: 'View your incident reports',
            userTypes: ['citizen']
          },
        ];
        
      } else {
        // Admin and Operator have same access
        return [
          {
            name: 'All Incidents',
            id: 'admin-incidents',
            path: '/incidents/admin/list',
            icon: FileText,
            description: 'View and manage all incidents',
            userTypes: ['admin', 'operator']
          },
        ];
      }
    };

    // Updated safety guides navigation based on user type
    const getSafetyGuidesNavigation = () => {
      if (user?.user_type === 'citizen') {
        return [
          {
            name: 'Safety Guides',
            id: 'safety-guides-public',
            path: '/safety-guides/public',
            icon: BookOpen,
            description: 'Preparedness information',
            userTypes: ['citizen']
          }
        ];
      } else {
        // Admin and Operator get admin interface
        return [
          {
            name: 'Safety Guides',
            id: 'safety-guides-admin',
            path: '/safety-guides',
            icon: BookOpenCheck,
            description: 'Manage safety guides',
            badge: 'Staff',
            userTypes: ['admin', 'operator'],
            subItems: [
              {
                name: 'All Guides',
                path: '/safety-guides',
                icon: List,
                description: 'View all safety guides'
              },
              {
                name: 'Create Guide',
                path: '/safety-guides/admin/create',
                icon: Plus,
                description: 'Create new safety guide'
              }
            ]
          }
        ];
      }
    };

    const managementNavigation = [
      {
        name: 'User Management',
        id: 'users',
        path: '/users',
        icon: Users,
        description: 'Manage system users',
        userTypes: ['admin', 'operator']
      },
    ];
    
    const analyticsNavigation = [
      {
        name: 'Analytics & Reports',
        id: 'analytics',
        path: '/analytics',
        icon: BarChart3,
        description: 'Performance metrics',
        userTypes: ['admin', 'operator']
      },
    ];

    const adminNavigation = [
      {
        name: 'Disaster Types',
        id: 'disaster-types',
        path: '/admin/disaster-types',
        icon: Zap,
        description: 'Manage disaster categories',
        userTypes: ['admin', 'operator']
      },
    ];

    // Citizen-specific additional navigation
    const citizenNavigation = [
      {
        name: 'Emergency Alert',
        id: 'my-responses',
        path: '/alerts/my-responses',
        icon: Bell,
        description: 'Your alert responses',
        userTypes: ['citizen']
      },
    ];

    let navigation = [...baseNavigation];

    // Add alerts for admin and operator
    if (user?.user_type === 'admin' || user?.user_type === 'operator') {
      navigation = [...navigation, ...alertNavigation];
    }

    // Add chat navigation for all users
    navigation = [...navigation, ...chatNavigation];

    // Add incident navigation based on user type
    navigation = [...navigation, ...getIncidentNavigation()];

    // Add safety guides navigation based on user type
    navigation = [...navigation, ...getSafetyGuidesNavigation()];

    // Add management navigation for admin and operator
    if (user?.user_type === 'admin' || user?.user_type === 'operator') {
      navigation = [...navigation, ...managementNavigation, ...analyticsNavigation, ...adminNavigation];
    }

    // Add citizen-specific navigation
    if (user?.user_type === 'citizen') {
      navigation = [...navigation, ...citizenNavigation];
    }

    return navigation.filter(item => item.userTypes.includes(user?.user_type || 'citizen'));
  };

  const quickActions = [
    { 
      name: 'Emergency Alert', 
      action: 'emergency', 
      color: 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl',
      icon: AlertTriangle,
      description: 'Send immediate emergency alert'
    },
    { 
      name: 'Weather Warning', 
      action: 'weather', 
      color: 'bg-amber-600 hover:bg-amber-700 shadow-lg hover:shadow-xl',
      icon: Activity,
      description: 'Weather-related alert'
    },
    { 
      name: 'Health Advisory', 
      action: 'health', 
      color: 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl',
      icon: Heart,
      description: 'Health emergency or advisory'
    }
  ];

  const navigationItems = getNavigationItems();
  const currentPage = getCurrentPage();

  return (
    <>
      {sidebarOpen && (isMobile || isTablet) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isMobile ? 'w-80' : isTablet ? 'w-72' : 'w-72'}`}>
        
        {/* Sidebar Container with Gradient Background - Full Height */}
        <div className="h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-r border-slate-700/50 flex flex-col">
          
          {/* Logo Header - Fixed at top */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="relative">
                <div className="bg-gradient-to-br from-red-500 to-red-700 p-2.5 rounded-xl shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              {/* Logo Text */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-white text-lg tracking-tight">MINEMA</span>
                  <span className="text-red-400 font-semibold text-sm">Alert</span>
                </div>
                <span className="text-slate-400 text-xs font-medium">Disaster Management</span>
              </div>
            </div>
            {/* Close Button for Mobile */}
            {(isMobile || isTablet) && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors touch-manipulation"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Navigation Menu - Scrollable */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
              {navigationItems.map((item) => {
                const isActive = currentPage === item.id;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedSections[item.id];
                
                return (
                  <div key={item.id}>
                    <div className="flex items-center">
                      <button
                        onClick={() => hasSubItems ? toggleSection(item.id) : handleNavigation(item.path)}
                        className={`flex-1 group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation ${
                          isActive
                            ? 'bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 text-red-300 shadow-lg backdrop-blur-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                        }`}
                      >
                        <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                          isActive ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-300'
                        }`} />
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </button>
                      {hasSubItems && (
                        <button
                          onClick={() => toggleSection(item.id)}
                          className="p-2 text-slate-400 hover:text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors touch-manipulation"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {hasSubItems && isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems.map((subItem, index) => (
                          <button
                            key={index}
                            onClick={() => handleNavigation(subItem.path)}
                            className="w-full group flex items-center px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all duration-200 touch-manipulation"
                          >
                            <subItem.icon className="mr-3 h-4 w-4 text-slate-500 group-hover:text-slate-400" />
                            <div className="flex-1 text-left">
                              <span>{subItem.name}</span>
                              {subItem.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{subItem.description}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* System Status - Fixed above user profile */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex-shrink-0">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                System Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">SMS Gateway</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
                    <span className="text-green-400 text-xs font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Push Service</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
                    <span className="text-green-400 text-xs font-medium">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Email Service</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
                    <span className="text-green-400 text-xs font-medium">Operational</span>
                  </div>
                </div>
                {user?.user_type === 'citizen' && user?.district && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Your District</span>
                    <span className="text-slate-200 text-xs font-medium">{user.district}</span>
                  </div>
                )}
              </div>
            </div>

            {/* User Profile - Fixed at bottom */}
            <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                  {user?.user_type === 'admin' || user?.user_type === 'operator' ? (
                    <Shield className="h-5 w-5 text-red-400" />
                  ) : (
                    <Heart className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate capitalize">
                    {user?.user_type === 'admin' ? 'Administrator' : user?.user_type === 'operator' ? 'Operator' : 'Citizen'}
                    {user?.district && ` • ${user.district}`}
                  </p>
                </div>
              </div>
              {user?.is_verified !== undefined && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Account Status:</span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full shadow-sm ${
                      user.is_verified 
                        ? 'bg-green-400 shadow-green-400/50' 
                        : 'bg-amber-400 shadow-amber-400/50'
                    }`}></div>
                    <span className={`font-medium ${
                      user.is_verified ? 'text-green-400' : 'text-amber-400'
                    }`}>
                      {user.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Sidebar;