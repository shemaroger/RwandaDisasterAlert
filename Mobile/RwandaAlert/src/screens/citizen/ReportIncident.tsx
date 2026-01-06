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
      console.log('🔄 Loading form initial data...');
      
      const [disasterTypesRes, locationsRes] = await Promise.all([
        apiService.getDisasterTypes({ is_active: true, ordering: 'name' }).catch(() => ({ results: [] })),
        apiService.getLocations({ ordering: 'name' }).catch(() => ({ results: [] }))
      ]);
      
      const disasterTypesData = disasterTypesRes.results || disasterTypesRes || [];
      const locationsData = locationsRes.results || locationsRes || [];
      
      setDisasterTypes(disasterTypesData);
      setLocations(locationsData);
      
      console.log(`✅ Loaded ${disasterTypesData.length} disaster types and ${locationsData.length} locations`);
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
      try {
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
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
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
    if (errors.submit) {
      setErrors((prev: any) => ({ ...prev, submit: null }));
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to upload images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      console.log('📷 Opening image picker...');

      // ✅ Fixed: Remove mediaTypes parameter
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
        selectionLimit: 5,
      });

      console.log('Image picker result:', result);

      if (result.canceled) {
        console.log('Image picker canceled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newImages = result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          type: 'image/jpeg',
          mimeType: asset.mimeType || 'image/jpeg'
        }));

        console.log(`Processing ${newImages.length} images...`);

        if (mediaFiles.images.length + newImages.length > 5) {
          Alert.alert(
            'Too Many Images',
            `You can only upload up to 5 images. You currently have ${mediaFiles.images.length} and tried to add ${newImages.length} more.`
          );
          return;
        }

        setMediaFiles(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
        
        console.log(`✅ Added ${newImages.length} images successfully`);
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Error', `Failed to pick images: ${error.message || 'Unknown error'}`);
    }
  };

  const pickVideos = async () => {
    try {
      console.log('🎥 Opening video picker...');

      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        multiple: false,
        copyToCacheDirectory: true,
      });

      console.log('Video picker result:', result);

      if (result.canceled) {
        console.log('Video picker canceled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (asset.size && asset.size > maxSize) {
          Alert.alert(
            'File Too Large',
            `The video is too large (${(asset.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 50MB.`
          );
          return;
        }

        const newVideo = {
          uri: asset.uri,
          name: asset.name,
          type: 'video/mp4',
          mimeType: asset.mimeType || 'video/mp4',
          size: asset.size
        };

        if (mediaFiles.videos.length >= 5) {
          Alert.alert('Maximum Videos Reached', 'You can only upload up to 5 videos.');
          return;
        }

        setMediaFiles(prev => ({
          ...prev,
          videos: [...prev.videos, newVideo]
        }));
        
        console.log('✅ Added video successfully:', asset.name);
      }
    } catch (error: any) {
      console.error('Video picker error:', error);
      Alert.alert('Error', `Failed to pick video: ${error.message || 'Unknown error'}`);
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
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.casualties && (isNaN(parseInt(formData.casualties)) || parseInt(formData.casualties) < 0)) {
      newErrors.casualties = 'Casualties must be a valid number (0 or greater)';
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
    console.log('=== SUBMIT STARTED ===');
    
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    setErrors((prev: any) => ({ ...prev, submit: null }));
    
    try {
      console.log('=== FORM DATA VALIDATION ===');
      console.log('report_type:', formData.report_type);
      console.log('title:', formData.title.trim());
      console.log('description:', formData.description.trim());

      // ✅ Create FormData instead of plain object
      const formDataToSend = new FormData();

      // Add required fields
      formDataToSend.append('report_type', formData.report_type);
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());

      console.log('✅ Added required fields to FormData');

      // Add optional fields
      if (formData.disaster_type) {
        formDataToSend.append('disaster_type', formData.disaster_type);
      }
      
      if (formData.location) {
        formDataToSend.append('location', formData.location);
      }
      
      // ✅ Round coordinates to 6 decimal places
      if (formData.latitude && formData.longitude) {
        const roundedLat = parseFloat(formData.latitude.toFixed(6));
        const roundedLng = parseFloat(formData.longitude.toFixed(6));
        formDataToSend.append('latitude', roundedLat.toString());
        formDataToSend.append('longitude', roundedLng.toString());
        console.log('Added coordinates:', roundedLat, roundedLng);
      }
      
      if (formData.address.trim()) {
        formDataToSend.append('address', formData.address.trim());
      }
      
      if (formData.casualties) {
        formDataToSend.append('casualties', formData.casualties);
      }
      
      if (formData.property_damage) {
        formDataToSend.append('property_damage', formData.property_damage);
      }
      
      if (formData.immediate_needs.trim()) {
        formDataToSend.append('immediate_needs', formData.immediate_needs.trim());
      }

      // ✅ Add images with proper format
      mediaFiles.images.forEach((img, index) => {
        const file = {
          uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
          type: img.mimeType || img.type || 'image/jpeg',
          name: img.name || `image_${Date.now()}_${index}.jpg`,
        };
        formDataToSend.append(`images[${index}]`, file as any);
        console.log(`✅ Added image ${index}:`, file.name);
      });

      // ✅ Add videos with proper format
      mediaFiles.videos.forEach((video, index) => {
        const file = {
          uri: Platform.OS === 'ios' ? video.uri.replace('file://', '') : video.uri,
          type: video.mimeType || video.type || 'video/mp4',
          name: video.name || `video_${Date.now()}_${index}.mp4`,
        };
        formDataToSend.append(`videos[${index}]`, file as any);
        console.log(`✅ Added video ${index}:`, file.name);
      });

      console.log('📤 Submitting incident report...');
      console.log('Form prepared with', mediaFiles.images.length, 'images and', mediaFiles.videos.length, 'videos');

      // ✅ Pass FormData to API service
      const result = await apiService.createIncident(formDataToSend);
      
      console.log('✅ Incident created successfully:', result);
      setSubmittedData(result);
      setSubmitted(true);
      
    } catch (error: any) {
      console.error('❌ Failed to submit:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to submit incident report. Please try again.';
      let fieldErrors: any = {};

      // Parse error response
      if (error.data) {
        const errorData = error.data;
        console.log('Error data:', errorData);

        if (typeof errorData === 'object' && !errorData.detail && !errorData.error) {
          Object.keys(errorData).forEach(field => {
            const fieldError = Array.isArray(errorData[field]) 
              ? errorData[field][0] 
              : errorData[field];
            fieldErrors[field] = fieldError;
          });
          errorMessage = 'Please fix the errors in the form and try again.';
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors((prev: any) => ({
        ...prev,
        ...fieldErrors,
        submit: errorMessage
      }));

      Alert.alert('Submission Failed', errorMessage);
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
                Your incident report &quot;{submittedData.title}&quot; has been received and assigned to local authorities.
              </Text>
              <Text style={styles.successStatus}>
                Status: {submittedData.status_display || submittedData.status || 'Submitted'}
              </Text>
              {submittedData.priority && (
                <Text style={styles.successStatus}>
                  Priority: Level {submittedData.priority}
                </Text>
              )}
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
            <TouchableOpacity onPress={() => callEmergency('114')}>
              <Text style={styles.emergencyNumber}>📞 Medical: 114</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => callEmergency('113')}>
              <Text style={styles.emergencyNumber}>📞 Fire: 113</Text>
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

        {errors.location_required && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errors.location_required}</Text>
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
              <>
                <ActivityIndicator color="#2563EB" />
                <Text style={styles.statusTitle}>Getting your location...</Text>
              </>
            ) : formData.latitude && formData.longitude ? (
              <>
                <Text style={styles.statusTitle}>✓ GPS Location Captured</Text>
                <Text style={styles.statusText}>
                  {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </Text>
                <Text style={styles.statusSubtext}>
                  Emergency responders can find you precisely
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.statusTitle}>⚠ Manual Location Required</Text>
                <Text style={styles.statusSubtext}>Enter address details below</Text>
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                >
                  <Text style={styles.locationButtonText}>Get Current Location</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}
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
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : (
              <View />
            )}
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
          <Text style={styles.charCount}>{formData.description.length} characters</Text>
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
            placeholder={
              formData.latitude 
                ? "GPS captured. Add more: building name, floor, landmarks..."
                : "District, Sector, Cell, Village, street names, landmarks..."
            }
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

          {mediaFiles.videos.length > 0 && (
            <View style={styles.videoList}>
              {mediaFiles.videos.map((video, idx) => (
                <View key={idx} style={styles.videoItem}>
                  <Text style={styles.videoName} numberOfLines={1}>
                    🎥 {video.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeFile('videos', idx)}>
                    <Text style={styles.videoRemove}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
    color: '#111827',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
    marginTop: 4,
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
  videoList: {
    marginBottom: 12,
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
  videoName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  videoRemove: {
    color: '#DC2626',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 8,
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
    fontWeight: '500',
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
    marginBottom: 4,
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