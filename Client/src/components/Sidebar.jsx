// components/Sidebar.jsx - Complete with Incident Creation & Escalation Tracking
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Bell, Users, Shield, MapPin, FileText, Settings, 
  Radio, Eye, BarChart3, Clock, Globe, MessageSquare, Home,
  X, ChevronDown, ChevronRight, Activity, Zap, Phone, Building2, BookOpen, Heart,
  List, Plus, Download, Edit, BookOpenCheck, Building, Layers, Map, Target, 
  CheckCircle, ArrowUp, Send, Search, Filter
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

  // Get user level info
  const getUserLevelInfo = (userType) => {
    const levels = {
      citizen: { label: 'Citizen', icon: Users, color: 'bg-blue-500/20', textColor: 'text-blue-300', level: 0 },
      village: { label: 'Village Level', icon: Home, color: 'bg-green-500/20', textColor: 'text-green-300', level: 1 },
      sector: { label: 'Sector Level', icon: Building, color: 'bg-teal-500/20', textColor: 'text-teal-300', level: 2 },
      district: { label: 'District Level', icon: Layers, color: 'bg-indigo-500/20', textColor: 'text-indigo-300', level: 3 },
      province: { label: 'Province Level', icon: Map, color: 'bg-purple-500/20', textColor: 'text-purple-300', level: 4 },
      national: { label: 'National Level', icon: Globe, color: 'bg-red-500/20', textColor: 'text-red-300', level: 5 },
      admin: { label: 'System Admin', icon: Shield, color: 'bg-gray-500/20', textColor: 'text-gray-300', level: 6 }
    };
    return levels[userType] || levels.citizen;
  };

  // Get escalation target
  const getEscalationTarget = (userType) => {
    const escalationMap = {
      village: 'Sector',
      sector: 'District',
      district: 'Province',
      province: 'National',
      national: 'Central Command',
      admin: null
    };
    return escalationMap[userType];
  };

  // ---- ACTIVE PAGE DETECTION ----
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
    if (path.includes('/safety-guides/admin') || (path.includes('/safety-guides') && user?.user_type !== 'citizen')) return 'safety-guides-admin';
    if (path.includes('/safety-guides/public') || (path.includes('/safety-guides') && user?.user_type === 'citizen')) return 'safety-guides-public';
    if (path.includes('/safety-guides')) return 'safety-guides';
    if (path.includes('/users')) return 'users';
    if (path.includes('/deliveries')) return 'deliveries';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/settings') || path.includes('/admin/settings')) return 'settings';
    if (path.includes('/admin/disaster-types')) return 'disaster-types';
    return 'dashboard';
  };

  // ---- NAV ITEMS ----
  const getNavigationItems = () => {
    const userType = user?.user_type;
    const escalationTarget = getEscalationTarget(userType);

    // Navigation for Citizens
    if (userType === 'citizen') {
      return [
        {
          name: 'Dashboard',
          id: 'dashboard',
          path: '/citizen/dashboard',
          icon: Home,
          description: 'Overview and statistics'
        },
        {
          name: 'Report Incident',
          id: 'report-incident',
          path: '/incidents/citizen/reports',
          icon: Plus,
          description: 'Submit a new incident report'
        },
        {
          name: 'My Reports',
          id: 'my-reports',
          path: '/incidents/citizen/my-reports',
          icon: List,
          description: 'View your incident reports'
        },
        {
          name: 'Active Alerts',
          id: 'my-responses',
          path: '/alerts/my-responses',
          icon: Bell,
          description: 'Your alert responses'
        },
        {
          name: 'Safety Guides',
          id: 'safety-guides-public',
          path: '/safety-guides/public',
          icon: BookOpen,
          description: 'Preparedness information'
        },
        {
          name: 'Safety Check-in',
          id: 'safety-checkin',
          path: '/citizen/safety/checkin',
          icon: Shield,
          description: 'Report your safety status'
        },
        {
          name: 'Messages',
          id: 'chat',
          path: '/chat',
          icon: MessageSquare,
          description: 'Chat with officials'
        },
        {
          name: 'Emergency Contacts',
          id: 'emergency-contacts',
          path: '/emergency-contacts',
          icon: Phone,
          description: 'Important contact numbers'
        }
      ];
    }

    // Navigation for Village Level
    if (userType === 'village') {
      return [
        {
          name: 'Dashboard',
          id: 'dashboard',
          path: '/village/dashboard',
          icon: Home,
          description: 'Village overview & statistics'
        },
        {
          name: 'Report Incident',
          id: 'report-incident',
          path: '/incidents/citizen/reports',
          icon: Plus,
          description: 'Create new incident report',
          badge: 'New'
        },
        {
          name: 'Incident Management',
          id: 'admin-incidents',
          path: '/incidents/admin/list',
          icon: FileText,
          description: 'View & manage incidents',
          badge: 'Staff',
          subItems: [
            {
              name: 'All Incidents',
              path: '/incidents/admin/list',
              icon: List,
              description: 'All village incidents'
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
              name: 'Escalated',
              path: '/incidents/admin/list?escalated=true',
              icon: ArrowUp,
              description: `Sent to ${escalationTarget}`
            },
            {
              name: 'Track Escalated',
              path: '/incidents/admin/list?escalated=true&track=true',
              icon: Search,
              description: 'Monitor escalated incidents'
            },
            {
              name: 'Resolved',
              path: '/incidents/admin/list?status=resolved',
              icon: CheckCircle,
              description: 'Completed incidents'
            }
          ]
        },
        {
          name: 'Safety Guides',
          id: 'safety-guides',
          path: '/safety-guides',
          icon: BookOpen,
          description: 'View safety information'
        },
        {
          name: 'Messages',
          id: 'chat',
          path: '/chat',
          icon: MessageSquare,
          description: `Coordinate with ${escalationTarget}`
        },
        {
          name: 'Emergency Contacts',
          id: 'emergency-contacts',
          path: '/emergency-contacts',
          icon: Phone,
          description: 'Contact information'
        }
      ];
    }

    // Navigation for Sector Level
    if (userType === 'sector') {
      return [
        {
          name: 'Dashboard',
          id: 'dashboard',
          path: '/sector/dashboard',
          icon: Building,
          description: 'Sector overview & analytics'
        },
        {
          name: 'Report Incident',
          id: 'report-incident',
          path: '/incidents/citizen/reports',
          icon: Plus,
          description: 'Create new incident report',
          badge: 'New'
        },
        {
          name: 'Incident Management',
          id: 'admin-incidents',
          path: '/incidents/admin/list',
          icon: FileText,
          description: 'Sector-wide incidents',
          badge: 'Staff',
          subItems: [
            {
              name: 'All Incidents',
              path: '/incidents/admin/list',
              icon: List,
              description: 'All sector incidents'
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
              name: 'From Villages',
              path: '/incidents/admin/list?escalated_from=village',
              icon: ArrowUp,
              description: 'Escalated from villages'
            },
            {
              name: 'My Escalations',
              path: '/incidents/admin/list?escalated_by=me',
              icon: Send,
              description: `Sent to ${escalationTarget}`
            },
            {
              name: 'Track Escalated',
              path: '/incidents/admin/list?escalated=true&track=true',
              icon: Search,
              description: 'Monitor escalated incidents'
            },
            {
              name: 'Resolved',
              path: '/incidents/admin/list?status=resolved',
              icon: CheckCircle,
              description: 'Completed incidents'
            }
          ]
        },
        {
          name: 'Safety Guides',
          id: 'safety-guides',
          path: '/safety-guides',
          icon: BookOpen,
          description: 'Safety information'
        },
        {
          name: 'Messages',
          id: 'chat',
          path: '/chat',
          icon: MessageSquare,
          description: `Coordinate with ${escalationTarget}`
        },
        {
          name: 'Emergency Contacts',
          id: 'emergency-contacts',
          path: '/emergency-contacts',
          icon: Phone,
          description: 'Contact information'
        }
      ];
    }

    // Navigation for District Level
    if (userType === 'district') {
      return [
        {
          name: 'Dashboard',
          id: 'dashboard',
          path: '/district/dashboard',
          icon: Layers,
          description: 'District command center'
        },
        {
          name: 'Report Incident',
          id: 'report-incident',
          path: '/incidents/citizen/reports',
          icon: Plus,
          description: 'Create new incident report',
          badge: 'New'
        },
        {
          name: 'Incident Management',
          id: 'admin-incidents',
          path: '/incidents/admin/list',
          icon: FileText,
          description: 'District-wide incidents',
          badge: 'Staff',
          subItems: [
            {
              name: 'All Incidents',
              path: '/incidents/admin/list',
              icon: List,
              description: 'All district incidents'
            },
            {
              name: 'Critical Priority',
              path: '/incidents/admin/list?priority=1',
              icon: AlertTriangle,
              description: 'Urgent incidents'
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
              name: 'From Sectors',
              path: '/incidents/admin/list?escalated_from=sector',
              icon: ArrowUp,
              description: 'Escalated from sectors'
            },
            {
              name: 'My Escalations',
              path: '/incidents/admin/list?escalated_by=me',
              icon: Send,
              description: `Sent to ${escalationTarget}`
            },
            {
              name: 'Track Escalated',
              path: '/incidents/admin/list?escalated=true&track=true',
              icon: Search,
              description: 'Monitor escalated incidents'
            },
            {
              name: 'Resolved',
              path: '/incidents/admin/list?status=resolved',
              icon: CheckCircle,
              description: 'Completed incidents'
            }
          ]
        },
        {
          name: 'Alerts',
          id: 'alerts',
          path: '/admin/alerts',
          icon: Bell,
          description: 'Manage district alerts',
          badge: 'Staff'
        },
        {
          name: 'Create Alert',
          id: 'create-alert',
          path: '/admin/alerts/create',
          icon: Zap,
          description: 'Send new alert'
        },
        {
          name: 'Analytics',
          id: 'analytics',
          path: '/analytics',
          icon: BarChart3,
          description: 'Performance metrics'
        },
        {
          name: 'Safety Guides',
          id: 'safety-guides-admin',
          path: '/safety-guides',
          icon: BookOpenCheck,
          description: 'Manage safety guides',
          badge: 'Staff'
        },
        {
          name: 'Disaster Types',
          id: 'disaster-types',
          path: '/admin/disaster-types',
          icon: Target,
          description: 'Manage disaster categories'
        },
        {
          name: 'Messages',
          id: 'chat',
          path: '/chat',
          icon: MessageSquare,
          description: `Coordinate with ${escalationTarget}`
        },
        {
          name: 'Emergency Contacts',
          id: 'emergency-contacts',
          path: '/emergency-contacts',
          icon: Phone,
          description: 'Contact directory'
        }
      ];
    }

    // Navigation for Province Level
    if (userType === 'province') {
      return [
        {
          name: 'Dashboard',
          id: 'dashboard',
          path: '/province/dashboard',
          icon: Map,
          description: 'Province command center'
        },
        {
          name: 'Report Incident',
          id: 'report-incident',
          path: '/incidents/citizen/reports',
          icon: Plus,
          description: 'Create new incident report',
          badge: 'New'
        },
        {
          name: 'Incident Management',
          id: 'admin-incidents',
          path: '/incidents/admin/list',
          icon: FileText,
          description: 'Province-wide incidents',
          badge: 'Staff',
          subItems: [
            {
              name: 'All Incidents',
              path: '/incidents/admin/list',
              icon: List,
              description: 'All province incidents'
            },
            {
              name: 'Critical Priority',
              path: '/incidents/admin/list?priority=1',
              icon: AlertTriangle,
              description: 'Urgent incidents'
            },
            {
              name: 'High Priority',
              path: '/incidents/admin/list?priority=2',
              icon: AlertTriangle,
              description: 'High priority incidents'
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
              name: 'From Districts',
              path: '/incidents/admin/list?escalated_from=district',
              icon: ArrowUp,
              description: 'Escalated from districts'
            },
            {
              name: 'My Escalations',
              path: '/incidents/admin/list?escalated_by=me',
              icon: Send,
              description: `Sent to ${escalationTarget}`
            },
            {
              name: 'Track Escalated',
              path: '/incidents/admin/list?escalated=true&track=true',
              icon: Search,
              description: 'Monitor all escalations'
            },
            {
              name: 'Resolved',
              path: '/incidents/admin/list?status=resolved',
              icon: CheckCircle,
              description: 'Completed incidents'
            }
          ]
        },
        {
          name: 'Alerts',
          id: 'alerts',
          path: '/admin/alerts',
          icon: Bell,
          description: 'Province alert management',
          badge: 'Staff'
        },
        {
          name: 'Create Alert',
          id: 'create-alert',
          path: '/admin/alerts/create',
          icon: Zap,
          description: 'Province-wide alert'
        },
        {
          name: 'Analytics',
          id: 'analytics',
          path: '/analytics',
          icon: BarChart3,
          description: 'Provincial analytics'
        },
        {
          name: 'Safety Guides',
          id: 'safety-guides-admin',
          path: '/safety-guides',
          icon: BookOpenCheck,
          description: 'Manage safety guides',
          badge: 'Staff'
        },
        {
          name: 'Disaster Types',
          id: 'disaster-types',
          path: '/admin/disaster-types',
          icon: Target,
          description: 'Disaster management'
        },
        {
          name: 'Messages',
          id: 'chat',
          path: '/chat',
          icon: MessageSquare,
          description: `Coordinate with ${escalationTarget}`
        },
        {
          name: 'Emergency Contacts',
          id: 'emergency-contacts',
          path: '/emergency-contacts',
          icon: Phone,
          description: 'Contact directory'
        }
      ];
    }

    // Navigation for National Level
    if (userType === 'national') {
      return [
        {
          name: 'National Command',
          id: 'dashboard',
          path: '/national/dashboard',
          icon: Globe,
          description: 'National command center'
        },
        {
          name: 'Incident Management',
          id: 'admin-incidents',
          path: '/incidents/admin/list',
          icon: FileText,
          description: 'Nationwide incidents',
          badge: 'Staff',
          subItems: [
            {
              name: 'All Incidents',
              path: '/incidents/admin/list',
              icon: List,
              description: 'All national incidents'
            },
            {
              name: 'Critical Priority',
              path: '/incidents/admin/list?priority=1',
              icon: AlertTriangle,
              description: 'Critical national incidents'
            },
            {
              name: 'High Priority',
              path: '/incidents/admin/list?priority=2',
              icon: AlertTriangle,
              description: 'High priority incidents'
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
              name: 'From Provinces',
              path: '/incidents/admin/list?escalated_from=province',
              icon: ArrowUp,
              description: 'Escalated from provinces'
            },
            {
              name: 'Track All Escalations',
              path: '/incidents/admin/list?track_all=true',
              icon: Search,
              description: 'Monitor all nationwide escalations'
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
              description: 'Download incident data'
            }
          ]
        },
        {
          name: 'National Alerts',
          id: 'alerts',
          path: '/admin/alerts',
          icon: Bell,
          description: 'National alert system',
          badge: 'Staff'
        },
        {
          name: 'Create Alert',
          id: 'create-alert',
          path: '/admin/alerts/create',
          icon: Zap,
          description: 'National alert'
        },
        {
          name: 'Analytics',
          id: 'analytics',
          path: '/analytics',
          icon: BarChart3,
          description: 'National analytics'
        },
        {
          name: 'Safety Guides',
          id: 'safety-guides-admin',
          path: '/safety-guides',
          icon: BookOpenCheck,
          description: 'Manage safety guides',
          badge: 'Staff'
        },
        {
          name: 'Disaster Types',
          id: 'disaster-types',
          path: '/admin/disaster-types',
          icon: Target,
          description: 'Disaster management'
        },
        {
          name: 'Messages',
          id: 'chat',
          path: '/chat',
          icon: MessageSquare,
          description: 'National communication'
        },
        {
          name: 'Emergency Contacts',
          id: 'emergency-contacts',
          path: '/emergency-contacts',
          icon: Phone,
          description: 'Contact directory'
        }
      ];
    }

    // Navigation for Admin (System Administrator)
    if (userType === 'admin') {
      return [
        {
          name: 'Dashboard',
          id: 'dashboard',
          path: '/admin/dashboard',
          icon: Shield,
          description: 'System overview'
        },
        {
          name: 'User Management',
          id: 'users',
          path: '/admin/users',
          icon: Users,
          description: 'Manage system users',
          badge: 'Admin'
        },
        {
          name: 'Incident Management',
          id: 'admin-incidents',
          path: '/incidents/admin/list',
          icon: FileText,
          description: 'System-wide incidents',
          badge: 'Admin',
          subItems: [
            {
              name: 'All Incidents',
              path: '/incidents/admin/list',
              icon: List,
              description: 'All system incidents'
            },
            {
              name: 'Critical',
              path: '/incidents/admin/list?priority=1',
              icon: AlertTriangle,
              description: 'Critical incidents'
            },
            {
              name: 'Pending',
              path: '/incidents/admin/list?status=pending',
              icon: Clock,
              description: 'Awaiting action'
            },
            {
              name: 'All Escalations',
              path: '/incidents/admin/list?view=escalations',
              icon: Filter,
              description: 'View escalation flow'
            },
            {
              name: 'Export',
              path: '/incidents/export',
              icon: Download,
              description: 'Export data'
            }
          ]
        },
        {
          name: 'Alerts',
          id: 'alerts',
          path: '/admin/alerts',
          icon: Bell,
          description: 'Alert management',
          badge: 'Admin'
        },
        {
          name: 'Analytics',
          id: 'analytics',
          path: '/analytics',
          icon: BarChart3,
          description: 'System analytics'
        },
        {
          name: 'Locations',
          id: 'locations',
          path: '/locations',
          icon: MapPin,
          description: 'Manage locations',
          badge: 'Admin'
        },
        {
          name: 'Safety Guides',
          id: 'safety-guides-admin',
          path: '/safety-guides',
          icon: BookOpenCheck,
          description: 'Manage safety guides'
        },
        {
          name: 'Disaster Types',
          id: 'disaster-types',
          path: '/admin/disaster-types',
          icon: Target,
          description: 'Disaster categories'
        },
        {
          name: 'Messages',
          id: 'chat',
          path: '/chat',
          icon: MessageSquare,
          description: 'System communication'
        },
        {
          name: 'System Settings',
          id: 'settings',
          path: '/admin/settings',
          icon: Settings,
          description: 'System configuration',
          badge: 'Admin'
        }
      ];
    }

    // Default to empty if user type is unknown
    return [];
  };

  const navigationItems = getNavigationItems();
  const currentPage = getCurrentPage();
  const userLevelInfo = getUserLevelInfo(user?.user_type);
  const UserLevelIcon = userLevelInfo.icon;
  const escalationTarget = getEscalationTarget(user?.user_type);

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
                          <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                            isActive ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-300'
                          }`} />
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <span>{item.name}</span>
                              {item.badge && (
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.badge === 'New' 
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
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
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No navigation items available</p>
                </div>
              )}
            </nav>

            {/* Escalation Info - Fixed above system status */}
            {escalationTarget && (
              <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-orange-900/20 to-red-900/20 flex-shrink-0">
                <div className="flex items-center space-x-2 text-xs">
                  <ArrowUp className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-300 font-medium">Escalation Path</p>
                    <p className="text-slate-400">Can escalate to: <span className="text-orange-400 font-semibold">{escalationTarget}</span></p>
                  </div>
                </div>
              </div>
            )}

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
                {user?.district && (
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
                <div className={`w-10 h-10 ${userLevelInfo.color} border border-red-500/30 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm`}>
                  <UserLevelIcon className={`h-5 w-5 ${userLevelInfo.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {userLevelInfo.label}
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
