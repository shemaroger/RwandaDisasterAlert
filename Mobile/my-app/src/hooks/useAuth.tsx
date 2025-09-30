// hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';

interface User {
  id: string | number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'admin' | 'operator' | 'authority' | 'citizen';
  phone_number?: string;
  preferred_language?: string;
  district?: string;
  is_active?: boolean;
  is_approved?: boolean;
  date_joined?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      
      if (token) {
        // Token exists, try to fetch user profile
        try {
          const userProfile = await apiService.getProfile();
          setUser(userProfile.user || userProfile);
          setIsAuthenticated(true);
        } catch (err) {
          // Token is invalid or expired
          console.log('Token invalid, clearing auth state');
          await clearAuthState();
        }
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearAuthState = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = async (username: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.login(username, password);

      if (response.token) {
        await apiService.setToken(response.token);
        
        // Store remember me preference
        if (rememberMe) {
          await AsyncStorage.setItem('remember_user', 'true');
        } else {
          await AsyncStorage.removeItem('remember_user');
        }

        // Fetch user profile
        let userProfile;
        try {
          userProfile = await apiService.getProfile();
        } catch (profileErr) {
          // If profile fetch fails, use data from login response
          userProfile = response.user || response;
        }

        const userData = userProfile.user || userProfile;
        
        // Store user data locally
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);

        return {
          success: true,
          user: userData,
          token: response.token,
        };
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.register(userData);

      // Some backends automatically log in after registration
      if (response.token) {
        await apiService.setToken(response.token);
        
        const userProfile = response.user || response;
        await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
        
        setUser(userProfile);
        setIsAuthenticated(true);

        return {
          success: true,
          user: userProfile,
          token: response.token,
        };
      } else {
        // Registration successful but not auto-logged in
        return {
          success: true,
          message: 'Registration successful. Please log in.',
        };
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Extract error message from API response
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.data) {
        if (typeof err.data === 'string') {
          errorMessage = err.data;
        } else if (err.data.detail) {
          errorMessage = err.data.detail;
        } else if (err.data.message) {
          errorMessage = err.data.message;
        } else if (typeof err.data === 'object') {
          // Format validation errors
          const errors: string[] = [];
          Object.entries(err.data).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          });
          if (errors.length > 0) {
            errorMessage = errors.join('\n');
          }
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

  const logout = async () => {
    try {
      setLoading(true);
      
      // Call backend logout endpoint
      try {
        await apiService.logout();
      } catch (err) {
        console.warn('Backend logout failed:', err);
        // Continue with local logout even if backend fails
      }

      // Clear local state
      await clearAuthState();
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Force clear local state even if there's an error
      await clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update stored user data
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      const userProfile = await apiService.getProfile();
      const userData = userProfile.user || userProfile;
      
      setUser(userData);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // If refresh fails with 401, user might be logged out
      if (err instanceof Error && err.message.includes('401')) {
        await clearAuthState();
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    clearError,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper hook for checking user role
export const useUserRole = () => {
  const { user } = useAuth();
  
  return {
    isAdmin: user?.user_type === 'admin',
    isOperator: user?.user_type === 'operator' || user?.user_type === 'admin',
    isAuthority: user?.user_type === 'authority' || user?.user_type === 'admin',
    isCitizen: user?.user_type === 'citizen',
    userType: user?.user_type,
  };
};

// Helper hook for checking user permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  const canManageUsers = user?.user_type === 'admin';
  const canCreateAlerts = ['admin', 'authority'].includes(user?.user_type || '');
  const canManageIncidents = ['admin', 'operator'].includes(user?.user_type || '');
  const canViewReports = ['admin', 'authority', 'operator'].includes(user?.user_type || '');
  const canReportIncidents = true; // All authenticated users can report
  const canViewAlerts = true; // All authenticated users can view alerts

  return {
    canManageUsers,
    canCreateAlerts,
    canManageIncidents,
    canViewReports,
    canReportIncidents,
    canViewAlerts,
  };
};

export default useAuth;