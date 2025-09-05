// components/Layout.jsx
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setMounted(true);
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

  // Handle keyboard shortcuts
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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const handlePageChange = (page) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleLanguageChange = (language) => {
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  const handleEmergencyAlert = () => {
    if (onEmergencyAlert) {
      onEmergencyAlert();
    }
  };

  const handleQuickAction = (actionType) => {
    if (onQuickAction) {
      onQuickAction(actionType);
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        user={user}
        onQuickAction={handleQuickAction}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
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

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Content wrapper with proper spacing */}
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>© 2024 MINEMA - Ministry of Emergency Management</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Republic of Rwanda</span>
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Operational</span>
              </div>
              <a 
                href="#help" 
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Emergency Support: +250-788-000-000
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Emergency Banner - Shows when there are active emergencies */}
      {notifications.some(n => n.type === 'emergency' && !n.read) && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
            <span className="text-sm font-medium">
              EMERGENCY ALERT ACTIVE - Check notifications for details
            </span>
            <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;