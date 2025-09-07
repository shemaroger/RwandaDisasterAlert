// contexts/AuthContext.jsx
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

  // Clear all browser storage completely
  const clearAllStorage = () => {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      console.log('All browser storage cleared');
    } catch (error) {
      console.warn('Error clearing storage:', error);
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
            console.log('Auth init - user loaded:', userData?.role, userData?.email);
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

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Clear any existing data first
      clearAllStorage();

      const response = await apiService.login(email, password);
      
      if (response.token && response.user) {
        apiService.setToken(response.token);
        setUser(response.user);
        
        console.log('Login successful - user:', response.user.role, response.user.email);
        
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('remember_user', 'true');
        } else {
          localStorage.removeItem('remember_user');
        }

        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (err instanceof ApiError) {
        if (err.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (err.status === 403) {
          errorMessage = 'Account not approved or disabled.';
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

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError('');
      
      // Clear any existing data first
      clearAllStorage();

      const response = await apiService.register(userData);
      
      if (response.token && response.user) {
        apiService.setToken(response.token);
        setUser(response.user);
        
        console.log('Registration successful - user:', response.user.role, response.user.email);
        
        return response;
      } else {
        throw new Error('Invalid response from server');
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
          errorMessage = validationErrors.join(' ');
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

  // Helper function to get redirect path based on role
  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'operator':
        return '/operator/dashboard';
      case 'citizen':
        return '/citizen/dashboard';
      default:
        return '/login';
    }
  };

  // Logout function - now properly handles backend logout and complete cleanup
  const logout = async () => {
    try {
      console.log('Logout initiated for user:', user?.email);
      
      // Call backend logout to invalidate session
      if (apiService.getToken()) {
        await apiService.logout();
      }
    } catch (error) {
      // Continue with logout even if backend call fails
      console.warn('Backend logout failed, continuing with client logout:', error);
    } finally {
      // Always clear all client state and storage
      clearAllStorage();
      setUser(null);
      setError('');
      
      console.log('Logout completed - all data cleared');
      
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
      console.log('Profile updated for user:', updatedUser.email);
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

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!apiService.getToken();
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  // Check if user is operator
  const isOperator = () => {
    return hasRole('operator');
  };

  // Check if user is citizen
  const isCitizen = () => {
    return hasRole('citizen');
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
    changePassword,
    refreshUser,
    
    // Utility functions
    hasRole,
    hasAnyRole,
    isAuthenticated,
    isAdmin,
    isOperator,
    isCitizen,
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