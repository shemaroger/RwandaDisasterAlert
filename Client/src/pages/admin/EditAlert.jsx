// src/pages/alerts/EditAlert.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, AlertTriangle, Target, Radio, Clock, Mail, Globe, 
  MessageSquare, MapPin, X, Plus, Minus, Loader
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

// Map Location Selector Component (same as CreateAlert)
const MapLocationSelector = ({ 
  centerLat, 
  centerLng, 
  radiusKm, 
  onLocationChange, 
  onRadiusChange,
  className = ""
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [circle, setCircle] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || map) return;

    const loadLeaflet = async () => {
      if (!window.L) {
        // Create leaflet CSS link
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      const L = window.L;
      
      // Default to Rwanda center if no coordinates provided
      const defaultLat = centerLat || -1.9441;
      const defaultLng = centerLng || 30.0619;
      const defaultZoom = centerLat && centerLng ? 12 : 8;

      const mapInstance = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      // Add click handler
      mapInstance.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onLocationChange(lat, lng);
      });

      setMap(mapInstance);
      setIsMapReady(true);
    };

    loadLeaflet();

    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Update marker and circle when coordinates change
  useEffect(() => {
    if (!map || !isMapReady || !window.L) return;

    const L = window.L;

    // Remove existing marker and circle
    if (marker) {
      map.removeLayer(marker);
    }
    if (circle) {
      map.removeLayer(circle);
    }

    // Add new marker and circle if coordinates exist
    if (centerLat && centerLng) {
      const newMarker = L.marker([centerLat, centerLng], {
        draggable: true
      }).addTo(map);

      newMarker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        onLocationChange(lat, lng);
      });

      setMarker(newMarker);

      // Add circle if radius is specified
      if (radiusKm > 0) {
        const newCircle = L.circle([centerLat, centerLng], {
          color: '#ef4444',
          fillColor: '#fca5a5',
          fillOpacity: 0.2,
          radius: radiusKm * 1000 // Convert km to meters
        }).addTo(map);

        setCircle(newCircle);
      }

      // Center map on the marker
      map.setView([centerLat, centerLng], map.getZoom());
    }
  }, [map, isMapReady, centerLat, centerLng, radiusKm, onLocationChange]);

  const adjustRadius = (delta) => {
    const newRadius = Math.max(0.1, (radiusKm || 1) + delta);
    onRadiusChange(newRadius);
  };

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Click map to set location</span>
        </div>
        {centerLat && centerLng && (
          <button
            type="button"
            onClick={() => onLocationChange(null, null)}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-lg border border-gray-300 bg-gray-100"
        style={{ minHeight: '256px' }}
      />

      {/* Controls */}
      <div className="mt-3 space-y-3">
        {centerLat && centerLng && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{centerLat.toFixed(6)}, {centerLng.toFixed(6)}</span>
          </div>
        )}

        {/* Radius control */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 font-medium min-w-fit">Radius (km):</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustRadius(-0.5)}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              disabled={!radiusKm || radiusKm <= 0.5}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={radiusKm || ''}
              onChange={(e) => onRadiusChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="5.0"
            />
            <button
              type="button"
              onClick={() => adjustRadius(0.5)}
              className="p-2 rounded-lg border hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {centerLat && centerLng && radiusKm && (
          <div className="text-sm text-gray-500">
            Coverage area: ~{(Math.PI * radiusKm * radiusKm).toFixed(1)} km²
          </div>
        )}
      </div>
    </div>
  );
};

