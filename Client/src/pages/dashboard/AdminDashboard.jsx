import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Settings, BarChart3, AlertTriangle, 
  Activity, CheckCircle, XCircle, RefreshCw, FileText,
  Clock, Bell, Radio, Eye, TrendingUp, Map, Database
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts';
import apiService from '../../services/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      
      // Use existing API methods to build dashboard data
      const [
        usersData,
        alertsData, 
        activeAlerts,
        incidentsData,
        healthData,
        dashboardData
      ] = await Promise.all([
        apiService.getUsers({ page_size: 1 }).catch(() => ({ results: [], count: 0 })),
        apiService.getAlerts({ page_size: 10 }).catch(() => ({ results: [], count: 0 })),
        apiService.getActiveAlerts().catch(() => []),
        apiService.getIncidents({ page_size: 10 }).catch(() => ({ results: [], count: 0 })),
        apiService.getSystemHealth().catch(() => ({ status: 'unknown', services: {} })),
        apiService.getDashboard().catch(() => ({}))
      ]);

      // Build consolidated dashboard data
      const consolidatedData = {
        users: {
          total: usersData.count || 0,
          new_today: dashboardData.new_users_today || 0,
          active_24h: dashboardData.active_users_24h || 0,
          by_role: dashboardData.users_by_role || {},
          growth_7d: dashboardData.user_growth_7d || []
        },
        alerts: {
          active: Array.isArray(activeAlerts) ? activeAlerts.length : 0,
          sent_today: dashboardData.alerts_sent_today || 0,
          sent_7d: dashboardData.alerts_sent_7d || 0,
          delivery_rate: dashboardData.alert_delivery_rate || 0,
          by_type: dashboardData.alerts_by_type || [],
          recent_activity: dashboardData.alert_activity_7d || []
        },
        incidents: {
          pending: incidentsData.results?.filter(i => i.status === 'pending').length || 0,
          reported_today: dashboardData.incidents_reported_today || 0,
          resolved_today: dashboardData.incidents_resolved_today || 0,
          by_status: dashboardData.incidents_by_status || [],
          severity_distribution: dashboardData.incidents_by_severity || []
        },
        system: {
          uptime: dashboardData.system_uptime || healthData.uptime || 0,
          services: healthData.services || {},
          performance: dashboardData.system_performance || []
        },
        approvals: {
          pending_users: dashboardData.pending_user_approvals || 0,
          pending_incidents: dashboardData.pending_incident_approvals || 0,
          pending_guides: dashboardData.pending_guide_approvals || 0
        }
      };
      
      setDashboardData(consolidatedData);
      setSystemHealth(healthData);
      
      console.log('Dashboard data loaded:', consolidatedData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const navigateToPage = (path) => {
    // Replace with your routing logic
    console.log(`Navigating to: ${path}`);
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => loadDashboardData()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Extract data with safe defaults
  const users = dashboardData?.users || {};
  const alerts = dashboardData?.alerts || {};
  const incidents = dashboardData?.incidents || {};
  const system = dashboardData?.system || {};
  const approvals = dashboardData?.approvals || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Real-time system analytics and management</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users?.total?.toLocaleString() || '0'}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{users?.new_today || 0} today
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts?.active || 0}</p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Radio className="w-3 h-3 mr-1" />
                {alerts?.delivery_rate || 0}% delivery rate
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{incidents?.pending || 0}</p>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {incidents?.reported_today || 0} reported today
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-gray-900">{system?.uptime || 0}%</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <Activity className="w-3 h-3 mr-1" />
                All services online
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Database className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">User Growth (7 Days)</h2>
          </div>
          <div className="p-6">
            {users?.growth_7d?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={users.growth_7d}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value.toLocaleString(), 'Users']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No growth data available
              </div>
            )}
          </div>
        </div>

        {/* Alert Activity */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Alert Activity (7 Days)</h2>
          </div>
          <div className="p-6">
            {alerts?.recent_activity?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={alerts.recent_activity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value, 'Alerts Sent']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="alerts" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No alert activity data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Distribution */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Users by Role</h2>
          </div>
          <div className="p-6">
            {users?.by_role && Object.keys(users.by_role).length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(users.by_role).map(([role, count]) => ({
                        name: role.charAt(0).toUpperCase() + role.slice(1),
                        value: count,
                        color: role === 'citizen' ? '#3B82F6' : role === 'operator' ? '#10B981' : 
                               role === 'authority' ? '#F59E0B' : '#EF4444'
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {Object.entries(users.by_role).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry[0] === 'citizen' ? '#3B82F6' : entry[0] === 'operator' ? '#10B981' : 
                          entry[0] === 'authority' ? '#F59E0B' : '#EF4444'
                        } />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {Object.entries(users.by_role).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          role === 'citizen' ? 'bg-blue-500' : role === 'operator' ? 'bg-green-500' : 
                          role === 'authority' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </div>
                      <span className="font-medium">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No user role data available
              </div>
            )}
          </div>
        </div>

        {/* Alert Types */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Alert Types (30 Days)</h2>
          </div>
          <div className="p-6">
            {alerts?.by_type?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={alerts.by_type} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip formatter={(value) => [value, 'Alerts']} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No alert type data available
              </div>
            )}
          </div>
        </div>

        {/* Incident Status */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Incident Status</h2>
          </div>
          <div className="p-6">
            {incidents?.by_status?.length > 0 ? (
              <div className="space-y-3">
                {incidents.by_status.map((status) => (
                  <div key={status.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{status.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{status.count}</div>
                      <div className="text-xs text-gray-500">
                        {((status.count / incidents.by_status.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No incident status data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Performance */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">System Performance</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Response Time (ms)</h3>
              {system?.performance?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={system.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}ms`, 'Response Time']} />
                    <Area 
                      type="monotone" 
                      dataKey="response_time" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  No performance data available
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Service Status</h3>
              {system?.services && Object.keys(system.services).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(system.services).map(([service, status]) => (
                    <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {service.replace('_', ' ')}
                      </span>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-600 capitalize">{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  No service status data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {(approvals?.pending_users > 0 || approvals?.pending_incidents > 0 || approvals?.pending_guides > 0) && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {(approvals?.pending_users || 0) + (approvals?.pending_incidents || 0) + (approvals?.pending_guides || 0)} total
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {approvals?.pending_users > 0 && (
                <div className="text-center p-4 border rounded-lg">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{approvals.pending_users}</p>
                  <p className="text-sm text-gray-600">User Accounts</p>
                  <button
                    onClick={() => navigateToPage('/admin/users')}
                    className="mt-2 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Review →
                  </button>
                </div>
              )}
              {approvals?.pending_incidents > 0 && (
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{approvals.pending_incidents}</p>
                  <p className="text-sm text-gray-600">Incident Reports</p>
                  <button
                    onClick={() => navigateToPage('/incidents')}
                    className="mt-2 inline-block text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    Review →
                  </button>
                </div>
              )}
              {approvals?.pending_guides > 0 && (
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{approvals.pending_guides}</p>
                  <p className="text-sm text-gray-600">Safety Guides</p>
                  <button
                    onClick={() => navigateToPage('/safety-guides')}
                    className="mt-2 inline-block text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Review →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigateToPage('/admin/users')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors group text-left"
        >
          <Users className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Manage Users</h3>
          <p className="text-sm opacity-90">{users?.total?.toLocaleString() || '0'} registered</p>
        </button>

        <button
          onClick={() => navigateToPage('/alerts')}
          className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg transition-colors group text-left"
        >
          <Radio className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Alert System</h3>
          <p className="text-sm opacity-90">{alerts?.active || 0} currently active</p>
        </button>

        <button
          onClick={() => navigateToPage('/analytics')}
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors group text-left"
        >
          <BarChart3 className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Analytics</h3>
          <p className="text-sm opacity-90">Detailed reports</p>
        </button>

        <button
          onClick={() => navigateToPage('/admin/settings')}
          className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-lg transition-colors group text-left"
        >
          <Settings className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Settings</h3>
          <p className="text-sm opacity-90">System configuration</p>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;