import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

// Import your API service
import apiService from '../../services/api';

type ReportIncidentProps = {
  navigation: any;
};

const ReportIncident: React.FC<ReportIncidentProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    report_type: '',
    disaster_type: '',
    title: '',
    description: '',
    location: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    casualties: '',
    property_damage: '',
    immediate_needs: ''
  });

  const [mediaFiles, setMediaFiles] = useState<{
    images: any[];
    videos: any[];
  }>({
    images: [],
    videos: []
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [errors, setErrors] = useState<any>({});
  const [disasterTypes, setDisasterTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const REPORT_TYPES = [
    { value: 'emergency', label: 'Emergency', color: '#DC2626' },
    { value: 'hazard', label: 'Hazard', color: '#EA580C' },
    { value: 'infrastructure', label: 'Infrastructure', color: '#2563EB' },
    { value: 'health', label: 'Health', color: '#DB2777' },
    { value: 'security', label: 'Security', color: '#9333EA' },
    { value: 'other', label: 'Other', color: '#6B7280' }
  ];

  const PROPERTY_DAMAGE_OPTIONS = [
    { value: '', label: 'Select damage level' },
    { value: 'none', label: 'No visible damage' },
    { value: 'minor', label: 'Minor damage' },
    { value: 'moderate', label: 'Moderate damage' },
    { value: 'severe', label: 'Severe damage' },
    { value: 'total', label: 'Total destruction' }
  ];

  useEffect(() => {
    loadInitialData();
    getCurrentLocation();
  }, []);

  const loadInitialData = async () => {
    setDataLoading(true);
    try {
      const [disasterTypesRes, locationsRes] = await Promise.all([
        apiService.getDisasterTypes().catch(() => ({ results: [] })),
        apiService.getLocations().catch(() => ({ results: [] }))
      ]);
      
      setDisasterTypes(disasterTypesRes.results || []);
      setLocations(locationsRes.results || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrors((prev: any) => ({
          ...prev,
          location: 'Location permission denied. Please enter address manually.'
        }));
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      setFormData(prev => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }));

      // Reverse geocode
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (addresses.length > 0 && !formData.address.trim()) {
        const addr = addresses[0];
        const address = [addr.street, addr.district, addr.city, addr.region, addr.country]
          .filter(Boolean)
          .join(', ');
        
        setFormData(prev => ({ ...prev, address }));
      }

      setLocationLoading(false);
    } catch (error) {
      console.error('Location error:', error);
      setErrors((prev: any) => ({
        ...prev,
        location: 'Unable to get location. Please enter address manually.'
      }));
      setLocationLoading(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: null }));
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permission');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        }));

        if (mediaFiles.images.length + newImages.length > 5) {
          Alert.alert('Too many files', 'Maximum 5 images allowed');
          return;
        }

        setMediaFiles(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const pickVideos = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        multiple: true,
      });

      if (result.type === 'success') {
        const newVideo = {
          uri: result.uri,
          name: result.name,
          type: 'video/mp4'
        };

        if (mediaFiles.videos.length >= 5) {
          Alert.alert('Too many files', 'Maximum 5 videos allowed');
          return;
        }

        setMediaFiles(prev => ({
          ...prev,
          videos: [...prev.videos, newVideo]
        }));
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const removeFile = (type: 'images' | 'videos', index: number) => {
    setMediaFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.report_type) {
      newErrors.report_type = 'Please select a report type';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.latitude || !formData.longitude) {
      if (!formData.address.trim() && !formData.location) {
        newErrors.location_required = 'Location is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const incidentData: any = {
        report_type: formData.report_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      if (formData.disaster_type) incidentData.disaster_type = formData.disaster_type;
      if (formData.location) incidentData.location = formData.location;
      if (formData.latitude && formData.longitude) {
        incidentData.latitude = parseFloat(formData.latitude.toString());
        incidentData.longitude = parseFloat(formData.longitude.toString());
      }
      if (formData.address.trim()) incidentData.address = formData.address.trim();
      if (formData.casualties) incidentData.casualties = parseInt(formData.casualties);
      if (formData.property_damage) incidentData.property_damage = formData.property_damage;
      if (formData.immediate_needs.trim()) incidentData.immediate_needs = formData.immediate_needs.trim();
      if (mediaFiles.images.length > 0) incidentData.images = mediaFiles.images;
      if (mediaFiles.videos.length > 0) incidentData.videos = mediaFiles.videos;

      const result = await apiService.createIncident(incidentData);
      
      setSubmittedData(result);
      setSubmitted(true);
      
    } catch (error: any) {
      console.error('Failed to submit:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit incident report. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      report_type: '',
      disaster_type: '',
      title: '',
      description: '',
      location: '',
      address: '',
      latitude: null,
      longitude: null,
      casualties: '',
      property_damage: '',
      immediate_needs: ''
    });
    setMediaFiles({ images: [], videos: [] });
    setSubmitted(false);
    setSubmittedData(null);
    setErrors({});
    getCurrentLocation();
  };

  const callEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  if (submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContainer}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Report Submitted</Text>
          
          {submittedData && (
            <View style={styles.successInfo}>
              <Text style={styles.successId}>Report ID: {submittedData.id}</Text>
              <Text style={styles.successText}>
                Your incident report "{submittedData.title}" has been received.
              </Text>
              <Text style={styles.successStatus}>
                Status: {submittedData.status || 'Submitted'}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={resetForm}>
            <Text style={styles.primaryButtonText}>Report Another Incident</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.emergencyFooter}>
            <Text style={styles.emergencyFooterTitle}>Emergency Contacts</Text>
            <TouchableOpacity onPress={() => callEmergency('912')}>
              <Text style={styles.emergencyNumber}>📞 Emergency: 912</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report Emergency Incident</Text>
        <Text style={styles.headerSubtitle}>
          Help emergency services respond quickly
        </Text>
      </View>

      <View style={styles.form}>
        {dataLoading && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator color="#DC2626" />
            <Text style={styles.loadingText}>Loading form data...</Text>
          </View>
        )}

        {errors.submit && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errors.submit}</Text>
          </View>
        )}

        {/* Report Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Type *</Text>
          <View style={styles.typeGrid}>
            {REPORT_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  formData.report_type === type.value && {
                    borderColor: type.color,
                    backgroundColor: type.color + '10'
                  }
                ]}
                onPress={() => handleInputChange('report_type', type.value)}
              >
                <Text style={[
                  styles.typeLabel,
                  formData.report_type === type.value && { color: type.color }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.report_type && (
            <Text style={styles.errorText}>{errors.report_type}</Text>
          )}
        </View>

        {/* Location Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Status</Text>
          <View style={[
            styles.statusCard,
            formData.latitude ? styles.statusSuccess : styles.statusWarning
          ]}>
            {locationLoading ? (
              <ActivityIndicator color="#2563EB" />
            ) : formData.latitude ? (
              <>
                <Text style={styles.statusTitle}>✓ GPS Location Captured</Text>
                <Text style={styles.statusText}>
                  {formData.latitude.toFixed(6)}, {formData.longitude?.toFixed(6)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.statusTitle}>⚠ Manual Location Required</Text>
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                >
                  <Text style={styles.locationButtonText}>Get Current Location</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Incident Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            placeholder="Brief description (e.g., 'House fire on Main Street')"
            maxLength={200}
          />
          <View style={styles.inputFooter}>
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            <Text style={styles.charCount}>{formData.title.length}/200</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Detailed Description *</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="What happened? When? Current situation? Any immediate dangers? How many affected?"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Address Details {!formData.latitude && '*'}
          </Text>
          <TextInput
            style={[styles.textArea, errors.address && styles.inputError]}
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
            placeholder="District, Sector, Cell, Village, street names, landmarks..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Casualties */}
        <View style={styles.section}>
          <Text style={styles.label}>People Affected</Text>
          <TextInput
            style={[styles.input, errors.casualties && styles.inputError]}
            value={formData.casualties}
            onChangeText={(text) => handleInputChange('casualties', text)}
            placeholder="Number of people"
            keyboardType="numeric"
          />
          {errors.casualties && (
            <Text style={styles.errorText}>{errors.casualties}</Text>
          )}
        </View>

        {/* Property Damage */}
        <View style={styles.section}>
          <Text style={styles.label}>Property Damage Assessment</Text>
          <View style={styles.pickerContainer}>
            {PROPERTY_DAMAGE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerOption,
                  formData.property_damage === option.value && styles.pickerOptionSelected
                ]}
                onPress={() => handleInputChange('property_damage', option.value)}
              >
                <Text style={[
                  styles.pickerOptionText,
                  formData.property_damage === option.value && styles.pickerOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Immediate Needs */}
        <View style={styles.section}>
          <Text style={styles.label}>Immediate Needs/Resources Required</Text>
          <TextInput
            style={styles.textArea}
            value={formData.immediate_needs}
            onChangeText={(text) => handleInputChange('immediate_needs', text)}
            placeholder="Medical assistance, evacuation, rescue equipment, food, water, shelter, etc."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Media Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual Evidence</Text>
          
          <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
            <Text style={styles.uploadButtonText}>📷 Upload Photos ({mediaFiles.images.length}/5)</Text>
          </TouchableOpacity>

          {mediaFiles.images.length > 0 && (
            <View style={styles.mediaGrid}>
              {mediaFiles.images.map((img, idx) => (
                <View key={idx} style={styles.mediaItem}>
                  <Image source={{ uri: img.uri }} style={styles.mediaThumbnail} />
                  <TouchableOpacity
                    style={styles.mediaRemove}
                    onPress={() => removeFile('images', idx)}
                  >
                    <Text style={styles.mediaRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={pickVideos}>
            <Text style={styles.uploadButtonText}>🎥 Upload Videos ({mediaFiles.videos.length}/5)</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>📞 Emergency Contacts</Text>
          <TouchableOpacity onPress={() => callEmergency('912')}>
            <Text style={styles.emergencyItem}>Police Emergency: 912</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => callEmergency('114')}>
            <Text style={styles.emergencyItem}>Medical Emergency: 114</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => callEmergency('113')}>
            <Text style={styles.emergencyItem}>Fire Emergency: 113</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Emergency Report</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={resetForm} disabled={loading}>
          <Text style={styles.clearButtonText}>Clear Form</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By submitting, you confirm this information is accurate and understand false reports are illegal.
        </Text>
      </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  form: {
    padding: 16,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#92400E',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  statusWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  locationButton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
  },
  locationButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionSelected: {
    backgroundColor: '#DBEAFE',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    fontWeight: '600',
    color: '#2563EB',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mediaItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  mediaRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaRemoveText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyCard: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 24,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  emergencyItem: {
    fontSize: 14,
    color: '#991B1B',
    paddingVertical: 4,
  },
  submitButton: {
    backgroundColor: '#DC2626',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  successContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  successCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIcon: {
    fontSize: 64,
    color: '#10B981',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  successInfo: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 24,
  },
  successId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 8,
  },
  successStatus: {
    fontSize: 12,
    color: '#059669',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  emergencyFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },
  emergencyFooterTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emergencyNumber: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    paddingVertical: 4,
  },
});

export default ReportIncident;