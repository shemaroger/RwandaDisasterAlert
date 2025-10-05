import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Home from "./src/screens/Home";
import Login from "./src/screens/Login";
import Signup from "./src/screens/Signup";
import DashboardScreen from './src/screens/dashboard/DashboardScreen';

export type RootStackParamList = {
  Home: undefined;
  Login: { username?: string; message?: string };
  Signup: undefined;
  Dashboard: undefined;
  Alerts: undefined;
  AlertDetail: { alertId: number };
  ReportIncident: undefined;
  SafetyGuides: undefined;
  EmergencyContacts: undefined;
  Profile: undefined;
  Settings: undefined;
  MyIncidents: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Placeholder component for screens not yet created
const PlaceholderScreen = ({ navigation, route }: any) => {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{route.name}</Text>
      <Text style={styles.placeholderText}>Coming soon...</Text>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home" 
        screenOptions={{ 
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: '#1E293B' },
          headerTintColor: '#FFF',
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen 
          name="Home" 
          component={Home} 
          options={{ title: "Welcome", headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ title: "Sign in", headerShown: false }} 
        />
        <Stack.Screen 
          name="Signup" 
          component={Signup} 
          options={{ title: "Create account", headerShown: false }} 
        />
        
        {/* Main App Screens */}
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Feature Screens - Using Placeholders until you create them */}
        <Stack.Screen 
          name="Alerts" 
          component={PlaceholderScreen}
          options={{ title: "Active Alerts" }}
        />
        <Stack.Screen 
          name="AlertDetail" 
          component={PlaceholderScreen}
          options={{ title: "Alert Details" }}
        />
        <Stack.Screen 
          name="ReportIncident" 
          component={PlaceholderScreen}
          options={{ title: "Report Incident" }}
        />
        <Stack.Screen 
          name="SafetyGuides" 
          component={PlaceholderScreen}
          options={{ title: "Safety Guides" }}
        />
        <Stack.Screen 
          name="EmergencyContacts" 
          component={PlaceholderScreen}
          options={{ title: "Emergency Contacts" }}
        />
        <Stack.Screen 
          name="Profile" 
          component={PlaceholderScreen}
          options={{ title: "My Profile" }}
        />
        <Stack.Screen 
          name="Settings" 
          component={PlaceholderScreen}
          options={{ title: "Settings" }}
        />
        <Stack.Screen 
          name="MyIncidents" 
          component={PlaceholderScreen}
          options={{ title: "My Incidents" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 20,
  },
  placeholderTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});