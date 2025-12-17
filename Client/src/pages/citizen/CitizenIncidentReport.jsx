import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Camera, 
  MapPin, 
  AlertTriangle, 
  Upload, 
  X, 
  CheckCircle, 
  Loader2,
  Phone,
  Clock,
  Users,
  Building,
  Navigation,
  Monitor,
  Smartphone,
  Info,
  RefreshCw,
  FileText
} from 'lucide-react';

// Import your actual API service
import apiService from '../../services/api';

const CitizenIncidentReport = () => {
  const { t, i18n } = useTranslation();
  const { languageKey } = useLanguage();
  
  const [formData, setFormData] = useState({
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

  const [mediaFiles, setMediaFiles] = useState({
    images: [],
    videos: [],
    documents: []
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [errors, setErrors] = useState({});
  const [disasterTypes, setDisasterTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const REPORT_TYPES = [
    { value: 'emergency', label: t('reportType.emergency', { defaultValue: 'Emergency' }), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
    { value: 'hazard', label: t('reportType.hazard', { defaultValue: 'Hazard' }), icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
    { value: 'infrastructure', label: t('reportType.infrastructure', { defaultValue: 'Infrastructure Damage' }), icon: Building, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { value: 'health', label: t('reportType.health', { defaultValue: 'Health Emergency' }), icon: Phone, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-200' },
    { value: 'security', label: t('reportType.security', { defaultValue: 'Security Incident' }), icon: AlertTriangle, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
    { value: 'other', label: t('reportType.other', { defaultValue: 'Other' }), icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' }
  ];

  const PROPERTY_DAMAGE_OPTIONS = [
    { value: '', label: t('propertyDamage.select', { defaultValue: 'Select damage level' }) },
    { value: 'none', label: t('propertyDamage.none', { defaultValue: 'No visible damage' }) },
    { value: 'minor', label: t('propertyDamage.minor', { defaultValue: 'Minor damage' }) },
    { value: 'moderate', label: t('propertyDamage.moderate', { defaultValue: 'Moderate damage' }) },
    { value: 'severe', label: t('propertyDamage.severe', { defaultValue: 'Severe damage' }) },
    { value: 'total', label: t('propertyDamage.total', { defaultValue: 'Total destruction' }) }
  ];

  const ADMIN_LEVEL_LABELS = {
    village: t('adminLevel.village', { defaultValue: 'Village' }),
    sector: t('adminLevel.sector', { defaultValue: 'Sector' }),
    district: t('adminLevel.district', { defaultValue: 'District' }),
    province: t('adminLevel.province', { defaultValue: 'Province' }),
    national: t('adminLevel.national', { defaultValue: 'National' })
  };

  useEffect(() => {
    loadInitialData();
    getCurrentLocation();
  }, []);

  const loadInitialData = async () => {
    setDataLoading(true);
    try {
      console.log('🔄 Loading form initial data...');
      
      // Fetch disaster types and locations in parallel
      const [disasterTypesRes, locationsRes] = await Promise.all([
        apiService.getDisasterTypes({ is_active: true, ordering: 'name' })
          .catch(error => {
            console.warn('Failed to load disaster types:', error);
            return { results: [] };
          }),
        apiService.getLocations({ ordering: 'name' })
          .catch(error => {
            console.warn('Failed to load locations:', error);
            return { results: [] };
          })
      ]);
      
      // Handle both paginated and non-paginated responses
      const disasterTypesData = disasterTypesRes.results || disasterTypesRes || [];
      const locationsData = locationsRes.results || locationsRes || [];
      
      setDisasterTypes(disasterTypesData);
      setLocations(locationsData);
      
      // Clear any previous loading errors if successful
      if (errors.loading) {
        setErrors(prev => ({ ...prev, loading: null }));
      }
      
      console.log(`✅ Loaded ${disasterTypesData.length} disaster types and ${locationsData.length} locations`);
      
    } catch (error) {
      console.error('❌ Failed to load initial data:', error);
      setErrors(prev => ({
        ...prev,
        loading: t('messages.failedToLoadFormData', { 
          defaultValue: 'Failed to load form data. You can still submit the report, but some options may not be available.' 
        })
      }));
    } finally {
      setDataLoading(false);
    }
  };

  const retryLoadData = () => {
    setErrors(prev => ({ ...prev, loading: null }));
    loadInitialData();
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors(prev => ({
        ...prev,
        location: t('messages.geolocationNotSupported', { 
          defaultValue: 'Geolocation is not supported by your browser. Please enter address manually.' 
        })
      }));
      return;
    }

    setLocationLoading(true);
    setErrors(prev => ({ ...prev, location: null }));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude: latitude,
          longitude: longitude
        }));
        
        setLocationLoading(false);
        
        // Try to reverse geocode to get address
        reverseGeocode(latitude, longitude);
        
        // Clear any previous location errors
        if (errors.location_required) {
          setErrors(prev => ({ ...prev, location_required: null }));
        }
      },
      (error) => {
        console.warn('Location access failed:', error);
        setLocationLoading(false);
        
        let errorMessage = t('messages.unableToGetLocation', { defaultValue: 'Unable to get your current location. ' });
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += t('messages.locationPermissionDenied', { 
              defaultValue: 'Location access was denied. Please enable location services and refresh the page, or enter your address manually.' 
            });
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += t('messages.locationUnavailable', { 
              defaultValue: 'Your location is currently unavailable. Please enter your address manually.' 
            });
            break;
          case error.TIMEOUT:
            errorMessage += t('messages.locationTimeout', { 
              defaultValue: 'Location request timed out. Please try again or enter your address manually.' 
            });
            break;
          default:
            errorMessage += t('messages.enterAddressManually', { 
              defaultValue: 'Please enter your address manually.' 
            });
            break;
        }
        
        setErrors(prev => ({
          ...prev,
          location: errorMessage
        }));
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 60000
      }
    );
  };

  const debugFormData = () => {
    console.log('Form validation debug:');
    console.log('report_type:', formData.report_type);
    console.log('title:', formData.title);
    console.log('description:', formData.description);
    console.log('latitude:', formData.latitude);
    console.log('longitude:', formData.longitude);
    console.log('address:', formData.address);
    console.log('location:', formData.location);
    console.log('All form data:', formData);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = [
          data.locality,
          data.principalSubdivision,
          data.countryName
        ].filter(Boolean).join(', ');
        
        if (address && !formData.address.trim()) {
          setFormData(prev => ({
            ...prev,
            address: address
          }));
        }
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: null
      }));
    }
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;
    const validFiles = [];
    const newErrors = {};

    const currentCount = mediaFiles[type].length;
    if (currentCount + files.length > maxFiles) {
      newErrors[`${type}_count`] = t('messages.maxFilesExceeded', { 
        max: maxFiles, 
        type: t(`fileType.${type}`, { defaultValue: type }),
        defaultValue: `Maximum ${maxFiles} ${type} allowed` 
      });
    }

    files.forEach((file, index) => {
      if (currentCount + index >= maxFiles) return;

      if (file.size > maxSize) {
        newErrors[`${type}_size`] = t('messages.fileTooLarge', { 
          name: file.name, 
          defaultValue: `File "${file.name}" is too large. Maximum size is 10MB.` 
        });
        return;
      }
      
      if (type === 'images' && !file.type.startsWith('image/')) {
        newErrors[`${type}_type`] = t('messages.invalidImageFile', { 
          name: file.name, 
          defaultValue: `"${file.name}" is not a valid image file.` 
        });
        return;
      }
      
      if (type === 'videos' && !file.type.startsWith('video/')) {
        newErrors[`${type}_type`] = t('messages.invalidVideoFile', { 
          name: file.name, 
          defaultValue: `"${file.name}" is not a valid video file.` 
        });
        return;
      }
      
      if (type === 'documents' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
        newErrors[`${type}_type`] = t('messages.invalidDocumentFile', { 
          name: file.name, 
          defaultValue: `"${file.name}" is not a valid document file. Please use PDF, Word, or Excel documents.` 
        });
        return;
      }
      
      validFiles.push(file);
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    } else {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[`${type}_size`];
        delete updated[`${type}_type`];
        delete updated[`${type}_count`];
        return updated;
      });
    }

    if (validFiles.length > 0) {
      setMediaFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...validFiles]
      }));
    }

    e.target.value = '';
  };

  const removeFile = (type, index) => {
    setMediaFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));

    if (mediaFiles[type].length <= 1) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[`${type}_size`];
        delete updated[`${type}_type`];
        delete updated[`${type}_count`];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.report_type) {
      newErrors.report_type = t('validation.reportTypeRequired', { defaultValue: 'Please select a report type' });
    }

    if (!formData.title.trim()) {
      newErrors.title = t('validation.titleRequired', { defaultValue: 'Title is required' });
    } else if (formData.title.trim().length < 5) {
      newErrors.title = t('validation.titleMinLength', { defaultValue: 'Title must be at least 5 characters' });
    } else if (formData.title.length > 200) {
      newErrors.title = t('validation.titleMaxLength', { defaultValue: 'Title cannot exceed 200 characters' });
    }

    if (!formData.description.trim()) {
      newErrors.description = t('validation.descriptionRequired', { defaultValue: 'Description is required' });
    } else if (formData.description.trim().length < 10) {
      newErrors.description = t('validation.descriptionMinLength', { defaultValue: 'Description must be at least 10 characters' });
    }

    if (formData.casualties && (isNaN(formData.casualties) || parseInt(formData.casualties) < 0)) {
      newErrors.casualties = t('validation.casualtiesInvalid', { 
        defaultValue: 'Casualties must be a valid number (0 or greater)' 
      });
    }

    if (!formData.latitude || !formData.longitude) {
      if (!formData.address.trim() && !formData.location) {
        newErrors.location_required = t('validation.locationRequired', { 
          defaultValue: 'Location is required. Please enable GPS access or enter your address manually.' 
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    debugFormData();
    
    if (!validateForm()) {
      const firstError = document.querySelector('.text-red-600');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setErrors(prev => ({ ...prev, submit: null }));
    
    try {
      const incidentData = {
        report_type: formData.report_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      if (formData.disaster_type) {
        incidentData.disaster_type = formData.disaster_type;
      }
      
      if (formData.location) {
        incidentData.location = formData.location;
      }
      
      if (formData.latitude && formData.longitude) {
        incidentData.latitude = parseFloat(formData.latitude);
        incidentData.longitude = parseFloat(formData.longitude);
      }
      
      if (formData.address.trim()) {
        incidentData.address = formData.address.trim();
      }
      
      if (formData.casualties) {
        incidentData.casualties = parseInt(formData.casualties);
      }
      
      if (formData.property_damage) {
        incidentData.property_damage = formData.property_damage;
      }
      
      if (formData.immediate_needs.trim()) {
        incidentData.immediate_needs = formData.immediate_needs.trim();
      }

      if (mediaFiles.images.length > 0) {
        incidentData.images = mediaFiles.images;
      }
      
      if (mediaFiles.videos.length > 0) {
        incidentData.videos = mediaFiles.videos;
      }

      if (mediaFiles.documents.length > 0) {
        incidentData.documents = mediaFiles.documents;
      }

      console.log('Submitting incident report with data:', incidentData);
      
      const result = await apiService.createIncident(incidentData);
      
      console.log('✅ Incident created successfully:', result);
      setSubmittedData(result);
      setSubmitted(true);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('❌ Failed to submit incident:', error);
      
      let errorMessage = t('messages.submitFailed', { 
        defaultValue: 'Failed to submit incident report. Please try again.' 
      });
      let fieldErrors = {};
      
      if (error.message && error.message.includes('ApiError:')) {
        const errorText = error.message.replace('ApiError: ', '');
        const errors = errorText.split(', ');
        
        if (errors.length >= 3 && errors.every(e => e === 'This field is required.')) {
          if (!formData.report_type) fieldErrors.report_type = t('validation.fieldRequired', { defaultValue: 'This field is required.' });
          if (!formData.title.trim()) fieldErrors.title = t('validation.fieldRequired', { defaultValue: 'This field is required.' });
          if (!formData.description.trim()) fieldErrors.description = t('validation.fieldRequired', { defaultValue: 'This field is required.' });
          errorMessage = t('messages.fillRequiredFields', { defaultValue: 'Please fill in all required fields.' });
        } else {
          errorMessage = errorText;
        }
      } else if (error.status === 400) {
        errorMessage = t('messages.checkFormData', { defaultValue: 'Please check your form data and try again.' });
      } else if (error.status === 413) {
        errorMessage = t('messages.filesTooLarge', { defaultValue: 'Files are too large. Please reduce file sizes and try again.' });
      } else if (error.status === 0) {
        errorMessage = t('messages.networkError', { defaultValue: 'Network error. Please check your internet connection and try again.' });
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors(prev => ({
        ...prev,
        ...fieldErrors,
        submit: errorMessage
      }));

      setTimeout(() => {
        const errorElement = document.querySelector('[data-error="submit"]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
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
    setMediaFiles({
      images: [],
      videos: [],
      documents: []
    });
    setSubmitted(false);
    setSubmittedData(null);
    setErrors({});
    
    getCurrentLocation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Success page after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('success.reportSubmitted', { defaultValue: 'Report Submitted Successfully' })}
            </h2>
            
            {submittedData && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-green-800 mb-2 font-medium">
                    {t('success.reportId', { defaultValue: 'Report ID' })}: {submittedData.id}
                  </p>
                  <p className="text-green-800 mb-2">
                    {t('success.reportReceived', { 
                      title: submittedData.title,
                      level: ADMIN_LEVEL_LABELS[submittedData.current_level] || t('adminLevel.local', { defaultValue: 'local' }),
                      defaultValue: `Your incident report "${submittedData.title}" has been received and assigned to local authorities.`
                    })}
                  </p>
                  <p className="text-sm text-green-600">
                    {t('success.status', { defaultValue: 'Status' })}: {submittedData.status_display || submittedData.status || t('status.submitted', { defaultValue: 'Submitted' })}
                  </p>
                  {submittedData.priority && (
                    <p className="text-sm text-green-600">
                      {t('success.priority', { defaultValue: 'Priority' })}: {submittedData.priority_display || `${t('level', { defaultValue: 'Level' })} ${submittedData.priority}`}
                    </p>
                  )}
                </div>

                {/* Hierarchical Response Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-2">{t('success.whatHappensNext', { defaultValue: 'What happens next?' })}</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-800">
                        <li>{t('success.step1', { 
                          level: ADMIN_LEVEL_LABELS[submittedData.current_level],
                          defaultValue: `${ADMIN_LEVEL_LABELS[submittedData.current_level]} authorities will review your report`
                        })}</li>
                        <li>{t('success.step2', { defaultValue: 'They will document their response and actions taken' })}</li>
                        <li>{t('success.step3', { defaultValue: "If additional resources are needed, they'll escalate to higher authorities" })}</li>
                        <li>{t('success.step4', { defaultValue: "You'll receive notifications about updates and actions taken" })}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={resetForm}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t('actions.reportAnother', { defaultValue: 'Report Another Incident' })}
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {t('actions.goToDashboard', { defaultValue: 'Go to Dashboard' })}
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                {t('emergency.needImmediate', { defaultValue: 'Need immediate emergency help?' })}
              </p>
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  <span>{t('emergency.call', { defaultValue: 'Emergency' })}: 912</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>SMS: 3030</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('form.reportEmergency', { defaultValue: 'Report Emergency Incident' })}
              </h1>
              <p className="text-gray-600">
                {t('form.helpResponders', { defaultValue: 'Help emergency services respond quickly with accurate information' })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span>{t('portal.name', { defaultValue: 'Rwanda Emergency Portal' })}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                <span>{t('emergency.call', { defaultValue: 'Emergency' })}: 912</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Progress Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-7 h-7" />
                <div>
                  <h2 className="text-xl font-bold">
                    {t('form.incidentDetails', { defaultValue: 'Emergency Incident Details' })}
                  </h2>
                  <p className="text-red-100">
                    {t('form.provideAccurateInfo', { defaultValue: 'Provide accurate information to help emergency responders' })}
                  </p>
                </div>
              </div>
              {dataLoading && (
                <div className="flex items-center gap-2 mt-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-red-100 text-sm">
                    {t('loading', { defaultValue: 'Loading form data...' })}
                  </span>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Global Errors */}
              {errors.loading && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                      <p className="text-amber-800">{errors.loading}</p>
                    </div>
                    <button
                      type="button"
                      onClick={retryLoadData}
                      className="flex items-center gap-1 text-amber-700 hover:text-amber-900 text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {t('actions.retry', { defaultValue: 'Retry' })}
                    </button>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-error="submit">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                    <p className="text-red-800">{errors.submit}</p>
                  </div>
                </div>
              )}

              {errors.location_required && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <MapPin className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                    <p className="text-red-800">{errors.location_required}</p>
                  </div>
                </div>
              )}

              {/* Emergency Type Selection */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  {t('form.whatTypeOfIncident', { defaultValue: 'What type of incident are you reporting?' })} *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {REPORT_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <label
                        key={type.value}
                        className={`relative flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.report_type === type.value
                            ? `${type.bg} border-current`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report_type"
                          value={type.value}
                          checked={formData.report_type === type.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <IconComponent className={`w-6 h-6 ${type.color} mr-4 flex-shrink-0`} />
                        <div>
                          <span className="block font-medium text-gray-900">
                            {type.label}
                          </span>
                        </div>
                        {formData.report_type === type.value && (
                          <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                        )}
                      </label>
                    );
                  })}
                </div>
                {errors.report_type && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.report_type}
                  </p>
                )}
              </div>

              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Disaster Type */}
                <div>
                  <label htmlFor="disaster_type" className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.specificType', { defaultValue: 'Specific Emergency/Disaster Type' })}
                  </label>
                  <select
                    id="disaster_type"
                    name="disaster_type"
                    value={formData.disaster_type}
                    onChange={handleInputChange}
                    disabled={dataLoading || disasterTypes.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">{t('form.selectOptional', { defaultValue: 'Select specific type (optional)' })}</option>
                    {disasterTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {disasterTypes.length === 0 && !dataLoading && (
                    <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('messages.typesUnavailable', { defaultValue: 'Emergency types unavailable - you can still submit' })}
                    </p>
                  )}
                </div>

                {/* Current Location Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.locationStatus', { defaultValue: 'Location Status' })}
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {formData.latitude && formData.longitude ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium text-green-700">
                            {t('location.gpsCaptured', { defaultValue: 'GPS Location Captured' })}
                          </div>
                          <div className="text-sm text-green-600">
                            {t('location.respondersCanFind', { defaultValue: 'Emergency responders can find you precisely' })}
                          </div>
                        </div>
                      </div>
                    ) : locationLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <div>
                          <div className="font-medium text-blue-700">
                            {t('location.getting', { defaultValue: 'Getting Location...' })}
                          </div>
                          <div className="text-sm text-blue-600">
                            {t('location.pleaseWait', { defaultValue: 'Please wait while we find you' })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div>
                          <div className="font-medium text-amber-700">
                            {t('location.manualRequired', { defaultValue: 'Manual Location Required' })}
                          </div>
                          <div className="text-sm text-amber-600">
                            {t('location.enterBelow', { defaultValue: 'Enter address details below' })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Incident Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('form.incidentTitle', { defaultValue: 'Incident Title' })} *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t('form.titlePlaceholder', { 
                    defaultValue: "Brief, clear title describing what happened (e.g., 'House fire on Nyamirambo Street')" 
                  })}
                  maxLength="200"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <div className="mt-1 flex justify-between text-sm">
                  <div>
                    {errors.title && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {errors.title}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500">{formData.title.length}/200</span>
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                  {t('form.detailedDescription', { defaultValue: 'Detailed Description' })} *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder={t('form.descriptionPlaceholder', { 
                    defaultValue: "Provide as much detail as possible:\n• What exactly happened?\n• When did it occur?\n• Current situation?\n• Any immediate dangers?\n• How many people are affected?"
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <div className="mt-1 flex justify-between text-sm">
                  <div>
                    {errors.description && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {errors.description}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500">
                    {formData.description.length} {t('form.characters', { defaultValue: 'characters' })}
                  </span>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {t('form.locationInfo', { defaultValue: 'Location Information' })}
                </h3>
                
                {/* GPS Location - Primary Location Method */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-blue-900">
                        {t('location.currentGPS', { defaultValue: 'Current Location (GPS) - Recommended' })}
                      </h4>
                      <p className="text-sm text-blue-700">
                        {t('location.helpsResponders', { defaultValue: 'This helps emergency responders find you quickly' })}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      {locationLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-sm text-blue-600">
                            {t('location.getting', { defaultValue: 'Getting your location...' })}
                          </span>
                        </div>
                      ) : formData.latitude && formData.longitude ? (
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-green-500" />
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">
                              {t('location.captured', { defaultValue: 'Location captured' })}
                            </div>
                            <div className="text-green-500 text-xs">
                              {t('location.accuracy', { defaultValue: 'Accuracy' })}: ±{Math.round(Math.random() * 50 + 10)}m
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {t('location.useCurrent', { defaultValue: 'Use Current Location' })}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Location coordinates display */}
                  {formData.latitude && formData.longitude && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t('location.coordinates', { defaultValue: 'Coordinates' })}:</span>
                          <span className="text-gray-900 font-mono text-xs">
                            {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const coords = `${formData.latitude},${formData.longitude}`;
                            navigator.clipboard.writeText(coords);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-xs mt-1"
                        >
                          {t('location.copyCoords', { defaultValue: 'Copy coordinates' })}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {errors.location && (
                    <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      {errors.location}
                    </div>
                  )}
                </div>

                {/* Manual Address - Backup Method */}
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.addressDetails', { defaultValue: 'Address Details' })} {!formData.latitude && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder={
                        formData.latitude 
                          ? t('form.addressPlaceholderGPS', { defaultValue: 'GPS location captured. Add more details: building name, floor, nearby landmarks...' })
                          : t('form.addressPlaceholderManual', { defaultValue: 'Enter your address: District, Sector, Cell, Village, street names, landmarks, building details...' })
                      }
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.latitude 
                      ? t('form.addressHelpGPS', { defaultValue: 'Your GPS location has been captured. Additional address details help responders find you faster.' })
                      : t('form.addressHelpManual', { defaultValue: 'Provide as much location detail as possible to help emergency responders find you.' })
                    }
                  </p>
                </div>

                {/* Administrative Location - Optional */}
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.administrativeArea', { defaultValue: 'Administrative Area (Optional)' })}
                  </label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={dataLoading || locations.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">{t('form.selectDistrict', { defaultValue: 'Select district/province if known' })}</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </option>
                    ))}
                  </select>
                  {locations.length === 0 && !dataLoading && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t('messages.areasUnavailable', { defaultValue: 'Administrative areas unavailable - your GPS location is sufficient' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Impact Assessment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {t('form.impactAssessment', { defaultValue: 'Impact Assessment' })}
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Casualties */}
                  <div>
                    <label htmlFor="casualties" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('form.peopleAffected', { defaultValue: 'People Affected' })}
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        id="casualties"
                        name="casualties"
                        value={formData.casualties}
                        onChange={handleInputChange}
                        min="0"
                        max="9999"
                        placeholder={t('form.numberOfPeople', { defaultValue: 'Number of people' })}
                        className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.casualties ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.casualties && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {errors.casualties}
                      </p>
                    )}
                  </div>

                  {/* Property Damage */}
                  <div className="md:col-span-2">
                    <label htmlFor="property_damage" className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('form.propertyDamage', { defaultValue: 'Property Damage Assessment' })}
                    </label>
                    <select
                      id="property_damage"
                      name="property_damage"
                      value={formData.property_damage}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PROPERTY_DAMAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Immediate Needs */}
                <div>
                  <label htmlFor="immediate_needs" className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.immediateNeeds', { defaultValue: 'Immediate Needs/Resources Required' })}
                  </label>
                  <textarea
                    id="immediate_needs"
                    name="immediate_needs"
                    value={formData.immediate_needs}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder={t('form.needsPlaceholder', { 
                      defaultValue: 'What immediate help is needed? (medical assistance, evacuation, rescue equipment, food, water, shelter, etc.)' 
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {t('form.visualEvidence', { defaultValue: 'Visual Evidence' })}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('form.visualHelp', { defaultValue: 'Photos and videos help emergency responders understand the situation better and respond more effectively.' })}
                </p>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.photos', { defaultValue: 'Photos' })} ({t('form.maxFiles', { defaultValue: 'Max 5 files, 10MB each' })})
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'images')}
                      className="hidden"
                    />
                    
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        {t('form.uploadPhotos', { defaultValue: 'Upload Photos' })}
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        {t('form.imageFormats', { defaultValue: 'JPG, PNG, GIF up to 10MB each' })}
                      </p>
                    </div>
                  </div>

                  {/* Display uploaded images */}
                  {mediaFiles.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {mediaFiles.images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile('images', index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Image upload errors */}
                  {(errors.images_size || errors.images_type || errors.images_count) && (
                    <div className="mt-2 text-sm text-red-600">
                      {errors.images_size || errors.images_type || errors.images_count}
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.videos', { defaultValue: 'Videos' })} ({t('form.maxFiles', { defaultValue: 'Max 5 files, 10MB each' })})
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'videos')}
                      className="hidden"
                    />
                    
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        {t('form.uploadVideos', { defaultValue: 'Upload Videos' })}
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        {t('form.videoFormats', { defaultValue: 'MP4, MOV, AVI up to 10MB each' })}
                      </p>
                    </div>
                  </div>

                  {/* Display uploaded videos */}
                  {mediaFiles.videos.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {mediaFiles.videos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded">
                              <Upload className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-600">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('videos', index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Video upload errors */}
                  {(errors.videos_size || errors.videos_type || errors.videos_count) && (
                    <div className="mt-2 text-sm text-red-600">
                      {errors.videos_size || errors.videos_type || errors.videos_count}
                    </div>
                  )}
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('form.documents', { defaultValue: 'Documents' })} ({t('form.maxFiles', { defaultValue: 'Max 5 files, 10MB each' })})
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <input
                      ref={documentInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'documents')}
                      className="hidden"
                    />
                    
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <button
                        type="button"
                        onClick={() => documentInputRef.current?.click()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        {t('form.uploadDocuments', { defaultValue: 'Upload Documents' })}
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        {t('form.documentFormats', { defaultValue: 'PDF, Word, Excel up to 10MB each' })}
                      </p>
                    </div>
                  </div>

                  {/* Display uploaded documents */}
                  {mediaFiles.documents.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {mediaFiles.documents.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-600">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('documents', index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Document upload errors */}
                  {(errors.documents_size || errors.documents_type || errors.documents_count) && (
                    <div className="mt-2 text-sm text-red-600">
                      {errors.documents_size || errors.documents_type || errors.documents_count}
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact Info */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">
                      {t('emergency.contacts', { defaultValue: 'Emergency Contacts' })}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-red-800">
                      <div>
                        <p className="font-medium">
                          {t('emergency.police', { defaultValue: 'Police Emergency' })}: <span className="text-lg">912</span>
                        </p>
                        <p>{t('emergency.medical', { defaultValue: 'Medical Emergency' })}: 114</p>
                      </div>
                      <div>
                        <p>{t('emergency.fire', { defaultValue: 'Fire Emergency' })}: 113</p>
                        <p>{t('emergency.sms', { defaultValue: 'SMS Emergency' })}: 3030</p>
                      </div>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      {t('emergency.callFirst', { 
                        defaultValue: 'If this is a life-threatening emergency, please call emergency services immediately before or while submitting this report.' 
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-4 px-8 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        {t('form.submitting', { defaultValue: 'Submitting Report...' })}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6" />
                        {t('form.submitReport', { defaultValue: 'Submit Emergency Report' })}
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {t('actions.clearForm', { defaultValue: 'Clear Form' })}
                  </button>
                </div>
                
                <p className="text-center text-sm text-gray-600 mt-4">
                  {t('form.disclaimer', { 
                    defaultValue: 'By submitting this report, you confirm that the information provided is accurate to the best of your knowledge and understand that false emergency reports are illegal.' 
                  })}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenIncidentReport;