// screens/home/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';

const { width } = Dimensions.get('window');

interface Alert {
  id: number;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  disaster_type: number;
  created_at: string;
  affected_locations: number[];
}

interface EmergencyContact {
  id: number;
  name: string;
  phone_number: string;
  contact_type: string;
}

const HomeScreen = ({ navigation }: any) => {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alertsResponse, contactsResponse, profile] = await Promise.all([
        apiService.getPublicActiveAlerts(),
        apiService.getPublicEmergencyContacts({ page_size: 5 }),
        apiService.getProfile().catch(() => ({ first_name: 'User' })),
      ]);

      setActiveAlerts(alertsResponse.slice(0, 3));
      setEmergencyContacts(contactsResponse.results?.slice(0, 4) || []);
      setUserName(profile.first_name || 'User');
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#EA580C';
      case 'medium':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'warning';
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const quickActions = [
    {
      id: 1,
      title: 'Report\nIncident',
      icon: 'camera',
      color: '#DC2626',
      onPress: () => navigation.navigate('ReportIncident'),
    },
    {
      id: 2,
      title: 'Safety\nGuides',
      icon: 'book',
      color: '#3B82F6',
      onPress: () => navigation.navigate('SafetyGuides'),
    },
    {
      id: 3,
      title: 'Emergency\nContacts',
      icon: 'call',
      color: '#10B981',
      onPress: () => navigation.navigate('EmergencyContacts'),
    },
    {
      id: 4,
      title: 'My\nProfile',
      icon: 'person',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {userName}</Text>
              <Text style={styles.subtitle}>Stay safe, stay informed</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications" size={24} color="#FFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{activeAlerts.length}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Emergency Banner */}
          <TouchableOpacity style={styles.emergencyBanner}>
            <LinearGradient
              colors={['#DC2626', '#B91C1C']}
              style={styles.emergencyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.emergencyContent}>
                <Ionicons name="call" size={32} color="#FFF" />
                <View style={styles.emergencyText}>
                  <Text style={styles.emergencyTitle}>Emergency Hotline</Text>
                  <Text style={styles.emergencyNumber}>112</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={action.onPress}
                >
                  <LinearGradient
                    colors={[`${action.color}20`, `${action.color}10`]}
                    style={styles.quickActionGradient}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                      <Ionicons name={action.icon as any} size={24} color="#FFF" />
                    </View>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Active Alerts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Alerts</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading alerts...</Text>
              </View>
            ) : activeAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={styles.emptyStateTitle}>No Active Alerts</Text>
                <Text style={styles.emptyStateText}>Your area is currently safe</Text>
              </View>
            ) : (
              activeAlerts.map((alert) => (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertCard}
                  onPress={() => navigation.navigate('AlertDetail', { alertId: alert.id })}
                >
                  <View style={[styles.alertSeverity, { backgroundColor: getSeverityColor(alert.severity) }]}>
                    <Ionicons name={getSeverityIcon(alert.severity) as any} size={24} color="#FFF" />
                  </View>
                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertTitle} numberOfLines={2}>
                        {alert.title}
                      </Text>
                      <Text style={[styles.alertBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                        {alert.severity.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.alertMessage} numberOfLines={2}>
                      {alert.message}
                    </Text>
                    <Text style={styles.alertTime}>{formatDate(alert.created_at)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748B" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Emergency Contacts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              <TouchableOpacity onPress={() => navigation.navigate('EmergencyContacts')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {emergencyContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactCard}
                onPress={() => Alert.alert('Call', `Call ${contact.name}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Call', onPress: () => console.log('Call:', contact.phone_number) },
                ])}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name="call" size={20} color="#10B981" />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactType}>{contact.contact_type}</Text>
                </View>
                <Text style={styles.contactNumber}>{contact.phone_number}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Safety Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Tips</Text>
            <View style={styles.tipsCard}>
              <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
              <View style={styles.tipsContent}>
                <Text style={styles.tipsTitle}>Stay Prepared</Text>
                <Text style={styles.tipsText}>
                  Keep emergency supplies ready, know evacuation routes, and stay informed about local alerts.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer Spacing */}
          <View style={{ height: 100 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  notificationButton: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emergencyBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emergencyText: {
    gap: 4,
  },
  emergencyTitle: {
    fontSize: 14,
    color: '#FEE2E2',
    fontWeight: '600',
  },
  emergencyNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
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
  },
  seeAllText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6EE7B7',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    gap: 12,
  },
  alertSeverity: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
    gap: 6,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 22,
  },
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  alertMessage: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#64748B',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  contactContent: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  contactType: {
    fontSize: 13,
    color: '#94A3B8',
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  tipsContent: {
    flex: 1,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
  },
  tipsText: {
    fontSize: 14,
    color: '#93C5FD',
    lineHeight: 20,
  },
});

export default HomeScreen;