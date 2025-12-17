// src/pages/alerts/ActiveAlertsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  AlertTriangle, Search, RefreshCw, Eye, MapPin, Radio, Users, Clock,
  RotateCcw, XCircle, TrendingUp, Bell, Activity, Globe, Zap, AlertCircle,
  CheckCircle2, X, Timer, Target
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { MapContainer, TileLayer, Circle, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Utility functions with i18n support
const formatDateTime = (iso, locale = 'en-US') => {
  if (!iso) return '—';
  try { 
    return new Date(iso).toLocaleString(locale); 
  } catch { 
    return iso; 
  }
};

const formatTimeAgo = (iso, t) => {
  if (!iso) return '—';
  try {
    const now = new Date();
    const time = new Date(iso);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return t('time.daysAgo', { count: days, defaultValue: `${days}d ago` });
    if (hours > 0) return t('time.hoursAgo', { count: hours, defaultValue: `${hours}h ago` });
    if (minutes > 0) return t('time.minutesAgo', { count: minutes, defaultValue: `${minutes}m ago` });
    return t('time.justNow', { defaultValue: 'Just now' });
  } catch { 
    return iso; 
  }
};

const formatTimeRemaining = (expiresAt, t) => {
  if (!expiresAt) return null;
  try {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return t('time.expired', { defaultValue: 'Expired' });

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return t('time.daysHoursLeft', { days, hours: hours % 24, defaultValue: `${days}d ${hours % 24}h left` });
    if (hours > 0) return t('time.hoursMinutesLeft', { hours, minutes, defaultValue: `${hours}h ${minutes}m left` });
    return t('time.minutesLeft', { minutes, defaultValue: `${minutes}m left` });
  } catch { 
    return null; 
  }
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

const useDebounce = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

// AlertMap Component
const AlertMap = ({ lat, lng, radiusKm, title, t }) => {
  if (!lat || !lng) {
    return (
      <div className="text-center p-4 text-gray-500">
        {t('map.noLocationData', { defaultValue: 'No location data available' })}
      </div>
    );
  }

  const position = [lat, lng];

  return (
    <MapContainer
      center={position}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      dragging={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Circle
        center={position}
        radius={radiusKm * 1000}
        pathOptions={{
          color: 'blue',
          fillColor: 'blue',
          fillOpacity: 0.2,
          weight: 2,
        }}
      >
        <Popup>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p>{t('map.radius', { defaultValue: 'Radius' })}: {radiusKm} km</p>
          </div>
        </Popup>
      </Circle>
      <ZoomControl position="topright" />
    </MapContainer>
  );
};

// Enhanced Alert Card Component
function ActiveAlertCard({ alert, onViewDetails, onResendNotifications, onCancelAlert, canManageAlerts, isModalOpen }) {
  const { t, i18n } = useTranslation();
  
  const timeRemaining = formatTimeRemaining(alert.expires_at, t);
  const isNearExpiry = timeRemaining && timeRemaining.includes('h') && parseInt(timeRemaining) < 6;

  const handleResendNotifications = async () => {
    if (window.confirm(t('alerts.confirmResend', { defaultValue: 'Resend failed notifications for this alert?' }))) {
      await onResendNotifications(alert.id);
    }
  };

  const handleCancelAlert = async () => {
    if (window.confirm(t('alerts.confirmCancel', { defaultValue: 'Are you sure you want to cancel this alert? This action cannot be undone.' }))) {
      await onCancelAlert(alert.id);
    }
  };

  const severityColors = {
    extreme: 'bg-red-100 text-red-600',
    severe: 'bg-orange-100 text-orange-600',
    moderate: 'bg-yellow-100 text-yellow-600',
    minor: 'bg-blue-100 text-blue-600',
    default: 'bg-gray-100 text-gray-600'
  };

  const severityTextColors = {
    extreme: 'text-red-600',
    severe: 'text-orange-600',
    moderate: 'text-yellow-600',
    minor: 'text-blue-600',
    default: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${severityColors[alert.severity] || severityColors.default}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{alert.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span>{alert.disaster_type_name}</span>
                  <span>•</span>
                  <span className={`capitalize font-medium ${severityTextColors[alert.severity] || severityTextColors.default}`}>
                    {t(`severity.${alert.severity}`, { defaultValue: alert.severity })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status and Time */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {t('status.active', { defaultValue: 'Active' })}
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
              {t('alerts.issued', { defaultValue: 'Issued' })} {formatTimeAgo(alert.issued_at, t)}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Message */}
      <div className="px-6 py-4">
        <p className="text-gray-800 line-clamp-3">{alert.message}</p>
      </div>

      {/* Geographic Targeting */}
      {(alert.center_lat || alert.center_lng || alert.radius_km) && (
        <div className="px-6 py-3 bg-blue-50 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-blue-800">
              <Target className="w-4 h-4 mr-2" />
              {t('alerts.geographicTargeting', { defaultValue: 'Geographic Targeting Active' })}
            </div>
            <div className="text-xs text-blue-600">
              {t('map.lat', { defaultValue: 'Lat' })}: {formatCoordinate(alert.center_lat)}, 
              {t('map.lng', { defaultValue: 'Lng' })}: {formatCoordinate(alert.center_lng)}
              {alert.radius_km && ` (${alert.radius_km} km ${t('map.radius', { defaultValue: 'radius' })})`}
            </div>
          </div>
          {!isModalOpen && (
            <div className="h-40 rounded-lg overflow-hidden border border-blue-200">
              <AlertMap
                lat={parseFloat(alert.center_lat)}
                lng={parseFloat(alert.center_lng)}
                radiusKm={parseFloat(alert.radius_km)}
                title={alert.title}
                t={t}
              />
            </div>
          )}
        </div>
      )}

      {/* Response Stats */}
      {alert.response_stats && Object.values(alert.response_stats).some(val => val > 0) && (
        <div className="px-6 py-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Users className="w-4 h-4 mr-1" /> {t('alerts.citizenResponses', { defaultValue: 'Citizen Responses' })}
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-green-700">
                {alert.response_stats.safe || 0}
              </div>
              <div className="text-xs text-green-600">{t('status.safe', { defaultValue: 'Safe' })}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-yellow-700">
                {alert.response_stats.need_help || 0}
              </div>
              <div className="text-xs text-yellow-600">{t('status.needHelp', { defaultValue: 'Need Help' })}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-semibold text-blue-700">
                {alert.response_stats.acknowledged || 0}
              </div>
              <div className="text-xs text-blue-600">{t('status.acknowledged', { defaultValue: 'Acknowledged' })}</div>
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
            {t('actions.viewDetails', { defaultValue: 'View Details' })}
          </button>

          {canManageAlerts && (
            <div className="flex gap-2">
              <button
                onClick={handleResendNotifications}
                className="p-2 rounded-lg border border-yellow-300 hover:bg-yellow-50 transition-colors text-yellow-600"
                title={t('alerts.resendFailed', { defaultValue: 'Resend Failed Notifications' })}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelAlert}
                className="p-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors text-red-600"
                title={t('alerts.cancelAlert', { defaultValue: 'Cancel Alert' })}
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

// Streamlined View Modal
function ViewActiveAlertModal({ open, onClose, alert, onResendNotifications, onCancelAlert, canManageAlerts }) {
  const { t, i18n } = useTranslation();
  
  if (!open || !alert) return null;

  const currentLocale = i18n.language || 'en-US';
  const safeLocale = ['en', 'en-US', 'fr', 'rw', 'sw', 'fr-FR', 'rw-RW', 'sw-KE'].includes(currentLocale) 
    ? currentLocale 
    : 'en-US';

  const severityColors = {
    extreme: 'bg-red-100 text-red-600',
    severe: 'bg-orange-100 text-orange-600',
    moderate: 'bg-yellow-100 text-yellow-600',
    minor: 'bg-blue-100 text-blue-600',
    default: 'bg-gray-100 text-gray-600'
  };

  const severityBadgeColors = {
    extreme: 'bg-red-100 text-red-800',
    severe: 'bg-orange-100 text-orange-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    minor: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${severityColors[alert.severity] || severityColors.default}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{alert.title}</h2>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{alert.disaster_type_name}</span>
                <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${
                  severityBadgeColors[alert.severity] || severityBadgeColors.default
                }`}>
                  {t(`severity.${alert.severity}`, { defaultValue: alert.severity })}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {t('status.active', { defaultValue: 'Active' })}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6 space-y-8">
          {/* Alert Message Section */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">
              {t('alerts.alertMessage', { defaultValue: 'Alert Message' })}
            </h3>
            <p className="text-gray-800 whitespace-pre-line">{alert.message}</p>
          </div>

          {/* Time and Priority Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs text-blue-600 mb-1">{t('alerts.issued', { defaultValue: 'Issued' })}</div>
              <div className="text-lg font-semibold">{formatDateTime(alert.issued_at, safeLocale)}</div>
              <div className="text-xs text-blue-500 mt-1">{formatTimeAgo(alert.issued_at, t)}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-xs text-purple-600 mb-1">{t('alerts.expires', { defaultValue: 'Expires' })}</div>
              <div className="text-lg font-semibold">{formatDateTime(alert.expires_at, safeLocale)}</div>
              <div className="text-xs text-purple-500 mt-1">{formatTimeRemaining(alert.expires_at, t)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-xs text-green-600 mb-1">{t('alerts.priorityScore', { defaultValue: 'Priority Score' })}</div>
              <div className="text-2xl font-bold">{alert.priority_score}</div>
            </div>
          </div>

          {/* Geographic Targeting Section (only if available) */}
          {(alert.center_lat || alert.center_lng || alert.radius_km) && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  {t('alerts.geographicTargeting', { defaultValue: 'Geographic Targeting' })}
                </h3>
                <div className="text-sm text-blue-600">
                  {t('map.lat', { defaultValue: 'Lat' })}: {formatCoordinate(alert.center_lat)}, 
                  {t('map.lng', { defaultValue: 'Lng' })}: {formatCoordinate(alert.center_lng)}
                  {alert.radius_km && ` (${alert.radius_km} km ${t('map.radius', { defaultValue: 'radius' })})`}
                </div>
              </div>
              <div className="h-72 rounded-lg overflow-hidden border border-blue-200">
                <AlertMap
                  lat={parseFloat(alert.center_lat)}
                  lng={parseFloat(alert.center_lng)}
                  radiusKm={parseFloat(alert.radius_km)}
                  title={alert.title}
                  t={t}
                />
              </div>
            </div>
          )}

          {/* Citizen Response Monitoring Section (only if available) */}
          {alert.response_stats && Object.values(alert.response_stats).some(val => val > 0) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h3 className="font-semibold text-green-900 mb-5 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {t('alerts.citizenResponses', { defaultValue: 'Citizen Responses' })}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center border border-green-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {alert.response_stats.safe || 0}
                  </div>
                  <div className="text-sm text-green-700">{t('status.safe', { defaultValue: 'Safe' })}</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-red-100">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {alert.response_stats.need_help || 0}
                  </div>
                  <div className="text-sm text-red-700">{t('status.needHelp', { defaultValue: 'Need Help' })}</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {alert.response_stats.acknowledged || 0}
                  </div>
                  <div className="text-sm text-blue-700">{t('status.acknowledged', { defaultValue: 'Acknowledged' })}</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {alert.response_stats.total || 0}
                  </div>
                  <div className="text-sm text-purple-700">{t('status.total', { defaultValue: 'Total' })}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Section (only for admins) */}
          {canManageAlerts && (
            <div className="bg-gray-50 rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t('alerts.quickActions', { defaultValue: 'Quick Actions' })}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onResendNotifications(alert.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('alerts.resendFailed', { defaultValue: 'Resend Failed' })}
                </button>
                <button
                  onClick={() => onCancelAlert(alert.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  {t('alerts.cancelAlert', { defaultValue: 'Cancel Alert' })}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            {t('actions.close', { defaultValue: 'Close' })}
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
  const { t, i18n } = useTranslation();
  const { languageKey } = useLanguage();
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const debouncedSearch = useDebounce(searchTerm, 400);

  const isAdmin = user?.user_type === 'admin' || user?.is_staff || user?.is_superuser;
  const canManageAlerts = isAdmin;

  const currentLocale = i18n.language || 'en-US';
  const safeLocale = ['en', 'en-US', 'fr', 'rw', 'sw', 'fr-FR', 'rw-RW', 'sw-KE'].includes(currentLocale) 
    ? currentLocale 
    : 'en-US';

  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveAlerts(true);
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);
      
      console.log('🔄 Fetching active alerts...');
      
      const params = {
        status: 'active',
        page_size: 100,
        ordering: '-issued_at'
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      let res;
      try {
        res = await apiService.getActiveAlerts(params);
      } catch (error) {
        if (error.message?.includes('permission') || error.status === 403) {
          console.log('Active alerts endpoint not accessible, using regular alerts endpoint');
          res = await apiService.getAlerts(params);
        } else {
          throw error;
        }
      }

      if (res?.results) {
        setAlerts(res.results);
        console.log('✅ Active alerts loaded:', res.results.length);
      } else if (Array.isArray(res)) {
        setAlerts(res);
        console.log('✅ Active alerts loaded:', res.length);
      } else {
        setAlerts([]);
        console.log('⚠️ No active alerts found');
      }
      
      setLastUpdate(new Date());
    } catch (e) {
      console.error('❌ Error fetching active alerts:', e);
      toast.error(e?.message || t('messages.failedToLoadAlerts', { defaultValue: 'Failed to load active alerts' }));
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, t]);

  useEffect(() => {
    fetchActiveAlerts();
  }, [fetchActiveAlerts]);

  const resendFailedNotifications = async (id) => {
    if (!canManageAlerts) {
      toast.error(t('messages.noPermissionResend', { defaultValue: 'You do not have permission to resend notifications' }));
      return;
    }

    try {
      await apiService.resendFailedNotifications(id);
      toast.success(t('messages.resendQueued', { defaultValue: 'Failed notifications queued for resending' }));
      await fetchActiveAlerts(true);
    } catch (e) {
      toast.error(e?.message || t('messages.resendFailed', { defaultValue: 'Resend failed' }));
    }
  };

  const cancelAlert = async (id) => {
    if (!canManageAlerts) {
      toast.error(t('messages.noPermissionCancel', { defaultValue: 'You do not have permission to cancel alerts' }));
      return;
    }

    try {
      await apiService.cancelAlert(id);
      toast.success(t('messages.alertCancelled', { defaultValue: 'Alert cancelled successfully' }));
      await fetchActiveAlerts(true);
    } catch (e) {
      toast.error(e?.message || t('messages.cancelFailed', { defaultValue: 'Cancel failed' }));
    }
  };

  const openViewModal = (alert) => setViewItem(alert);
  const closeViewModal = () => setViewItem(null);

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${viewItem ? 'overflow-hidden' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <Activity className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('nav.activeEmergencyAlerts', { defaultValue: 'Active Emergency Alerts' })}
                </h1>
                <p className="text-gray-600">
                  {t('alerts.monitoringCount', { 
                    count: alerts.length, 
                    defaultValue: `Real-time monitoring of ${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}` 
                  })}
                  {user?.user_type === 'citizen' && ` ${t('alerts.inYourArea', { defaultValue: 'in your area' })}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                {t('alerts.lastUpdated', { defaultValue: 'Last updated' })}: {lastUpdate.toLocaleTimeString(safeLocale)}
              </div>
              <button
                onClick={() => fetchActiveAlerts(true)}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('loading', { defaultValue: 'Refreshing...' }) : t('actions.refresh', { defaultValue: 'Refresh' })}
              </button>
              {canManageAlerts && (
                <button
                  onClick={() => navigate('/admin/alerts')}
                  className="inline-flex items-center px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('nav.allAlerts', { defaultValue: 'All Alerts' })}
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
                  placeholder={t('alerts.searchPlaceholder', { defaultValue: 'Search active alerts...' })}
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
                <div className="text-xs text-gray-600">{t('nav.activeAlerts', { defaultValue: 'Active Alerts' })}</div>
              </div>
              <div className="bg-white rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'extreme' || a.severity === 'severe').length}
                </div>
                <div className="text-xs text-gray-600">{t('alerts.highSeverity', { defaultValue: 'High Severity' })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border shadow-sm py-16 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('alerts.loadingAlerts', { defaultValue: 'Loading active alerts...' })}</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white rounded-2xl border shadow-sm py-16 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('alerts.noActiveAlerts', { defaultValue: 'No Active Alerts' })}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? t('alerts.noMatchingAlerts', { defaultValue: 'No active alerts match your search criteria.' })
                  : t('alerts.allNormal', { defaultValue: 'All systems are currently normal. No emergency alerts are active.' })
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {t('actions.clearSearch', { defaultValue: 'Clear search' })}
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
                  isModalOpen={!!viewItem}
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
              <h2 className="text-lg font-semibold text-red-900">
                {t('alerts.highPriorityAlertsTitle', { defaultValue: 'High Priority Alerts Requiring Attention' })}
              </h2>
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
                        {t(`severity.${alert.severity}`, { defaultValue: alert.severity })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      {alert.disaster_type_name} • {t('alerts.issued', { defaultValue: 'Issued' })} {formatTimeAgo(alert.issued_at, t)}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>{t('alerts.expires', { defaultValue: 'Expires' })}: {formatTimeRemaining(alert.expires_at, t)}</span>
                      <button
                        onClick={() => openViewModal(alert)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        {t('alerts.monitor', { defaultValue: 'Monitor' })} →
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
            {t('alerts.autoRefresh', { defaultValue: 'Auto-refreshing every 30 seconds' })}
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
    </div>
  );
}