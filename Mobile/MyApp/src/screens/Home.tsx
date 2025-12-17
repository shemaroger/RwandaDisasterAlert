// src/screens/Home.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService, { Alert as AlertType } from '../services/api';

// ============================================================================
// CONSTANTS
// ============================================================================

const GRADIENT_COLORS = ['#0F172A', '#1E293B'];

const COLORS = {
  primary: '#DC2626',
  warning: '#F59E0B',
  info: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  white: '#FFF',
  gray: {
    light: '#94A3B8',
    medium: '#64748B',
  },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#F59E0B',
  low: '#10B981',
};

// ============================================================================
// TYPES
// ============================================================================

interface HomeScreenProps {
  navigation: any;
}

type SeverityType = 'critical' | 'high' | 'medium' | 'low';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Header: React.FC<{ 
  onEmergencyCall: () => void;
  onLogin: () => void;
  onSignup: () => void;
  isAuthenticated: boolean;
}> = ({ onEmergencyCall, onLogin, onSignup, isAuthenticated }) => (
  <View style={styles.headerContainer}>
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>MINEMA Alert</Text>
        <Text style={styles.subtitle}>Rwanda Emergency Management</Text>
      </View>
      <TouchableOpacity style={styles.emergencyButton} onPress={onEmergencyCall}>
        <Ionicons name="call" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
    
    {/* Auth Buttons in Header - Only show when not authenticated */}
    {!isAuthenticated && (
      <View style={styles.headerAuthButtons}>
        <TouchableOpacity style={styles.headerLoginButton} onPress={onLogin}>
          <Ionicons name="log-in-outline" size={18} color={COLORS.white} />
          <Text style={styles.headerLoginText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerSignupButton} onPress={onSignup}>
          <Ionicons name="person-add-outline" size={18} color="#FCA5A5" />
          <Text style={styles.headerSignupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

const EmergencyCard: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={styles.emergencyCard} onPress={onPress}>
    <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.emergencyGradient}>
      <Ionicons name="warning" size={32} color={COLORS.white} />
      <View style={styles.emergencyText}>
        <Text style={styles.emergencyLabel}>Emergency Hotline</Text>
        <Text style={styles.emergencyNumber}>112</Text>
      </View>
      <Ionicons name="call" size={28} color={COLORS.white} />
    </LinearGradient>
  </TouchableOpacity>
);

const SOSButton: React.FC<{
  onPress: () => void;
  onLongPress: () => void;
}> = ({ onPress, onLongPress }) => (
  <TouchableOpacity
    style={styles.sosButton}
    onPress={onPress}
    onLongPress={onLongPress}
  >
    <LinearGradient colors={['#991B1B', '#7F1D1D']} style={styles.sosGradient}>
      <Ionicons name="alert-circle" size={40} color={COLORS.white} />
      <Text style={styles.sosText}>SOS</Text>
      <Text style={styles.sosSubtext}>Press for Emergency</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const QuickActionsGrid: React.FC<{
  onReportIncident: () => void;
  onSafetyGuides: () => void;
  isAuthenticated: boolean;
}> = ({ onReportIncident, onSafetyGuides, isAuthenticated }) => (
  <View style={styles.section}>
    <View style={styles.actionsGrid}>
      <TouchableOpacity 
        style={[styles.actionCard, !isAuthenticated && styles.actionCardDisabled]} 
        onPress={onReportIncident}
      >
        <View style={[styles.actionIcon, { backgroundColor: COLORS.primary }]}>
          <Ionicons name="camera-outline" size={28} color={COLORS.white} />
          {!isAuthenticated && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color="#FFF" />
            </View>
          )}
        </View>
        <Text style={styles.actionText}>Report{'\n'}Incident</Text>
        {!isAuthenticated && (
          <Text style={styles.loginRequiredBadge}>Login Required</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionCard, !isAuthenticated && styles.actionCardDisabled]} 
        onPress={onSafetyGuides}
      >
        <View style={[styles.actionIcon, { backgroundColor: COLORS.info }]}>
          <Ionicons name="book-outline" size={28} color={COLORS.white} />
          {!isAuthenticated && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color="#FFF" />
            </View>
          )}
        </View>
        <Text style={styles.actionText}>Safety{'\n'}Guides</Text>
        {!isAuthenticated && (
          <Text style={styles.loginRequiredBadge}>Login Required</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const AlertCard: React.FC<{
  alert: AlertType;
  onPress: () => void;
  getSeverityColor: (severity: string) => string;
}> = ({ alert, onPress, getSeverityColor }) => (
  <TouchableOpacity style={styles.alertCard} onPress={onPress}>
    <View
      style={[
        styles.alertIndicator,
        { backgroundColor: getSeverityColor(alert.severity) },
      ]}
    />
    <View style={styles.alertContent}>
      <Text style={styles.alertTitle} numberOfLines={2}>
        {alert.title}
      </Text>
      <Text style={styles.alertMessage} numberOfLines={2}>
        {alert.message}
      </Text>
      <View style={styles.alertFooter}>
        <Text
          style={[
            styles.alertSeverity,
            { color: getSeverityColor(alert.severity) },
          ]}
        >
          {alert.severity.toUpperCase()}
        </Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.gray.medium} />
  </TouchableOpacity>
);

const EmptyAlertsState: React.FC = () => (
  <View style={styles.emptyState}>
    <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
    <Text style={styles.emptyTitle}>No Active Alerts</Text>
    <Text style={styles.emptyText}>Your area is currently safe</Text>
  </View>
);

const LoadingState: React.FC = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>Loading alerts...</Text>
  </View>
);

const SafetyTipCard: React.FC = () => (
  <View style={styles.section}>
    <View style={styles.tipCard}>
      <Ionicons name="shield-checkmark" size={32} color={COLORS.info} />
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>Stay Prepared</Text>
        <Text style={styles.tipText}>
          Keep emergency supplies ready and know your evacuation routes
        </Text>
      </View>
    </View>
  </View>
);

const AuthPromptCard: React.FC<{
  onLogin: () => void;
  onSignup: () => void;
}> = ({ onLogin, onSignup }) => (
  <View style={styles.section}>
    <View style={styles.authPromptCard}>
      <Ionicons name="person-circle-outline" size={48} color="#60A5FA" />
      <Text style={styles.authPromptTitle}>Get Full Access</Text>
      <Text style={styles.authPromptText}>
        Login or create an account to report incidents and access safety guides
      </Text>
      <View style={styles.authPromptButtons}>
        <TouchableOpacity style={styles.authPromptLoginButton} onPress={onLogin}>
          <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
          <Text style={styles.authPromptLoginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authPromptSignupButton} onPress={onSignup}>
          <Ionicons name="person-add-outline" size={20} color="#FCA5A5" />
          <Text style={styles.authPromptSignupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [activeAlerts, setActiveAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    loadAlerts();
  }, []);

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      const authenticated = await apiService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

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
    await Promise.all([checkAuthStatus(), loadAlerts()]);
    setRefreshing(false);
  };

  // Show login required alert
  const showLoginRequired = (feature: string) => {
    Alert.alert(
      'Login Required',
      `You need to login to access ${feature}. Would you like to login now?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Login',
          onPress: () => navigation.navigate('Login'),
        },
        {
          text: 'Sign Up',
          onPress: () => navigation.navigate('Signup'),
        },
      ],
      { cancelable: true }
    );
  };

  // Handle Report Incident with auth check
  const handleReportIncident = () => {
    if (!isAuthenticated) {
      showLoginRequired('Report Incident');
      return;
    }
    navigation.navigate('ReportIncident');
  };

  // Handle Safety Guides with auth check
  const handleSafetyGuides = () => {
    if (!isAuthenticated) {
      showLoginRequired('Safety Guides');
      return;
    }
    navigation.navigate('SafetyGuides');
  };

  // Emergency call handler
  const handleEmergencyCall = () => {
    Linking.openURL('tel:112');
  };

  // SOS handler
  const handleSOS = () => {
    Alert.alert(
      'SOS Emergency',
      'This will immediately call 112 and send your location to emergency services. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            if (isAuthenticated) {
              console.log('Sending SOS with location...');
            }
            Linking.openURL('tel:112');
          },
        },
      ]
    );
  };

  // Quick SOS on long press
  const handleSOSLongPress = () => {
    Linking.openURL('tel:112');
  };

  // Alert detail handler
  const handleAlertPress = (alertId: number) => {
    navigation.navigate('AlertDetail', { alertId });
  };

  // Navigation handlers
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  // Severity color helper
  const getSeverityColor = (severity: string): string => {
    const severityKey = severity as SeverityType;
    return SEVERITY_COLORS[severityKey] || COLORS.success;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
        <Header 
          onEmergencyCall={handleEmergencyCall}
          onLogin={handleLogin}
          onSignup={handleSignup}
          isAuthenticated={isAuthenticated}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.error}
            />
          }
        >
          <EmergencyCard onPress={handleEmergencyCall} />

          <SOSButton onPress={handleSOS} onLongPress={handleSOSLongPress} />

          {/* Show auth prompt if not authenticated */}
          {!isAuthenticated && (
            <AuthPromptCard onLogin={handleLogin} onSignup={handleSignup} />
          )}

          <QuickActionsGrid
            onReportIncident={handleReportIncident}
            onSafetyGuides={handleSafetyGuides}
            isAuthenticated={isAuthenticated}
          />

          {/* Active Alerts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>

            {loading ? (
              <LoadingState />
            ) : activeAlerts.length === 0 ? (
              <EmptyAlertsState />
            ) : (
              activeAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onPress={() => handleAlertPress(alert.id)}
                  getSeverityColor={getSeverityColor}
                />
              ))
            )}
          </View>

          <SafetyTipCard />

          <View style={{ height: 80 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradient: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  headerAuthButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerLoginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  headerLoginText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  headerSignupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  headerSignupText: {
    color: '#FCA5A5',
    fontSize: 15,
    fontWeight: '600',
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
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  actionCardDisabled: {
    opacity: 0.7,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
  loginRequiredBadge: {
    fontSize: 10,
    color: '#FCA5A5',
    marginTop: 4,
    fontWeight: '600',
  },
  authPromptCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginTop: 12,
    marginBottom: 8,
  },
  authPromptText: {
    fontSize: 14,
    color: '#93C5FD',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  authPromptButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  authPromptLoginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  authPromptLoginText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  authPromptSignupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  authPromptSignupText: {
    color: '#FCA5A5',
    fontSize: 15,
    fontWeight: '600',
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
});

export default HomeScreen;