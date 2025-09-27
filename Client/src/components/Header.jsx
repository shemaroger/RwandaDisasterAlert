// components/Header.jsx - Updated for RwandaDisasterAlert system
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Menu, ChevronDown, User, LogOut, 
  Globe, Settings as SettingsIcon, Search, 
  Clock, MapPin, Users, X, Shield, AlertTriangle, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  currentPage, 
  notifications = [],
  onLanguageChange,
  showSearch = false,
  onSearch,
  appName = "MINEMA Alert",
  appDescription = "Emergency Management System",
  appIcon: AppIcon = AlertTriangle,
  showDateTime = true,
  showStatus = true,
  primaryColor = "red",
  isMobile,
  isTablet
}) => {
  const { user, logout, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(user?.preferred_language || 'en');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const emergencyCount = notifications.filter(n => n.type === 'emergency' && !n.read).length;

  // Color theme configuration - Updated for modern gradient design
  const colorThemes = {
    red: {
      primary: 'bg-gradient-to-r from-red-600 to-red-700',
      primaryHover: 'hover:from-red-700 hover:to-red-800',
      primaryLight: 'bg-red-50 border-red-200',
      primaryText: 'text-red-700',
      focusRing: 'focus:ring-red-500 focus:border-red-500',
      gradient: 'from-red-500 to-red-600',
      badge: 'bg-red-500'
    }
  };

  const theme = colorThemes[primaryColor] || colorThemes.red;

  // Update time every minute
  useEffect(() => {
    if (showDateTime) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [showDateTime]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns when sidebar opens on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setShowNotifications(false);
      setShowProfile(false);
    }
  }, [isMobile, sidebarOpen]);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  const handleLogout = async () => {
    try {
      setShowProfile(false);
      console.log('Header: Starting logout process');
      
      const logoutResult = await logout();
      
      if (logoutResult && logoutResult.success) {
        console.log('Header: Logout successful, redirecting to:', logoutResult.redirectTo);
        navigate(logoutResult.redirectTo, {
          replace: true,
          state: { message: logoutResult.message }
        });
      } else {
        console.log('Header: Logout completed, redirecting to login');
        navigate('/login', {
          replace: true,
          state: { message: 'You have been signed out successfully.' }
        });
      }
    } catch (error) {
      console.error('Header: Logout error:', error);
      navigate('/login', { 
        replace: true,
        state: { message: 'You have been signed out.' }
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Updated language options for Rwanda
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' }
  ];

  const getStatusColor = () => {
    if (user?.status === 'active') return 'bg-green-100 text-green-700 border-green-200';
    if (user?.status === 'busy') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (user?.status === 'away') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getUserTypeIcon = () => {
    switch (user?.user_type) {
      case 'admin':
        return Shield;
      case 'authority':
        return AlertTriangle;
      case 'operator':
        return Users;
      case 'citizen':
        return User;
      default:
        return User;
    }
  };

  const getUserTypeDisplayName = (userType) => {
    switch (userType) {
      case 'admin':
        return 'Administrator';
      case 'authority':
        return 'Emergency Authority';
      case 'operator':
        return 'Emergency Operator';
      case 'citizen':
        return 'Citizen';
      default:
        return userType || 'User';
    }
  };

  const UserTypeIcon = getUserTypeIcon();

  const getSystemStatus = () => {
    return {
      status: 'operational',
      color: 'bg-green-500',
      text: 'All Systems Operational'
    };
  };

  const systemStatus = getSystemStatus();

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-slate-200/60 sticky top-0 z-[100]">
      <div className={`flex items-center justify-between px-3 sm:px-4 lg:px-6 ${isMobile ? 'py-2' : 'py-3'}`}>
        
        {/* Left section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 touch-manipulation"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Current Time & System Status - Desktop only */}
          {(showDateTime || showStatus) && !isMobile && !isTablet && (
            <div className="hidden lg:flex items-center space-x-4 ml-6 pl-6 border-l border-slate-200">
              {showDateTime && (
                <div className="text-center bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-sm font-semibold text-slate-900">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(currentTime)}
                  </div>
                </div>
              )}
              {showStatus && (
                <div className="flex items-center space-x-2 bg-green-50 rounded-lg px-3 py-2">
                  <div className={`w-2 h-2 ${systemStatus.color} rounded-full animate-pulse shadow-sm shadow-green-500/50`}></div>
                  <span className="text-xs font-medium text-green-700">{systemStatus.text}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center section - Search or Page Title */}
        <div className={`${isMobile ? 'hidden' : 'hidden md:block'} flex-1 max-w-md mx-8`}>
          {showSearch ? (
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents, alerts, users..."
                className={`w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl ${theme.focusRing} text-sm bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200`}
              />
            </form>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800 capitalize">
                {currentPage?.replace('-', ' ') || 'Dashboard'}
              </h2>
              {user?.district && (
                <p className="text-sm text-slate-500 flex items-center justify-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {user.district.name || user.district}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Selector - Hidden on mobile */}
          <div className={`${isMobile ? 'hidden' : 'relative'}`}>
            <select 
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={`appearance-none bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none ${theme.focusRing} cursor-pointer transition-all duration-200 hover:bg-slate-100`}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {isMobile ? lang.code.toUpperCase() : `${lang.flag} ${lang.code.toUpperCase()}`}
                </option>
              ))}
            </select>
            <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Notifications */}
          <div className="relative z-[200]" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 touch-manipulation"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              {unreadCount > 0 && (
                <span className={`absolute -top-1 -right-1 ${theme.badge} text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse shadow-lg`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {emergencyCount > 0 && (
                <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
              )}
            </button>

            {showNotifications && (
              <div className={`fixed right-4 top-16 ${isMobile ? 'w-80 max-w-[90vw]' : 'w-80'} bg-white rounded-xl shadow-2xl border border-slate-200 z-[9999] backdrop-blur-sm`}>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                  <h3 className="text-sm font-bold text-slate-900">Emergency Notifications</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <span className={`text-xs ${theme.primaryText} ${theme.primaryLight} px-2 py-1 rounded-full font-bold`}>
                        {unreadCount} new
                      </span>
                    )}
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-slate-200 rounded-lg transition-colors touch-manipulation"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${!notification.read ? `bg-red-50 border-l-4 border-l-red-500` : ''}`}>
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                            notification.type === 'emergency' ? 'bg-red-100 text-red-600' :
                            notification.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                            <p className="text-sm text-slate-600 line-clamp-2 mt-1">{notification.message}</p>
                            <div className="flex items-center mt-2 space-x-3 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{notification.time}</span>
                              </div>
                              {notification.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{notification.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <Bell className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-medium">No notifications</p>
                      <p className="text-xs text-slate-400 mt-1">All systems operational</p>
                    </div>
                  )}
                </div>
                {notifications.length > 5 && (
                  <div className="p-3 border-t border-slate-200 text-center bg-slate-50 rounded-b-xl">
                    <button className={`text-sm ${theme.primaryText} hover:text-red-800 font-semibold transition-colors`}>
                      View all {notifications.length} notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative z-[200]" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 touch-manipulation"
              aria-label="User menu"
            >
              <div className={`w-8 h-8 ${theme.primary} rounded-lg flex items-center justify-center shadow-lg`}>
                <UserTypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              {!isMobile && (
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.first_name || user?.username} {user?.last_name?.charAt(0) || ''}.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 capitalize">{getUserTypeDisplayName(user?.user_type)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor()}`}>
                      {user?.status || 'Active'}
                    </span>
                  </div>
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {showProfile && (
              <div className={`absolute right-0 mt-2 ${isMobile ? 'w-72 max-w-[90vw]' : 'w-72'} bg-white rounded-xl shadow-2xl border border-slate-200 z-[9999] backdrop-blur-sm`}>
                <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${theme.primary} rounded-xl flex items-center justify-center shadow-lg`}>
                      <UserTypeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">
                        {user?.first_name || user?.username} {user?.last_name || ''}
                      </p>
                      <p className="text-sm text-slate-600">{user?.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${theme.primaryLight} ${theme.primaryText} capitalize`}>
                          <UserTypeIcon className="h-3 w-3 mr-1" />
                          {getUserTypeDisplayName(user?.user_type)}
                        </span>
                        {user?.district && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <MapPin className="h-3 w-3 mr-1" />
                            {user.district.name || user.district}
                          </span>
                        )}
                      </div>
                      {user?.is_verified === false && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Verification
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <a href="/profile" className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                    <User className="h-4 w-4 mr-3 text-slate-400" />
                    <span className="font-medium">Profile Settings</span>
                  </a>
                  <a href="/preferences" className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                    <SettingsIcon className="h-4 w-4 mr-3 text-slate-400" />
                    <span className="font-medium">Preferences</span>
                  </a>
                  <a href="/help" className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                    <Globe className="h-4 w-4 mr-3 text-slate-400" />
                    <span className="font-medium">Help & Support</span>
                  </a>
                </div>
                <div className="border-t border-slate-200 py-2">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="font-semibold">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile page title, search, and info */}
      {isMobile && (
        <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 capitalize">
                {currentPage?.replace('-', ' ') || 'Dashboard'}
              </h2>
              {user?.district && (
                <p className="text-sm text-slate-500 flex items-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {user.district.name || user.district}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {showDateTime && (
                <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white rounded-lg px-2 py-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">{formatTime(currentTime)}</span>
                </div>
              )}
              <div className="flex items-center space-x-1 bg-green-100 rounded-lg px-2 py-1">
                <div className={`w-2 h-2 ${systemStatus.color} rounded-full animate-pulse`}></div>
                <span className="text-xs text-green-700 font-medium">Online</span>
              </div>
            </div>
          </div>
          
          {showSearch && (
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents, alerts..."
                className={`w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl ${theme.focusRing} text-sm bg-white shadow-sm`}
              />
            </form>
          )}

          {/* Mobile language selector */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Language:</span>
            <select 
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;