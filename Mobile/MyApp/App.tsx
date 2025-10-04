import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Home from "./src/screens/Home";
import Login from "./src/screens/Login";
import Signup from "./src/screens/Signup";
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import SideMenu from './src/components/SideMenu';
import BottomNavigation from './src/components/BottomNavigation';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined; // This will be your drawer + bottom nav
};

export type DrawerParamList = {
  Dashboard: undefined;
  Alerts: undefined;
  ReportIncident: undefined;
  SafetyGuides: undefined;
  EmergencyContacts: undefined;
  Settings: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Drawer Navigator (Side Menu + Bottom Navigation)
const MainDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <SideMenu {...props} />}
    screenOptions={{
      drawerStyle: {
        width: 250,
        backgroundColor: '#1E293B',
      },
      headerShown: false,
    }}
  >
    <Drawer.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ title: "Dashboard" }}
    />
    {/* Add other drawer screens here as needed */}
  </Drawer.Navigator>
);

// Main App Navigator
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerTitleAlign: "center" }}
      >
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ title: "Welcome" }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ title: "Sign in" }}
        />
        <Stack.Screen
          name="Signup"
          component={Signup}
          options={{ title: "Create account" }}
        />
        <Stack.Screen
          name="Main"
          component={MainDrawer}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
