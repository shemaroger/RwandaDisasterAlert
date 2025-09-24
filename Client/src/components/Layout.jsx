import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Wifi, WifiOff, Shield, X } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ 
  children, 
  user,
  notifications = [],
  currentPage = 'dashboard',
  onPageChange,
  onLogout,
  onLanguageChange,
  onEmergencyAlert,
  onQuickAction
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnlineTime, setLastOnlineTime] = useState(null);
  const [bannersDismissed, setBannersDismissed] = useState({
    emergency: false,
    offline: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Network status monitoring
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (!online) {
        setLastOnlineTime(new Date());
        setBannersDismissed(prev => ({ ...prev, offline: false }));
      }
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }

      if (event.altKey && event.key === 'e' && user?.user_type !== 'citizen') {
        event.preventDefault();
        handleEmergencyAlert();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, user]);

  // Memoized handlers
  const handlePageChange = useCallback((page) => {
    if (onPageChange) {
      onPageChange(page);
    }
  }, [onPageChange]);

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  const handleLanguageChange = useCallback((language) => {
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  }, [onLanguageChange]);

  const handleEmergencyAlert = useCallback(() => {
    if (onEmergencyAlert) {
      onEmergencyAlert();
    }
  }, [onEmergencyAlert]);

  const handleQuickAction = useCallback((actionType) => {
    if (onQuickAction) {
      onQuickAction(actionType);
    }
  }, [onQuickAction]);

  const dismissBanner = useCallback((bannerType) => {
    setBannersDismissed(prev => ({ ...prev, [bannerType]: true }));
  }, []);

  // Check for active emergencies
  const hasActiveEmergency = notifications.some(n => n.type === 'emergency' && !n.read);
  const emergencyCount = notifications.filter(n => n.type === 'emergency' && !n.read).length;

  // Banner visibility
  const showEmergencyBanner = hasActiveEmergency && !bannersDismissed.emergency;
  const showOfflineBanner = !isOnline && !bannersDismissed.offline;
  
  const bannerHeight = (() => {
    let height = 0;
    if (showEmergencyBanner) height += 48;
    if (showOfflineBanner) height += 40;
    return height;
  })();

  // Loading state
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading MINEMA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: `${bannerHeight}px` }}>
      {/* Critical Emergency Banner */}
      {showEmergencyBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center space-x-1 sm:space-x-3 flex-1">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
              <div className="flex-1 text-center">
                <span className="text-xs sm:text-sm font-bold tracking-wide">
                  {emergencyCount === 1 
                    ? 'EMERGENCY ALERT ACTIVE' 
                    : `${emergencyCount} EMERGENCY ALERTS ACTIVE`}
                </span>
                <span className="text-xs opacity-90 ml-1 sm:ml-2 hidden md:inline">
                  Check notifications immediately
                </span>
              </div>
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            </div>
            <button
              onClick={() => dismissBanner('emergency')}
              className="ml-2 sm:ml-4 text-red-200 hover:text-white transition-colors p-1"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Network Status Banner */}
      {showOfflineBanner && (
        <div className={`fixed ${showEmergencyBanner ? 'top-8 sm:top-12' : 'top-0'} left-0 right-0 z-40 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md`}>
          <div className="flex items-center justify-between px-2 sm:px-4 py-2">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
              <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
              <div className="flex-1 text-center">
                <span className="text-xs sm:text-sm font-medium">
                  <span className="hidden sm:inline">Connection Lost - </span>Offline mode
                </span>
                {lastOnlineTime && (
                  <span className="text-xs opacity-80 ml-1 sm:ml-2 hidden lg:inline">
                    Last online: {lastOnlineTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissBanner('offline')}
              className="ml-2 sm:ml-4 text-black opacity-70 hover:opacity-100 transition-opacity p-1"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Layout - Fully Responsive */}
      <div className="h-screen flex overflow-hidden bg-gray-50 sm:bg-gray-100">
        {/* Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentPage={currentPage}
          setCurrentPage={handlePageChange}
          user={user}
          onQuickAction={handleQuickAction}
        />

        {/* Main Content Area */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Header */}
          <Header
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentPage={currentPage}
            user={user}
            notifications={notifications}
            onLogout={handleLogout}
            onLanguageChange={handleLanguageChange}
            onEmergencyAlert={handleEmergencyAlert}
          />

          {/* Main Content - Full Width, No Constraints */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
            <div className="py-3 sm:py-4 md:py-6">
              {/* Full width container with minimal padding */}
              <div className="w-full px-2 sm:px-4 lg:px-6">
                {children}
              </div>
            </div>
          </main>

          {/* Responsive Footer */}
          <footer className="bg-white border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0">
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-500">
              {/* Logo/Copyright Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 md:space-x-4">
                <span className="font-medium">© 2024 MINEMA</span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="text-xs sm:text-sm">Ministry of Emergency Management</span>
                <span className="hidden md:inline text-gray-300">•</span>
                <span className="hidden md:inline">Republic of Rwanda</span>
              </div>
              
              {/* Status and Emergency Section */}
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3 md:space-x-4">
                {/* System Status */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 font-medium hidden sm:inline">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-600 font-medium hidden sm:inline">Offline</span>
                    </>
                  )}
                </div>
                
                {/* Emergency Contact */}
                <div className="flex items-center">
                  <span className="text-gray-300 hidden sm:inline mr-3 md:mr-4">•</span>
                  <a 
                    href="tel:912" 
                    className="text-red-600 hover:text-red-700 font-bold transition-colors flex items-center space-x-1 px-2 py-1 -mx-2 rounded hover:bg-red-50"
                  >
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Emergency: 912</span>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Additional footer info for larger screens */}
            <div className="hidden md:block mt-2 pt-2 border-t border-gray-100">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center text-xs text-gray-400 space-y-1 lg:space-y-0">
                <div className="flex items-center space-x-3">
                  <span>Version 2.1.4</span>
                  <span>•</span>
                  <span>Updated: {new Date().toLocaleDateString()}</span>
                  {user?.user_type && (
                    <>
                      <span>•</span>
                      <span className="capitalize">Access: {user.user_type}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button className="hover:text-gray-600 transition-colors">Privacy Policy</button>
                  <span>•</span>
                  <button className="hover:text-gray-600 transition-colors">System Status</button>
                  <span>•</span>
                  <button className="hover:text-gray-600 transition-colors">Help Center</button>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;