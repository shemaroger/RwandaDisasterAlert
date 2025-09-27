// src/pages/alerts/ActiveAlertsPage.jsx
import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Search, RefreshCw, Eye, MapPin, Radio, Users, Clock,
  RotateCcw, XCircle, TrendingUp, Bell, Activity, Globe, Zap, AlertCircle,
  CheckCircle2, X, Timer, Target
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Utility functions
const formatDateTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const formatTimeAgo = (iso) => {
  if (!iso) return '—';
  try {
    const now = new Date();
    const time = new Date(iso);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  } catch { return iso; }
};

const formatTimeRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  try {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  } catch { return null; }
};

const formatCoordinate = (coord) => {
  if (!coord) return '';
  const num = parseFloat(coord);
  return isNaN(num) ? coord : num.toFixed(3);
};

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// Map Component for Geographic Targeting
function GeographicMap({ alert, isOpen, onClose }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !alert || !alert.center_lat || !alert.center_lng) return;

    // Initialize map when modal opens
    const initMap = () => {
      if (!window.L || mapInstanceRef.current) return;

      const lat = parseFloat(alert.center_lat);
      const lng = parseFloat(alert.center_lng);
      const radius = parseFloat(alert.radius_km) || 5;

      // Create map centered on alert location
      const map = window.L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 12,
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: true
      });

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Add alert center marker
      const alertIcon = window.L.divIcon({
        html: `<div style="
          background: #dc2626; 
          border: 3px solid white; 
          border-radius: 50%; 
          width: 20px; 
          height: 20px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
          }
        </style>`,
        className: 'alert-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = window.L.marker([lat, lng], { icon: alertIcon }).addTo(map);
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${alert.title}</strong><br>
          <span style="color: #666;">${alert.disaster_type_name}</span><br>
          <span style="color: #dc2626; font-weight: bold;">${alert.severity.toUpperCase()}</span>
        </div>
      `);

      // Add radius circle
      const circle = window.L.circle([lat, lng], {
        color: '#dc2626',
        fillColor: '#fee2e2',
        fillOpacity: 0.3,
        weight: 2,
        radius: radius * 1000 // Convert km to meters
      }).addTo(map);

      // Add radius label
      const radiusPopup = window.L.popup({
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: 'radius-popup'
      })
      .setLatLng([lat, lng])
      .setContent(`<div style="text-align: center; font-size: 12px; color: #374151;">
        <strong>Alert Radius</strong><br>
        ${radius}km coverage area
      </div>`)
      .openOn(map);

      // Fit map to show entire circle with padding
      const bounds = circle.getBounds();
      map.fitBounds(bounds, { padding: [20, 20] });

      mapInstanceRef.current = map;

      // Add scale and attribution
      window.L.control.scale({ position: 'bottomleft' }).addTo(map);
    };

    // Load Leaflet if not already loaded
    if (!window.L) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletJS = document.createElement('script');
      leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletJS.onload = initMap;
      document.head.appendChild(leafletJS);
    } else {
      initMap();
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, alert]);

  if (!isOpen || !alert || !alert.center_lat || !alert.center_lng) return null;

  const radius = parseFloat(alert.radius_km) || 5;
  const area = (Math.PI * radius * radius).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Map className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Geographic Targeting</h2>
              <div className="text-sm text-gray-600">
                {alert.title} • {radius}km radius • {area} km² coverage
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 bg-blue-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-blue-600 mb-1">Center Point</div>
              <div className="text-sm font-medium">
                {formatCoordinate(alert.center_lat)}, {formatCoordinate(alert.center_lng)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-blue-600 mb-1">Coverage Radius</div>
              <div className="text-sm font-medium">{radius} kilometers</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-blue-600 mb-1">Total Area</div>
              <div className="text-sm font-medium">{area} km²</div>
            </div>
          </div>
        </div>

        <div className="relative" style={{ height: '500px' }}>
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />
          
          {/* Map Legend */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span>Alert Center</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-200 border border-red-600 rounded-sm"></div>
                <span>Coverage Area</span>
              </div>
            </div>
          </div>

          {/* Loading overlay */}
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center" id="map-loading">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading map...</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Interactive map showing alert coverage area and affected region
            </div>
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Alert Card Component
function ActiveAlertCard({ alert, onViewDetails, onResendNotifications, onCancelAlert, canManageAlerts, onShowMap }) {
  const [deliveryStats, setDeliveryStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchDeliveryStats = useCallback(async () => {
    // Only fetch delivery stats for admin users
    if (!alert.id || !canManageAlerts) return;
    
    setLoadingStats(true);
    try {
      const stats = await apiService.getAlertDeliveryStatus(alert.id);
      setDeliveryStats(stats);
    } catch (error) {
      console.error('Failed to fetch delivery stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [alert.id, canManageAlerts]);

  useEffect(() => {
    if (alert.status === 'active' && canManageAlerts) {
      fetchDeliveryStats();
    }
  }, [alert.status, fetchDeliveryStats, canManageAlerts]);

  const timeRemaining = formatTimeRemaining(alert.expires_at);
  const isNearExpiry = timeRemaining && timeRemaining.includes('h left') && parseInt(timeRemaining) < 6;

  const handleResendNotifications = async () => {
    if (window.confirm('Resend failed notifications for this alert?')) {
      await onResendNotifications(alert.id);
      await fetchDeliveryStats();
    }
  };

  const handleCancelAlert = async () => {
    if (window.confirm('Are you sure you want to cancel this alert? This action cannot be undone.')) {
      await onCancelAlert(alert.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${
                alert.severity === 'extreme' ? 'bg-red-100 text-red-600' :
                alert.severity === 'severe' ? 'bg-orange-100 text-orange-600' :
                alert.severity === 'moderate' ? 'bg-yellow-100 text-yellow-600' :
                alert.severity === 'minor' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{alert.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span>{alert.disaster_type_name}</span>
                  <span>•</span>
                  <span className={`capitalize font-medium ${
                    alert.severity === 'extreme' ? 'text-red-600' :
                    alert.severity === 'severe' ? 'text-orange-600' :
                    alert.severity === 'moderate' ? 'text-yellow-600' :
                    alert.severity === 'minor' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>{alert.severity}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status and Time */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Active
              </div>
              {timeRemaining && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  isNearExpiry ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  <Timer className="w-3 h-3" />
                  {timeRemaining}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Issued {formatTimeAgo(alert.issued_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Message */}
      <div className="px-6 py-4">
        <p className="text-gray-800 line-clamp-3">{alert.message}</p>
      </div>

      {/* Delivery Channels and Stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Delivery Channels */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Radio className="w-4 h-4 mr-1" /> Delivery Channels
            </h4>
            <div className="flex gap-2">
              {alert.send_sms && (
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Bell className="w-3 h-3" /> SMS
                </div>
              )}
              {alert.send_push && (
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Push
                </div>
              )}
              {alert.send_email && (
                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Radio className="w-3 h-3" /> Email
                </div>
              )}
              {alert.publish_web && (
                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Web
                </div>
              )}
            </div>
          </div>

          {/* Delivery Stats */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
              <span className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> Delivery Stats
              </span>
              {loadingStats && canManageAlerts && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400" />
              )}
            </h4>
            {canManageAlerts ? (
              deliveryStats ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Total Recipients:</span>
                    <span className="font-medium">{deliveryStats.total_target_users || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">
                      {deliveryStats.stats_by_method?.sms?.success_rate || 0}%
                    </span>
                  </div>
                  {Object.entries(deliveryStats.stats_by_method || {}).map(([method, stats]) => (
                    <div key={method} className="flex justify-between text-xs text-gray-600">
                      <span className="capitalize">{method}:</span>
                      <span>{stats.sent || 0}/{stats.total || 0}</span>
                    </div>
                  ))}
                </div>
              ) : alert.delivery_stats ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Total:</span>
                    <span className="font-medium">{alert.delivery_stats.total || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">
                      {alert.delivery_stats.delivery_rate || 0}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Loading stats...</div>
              )
            ) : (
              <div className="text-xs text-gray-500 italic">
                Delivery statistics available to administrators only
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Geographic Targeting */}
      {(alert.center_lat || alert.center_lng || alert.radius_km) && (
        <div className="px-6 py-3 bg-blue-50 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-blue-800">
              <Target className="w-4 h-4 mr-2" />
              Geographic Targeting Active
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-blue-600">
                {formatCoordinate(alert.center_lat)}, {formatCoordinate(alert.center_lng)} 
                {alert.radius_km && ` (${alert.radius_km}km radius)`}
              </div>
              {alert.center_lat && alert.center_lng && (
                <button
                  onClick={() => onShowMap(alert)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  <Map className="w-3 h-3" />
                  View Map
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Response Stats */}
      {alert.response_stats && Object.values(alert.response_stats).some(val => val > 0) && (
        <div className="px-6 py-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Users className="w-4 h-4 mr-1" /> Citizen Responses
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-green-700">
                {alert.response_stats.safe || 0}
              </div>
              <div className="text-xs text-green-600">Safe</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-yellow-700">
                {alert.response_stats.need_help || 0}
              </div>
              <div className="text-xs text-yellow-600">Need Help</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-blue-700">
                {alert.response_stats.acknowledged || 0}
              </div>
              <div className="text-xs text-blue-600">Acknowledged</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onViewDetails(alert)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          
          {canManageAlerts && (
            <div className="flex gap-2">
              <button
                onClick={() => fetchDeliveryStats()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white transition-colors text-gray-600"
                title="Refresh Stats"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleResendNotifications}
                className="p-2 rounded-lg border border-yellow-300 hover:bg-yellow-50 transition-colors text-yellow-600"
                title="Resend Failed Notifications"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelAlert}
                className="p-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors text-red-600"
                title="Cancel Alert"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced View Modal (simplified for active alerts)
function ViewActiveAlertModal({ open, onClose, alert, onResendNotifications, onCancelAlert, canManageAlerts }) {
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  useEffect(() => {
    if (open && alert && alert.id) {
      fetchDeliveryDetails();
    }
  }, [open, alert]);

  const fetchDeliveryDetails = async () => {
    if (!alert?.id || !canManageAlerts) return;
    
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

  if (!open || !alert) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Active Alert Details</h2>
              <div className="text-sm text-gray-600">
                Real-time monitoring and management
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Alert Overview */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">{alert.title}</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">Type: <strong>{alert.disaster_type_name}</strong></span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                alert.severity === 'extreme' ? 'bg-red-100 text-red-800' :
                alert.severity === 'severe' ? 'bg-orange-100 text-orange-800' :
                alert.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                alert.severity === 'minor' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {alert.severity}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                Active
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-800">{alert.message}</p>
            </div>
          </div>

          {/* Time Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs text-blue-600 mb-1">Issued</div>
              <div className="text-sm font-medium">{formatDateTime(alert.issued_at)}</div>
              <div className="text-xs text-blue-500 mt-1">{formatTimeAgo(alert.issued_at)}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-xs text-purple-600 mb-1">Expires</div>
              <div className="text-sm font-medium">{formatDateTime(alert.expires_at)}</div>
              <div className="text-xs text-purple-500 mt-1">{formatTimeRemaining(alert.expires_at)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-xs text-green-600 mb-1">Priority Score</div>
              <div className="text-sm font-medium">{alert.priority_score}</div>
            </div>
          </div>

          {/* Real-time Delivery Monitoring */}
          {canManageAlerts && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-blue-900 flex items-center">
                  <Radio className="w-5 h-5 mr-2" />
                  Real-time Delivery Monitoring
                </h4>
                {loadingDelivery && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                )}
              </div>
              
              {deliveryDetails ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(deliveryDetails.stats_by_method || {}).map(([method, stats]) => (
                    <div key={method} className="bg-white rounded-lg p-4">
                      <div className="text-sm font-semibold capitalize text-gray-900 mb-2">
                        {method} Notifications
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Total:</span>
                          <span className="font-medium">{stats.total || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Sent:</span>
                          <span className="font-medium text-green-600">{stats.sent || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Failed:</span>
                          <span className="font-medium text-red-600">{stats.failed || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Read:</span>
                          <span className="font-medium text-blue-600">{stats.read || 0}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>Success Rate:</span>
                            <span className={stats.success_rate >= 80 ? 'text-green-600' : 
                                          stats.success_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                              {stats.success_rate || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-pulse">Loading delivery statistics...</div>
                </div>
              )}
            </div>
          )}

          {/* Public Alert Information for Citizens */}
          {!canManageAlerts && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                <Radio className="w-5 h-5 mr-2" />
                Alert Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-blue-600 mb-1">
                    {alert.priority_score || 'N/A'}
                  </div>
                  <div className="text-sm text-blue-700">Priority Score</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-green-600 mb-1">
                    Active
                  </div>
                  <div className="text-sm text-green-700">Alert Status</div>
                </div>
              </div>
            </div>
          )}

          {/* Citizen Response Monitoring */}
          {alert.response_stats && Object.values(alert.response_stats).some(val => val > 0) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Citizen Response Monitoring
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {alert.response_stats.safe || 0}
                  </div>
                  <div className="text-sm text-green-700">Reported Safe</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {alert.response_stats.need_help || 0}
                  </div>
                  <div className="text-sm text-red-700">Need Help</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {alert.response_stats.acknowledged || 0}
                  </div>
                  <div className="text-sm text-blue-700">Acknowledged</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {alert.response_stats.total || 0}
                  </div>
                  <div className="text-sm text-purple-700">Total Responses</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {canManageAlerts && (
            <div className="bg-gray-50 rounded-xl border p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onResendNotifications(alert.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resend Failed
                </button>
                <button
                  onClick={fetchDeliveryDetails}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Stats
                </button>
                <button
                  onClick={() => onCancelAlert(alert.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Alert
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Active Alerts Page Component
export default function ActiveAlertsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [showMap, setShowMap] = useState(null);
  
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Check if user has admin permissions
  const isAdmin = user?.user_type === 'admin' || user?.is_staff || user?.is_superuser;
  const canManageAlerts = isAdmin;

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveAlerts(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch active alerts
  const fetchActiveAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      const params = {
        status: 'active',
        page_size: 100, // Get all active alerts
        ordering: '-issued_at'
      };
      
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      // Try the dedicated active alerts endpoint first, fallback to regular alerts endpoint
      let res;
      try {
        res = await apiService.getActiveAlerts(params);
      } catch (error) {
        // If active alerts endpoint fails (403 for citizens), use regular alerts endpoint
        if (error.message?.includes('permission') || error.status === 403) {
          console.log('Active alerts endpoint not accessible, using regular alerts endpoint');
          res = await apiService.getAlerts(params);
        } else {
          throw error;
        }
      }
      
      if (res?.results) {
        setAlerts(res.results);
      } else if (Array.isArray(res)) {
        setAlerts(res);
      } else {
        setAlerts([]);
      }
    } catch (e) {
      console.error('Error fetching active alerts:', e);
      toast.error(e?.message || 'Failed to load active alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch]);

  // Load initial data
  useEffect(() => {
    fetchActiveAlerts();
  }, [fetchActiveAlerts]);

  // Resend failed notifications (admin only)
  const resendFailedNotifications = async (id) => {
    if (!canManageAlerts) {
      toast.error('You do not have permission to resend notifications');
      return;
    }
    
    try {
      await apiService.resendFailedNotifications(id);
      toast.success('Failed notifications queued for resending');
      await fetchActiveAlerts(true);
    } catch (e) {
      toast.error(e?.message || 'Resend failed');
    }
  };

  // Cancel alert (admin only)
  const cancelAlert = async (id) => {
    if (!canManageAlerts) {
      toast.error('You do not have permission to cancel alerts');
      return;
    }
    
    try {
      await apiService.cancelAlert(id);
      toast.success('Alert cancelled successfully');
      await fetchActiveAlerts(true);
    } catch (e) {
      toast.error(e?.message || 'Cancel failed');
    }
  };

  const openViewModal = (alert) => setViewItem(alert);
  const closeViewModal = () => setViewItem(null);
  const openMapModal = (alert) => setShowMap(alert);
  const closeMapModal = () => setShowMap(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <Activity className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Active Emergency Alerts</h1>
                <p className="text-gray-600">
                  Real-time monitoring of {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                  {user?.user_type === 'citizen' && ' in your area'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <button
                onClick={() => fetchActiveAlerts(true)}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              {canManageAlerts && (
                <button
                  onClick={() => navigate('/admin/alerts')}
                  className="inline-flex items-center px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  All Alerts
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search active alerts..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{alerts.length}</div>
                <div className="text-xs text-gray-600">Active Alerts</div>
              </div>
              <div className="bg-white rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'extreme' || a.severity === 'severe').length}
                </div>
                <div className="text-xs text-gray-600">High Severity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border shadow-sm py-16 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading active alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white rounded-2xl border shadow-sm py-16 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'No active alerts match your search criteria.'
                  : 'All systems are currently normal. No emergency alerts are active.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {alerts.map((alert) => (
                <ActiveAlertCard
                  key={alert.id}
                  alert={alert}
                  onViewDetails={openViewModal}
                  onResendNotifications={resendFailedNotifications}
                  onCancelAlert={cancelAlert}
                  canManageAlerts={canManageAlerts}
                  onShowMap={openMapModal}
                />
              ))}
            </div>
          )}
        </div>

        {/* Priority Alerts Section */}
        {alerts.filter(a => a.severity === 'extreme' || a.severity === 'severe').length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200 p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-lg font-semibold text-red-900">High Priority Alerts Requiring Attention</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts
                .filter(a => a.severity === 'extreme' || a.severity === 'severe')
                .map((alert) => (
                  <div key={alert.id} className="bg-white rounded-lg border border-red-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        alert.severity === 'extreme' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      {alert.disaster_type_name} • Issued {formatTimeAgo(alert.issued_at)}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Expires: {formatTimeRemaining(alert.expires_at)}</span>
                      <button
                        onClick={() => openViewModal(alert)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Monitor →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Auto-refreshing every 30 seconds
          </div>
        </div>
      </div>

      {/* Enhanced View Modal */}
      <ViewActiveAlertModal
        open={!!viewItem}
        onClose={closeViewModal}
        alert={viewItem}
        onResendNotifications={resendFailedNotifications}
        onCancelAlert={cancelAlert}
        canManageAlerts={canManageAlerts}
      />

      {/* Geographic Map Modal */}
      <GeographicMap
        alert={showMap}
        isOpen={!!showMap}
        onClose={closeMapModal}
      />
    </div>
  );
}

const useDebounce = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => { 
    const t = setTimeout(() => setV(value), delay); 
    return () => clearTimeout(t); 
  }, [value, delay]);
  return v;
};