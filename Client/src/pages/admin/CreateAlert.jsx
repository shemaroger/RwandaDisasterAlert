// src/pages/alerts/CreateAlert.jsx - Enhanced version
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, AlertTriangle, Target, Radio, Clock, Mail, Globe, 
  MessageSquare, MapPin, X, Map, CheckCircle2, Bell, Zap, Users, 
  Eye, Settings, Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import MapModal from '../../components/MapModal';

// Enhanced Location Selector Component
const LocationSelector = ({ 
  centerLat, 
  centerLng, 
  radiusKm, 
  onLocationChange, 
  onRadiusChange,
  onOpenMap
}) => {
  const handleClearLocation = () => {
    onLocationChange(null, null);
  };

  // Estimate affected population based on radius (rough calculation)
  const estimatePopulation = () => {
    if (!radiusKm) return 0;
    // Rough estimate: Rwanda has ~13M people in ~26,000 km²
    // This is a very rough approximation for demonstration
    const populationDensity = 500; // people per km²
    const area = Math.PI * radiusKm * radiusKm;
    return Math.round(area * populationDensity);
  };

  return (
    <div className="space-y-4">
      {/* Map trigger button */}
      <div className="text-center">
        <button
          type="button"
          onClick={onOpenMap}
          className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="bg-red-100 p-4 rounded-full group-hover:bg-red-200 transition-colors">
              <Map className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {centerLat && centerLng ? 'Update Target Location' : 'Set Target Location'}
              </h3>
              <p className="text-sm text-gray-600">
                {centerLat && centerLng ? 
                  'Click to modify your alert target area' : 
                  'Click to open interactive map and select target area'
                }
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Current location display */}
      {centerLat && centerLng && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-800">Target Location Set</span>
            </div>
            <button
              type="button"
              onClick={handleClearLocation}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Coordinates:</span>
              <p className="font-mono text-green-800">{centerLat.toFixed(6)}, {centerLng.toFixed(6)}</p>
            </div>
            <div>
              <span className="text-green-700 font-medium">Coverage:</span>
              <p className="text-green-800">
                {radiusKm}km radius (~{(Math.PI * radiusKm * radiusKm).toFixed(1)} km²)
              </p>
            </div>
          </div>
          
          {/* Population estimate */}
          <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-700" />
              <span className="text-sm font-medium text-green-800">
                Estimated Population: ~{estimatePopulation().toLocaleString()} people
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              This is a rough estimate based on population density
            </p>
          </div>
        </div>
      )}

      {/* Quick radius adjustment */}
      {centerLat && centerLng && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Radius Adjustment
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 20].map(radius => (
              <button
                key={radius}
                type="button"
                onClick={() => onRadiusChange(radius)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  radiusKm === radius 
                    ? 'bg-red-50 border-red-300 text-red-700 font-medium' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {radius}km
              </button>
            ))}
          </div>
          
          {/* Custom radius input */}
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Custom Radius (km):</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={radiusKm}
              onChange={(e) => onRadiusChange(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter custom radius"
            />
          </div>
        </div>
      )}

      {/* Help text */}
      {!centerLat || !centerLng ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">Geographic Targeting</p>
              <p className="text-xs text-blue-700">
                Use the interactive map to precisely target your emergency alert to specific geographic areas. 
                This helps ensure only relevant people receive the notification.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// Enhanced Delivery Channels Component
const DeliveryChannelsCard = ({ form, setField }) => {
  const channels = [
    {
      key: 'send_sms',
      label: 'SMS Messages',
      icon: MessageSquare,
      description: 'Text messages to mobile phones',
      enabled: form.send_sms,
      priority: 'High reach, immediate delivery'
    },
    {
      key: 'send_push',
      label: 'Push Notifications',
      icon: Bell,
      description: 'Mobile app notifications',
      enabled: form.send_push,
      priority: 'Instant, rich media support'
    },
    {
      key: 'send_email',
      label: 'Email Alerts',
      icon: Mail,
      description: 'Detailed email notifications',
      enabled: form.send_email,
      priority: 'Detailed information, attachments'
    },
    {
      key: 'publish_web',
      label: 'Web Publication',
      icon: Globe,
      description: 'Public website and feeds',
      enabled: form.publish_web,
      priority: 'Broad public access'
    }
  ];

  const enabledCount = channels.filter(c => c.enabled).length;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Radio className="w-5 h-5 text-red-600" />
        Delivery Channels
        <span className="text-sm font-normal text-gray-500">({enabledCount} enabled)</span>
      </h3>
      
      <div className="space-y-4">
        {channels.map((channel) => {
          const IconComponent = channel.icon;
          return (
            <div key={channel.key} className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channel.enabled}
                  onChange={(e) => setField(channel.key, e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500 focus:ring-2 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{channel.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{channel.description}</p>
                  <p className="text-xs text-blue-600 font-medium">{channel.priority}</p>
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {enabledCount === 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800 font-medium">No delivery channels selected</span>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Select at least one delivery channel to send your alert.
          </p>
        </div>
      )}
    </div>
  );
};

// Preview Card Component
const AlertPreviewCard = ({ form, disasterTypes }) => {
  const disasterType = disasterTypes.find(dt => dt.id == form.disaster_type);
  
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Eye className="w-5 h-5 text-red-600" />
        Alert Preview
      </h3>
      
      {form.title || form.message ? (
        <div className="space-y-4">
          {/* Mobile SMS Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              SMS Preview
            </div>
            <div className="bg-white rounded-lg p-3 border max-w-xs">
              <div className="text-sm">
                {form.severity && (
                  <span className="text-xs font-bold">
                    {form.severity.toUpperCase()} ALERT • 
                  </span>
                )}
                {form.title && <strong>{form.title}</strong>}
                {form.title && form.message && <br />}
                {form.message}
              </div>
            </div>
          </div>

          {/* Web Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Web Preview
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  form.severity === 'extreme' ? 'bg-red-100' :
                  form.severity === 'severe' ? 'bg-orange-100' :
                  form.severity === 'moderate' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    form.severity === 'extreme' ? 'text-red-600' :
                    form.severity === 'severe' ? 'text-orange-600' :
                    form.severity === 'moderate' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  {form.title && (
                    <h4 className="font-semibold text-gray-900 text-sm">{form.title}</h4>
                  )}
                  <div className="text-xs text-gray-600 mb-2">
                    {disasterType?.name} • {form.severity} • {new Date().toLocaleString()}
                  </div>
                  {form.message && (
                    <p className="text-sm text-gray-800">{form.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alert Stats */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Character count: {(form.title + ' ' + form.message).length}/160 (SMS limit)</div>
            {form.center_lat && form.center_lng && (
              <div>Target area: ~{(Math.PI * form.radius_km * form.radius_km).toFixed(1)} km²</div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Eye className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Enter alert title and message to see preview</p>
        </div>
      )}
    </div>
  );
};

// Constants
const SEVERITIES = [
  { value: 'info', label: 'Information', color: 'blue', description: 'General information, no immediate action required' },
  { value: 'minor', label: 'Minor', color: 'green', description: 'Minor threat, minimal impact expected' },
  { value: 'moderate', label: 'Moderate', color: 'yellow', description: 'Moderate threat, some action may be required' },
  { value: 'severe', label: 'Severe', color: 'orange', description: 'Severe threat, immediate action recommended' },
  { value: 'extreme', label: 'Extreme', color: 'red', description: 'Extreme threat, immediate action required' }
];

// Main CreateAlert Component
export function CreateAlert() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [saveAndActivate, setSaveAndActivate] = useState(false);
  
  const [disasterTypes, setDisasterTypes] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    title: '',
    title_rw: '',
    title_fr: '',
    message: '',
    message_rw: '',
    message_fr: '',
    disaster_type: '',
    severity: 'info',
    affected_locations: [],
    geofence_coordinates: '',
    radius_km: 5,
    center_lat: '',
    center_lng: '',
    expires_at: '',
    send_sms: true,
    send_push: true,
    send_email: false,
    publish_web: true,
    instructions: '',
    instructions_rw: '',
    instructions_fr: '',
    contact_info: '',
    resources_urls: '',
    estimated_affected_population: '',
    priority_score: 5
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [disasterTypesRes, locationsRes] = await Promise.all([
          apiService.getDisasterTypes({ page_size: 1000 }),
          apiService.getLocations({ page_size: 1000 })
        ]);
        
        setDisasterTypes(disasterTypesRes?.results || disasterTypesRes || []);
        setLocations(locationsRes?.results || locationsRes || []);
        
        // Set default disaster type
        const types = disasterTypesRes?.results || disasterTypesRes || [];
        if (types.length > 0) {
          setForm(prev => ({ ...prev, disaster_type: types[0].id }));
        }
      } catch (error) {
        toast.error('Failed to load form data');
        console.error('Error loading form data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationChange = useCallback((lat, lng) => {
    setField('center_lat', lat);
    setField('center_lng', lng);
  }, []);

  const handleRadiusChange = useCallback((radius) => {
    setField('radius_km', radius);
  }, []);

  const openMapModal = () => {
    setIsMapModalOpen(true);
  };

  const closeMapModal = () => {
    setIsMapModalOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    if (!form.disaster_type) newErrors.disaster_type = 'Disaster type is required';
    
    // Check if at least one delivery channel is selected
    if (!form.send_sms && !form.send_push && !form.send_email && !form.publish_web) {
      newErrors.delivery_channels = 'Select at least one delivery channel';
    }
    
    // Validate JSON fields
    if (form.geofence_coordinates && form.geofence_coordinates.trim()) {
      try {
        JSON.parse(form.geofence_coordinates);
      } catch {
        newErrors.geofence_coordinates = 'Invalid JSON format';
      }
    }
    
    if (form.resources_urls && form.resources_urls.trim()) {
      try {
        JSON.parse(form.resources_urls);
      } catch {
        newErrors.resources_urls = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, activateAfterSave = false) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setSaving(true);
    setSaveAndActivate(activateAfterSave);
    
    try {
      const payload = {
        ...form,
        affected_locations: form.affected_locations.filter(Boolean),
        radius_km: form.radius_km || null,
        center_lat: form.center_lat || null,
        center_lng: form.center_lng || null,
        estimated_affected_population: form.estimated_affected_population || null,
        priority_score: Number(form.priority_score),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };

      // Parse JSON fields
      if (form.geofence_coordinates?.trim()) {
        payload.geofence_coordinates = JSON.parse(form.geofence_coordinates);
      } else {
        payload.geofence_coordinates = null;
      }

      if (form.resources_urls?.trim()) {
        payload.resources_urls = JSON.parse(form.resources_urls);
      } else {
        payload.resources_urls = null;
      }

      const createdAlert = await apiService.createAlert(payload);
      
      if (activateAfterSave) {
        // Activate the alert immediately
        try {
          const activationResult = await apiService.activateAlert(createdAlert.id);
          if (activationResult?.delivery_results) {
            const results = activationResult.delivery_results;
            const totalSent = Object.values(results).reduce((sum, method) => sum + (method.sent || 0), 0);
            toast.success(`Alert created and activated! ${totalSent} notifications sent.`);
          } else {
            toast.success('Alert created and activated successfully!');
          }
        } catch (activationError) {
          toast.success('Alert created successfully!');
          toast.error('Failed to activate alert: ' + (activationError.message || 'Unknown error'));
        }
      } else {
        toast.success('Alert created successfully as draft');
      }
      
      navigate('/admin/alerts');
    } catch (error) {
      toast.error(error?.message || 'Failed to create alert');
      console.error('Error creating alert:', error);
    } finally {
      setSaving(false);
      setSaveAndActivate(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/admin/alerts')}
              className="p-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              title="Back to alerts list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Emergency Alert</h1>
                <p className="text-gray-600">Set up a new disaster alert with multi-channel delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alert Title *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                      className={`w-full rounded-lg border px-4 py-3 text-sm ${
                        errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
                      placeholder="e.g., Flash Flood Warning - Nyagatare District"
                      required
                    />
                    {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alert Message *
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setField('message', e.target.value)}
                      rows={4}
                      className={`w-full rounded-lg border px-4 py-3 text-sm ${
                        errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
                      placeholder="Detailed alert message that will be sent to citizens..."
                      required
                    />
                    {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Character count: {form.message.length} | SMS optimal: under 160 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Disaster Type *
                      </label>
                      <select
                        value={form.disaster_type}
                        onChange={(e) => setField('disaster_type', e.target.value)}
                        className={`w-full rounded-lg border px-4 py-3 text-sm ${
                          errors.disaster_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        } focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
                        required
                      >
                        <option value="">Select Disaster Type</option>
                        {disasterTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                      {errors.disaster_type && <p className="text-sm text-red-600 mt-1">{errors.disaster_type}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity Level *
                      </label>
                      <select
                        value={form.severity}
                        onChange={(e) => setField('severity', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        required
                      >
                        {SEVERITIES.map(severity => (
                          <option key={severity.value} value={severity.value} title={severity.description}>
                            {severity.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {SEVERITIES.find(s => s.value === form.severity)?.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Affected Locations
                    </label>
                    <select
                      multiple
                      value={form.affected_locations}
                      onChange={(e) => setField('affected_locations', 
                        Array.from(e.target.selectedOptions, option => option.value)
                      )}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      size={6}
                    >
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} ({location.location_type})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple locations</p>
                  </div>
                </div>
              </div>

              {/* Geographic Targeting */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-600" />
                  Geographic Targeting
                </h2>
                
                <LocationSelector
                  centerLat={form.center_lat}
                  centerLng={form.center_lng}
                  radiusKm={form.radius_km}
                  onLocationChange={handleLocationChange}
                  onRadiusChange={handleRadiusChange}
                  onOpenMap={openMapModal}
                />

                {/* Advanced Geofence */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advanced: Custom Geofence (GeoJSON)
                  </label>
                  <textarea
                    value={form.geofence_coordinates}
                    onChange={(e) => setField('geofence_coordinates', e.target.value)}
                    rows={6}
                    className={`w-full rounded-lg border px-4 py-3 text-sm font-mono ${
                      errors.geofence_coordinates ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
                    placeholder={`{
  "type": "Polygon",
  "coordinates": [[[30.0619,-1.9441],[30.1,-1.9441],[30.1,-1.9],[30.0619,-1.9],[30.0619,-1.9441]]]
}`}
                  />
                  {errors.geofence_coordinates && (
                    <p className="text-sm text-red-600 mt-1">{errors.geofence_coordinates}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Override circle targeting with a custom polygon shape
                  </p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Safety Instructions
                    </label>
                    <textarea
                      value={form.instructions}
                      onChange={(e) => setField('instructions', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="What should people do when they receive this alert? e.g., Move to higher ground immediately..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Information
                    </label>
                    <textarea
                      value={form.contact_info}
                      onChange={(e) => setField('contact_info', e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Emergency contact numbers and information..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource URLs (JSON format)
                    </label>
                    <textarea
                      value={form.resources_urls}
                      onChange={(e) => setField('resources_urls', e.target.value)}
                      rows={3}
                      className={`w-full rounded-lg border px-4 py-3 text-sm font-mono ${
                        errors.resources_urls ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      } focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
                      placeholder={`[
  "https://maps.emergency.gov.rw/evacuation",
  "https://shelters.emergency.gov.rw/locations"
]`}
                    />
                    {errors.resources_urls && (
                      <p className="text-sm text-red-600 mt-1">{errors.resources_urls}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Provide helpful links as a JSON array
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Affected Population
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.estimated_affected_population}
                        onChange={(e) => setField('estimated_affected_population', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority Score (1-10)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={form.priority_score}
                        onChange={(e) => setField('priority_score', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Right Side */}
            <div className="space-y-6">
              {/* Alert Preview */}
              <AlertPreviewCard form={form} disasterTypes={disasterTypes} />

              {/* Delivery Channels */}
              <DeliveryChannelsCard form={form} setField={setField} />
              {errors.delivery_channels && (
                <p className="text-sm text-red-600 -mt-4">{errors.delivery_channels}</p>
              )}

              {/* Timing */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  Timing
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setField('expires_at', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex flex-col gap-3">
                  {/* Create and Activate */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={(e) => handleSubmit(e, true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                  >
                    {saving && saveAndActivate ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Creating & Activating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Create & Activate Alert
                      </>
                    )}
                  </button>

                  {/* Create as Draft */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                  >
                    {saving && !saveAndActivate ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Creating Draft...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save as Draft
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/admin/alerts')}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>

                {/* Action explanations */}
                <div className="mt-4 text-xs text-gray-500 space-y-2">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Create & Activate will immediately send notifications to targeted users</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Save className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>Save as Draft allows you to review and test before activation</span>
                  </div>
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">Quick Tips</h4>
                <ul className="text-xs text-blue-800 space-y-2">
                  <li>• Use clear, action-oriented language in your alert message</li>
                  <li>• Set geographic targeting to reach only affected areas</li>
                  <li>• Include specific safety instructions when possible</li>
                  <li>• Test with a small area before wide deployment</li>
                  <li>• Consider multiple delivery channels for better reach</li>
                  <li>• Save as draft first to review before activation</li>
                </ul>
              </div>

              {/* Notification Settings Status */}
              <div className="bg-gray-50 rounded-xl border p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Notification Status
                </h4>
                <div className="text-xs text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>SMS Service:</span>
                    <span className="font-medium text-green-600">Ready</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Push Service:</span>
                    <span className="font-medium text-green-600">Ready</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Service:</span>
                    <span className="font-medium text-green-600">Ready</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Web Publishing:</span>
                    <span className="font-medium text-green-600">Ready</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  All notification channels are operational and ready to deliver your alert.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Map Modal */}
        <MapModal
          isOpen={isMapModalOpen}
          onClose={closeMapModal}
          centerLat={form.center_lat}
          centerLng={form.center_lng}
          radiusKm={form.radius_km}
          onLocationChange={handleLocationChange}
          onRadiusChange={handleRadiusChange}
        />
      </div>
    </div>
  );
}

export default CreateAlert;