import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Auth Screens
import Home from "./src/screens/Home";
import Login from "./src/screens/Login";
import Signup from "./src/screens/Signup";

// Main Screens
import DashboardScreen from './src/screens/dashboard/DashboardScreen';

// Incident Management
import ReportIncident from './src/screens/citizen/ReportIncident';
import MyIncidents from './src/screens/citizen/MyIncidents';
import EditIncident from './src/screens/citizen/EditIncident';
import IncidentDetail from './src/screens/citizen/IncidentDetail';

// Safety Guides
import SafetyGuides from './src/screens/citizen/SafetyGuides';
import SafetyGuideDetail from './src/screens/citizen/SafetyGuideDetail';

// Alerts
import Alerts from './src/screens/citizen/Alerts';

export type RootStackParamList = {
  // Auth
  Home: undefined;
  Login: { username?: string; message?: string };
  Signup: undefined;
  
  // Main
  Dashboard: undefined;
  
  // Alerts
  Alerts: undefined;
  AlertDetail: { alertId: number };
  
  // Incidents
  ReportIncident: undefined;
  MyIncidents: { citizenView?: boolean };
  EditIncident: { incidentId: string; citizenView?: boolean };
  IncidentDetail: { incidentId: string; citizenView?: boolean };
  
  // Safety Guides
  SafetyGuides: undefined;
  SafetyGuideDetail: { guideId: string };
  
  // Other (Placeholders)
  EmergencyContacts: undefined;
  Profile: undefined;
  Settings: undefined;
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
        
        {/* Alert Screens */}
        <Stack.Screen 
          name="Alerts" 
          component={Alerts}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AlertDetail" 
          component={PlaceholderScreen}
          options={{ title: "Alert Details" }}
        />
        
        {/* Incident Management Screens */}
        <Stack.Screen 
          name="ReportIncident" 
          component={ReportIncident}
          options={{ title: "Report Incident" }}
        />
        <Stack.Screen 
          name="MyIncidents" 
          component={MyIncidents}
          options={{ title: "My Incidents" }}
        />
        <Stack.Screen 
          name="EditIncident" 
          component={EditIncident}
          options={{ title: "Edit Incident" }}
        />
        <Stack.Screen 
          name="IncidentDetail" 
          component={IncidentDetail}
          options={{ title: "Incident Details" }}
        />
        
        {/* Safety Guide Screens */}
        <Stack.Screen 
          name="SafetyGuides" 
          component={SafetyGuides}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SafetyGuideDetail" 
          component={SafetyGuideDetail}
          options={{ headerShown: false }}
        />
        
        {/* Placeholder Screens */}
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