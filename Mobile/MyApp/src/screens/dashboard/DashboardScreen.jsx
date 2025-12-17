// screens/dashboard/DashboardScreen.jsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import BottomNavigation from '../../components/BottomNavigation';
import { styles } from './DashboardScreen.styles';
import { useDashboardData, useLogout } from './DashboardScreen.hooks';
import { GRADIENT_COLORS, COLORS, ICON_SIZES } from './DashboardScreen.constants';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Header = ({ userName, onMenuPress }) => (
  <View style={styles.header}>
    
    <View>
      <Text style={styles.greeting}>Welcome back,</Text>
      <Text style={styles.userName}>{userName}</Text>
    </View>
  </View>
);

const StatBox = ({ icon, value, label, color, onPress }) => (
  <TouchableOpacity style={styles.statBox} onPress={onPress}>
    <Ionicons name={icon} size={ICON_SIZES.large} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const StatsSection = ({ stats, onIncidentsPress, onGuidesPress }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Your Activity</Text>
    <View style={styles.statsRow}>
      <StatBox
        icon="notifications"
        value={stats.total_alerts_received}
        label="Alerts"
        color={COLORS.primary}
        onPress={() => {}} // Could navigate to alerts list
      />
      <StatBox
        icon="camera"
        value={stats.incidents_reported}
        label="Incidents"
        color={COLORS.warning}
        onPress={onIncidentsPress}
      />
      <StatBox
        icon="book"
        value={stats.safety_guides_viewed}
        label="Guides"
        color={COLORS.info}
        onPress={onGuidesPress}
      />
    </View>
  </View>
);

const AlertItem = ({ alert, onPress }) => (
  <TouchableOpacity style={styles.alertItem} onPress={onPress}>
    <Ionicons name="warning" size={ICON_SIZES.medium} color={COLORS.error} />
    <Text style={styles.alertTitle}>{alert.title}</Text>
    <Ionicons name="chevron-forward" size={ICON_SIZES.small} color={COLORS.gray.medium} />
  </TouchableOpacity>
);

const EmptyAlerts = () => (
  <View style={styles.emptyState}>
    <Ionicons name="checkmark-circle" size={ICON_SIZES.xlarge} color={COLORS.success} />
    <Text style={styles.emptyText}>No recent alerts</Text>
  </View>
);

const RecentAlertsSection = ({ alerts, onAlertPress }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Recent Alerts</Text>
    {alerts.length === 0 ? (
      <EmptyAlerts />
    ) : (
      alerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onPress={() => onAlertPress(alert.id)}
        />
      ))
    )}
  </View>
);

const ActionItem = ({ icon, text, color, onPress, badge }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    <View style={styles.actionItemContent}>
      <Ionicons name={icon} size={ICON_SIZES.medium} color={color} />
      <Text style={styles.actionText}>{text}</Text>
    </View>
    <View style={styles.actionItemRight}>
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={ICON_SIZES.small} color={COLORS.gray.medium} />
    </View>
  </TouchableOpacity>
);

const QuickActionsSection = ({ onReportIncident, onMyIncidents, onSafetyGuides, incidentsCount }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Quick Actions</Text>
    <ActionItem
      icon="camera"
      text="Report Incident"
      color={COLORS.primary}
      onPress={onReportIncident}
    />
    <ActionItem
      icon="list"
      text="My Incidents"
      color={COLORS.warning}
      onPress={onMyIncidents}
      badge={incidentsCount}
    />
    <ActionItem
      icon="book"
      text="Safety Guides"
      color={COLORS.info}
      onPress={onSafetyGuides}
    />
  </View>
);

const LogoutButton = ({ onPress }) => (
  <TouchableOpacity style={styles.logoutButton} onPress={onPress}>
    <Ionicons name="log-out-outline" size={ICON_SIZES.medium} color={COLORS.error} />
    <Text style={styles.logoutText}>Logout</Text>
  </TouchableOpacity>
);

const LoadingView = () => (
  <SafeAreaView style={styles.container}>
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    </LinearGradient>
  </SafeAreaView>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DashboardScreen = ({ navigation, route }) => {
  const nav = useNavigation();
  
  // Custom Hooks
  const { stats, recentAlerts, loading, userName } = useDashboardData();
  const { handleLogout } = useLogout(navigation);

  // Event Handlers
  const handleAlertPress = (alertId) => {
    navigation.navigate('AlertDetail', { alertId });
  };

  const handleReportIncident = () => {
    navigation.navigate('ReportIncident');
  };

  const handleMyIncidents = () => {
    navigation.navigate('MyIncidents');
  };

  const handleSafetyGuides = () => {
    navigation.navigate('SafetyGuides');
  };

  const handleMenuPress = () => {
    nav.openDrawer();
  };

  // Render Loading State
  if (loading) {
    return <LoadingView />;
  }

  // Render Main Dashboard
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
        <Header userName={userName} onMenuPress={handleMenuPress} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <StatsSection 
            stats={stats} 
            onIncidentsPress={handleMyIncidents}
            onGuidesPress={handleSafetyGuides}
          />
          <RecentAlertsSection
            alerts={recentAlerts}
            onAlertPress={handleAlertPress}
          />
          <QuickActionsSection
            onReportIncident={handleReportIncident}
            onMyIncidents={handleMyIncidents}
            onSafetyGuides={handleSafetyGuides}
            incidentsCount={stats.incidents_reported}
          />
          <LogoutButton onPress={handleLogout} />
        </ScrollView>

        <BottomNavigation navigation={navigation} currentRoute={route.name} />
      </LinearGradient>
    </SafeAreaView>
  );
};

export default DashboardScreen;