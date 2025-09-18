import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera,
  Upload,
  X,
  CheckCircle,
  RefreshCw,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Save
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

// Helper function to construct media URLs
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  
  // If it's already a full URL, return as is
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  
  // If it's a relative path, construct the full URL
  // Adjust this base URL to match your backend server
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
  
  return `${baseUrl}/${cleanPath}`;
};

const IncidentEditPage = () => {
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
    immediate_needs: '',
    status: '',
    priority: 3
  });

  const [mediaFiles, setMediaFiles] = useState({
    images: [],
    videos: [],
    existingImages: [],
    existingVideos: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [disasterTypes, setDisasterTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

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
    Promise.all([
      loadIncident(),
      loadInitialData()
    ]);
  }, [id]);

  const loadIncident = async () => {
    try {
      const response = await apiService.getIncident(id);
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
        casualties: incident.casualties || '',
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
    } catch (err) {
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
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;
    const validFiles = [];
    const newErrors = {};

    const currentCount = mediaFiles[type].length + mediaFiles[`existing${type.charAt(0).toUpperCase() + type.slice(1)}`].length;

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
  };

  const removeExistingFile = (type, index) => {
    setMediaFiles(prev => ({
      ...prev,
      [`existing${type.charAt(0).toUpperCase() + type.slice(1)}`]: prev[`existing${type.charAt(0).toUpperCase() + type.slice(1)}`].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

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

    if (formData.casualties && (isNaN(formData.casualties) || parseInt(formData.casualties) < 0)) {
      newErrors.casualties = 'Casualties must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setErrors(prev => ({ ...prev, submit: null }));
    
    try {
      const updateData = {
        ...formData,
        casualties: formData.casualties ? parseInt(formData.casualties) : null,
        priority: parseInt(formData.priority)
      };

      // Handle file uploads if there are new files
      if (mediaFiles.images.length > 0 || mediaFiles.videos.length > 0) {
        // Include existing files that weren't removed
        updateData.images = [...mediaFiles.existingImages];
        updateData.videos = [...mediaFiles.existingVideos];
        
        // Add new files
        if (mediaFiles.images.length > 0) {
          updateData.images = [...updateData.images, ...mediaFiles.images];
        }
        if (mediaFiles.videos.length > 0) {
          updateData.videos = [...updateData.videos, ...mediaFiles.videos];
        }
      } else {
        // Only existing files
        updateData.images = mediaFiles.existingImages;
        updateData.videos = mediaFiles.existingVideos;
      }

      const result = await apiService.updateIncident(id, updateData);
      navigate(`/incidents/${id}/view`, { 
        state: { message: 'Incident updated successfully' }
      });
    } catch (err) {
      console.error('Update incident error:', err);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to update incident. Please try again.'
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Incident</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/incidents')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Incidents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link to="/incidents" className="hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Incidents
                </Link>
                <span>/</span>
                <Link to={`/incidents/${id}/view`} className="hover:text-gray-700">
                  #{id.slice(0, 8)}
                </Link>
                <span>/</span>
                <span className="text-gray-900">Edit</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">Edit Incident Report</h1>
              <p className="text-gray-600">Update incident details and information</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/incidents/${id}/view`}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  <p className="text-red-800">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="report_type" className="block text-sm font-semibold text-gray-900 mb-2">
                  Report Type *
                </label>
                <select
                  id="report_type"
                  name="report_type"
                  value={formData.report_type}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.report_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select report type</option>
                  {REPORT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.report_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.report_type}</p>
                )}
              </div>

              <div>
                <label htmlFor="disaster_type" className="block text-sm font-semibold text-gray-900 mb-2">
                  Disaster Type
                </label>
                <select
                  id="disaster_type"
                  name="disaster_type"
                  value={formData.disaster_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select disaster type (optional)</option>
                  {disasterTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status and Priority */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-900 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
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
                maxLength="200"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="mt-1 flex justify-between text-sm">
                <div>
                  {errors.title && <span className="text-red-600">{errors.title}</span>}
                </div>
                <span className="text-gray-500">{formData.title.length}/200</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
                    Administrative Area
                  </label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select area (optional)</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    GPS Coordinates
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude || ''}
                      onChange={handleInputChange}
                      placeholder="Latitude"
                      step="any"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude || ''}
                      onChange={handleInputChange}
                      placeholder="Longitude"
                      step="any"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-2">
                  Address Details
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter detailed address, landmarks, or location description..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Impact Assessment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Impact Assessment</h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="casualties" className="block text-sm font-semibold text-gray-900 mb-2">
                    People Affected
                  </label>
                  <input
                    type="number"
                    id="casualties"
                    name="casualties"
                    value={formData.casualties}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Number of people"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.casualties ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.casualties && (
                    <p className="mt-1 text-sm text-red-600">{errors.casualties}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="property_damage" className="block text-sm font-semibold text-gray-900 mb-2">
                    Property Damage
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

              <div>
                <label htmlFor="immediate_needs" className="block text-sm font-semibold text-gray-900 mb-2">
                  Immediate Needs
                </label>
                <textarea
                  id="immediate_needs"
                  name="immediate_needs"
                  value={formData.immediate_needs}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="What immediate help or resources are needed?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Media Management */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Media Files</h3>

              {/* Existing Images */}
              {mediaFiles.existingImages.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Current Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaFiles.existingImages.map((image, index) => {
                      const imageUrl = getMediaUrl(image);
                      return (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Existing image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                            onError={(e) => {
                              console.error('Existing image failed to load:', imageUrl);
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI0Y5RkFGQiIvPgo8L3N2Zz4K';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingFile('images', index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Add New Images (Max 5 total, 10MB each)
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
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Upload Images
                    </button>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG, GIF up to 10MB each</p>
                  </div>
                </div>

                {mediaFiles.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaFiles.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile('images', index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {errors.images_size && (
                  <p className="mt-2 text-sm text-red-600">{errors.images_size}</p>
                )}
              </div>

              {/* Existing Videos */}
              {mediaFiles.existingVideos.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Current Videos</h4>
                  <div className="space-y-3">
                    {mediaFiles.existingVideos.map((video, index) => {
                      const videoUrl = getMediaUrl(video);
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <video
                              src={videoUrl}
                              className="w-16 h-16 rounded object-cover"
                              controls={false}
                              onError={(e) => {
                                console.error('Existing video failed to load:', videoUrl);
                              }}
                            />
                            <span className="text-sm text-gray-900">Video {index + 1}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingFile('videos', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Videos */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Add New Videos (Max 5 total, 10MB each)
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
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Upload Videos
                    </button>
                    <p className="text-sm text-gray-500 mt-1">MP4, MOV, AVI up to 10MB each</p>
                  </div>
                </div>

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
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errors.videos_size && (
                  <p className="mt-2 text-sm text-red-600">{errors.videos_size}</p>
                )}
              </div>

              {/* Debug section - remove this in production */}
              {import.meta.env.DEV && (mediaFiles.existingImages.length > 0 || mediaFiles.existingVideos.length > 0) && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                  <details>
                    <summary className="cursor-pointer text-gray-600">Debug Media URLs</summary>
                    <div className="mt-2">
                      <p><strong>Existing Images:</strong></p>
                      <ul className="ml-4">
                        {mediaFiles.existingImages.map((img, i) => (
                          <li key={i} className="break-all">
                            Original: {img} → Processed: {getMediaUrl(img)}
                          </li>
                        ))}
                      </ul>
                      <p><strong>Existing Videos:</strong></p>
                      <ul className="ml-4">
                        {mediaFiles.existingVideos.map((vid, i) => (
                          <li key={i} className="break-all">
                            Original: {vid} → Processed: {getMediaUrl(vid)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Incident
                  </>
                )}
              </button>
              
              <Link
                to={`/incidents/${id}/view`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IncidentEditPage;