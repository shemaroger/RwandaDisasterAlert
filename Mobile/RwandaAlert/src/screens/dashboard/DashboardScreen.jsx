// screens/dashboard/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../../components/BottomNavigation';
import apiService from '../../services/api';

const DashboardScreen = ({ navigation, route }: any) => {
  const [stats, setStats] = useState({
    total_alerts_received: 0,
    incidents_reported: 0,
    safety_guides_viewed: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Citizen');

  const loadDashboardData = async () => {
    try {
      const [profileData, alertsData] = await Promise.all([
        apiService.getProfile().catch(() => ({ first_name: 'Citizen' })),
        apiService.getActiveAlerts().catch(() => []),
      ]);
      setUserName(profileData?.first_name || 'Citizen');
      setRecentAlerts(alertsData.slice(0, 3));
      // Mock stats
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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
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
      ]
    );
  };

  const handleMenuPress = () => {
    if (navigation.openDrawer) {
      navigation.openDrawer();
    } else {
      // Fallback if drawer is not available
      navigation.navigate('Settings');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
        {/* Header with Menu Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleMenuPress}>
            <Ionicons name="menu" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="notifications" size={24} color="#DC2626" />
                <Text style={styles.statValue}>{stats.total_alerts_received}</Text>
                <Text style={styles.statLabel}>Alerts</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="camera" size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{stats.incidents_reported}</Text>
                <Text style={styles.statLabel}>Incidents</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons name="book" size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{stats.safety_guides_viewed}</Text>
                <Text style={styles.statLabel}>Guides</Text>
              </View>
            </View>
          </View>

          {/* Recent Alerts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            {recentAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                <Text style={styles.emptyText}>No recent alerts</Text>
              </View>
            ) : (
              recentAlerts.map((alert: any) => (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertItem}
                  onPress={() => navigation.navigate('AlertDetail', { alertId: alert.id })}
                >
                  <Ionicons name="warning" size={20} color="#EF4444" />
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('ReportIncident')}
            >
              <Ionicons name="camera" size={20} color="#DC2626" />
              <Text style={styles.actionText}>Report Incident</Text>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('EmergencyContacts')}
            >
              <Ionicons name="call" size={20} color="#10B981" />
              <Text style={styles.actionText}>Emergency Contacts</Text>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('SafetyGuides')}
            >
              <Ionicons name="book" size={20} color="#3B82F6" />
              <Text style={styles.actionText}>Safety Guides</Text>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation navigation={navigation} currentRoute={route.name} />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#94A3B8',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom navigation
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
    marginLeft: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 8,
  },
  emptyText: {
    color: '#6EE7B7',
    fontSize: 14,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    margin: 20,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});

export default DashboardScreen;