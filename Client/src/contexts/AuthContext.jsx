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

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const token = apiService.getToken();
        
        if (token) {
          // Try to get user profile with existing token
          try {
            const userData = await apiService.getProfile();
            setUser(userData);
            setError('');
          } catch (err) {
            // Token might be expired or invalid
            console.warn('Failed to load user profile:', err);
            apiService.logout();
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError('');

      const response = await apiService.login(email, password);
      
      if (response.token && response.user) {
        apiService.setToken(response.token);
        setUser(response.user);
        
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

      const response = await apiService.register(userData);
      
      if (response.token && response.user) {
        apiService.setToken(response.token);
        setUser(response.user);
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
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    apiService.logout();
    setUser(null);
    setError('');
    localStorage.removeItem('remember_user');
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setError('');
      const updatedUser = await apiService.updateProfile(profileData);
      setUser(updatedUser);
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
    updateProfile,
    changePassword,
    
    // Utility functions
    hasRole,
    hasAnyRole,
    isAuthenticated,
    isAdmin,
    isOperator,
    isCitizen,
    clearError,
    
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