// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { useAuth } from '../hooks/useAuth';
// import HomeScreen from '../screens/HomeScreen';
// import LoginScreen from '../screens/LoginScreen';
// import SignupScreen from '../screens/SignupScreen';
// import SettingsScreen from '../screens/SettingsScreen';
// import AnalyticsScreen from '../screens/AnalyticsScreen';
// import WhitelistBlacklistScreen from '../screens/WhitelistBlacklistScreen';
// import SpamReportScreen from '../screens/SpamReportScreen';
// import MessageDetailScreen from '../screens/MessageDetailScreen';

// const Stack = createStackNavigator();

// const AppNavigator = () => {
//   const { user } = useAuth();

//   return (
//     <NavigationContainer>
//       <Stack.Navigator>
//         {user ? (
//           <>
//             <Stack.Screen name="Home" component={HomeScreen} />
//             <Stack.Screen name="Settings" component={SettingsScreen} />
//             <Stack.Screen name="Analytics" component={AnalyticsScreen} />
//             <Stack.Screen name="WhitelistBlacklist" component={WhitelistBlacklistScreen} />
//             <Stack.Screen name="SpamReport" component={SpamReportScreen} />
//             <Stack.Screen name="MessageDetail" component={MessageDetailScreen} />
//           </>
//         ) : (
//           <>
//             <Stack.Screen name="Login" component={LoginScreen} />
//             <Stack.Screen name="Signup" component={SignupScreen} />
//           </>
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;
