import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, Wifi, WifiOff, Shield, X, Menu, ChevronLeft } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);


  useEffect(() => {
    setMounted(true);
  }, []);

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-close sidebar on mobile when screen becomes larger
      if (width >= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarOpen]);

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-close sidebar on mobile when screen becomes larger
      if (width >= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarOpen]);

  // Touch gesture handling for mobile
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      if (!isMobile) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e) => {
      if (!isMobile || !isDragging) return;
      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      const deltaY = Math.abs(e.touches[0].clientY - startY);
      
      // Prevent vertical scroll interference
      if (deltaY > 50) {
        isDragging = false;
        return;
      }
      
      // Swipe right to open sidebar (from left edge)
      if (startX < 20 && deltaX > 50 && !sidebarOpen) {
        setSidebarOpen(true);
        isDragging = false;
      }
      
      // Swipe left to close sidebar
      if (sidebarOpen && deltaX < -50) {
        setSidebarOpen(false);
        isDragging = false;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, sidebarOpen]);

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

  // Click outside to close sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMobile || !sidebarOpen) return;
      
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, sidebarOpen]);

  // Memoized handlers
  const handlePageChange = useCallback((page) => {
    if (onPageChange) {
      onPageChange(page);
    }
    // Auto-close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [onPageChange, isMobile]);

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
    // Auto-close sidebar on mobile after quick action
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [onQuickAction, isMobile]);

  const dismissBanner = useCallback((bannerType) => {
    setBannersDismissed(prev => ({ ...prev, [bannerType]: true }));
  }, []);

  // Check for active emergencies
  const hasActiveEmergency = notifications.some(n => n.type === 'emergency' && !n.read);
  const emergencyCount = notifications.filter(n => n.type === 'emergency' && !n.read).length;

  // Banner visibility
  const showEmergencyBanner = hasActiveEmergency && !bannersDismissed.emergency;
  const showOfflineBanner = !isOnline && !bannersDismissed.offline;

  // Responsive banner heights
  const bannerHeight = (() => {
    let height = 0;
    if (showEmergencyBanner) {
      height += isMobile ? 44 : isTablet ? 48 : 52;
    }
    if (showOfflineBanner) {
      height += isMobile ? 36 : isTablet ? 40 : 44;
    }
    return height;
  })();

  // Loading state
  if (!mounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-red-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">Loading MINEMA Dashboard...</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Please wait while we prepare your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ paddingTop: `${bannerHeight}px` }}
      className="fixed inset-0 overflow-hidden bg-gray-50"
    >
      {/* Critical Emergency Banner */}
      {showEmergencyBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-white animate-pulse" />
              <div className="flex-1 text-center min-w-0">
                <div className="text-xs sm:text-sm lg:text-base font-bold tracking-wide truncate">
                  {emergencyCount === 1
                    ? 'EMERGENCY ALERT'
                    : `${emergencyCount} EMERGENCY ALERTS`}
                </div>
                <div className="text-xs opacity-90 hidden sm:block lg:text-sm">
                  Check notifications immediately
                </div>
              </div>
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-white animate-pulse" />
            </div>
            <button
              onClick={() => dismissBanner('emergency')}
              className="ml-2 sm:ml-4 text-red-200 hover:text-white transition-colors p-1 flex-shrink-0 touch-manipulation"
              aria-label="Dismiss emergency banner"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Network Status Banner */}
      {showOfflineBanner && (
        <div 
          className={`fixed ${showEmergencyBanner ? 'top-11 sm:top-12 lg:top-14' : 'top-0'} left-0 right-0 z-40 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md`}
        >
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <div className="flex-1 text-center min-w-0">
                <span className="text-xs sm:text-sm font-medium">
                  {isMobile ? 'Offline' : 'Connection Lost - Offline mode'}
                </span>
                {lastOnlineTime && !isMobile && (
                  <span className="text-xs opacity-80 ml-2 hidden lg:inline">
                    Last online: {lastOnlineTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissBanner('offline')}
              className="ml-2 sm:ml-4 text-black opacity-70 hover:opacity-100 transition-opacity p-1 flex-shrink-0 touch-manipulation"
              aria-label="Dismiss offline banner"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Sidebar Overlay */}
      {(isMobile || isTablet) && sidebarOpen && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Layout */}
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <div 
          ref={sidebarRef}
          className={`
            flex-shrink-0 transition-all duration-300 ease-in-out z-40
            ${isMobile || isTablet 
              ? `fixed top-0 left-0 h-full transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : 'relative'
            }
          `}
          style={{
            paddingTop: isMobile || isTablet ? `${bannerHeight}px` : '0px'
          }}
        >
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            currentPage={currentPage}
            setCurrentPage={handlePageChange}
            user={user}
            onQuickAction={handleQuickAction}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0">
            <Header
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              currentPage={currentPage}
              user={user}
              notifications={notifications}
              onLogout={handleLogout}
              onLanguageChange={handleLanguageChange}
              onEmergencyAlert={handleEmergencyAlert}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </div>

          {/* Main Content */}
          <main className="flex-1 relative overflow-y-auto overflow-x-hidden focus:outline-none bg-gray-50">
            <div className="w-full h-full">
              {/* Content wrapper with responsive padding */}
              <div className="px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Quick Access FAB (Floating Action Button) */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 right-4 z-30 bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition-colors touch-manipulation"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Swipe indicator for mobile */}
      {isMobile && !sidebarOpen && (
        <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-20 bg-red-600 text-white rounded-r-lg px-1 py-4 opacity-60 hover:opacity-90 transition-opacity touch-manipulation">
          <ChevronLeft className="w-4 h-4 transform rotate-180" />
        </div>
      )}
    </div>
  );
};

export default Layout;