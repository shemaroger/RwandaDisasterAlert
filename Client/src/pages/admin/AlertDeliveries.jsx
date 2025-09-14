import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Radio, Mail, Globe, User, Clock, CheckCircle2, 
  XCircle, AlertCircle, Search, Filter, Download, RefreshCw,
  Eye, EyeOff, Calendar, TrendingUp, Users, Zap, AlertTriangle,
  ChevronDown, ChevronRight, BarChart3, Activity, Loader
} from 'lucide-react';
import apiService from '../../services/api';

// Delivery method icons
const MethodIcon = ({ method, className = "w-4 h-4" }) => {
  switch (method) {
    case 'sms': return <MessageSquare className={className} />;
    case 'push': return <Radio className={className} />;
    case 'email': return <Mail className={className} />;
    case 'web': return <Globe className={className} />;
    default: return <AlertCircle className={className} />;
  }
};

// Status badge component
const StatusBadge = ({ status, className = "" }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'read':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'sent': return <Zap className="w-3 h-3" />;
      case 'delivered': return <CheckCircle2 className="w-3 h-3" />;
      case 'failed': return <XCircle className="w-3 h-3" />;
      case 'read': return <Eye className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusStyle(status)} ${className}`}>
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Statistics card component
const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
    red: "bg-red-50 border-red-200 text-red-600"
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`text-xs px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

// Delivery table row component
const DeliveryRow = ({ delivery, onMarkAsRead, expandedRow, onToggleExpand }) => {
  const [marking, setMarking] = useState(false);

  const handleMarkAsRead = async () => {
    if (delivery.status !== 'delivered' && delivery.status !== 'sent') return;
    
    setMarking(true);
    try {
      await onMarkAsRead(delivery.id);
    } finally {
      setMarking(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpanded = expandedRow === delivery.id;

  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-200">
        <td className="px-6 py-4">
          <button
            onClick={() => onToggleExpand(delivery.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <MethodIcon method={delivery.delivery_method} />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {delivery.delivery_method.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">
                {delivery.user_name || delivery.user?.username || 'Unknown User'}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 max-w-xs truncate">
            {delivery.alert?.title || `Alert ID: ${delivery.alert}`}
          </div>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={delivery.status} />
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {formatTime(delivery.sent_at)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {formatTime(delivery.delivered_at)}
        </td>
        <td className="px-6 py-4">
          {(delivery.status === 'delivered' || delivery.status === 'sent') && !delivery.read_at && (
            <button
              onClick={handleMarkAsRead}
              disabled={marking}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              {marking ? <Loader className="w-4 h-4 animate-spin" /> : 'Mark Read'}
            </button>
          )}
          {delivery.read_at && (
            <span className="text-green-600 text-sm">
              {formatTime(delivery.read_at)}
            </span>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-6 py-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">User Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Name: {delivery.user_name || 'N/A'}</div>
                    <div>Username: {delivery.user?.username || 'N/A'}</div>
                    <div>User ID: {delivery.user || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Timing</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Created: {formatTime(delivery.created_at)}</div>
                    <div>Sent: {formatTime(delivery.sent_at)}</div>
                    <div>Delivered: {formatTime(delivery.delivered_at)}</div>
                    <div>Read: {formatTime(delivery.read_at)}</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Alert Info</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Alert ID: {delivery.alert}</div>
                    {delivery.error_message && (
                      <div className="text-red-600">
                        Error: {delivery.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Main component
export default function AlertDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    delivery_method: '',
    status: '',
    alert: '',
    start_date: '',
    end_date: ''
  });

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [deliveriesData, statsData] = await Promise.all([
        apiService.getAlertDeliveries(filters),
        apiService.getDeliveryStatistics()
      ]);
      
      setDeliveries(deliveriesData.results || deliveriesData || []);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      setError(error.message || 'Failed to load delivery data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMarkAsRead = async (deliveryId) => {
    try {
      await apiService.markDeliveryAsRead(deliveryId);
      // Update local state
      setDeliveries(prev => prev.map(d => 
        d.id === deliveryId 
          ? { ...d, status: 'read', read_at: new Date().toISOString() }
          : d
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
      setError('Failed to mark delivery as read');
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleExpand = (deliveryId) => {
    setExpandedRow(prev => prev === deliveryId ? null : deliveryId);
  };

  const handleExport = async () => {
    try {
      // Implementation depends on your backend export endpoint
      console.log('Export functionality - implement based on your backend');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alert Deliveries</h1>
                <p className="text-gray-600">Monitor and manage alert notification deliveries</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={TrendingUp}
              title="Total Deliveries"
              value={statistics.total_deliveries?.toLocaleString() || '0'}
              subtitle="All time"
              color="blue"
            />
            <StatCard
              icon={CheckCircle2}
              title="Success Rate"
              value={`${statistics.success_rate || 0}%`}
              subtitle="Overall performance"
              color="green"
            />
            <StatCard
              icon={XCircle}
              title="Failed Deliveries"
              value={statistics.by_status?.failed || 0}
              subtitle="Needs attention"
              color="red"
            />
            <StatCard
              icon={Users}
              title="Read Notifications"
              value={statistics.by_status?.read || 0}
              subtitle="User engagement"
              color="blue"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search users..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <select
                value={filters.delivery_method}
                onChange={(e) => handleFilterChange('delivery_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Methods</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
                <option value="email">Email</option>
                <option value="web">Web</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="read">Read</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  search: '', delivery_method: '', status: '', alert: '', start_date: '', end_date: ''
                })}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Delivery Records ({deliveries.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method & User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivered At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveries.map((delivery) => (
                  <DeliveryRow
                    key={delivery.id}
                    delivery={delivery}
                    onMarkAsRead={handleMarkAsRead}
                    expandedRow={expandedRow}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
                {deliveries.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
                        <p className="text-gray-600">Try adjusting your filters or check back later.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}