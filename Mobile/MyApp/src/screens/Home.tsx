// screens/home/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/api';

const HomeScreen = ({ navigation }: any) => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const alerts = await apiService.getPublicActiveAlerts();
      setActiveAlerts(alerts.slice(0, 5));
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>MINEMA Alert</Text>
            <Text style={styles.subtitle}>Rwanda Emergency Management</Text>
          </View>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => Linking.openURL('tel:112')}
          >
            <Ionicons name="call" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />
          }
        >
          {/* Emergency Call Card */}
          <TouchableOpacity 
            style={styles.emergencyCard}
            onPress={() => Linking.openURL('tel:112')}
          >
            <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.emergencyGradient}>
              <Ionicons name="warning" size={32} color="#FFF" />
              <View style={styles.emergencyText}>
                <Text style={styles.emergencyLabel}>Emergency Hotline</Text>
                <Text style={styles.emergencyNumber}>112</Text>
              </View>
              <Ionicons name="call" size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* SOS Button */}
          <TouchableOpacity 
            style={styles.sosButton}
            onPress={() => {
              Alert.alert(
                'SOS Emergency',
                'This will immediately call 112 and send your location to emergency services. Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Send SOS', 
                    style: 'destructive',
                    onPress: () => {
                      // TODO: Send location to backend
                      Linking.openURL('tel:112');
                    }
                  },
                ]
              );
            }}
            onLongPress={() => {
              // Quick SOS on long press
              Linking.openURL('tel:112');
            }}
          >
            <LinearGradient 
              colors={['#991B1B', '#7F1D1D']} 
              style={styles.sosGradient}
            >
              <Ionicons name="alert-circle" size={40} color="#FFF" />
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>Press for Emergency</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('ReportIncident')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#DC2626' }]}>
                  <Ionicons name="camera-outline" size={28} color="#FFF" />
                </View>
                <Text style={styles.actionText}>Report{'\n'}Incident</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('SafetyGuides')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
                  <Ionicons name="book-outline" size={28} color="#FFF" />
                </View>
                <Text style={styles.actionText}>Safety{'\n'}Guides</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('EmergencyContacts')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="call-outline" size={28} color="#FFF" />
                </View>
                <Text style={styles.actionText}>Emergency{'\n'}Contacts</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('Profile')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="person-outline" size={28} color="#FFF" />
                </View>
                <Text style={styles.actionText}>My{'\n'}Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Alerts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading alerts...</Text>
              </View>
            ) : activeAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={styles.emptyTitle}>No Active Alerts</Text>
                <Text style={styles.emptyText}>Your area is currently safe</Text>
              </View>
            ) : (
              activeAlerts.map((alert: any) => (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertCard}
                  onPress={() => navigation.navigate('AlertDetail', { alertId: alert.id })}
                >
                  <View style={[styles.alertIndicator, { backgroundColor: getSeverityColor(alert.severity) }]} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle} numberOfLines={2}>{alert.title}</Text>
                    <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
                    <View style={styles.alertFooter}>
                      <Text style={[styles.alertSeverity, { color: getSeverityColor(alert.severity) }]}>
                        {alert.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748B" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Safety Tip */}
          <View style={styles.section}>
            <View style={styles.tipCard}>
              <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Stay Prepared</Text>
                <Text style={styles.tipText}>
                  Keep emergency supplies ready and know your evacuation routes
                </Text>
              </View>
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <View style={styles.accountActions}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Ionicons name="log-in-outline" size={20} color="#FFF" />
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => navigation.navigate('Signup')}
              >
                <Ionicons name="person-add-outline" size={20} color="#FCA5A5" />
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  emergencyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emergencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  emergencyText: {
    flex: 1,
    marginLeft: 16,
  },
  emergencyLabel: {
    fontSize: 14,
    color: '#FEE2E2',
    marginBottom: 4,
  },
  emergencyNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sosButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  sosGradient: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  sosText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 4,
  },
  sosSubtext: {
    fontSize: 14,
    color: '#FCA5A5',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 16,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6EE7B7',
    marginTop: 4,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  alertIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
  },
  alertMessage: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#93C5FD',
    lineHeight: 20,
  },
  accountActions: {
    gap: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
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
  signupButtonText: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;