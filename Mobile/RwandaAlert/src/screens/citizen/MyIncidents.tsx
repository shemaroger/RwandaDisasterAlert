import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiService from '../../services/api';

type MyIncidentsProps = {
  navigation: any;
  route?: any;
};

const MyIncidents: React.FC<MyIncidentsProps> = ({ navigation, route }) => {
  // Get citizenView from route params or default to true for "MyIncidents" screen
  const citizenView = route?.params?.citizenView ?? true;
  
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    priority: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    'submitted': { bg: '#DBEAFE', text: '#1E40AF' },
    'under_review': { bg: '#FEF3C7', text: '#92400E' },
    'verified': { bg: '#D1FAE5', text: '#065F46' },
    'resolved': { bg: '#F3F4F6', text: '#374151' },
    'dismissed': { bg: '#FEE2E2', text: '#991B1B' }
  };

  const PRIORITY_COLORS: Record<number, string> = {
    1: '#EF4444',
    2: '#F97316',
    3: '#EAB308',
    4: '#3B82F6',
    5: '#6B7280'
  };

  useEffect(() => {
    loadIncidents();
  }, [pagination.page, searchTerm, filters]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      };

      const response = await apiService.getIncidents(params);

      let incidentData: any[] = [];
      let totalCount = 0;

      if (response) {
        if (Array.isArray(response)) {
          incidentData = response;
          totalCount = response.length;
        } else if (response.results && Array.isArray(response.results)) {
          incidentData = response.results;
          totalCount = response.count || response.results.length;
        } else if (response.data && Array.isArray(response.data)) {
          incidentData = response.data;
          totalCount = response.count || response.total || response.data.length;
        } else if (response.id && response.title) {
          incidentData = [response];
          totalCount = 1;
        }
      }

      setIncidents(incidentData);
      setPagination(prev => ({ ...prev, total: totalCount }));

    } catch (err: any) {
      setError(`Failed to load incidents: ${err.message || 'Unknown error'}`);
      setIncidents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadIncidents();
  };

  const handleDelete = async (incidentId: number) => {
    Alert.alert(
      'Delete Incident',
      'Are you sure you want to delete this incident? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteIncident(incidentId);
              setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
              Alert.alert('Success', 'Incident deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete incident');
            }
          }
        }
      ]
    );
  };

  const handleStatusChange = async (incidentId: number, action: string) => {
    try {
      let response;
      
      if (action === 'verify') {
        response = await apiService.verifyIncident(incidentId);
      } else if (action === 'resolve') {
        // In RN, we'll skip the prompt for now or use a modal
        response = await apiService.resolveIncident(incidentId, 'Resolved via mobile');
      }
      
      if (response) {
        setIncidents(prev => 
          prev.map(incident => 
            incident.id === incidentId ? { ...incident, ...response } : incident
          )
        );
        Alert.alert('Success', `Incident ${action}d successfully`);
      }
    } catch (err) {
      Alert.alert('Error', `Failed to ${action} incident`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const navigateToView = (incidentId: number) => {
    // Navigate to a detail screen - you'll need to create this
    navigation.navigate('IncidentDetail', { incidentId, citizenView });
  };

  const navigateToEdit = (incidentId: number) => {
    // Navigate to edit screen - you'll need to create this
    navigation.navigate('EditIncident', { incidentId, citizenView });
  };

  const renderIncidentCard = ({ item }: { item: any }) => {
    const statusColor = STATUS_COLORS[item.status] || { bg: '#F3F4F6', text: '#374151' };
    const priorityColor = PRIORITY_COLORS[item.priority] || '#6B7280';

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigateToView(item.id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={styles.cardTitleText} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardMetaText}>{item.report_type}</Text>
              {item.disaster_type_name && (
                <Text style={styles.cardMetaTag}>• {item.disaster_type_name}</Text>
              )}
            </View>
          </View>
          
          {/* Priority Badge */}
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>P{item.priority}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Location */}
        {(item.location_name || item.address) && (
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>📍</Text>
            <View style={styles.cardRowContent}>
              {item.location_name && (
                <Text style={styles.cardRowText}>{item.location_name}</Text>
              )}
              {item.address && (
                <Text style={styles.cardRowSubtext} numberOfLines={1}>
                  {item.address}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Reporter (Admin View) */}
        {!citizenView && item.reporter_name && (
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>👤</Text>
            <Text style={styles.cardRowText}>{item.reporter_name}</Text>
          </View>
        )}

        {/* Date */}
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardRowText}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigateToView(item.id)}
          >
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          {(citizenView ? item.status === 'submitted' : true) && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => navigateToEdit(item.id)}
            >
              <Text style={styles.actionButtonTextSecondary}>Edit</Text>
            </TouchableOpacity>
          )}

          {!citizenView && item.status === 'submitted' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={() => handleStatusChange(item.id, 'verify')}
            >
              <Text style={styles.actionButtonText}>Verify</Text>
            </TouchableOpacity>
          )}

          {!citizenView && item.status === 'verified' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={() => handleStatusChange(item.id, 'resolve')}
            >
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          )}

          {!citizenView && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search incidents..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Filter Toggle */}
      {!citizenView && (
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>
            {showFilters ? '✕ Hide' : '⚙️ Filters'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Filters */}
      {!citizenView && showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status</Text>
            <Picker
              selectedValue={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All Status" value="" />
              <Picker.Item label="Submitted" value="submitted" />
              <Picker.Item label="Under Review" value="under_review" />
              <Picker.Item label="Verified" value="verified" />
              <Picker.Item label="Resolved" value="resolved" />
              <Picker.Item label="Dismissed" value="dismissed" />
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Type</Text>
            <Picker
              selectedValue={filters.report_type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, report_type: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All Types" value="" />
              <Picker.Item label="Emergency" value="emergency" />
              <Picker.Item label="Hazard" value="hazard" />
              <Picker.Item label="Infrastructure" value="infrastructure" />
              <Picker.Item label="Health" value="health" />
              <Picker.Item label="Security" value="security" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Priority</Text>
            <Picker
              selectedValue={filters.priority}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All Priorities" value="" />
              <Picker.Item label="Priority 1 (Highest)" value="1" />
              <Picker.Item label="Priority 2" value="2" />
              <Picker.Item label="Priority 3" value="3" />
              <Picker.Item label="Priority 4" value="4" />
              <Picker.Item label="Priority 5 (Lowest)" value="5" />
            </Picker>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={styles.emptyTitle}>
        {citizenView ? 'No reports found' : 'No incidents found'}
      </Text>
      <Text style={styles.emptyText}>
        {citizenView 
          ? "You haven't submitted any incident reports yet."
          : searchTerm || Object.values(filters).some(v => v) 
            ? 'Try adjusting your search or filters.' 
            : 'No incident reports have been submitted yet.'
        }
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('ReportIncident')}
      >
        <Text style={styles.emptyButtonText}>
          {citizenView ? 'Submit Your First Report' : 'Create Incident Report'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && incidents.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading incidents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {citizenView ? 'My Incident Reports' : 'All Incident Reports'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {citizenView 
              ? 'Track your submitted reports' 
              : 'Manage all incident reports'
            }
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.newButton}
          onPress={() => navigation.navigate('ReportIncident')}
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadIncidents}>
            <Text style={styles.errorRetry}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={incidents}
        renderItem={renderIncidentCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={incidents.length === 0 ? styles.flatListEmpty : styles.flatListContent}
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
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  newButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filtersContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  filterItem: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  picker: {
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  flatListContent: {
    padding: 16,
  },
  flatListEmpty: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardMetaText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  cardMetaTag: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
  },
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  cardRowContent: {
    flex: 1,
  },
  cardRowText: {
    fontSize: 13,
    color: '#374151',
  },
  cardRowSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonSecondary: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionButtonSuccess: {
    backgroundColor: '#10B981',
  },
  actionButtonDanger: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  errorText: {
    color: '#991B1B',
    marginBottom: 8,
  },
  errorRetry: {
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default MyIncidents;