// Constants
const SEVERITIES = [
  { value: 'info', label: 'Information' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
  { value: 'extreme', label: 'Extreme' }
];

// Main EditAlert Component
export function EditAlert() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [alert, setAlert] = useState(null);
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

  // Load data and populate form
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        toast.error('Alert ID not provided');
        navigate('/admin/alerts');
        return;
      }

      setLoading(true);
      try {
        const [alertRes, disasterTypesRes, locationsRes] = await Promise.all([
          apiService.getAlert(id),
          apiService.getDisasterTypes({ page_size: 1000 }),
          apiService.getLocations({ page_size: 1000 })
        ]);
        
        if (!alertRes) {
          toast.error('Alert not found');
          navigate('/admin/alerts');
          return;
        }

        setAlert(alertRes);
        setDisasterTypes(disasterTypesRes?.results || disasterTypesRes || []);
        setLocations(locationsRes?.results || locationsRes || []);
        
        // Populate form with existing alert data
        setForm({
          title: alertRes.title || '',
          title_rw: alertRes.title_rw || '',
          title_fr: alertRes.title_fr || '',
          message: alertRes.message || '',
          message_rw: alertRes.message_rw || '',
          message_fr: alertRes.message_fr || '',
          disaster_type: alertRes.disaster_type || '',
          severity: alertRes.severity || 'info',
          affected_locations: Array.isArray(alertRes.affected_locations) ? alertRes.affected_locations : [],
          geofence_coordinates: alertRes.geofence_coordinates ? 
            (typeof alertRes.geofence_coordinates === 'string' ? 
              alertRes.geofence_coordinates : 
              JSON.stringify(alertRes.geofence_coordinates, null, 2)) : '',
          radius_km: alertRes.radius_km || 5,
          center_lat: alertRes.center_lat || '',
          center_lng: alertRes.center_lng || '',
          expires_at: alertRes.expires_at ? 
            (alertRes.expires_at.includes('T') ? 
              alertRes.expires_at.slice(0, 16) : 
              alertRes.expires_at) : '',
          send_sms: alertRes.send_sms !== undefined ? !!alertRes.send_sms : true,
          send_push: alertRes.send_push !== undefined ? !!alertRes.send_push : true,
          send_email: alertRes.send_email !== undefined ? !!alertRes.send_email : false,
          publish_web: alertRes.publish_web !== undefined ? !!alertRes.publish_web : true,
          instructions: alertRes.instructions || '',
          instructions_rw: alertRes.instructions_rw || '',
          instructions_fr: alertRes.instructions_fr || '',
          contact_info: alertRes.contact_info || '',
          resources_urls: alertRes.resources_urls ? 
            (typeof alertRes.resources_urls === 'string' ? 
              alertRes.resources_urls : 
              JSON.stringify(alertRes.resources_urls, null, 2)) : '',
          estimated_affected_population: alertRes.estimated_affected_population || '',
          priority_score: alertRes.priority_score || 5,
        });

      } catch (error) {
        console.error('Error loading alert data:', error);
        toast.error('Failed to load alert data');
        navigate('/admin/alerts');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    if (!form.disaster_type) newErrors.disaster_type = 'Disaster type is required';
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setSaving(true);
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

      await apiService.updateAlert(id, payload);
      toast.success('Alert updated successfully');
      navigate('/admin/alerts');
    } catch (error) {
      toast.error(error?.message || 'Failed to update alert');
      console.error('Error updating alert:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alert data...</p>
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg">Alert not found</p>
          <p className="text-gray-500 text-sm mt-1">
            The alert you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/admin/alerts')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Alerts
          </button>
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Alert</h1>
                <p className="text-gray-600">Modify emergency alert settings and targeting</p>
              </div>
            </div>
          </div>

          {/* Alert Status Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              alert.status === 'active' ? 'bg-green-100 text-green-800' :
              alert.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              alert.status === 'expired' ? 'bg-red-100 text-red-800' :
              alert.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              Status: {alert.status?.charAt(0).toUpperCase() + alert.status?.slice(1)}
            </div>
            {alert.status !== 'draft' && (
              <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                ⚠️ Changes to non-draft alerts may require reactivation
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Disaster Type *
                      </label>
                      <select
                        value={form.disaster_type}
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
              {/* Delivery Channels */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-red-600" />
                  Delivery Channels
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.send_sms}
                      onChange={(e) => setField('send_sms', e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">SMS Messages</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.send_push}
                      onChange={(e) => setField('send_push', e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Push Notifications</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.send_email}
                      onChange={(e) => setField('send_email', e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Email Alerts</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.publish_web}
                      onChange={(e) => setField('publish_web', e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Publish to Web</span>
                    </div>
                  </label>
                </div>
              </div>

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
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Updating Alert...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Alert
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/admin/alerts')}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Alert Information */}
              <div className="bg-gray-50 rounded-xl border p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">📊 Alert Information</h4>
                <div className="text-xs text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium">
                      {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Modified:</span>
                    <span className="font-medium">
                      {alert.updated_at ? new Date(alert.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alert ID:</span>
                    <span className="font-medium font-mono">{alert.id}</span>
                  </div>
                  {alert.issued_at && (
                    <div className="flex justify-between">
                      <span>Issued:</span>
                      <span className="font-medium">
                        {new Date(alert.issued_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Tips */}
              <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
                <h4 className="text-sm font-semibold text-yellow-900 mb-3">💡 Edit Tips</h4>
                <ul className="text-xs text-yellow-800 space-y-2">
                  <li>• Changes to active alerts may require reactivation</li>
                  <li>• Test geographic targeting before updating</li>
                  <li>• Review delivery channels for any changes</li>
                  <li>• Consider impact on ongoing operations</li>
                  <li>• Save frequently to avoid losing changes</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAlert;