import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Import useTranslation for the 't' function and i18n instance
import { useTranslation } from 'react-i18next';
// Import useLanguage from your context
import { useLanguage } from '../../contexts/LanguageContext'; 
import {
  Shield, Users, Settings, BarChart3, AlertTriangle,
  Activity, CheckCircle, XCircle, RefreshCw, FileText,
  Clock, Bell, Radio, Eye, TrendingUp, PieChart, Info
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext'; // Assuming correct AuthContext path
import apiService from '../../services/api';

const AdminDashboard = () => {
  // Initialize i18n hook and get the i18n instance
  const { t, i18n } = useTranslation();
  // Initialize Language Context hook
  const { languageKey } = useLanguage(); 
    
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

  // Helper: Safely parse dates
  const safeDateParse = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Date parse error:', dateString, e);
      return null;
    }
  };

  // Helper: Filter data by today's date
  const filterToday = (data, dateKey = 'created_at') => {
    if (!Array.isArray(data)) return 0;
    const today = new Date().toISOString().split('T')[0];
    return data.filter(item => {
      const itemDate = safeDateParse(item[dateKey]);
      return itemDate === today;
    }).length;
  };

  // Helper: Prepare chart data
  const prepareChartData = (users, alerts, incidents, healthData) => {
    const weeklyTrend = [];
    const today = new Date();
    
    // Ensure we have a valid locale
    const currentLocale = i18n.language || 'en-US';
    const safeLocale = ['en', 'en-US', 'fr', 'rw', 'sw', 'fr-FR', 'rw-RW', 'sw-KE'].includes(currentLocale) 
      ? currentLocale 
      : 'en-US';

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Use safe locale to get the translated short day name
      let dayName;
      try {
        dayName = date.toLocaleDateString(safeLocale, { weekday: 'short' });
      } catch (e) {
        console.error('Locale error, falling back to English:', e);
        dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      }

      // Safely count users
      const dayUsers = users.filter(u => {
        const userDate = safeDateParse(u.date_joined || u.created_at);
        return userDate === dateStr;
      }).length;

      // Safely count alerts
      const dayAlerts = alerts.filter(a => {
        const alertDate = safeDateParse(a.created_at || a.issued_at);
        return alertDate === dateStr;
      }).length;

      // Safely count incidents
      const dayIncidents = incidents.filter(inc => {
        const incidentDate = safeDateParse(inc.created_at);
        return incidentDate === dateStr;
      }).length;

      weeklyTrend.push({ day: dayName, date: dateStr, users: dayUsers, alerts: dayAlerts, incidents: dayIncidents });
    }

    // Alerts by Type (Severity)
    const severityCount = alerts.reduce((acc, alert) => {
      const severity = (alert.severity || alert.alert_severity || alert.severity_level || 'unknown').toLowerCase();
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    const alertsByType = Object.entries(severityCount).map(([severity, count]) => ({
      name: t(`severity.${severity}`, { defaultValue: severity.charAt(0).toUpperCase() + severity.slice(1) }),
      value: count,
      color:
        severity === 'extreme' || severity === 'critical' ? '#dc2626' : // Red
        severity === 'severe' || severity === 'high' ? '#ea580c' : // Orange
        severity === 'moderate' || severity === 'medium' ? '#d97706' : // Amber
        severity === 'minor' || severity === 'low' ? '#2563eb' : '#6b7280' // Blue/Gray
    }));

    // Incidents by Status
    const statusCount = incidents.reduce((acc, incident) => {
      const status = (incident.status || incident.incident_status || 'unknown').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const incidentsByStatus = Object.entries(statusCount).map(([status, count]) => ({
      // Use i18n for status names (e.g., status.resolved, status.pendingVerification)
      name: t(`status.${status.replace(/ /g, '')}`, { defaultValue: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1) }),
      value: count,
      color:
        status === 'resolved' ? '#16a34a' : // Green
        status === 'verified' || status === 'active' ? '#2563eb' : // Blue
        status === 'under_review' || status === 'pending' ? '#d97706' : // Amber
        status === 'submitted' || status === 'open' ? '#6b7280' : '#dc2626' // Gray/Red
    }));

    // System Health
    const smsStatus = healthData.sms_gateway_status || healthData.sms_status || (healthData.sms ? 'operational' : 'down');
    const pushStatus = healthData.push_service_status || healthData.push_status || (healthData.push ? 'operational' : 'down');
    const emailStatus = healthData.email_service_status || healthData.email_status || (healthData.email ? 'operational' : 'down');

    const getServiceColor = (status) => {
      const s = status.toLowerCase();
      if (s === 'operational' || s === 'healthy' || s === 'online') return '#16a34a'; // Green
      if (s === 'degraded' || s === 'warning') return '#d97706'; // Amber
      return '#dc2626'; // Red/Down
    };

    const getServiceValue = (status) => {
      const s = status.toLowerCase();
      if (s === 'operational' || s === 'healthy' || s === 'online') return 100;
      if (s === 'degraded' || s === 'warning') return 75;
      return 25;
    };

    const systemHealth = [
      { name: t('systemStatus.smsGateway', { defaultValue: 'SMS Gateway' }), status: t(`systemStatus.${smsStatus.toLowerCase()}`, { defaultValue: smsStatus.charAt(0).toUpperCase() + smsStatus.slice(1) }), value: getServiceValue(smsStatus), color: getServiceColor(smsStatus) },
      { name: t('systemStatus.pushService', { defaultValue: 'Push Service' }), status: t(`systemStatus.${pushStatus.toLowerCase()}`, { defaultValue: pushStatus.charAt(0).toUpperCase() + pushStatus.slice(1) }), value: getServiceValue(pushStatus), color: getServiceColor(pushStatus) },
      { name: t('systemStatus.emailService', { defaultValue: 'Email Service' }), status: t(`systemStatus.${emailStatus.toLowerCase()}`, { defaultValue: emailStatus.charAt(0).toUpperCase() + emailStatus.slice(1) }), value: getServiceValue(emailStatus), color: getServiceColor(emailStatus) }
    ];

    return { weeklyTrend, alertsByType, incidentsByStatus, systemHealth };
  };

  // Load data with enhanced debugging
  const loadData = async () => {
    setLoading(true);
    setIsRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 Starting data load...');
      
      const [users, alerts, incidents, systemHealth] = await Promise.allSettled([
        apiService.getUsers({ page_size: 1000 }),
        apiService.getAlerts({ page_size: 1000 }),
        apiService.getIncidents({ page_size: 1000 }),
        apiService.getSystemHealth()
      ]);

      // Enhanced error logging
      if (users.status === 'rejected') console.error('❌ Users API failed:', users.reason);
      if (alerts.status === 'rejected') console.error('❌ Alerts API failed:', alerts.reason);
      if (incidents.status === 'rejected') console.error('❌ Incidents API failed:', incidents.reason);
      if (systemHealth.status === 'rejected') console.error('❌ System Health API failed:', systemHealth.reason);

      const usersData = users.status === 'fulfilled' ? (users.value?.results || users.value || []) : [];
      const alertsData = alerts.status === 'fulfilled' ? (alerts.value?.results || alerts.value || []) : [];
      const incidentsData = incidents.status === 'fulfilled' ? (incidents.value?.results || incidents.value || []) : [];
      const healthData = systemHealth.status === 'fulfilled' ? systemHealth.value : {};
      
      console.log('📊 Data Retrieved:');
      console.log('  Users:', usersData.length, usersData.length > 0 ? usersData[0] : 'empty');
      console.log('  Alerts:', alertsData.length, alertsData.length > 0 ? alertsData[0] : 'empty');
      console.log('  Incidents:', incidentsData.length, incidentsData.length > 0 ? incidentsData[0] : 'empty');
      console.log('  Health:', healthData);

      // Validate data types
      if (!Array.isArray(usersData)) {
        console.warn('⚠️ usersData is not an array:', typeof usersData);
      }
      if (!Array.isArray(alertsData)) {
        console.warn('⚠️ alertsData is not an array:', typeof alertsData);
      }
      if (!Array.isArray(incidentsData)) {
        console.warn('⚠️ incidentsData is not an array:', typeof incidentsData);
      }

      const pendingIncidentsCount = incidentsData.filter(i => 
        ['submitted', 'under_review', 'pending_review', 'pending'].includes(i.status)
      ).length;
      
      const activeAlertsCount = alertsData.filter(a => 
        ['active', 'sent', 'published'].includes(a.status)
      ).length;

      console.log('📈 Calculated Stats:');
      console.log('  Pending Incidents:', pendingIncidentsCount);
      console.log('  Active Alerts:', activeAlertsCount);
      console.log('  New Users Today:', filterToday(usersData, 'date_joined'));
      console.log('  Alerts Today:', filterToday(alertsData, 'created_at'));
      console.log('  Incidents Today:', filterToday(incidentsData, 'created_at'));

      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        activeAlerts: activeAlertsCount,
        pendingIncidents: pendingIncidentsCount,
        systemUptime: healthData.uptime_percentage || healthData.uptime || 99.9,
        newUsersToday: filterToday(usersData, 'date_joined'),
        alertsToday: filterToday(alertsData, 'created_at'),
        incidentsToday: filterToday(incidentsData, 'created_at'),
        systemStatus: {
          sms: healthData.sms_gateway_status === 'healthy' || healthData.sms_status === 'online' || healthData.sms === true,
          push: healthData.push_service_status === 'healthy' || healthData.push_status === 'online' || healthData.push === true,
          email: healthData.email_service_status === 'healthy' || healthData.email_status === 'online' || healthData.email === true
        }
      }));

      const charts = prepareChartData(usersData, alertsData, incidentsData, healthData);
      
      console.log('📉 Chart Data Prepared:');
      console.log('  Weekly Trend (7 days):', charts.weeklyTrend);
      console.log('  Alerts by Type:', charts.alertsByType);
      console.log('  Incidents by Status:', charts.incidentsByStatus);
      console.log('  System Health:', charts.systemHealth);
      
      setChartData(charts);
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (err) {
      console.error('❌ Dashboard loading error:', err);
      const errorMessage = err instanceof RangeError 
        ? t('messages.languageError', { defaultValue: 'Language Error: Could not format date names. Please ensure i18n is configured correctly.' }) 
        : (err.message || 'Unknown error');
      setError(t('messages.networkError', { defaultValue: `Failed to load dashboard data: ${errorMessage}` }));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // EFFECT DEPENDS ON languageKey
  useEffect(() => {
    // Rerun data loading/chart preparation when language changes
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageKey]); // Depend on languageKey from LanguageContext to refresh translations

  // Placeholder data for empty charts (using i18n for 'No Data')
  const placeholderChartData = {
    weeklyTrend: [
      { day: t('mon', { defaultValue: 'Mon' }), users: 0, alerts: 0, incidents: 0 },
      { day: t('tue', { defaultValue: 'Tue' }), users: 0, alerts: 0, incidents: 0 },
      { day: t('wed', { defaultValue: 'Wed' }), users: 0, alerts: 0, incidents: 0 },
      { day: t('thu', { defaultValue: 'Thu' }), users: 0, alerts: 0, incidents: 0 },
      { day: t('fri', { defaultValue: 'Fri' }), users: 0, alerts: 0, incidents: 0 },
      { day: t('sat', { defaultValue: 'Sat' }), users: 0, alerts: 0, incidents: 0 },
      { day: t('sun', { defaultValue: 'Sun' }), users: 0, alerts: 0, incidents: 0 }
    ],
    alertsByType: [
      { name: t('noData', { defaultValue: 'No Data' }), value: 1, color: '#6b7280' }
    ],
    incidentsByStatus: [
      { name: t('noData', { defaultValue: 'No Data' }), value: 1, color: '#6b7280' }
    ],
    systemHealth: [
      { name: t('systemStatus.smsGateway', { defaultValue: 'SMS Gateway' }), status: t('systemStatus.unknown', { defaultValue: 'Unknown' }), value: 50, color: '#6b7280' },
      { name: t('systemStatus.pushService', { defaultValue: 'Push Service' }), status: t('systemStatus.unknown', { defaultValue: 'Unknown' }), value: 50, color: '#6b7280' },
      { name: t('systemStatus.emailService', { defaultValue: 'Email Service' }), status: t('systemStatus.unknown', { defaultValue: 'Unknown' }), value: 50, color: '#6b7280' }
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard', { defaultValue: 'Admin Dashboard' })}</h1>
          <p className="text-gray-600">{t('nav.systemOverviewDesc', { defaultValue: 'System overview and management' })}</p>
        </div>
        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-150"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? t('loading', { defaultValue: 'Loading...' }) : t('actions.refresh', { defaultValue: 'Refresh' })}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700 font-medium">{t('error', { defaultValue: 'Error' })}: {error}</p>
          </div>
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-lg shadow border transition duration-150 hover:shadow-lg">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-grow">
              <p className="text-sm text-gray-600">{t('nav.users', { defaultValue: 'Total Users' })}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.newUsersToday} {t('nav.users', { defaultValue: 'users' })} {t('badges.new', { defaultValue: 'new' })} {t('today', { defaultValue: 'today' })}
          </div>
        </div>
        
        {/* Active Alerts */}
        <div className="bg-white p-6 rounded-lg shadow border transition duration-150 hover:shadow-lg">
          <div className="flex items-start">
            <div className="bg-red-100 p-3 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4 flex-grow">
              <p className="text-sm text-gray-600">{t('nav.activeAlerts', { defaultValue: 'Active Alerts' })}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeAlerts}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.alertsToday} {t('nav.alerts', { defaultValue: 'alerts' })} {t('issued', { defaultValue: 'issued' })} {t('today', { defaultValue: 'today' })}
          </div>
        </div>
        
        {/* Pending Incidents */}
        <div className="bg-white p-6 rounded-lg shadow border transition duration-150 hover:shadow-lg">
          <div className="flex items-start">
            <div className="bg-yellow-100 p-3 rounded-lg flex-shrink-0">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4 flex-grow">
              <p className="text-sm text-gray-600">{t('nav.pendingReview', { defaultValue: 'Pending Incidents' })}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingIncidents}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.incidentsToday} {t('nav.incidents', { defaultValue: 'incidents' })} {t('reported', { defaultValue: 'reported' })} {t('today', { defaultValue: 'today' })}
          </div>
        </div>
        
        {/* System Health Status */}
        <div className="bg-white p-6 rounded-lg shadow border transition duration-150 hover:shadow-lg">
          <div className="flex items-start">
            <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4 flex-grow">
              <p className="text-sm text-gray-600">{t('systemStatus.title', { defaultValue: 'System Status' })}</p>
              <p className={`text-3xl font-bold ${stats.systemUptime >= 99 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.systemUptime}%
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.systemStatus.sms && stats.systemStatus.push && stats.systemStatus.email ? t('systemStatus.operational', { defaultValue: 'All services operational' }) : t('systemStatus.degraded', { defaultValue: 'Service Degradation' })}
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
              {t('nav.weeklyActivityTrend', { defaultValue: 'Weekly Activity Trend' })}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.weeklyTrend.length ? chartData.weeklyTrend : placeholderChartData.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: '#e0e0e0' }} />
              <YAxis tickLine={false} axisLine={{ stroke: '#e0e0e0' }} />
              <Tooltip formatter={(value, name) => [value, t(name, { defaultValue: name })]} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" name={t('nav.users', { defaultValue: 'Users' })} dataKey="users" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
              <Area type="monotone" name={t('nav.alerts', { defaultValue: 'Alerts' })} dataKey="alerts" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.4} />
              <Area type="monotone" name={t('nav.incidents', { defaultValue: 'Incidents' })} dataKey="incidents" stackId="1" stroke="#d97706" fill="#d97706" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts by Severity */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              {t('nav.alertsBySeverity', { defaultValue: 'Alerts by Severity' })}
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
                innerRadius={50}
                fill="#8884d8"
                labelLine={false}
              >
                {(chartData.alertsByType.length ? chartData.alertsByType : placeholderChartData.alertsByType).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => [value, t('count', { defaultValue: 'Count' })]} />
              <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ paddingLeft: '10px' }} />
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
              {t('nav.incidentsByStatus', { defaultValue: 'Incidents by Status' })}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.incidentsByStatus.length ? chartData.incidentsByStatus : placeholderChartData.incidentsByStatus} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" tickLine={false} axisLine={{ stroke: '#e0e0e0' }} />
              <YAxis dataKey="name" type="category" width={100} tickLine={false} axisLine={{ stroke: '#e0e0e0' }} />
              <Tooltip />
              <Bar dataKey="value" name={t('count', { defaultValue: 'Count' })} radius={[4, 4, 0, 0]}>
                {(chartData.incidentsByStatus.length ? chartData.incidentsByStatus : placeholderChartData.incidentsByStatus).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Health Overview */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              {t('systemStatus.title', { defaultValue: 'System Health Overview' })}
            </h3>
          </div>
          <div className="space-y-4">
            {(chartData.systemHealth.length && chartData.systemHealth[0].value !== 50 
              ? chartData.systemHealth : placeholderChartData.systemHealth).map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: service.color }} />
                  <span className="font-medium text-gray-700">{service.name}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-semibold`} style={{ color: service.color }}>
                    {service.status}
                  </span>
                  <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full`} style={{ width: `${service.value}%`, backgroundColor: service.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">{t('overallUptime', { defaultValue: 'Overall Uptime' })}</span>
              <span className="text-xl font-bold text-blue-700">{stats.systemUptime}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;