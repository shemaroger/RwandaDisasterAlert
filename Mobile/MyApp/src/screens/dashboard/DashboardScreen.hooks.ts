// screens/dashboard/DashboardScreen.hooks.js
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import apiService from '../../services/api';
import { DEFAULT_USER_NAME, MAX_RECENT_ALERTS } from './DashboardScreen.constants';

export const useDashboardData = () => {
  const [stats, setStats] = useState({
    total_alerts_received: 0,
    incidents_reported: 0,
    safety_guides_viewed: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(DEFAULT_USER_NAME);

  const loadDashboardData = async () => {
    try {
      const [profileData, alertsData] = await Promise.all([
        apiService.getProfile().catch(() => ({ first_name: DEFAULT_USER_NAME })),
        apiService.getActiveAlerts().catch(() => []),
      ]);

      setUserName(profileData?.first_name || DEFAULT_USER_NAME);
      setRecentAlerts(alertsData.slice(0, MAX_RECENT_ALERTS));

      // Mock stats - replace with actual API call when available
      setStats({
        total_alerts_received: 12,
        incidents_reported: 2,
        safety_guides_viewed: 8,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    stats,
    recentAlerts,
    loading,
    userName,
    refreshData: loadDashboardData,
  };
};

export const useLogout = (navigation) => {
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.logout();
            navigation.replace('Welcome');
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  return { handleLogout };
};