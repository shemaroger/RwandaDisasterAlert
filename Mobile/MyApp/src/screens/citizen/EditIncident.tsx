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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import apiService from '../../services/api';

type EditIncidentProps = {
  navigation: any;
  route: any;
};

const EditIncident: React.FC<EditIncidentProps> = ({ navigation, route }) => {
  const { incidentId } = route.params;
  
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
    immediate_needs: '',
    status: '',
    priority: 3
  });

  const [mediaFiles, setMediaFiles] = useState<{
    images: any[];
    videos: any[];
    existingImages: any[];
    existingVideos: any[];
  }>({
    images: [],
    videos: [],
    existingImages: [],
    existingVideos: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [disasterTypes, setDisasterTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const REPORT_TYPES = [
    { value: 'emergency', label: 'Emergency' },
    { value: 'hazard', label: 'Hazard' },
    { value: 'infrastructure', label: 'Infrastructure Damage' },
    { value: 'health', label: 'Health Emergency' },
    { value: 'security', label: 'Security Incident' },
    { value: 'other', label: 'Other' }
  ];

  const STATUS_OPTIONS = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'verified', label: 'Verified' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' }
  ];

  const PRIORITY_OPTIONS = [
    { value: 1, label: 'Priority 1 (Highest)' },
    { value: 2, label: 'Priority 2' },
    { value: 3, label: 'Priority 3' },
    { value: 4, label: 'Priority 4' },
    { value: 5, label: 'Priority 5 (Lowest)' }
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
    loadData();
  }, [incidentId]);

  const loadData = async () => {
    await Promise.all([loadIncident(), loadInitialData()]);
  };

  const loadIncident = async () => {
    try {
      const response = await apiService.getIncident(incidentId);
      const incident = response.data || response;
      
      setFormData({
        report_type: incident.report_type || '',
        disaster_type: incident.disaster_type || '',
        title: incident.title || '',
        description: incident.description || '',
        location: incident.location || '',
        address: incident.address || '',
        latitude: incident.latitude,
        longitude: incident.longitude,
        casualties: incident.casualties ? incident.casualties.toString() : '',
        property_damage: incident.property_damage || '',
        immediate_needs: incident.immediate_needs || '',
        status: incident.status || 'submitted',
        priority: incident.priority || 3
      });

      setMediaFiles(prev => ({
        ...prev,
        existingImages: incident.images || [],
        existingVideos: incident.videos || []
      }));
    } catch (err: any) {
      setError('Failed to load incident details');
      console.error('Load incident error:', err);
    }
  };

  const loadInitialData = async () => {
    try {
      const [disasterTypesRes, locationsRes] = await Promise.all([
        apiService.getDisasterTypes().catch(() => ({ results: [] })),
        apiService.getLocations().catch(() => ({ results: [] }))
      ]);
      
      setDisasterTypes(disasterTypesRes.results || []);
      setLocations(locationsRes.results || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
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

        const totalImages = mediaFiles.images.length + mediaFiles.existingImages.length;
        if (totalImages + newImages.length > 5) {
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

        const totalVideos = mediaFiles.videos.length + mediaFiles.existingVideos.length;
        if (totalVideos >= 5) {
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

  const removeExistingFile = (type: 'images' | 'videos', index: number) => {
    const key = type === 'images' ? 'existingImages' : 'existingVideos';
    setMediaFiles(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.report_type) {
      newErrors.report_type = 'Report type is required';
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

    if (formData.casualties && (isNaN(Number(formData.casualties)) || parseInt(formData.casualties) < 0)) {
      newErrors.casualties = 'Casualties must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    setErrors((prev: any) => ({ ...prev, submit: null }));
    
    try {
      const updateData: any = {
        ...formData,
        casualties: formData.casualties ? parseInt(formData.casualties) : null,
        priority: parseInt(formData.priority.toString())
      };

      // Handle file uploads
      updateData.images = [...mediaFiles.existingImages, ...mediaFiles.images];
      updateData.videos = [...mediaFiles.existingVideos, ...mediaFiles.videos];

      await apiService.updateIncident(incidentId, updateData);
      
      Alert.alert('Success', 'Incident updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      console.error('Update incident error:', err);
      Alert.alert('Error', 'Failed to update incident. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading incident details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Error Loading Incident</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Incident Report</Text>
        <Text style={styles.headerSubtitle}>Update incident details and information</Text>
      </View>

      <View style={styles.form}>
        {errors.submit && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errors.submit}</Text>
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Report Type *</Text>
              <Picker
                selectedValue={formData.report_type}
                onValueChange={(value) => handleInputChange('report_type', value)}
                style={[styles.picker, errors.report_type && styles.inputError]}
              >
                <Picker.Item label="Select report type" value="" />
                {REPORT_TYPES.map((type) => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
              {errors.report_type && (
                <Text style={styles.errorText}>{errors.report_type}</Text>
              )}
            </View>

            <View style={styles.halfColumn}>
              <Text style={styles.label}>Disaster Type</Text>
              <Picker
                selectedValue={formData.disaster_type}
                onValueChange={(value) => handleInputChange('disaster_type', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select type (optional)" value="" />
                {disasterTypes.map((type) => (
                  <Picker.Item key={type.id} label={type.name} value={type.id.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Status and Priority */}
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Status</Text>
              <Picker
                selectedValue={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                style={styles.picker}
              >
                {STATUS_OPTIONS.map((status) => (
                  <Picker.Item key={status.value} label={status.label} value={status.value} />
                ))}
              </Picker>
            </View>

            <View style={styles.halfColumn}>
              <Text style={styles.label}>Priority</Text>
              <Picker
                selectedValue={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value.toString())}
                style={styles.picker}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <Picker.Item key={priority.value} label={priority.label} value={priority.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Incident Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              maxLength={200}
              placeholder="Brief description"
            />
            <View style={styles.inputFooter}>
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              <Text style={styles.charCount}>{formData.title.length}/200</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Detailed description"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Administrative Area</Text>
            <Picker
              selectedValue={formData.location}
              onValueChange={(value) => handleInputChange('location', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select area (optional)" value="" />
              {locations.map((location) => (
                <Picker.Item 
                  key={location.id} 
                  label={`${location.name} (${location.type})`} 
                  value={location.id.toString()} 
                />
              ))}
            </Picker>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GPS Coordinates</Text>
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <TextInput
                  style={styles.input}
                  value={formData.latitude?.toString() || ''}
                  onChangeText={(text) => handleInputChange('latitude', text)}
                  placeholder="Latitude"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfColumn}>
                <TextInput
                  style={styles.input}
                  value={formData.longitude?.toString() || ''}
                  onChangeText={(text) => handleInputChange('longitude', text)}
                  placeholder="Longitude"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Details</Text>
            <TextInput
              style={styles.textArea}
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder="Enter detailed address, landmarks..."
            />
          </View>
        </View>

        {/* Impact Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impact Assessment</Text>

          <View style={styles.row}>
            <View style={styles.halfColumn}>
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

            <View style={styles.halfColumn}>
              <Text style={styles.label}>Property Damage</Text>
              <Picker
                selectedValue={formData.property_damage}
                onValueChange={(value) => handleInputChange('property_damage', value)}
                style={styles.picker}
              >
                {PROPERTY_DAMAGE_OPTIONS.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Immediate Needs</Text>
            <TextInput
              style={styles.textArea}
              value={formData.immediate_needs}
              onChangeText={(text) => handleInputChange('immediate_needs', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder="What immediate help or resources are needed?"
            />
          </View>
        </View>

        {/* Media Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media Files</Text>

          {/* Existing Images */}
          {mediaFiles.existingImages.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.mediaLabel}>Current Images</Text>
              <View style={styles.mediaGrid}>
                {mediaFiles.existingImages.map((image, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image
                      source={{ uri: image }}
                      style={styles.mediaThumbnail}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.mediaRemove}
                      onPress={() => removeExistingFile('images', index)}
                    >
                      <Text style={styles.mediaRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* New Images */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Add New Images</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
              <Text style={styles.uploadButtonText}>
                📷 Upload Images ({mediaFiles.images.length + mediaFiles.existingImages.length}/5)
              </Text>
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
          </View>

          {/* Existing Videos */}
          {mediaFiles.existingVideos.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.mediaLabel}>Current Videos</Text>
              {mediaFiles.existingVideos.map((video, index) => (
                <View key={index} style={styles.videoItem}>
                  <Text style={styles.videoText}>Video {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeExistingFile('videos', index)}>
                    <Text style={styles.videoRemove}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* New Videos */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Add New Videos</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickVideos}>
              <Text style={styles.uploadButtonText}>
                🎥 Upload Videos ({mediaFiles.videos.length + mediaFiles.existingVideos.length}/5)
              </Text>
            </TouchableOpacity>

            {mediaFiles.videos.length > 0 && (
              <View style={styles.mediaList}>
                {mediaFiles.videos.map((video, idx) => (
                  <View key={idx} style={styles.videoItem}>
                    <Text style={styles.videoText}>{video.name}</Text>
                    <TouchableOpacity onPress={() => removeFile('videos', idx)}>
                      <Text style={styles.videoRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Submit Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>💾 Update Incident</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 20,
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
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#991B1B',
  },
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfColumn: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  picker: {
    backgroundColor: '#FFF',
    borderRadius: 8,
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
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  mediaSection: {
    marginBottom: 16,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  uploadButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  mediaList: {
    marginTop: 12,
  },
  videoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  videoText: {
    fontSize: 14,
    color: '#374151',
  },
  videoRemove: {
    color: '#DC2626',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
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
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default EditIncident;