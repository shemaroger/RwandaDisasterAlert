import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Settings, BarChart3, AlertTriangle,
  Activity, CheckCircle, XCircle, RefreshCw, FileText,
  Clock, Bell, Radio, Eye, TrendingUp, PieChart
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAlerts: 0,
    pendingIncidents: 0,
    systemUptime: 99.9,
    newUsersToday: 0,
    alertsToday: 0,
    incidentsToday: 0,
    pendingApprovals: 0,
    systemStatus: { sms: true, push: true, email: true }
  });
  const [chartData, setChartData] = useState({
    weeklyTrend: [],
    alertsByType: [],
    incidentsByStatus: [],
    systemHealth: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper: Extract count from API response
  const extractCount = (response) => {
    if (!response) return 0;
    if (Array.isArray(response)) return response.length;
    if (response?.count !== undefined) return response.count;
    if (response?.results?.length !== undefined) return response.results.length;
    if (response?.total !== undefined) return response.total;
    return 0;
  };

  // Helper: Filter data by today's date
  const filterToday = (data, dateKey = 'created_at') => {
    if (!Array.isArray(data)) return 0;
    const today = new Date().toISOString().split('T')[0];
    return data.filter(item => {
      const itemDate = new Date(item[dateKey]).toISOString().split('T')[0];
      return itemDate === today;
    }).length;
  };

  // Helper: Prepare chart data
  const prepareChartData = (users, alerts, incidents) => {
    // Weekly Trend
    const weeklyTrend = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      const dayUsers = users.filter(u => {
        const userDate = new Date(u.date_joined || u.created_at).toISOString().split('T')[0];
        return userDate === dateStr;
      }).length;

      const dayAlerts = alerts.filter(a => {
        const alertDate = new Date(a.created_at || a.issued_at).toISOString().split('T')[0];
        return alertDate === dateStr;
      }).length;

      const dayIncidents = incidents.filter(inc => {
        const incidentDate = new Date(inc.created_at).toISOString().split('T')[0];
        return incidentDate === dateStr;
      }).length;

      weeklyTrend.push({
        day: dayName,
        date: dateStr,
        users: dayUsers,
        alerts: dayAlerts,
        incidents: dayIncidents
      });
    }

    // Alerts by Type (Severity)
    const severityCount = alerts.reduce((acc, alert) => {
      const severity = alert.severity || alert.alert_severity || alert.severity_level || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    const alertsByType = Object.entries(severityCount).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
      color:
        severity === 'extreme' ? '#dc2626' :
        severity === 'severe' ? '#ea580c' :
        severity === 'moderate' ? '#d97706' :
        severity === 'minor' ? '#2563eb' : '#6b7280'
    }));

    // Incidents by Status
    const statusCount = incidents.reduce((acc, incident) => {
      const status = incident.status || incident.incident_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const incidentsByStatus = Object.entries(statusCount).map(([status, count]) => ({
      name: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
      value: count,
      color:
        status === 'resolved' ? '#16a34a' :
        status === 'verified' ? '#2563eb' :
        status === 'under_review' ? '#d97706' :
        status === 'submitted' ? '#6b7280' : '#dc2626'
    }));

    // System Health
    const systemHealth = [
      { name: 'SMS Gateway', status: 'Online', value: 100, color: '#16a34a' },
      { name: 'Push Service', status: 'Online', value: 100, color: '#16a34a' },
      { name: 'Email Service', status: 'Online', value: 100, color: '#16a34a' }
    ];

    return { weeklyTrend, alertsByType, incidentsByStatus, systemHealth };
  };

  // Load data
  const loadData = async () => {
    setLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [users, alerts, incidents, systemHealth] = await Promise.allSettled([
        apiService.getUsers({ page_size: 1000 }).catch(() => ({ results: [] })),
        apiService.getAlerts({ page_size: 1000 }).catch(() => ({ results: [] })),
        apiService.getIncidents({ page_size: 1000 }).catch(() => ({ results: [] })),
        apiService.getSystemHealth().catch(() => ({}))
      ]);

      // Log raw API responses for debugging
      console.log('Raw users data:', users.status === 'fulfilled' ? users.value : 'Failed');
      console.log('Raw alerts data:', alerts.status === 'fulfilled' ? alerts.value : 'Failed');
      console.log('Raw incidents data:', incidents.status === 'fulfilled' ? incidents.value : 'Failed');
      console.log('Raw system health data:', systemHealth.status === 'fulfilled' ? systemHealth.value : 'Failed');

      // Extract data or fallbacks
      const usersData = users.status === 'fulfilled' ? users.value.results || users.value || [] : [];
      const alertsData = alerts.status === 'fulfilled' ? alerts.value.results || alerts.value || [] : [];
      const incidentsData = incidents.status === 'fulfilled' ? incidents.value.results || incidents.value || [] : [];
      const healthData = systemHealth.status === 'fulfilled' ? systemHealth.value : {};

      // Log processed data
      console.log('Processed users:', usersData);
      console.log('Processed alerts:', alertsData);
      console.log('Processed incidents:', incidentsData);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        activeAlerts: alertsData.filter(a => a.status === 'active').length,
        pendingIncidents: incidentsData.filter(i => i.status === 'submitted' || i.status === 'under_review').length,
        systemUptime: healthData.uptime_percentage || healthData.uptime || 99.9,
        newUsersToday: filterToday(usersData),
        alertsToday: filterToday(alertsData),
        incidentsToday: filterToday(incidentsData),
        systemStatus: {
          sms: healthData.sms_gateway_status === 'healthy' || healthData.sms_status === 'online' || healthData.sms === true,
          push: healthData.push_service_status === 'healthy' || healthData.push_status === 'online' || healthData.push === true,
          email: healthData.email_service_status === 'healthy' || healthData.email_status === 'online' || healthData.email === true
        }
      }));

      // Prepare chart data
      const charts = prepareChartData(usersData, alertsData, incidentsData);
      console.log('Prepared chart data:', charts);
      setChartData(charts);

    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Placeholder data for empty charts
  const placeholderChartData = {
    weeklyTrend: [
      { day: 'Mon', users: 0, alerts: 0, incidents: 0 },
      { day: 'Tue', users: 0, alerts: 0, incidents: 0 },
      { day: 'Wed', users: 0, alerts: 0, incidents: 0 },
      { day: 'Thu', users: 0, alerts: 0, incidents: 0 },
      { day: 'Fri', users: 0, alerts: 0, incidents: 0 },
      { day: 'Sat', users: 0, alerts: 0, incidents: 0 },
      { day: 'Sun', users: 0, alerts: 0, incidents: 0 }
    ],
    alertsByType: [
      { name: 'No Data', value: 1, color: '#6b7280' }
    ],
    incidentsByStatus: [
      { name: 'No Data', value: 1, color: '#6b7280' }
    ],
    systemHealth: [
      { name: 'SMS Gateway', status: 'Unknown', value: 50, color: '#6b7280' },
      { name: 'Push Service', status: 'Unknown', value: 50, color: '#6b7280' },
      { name: 'Email Service', status: 'Unknown', value: 50, color: '#6b7280' }
    ]
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>
        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingIncidents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{stats.systemUptime}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Activity Trend */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Weekly Activity Trend
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.weeklyTrend.length ? chartData.weeklyTrend : placeholderChartData.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="users" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
              <Area type="monotone" dataKey="alerts" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
              <Area type="monotone" dataKey="incidents" stackId="1" stroke="#d97706" fill="#d97706" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts by Severity */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Alerts by Severity
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                dataKey="value"
                data={chartData.alertsByType.length ? chartData.alertsByType : placeholderChartData.alertsByType}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {chartData.alertsByType.length
                  ? chartData.alertsByType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                  : placeholderChartData.alertsByType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                }
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Incidents by Status */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-green-600" />
              Incidents by Status
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.incidentsByStatus.length ? chartData.incidentsByStatus : placeholderChartData.incidentsByStatus} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value">
                {chartData.incidentsByStatus.length
                  ? chartData.incidentsByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                  : placeholderChartData.incidentsByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Health Overview */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              System Health Overview
            </h3>
          </div>
          <div className="space-y-4">
            {(chartData.systemHealth.length ? chartData.systemHealth : placeholderChartData.systemHealth).map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${service.value === 100 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-gray-700">{service.name}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-semibold ${service.value === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {service.status}
                  </span>
                  <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${service.value === 100 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${service.value}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Overall Uptime</span>
              <span className="text-lg font-bold text-blue-700">{stats.systemUptime}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
