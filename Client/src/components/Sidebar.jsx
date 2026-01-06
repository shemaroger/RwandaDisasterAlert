// components/Sidebar.jsx - Updated with Citizen Export Option
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Bell, Users, Shield, MapPin, FileText, Settings, 
  Radio, Eye, BarChart3, Clock, Globe, MessageSquare, Home,
  X, ChevronDown, ChevronRight, Activity, Zap, Phone, Building2, BookOpen, Heart,
  List, Plus, Download, Edit, BookOpenCheck, Building, Layers, Map, Target, 
  CheckCircle, ArrowUp, Send, Search, Filter, AlertCircle, TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  onQuickAction,
  isMobile,
  isTablet
}) => {
  const { user, isAdmin, isLevelOrHigher, getUserAdminLevel } = useAuth();
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

  // Get user level info with Cell Level support
  const getUserLevelInfo = (userType) => {
    const levels = {
      citizen: { 
        label: 'Citizen', 
        icon: Users, 
        color: 'bg-blue-500/20', 
        textColor: 'text-blue-300', 
        borderColor: 'border-blue-500/30',
        level: 0 
      },
      village: { 
        label: 'Village Level', 
        icon: Home, 
        color: 'bg-green-500/20', 
        textColor: 'text-green-300',
        borderColor: 'border-green-500/30',
        level: 1 
      },
      cell: { 
        label: 'Cell Level', 
        icon: Building, 
        color: 'bg-teal-500/20', 
        textColor: 'text-teal-300',
        borderColor: 'border-teal-500/30',
        level: 2 
      },
      sector: { 
        label: 'Sector Level', 
        icon: Building2,
        color: 'bg-cyan-500/20',
        textColor: 'text-cyan-300',
        borderColor: 'border-cyan-500/30',
        level: 3
      },
      district: { 
        label: 'District Level', 
        icon: Layers, 
        color: 'bg-indigo-500/20', 
        textColor: 'text-indigo-300',
        borderColor: 'border-indigo-500/30',
        level: 4
      },
      province: { 
        label: 'Province Level', 
        icon: Map, 
        color: 'bg-purple-500/20', 
        textColor: 'text-purple-300',
        borderColor: 'border-purple-500/30',
        level: 5
      },
      national: { 
        label: 'National Level', 
        icon: Globe, 
        color: 'bg-red-500/20', 
        textColor: 'text-red-300',
        borderColor: 'border-red-500/30',
        level: 6
      },
      admin: { 
        label: 'System Admin', 
        icon: Shield, 
        color: 'bg-gray-500/20', 
        textColor: 'text-gray-300',
        borderColor: 'border-gray-500/30',
        level: 7
      }
    };
    return levels[userType] || levels.citizen;
  };

  // Get escalation target with Cell Level support
  const getEscalationTarget = (userType) => {
    const escalationMap = {
      village: 'Cell',
      cell: 'Sector',
      sector: 'District',
      district: 'Province',
      province: 'National',
      national: 'Central Command',
      admin: null,
      citizen: null
    };
    return escalationMap[userType];
  };

  // Check if user can access a navigation item
  const canAccessItem = (item) => {
    if (!item.requiredLevel) return true;
    if (isAdmin()) return true;
    
    if (Array.isArray(item.requiredLevel)) {
      return item.requiredLevel.includes(user?.user_type);
    }
    
    return user?.user_type === item.requiredLevel;
  };

  // Active page detection
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/admin/alerts') || path.includes('/alerts/create')) return 'alerts';
    if (path.includes('/alerts/my-responses')) return 'my-responses';
    if (path.includes('/incidents/citizen/reports')) return 'report-incident';
    if (path.includes('/incidents/citizen/my-reports')) return 'my-reports';
    if (path.includes('/incidents/admin/list')) return 'admin-incidents';
    if (path.includes('/incidents/export')) return 'incidents-export';
    if (path.includes('/incidents')) return 'incidents';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/locations')) return 'locations';
    if (path.includes('/emergency-contacts')) return 'emergency-contacts';
    if (path.includes('/safety-guides')) return 'safety-guides';
    if (path.includes('/users')) return 'users';
    if (path.includes('/deliveries')) return 'deliveries';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/settings') || path.includes('/admin/settings')) return 'settings';
    if (path.includes('/admin/disaster-types')) return 'disaster-types';
    return 'dashboard';
  };

  // Comprehensive nav items with Cell Level support
  const getAllNavigationItems = () => {
    const userType = user?.user_type;
    const escalationTarget = getEscalationTarget(userType);
    const adminLevel = getUserAdminLevel();

    return [
      // Dashboard
      {
        name: 'Dashboard',
        id: 'dashboard',
        path: userType === 'admin' ? '/admin/dashboard' :
              userType === 'citizen' ? '/citizen/dashboard' :
              userType === 'village' ? '/village/dashboard' :
              userType === 'cell' ? '/cell/dashboard' :
              userType === 'sector' ? '/sector/dashboard' :
              userType === 'district' ? '/district/dashboard' :
              userType === 'province' ? '/province/dashboard' :
              userType === 'national' ? '/national/dashboard' : '/dashboard',
        icon: userType === 'admin' ? Shield :
              userType === 'citizen' ? Home :
              userType === 'village' ? Home :
              userType === 'cell' ? Building :
              userType === 'sector' ? Building2 :
              userType === 'district' ? Layers :
              userType === 'province' ? Map :
              userType === 'national' ? Globe : Home,
        description: userType === 'admin' ? 'System overview' :
                    userType === 'citizen' ? 'Your dashboard' :
                    `${getUserLevelInfo(userType).label} dashboard`,
        requiredLevel: null
      },

      // Report Incident
      {
        name: 'Report Incident',
        id: 'report-incident',
        path: '/incidents/citizen/reports',
        icon: Plus,
        description: 'Submit a new incident report',
        badge: 'New',
        badgeColor: 'green',
        requiredLevel: null
      },

      // ✅ UPDATED: My Reports (Citizen) with Export sub-item
      {
        name: 'My Reports',
        id: 'my-reports',
        path: '/incidents/citizen/my-reports',
        icon: List,
        description: 'View your incident reports',
        requiredLevel: 'citizen',
        subItems: [
          {
            name: 'View Reports',
            path: '/incidents/citizen/my-reports',
            icon: List,
            description: 'View all your reports'
          },
          {
            name: 'Export My Data',
            path: '/incidents/export',
            icon: Download,
            description: 'Download your reports'
          }
        ]
      },

      // Incident Management (Admin Levels)
      {
        name: 'Incident Management',
        id: 'admin-incidents',
        path: '/incidents/admin/list',
        icon: FileText,
        description: userType === 'admin' ? 'System-wide incidents' :
                    `${getUserLevelInfo(userType).label} incidents`,
        badge: 'Staff',
        badgeColor: 'red',
        requiredLevel: ['admin', 'village', 'cell', 'sector', 'district', 'province', 'national'],
        subItems: [
          {
            name: 'All Incidents',
            path: '/incidents/admin/list',
            icon: List,
            description: 'All incidents at your level'
          },
          {
            name: 'Critical Priority',
            path: '/incidents/admin/list?priority=1',
            icon: AlertTriangle,
            description: 'Critical incidents',
            requiredLevel: ['admin', 'district', 'province', 'national']
          },
          {
            name: 'High Priority',
            path: '/incidents/admin/list?priority=2',
            icon: AlertCircle,
            description: 'High priority incidents',
            requiredLevel: ['admin', 'province', 'national']
          },
          {
            name: 'Pending Review',
            path: '/incidents/admin/list?status=pending',
            icon: Clock,
            description: 'Awaiting verification'
          },
          {
            name: 'In Progress',
            path: '/incidents/admin/list?status=in_progress',
            icon: Activity,
            description: 'Currently handling'
          },
          {
            name: userType === 'village' ? 'Escalated to Cell' :
                  userType === 'cell' ? 'From Villages' :
                  userType === 'sector' ? 'From Cells' :
                  userType === 'district' ? 'From Sectors' :
                  userType === 'province' ? 'From Districts' :
                  userType === 'national' ? 'From Provinces' : 'Escalated',
            path: userType === 'village' ? '/incidents/admin/list?escalated=true' :
                  userType === 'cell' ? '/incidents/admin/list?escalated_from=village' :
                  userType === 'sector' ? '/incidents/admin/list?escalated_from=cell' :
                  userType === 'district' ? '/incidents/admin/list?escalated_from=sector' :
                  userType === 'province' ? '/incidents/admin/list?escalated_from=district' :
                  userType === 'national' ? '/incidents/admin/list?escalated_from=province' :
                  '/incidents/admin/list?view=escalations',
            icon: ArrowUp,
            description: userType === 'village' ? `Sent to ${escalationTarget}` :
                        `Escalated from lower levels`,
            requiredLevel: ['admin', 'village', 'cell', 'sector', 'district', 'province', 'national']
          },
          {
            name: 'My Escalations',
            path: '/incidents/admin/list?escalated_by=me',
            icon: Send,
            description: `Incidents you escalated`,
            requiredLevel: ['village', 'cell', 'sector', 'district', 'province']
          },
          {
            name: 'Track Escalated',
            path: '/incidents/admin/list?escalated=true&track=true',
            icon: Search,
            description: 'Monitor escalated incidents',
            requiredLevel: ['admin', 'village', 'cell', 'sector', 'district', 'province', 'national']
          },
          {
            name: 'Resolved',
            path: '/incidents/admin/list?status=resolved',
            icon: CheckCircle,
            description: 'Completed incidents'
          },
          {
            name: 'Export Reports',
            path: '/incidents/export',
            icon: Download,
            description: userType === 'admin' ? 'Export all incident data' :
                        `Export ${getUserLevelInfo(userType).label} data`,
            requiredLevel: ['admin', 'village', 'cell', 'sector', 'district', 'province', 'national']
          }
        ]
      },

      // Alerts (District+)
      {
        name: 'Alerts',
        id: 'alerts',
        path: '/admin/alerts',
        icon: Bell,
        description: userType === 'national' ? 'National alert system' :
                    userType === 'province' ? 'Province alert management' :
                    userType === 'district' ? 'District alert management' :
                    'Alert management',
        badge: 'Staff',
        badgeColor: 'red',
        requiredLevel: ['admin', 'district', 'province', 'national']
      },

      {
        name: 'Create Alert',
        id: 'create-alert',
        path: '/admin/alerts/create',
        icon: Zap,
        description: userType === 'national' ? 'National alert' :
                    userType === 'province' ? 'Province-wide alert' :
                    userType === 'district' ? 'District alert' :
                    'Send new alert',
        requiredLevel: ['admin', 'district', 'province', 'national']
      },

      // Citizen Alerts
      {
        name: 'Active Alerts',
        id: 'my-responses',
        path: '/alerts/my-responses',
        icon: Bell,
        description: 'Your alert responses',
        requiredLevel: 'citizen'
      },

      // Analytics (District+)
      {
        name: 'Analytics',
        id: 'analytics',
        path: '/analytics',
        icon: BarChart3,
        description: userType === 'national' ? 'National analytics' :
                    userType === 'province' ? 'Provincial analytics' :
                    userType === 'district' ? 'District analytics' :
                    'Performance metrics',
        requiredLevel: ['admin', 'district', 'province', 'national']
      },

      // Safety Guides
      {
        name: 'Safety Guides',
        id: 'safety-guides',
        path: userType === 'citizen' ? '/safety-guides/public' : '/safety-guides',
        icon: userType === 'citizen' ? BookOpen : BookOpenCheck,
        description: userType === 'citizen' ? 'Preparedness information' : 'Manage safety guides',
        badge: userType === 'citizen' ? null : 'Staff',
        badgeColor: 'red',
        requiredLevel: null
      },

      // Disaster Types (District+)
      {
        name: 'Disaster Types',
        id: 'disaster-types',
        path: '/admin/disaster-types',
        icon: Target,
        description: 'Manage disaster categories',
        requiredLevel: ['admin', 'district', 'province', 'national']
      },

      // User Management
      {
        name: 'User Management',
        id: 'users',
        path: '/admin/users',
        icon: Users,
        description: 'Manage system users',
        badge: userType === 'admin' ? 'Admin' : 'Staff',
        badgeColor: 'red',
        requiredLevel: ['admin', 'national', 'province', 'district']
      },

      // Locations
      {
        name: 'Locations',
        id: 'locations',
        path: '/locations',
        icon: MapPin,
        description: 'Manage locations',
        badge: userType === 'admin' ? 'Admin' : 'Staff',
        badgeColor: 'red',
        requiredLevel: ['admin', 'national', 'province', 'district']
      },

      // Chat/Messages
      {
        name: 'Messages',
        id: 'chat',
        path: '/chat',
        icon: MessageSquare,
        description: userType === 'citizen' ? 'Chat with officials' :
                    escalationTarget ? `Coordinate with ${escalationTarget}` :
                    userType === 'national' ? 'National communication' :
                    'System communication',
        requiredLevel: null
      },
    ];
  };

  // Filter navigation items based on user access
  const getNavigationItems = () => {
    const allItems = getAllNavigationItems();
    
    return allItems
      .filter(item => canAccessItem(item))
      .map(item => {
        if (item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(subItem => 
              !subItem.requiredLevel || canAccessItem(subItem)
            )
          };
        }
        return item;
      });
  };

  const navigationItems = getNavigationItems();
  const currentPage = getCurrentPage();
  const userLevelInfo = getUserLevelInfo(user?.user_type);
  const UserLevelIcon = userLevelInfo.icon;
  const escalationTarget = getEscalationTarget(user?.user_type);

  return (
    <>
      {/* Backdrop for mobile/tablet */}
      {sidebarOpen && (isMobile || isTablet) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isMobile ? 'w-80' : isTablet ? 'w-72' : 'w-72'}`}>
        
        {/* Sidebar Container with Gradient Background - Full Height */}
        <div className="h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-r border-slate-700/50 flex flex-col">
          
          {/* Logo Header - Fixed at top */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-red-500 to-red-700 p-2.5 rounded-xl shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-white text-lg tracking-tight">MINEMA</span>
                  <span className="text-red-400 font-semibold text-sm">Alert</span>
                </div>
                <span className="text-slate-400 text-xs font-medium">Disaster Management</span>
              </div>
            </div>
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
            {/* User Level Badge */}
            <div className={`mx-4 my-3 p-3 rounded-lg ${userLevelInfo.color} border ${userLevelInfo.borderColor} backdrop-blur-sm flex-shrink-0`}>
              <div className="flex items-center space-x-2">
                <UserLevelIcon className={`h-5 w-5 ${userLevelInfo.textColor}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${userLevelInfo.textColor}`}>
                    {userLevelInfo.label}
                  </p>
                  <p className="text-xs text-slate-400">
                    Access Level {userLevelInfo.level}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Menu - Scrollable */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
              {navigationItems.length > 0 ? (
                navigationItems.map((item) => {
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
                          <item.icon className={`mr-3 h-5 w-5 transition-colors flex-shrink-0 ${
                            isActive ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-300'
                          }`} />
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{item.name}</span>
                              {item.badge && (
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                  item.badgeColor === 'green'
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>
                            )}
                          </div>
                        </button>
                        {hasSubItems && (
                          <button
                            onClick={() => toggleSection(item.id)}
                            className="p-2 text-slate-400 hover:text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors touch-manipulation flex-shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Sub-items */}
                      {hasSubItems && isExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.subItems.map((subItem, index) => (
                            <button
                              key={index}
                              onClick={() => handleNavigation(subItem.path)}
                              className="w-full group flex items-center px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all duration-200 touch-manipulation"
                            >
                              <subItem.icon className="mr-3 h-4 w-4 text-slate-500 group-hover:text-slate-400 flex-shrink-0" />
                              <div className="flex-1 text-left min-w-0">
                                <span className="truncate block">{subItem.name}</span>
                                {subItem.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 truncate">{subItem.description}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No navigation items available</p>
                </div>
              )}
            </nav>

            {/* Escalation Info */}
            {escalationTarget && (
              <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-orange-900/20 to-red-900/20 flex-shrink-0">
                <div className="flex items-center space-x-2 text-xs">
                  <ArrowUp className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 font-medium">Escalation Path</p>
                    <p className="text-slate-400 truncate">
                      Can escalate to: <span className="text-orange-400 font-semibold">{escalationTarget}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* User Profile */}
            <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${userLevelInfo.color} border ${userLevelInfo.borderColor} rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm flex-shrink-0`}>
                  <UserLevelIcon className={`h-5 w-5 ${userLevelInfo.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.username}
                  </p>
                  {user?.district && (
                    <p className="text-xs text-slate-500 truncate">
                      {user.district}
                    </p>
                  )}
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