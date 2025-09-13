// src/pages/alerts/AlertsManagement.jsx - Enhanced version
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, RefreshCw, AlertTriangle, Eye, Edit, Trash2, CheckCircle2,
  MapPin, Radio, Users, X, RotateCcw, XCircle, TrendingUp, Bell
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

// Constants
const SEVERITIES = [
  { value: 'info', label: 'Information' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
  { value: 'extreme', label: 'Extreme' }
];

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' }
];

// Utility functions
const formatDateTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const formatBool = (b) => (b ? 'Yes' : 'No');

const useDebounce = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => { 
    const t = setTimeout(() => setV(value), delay); 
    return () => clearTimeout(t); 
  }, [value, delay]);
  return v;
};

// Enhanced View Alert Modal Component
function ViewAlertModal({ open, onClose, alert, onResendNotifications, onCancelAlert }) {
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  useEffect(() => {
    if (open && alert && alert.id) {
      fetchDeliveryDetails();
    }
  }, [open, alert]);

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

  const handleResendNotifications = async () => {
    try {
      await onResendNotifications(alert.id);
      await fetchDeliveryDetails(); // Refresh delivery details
      toast.success('Notifications resent successfully');
    } catch (error) {
      toast.error('Failed to resend notifications');
    }
  };

  const handleCancelAlert = async () => {
    if (window.confirm('Are you sure you want to cancel this alert? This action cannot be undone.')) {
      try {
        await onCancelAlert(alert.id);
        onClose();
        toast.success('Alert cancelled successfully');
      } catch (error) {
        toast.error('Failed to cancel alert');
      }
    }
  };

  if (!open || !alert) return null;

  const stat = alert.delivery_stats || {};
  const resp = alert.response_stats || {};

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Alert Details</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{alert.title}</h3>
            <div className="text-sm text-gray-600">
              Type: <span className="font-medium">{alert.disaster_type_name}</span> • Severity:{' '}
              <span className="font-medium capitalize">{alert.severity}</span> • Status:{' '}
              <span className={`font-medium capitalize px-2 py-1 rounded-full text-xs ${
                alert.status === 'active' ? 'bg-green-100 text-green-800' :
                alert.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                alert.status === 'expired' ? 'bg-red-100 text-red-800' :
                alert.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {alert.status}
              </span>
            </div>
          </div>

          <div className="rounded-xl border p-4 bg-gray-50">
            <p className="whitespace-pre-wrap text-gray-800">{alert.message}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500">Issued At</div>
              <div className="text-sm font-medium">{formatDateTime(alert.issued_at)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500">Expires At</div>
              <div className="text-sm font-medium">{formatDateTime(alert.expires_at)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500">Priority</div>
              <div className="text-sm font-medium">{alert.priority_score}</div>
            </div>
          </div>

          {/* Enhanced Delivery Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <Radio className="w-4 h-4 mr-2" /> Delivery Overview
                </span>
                {loadingDelivery && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                )}
              </div>
              
              {deliveryDetails ? (
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Total Sent:</span>
                      <span className="font-medium">{deliveryDetails.total_target_users || 0}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Success Rate:</span>
                      <span className="font-medium text-green-600">
                        {deliveryDetails.stats_by_method?.sms?.success_rate || 0}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Method breakdown */}
                  {Object.entries(deliveryDetails.stats_by_method || {}).map(([method, stats]) => (
                    <div key={method} className="text-xs border-t pt-2">
                      <div className="font-medium capitalize text-gray-700 mb-1">{method}</div>
                      <div className="grid grid-cols-3 gap-1 text-gray-600">
                        <div>Sent: {stats.sent || 0}</div>
                        <div>Failed: {stats.failed || 0}</div>
                        <div>Read: {stats.read || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm grid grid-cols-2 gap-2">
                  <div>Total: <span className="font-medium">{stat.total ?? 0}</span></div>
                  <div>Delivered: <span className="font-medium">{stat.delivered ?? 0}</span></div>
                  <div>Sent: <span className="font-medium">{stat.sent ?? 0}</span></div>
                  <div>Failed: <span className="font-medium">{stat.failed ?? 0}</span></div>
                  <div>Read: <span className="font-medium">{stat.read ?? 0}</span></div>
                  <div>Rate: <span className="font-medium">{stat.delivery_rate ?? 0}%</span></div>
                </div>
              )}
            </div>

            <div className="rounded-xl border p-4">
              <div className="font-medium mb-2 flex items-center"><Users className="w-4 h-4 mr-2" /> Responses</div>
              <div className="text-sm grid grid-cols-2 gap-2">
                <div>Total: <span className="font-medium">{resp.total ?? 0}</span></div>
                <div>Ack: <span className="font-medium">{resp.acknowledged ?? 0}</span></div>
                <div>Safe: <span className="font-medium">{resp.safe ?? 0}</span></div>
                <div>Need Help: <span className="font-medium">{resp.need_help ?? 0}</span></div>
                <div>Evacuated: <span className="font-medium">{resp.evacuated ?? 0}</span></div>
                <div>Feedback: <span className="font-medium">{resp.feedback ?? 0}</span></div>
              </div>
            </div>
          </div>

          {/* Delivery Channels */}
          <div className="rounded-xl border p-4">
            <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" />
                SMS: <span className="font-medium">{formatBool(alert.send_sms)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-gray-500" />
                Push: <span className="font-medium">{formatBool(alert.send_push)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-gray-500" />
                Email: <span className="font-medium">{formatBool(alert.send_email)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-gray-500" />
                Web: <span className="font-medium">{formatBool(alert.publish_web)}</span>
              </div>
            </div>
          </div>

          {/* Geographic targeting */}
          {(alert.center_lat || alert.center_lng || alert.radius_km) && (
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-2 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Target</div>
              <div className="text-sm grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>Lat: <span className="font-medium">{alert.center_lat ?? '—'}</span></div>
                <div>Lng: <span className="font-medium">{alert.center_lng ?? '—'}</span></div>
                <div>Radius: <span className="font-medium">{alert.radius_km ?? '—'} km</span></div>
              </div>
              {alert.center_lat && alert.center_lng && alert.radius_km && (
                <div className="text-xs text-gray-500 mt-2">
                  Coverage area: ~{(Math.PI * alert.radius_km * alert.radius_km).toFixed(1)} km²
                </div>
              )}
            </div>
          )}

          {/* Instructions and contact info */}
          {alert.instructions && (
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-2">Instructions</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{alert.instructions}</p>
            </div>
          )}

          {alert.contact_info && (
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-2">Contact Information</div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{alert.contact_info}</p>
            </div>
          )}

          {/* Notification Actions */}
          {alert.status === 'active' && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Notification Actions</h4>
              <div className="flex gap-3">
                <button
                  onClick={handleResendNotifications}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resend Failed
                </button>
                <button
                  onClick={handleCancelAlert}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Alert
                </button>
                <button
                  onClick={fetchDeliveryDetails}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  Refresh Stats
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Main AlertsManagement Component
export default function AlertsManagement() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    search: '', 
    severity: '', 
    status: '', 
    disaster_type: '' 
  });
  const [pagination, setPagination] = useState({ 
    page: 1, 
    pageSize: 20, 
    total: 0, 
    totalPages: 1 
  });

  const [disasterTypes, setDisasterTypes] = useState([]);
  const [viewItem, setViewItem] = useState(null);

  const debouncedSearch = useDebounce(filters.search, 400);

  // Fetch disaster types for filter dropdown
  const fetchDisasterTypes = useCallback(async () => {
    try {
      const res = await apiService.getDisasterTypes({ page_size: 1000 });
      setDisasterTypes(res?.results || res || []);
    } catch (e) {
      toast.error('Failed to load disaster types');
    }
  }, []);

  // Fetch alerts with filters and pagination
  const fetchAlerts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pagination.pageSize,
      };
      
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.disaster_type) params.disaster_type = filters.disaster_type;

      const res = await apiService.getAlerts(params);
      
      if (res?.results) {
        setAlerts(res.results);
        setPagination((p) => ({
          ...p,
          page,
          total: res.count || res.results.length,
          totalPages: Math.max(1, Math.ceil((res.count || res.results.length) / p.pageSize)),
        }));
      } else if (Array.isArray(res)) {
        setAlerts(res);
        setPagination((p) => ({ ...p, page: 1, total: res.length, totalPages: 1 }));
      } else {
        setAlerts([]);
        setPagination((p) => ({ ...p, page: 1, total: 0, totalPages: 1 }));
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filters.severity, filters.status, filters.disaster_type, debouncedSearch, pagination.pageSize]);

  // Load initial data
  useEffect(() => { 
    fetchDisasterTypes(); 
  }, [fetchDisasterTypes]);

  useEffect(() => { 
    fetchAlerts(1); 
  }, [fetchAlerts]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({ search: '', severity: '', status: '', disaster_type: '' });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // Delete alert
  const deleteAlert = async (id) => {
    try {
      await apiService.deleteAlert(id);
      toast.success('Alert deleted successfully');
      await fetchAlerts(pagination.page);
    } catch (e) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  // Activate alert with enhanced feedback
  const activateAlert = async (id) => {
    try {
      const res = await apiService.activateAlert(id);
      
      if (res?.delivery_results) {
        const results = res.delivery_results;
        const totalSent = Object.values(results).reduce((sum, method) => sum + (method.sent || 0), 0);
        const totalFailed = Object.values(results).reduce((sum, method) => sum + (method.failed || 0), 0);
        
        if (totalFailed > 0) {
          toast.warning(`Alert activated! ${totalSent} notifications sent, ${totalFailed} failed. Check delivery status for details.`);
        } else {
          toast.success(`Alert activated successfully! ${totalSent} notifications sent.`);
        }
      } else {
        toast.success('Alert activated successfully');
      }
      
      await fetchAlerts(pagination.page);
    } catch (e) {
      toast.error(e?.message || 'Activation failed');
    }
  };

  // Resend failed notifications
  const resendFailedNotifications = async (id) => {
    try {
      const res = await apiService.resendFailedNotifications(id);
      
      if (res?.delivery_results) {
        toast.success('Failed notifications have been queued for resending');
      } else {
        toast.success('Resend request completed');
      }
      
      await fetchAlerts(pagination.page);
    } catch (e) {
      toast.error(e?.message || 'Resend failed');
    }
  };

  // Cancel alert
  const cancelAlert = async (id) => {
    try {
      await apiService.cancelAlert(id);
      toast.success('Alert cancelled successfully');
      await fetchAlerts(pagination.page);
    } catch (e) {
      toast.error(e?.message || 'Cancel failed');
    }
  };

  // Navigation functions
  const goToCreateAlert = () => navigate('/admin/alerts/create');
  const goToEditAlert = (alertId) => navigate(`/admin/alerts/edit/${alertId}`);
  const openViewModal = (alert) => setViewItem(alert);
  const closeViewModal = () => setViewItem(null);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency Alerts</h1>
                <p className="text-gray-600">
                  Create, manage and activate disaster alerts with geographic targeting and multi-channel delivery
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchAlerts(pagination.page)}
                className="inline-flex items-center px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </button>
              <button
                onClick={goToCreateAlert}
                className="inline-flex items-center px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Alert
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search alerts by title or message..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                value={filters.disaster_type}
                onChange={(e) => setFilters((f) => ({ ...f, disaster_type: e.target.value }))}
              >
                <option value="">All Disaster Types</option>
                {disasterTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>{dt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                value={filters.severity}
                onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
              >
                <option value="">All Severities</option>
                {SEVERITIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button 
                  onClick={clearFilters} 
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Clear all filters"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-600">
              {alerts.length === 0 ? 'No alerts found' : 
               `Showing ${alerts.length} of ${pagination.total} alerts`}
              {Object.values(filters).some(f => f) && ' (filtered)'}
            </p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium text-lg">No alerts found</p>
              <p className="text-gray-500 text-sm mt-1">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters or create a new alert.' 
                  : 'Get started by creating your first emergency alert.'
                }
              </p>
              {!Object.values(filters).some(f => f) && (
                <button
                  onClick={goToCreateAlert}
                  className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create First Alert
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Alert Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type & Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status & Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Targeting
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Issued
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{alert.title}</div>
                          <div className="text-sm text-gray-500 truncate mt-1">{alert.message}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{alert.disaster_type_name}</div>
                          <div className={`text-xs capitalize px-2 py-1 rounded-full mt-1 inline-block font-medium
                            ${alert.severity === 'extreme' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'severe' ? 'bg-orange-100 text-orange-800' :
                              alert.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              alert.severity === 'minor' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {alert.severity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className={`text-xs capitalize px-2 py-1 rounded-full inline-block font-medium
                            ${alert.status === 'active' ? 'bg-green-100 text-green-800' :
                              alert.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              alert.status === 'expired' ? 'bg-red-100 text-red-800' :
                              alert.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {alert.status}
                          </div>
                          {/* Delivery channel indicators */}
                          <div className="flex items-center gap-1">
                            {alert.send_sms && <Bell className="w-3 h-3 text-blue-600" title="SMS" />}
                            {alert.send_push && <Radio className="w-3 h-3 text-green-600" title="Push" />}
                            {alert.send_email && <Radio className="w-3 h-3 text-purple-600" title="Email" />}
                            {alert.publish_web && <Radio className="w-3 h-3 text-orange-600" title="Web" />}
                          </div>
                          {/* Delivery stats if available */}
                          {alert.delivery_stats && alert.delivery_stats.total > 0 && (
                            <div className="text-xs text-gray-500">
                              {alert.delivery_stats.delivery_rate}% delivery rate
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {alert.center_lat && alert.center_lng ? (
                          <div className="text-sm">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span>{alert.center_lat.toFixed(3)}, {alert.center_lng.toFixed(3)}</span>
                            </div>
                            {alert.radius_km && (
                              <div className="text-xs text-gray-500 mt-1">
                                {alert.radius_km}km radius
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No targeting</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(alert.issued_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="View Details" 
                            onClick={() => openViewModal(alert)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                            title="Edit Alert" 
                            onClick={() => goToEditAlert(alert.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {alert.status === 'draft' && (
                            <button 
                              className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Activate Alert" 
                              onClick={() => {
                                if (window.confirm('Activate this alert? This will send notifications to targeted users.')) {
                                  activateAlert(alert.id);
                                }
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {alert.status === 'active' && (
                            <button 
                              className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                              title="Resend Failed Notifications" 
                              onClick={() => {
                                if (window.confirm('Resend failed notifications for this alert?')) {
                                  resendFailedNotifications(alert.id);
                                }
                              }}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete Alert"
                            onClick={() => {
                              if (window.confirm(`Delete alert "${alert.title}"? This action cannot be undone.`)) {
                                deleteAlert(alert.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total alerts)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchAlerts(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchAlerts(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced View Modal */}
      <ViewAlertModal
        open={!!viewItem}
        onClose={closeViewModal}
        alert={viewItem}
        onResendNotifications={resendFailedNotifications}
        onCancelAlert={cancelAlert}
      />
    </div>
  );
}