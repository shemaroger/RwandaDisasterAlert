import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import apiService from '../../services/api';

type AlertsProps = {
  navigation: any;
};

// Utility functions
const formatDateTime = (iso: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const formatTimeAgo = (iso: string) => {
  if (!iso) return '—';
  try {
    const now = new Date();
    const time = new Date(iso);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  } catch {
    return iso;
  }
};

const formatTimeRemaining = (expiresAt: string) => {
  if (!expiresAt) return null;
  try {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  } catch {
    return null;
  }
};

const formatCoordinate = (coord: any) => {
  if (!coord) return '';
  const num = parseFloat(coord);
  return isNaN(num) ? coord : num.toFixed(4);
};

const isValidCoordinate = (lat: any, lng: any) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

// Alert Map Component
const AlertMap = ({ lat, lng, radiusKm, title }: any) => {
  const [mapError, setMapError] = useState(false);

  // Validate coordinates
  if (!isValidCoordinate(lat, lng)) {
    console.log('Invalid coordinates:', { lat, lng });
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>⚠️ Invalid Location</Text>
        <Text style={styles.mapPlaceholderCoords}>
          Coordinates: {lat}, {lng}
        </Text>
      </View>
    );
  }

  // Convert to numbers
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radius = parseFloat(radiusKm) || 5;

  console.log('Rendering map with:', { latitude, longitude, radius });

  // If map failed to load, show placeholder
  if (mapError) {
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>📍 Map View</Text>
        <Text style={styles.mapPlaceholderCoords}>
          {formatCoordinate(latitude)}, {formatCoordinate(longitude)}
        </Text>
        <Text style={styles.mapPlaceholderRadius}>Radius: {radius} km</Text>
        <Text style={styles.mapPlaceholderError}>
          Map failed to load. Check Maps configuration.
        </Text>
      </View>
    );
  }

  const region = {
    latitude,
    longitude,
    latitudeDelta: (radius / 111) * 4,
    longitudeDelta: (radius / 111) * 4,
  };

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={region}
      region={region}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      onError={(error) => {
        console.error('MapView Error:', error);
        setMapError(true);
      }}
    >
      <Circle
        center={{ latitude, longitude }}
        radius={radius * 1000}
        fillColor="rgba(59, 130, 246, 0.2)"
        strokeColor="#3B82F6"
        strokeWidth={2}
      />
    </MapView>
  );
};

