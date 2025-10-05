import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./src/screens/Home";
import Login from "./src/screens/Login";
import Signup from "./src/screens/Signup";
import DashboardScreen from './src/screens/dashboard/DashboardScreen'; 


export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined; // Add this
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerTitleAlign: "center" }}>
        <Stack.Screen name="Home" component={Home} options={{ title: "Welcome" }} />
        <Stack.Screen name="Login" component={Login} options={{ title: "Sign in" }} />
        <Stack.Screen name="Signup" component={Signup} options={{ title: "Create account" }} />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ title: "Dashboard", headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}