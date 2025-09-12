// src/pages/alerts/CreateAlert.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, AlertTriangle, Target, Radio, Clock, Mail, Globe, 
  MessageSquare, MapPin, X, Plus, Minus
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

// Map Location Selector Component
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
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || map) return;

    let mounted = true;

    const loadLeaflet = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        // Check if Leaflet is already loaded
        if (window.L) {
          initMap();
          return;
        }

        // Load CSS first
        const cssPromise = new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.onload = resolve;
          link.onerror = () => reject(new Error('Failed to load Leaflet CSS'));
          document.head.appendChild(link);
        });

        // Load JS
        const jsPromise = new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Leaflet JS'));
          document.head.appendChild(script);
        });

        // Wait for both to load
        await Promise.all([cssPromise, jsPromise]);
        
        // Small delay to ensure everything is ready
        setTimeout(() => {
          if (mounted && window.L) {
            initMap();
          }
        }, 200);

      } catch (error) {
        console.error('Error loading Leaflet:', error);
        if (mounted) {
          setMapError(error.message || 'Failed to load map library');
          setIsLoading(false);
        }
      }
    };

    const initMap = () => {
      try {
        if (!window.L || !mapRef.current || !mounted) return;

        const L = window.L;
        
        // Default to Rwanda center
        const defaultLat = centerLat || -1.9441;
        const defaultLng = centerLng || 30.0619;
        const defaultZoom = centerLat && centerLng ? 12 : 8;

        // Create map instance
        const mapInstance = L.map(mapRef.current, {
          preferCanvas: true // Better performance
        }).setView([defaultLat, defaultLng], defaultZoom);

        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk1hcCBUaWxlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='
        });

        tileLayer.addTo(mapInstance);

        // Add click handler
        mapInstance.on('click', (e) => {
          if (mounted) {
            const { lat, lng } = e.latlng;
            onLocationChange(lat, lng);
          }
        });

        // Handle tile loading errors
        tileLayer.on('tileerror', (error) => {
          console.warn('Tile loading error:', error);
        });

        // Force resize after a short delay
        setTimeout(() => {
          if (mounted && mapInstance) {
            mapInstance.invalidateSize();
          }
        }, 300);

        if (mounted) {
          setMap(mapInstance);
          setIsMapReady(true);
          setIsLoading(false);
          setMapError(null);
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        if (mounted) {
          setMapError('Failed to initialize map: ' + error.message);
          setIsLoading(false);
        }
      }
    };

    loadLeaflet();

    return () => {
      mounted = false;
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        setMap(null);
        setIsMapReady(false);
      }
    };
  }, []); // No dependencies to prevent re-initialization

  // Update markers when coordinates change
  useEffect(() => {
    if (!map || !isMapReady || !window.L) return;

    const L = window.L;

    try {
      // Clean up existing layers
      if (marker) {
        map.removeLayer(marker);
        setMarker(null);
      }
      if (circle) {
        map.removeLayer(circle);
        setCircle(null);
      }

      // Add new marker if coordinates exist
      if (centerLat && centerLng && typeof centerLat === 'number' && typeof centerLng === 'number') {
        const newMarker = L.marker([centerLat, centerLng], {
          draggable: true
        }).addTo(map);

        newMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationChange(lat, lng);
        });

        setMarker(newMarker);

        // Add circle if radius exists
        if (radiusKm > 0) {
          const newCircle = L.circle([centerLat, centerLng], {
            color: '#ef4444',
            fillColor: '#fca5a5',
            fillOpacity: 0.2,
            weight: 2,
            radius: radiusKm * 1000
          }).addTo(map);

          setCircle(newCircle);
        }

        // Pan to location
        map.setView([centerLat, centerLng], map.getZoom());
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [map, isMapReady, centerLat, centerLng, radiusKm, onLocationChange]);

  const adjustRadius = (delta) => {
    const newRadius = Math.max(0.1, Math.min(100, (radiusKm || 1) + delta));
    onRadiusChange(newRadius);
  };

  const handleClearLocation = () => {
    onLocationChange(null, null);
  };

  // Fallback map using simple coordinate input
  const renderFallbackMap = () => (
    <div className="w-full border border-gray-300 rounded-lg p-6 bg-gray-50">
      <div className="text-center mb-4">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <h3 className="text-sm font-medium text-gray-700 mb-1">Map Unavailable</h3>
        <p className="text-xs text-gray-500">Enter coordinates manually</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={centerLat || ''}
            onChange={(e) => onLocationChange(parseFloat(e.target.value) || null, centerLng)}
            placeholder="-1.9441"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={centerLng || ''}
            onChange={(e) => onLocationChange(centerLat, parseFloat(e.target.value) || null)}
            placeholder="30.0619"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>
      
      {centerLat && centerLng && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleClearLocation}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Clear coordinates
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {mapError ? 'Set coordinates manually' : 'Click map to set location'}
          </span>
        </div>
        {centerLat && centerLng && (
          <button
            type="button"
            onClick={handleClearLocation}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Map container or fallback */}
      <div className="relative">
        {mapError ? (
          renderFallbackMap()
        ) : (
          <>
            <div 
              ref={mapRef} 
              className="w-full h-64 rounded-lg border border-gray-300 bg-gray-100"
              style={{ 
                minHeight: '256px',
                height: '256px'
              }}
            />
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading map...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-3">
        {centerLat && centerLng && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <MapPin className="w-4 h-4" />
            <span className="font-mono">{centerLat.toFixed(6)}, {centerLng.toFixed(6)}</span>
          </div>
        )}

        {/* Radius control */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 font-medium min-w-fit">Radius (km):</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustRadius(-0.5)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              disabled={!radiusKm || radiusKm <= 0.5}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              value={radiusKm || ''}
              onChange={(e) => onRadiusChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="5.0"
            />
            <button
              type="button"
              onClick={() => adjustRadius(0.5)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {centerLat && centerLng && radiusKm && (
          <div className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
            <span className="font-medium">Coverage area:</span> ~{(Math.PI * radiusKm * radiusKm).toFixed(1)} km²
          </div>
        )}

        {!mapError && (!centerLat || !centerLng) && (
          <div className="text-xs text-gray-500 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
            Click anywhere on the map to set the target location for your alert
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

// Main CreateAlert Component
export function CreateAlert() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
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

      await apiService.createAlert(payload);
      toast.success('Alert created successfully');
      navigate('/admin/alerts');
    } catch (error) {
      toast.error(error?.message || 'Failed to create alert');
      console.error('Error creating alert:', error);
    } finally {
      setSaving(false);
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
                <p className="text-gray-600">Set up a new disaster alert with geographic targeting</p>
              </div>
            </div>
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
                          <option key={severity.value} value={severity.value}>
                            {severity.label}
                          </option>
                        ))}
                      </select>
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
                
                <MapLocationSelector
                  centerLat={form.center_lat}
                  centerLng={form.center_lng}
                  radiusKm={form.radius_km}
                  onLocationChange={handleLocationChange}
                  onRadiusChange={handleRadiusChange}
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
                        Creating Alert...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Create Alert
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

              {/* Help Section */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">💡 Quick Tips</h4>
                <ul className="text-xs text-blue-800 space-y-2">
                  <li>• Use clear, action-oriented language in your alert message</li>
                  <li>• Set geographic targeting to reach only affected areas</li>
                  <li>• Include specific safety instructions when possible</li>
                  <li>• Test with a small area before wide deployment</li>
                  <li>• Consider multiple delivery channels for better reach</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAlert;