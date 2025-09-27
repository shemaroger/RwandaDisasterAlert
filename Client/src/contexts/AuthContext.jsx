// contexts/AuthContext.jsx - Enhanced version with complete state management
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

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const token = apiService.getToken();
        
        console.log('Auth init - token exists:', !!token);
        
        if (token) {
          // Try to get user profile with existing token
          try {
            const userData = await apiService.getProfile();
            console.log('Auth init - user loaded:', userData?.user_type, userData?.username);
            setUser(userData);
            setError('');
          } catch (err) {
            // Token might be expired or invalid
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
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Enhanced login function with complete state management
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
        // Set token if provided, otherwise check if it was set by apiService
        if (response.token) {
          apiService.setToken(response.token);
        }
        
        setUser(response.user);
        
        console.log('Login successful - user:', response.user.user_type, response.user.username);
        
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('remember_user', 'true');
        } else {
          localStorage.removeItem('remember_user');
        }

        return response;
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

  // Register function - updated for RwandaDisasterAlert API
  const register = async (userData) => {
    try {
      setLoading(true);
      setError('');
      
      // Clear any existing data first
      clearAllStorage();

      const response = await apiService.register(userData);
      
      // RwandaDisasterAlert registration might return user data immediately or require login
      if (response.user) {
        if (response.token) {
          apiService.setToken(response.token);
        }
        setUser(response.user);
        console.log('Registration successful - user:', response.user.user_type, response.user.username);
        return response;
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

  // Helper function to get redirect path based on user_type (updated for RwandaDisasterAlert)
  const getRedirectPath = (userType) => {
    switch (userType) {
      case 'admin':
        return '/admin/dashboard';
      case 'operator':
        return '/operator/dashboard';
      case 'authority':
        return '/authority/dashboard';
      case 'citizen':
        return '/citizen/dashboard'; // Citizens use the citizen dashboard
      default:
        return '/dashboard';
    }
  };

  // Enhanced logout function with complete state and navigation reset
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
      setUser(updatedUser);
      console.log('Profile updated for user:', updatedUser.username);
      return updatedUser;
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
        setUser(prev => ({ 
          ...prev, 
          push_notifications_enabled: preferences.push_notifications_enabled ?? prev.push_notifications_enabled,
          sms_notifications_enabled: preferences.sms_notifications_enabled ?? prev.sms_notifications_enabled,
          email_notifications_enabled: preferences.email_notifications_enabled ?? prev.email_notifications_enabled,
          preferred_language: preferences.preferred_language ?? prev.preferred_language,
        }));
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
        setUser(prev => ({ 
          ...prev, 
          location_lat: latitude,
          location_lng: longitude,
          district: districtId
        }));
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

  // Check if user has specific user_type (updated for RwandaDisasterAlert)
  const hasUserType = (userType) => {
    if (!user) return false;
    return user.user_type === userType;
  };

  // Check if user has any of the specified user types
  const hasAnyUserType = (userTypes) => {
    if (!user) return false;
    return userTypes.includes(user.user_type);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!apiService.getToken();
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasUserType('admin');
  };

  // Check if user is operator
  const isOperator = () => {
    return hasUserType('operator');
  };

  // Check if user is authority
  const isAuthority = () => {
    return hasUserType('authority');
  };

  // Check if user is citizen
  const isCitizen = () => {
    return hasUserType('citizen');
  };

  // Check if user is verified
  const isVerified = () => {
    return user?.is_verified === true;
  };

  // Check if user can manage alerts (admin or authority)
  const canManageAlerts = () => {
    return hasAnyUserType(['admin', 'authority']);
  };

  // Check if user can manage incidents (admin, authority, or operator)
  const canManageIncidents = () => {
    return hasAnyUserType(['admin', 'authority', 'operator']);
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
      setUser(userData);
      return userData;
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
    
    // User type checking functions (RwandaDisasterAlert specific)
    hasUserType,
    hasAnyUserType,
    isAuthenticated,
    isAdmin,
    isOperator,
    isAuthority,
    isCitizen,
    isVerified,
    canManageAlerts,
    canManageIncidents,
    
    // Legacy functions for backward compatibility
    hasRole,
    hasAnyRole,
    
    // Utility functions
    clearError,
    getRedirectPath,
    clearAllStorage,
    
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