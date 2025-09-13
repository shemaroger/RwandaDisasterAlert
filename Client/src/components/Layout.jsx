import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Wifi, WifiOff, Shield } from 'lucide-react';
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ESC to close sidebar
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      // Alt + M to toggle sidebar (accessibility)
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }

      // Alt + E for emergency alert (if user has permission)
      if (event.altKey && event.key === 'e' && user?.user_type !== 'citizen') {
        event.preventDefault();
        handleEmergencyAlert();
      }

      // Alt + N to focus notifications
      if (event.altKey && event.key === 'n') {
        event.preventDefault();
        // Focus notification bell - you'd implement this in Header
        const notificationButton = document.querySelector('[data-notification-button]');
        if (notificationButton) {
          notificationButton.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, user]);

  // Memoized handlers to prevent unnecessary re-renders
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

  // Check for active emergencies
  const hasActiveEmergency = notifications.some(n => n.type === 'emergency' && !n.read);
  const emergencyCount = notifications.filter(n => n.type === 'emergency' && !n.read).length;

  // Enhanced loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <div className="mt-4 space-y-2">
            <p className="text-gray-600 font-medium">Loading MINEMA Dashboard...</p>
            <p className="text-sm text-gray-500">Initializing emergency management system</p>
            <div className="flex items-center justify-center space-x-2 mt-3">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Critical Emergency Banner */}
      {hasActiveEmergency && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 shadow-lg border-b-2 border-red-800">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex space-x-1">
              <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
              <div className="animate-pulse w-2 h-2 bg-white rounded-full" style={{animationDelay: '0.2s'}}></div>
              <div className="animate-pulse w-2 h-2 bg-white rounded-full" style={{animationDelay: '0.4s'}}></div>
            </div>
            <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
            <span className="text-sm font-bold tracking-wide">
              {emergencyCount === 1 
                ? 'EMERGENCY ALERT ACTIVE' 
                : `${emergencyCount} EMERGENCY ALERTS ACTIVE`}
              {' - Check notifications immediately'}
            </span>
            <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
            <div className="flex space-x-1">
              <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
              <div className="animate-pulse w-2 h-2 bg-white rounded-full" style={{animationDelay: '0.2s'}}></div>
              <div className="animate-pulse w-2 h-2 bg-white rounded-full" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Network Status Banner */}
      {!isOnline && (
        <div className={`fixed ${hasActiveEmergency ? 'top-12' : 'top-0'} left-0 right-0 z-40 bg-yellow-500 text-black px-4 py-2 border-b border-yellow-600`}>
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">
              Connection Lost - Operating in offline mode
              {lastOnlineTime && (
                <span className="ml-2 text-xs opacity-90">
                  (Last online: {lastOnlineTime.toLocaleTimeString()})
                </span>
              )}
            </span>
            <div className="animate-pulse w-2 h-2 bg-black rounded-full"></div>
          </div>
        </div>
      )}

      {/* Header spans full width with dynamic top margin */}
      <div className={`w-full ${hasActiveEmergency ? 'mt-12' : ''} ${!isOnline && !hasActiveEmergency ? 'mt-10' : ''} ${!isOnline && hasActiveEmergency ? 'mt-20' : ''}`}>
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
      </div>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex">
        {/* Sidebar positioned below header - no left margin */}
        <div className="hidden lg:block w-72 flex-shrink-0 ml-0">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentPage={currentPage}
            setCurrentPage={handlePageChange}
            user={user}
            onQuickAction={handleQuickAction}
          />
        </div>

        {/* Mobile sidebar overlay */}
        <div className="lg:hidden">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentPage={currentPage}
            setCurrentPage={handlePageChange}
            user={user}
            onQuickAction={handleQuickAction}
          />
        </div>

        {/* Main content area - takes remaining space with no margins */}
        <div className="flex-1 flex flex-col overflow-hidden ml-0">
          {/* Main content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none ml-0" role="main">
            {/* Accessibility skip link */}
            <a 
              href="#main-content" 
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-red-600 text-white px-4 py-2 rounded-md z-50 font-medium"
            >
              Skip to main content
            </a>
            
            {/* Content wrapper with no margins or padding */}
            <div className="py-6 ml-0 pl-0">
              <div className="w-full px-0 ml-0">
                <div id="main-content" className="ml-0 pl-0">
                  {children}
                </div>
              </div>
            </div>
          </main>

          {/* Enhanced Footer */}
          <footer className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6 lg:px-8" role="contentinfo">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>© 2024 MINEMA - Ministry of Emergency Management</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Republic of Rwanda</span>
              </div>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                {/* System status with enhanced indicators */}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 font-medium">System Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-yellow-500" />
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-600 font-medium">Offline Mode</span>
                    </>
                  )}
                </div>
                
                {/* Emergency contact - always visible */}
                <div className="flex items-center space-x-3">
                  <button 
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    onClick={() => window.open('/emergency-procedures', '_blank')}
                  >
                    Emergency Procedures
                  </button>
                  <span className="text-gray-300">•</span>
                  <a 
                    href="tel:+250788000000" 
                    className="text-sm text-red-600 hover:text-red-700 font-bold transition-colors flex items-center space-x-1"
                    aria-label="Call emergency support immediately"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Emergency: +250-788-000-000</span>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Additional footer info for emergency context */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>Version 2.1.4</span>
                  <span>•</span>
                  <span>Last Updated: {new Date().toLocaleDateString()}</span>
                  {user?.user_type && (
                    <>
                      <span>•</span>
                      <span className="capitalize">Access Level: {user.user_type}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                  <button className="hover:text-gray-600">Privacy Policy</button>
                  <span>•</span>
                  <button className="hover:text-gray-600">System Status</button>
                  <span>•</span>
                  <button className="hover:text-gray-600">Help Documentation</button>
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