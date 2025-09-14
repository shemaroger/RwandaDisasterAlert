// src/pages/alerts/EditAlert.jsx - Enhanced version with fixes
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, AlertTriangle, Target, Radio, Clock, Mail, Globe, 
  MessageSquare, MapPin, X, Plus, Minus, Loader, RotateCcw, XCircle,
  TrendingUp, Bell, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import MapModal from '../../components/MapModal'; // Import the modal

// Enhanced Location Selector Component - Fixed
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

  // Convert to numbers and validate
  const lat = parseFloat(centerLat);
  const lng = parseFloat(centerLng);
  const hasValidLocation = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <button
          type="button"
          onClick={onOpenMap}
          className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="bg-red-100 p-4 rounded-full group-hover:bg-red-200 transition-colors">
              <MapPin className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {hasValidLocation ? 'Update Target Location' : 'Set Target Location'}
              </h3>
              <p className="text-sm text-gray-600">
                {hasValidLocation ? 
                  'Click to modify your alert target area' : 
                  'Click to open interactive map and select target area'
                }
              </p>
            </div>
          </div>
        </button>
      </div>

      {hasValidLocation && (
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
              <p className="font-mono text-green-800">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
            </div>
            <div>
              <span className="text-green-700 font-medium">Coverage:</span>
              <p className="text-green-800">
                {radiusKm}km radius (~{(Math.PI * radiusKm * radiusKm).toFixed(1)} km²)
              </p>
            </div>
          </div>
        </div>
      )}

      {hasValidLocation && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Radius Adjustment
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRadiusChange(1)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                radiusKm === 1 ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              1km
            </button>
            <button
              type="button"
              onClick={() => onRadiusChange(5)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                radiusKm === 5 ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              5km
            </button>
            <button
              type="button"
              onClick={() => onRadiusChange(10)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                radiusKm === 10 ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              10km
            </button>
            <button
              type="button"
              onClick={() => onRadiusChange(20)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                radiusKm === 20 ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              20km
            </button>
          </div>
        </div>
      )}
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

// Enhanced Alert Actions Component
const AlertActionsCard = ({ alert, onResendNotifications, onCancelAlert, onActivateAlert }) => {
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  const fetchDeliveryDetails = async () => {
    if (!alert?.id) return;
    
    setLoadingDelivery(true);
    try {
      const details = await apiService.getAlertDeliveryStatus(alert.id);
      setDeliveryDetails(details);
    } catch (error) {
      console.error('Failed to fetch delivery details:', error);
    } finally {
      setLoadingDelivery(false);
    }
  };

  useEffect(() => {
    if (alert?.status === 'active') {
      fetchDeliveryDetails();
    }
  }, [alert]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-red-600" />
        Alert Actions
      </h3>
      
      {/* Alert Status */}
      <div className="mb-4">
        <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
          alert.status === 'active' ? 'bg-green-100 text-green-800' :
          alert.status === 'draft' ? 'bg-gray-100 text-gray-800' :
          alert.status === 'expired' ? 'bg-red-100 text-red-800' :
          alert.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          Status: {alert.status?.charAt(0).toUpperCase() + alert.status?.slice(1)}
        </div>
      </div>

      {/* Delivery Stats for Active Alerts */}
      {alert.status === 'active' && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900">Delivery Status</h4>
            {loadingDelivery && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            )}
          </div>
          
          {deliveryDetails ? (
            <div className="text-sm text-blue-800 space-y-1">
              <div>Total Recipients: {deliveryDetails.total_target_users || 0}</div>
              <div>Overall Success Rate: {deliveryDetails.stats_by_method?.sms?.success_rate || 0}%</div>
              <div className="text-xs text-blue-600 mt-2">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="text-sm text-blue-800">Loading delivery statistics...</div>
          )}
          
          <button
            onClick={fetchDeliveryDetails}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh Stats
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {alert.status === 'draft' && (
          <button
            onClick={() => {
              if (window.confirm('Activate this alert? This will send notifications to all targeted users.')) {
                onActivateAlert(alert.id);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Activate Alert
          </button>
        )}

        {alert.status === 'active' && (
          <>
            <button
              onClick={() => {
                if (window.confirm('Resend failed notifications? This will retry all failed deliveries.')) {
                  onResendNotifications(alert.id);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Resend Failed Notifications
            </button>

            <button
              onClick={() => {
                if (window.confirm('Cancel this alert? This will stop all further notifications and mark the alert as cancelled.')) {
                  onCancelAlert(alert.id);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <XCircle className="w-4 h-4" />
              Cancel Alert
            </button>
          </>
        )}

        <button
          onClick={fetchDeliveryDetails}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <TrendingUp className="w-4 h-4" />
          View Delivery Statistics
        </button>
      </div>

      {/* Warning for non-draft alerts */}
      {alert.status !== 'draft' && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            Changes to {alert.status} alerts will be saved but may require reactivation to take effect for new notifications.
          </p>
        </div>
      )}
    </div>
  );
};

// Main EditAlert Component
export function EditAlert() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
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

  const openMapModal = () => {
    setIsMapModalOpen(true);
  };

  const closeMapModal = () => {
    setIsMapModalOpen(false);
  };

  // Enhanced notification functions
  const handleResendNotifications = async (alertId) => {
    try {
      const result = await apiService.resendFailedNotifications(alertId);
      toast.success('Failed notifications have been queued for resending');
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleCancelAlert = async (alertId) => {
    try {
      const result = await apiService.cancelAlert(alertId);
      setAlert(prev => ({ ...prev, status: 'cancelled' }));
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleActivateAlert = async (alertId) => {
    try {
      const result = await apiService.activateAlert(alertId);
      setAlert(prev => ({ ...prev, status: 'active', issued_at: new Date().toISOString() }));
      toast.success('Alert activated successfully!');
      return result;
    } catch (error) {
      toast.error('Failed to activate alert');
      throw error;
    }
  };

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

      const updatedAlert = await apiService.updateAlert(id, payload);
      setAlert(updatedAlert);
      toast.success('Alert updated successfully');
      
      // If user wants to stay on edit page, don't navigate
      // navigate('/admin/alerts');
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
                      placeholder="What should people do when they receive this alert?"
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
              {/* Alert Actions */}
              <AlertActionsCard
                alert={alert}
                onResendNotifications={handleResendNotifications}
                onCancelAlert={handleCancelAlert}
                onActivateAlert={handleActivateAlert}
              />

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

              {/* Save Actions */}
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
                    Back to Alerts
                  </button>
                </div>
              </div>

              {/* Alert Information */}
              <div className="bg-gray-50 rounded-xl border p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Alert Information</h4>
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
                    <span className="font-medium font-mono text-xs">{alert.id}</span>
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
                <h4 className="text-sm font-semibold text-yellow-900 mb-3">Edit Tips</h4>
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

export default EditAlert;