// Alert Card Component
const AlertCard = ({
  alert,
  onViewDetails,
  onResendNotifications,
  onCancelAlert,
  canManageAlerts,
}: any) => {
  const timeRemaining = formatTimeRemaining(alert.expires_at);
  const isNearExpiry = timeRemaining && timeRemaining.includes('h left') && parseInt(timeRemaining) < 6;
  const isExpired = timeRemaining === 'Expired';

  const severityColors: Record<string, { bg: string; text: string }> = {
    extreme: { bg: '#FEE2E2', text: '#991B1B' },
    severe: { bg: '#FED7AA', text: '#9A3412' },
    moderate: { bg: '#FEF3C7', text: '#92400E' },
    minor: { bg: '#DBEAFE', text: '#1E40AF' },
  };

  const color = severityColors[alert.severity?.toLowerCase()] || { bg: '#F3F4F6', text: '#374151' };

  const handleResend = () => {
    Alert.alert(
      'Resend Notifications',
      'Resend failed notifications for this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resend', onPress: () => onResendNotifications(alert.id) }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Alert',
      'Are you sure you want to cancel this alert? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => onCancelAlert(alert.id) }
      ]
    );
  };

  return (
    <View style={styles.alertCard}>
      {/* Header */}
      <View style={styles.alertHeader}>
        <View style={styles.alertHeaderContent}>
          <View style={[styles.severityIcon, { backgroundColor: color.bg }]}>
            <Text style={[styles.severityIconText, { color: color.text }]}>⚠️</Text>
          </View>
          <View style={styles.alertHeaderText}>
            <Text style={styles.alertTitle} numberOfLines={2}>
              {alert.title}
            </Text>
            <View style={styles.alertMeta}>
              <Text style={styles.alertMetaText}>{alert.disaster_type_name || 'Alert'}</Text>
              <Text style={styles.alertMetaSeparator}>•</Text>
              <Text style={[styles.alertSeverity, { color: color.text }]}>
                {alert.severity || 'moderate'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.alertStatus}>
          <View style={[styles.activeBadge, isExpired && styles.expiredBadge]}>
            <Text style={[styles.activeBadgeText, isExpired && styles.expiredBadgeText]}>
              {isExpired ? 'Expired' : 'Active'}
            </Text>
          </View>
          {timeRemaining && !isExpired && (
            <View style={[styles.timeBadge, isNearExpiry && styles.timeWarning]}>
              <Text style={[styles.timeBadgeText, isNearExpiry && styles.timeWarningText]}>
                {timeRemaining}
              </Text>
            </View>
          )}
          <Text style={styles.timeAgo}>{formatTimeAgo(alert.issued_at)}</Text>
        </View>
      </View>

      {/* Message */}
      <View style={styles.alertMessage}>
        <Text style={styles.alertMessageText} numberOfLines={3}>
          {alert.message}
        </Text>
      </View>

      {/* Geographic Targeting */}
      {(alert.center_lat || alert.center_lng) && (
        <View style={styles.geoSection}>
          <View style={styles.geoHeader}>
            <Text style={styles.geoTitle}>🎯 Geographic Targeting</Text>
            <Text style={styles.geoCoords}>
              {formatCoordinate(alert.center_lat)}, {formatCoordinate(alert.center_lng)}
              {alert.radius_km && ` (${alert.radius_km} km)`}
            </Text>
          </View>
          <View style={styles.miniMap}>
            <AlertMap
              lat={alert.center_lat}
              lng={alert.center_lng}
              radiusKm={alert.radius_km || 5}
              title={alert.title}
            />
          </View>
        </View>
      )}

      {/* Response Stats */}
      {alert.response_stats && Object.values(alert.response_stats).some((val: any) => val > 0) && (
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>👥 Citizen Responses</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{alert.response_stats.safe || 0}</Text>
              <Text style={styles.statLabel}>Safe</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{alert.response_stats.need_help || 0}</Text>
              <Text style={styles.statLabel}>Need Help</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{alert.response_stats.acknowledged || 0}</Text>
              <Text style={styles.statLabel}>Acknowledged</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.alertActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onViewDetails(alert)}
        >
          <Text style={styles.viewButtonText}>👁️ View Details</Text>
        </TouchableOpacity>

        {canManageAlerts && !isExpired && (
          <View style={styles.adminActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleResend}>
              <Text style={styles.iconButtonText}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonDanger} onPress={handleCancel}>
              <Text style={styles.iconButtonText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// View Alert Modal
const ViewAlertModal = ({ visible, alert, onClose, onResend, onCancel, canManage }: any) => {
  if (!alert) return null;

  const isExpired = formatTimeRemaining(alert.expires_at) === 'Expired';

  const severityColors: Record<string, { bg: string; text: string }> = {
    extreme: { bg: '#FEE2E2', text: '#991B1B' },
    severe: { bg: '#FED7AA', text: '#9A3412' },
    moderate: { bg: '#FEF3C7', text: '#92400E' },
    minor: { bg: '#DBEAFE', text: '#1E40AF' },
  };

  const color = severityColors[alert.severity?.toLowerCase()] || { bg: '#F3F4F6', text: '#374151' };

  const handleResend = () => {
    Alert.alert(
      'Resend Notifications',
      'Resend failed notifications for this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Resend', 
          onPress: () => {
            onResend(alert.id);
            onClose();
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Alert',
      'Are you sure you want to cancel this alert? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive', 
          onPress: () => {
            onCancel(alert.id);
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <View style={[styles.modalIcon, { backgroundColor: color.bg }]}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
            </View>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>{alert.title}</Text>
              <View style={styles.modalBadges}>
                <View style={[styles.modalBadge, { backgroundColor: color.bg }]}>
                  <Text style={[styles.modalBadgeText, { color: color.text }]}>
                    {alert.severity || 'moderate'}
                  </Text>
                </View>
                <View style={[styles.modalActiveBadge, isExpired && styles.modalExpiredBadge]}>
                  <Text style={[styles.modalActiveBadgeText, isExpired && styles.modalExpiredBadgeText]}>
                    {isExpired ? 'Expired' : 'Active'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Modal Content */}
        <ScrollView style={styles.modalScrollView}>
          <View style={styles.modalContent}>
            {/* Message */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Alert Message</Text>
              <Text style={styles.modalMessage}>{alert.message}</Text>
            </View>

            {/* Time Info */}
            <View style={styles.modalTimeGrid}>
              <View style={styles.modalTimeItem}>
                <Text style={styles.modalTimeLabel}>Issued</Text>
                <Text style={styles.modalTimeValue}>{formatDateTime(alert.issued_at)}</Text>
                <Text style={styles.modalTimeAgo}>{formatTimeAgo(alert.issued_at)}</Text>
              </View>
              <View style={styles.modalTimeItem}>
                <Text style={styles.modalTimeLabel}>Expires</Text>
                <Text style={styles.modalTimeValue}>{formatDateTime(alert.expires_at)}</Text>
                <Text style={styles.modalTimeAgo}>{formatTimeRemaining(alert.expires_at)}</Text>
              </View>
              <View style={styles.modalTimeItem}>
                <Text style={styles.modalTimeLabel}>Priority</Text>
                <Text style={styles.modalPriority}>{alert.priority_score || 'N/A'}</Text>
              </View>
            </View>

            {/* Map */}
            {(alert.center_lat || alert.center_lng) && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Geographic Targeting</Text>
                <Text style={styles.modalGeoCoords}>
                  {formatCoordinate(alert.center_lat)}, {formatCoordinate(alert.center_lng)}
                  {alert.radius_km && ` (${alert.radius_km} km radius)`}
                </Text>
                <View style={styles.modalMap}>
                  <AlertMap
                    lat={alert.center_lat}
                    lng={alert.center_lng}
                    radiusKm={alert.radius_km || 5}
                    title={alert.title}
                  />
                </View>
              </View>
            )}

            {/* Response Stats */}
            {alert.response_stats && Object.values(alert.response_stats).some((val: any) => val > 0) && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>👥 Citizen Responses</Text>
                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatValue}>{alert.response_stats.safe || 0}</Text>
                    <Text style={styles.modalStatLabel}>Safe</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatValue}>{alert.response_stats.need_help || 0}</Text>
                    <Text style={styles.modalStatLabel}>Need Help</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatValue}>{alert.response_stats.acknowledged || 0}</Text>
                    <Text style={styles.modalStatLabel}>Acknowledged</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatValue}>{alert.response_stats.total || 0}</Text>
                    <Text style={styles.modalStatLabel}>Total</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Admin Actions */}
            {canManage && !isExpired && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Quick Actions</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={handleResend}
                  >
                    <Text style={styles.modalActionButtonText}>🔄 Resend Failed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalActionButtonDanger]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.modalActionButtonText}>❌ Cancel Alert</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Main Component
const Alerts: React.FC<AlertsProps> = ({ navigation }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewAlert, setViewAlert] = useState<any>(null);
  const [canManageAlerts] = useState(true); // Set based on user permissions

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      const params: any = {
        status: 'active',
        page_size: 100,
        ordering: '-issued_at'
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      let res;
      try {
        res = await apiService.getActiveAlerts(params);
      } catch (error) {
        res = await apiService.getAlerts(params);
      }

      if (res?.results) {
        setAlerts(res.results);
      } else if (Array.isArray(res)) {
        setAlerts(res);
      } else {
        setAlerts([]);
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      Alert.alert('Error', error?.message || 'Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts(true);
    }, 30000); // Auto-refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleResend = async (id: string) => {
    try {
      await apiService.resendFailedNotifications(id);
      Alert.alert('Success', 'Failed notifications queued for resending');
      fetchAlerts(true);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Resend failed');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiService.cancelAlert(id);
      Alert.alert('Success', 'Alert cancelled successfully');
      setViewAlert(null);
      fetchAlerts(true);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Cancel failed');
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>✅</Text>
      <Text style={styles.emptyTitle}>No Active Alerts</Text>
      <Text style={styles.emptyText}>
        {searchTerm
          ? 'No active alerts match your search.'
          : 'All systems normal. No emergency alerts are active.'}
      </Text>
      {searchTerm && (
        <TouchableOpacity onPress={() => setSearchTerm('')}>
          <Text style={styles.emptyClear}>Clear search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const highPriorityAlerts = alerts.filter(
    a => a.severity === 'extreme' || a.severity === 'severe'
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>📡</Text>
          <View>
            <Text style={styles.headerTitle}>Active Emergency Alerts</Text>
            <Text style={styles.headerSubtitle}>
              {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchAlerts(true)}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing ? '⟳' : '🔄'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search active alerts..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{alerts.length}</Text>
          <Text style={styles.statBoxLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>{highPriorityAlerts.length}</Text>
          <Text style={styles.statBoxLabel}>High Severity</Text>
        </View>
      </View>

      {/* Alerts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading active alerts...</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={({ item }) => (
            <AlertCard
              alert={item}
              onViewDetails={setViewAlert}
              onResendNotifications={handleResend}
              onCancelAlert={handleCancel}
              canManageAlerts={canManageAlerts}
            />
          )}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchAlerts(true)} />
          }
          contentContainerStyle={alerts.length === 0 ? styles.flatListEmpty : styles.flatListContent}
        />
      )}

      {/* Auto-refresh indicator */}
      <View style={styles.autoRefresh}>
        <View style={styles.autoRefreshDot} />
        <Text style={styles.autoRefreshText}>Auto-refreshing every 30 seconds</Text>
      </View>

      {/* View Modal */}
      <ViewAlertModal
        visible={!!viewAlert}
        alert={viewAlert}
        onClose={() => setViewAlert(null)}
        onResend={handleResend}
        onCancel={handleCancel}
        canManage={canManageAlerts}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  flatListContent: {
    padding: 16,
    paddingTop: 0,
  },
  flatListEmpty: {
    flexGrow: 1,
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  alertHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertHeaderContent: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  severityIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  severityIconText: {
    fontSize: 20,
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  alertMetaSeparator: {
    marginHorizontal: 6,
    color: '#6B7280',
  },
  alertSeverity: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  alertStatus: {
    alignItems: 'flex-end',
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  expiredBadge: {
    backgroundColor: '#F3F4F6',
  },
  expiredBadgeText: {
    color: '#6B7280',
  },
  timeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  timeWarning: {
    backgroundColor: '#FEE2E2',
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  timeWarningText: {
    color: '#991B1B',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  alertMessage: {
    padding: 16,
  },
  alertMessageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  geoSection: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  geoHeader: {
    marginBottom: 8,
  },
  geoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  geoCoords: {
    fontSize: 11,
    color: '#3B82F6',
  },
  miniMap: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  mapPlaceholderCoords: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mapPlaceholderRadius: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  mapPlaceholderError: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
  },
  statsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDanger: {
    borderColor: '#FCA5A5',
  },
  iconButtonText: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyClear: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  autoRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  autoRefreshDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  autoRefreshText: {
    fontSize: 11,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    flex: 1,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  modalBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  modalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalActiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
  },
  modalActiveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  modalExpiredBadge: {
    backgroundColor: '#F3F4F6',
  },
  modalExpiredBadgeText: {
    color: '#6B7280',
  },
  modalClose: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  modalTimeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modalTimeItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  modalTimeLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalTimeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  modalTimeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalPriority: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalGeoCoords: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: 12,
  },
  modalMap: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalStatCard: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalActions: {
    gap: 12,
  },
  modalActionButton: {
    backgroundColor: '#EAB308',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionButtonDanger: {
    backgroundColor: '#EF4444',
  },
  modalActionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
});

export default Alerts;