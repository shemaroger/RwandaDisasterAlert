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
  Save,
  FileText
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

// Helper function to construct media URLs
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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
    priority: 3,
    current_level: 'village'
  });

  const [mediaFiles, setMediaFiles] = useState({
    images: [],
    videos: [],
    documents: [],
    existingMedia: []
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
  const documentInputRef = useRef(null);

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
    { value: 'in_progress', label: 'In Progress' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' }
  ];

  const ADMIN_LEVELS = [
    { value: 'village', label: 'Village' },
    { value: 'sector', label: 'Sector' },
    { value: 'district', label: 'District' },
    { value: 'province', label: 'Province' },
    { value: 'national', label: 'National' }
  ];

  const PRIORITY_OPTIONS = [
    { value: 1, label: 'Priority 1 (Critical)' },
    { value: 2, label: 'Priority 2 (High)' },
    { value: 3, label: 'Priority 3 (Medium)' },
    { value: 4, label: 'Priority 4 (Low)' },
    { value: 5, label: 'Priority 5 (Minimal)' }
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
        priority: incident.priority || 3,
        current_level: incident.current_level || 'village'
      });

      // Handle media files from IncidentMedia model
      setMediaFiles(prev => ({
        ...prev,
        existingMedia: incident.media_files || []
      }));
    } catch (err) {
      setError('Failed to load incident details');
      console.error('Load incident error:', err);
    }
  };

  const loadInitialData = async () => {
    try {
      const [disasterTypesRes, locationsRes] = await Promise.all([
        apiService.getDisasterTypes({ is_active: true, ordering: 'name' }).catch(() => ({ results: [] })),
        apiService.getLocations({ ordering: 'name' }).catch(() => ({ results: [] }))
      ]);
      
      const disasterTypesData = disasterTypesRes.results || disasterTypesRes || [];
      const locationsData = locationsRes.results || locationsRes || [];
      
      setDisasterTypes(disasterTypesData);
      setLocations(locationsData);
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

    const currentCount = mediaFiles[type].length + mediaFiles.existingMedia.filter(m => m.media_type === type.slice(0, -1)).length;

    files.forEach((file, index) => {
      if (currentCount + index >= maxFiles) {
        newErrors[`${type}_count`] = `Maximum ${maxFiles} ${type} allowed`;
        return;
      }

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
      
      if (type === 'documents' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
        newErrors[`${type}_type`] = `"${file.name}" is not a valid document file.`;
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
  };

  const removeExistingMedia = (mediaId) => {
    setMediaFiles(prev => ({
      ...prev,
      existingMedia: prev.existingMedia.filter(m => m.id !== mediaId)
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
        report_type: formData.report_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: parseInt(formData.priority),
        current_level: formData.current_level
      };

      // Add optional fields
      if (formData.disaster_type) {
        updateData.disaster_type = formData.disaster_type;
      }
      
      if (formData.location) {
        updateData.location = formData.location;
      }
      
      if (formData.latitude && formData.longitude) {
        updateData.latitude = parseFloat(formData.latitude);
        updateData.longitude = parseFloat(formData.longitude);
      }
      
      if (formData.address.trim()) {
        updateData.address = formData.address.trim();
      }
      
      if (formData.casualties) {
        updateData.casualties = parseInt(formData.casualties);
      }
      
      if (formData.property_damage) {
        updateData.property_damage = formData.property_damage;
      }
      
      if (formData.immediate_needs.trim()) {
        updateData.immediate_needs = formData.immediate_needs.trim();
      }

      // Add new media files
      if (mediaFiles.images.length > 0) {
        updateData.images = mediaFiles.images;
      }
      
      if (mediaFiles.videos.length > 0) {
        updateData.videos = mediaFiles.videos;
      }

      if (mediaFiles.documents.length > 0) {
        updateData.documents = mediaFiles.documents;
      }

      console.log('Updating incident with data:', updateData);
      const result = await apiService.updateIncident(id, updateData);
      
      // Delete removed existing media
      const existingIds = mediaFiles.existingMedia.map(m => m.id);
      const originalMedia = (await apiService.getIncident(id)).media_files || [];
      const removedMedia = originalMedia.filter(m => !existingIds.includes(m.id));
      
      // Note: You may need to add a delete media endpoint to your API
      // for (const media of removedMedia) {
      //   await apiService.deleteIncidentMedia(media.id);
      // }

      navigate(`/incidents/${id}/view`, { 
        state: { message: 'Incident updated successfully' }
      });
    } catch (err) {
      console.error('Update incident error:', err);
      setErrors(prev => ({
        ...prev,
        submit: err.message || 'Failed to update incident. Please try again.'
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
                  disabled={disasterTypes.length === 0}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select disaster type (optional)</option>
                  {disasterTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {disasterTypes.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No disaster types available</p>
                )}
              </div>
            </div>

            {/* Status, Priority, and Level */}
            <div className="grid md:grid-cols-3 gap-6">
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

              <div>
                <label htmlFor="current_level" className="block text-sm font-semibold text-gray-900 mb-2">
                  Current Level
                </label>
                <select
                  id="current_level"
                  name="current_level"
                  value={formData.current_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ADMIN_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
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
                    disabled={locations.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select area (optional)</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </option>
                    ))}
                  </select>
                  {locations.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">No locations available</p>
                  )}
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

              {/* Existing Media */}
              {mediaFiles.existingMedia.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Current Media Files</h4>
                  <div className="space-y-4">
                    {/* Images */}
                    {mediaFiles.existingMedia.filter(m => m.media_type === 'image').length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Images</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {mediaFiles.existingMedia
                            .filter(m => m.media_type === 'image')
                            .map((media) => {
                              const imageUrl = getMediaUrl(media.file);
                              return (
                                <div key={media.id} className="relative">
                                  <img
                                    src={imageUrl}
                                    alt={media.caption || 'Incident media'}
                                    className="w-full h-24 object-cover rounded-lg border"
                                    onError={(e) => {
                                      console.error('Image failed to load:', imageUrl);
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeExistingMedia(media.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  {media.caption && (
                                    <p className="text-xs text-gray-600 mt-1">{media.caption}</p>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {mediaFiles.existingMedia.filter(m => m.media_type === 'video').length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Videos</p>
                        <div className="space-y-3">
                          {mediaFiles.existingMedia
                            .filter(m => m.media_type === 'video')
                            .map((media) => {
                              const videoUrl = getMediaUrl(media.file);
                              return (
                                <div key={media.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                                  <div className="flex items-center gap-3">
                                    <video
                                      src={videoUrl}
                                      className="w-16 h-16 rounded object-cover"
                                      controls={false}
                                    />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {media.caption || 'Video'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Uploaded {new Date(media.uploaded_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeExistingMedia(media.id)}
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

                    {/* Documents */}
                    {mediaFiles.existingMedia.filter(m => m.media_type === 'document').length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Documents</p>
                        <div className="space-y-2">
                          {mediaFiles.existingMedia
                            .filter(m => m.media_type === 'document')
                            .map((media) => {
                              const docUrl = getMediaUrl(media.file);
                              const fileName = media.file.split('/').pop();
                              return (
                                <div key={media.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {media.caption || fileName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Uploaded {new Date(media.uploaded_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeExistingMedia(media.id)}
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

                {(errors.images_size || errors.images_type || errors.images_count) && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.images_size || errors.images_type || errors.images_count}
                  </p>
                )}
              </div>

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

                {(errors.videos_size || errors.videos_type || errors.videos_count) && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.videos_size || errors.videos_type || errors.videos_count}
                  </p>
                )}
              </div>

              {/* New Documents */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Add New Documents (Max 5 total, 10MB each)
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
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <button
                      type="button"
                      onClick={() => documentInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Upload Documents
                    </button>
                    <p className="text-sm text-gray-500 mt-1">PDF, Word, Excel up to 10MB each</p>
                  </div>
                </div>

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
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(errors.documents_size || errors.documents_type || errors.documents_count) && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.documents_size || errors.documents_type || errors.documents_count}
                  </p>
                )}
              </div>
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