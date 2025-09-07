// components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, Bell, Menu, ChevronDown, User, LogOut, 
  Globe, Settings as SettingsIcon, Search, Phone, Shield,
  Clock, MapPin, Users, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  currentPage, 
  notifications = [],
  onLanguageChange,
  onEmergencyAlert,
  showSearch = false,
  onSearch
}) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(user?.preferred_language || 'en');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const emergencyRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
      if (emergencyRef.current && !emergencyRef.current.contains(event.target)) {
        setShowEmergencyMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  const handleLogout = () => {
    const logoutResult = logout();
    if (logoutResult.success) {
      navigate(logoutResult.redirectTo, {
        replace: true,
        state: { message: logoutResult.message }
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

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const emergencyContacts = [
    { name: 'Emergency Services', number: '112', icon: AlertTriangle },
    { name: 'MINEMA Operations', number: '+250-788-000-000', icon: Shield },
    { name: 'Police Emergency', number: '113', icon: Shield },
    { name: 'Fire & Rescue', number: '111', icon: AlertTriangle }
  ];

  const getStatusColor = () => {
    if (user?.status === 'active') return 'bg-green-100 text-green-800';
    if (user?.status === 'busy') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return Shield;
      case 'operator':
        return Users;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg shadow-sm">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">RwandaDisasterAlert</h1>
              <p className="text-xs text-gray-500">Emergency Management System</p>
            </div>
          </div>

          {/* Current Time & Status */}
          <div className="hidden md:flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(currentTime)}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">System Online</span>
            </div>
          </div>
        </div>

        {/* Center section - Search or Page Title */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          {showSearch ? (
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alerts, incidents, locations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </form>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 capitalize">
                {currentPage?.replace('-', ' ') || 'Dashboard'}
              </h2>
              {user?.district && (
                <p className="text-sm text-gray-500 flex items-center justify-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {user.district} District
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Emergency Menu */}
          <div className="relative" ref={emergencyRef}>
            <button 
              onClick={() => setShowEmergencyMenu(!showEmergencyMenu)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors shadow-sm"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Emergency</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showEmergencyMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 bg-red-50 border-b border-red-200">
                  <h3 className="text-sm font-medium text-red-900 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Actions
                  </h3>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      if (onEmergencyAlert) onEmergencyAlert();
                      setShowEmergencyMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 text-sm font-medium text-red-700 transition-colors"
                  >
                    🚨 Send Emergency Alert
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-700 mb-2">Emergency Contacts:</p>
                    {emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-xs text-gray-600">{contact.name}</span>
                        <a 
                          href={`tel:${contact.number}`}
                          className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          {contact.number}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative">
            <select 
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.code.toUpperCase()}
                </option>
              ))}
            </select>
            <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === 'emergency' ? 'bg-red-100' :
                            notification.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            {notification.type === 'emergency' ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : notification.type === 'warning' ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <Bell className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center mt-1 space-x-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-400">{notification.time}</p>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notifications</p>
                      <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                  )}
                </div>
                {notifications.length > 5 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                      View all {notifications.length} notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm">
                <RoleIcon className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name?.charAt(0)}.
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor()}`}>
                    {user?.status || 'Active'}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm">
                      <RoleIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {user?.role}
                        </span>
                        {user?.district && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <MapPin className="h-3 w-3 mr-1" />
                            {user.district}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <a href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <User className="h-4 w-4 mr-3 text-gray-400" />
                    Profile Settings
                  </a>
                  <a href="/preferences" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <SettingsIcon className="h-4 w-4 mr-3 text-gray-400" />
                    Preferences
                  </a>
                  <a href="/help" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <Globe className="h-4 w-4 mr-3 text-gray-400" />
                    Help & Support
                  </a>
                </div>
                <div className="border-t border-gray-200 py-2">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile page title and search */}
      <div className="md:hidden px-4 pb-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 capitalize">
              {currentPage?.replace('-', ' ') || 'Dashboard'}
            </h2>
            {user?.district && (
              <p className="text-sm text-gray-500 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {user.district} District
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
        
        {showSearch && (
          <form onSubmit={handleSearch} className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
          </form>
        )}
      </div>
    </header>
  );
};

export default Header;