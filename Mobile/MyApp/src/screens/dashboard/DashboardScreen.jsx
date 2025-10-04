// screens/dashboard/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../services/api';

interface DashboardStats {
  total_alerts_received: number;
  incidents_reported: number;
  safety_guides_viewed: number;
  last_alert_date?: string;
}

const DashboardScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<DashboardStats>({
    total_alerts_received: 0,
    incidents_reported: 0,
    safety_guides_viewed: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Citizen');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [profileData, alertsData] = await Promise.all([
        apiService.getProfile().catch(() => ({ first_name: 'Citizen' })),
        apiService.getActiveAlerts().catch(() => []),
      ]);

      setUserName(profileData?.first_name || 'Citizen');
      setRecentAlerts(alertsData.slice(0, 3));

      // Mock stats - replace with actual API calls
      setStats({
        total_alerts_received: 12,
        incidents_reported: 2,
        safety_guides_viewed: 8,
        last_alert_date: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

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

  const StatCard = ({ icon, label, value, color, onPress }: any) => (
    <TouchableOpacity 
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
        {/* Header */}
                  <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />
          }
        >
          {/* Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="notifications"
                label="Alerts Received"
                value={stats.total_alerts_received}
                color="#DC2626"
                onPress={() => navigation.navigate('Alerts')}
              />
              <StatCard
                icon="camera"
                label="Incidents Reported"
                value={stats.incidents_reported}
                color="#F59E0B"
                onPress={() => navigation.navigate('MyIncidents')}
              />
              <StatCard
                icon="book"
                label="Guides Viewed"
                value={stats.safety_guides_viewed}
                color="#3B82F6"
                onPress={() => navigation.navigate('SafetyGuides')}
              />
            </View>
          </View>

          {/* Recent Alerts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Alerts</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

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
                  <View style={styles.alertIcon}>
                    <Ionicons name="warning" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text style={styles.alertSeverity}>{alert.severity.toUpperCase()}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsList}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => navigation.navigate('ReportIncident')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#DC262620' }]}>
                  <Ionicons name="camera" size={20} color="#DC2626" />
                </View>
                <Text style={styles.actionText}>Report Incident</Text>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => navigation.navigate('EmergencyContacts')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="call" size={20} color="#10B981" />
                </View>
                <Text style={styles.actionText}>Emergency Contacts</Text>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => navigation.navigate('SafetyGuides')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="book" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.actionText}>Safety Guides</Text>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => navigation.navigate('Profile')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="person" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.actionText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
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
  safeArea: {
    flex: 1,
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
  scrollContent: {
    paddingBottom: 100, // Space for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  emptyText: {
    fontSize: 14,
    color: '#6EE7B7',
    marginTop: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  alertSeverity: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  actionsList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default DashboardScreen;