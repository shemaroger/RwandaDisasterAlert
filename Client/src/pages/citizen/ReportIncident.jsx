import React, { useState, useEffect, useRef } from 'react';
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
  Smartphone
} from 'lucide-react';

// Import your actual API service
import apiService from '../../services/api';

const CitizenIncidentReport = () => {
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
    videos: []
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

  const REPORT_TYPES = [
    { value: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
    { value: 'hazard', label: 'Hazard', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
    { value: 'infrastructure', label: 'Infrastructure Damage', icon: Building, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { value: 'health', label: 'Health Emergency', icon: Phone, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-200' },
    { value: 'security', label: 'Security Incident', icon: AlertTriangle, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200' },
    { value: 'other', label: 'Other', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' }
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
      
      if (errors.loading) {
        setErrors(prev => ({ ...prev, loading: null }));
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setErrors(prev => ({
        ...prev,
        loading: 'Failed to load form data. You can still submit the report, but some options may not be available.'
      }));
    } finally {
      setDataLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setLocationLoading(false);
      },
      (error) => {
        console.warn('Location access denied or failed:', error);
        setLocationLoading(false);
        
        if (error.code !== error.PERMISSION_DENIED) {
          setErrors(prev => ({
            ...prev,
            location: 'Unable to get your location automatically. Please enter address manually.'
          }));
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 300000 
      }
    );
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
      newErrors[`${type}_count`] = `Maximum ${maxFiles} ${type} allowed`;
    }

    files.forEach((file, index) => {
      if (currentCount + index >= maxFiles) return;

      if (file.size > maxSize) {
        newErrors[`${type}_size`] = `File "${file.name}" is too large. Maximum size is 10MB.`;
        return;
      }
      
      if (type === 'images' && !file.type.startsWith('image/')) {
        newErrors[`${type}_type`] = `"${file.name}" is not a valid image file.`;
        return;
      }
      
      if (type === 'videos' && !file.type.startsWith('video/')) {
        newErrors[`${type}_type`] = `"${file.name}" is not a valid video file.`;
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

    if (formData.casualties && (isNaN(formData.casualties) || parseInt(formData.casualties) < 0)) {
      newErrors.casualties = 'Casualties must be a valid number (0 or greater)';
    }

    if (!formData.address.trim() && !formData.location && (!formData.latitude || !formData.longitude)) {
      newErrors.location_required = 'Please provide location information: select an area, enter an address, or allow GPS access';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      // Create FormData object to handle file uploads properly
      const submitData = new FormData();
      
      // Add form fields to FormData
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== null && value !== '' && value !== undefined) {
          submitData.append(key, value);
        }
      });

      // Add files with correct naming convention for Django backend
      mediaFiles.images.forEach((file, index) => {
        submitData.append(`images[${index}]`, file);
      });
      
      mediaFiles.videos.forEach((file, index) => {
        submitData.append(`videos[${index}]`, file);
      });

      console.log('Submitting incident report...');
      
      // Use the corrected API call that matches your backend
      const result = await apiService.createIncident(submitData);
      
      console.log('Incident created successfully:', result);
      setSubmittedData(result);
      setSubmitted(true);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Failed to submit incident:', error);
      
      let errorMessage = 'Failed to submit incident report. Please try again.';
      
      // Handle different error types based on your API service
      if (error.response?.status === 400 && error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const fieldErrors = {};
          Object.keys(errorData).forEach(field => {
            const fieldError = Array.isArray(errorData[field]) 
              ? errorData[field].join(', ') 
              : errorData[field];
            fieldErrors[field] = fieldError;
          });
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          errorMessage = 'Please check the form for validation errors.';
        } else {
          errorMessage = errorData.message || errorData || errorMessage;
        }
      } else if (error.response?.status === 413) {
        errorMessage = 'Files are too large. Please reduce file sizes and try again.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors(prev => ({
        ...prev,
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
      videos: []
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
              Report Submitted Successfully
            </h2>
            
            {submittedData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <p className="text-green-800 mb-2 font-medium">
                  Report ID: {submittedData.id}
                </p>
                <p className="text-green-800 mb-2">
                  Your incident report "{submittedData.title}" has been received and is being reviewed by emergency services.
                </p>
                <p className="text-sm text-green-600">
                  Status: {submittedData.status || 'Submitted'} • You will be notified of any updates.
                </p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={resetForm}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Report Another Incident
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">Need emergency help?</p>
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  <span>Emergency: 912</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>SMS: Text to 3030</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Report Emergency Incident</h1>
              <p className="text-gray-600">Help emergency services respond quickly with accurate information</p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span>Rwanda Emergency Portal</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                <span>Emergency: 912</span>
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
                  <h2 className="text-xl font-bold">Emergency Incident Details</h2>
                  <p className="text-red-100">Provide accurate information to help emergency responders</p>
                </div>
              </div>
              {dataLoading && (
                <div className="flex items-center gap-2 mt-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-red-100 text-sm">Loading form data...</span>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Global Errors */}
              {errors.loading && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                    <p className="text-amber-800">{errors.loading}</p>
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
                  What type of incident are you reporting? *
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
                    Specific Emergency/Disaster Type
                  </label>
                  <select
                    id="disaster_type"
                    name="disaster_type"
                    value={formData.disaster_type}
                    onChange={handleInputChange}
                    disabled={dataLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100"
                  >
                    <option value="">Select specific type (optional)</option>
                    {disasterTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {disasterTypes.length === 0 && !dataLoading && (
                    <p className="mt-1 text-xs text-gray-500">Emergency types unavailable - you can still submit</p>
                  )}
                </div>

                {/* Administrative Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
                    District/Province
                  </label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={dataLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100"
                  >
                    <option value="">Select area (optional)</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </option>
                    ))}
                  </select>
                  {locations.length === 0 && !dataLoading && (
                    <p className="mt-1 text-xs text-gray-500">Locations unavailable - you can still submit</p>
                  )}
                </div>
              </div>

              {/* Incident Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Incident Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief, clear title describing what happened (e.g., 'House fire on Nyamirambo Street')"
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
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Provide as much detail as possible:&#10;• What exactly happened?&#10;• When did it occur?&#10;• Current situation?&#10;• Any immediate dangers?&#10;• How many people are affected?"
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
                  <span className="text-gray-500">{formData.description.length} characters</span>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Information</h3>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-2">
                    Specific Location/Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Enter specific address, street names, sector, cell, landmarks, or detailed location description..."
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* GPS Location */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">GPS Location</h4>
                      <p className="text-sm text-blue-700">Help responders find the exact location</p>
                    </div>
                    
                    <div className="text-right">
                      {locationLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-sm text-blue-600">Getting location...</span>
                        </div>
                      ) : formData.latitude && formData.longitude ? (
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-green-500" />
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">Location captured</div>
                            <div className="text-green-500 text-xs">
                              {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Get Current Location
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {errors.location && (
                    <div className="mt-2 text-sm text-amber-600">
                      {errors.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Impact Assessment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Impact Assessment</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Casualties */}
                  <div>
                    <label htmlFor="casualties" className="block text-sm font-semibold text-gray-900 mb-2">
                      People Affected
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
                        placeholder="Number of people"
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
                      Property Damage Assessment
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
                    Immediate Needs/Resources Required
                  </label>
                  <textarea
                    id="immediate_needs"
                    name="immediate_needs"
                    value={formData.immediate_needs}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="What immediate help is needed? (medical assistance, evacuation, rescue equipment, food, water, shelter, etc.)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Visual Evidence</h3>
                <p className="text-sm text-gray-600">
                  Photos and videos help emergency responders understand the situation better and respond more effectively.
                </p>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Photos (Max 5 files, 10MB each)
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
                        Upload Photos
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, PNG, GIF up to 10MB each
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
                    Videos (Max 5 files, 10MB each)
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
                        Upload Videos
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        MP4, MOV, AVI up to 10MB each
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
              </div>

              {/* Emergency Contact Info */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Emergency Contacts</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-red-800">
                      <div>
                        <p className="font-medium">Police Emergency: <span className="text-lg">912</span></p>
                        <p>Medical Emergency: 114</p>
                      </div>
                      <div>
                        <p>Fire Emergency: 113</p>
                        <p>SMS Emergency: 3030</p>
                      </div>
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      If this is a life-threatening emergency, please call emergency services immediately before or while submitting this report.
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
                        Submitting Report...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6" />
                        Submit Emergency Report
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Clear Form
                  </button>
                </div>
                
                <p className="text-center text-sm text-gray-600 mt-4">
                  By submitting this report, you confirm that the information provided is accurate to the best of your knowledge and understand that false emergency reports are illegal.
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