// contexts/AuthContext.jsx - Complete Updated Version with Cell Level Support
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService, { ApiError } from '../services/api';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper to get user type with normalization
  const getUserType = () => {
    if (!user) return null;
    
    // Try multiple possible property names (handle API inconsistencies)
    const userType = user.user_type || user.role || user.userRole;
    
    // Normalize to lowercase for consistent checking
    return userType ? userType.toLowerCase() : null;
  };

  // Enhanced clearAllStorage function with comprehensive cleanup
  const clearAllStorage = () => {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear specific items that might persist across sessions
      const itemsToClear = [
        'auth_token',
        'refresh_token', 
        'user_data',
        'remember_user',
        'react-router-location',
        'navigation_state',
        'navigationState',
        'lastVisitedPath',
        'redirectAfterLogin'
      ];
      
      itemsToClear.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      });
      
      // Enhanced cookie clearing for multiple domain/path combinations
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        
        // Clear for different path and domain combinations
        const clearOptions = [
          "",
          ";path=/",
          ";path=/;domain=" + window.location.hostname,
          ";path=/;domain=." + window.location.hostname.split('.').slice(-2).join('.')
        ];
        
        clearOptions.forEach(option => {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT" + option;
        });
      });
      
      console.log('Enhanced storage cleanup completed');
    } catch (error) {
      console.warn('Error during enhanced storage cleanup:', error);
    }
  };

  // Normalize user data function
  const normalizeUserData = (userData) => {
    if (!userData) return null;
    
    // Create a normalized user object
    const normalized = { ...userData };
    
    // Ensure user_type exists and is lowercase
    if (userData.user_type || userData.role) {
      normalized.user_type = (userData.user_type || userData.role).toLowerCase();
    }
    
    // Remove any role property to avoid confusion
    delete normalized.role;
    delete normalized.userRole;
    
    return normalized;
  };

  // Initialize authentication state - UPDATED WITH FIX
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const token = apiService.getToken();
        
        console.log('Auth init - token exists:', !!token);
        
        if (token) {
          // ✅ FIX: First check if we have stored user data from login
          const storedUserData = localStorage.getItem('user_data');
          
          if (storedUserData) {
            try {
              const parsedUser = JSON.parse(storedUserData);
              const normalizedUser = normalizeUserData(parsedUser);
              
              // Verify it has required fields
              if (normalizedUser?.username && normalizedUser?.user_type) {
                console.log('✅ Auth init - user loaded from storage:', normalizedUser.user_type, normalizedUser.username);
                setUser(normalizedUser);
                setError('');
                setLoading(false);
                setIsInitialized(true);
                return; // Skip API call - we already have the data!
              } else {
                console.warn('⚠️ Stored user data missing required fields, fetching from API');
              }
            } catch (parseError) {
              console.warn('Failed to parse stored user data:', parseError);
              localStorage.removeItem('user_data');
            }
          }
          
          // Only call API if no stored data or stored data is invalid
          try {
            const userData = await apiService.getProfile();
            const normalizedUser = normalizeUserData(userData);
            
            // ✅ FIX: Add safety check for user_type
            if (!normalizedUser.user_type) {
              console.error('❌ user_type missing from API response!', normalizedUser);
              console.log('Full API response:', JSON.stringify(normalizedUser, null, 2));
              
              // Check for alternative field names
              if (userData.role) {
                normalizedUser.user_type = userData.role.toLowerCase();
                console.warn('⚠️ Using role field as user_type:', normalizedUser.user_type);
              } else {
                // Temporary fallback - you can customize this based on other user fields
                normalizedUser.user_type = 'admin';
                console.warn('⚠️ Using fallback user_type: admin');
              }
            }
            
            console.log('✅ Auth init - user loaded from API:', normalizedUser.user_type, normalizedUser.username);
            setUser(normalizedUser);
            setError('');
            
            // ✅ FIX: Store normalized data for next time to avoid repeated API calls
            localStorage.setItem('user_data', JSON.stringify(normalizedUser));
            
          } catch (err) {
            console.warn('Failed to load user profile:', err);
            clearAllStorage();
            apiService.logoutSync();
            setUser(null);
          }
        } else {
          console.log('Auth init - no token found');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
        clearAllStorage();
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Listen for storage changes (e.g., logout in another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' && !e.newValue) {
        // Token was removed, clear user
        setUser(null);
        setError('');
        localStorage.removeItem('user_data');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Enhanced login function - UPDATED WITH FIX
  const login = async (username, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Complete cleanup before new login to prevent state pollution
      clearAllStorage();
      setUser(null);
      
      // Clear any existing navigation state that might cause redirect issues
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      const response = await apiService.login(username, password);
      
      // RwandaDisasterAlert API returns user data directly
      if (response.user) {
        // ✅ FIX: Normalize user data
        const normalizedUser = normalizeUserData(response.user);
        
        // ✅ FIX: Verify user_type exists in login response
        if (!normalizedUser.user_type) {
          console.error('❌ user_type missing from login response!', normalizedUser);
          throw new Error('Invalid user data from server - missing user type');
        }
        
        // Set token if provided, otherwise check if it was set by apiService
        if (response.token) {
          apiService.setToken(response.token);
        }
        
        // ✅ FIX: Store normalized user data BEFORE setting state
        localStorage.setItem('user_data', JSON.stringify(normalizedUser));
        
        setUser(normalizedUser);
        
        console.log('✅ Login successful - user:', normalizedUser.user_type, normalizedUser.username);
        
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('remember_user', 'true');
        } else {
          localStorage.removeItem('remember_user');
        }

        return { ...response, user: normalizedUser };
      } else {
        throw new Error('Invalid response from server - no user data received');
      }
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (err instanceof ApiError) {
        if (err.status === 401) {
          errorMessage = 'Invalid username/email or password.';
        } else if (err.status === 403) {
          errorMessage = 'Account not approved or disabled.';
        } else if (err.data?.detail) {
          errorMessage = err.data.detail;
        } else if (err.data?.non_field_errors) {
          errorMessage = Array.isArray(err.data.non_field_errors) 
            ? err.data.non_field_errors.join(' ')
            : err.data.non_field_errors;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      clearAllStorage();
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError('');
      
      // Clear any existing data first
      clearAllStorage();

      const response = await apiService.register(userData);
      
      // RwandaDisasterAlert registration might return user data immediately or require login
      if (response.user) {
        const normalizedUser = normalizeUserData(response.user);
        
        if (response.token) {
          apiService.setToken(response.token);
        }
        
        // ✅ FIX: Store normalized user data if registration returns it
        if (normalizedUser.user_type) {
          localStorage.setItem('user_data', JSON.stringify(normalizedUser));
        }
        
        setUser(normalizedUser);
        console.log('Registration successful - user:', normalizedUser.user_type, normalizedUser.username);
        return { ...response, user: normalizedUser };
      } else {
        // Registration successful but no immediate login (common for approval-required systems)
        console.log('Registration successful - user needs to login');
        return response;
      }
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err instanceof ApiError) {
        if (err.status === 400 && err.data) {
          // Handle validation errors
          const validationErrors = [];
          Object.entries(err.data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              validationErrors.push(...messages);
            } else if (typeof messages === 'string') {
              validationErrors.push(messages);
            }
          });
          errorMessage = validationErrors.length > 0 ? validationErrors.join(' ') : 'Invalid registration data.';
        } else if (err.data?.detail) {
          errorMessage = err.data.detail;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      clearAllStorage();
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Helper function to get redirect path with Cell Level support
  const getRedirectPath = (userType) => {
    switch (userType) {
      case 'admin':
        return '/admin/dashboard';
      case 'village':
        return '/village/dashboard';
      case 'cell': // ✅ ADDED: Cell level redirect
        return '/cell/dashboard';
      case 'sector':
        return '/sector/dashboard';
      case 'district':
        return '/district/dashboard';
      case 'province':
        return '/province/dashboard';
      case 'national':
        return '/national/dashboard';
      case 'citizen':
        return '/citizen/dashboard';
      default:
        return '/dashboard';
    }
  };

  // Enhanced logout function - UPDATED WITH FIX
  const logout = async () => {
    try {
      console.log('Logout initiated for user:', user?.username);
      
      // Call backend logout to invalidate session
      if (apiService.getToken()) {
        await apiService.logout();
      }
    } catch (error) {
      // Continue with logout even if backend call fails
      console.warn('Backend logout failed, continuing with client logout:', error);
    } finally {
      // Complete state and navigation reset
      
      // Clear all client state and storage
      clearAllStorage();
      setUser(null);
      setError('');
      setLoading(false);
      
      // ✅ FIX: Explicitly remove user_data
      localStorage.removeItem('user_data');
      
      // Clear any React Router state that might contain redirect info
      if (window.history.replaceState) {
        window.history.replaceState(null, '', '/login');
      }
      
      console.log('Logout completed - all data and navigation state cleared');
      
      // Return logout info for components to handle navigation
      return {
        success: true,
        message: 'You have been signed out successfully.',
        redirectTo: '/login'
      };
    }
  };

  // Immediate logout function for emergency situations
  const logoutImmediate = () => {
    console.log('Immediate logout initiated');
    
    // Immediate client-side logout without waiting for backend
    clearAllStorage();
    apiService.logoutSync();
    setUser(null);
    setError('');
    setLoading(false);
    
    // ✅ FIX: Remove user_data
    localStorage.removeItem('user_data');
    
    // Clear navigation state
    if (window.history.replaceState) {
      window.history.replaceState(null, '', '/login');
    }
    
    return {
      success: true,
      message: 'You have been signed out.',
      redirectTo: '/login'
    };
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setError('');
      const updatedUser = await apiService.updateProfile(profileData);
      const normalizedUser = normalizeUserData(updatedUser);
      
      // ✅ FIX: Update stored user data
      localStorage.setItem('user_data', JSON.stringify(normalizedUser));
      
      setUser(normalizedUser);
      console.log('Profile updated for user:', normalizedUser.username);
      return normalizedUser;
    } catch (err) {
      let errorMessage = 'Profile update failed';
      
      if (err instanceof ApiError) {
        if (err.data?.detail) {
          errorMessage = err.data.detail;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update notification preferences
  const updateNotificationPreferences = async (preferences) => {
    try {
      setError('');
      const response = await apiService.updateNotificationPreferences(preferences);
      
      // Update user state with new preferences
      if (user) {
        const updatedUser = { 
          ...user, 
          push_notifications_enabled: preferences.push_notifications_enabled ?? user.push_notifications_enabled,
          sms_notifications_enabled: preferences.sms_notifications_enabled ?? user.sms_notifications_enabled,
          email_notifications_enabled: preferences.email_notifications_enabled ?? user.email_notifications_enabled,
          preferred_language: preferences.preferred_language ?? user.preferred_language,
        };
        
        setUser(updatedUser);
        
        // ✅ FIX: Update stored user data
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (err) {
      let errorMessage = 'Failed to update notification preferences';
      
      if (err instanceof ApiError && err.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update user location
  const updateLocation = async (latitude, longitude, districtId) => {
    try {
      setError('');
      const response = await apiService.updateLocation(latitude, longitude, districtId);
      
      // Update user state with new location
      if (user) {
        const updatedUser = { 
          ...user, 
          location_lat: latitude,
          location_lng: longitude,
          district: districtId
        };
        
        setUser(updatedUser);
        
        // ✅ FIX: Update stored user data
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (err) {
      let errorMessage = 'Failed to update location';
      
      if (err instanceof ApiError && err.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      setError('');
      await apiService.changePassword(passwordData);
      return true;
    } catch (err) {
      let errorMessage = 'Password change failed';
      
      if (err instanceof ApiError) {
        if (err.data?.detail) {
          errorMessage = err.data.detail;
        } else if (err.data?.old_password) {
          errorMessage = 'Current password is incorrect';
        } else if (err.data?.new_password) {
          errorMessage = Array.isArray(err.data.new_password) 
            ? err.data.new_password.join(' ')
            : err.data.new_password;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // ✅ FIXED: Check if user has specific user_type (case-insensitive)
  const hasUserType = (userType) => {
    if (!userType) return false;
    const currentUserType = getUserType();
    if (!currentUserType) return false;
    
    return currentUserType === userType.toLowerCase();
  };

  // ✅ FIXED: Check if user has any of the specified user types (case-insensitive)
  const hasAnyUserType = (userTypes) => {
    if (!userTypes || !Array.isArray(userTypes) || userTypes.length === 0) {
      return false;
    }
    
    const currentUserType = getUserType();
    if (!currentUserType) return false;
    
    // Convert all required types to lowercase for case-insensitive comparison
    const normalizedUserTypes = userTypes.map(type => type.toLowerCase());
    
    return normalizedUserTypes.includes(currentUserType);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!apiService.getToken();
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasUserType('admin');
  };

  // Check if user is citizen
  const isCitizen = () => {
    return hasUserType('citizen');
  };

  // ============= HIERARCHICAL LEVEL FUNCTIONS =============
  
  // Check if user is at village level
  const isVillageLevel = () => {
    return hasUserType('village');
  };

  // ✅ ADDED: Check if user is at cell level
  const isCellLevel = () => {
    return hasUserType('cell');
  };

  // Check if user is at sector level
  const isSectorLevel = () => {
    return hasUserType('sector');
  };

  // Check if user is at district level
  const isDistrictLevel = () => {
    return hasUserType('district');
  };

  // Check if user is at province level
  const isProvinceLevel = () => {
    return hasUserType('province');
  };

  // Check if user is at national level
  const isNationalLevel = () => {
    return hasUserType('national');
  };

  // ✅ UPDATED: Check if user is at any administrative level (including cell)
  const isAdministrativeLevel = () => {
    return hasAnyUserType(['village', 'cell', 'sector', 'district', 'province', 'national']);
  };

  // Check if user has a specific administrative level
  const hasAdminLevel = (level) => {
    return hasUserType(level);
  };

  // Check if user can handle incidents at a specific level
  const canHandleIncidentAtLevel = (level) => {
    if (!user) return false;
    if (isAdmin()) return true; // Admin can handle all levels
    return hasUserType(level);
  };

  // Check if user can escalate incidents (any admin level can escalate)
  const canEscalateIncidents = () => {
    return isAdmin() || isAdministrativeLevel();
  };

  // Check if user can resolve incidents at their level
  const canResolveIncidents = () => {
    return isAdmin() || isAdministrativeLevel();
  };

  // Get user's administrative level (returns null for non-admin users)
  const getUserAdminLevel = () => {
    if (!user) return null;
    if (isCitizen()) return null;
    if (isAdmin()) return 'admin';
    return getUserType();
  };

  // ✅ UPDATED: Check if user's level is higher than or equal to specified level (including cell)
  const isLevelOrHigher = (targetLevel) => {
    const levelHierarchy = ['village', 'cell', 'sector', 'district', 'province', 'national', 'admin'];
    const userLevel = getUserAdminLevel();
    
    if (!userLevel) return false;
    if (userLevel === 'admin') return true;
    
    const userLevelIndex = levelHierarchy.indexOf(userLevel);
    const targetLevelIndex = levelHierarchy.indexOf(targetLevel);
    
    // Handle invalid target level
    if (targetLevelIndex === -1) return false;
    
    return userLevelIndex >= targetLevelIndex;
  };

  // Check if user can view incidents at a specific level
  const canViewIncidentAtLevel = (level) => {
    if (isAdmin()) return true;
    if (isCitizen()) return false;
    return isLevelOrHigher(level);
  };

  // ============= LEGACY COMPATIBILITY =============

  // Legacy: Check if user is operator (maps to any administrative level)
  const isOperator = () => {
    console.warn('isOperator is deprecated, use isAdministrativeLevel instead');
    return isAdministrativeLevel();
  };

  // Legacy: Check if user is authority (maps to district or higher)
  const isAuthority = () => {
    console.warn('isAuthority is deprecated, use isLevelOrHigher("district") instead');
    return isAdmin() || hasAnyUserType(['district', 'province', 'national']);
  };

  // Check if user is verified
  const isVerified = () => {
    return user?.is_verified === true;
  };

  // Check if user can manage alerts (admin or national level)
  const canManageAlerts = () => {
    return isAdmin() || isNationalLevel();
  };

  // Check if user can manage incidents (admin or any administrative level)
  const canManageIncidents = () => {
    return isAdmin() || isAdministrativeLevel();
  };

  // Check if user can assign incidents
  const canAssignIncidents = () => {
    return isAdmin() || hasAnyUserType(['district', 'province', 'national']);
  };

  // Check if user can view analytics (admin, district, province, national)
  const canViewAnalytics = () => {
    return isAdmin() || hasAnyUserType(['district', 'province', 'national']);
  };

  // Clear error function
  const clearError = () => {
    setError('');
  };

  // Force refresh user data
  const refreshUser = async () => {
    if (!apiService.getToken()) return;
    
    try {
      const userData = await apiService.getProfile();
      const normalizedUser = normalizeUserData(userData);
      
      setUser(normalizedUser);
      
      // ✅ FIX: Update stored user data
      localStorage.setItem('user_data', JSON.stringify(normalizedUser));
      
      return normalizedUser;
    } catch (err) {
      console.warn('Failed to refresh user data:', err);
      // If refresh fails, user might need to login again
      logout();
      throw err;
    }
  };

  // Legacy role functions for backward compatibility
  const hasRole = (role) => {
    console.warn('hasRole is deprecated, use hasUserType instead');
    return hasUserType(role);
  };

  const hasAnyRole = (roles) => {
    console.warn('hasAnyRole is deprecated, use hasAnyUserType instead');
    return hasAnyUserType(roles);
  };

  // Debug function to log user info
  const debugUserInfo = () => {
    console.log('=== DEBUG USER INFO ===');
    console.log('User object:', user);
    console.log('User type (raw):', user?.user_type);
    console.log('User type (normalized):', getUserType());
    console.log('isAdmin:', isAdmin());
    console.log('isDistrict:', isDistrictLevel());
    console.log('isProvince:', isProvinceLevel());
    console.log('isNational:', isNationalLevel());
    console.log('hasAnyUserType(["district", "province", "national"]):', 
      hasAnyUserType(['district', 'province', 'national']));
    console.log('=== END DEBUG ===');
  };

  // Context value
  const value = {
    // State
    user,
    loading,
    error,
    isInitialized,
    
    // Authentication functions
    login,
    register,
    logout,
    logoutImmediate,
    updateProfile,
    updateNotificationPreferences,
    updateLocation,
    changePassword,
    refreshUser,
    
    // Basic user type checking functions
    hasUserType,
    hasAnyUserType,
    isAuthenticated,
    isAdmin,
    isCitizen,
    isVerified,
    
    // ✅ UPDATED: Hierarchical level checking functions (including cell)
    isVillageLevel,
    isCellLevel, // ✅ ADDED
    isSectorLevel,
    isDistrictLevel,
    isProvinceLevel,
    isNationalLevel,
    isAdministrativeLevel,
    hasAdminLevel,
    getUserAdminLevel,
    isLevelOrHigher,
    
    // Permission checking functions
    canHandleIncidentAtLevel,
    canViewIncidentAtLevel,
    canEscalateIncidents,
    canResolveIncidents,
    canManageAlerts,
    canManageIncidents,
    canAssignIncidents,
    canViewAnalytics,
    
    // Legacy functions for backward compatibility
    isOperator,
    isAuthority,
    hasRole,
    hasAnyRole,
    
    // Utility functions
    clearError,
    getRedirectPath,
    clearAllStorage,
    debugUserInfo,
    getUserType, // Expose for debugging
    
    // Setters for manual state management if needed
    setUser,
    setError,
    setLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;