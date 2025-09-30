// src/navigation/index.tsx
import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Import screens
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import Home from '../screens/Home';
import Dashboard from '../screens/Dashboard';

// Admin screens
import AdminDashboard from '../screens/admin/AdminDashboard';
// Operator screens
import OperatorDashboard from '../screens/operator/OperatorDashboard';
// Authority screens
import AuthorityDashboard from '../screens/authority/AuthorityDashboard';

// Shared screens
import Profile from '../screens/Profile';
import PasswordReset from '../screens/PasswordReset';

// Define navigation types
export type RootStackParamList = {
  // Public routes
  Home: undefined;
  Login: { 
    from?: string;
    message?: string;
    successMessage?: string;
    username?: string;
    email?: string;
  };
  Signup: undefined;
  PasswordReset: undefined;

  // Authenticated routes
  Dashboard: undefined;
  Profile: undefined;

  // Role-specific routes
  AdminDashboard: undefined;
  OperatorDashboard: undefined;
  AuthorityDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack - When user is not logged in
        <>
          <Stack.Screen 
            name="Home" 
            component={Home}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen 
            name="Login" 
            component={Login}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="Signup" 
            component={Signup}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen 
            name="PasswordReset" 
            component={PasswordReset}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      ) : (
        // Main App Stack - When user is logged in
        <>
          {/* Role-based initial screen */}
          {user?.user_type === 'admin' && (
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboard}
              options={{ animation: 'fade' }}
            />
          )}
          {user?.user_type === 'operator' && (
            <Stack.Screen 
              name="OperatorDashboard" 
              component={OperatorDashboard}
              options={{ animation: 'fade' }}
            />
          )}
          {user?.user_type === 'authority' && (
            <Stack.Screen 
              name="AuthorityDashboard" 
              component={AuthorityDashboard}
              options={{ animation: 'fade' }}
            />
          )}
          {user?.user_type === 'citizen' && (
            <Stack.Screen 
              name="Dashboard" 
              component={Dashboard}
              options={{ animation: 'fade' }}
            />
          )}
          
          {/* Shared authenticated screens */}
          <Stack.Screen 
            name="Profile" 
            component={Profile}
            options={{ 
              animation: 'slide_from_right',
              presentation: 'card'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});

export default RootNavigator;