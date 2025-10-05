import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import apiService from '../../services/api';

type IncidentDetailProps = {
  navigation: any;
  route: any;
};

// Resolution Modal Component
const ResolutionModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  incidentTitle 
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
  incidentTitle: string;
}) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setError('Please provide resolution notes');
      return;
    }

    if (notes.trim().length < 10) {
      setError('Resolution notes must be at least 10 characters');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(notes.trim());
      setNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit resolution notes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Resolve Incident</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.modalIncidentInfo}>
              <Text style={styles.modalLabel}>Incident</Text>
              <Text style={styles.modalIncidentTitle}>{incidentTitle}</Text>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Resolution Notes *</Text>
              <TextInput
                style={styles.modalTextArea}
                value={notes}
                onChangeText={(text) => {
                  setNotes(text);
                  setError('');
                }}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholder="Describe how the incident was resolved, actions taken, and follow-up required..."
                editable={!isSubmitting}
              />
              <Text style={styles.modalHint}>Minimum 10 characters</Text>
            </View>

            {error && (
              <View style={styles.modalError}>
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            )}

            <View style={styles.modalGuidelines}>
              <Text style={styles.modalGuidelinesTitle}>Guidelines:</Text>
              <Text style={styles.modalGuidelinesText}>
                • Actions taken to resolve{'\n'}
                • Resources deployed{'\n'}
                • Follow-up required{'\n'}
                • Reporter contacted/satisfied
              </Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                (isSubmitting || !notes.trim()) && styles.modalSubmitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !notes.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>✓ Mark as Resolved</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const IncidentDetail: React.FC<IncidentDetailProps> = ({ navigation, route }) => {
  const { incidentId, citizenView = false } = route.params;
  
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);

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
    loadIncident();
  }, [incidentId]);

  const loadIncident = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getIncident(incidentId);
      const incidentData = response.data || response;
      
      setIncident(incidentData);
    } catch (err: any) {
      console.error('Load incident error:', err);
      setError(`Failed to load incident: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (action: string) => {
    if (citizenView) {
      Alert.alert('Permission Denied', 'Only administrators can update incident status.');
      return;
    }

    try {
      let response;
      
      if (action === 'verify') {
        if (incident.status !== 'submitted' && incident.status !== 'under_review') {
          Alert.alert('Invalid Action', 'This incident cannot be verified in its current status.');
          return;
        }
        response = await apiService.verifyIncident(incidentId);
        
        const updatedIncident = response.data || response;
        setIncident((prev: any) => ({ ...prev, ...updatedIncident }));
        Alert.alert('Success', 'Incident verified successfully');
        
      } else if (action === 'resolve') {
        if (incident.status !== 'verified' && incident.status !== 'under_review') {
          Alert.alert('Invalid Action', 'This incident cannot be resolved in its current status.');
          return;
        }
        setShowResolutionModal(true);
        return;
      }
    } catch (err: any) {
      console.error('Status update error:', err);
      Alert.alert('Error', `Failed to update status: ${err.message || 'Unknown error'}`);
    }
  };

  const handleResolveSubmit = async (notes: string) => {
    try {
      const response = await apiService.resolveIncident(incidentId, notes);
      const updatedIncident = response.data || response;
      setIncident((prev: any) => ({ ...prev, ...updatedIncident }));
      Alert.alert('Success', 'Incident resolved successfully!');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to resolve incident');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openMaps = () => {
    if (incident.latitude && incident.longitude) {
      const url = `https://maps.google.com/?q=${incident.latitude},${incident.longitude}`;
      Linking.openURL(url);
    }
  };

  const callEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading incident details...</Text>
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>
          {error ? 'Error Loading Incident' : 'Incident Not Found'}
        </Text>
        <Text style={styles.errorText}>
          {error || "The incident you're looking for doesn't exist."}
        </Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[incident.status] || { bg: '#F3F4F6', text: '#374151' };
  const priorityColor = PRIORITY_COLORS[incident.priority] || '#6B7280';

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {incident.title}
            </Text>
            <View style={styles.headerMeta}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                <Text style={[styles.statusText, { color: statusColor.text }]}>
                  {incident.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.priorityContainer}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                <Text style={styles.priorityText}>P{incident.priority}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!citizenView && incident.status === 'submitted' && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => handleStatusUpdate('verify')}
            >
              <Text style={styles.verifyButtonText}>✓ Verify</Text>
            </TouchableOpacity>
          )}
          {!citizenView && incident.status === 'verified' && (
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleStatusUpdate('resolve')}
            >
              <Text style={styles.resolveButtonText}>✓ Resolve</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditIncident', { incidentId, citizenView })}
          >
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.descriptionText}>{incident.description}</Text>
        </View>

        {/* Incident Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Incident Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {incident.id}
            </Text>
          </View>

          {!citizenView && incident.reporter_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reporter</Text>
              <Text style={styles.detailValue}>{incident.reporter_name}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Report Type</Text>
            <Text style={styles.detailValue}>{incident.report_type}</Text>
          </View>

          {incident.disaster_type_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Disaster Type</Text>
              <Text style={styles.detailValue}>{incident.disaster_type_name}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{formatDate(incident.created_at)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>{formatDate(incident.updated_at)}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location Information</Text>

          {incident.location_name && (
            <View style={styles.locationItem}>
              <Text style={styles.locationIcon}>🏛️</Text>
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Administrative Area</Text>
                <Text style={styles.locationValue}>{incident.location_name}</Text>
              </View>
            </View>
          )}

          {incident.address && (
            <View style={styles.locationItem}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Address</Text>
                <Text style={styles.locationValue}>{incident.address}</Text>
              </View>
            </View>
          )}

          {incident.latitude && incident.longitude && (
            <View style={styles.locationItem}>
              <Text style={styles.locationIcon}>🧭</Text>
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>GPS Coordinates</Text>
                <Text style={styles.locationCoords}>
                  {parseFloat(incident.latitude).toFixed(6)}, {parseFloat(incident.longitude).toFixed(6)}
                </Text>
                <TouchableOpacity onPress={openMaps}>
                  <Text style={styles.mapLink}>View on Google Maps →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Impact Assessment */}
        {(incident.casualties || incident.property_damage || incident.immediate_needs) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Impact Assessment</Text>

            {incident.casualties && (
              <View style={styles.impactItem}>
                <Text style={styles.impactIcon}>👥</Text>
                <View style={styles.impactContent}>
                  <Text style={styles.impactLabel}>People Affected</Text>
                  <Text style={styles.impactValue}>{incident.casualties} people</Text>
                </View>
              </View>
            )}

            {incident.property_damage && (
              <View style={styles.impactItem}>
                <Text style={styles.impactIcon}>🏢</Text>
                <View style={styles.impactContent}>
                  <Text style={styles.impactLabel}>Property Damage</Text>
                  <Text style={styles.impactValue}>
                    {incident.property_damage.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            )}

            {incident.immediate_needs && (
              <View style={styles.impactItem}>
                <Text style={styles.impactIcon}>⚠️</Text>
                <View style={styles.impactContent}>
                  <Text style={styles.impactLabel}>Immediate Needs</Text>
                  <Text style={styles.impactValue}>{incident.immediate_needs}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Media */}
        {(incident.images?.length > 0 || incident.videos?.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Media Evidence</Text>

            {incident.images?.length > 0 && (
              <View style={styles.mediaSection}>
                <Text style={styles.mediaLabel}>Images ({incident.images.length})</Text>
                <View style={styles.imageGrid}>
                  {incident.images.map((image: string, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      style={styles.imageThumbnail}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              </View>
            )}

            {incident.videos?.length > 0 && (
              <View style={styles.mediaSection}>
                <Text style={styles.mediaLabel}>Videos ({incident.videos.length})</Text>
                {incident.videos.map((video: string, index: number) => (
                  <View key={index} style={styles.videoItem}>
                    <Text style={styles.videoText}>🎥 Video {index + 1}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Resolution */}
        {incident.resolution_notes && (
          <View style={styles.resolutionCard}>
            <Text style={styles.resolutionIcon}>✓</Text>
            <View style={styles.resolutionContent}>
              <Text style={styles.resolutionTitle}>Resolution</Text>
              <Text style={styles.resolutionNotes}>{incident.resolution_notes}</Text>
              {incident.resolved_at && (
                <Text style={styles.resolutionDate}>
                  Resolved on {formatDate(incident.resolved_at)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Emergency Contacts (Citizen View) */}
        {citizenView && (
          <View style={styles.emergencyCard}>
            <Text style={styles.emergencyIcon}>📞</Text>
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
              <View style={styles.emergencyGrid}>
                <TouchableOpacity onPress={() => callEmergency('912')}>
                  <Text style={styles.emergencyItem}>Police: 912</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => callEmergency('114')}>
                  <Text style={styles.emergencyItem}>Medical: 114</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => callEmergency('113')}>
                  <Text style={styles.emergencyItem}>Fire: 113</Text>
                </TouchableOpacity>
                <Text style={styles.emergencyItem}>SMS: 3030</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Resolution Modal */}
      <ResolutionModal
        visible={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        onSubmit={handleResolveSubmit}
        incidentTitle={incident.title}
      />
    </ScrollView>
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
  },
  headerTop: {
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  resolveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  locationItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    color: '#374151',
  },
  locationCoords: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  mapLink: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 8,
  },
  impactItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  impactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  impactContent: {
    flex: 1,
  },
  impactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  impactValue: {
    fontSize: 14,
    color: '#374151',
  },
  mediaSection: {
    marginBottom: 16,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  videoItem: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  videoText: {
    fontSize: 14,
    color: '#374151',
  },
  resolutionCard: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
  },
  resolutionIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#059669',
  },
  resolutionContent: {
    flex: 1,
  },
  resolutionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  resolutionNotes: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 8,
  },
  resolutionDate: {
    fontSize: 12,
    color: '#059669',
  },
  emergencyCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
  },
  emergencyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 12,
  },
  emergencyGrid: {
    gap: 8,
  },
  emergencyItem: {
    fontSize: 13,
    color: '#991B1B',
    paddingVertical: 4,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalBody: {
    padding: 16,
  },
  modalIncidentInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  modalIncidentTitle: {
    fontSize: 14,
    color: '#111827',
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalTextArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
  },
  modalHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  modalError: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
  },
  modalErrorText: {
    fontSize: 13,
    color: '#991B1B',
  },
  modalGuidelines: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  modalGuidelinesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  modalGuidelinesText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default IncidentDetail;