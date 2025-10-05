// navigation/AppNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import SideMenu from '../components/SideMenu';
import BottomNavigation from '../components/BottomNavigation';
// Import other screens as needed

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
    {/* Add other screens here */}
  </Stack.Navigator>
);

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
    <Drawer.Screen name="MainStack" component={MainStack} />
  </Drawer.Navigator>
);

const AppNavigator = () => {
  return <MainDrawer />;
};

export default AppNavigator;
