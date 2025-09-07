// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Bell, Users, Shield, MapPin, FileText, Activity,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, BarChart3,
  Zap, ThermometerSun, Cloud, Heart, Eye, Radio, MessageSquare,
  Plus, Calendar, Globe, Phone, Mail, Wifi, WifiOff, Server,
  ArrowUp, ArrowDown, Minus, TrendingDown, AlertCircle
} from 'lucide-react';

const Dashboard = ({
  user,
  stats = {},
  recentAlerts = [],
  recentIncidents = [],
  systemStatus = {},
  weatherData = {},
  onRefreshData,
  onCreateAlert,
  onViewAlert,
  onViewIncident,
  onQuickAction,
  onNavigate
}) => {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');

  useEffect(() => {
    // Set up auto-refresh for dashboard data every minute
    const interval = setInterval(() => {
      if (onRefreshData) {
        onRefreshData();
        setLastUpdated(new Date());
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [onRefreshData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (actionType) => {
    if (onQuickAction) {
      onQuickAction(actionType);
    }
  };

  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // Default stats structure with comprehensive emergency management metrics
  const dashboardStats = {
    activeAlerts: stats.activeAlerts || 0,
    totalIncidents: stats.totalIncidents || 0,
    pendingIncidents: stats.pendingIncidents || 0,
    totalSubscribers: stats.totalSubscribers || 0,
    alertsToday: stats.alertsToday || 0,
    incidentsToday: stats.incidentsToday || 0,
    systemUptime: stats.systemUptime || '99.9%',
    responseTime: stats.responseTime || '2.3s',
    deliveryRate: stats.deliveryRate || '98.5%',
    sheltersActive: stats.sheltersActive || 0,
    emergencyContacts: stats.emergencyContacts || 0,
    alertsSentToday: stats.alertsSentToday || 0,
    avgResponseTime: stats.avgResponseTime || '4.2min'
  };

  // Enhanced stats cards with trends and comparisons
  const statsCards = [
    {
      name: 'Active Alerts',
      value: dashboardStats.activeAlerts,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100',
      trend: dashboardStats.alertsToday > 0 ? `+${dashboardStats.alertsToday} today` : 'No alerts today',
      trendColor: dashboardStats.alertsToday > 0 ? 'text-red-600' : 'text-green-600',
      trendIcon: dashboardStats.alertsToday > 0 ? ArrowUp : Minus,
      action: () => handleNavigation('alerts')
    },
    {
      name: 'Open Incidents',
      value: dashboardStats.pendingIncidents,
      icon: FileText,
      color: 'text-yellow-600 bg-yellow-100',
      trend: dashboardStats.pendingIncidents > 0 ? 'Requires attention' : 'All resolved',
      trendColor: dashboardStats.pendingIncidents > 0 ? 'text-yellow-600' : 'text-green-600',
      trendIcon: dashboardStats.pendingIncidents > 0 ? AlertCircle : CheckCircle,
      action: () => handleNavigation('incidents')
    },
    {
      name: 'Total Subscribers',
      value: dashboardStats.totalSubscribers.toLocaleString(),
      icon: Users,
      color: 'text-green-600 bg-green-100',
      trend: 'Coverage ready',
      trendColor: 'text-green-600',
      trendIcon: TrendingUp,
      action: () => handleNavigation('subscribers')
    },
    {
      name: 'Active Shelters',
      value: dashboardStats.sheltersActive,
      icon: Shield,
      color: 'text-blue-600 bg-blue-100',
      trend: 'Emergency ready',
      trendColor: 'text-blue-600',
      trendIcon: Shield,
      action: () => handleNavigation('shelters')
    }
  ];

  // Performance metrics for emergency response
  const performanceMetrics = [
    {
      name: 'Avg Response Time',
      value: dashboardStats.avgResponseTime,
      target: '< 5min',
      status: 'good',
      icon: Clock
    },
    {
      name: 'Alert Delivery Rate',
      value: dashboardStats.deliveryRate,
      target: '> 95%',
      status: 'excellent',
      icon: Radio
    },
    {
      name: 'System Uptime',
      value: dashboardStats.systemUptime,
      target: '> 99%',
      status: 'excellent',
      icon: Activity
    },
    {
      name: 'Network Coverage',
      value: '96.8%',
      target: '> 95%',
      status: 'good',
      icon: Wifi
    }
  ];

  // System status with detailed service monitoring
  const systemServices = [
    {
      name: 'SMS Gateway',
      status: systemStatus.smsGateway || 'Online',
      responseTime: '120ms',
      icon: MessageSquare,
      health: 'operational'
    },
    {
      name: 'Push Service',
      status: systemStatus.pushService || 'Active',
      responseTime: '85ms',
      icon: Bell,
      health: 'operational'
    },
    {
      name: 'Email Service',
      status: systemStatus.emailService || 'Active',
      responseTime: '340ms',
      icon: Mail,
      health: systemStatus.emailService === 'Slow' ? 'warning' : 'operational'
    },
    {
      name: 'Database',
      status: 'Operational',
      responseTime: '15ms',
      icon: Server,
      health: 'operational'
    },
    {
      name: 'Weather API',
      status: weatherData.status || 'Connected',
      responseTime: '250ms',
      icon: Cloud,
      health: 'operational'
    },
    {
      name: 'GIS Service',
      status: 'Online',
      responseTime: '180ms',
      icon: MapPin,
      health: 'operational'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'watch':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'triaged':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Emergency Management Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, {user?.first_name}. Monitor and manage emergency response operations for Rwanda.
          </p>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <span>Role: {user?.role}</span>
            <span>•</span>
            <span>District: {user?.district}</span>
            <span>•</span>
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
          <div 
            key={index} 
            className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={card.action}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {card.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <card.trendIcon className={`w-4 h-4 mr-1 ${card.trendColor}`} />
                <div className={`text-sm font-medium ${card.trendColor}`}>
                  {card.trend}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Emergency Response Performance
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(metric.status)}`}>
                  <metric.icon className="w-6 h-6" />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-900">{metric.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{metric.value}</p>
                  <p className="text-xs text-gray-500">Target: {metric.target}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Emergency Alerts
              </h3>
              <div className="flex items-center space-x-2">
                {(user?.role === 'admin' || user?.role === 'operator') && (
                  <button
                    onClick={() => handleQuickAction('emergency')}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Alert
                  </button>
                )}
                <button
                  onClick={() => handleNavigation('alerts')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  View All
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentAlerts.length > 0 ? (
              recentAlerts.slice(0, 8).map((alert) => (
                <div key={alert.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className={`w-4 h-4 ${
                          alert.severity === 'emergency' ? 'text-red-600' :
                          alert.severity === 'warning' ? 'text-orange-600' :
                          alert.severity === 'watch' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {alert.title_en || alert.title_rw}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          alert.status === 'sent' ? 'bg-green-100 text-green-800' :
                          alert.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                          alert.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {alert.message_en || alert.message_rw}
                      </p>
                      <div className="flex items-center text-xs text-gray-400 space-x-4">
                        <span>Type: {alert.type}</span>
                        <span>Channels: {alert.channels?.join(', ')}</span>
                        <span>Created: {formatTimeAgo(alert.created_at)}</span>
                        {alert.total_delivered > 0 && (
                          <span>Delivered: {alert.total_delivered}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => onViewAlert && onViewAlert(alert.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent alerts</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Emergency alerts will appear here when created.
                </p>
                {(user?.role === 'admin' || user?.role === 'operator') && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleQuickAction('emergency')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Create First Alert
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Incidents
              </h3>
              <button
                onClick={() => handleNavigation('incidents')}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentIncidents.length > 0 ? (
              recentIncidents.slice(0, 6).map((incident) => (
                <div key={incident.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {incident.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {incident.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-400 space-x-3">
                        <span className="capitalize">{incident.incident_type}</span>
                        <span>{formatTimeAgo(incident.created_at)}</span>
                        {incident.subscriber_phone && (
                          <span>📱 {incident.subscriber_phone}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => onViewIncident && onViewIncident(incident.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent incidents</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Citizen reports will appear here when submitted.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status & Services */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              System Status & Services
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(service.health)}`}>
                    <service.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{service.responseTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions for Admin/Operator */}
      {(user?.role === 'admin' || user?.role === 'operator') && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Emergency Response Actions
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => handleQuickAction('emergency')}
                className="flex flex-col items-center justify-center px-4 py-6 border-2 border-red-300 border-dashed rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors group"
              >
                <AlertTriangle className="mb-2 h-8 w-8 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Emergency Broadcast</span>
                <span className="text-xs text-red-600">Immediate Alert</span>
              </button>
              <button 
                onClick={() => handleNavigation('analytics')}
                className="flex flex-col items-center justify-center px-4 py-6 border-2 border-blue-300 border-dashed rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors group"
              >
                <BarChart3 className="mb-2 h-8 w-8 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">View Analytics</span>
                <span className="text-xs text-blue-600">Performance Data</span>
              </button>
              <button 
                onClick={() => handleNavigation('geozones')}
                className="flex flex-col items-center justify-center px-4 py-6 border-2 border-green-300 border-dashed rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors group"
              >
                <MapPin className="mb-2 h-8 w-8 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Manage Zones</span>
                <span className="text-xs text-green-600">Geographic Areas</span>
              </button>
              <button 
                onClick={() => handleNavigation('monitoring')}
                className="flex flex-col items-center justify-center px-4 py-6 border-2 border-purple-300 border-dashed rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors group"
              >
                <Eye className="mb-2 h-8 w-8 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Live Monitoring</span>
                <span className="text-xs text-purple-600">Real-time View</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weather Information (if available) */}
      {weatherData && Object.keys(weatherData).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm rounded-lg border border-blue-200">
          <div className="px-6 py-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Cloud className="mr-2 h-5 w-5 text-blue-600" />
                Current Weather Conditions
              </h3>
              <span className="text-sm text-blue-600">
                Last updated: {weatherData.lastUpdated || 'N/A'}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <ThermometerSun className="mx-auto h-8 w-8 text-orange-500" />
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {weatherData.temperature || 'N/A'}°C
                </p>
                <p className="text-sm text-gray-600">Temperature</p>
              </div>
              <div className="text-center">
                <Cloud className="mx-auto h-8 w-8 text-blue-500" />
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {weatherData.humidity || 'N/A'}%
                </p>
                <p className="text-sm text-gray-600">Humidity</p>
              </div>
              <div className="text-center">
                <Activity className="mx-auto h-8 w-8 text-green-500" />
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {weatherData.windSpeed || 'N/A'} km/h
                </p>
                <p className="text-sm text-gray-600">Wind Speed</p>
              </div>
              <div className="text-center">
                <Bell className="mx-auto h-8 w-8 text-yellow-500" />
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {weatherData.alerts || 'None'}
                </p>
                <p className="text-sm text-gray-600">Weather Alerts</p>
              </div>
            </div>
            {weatherData.conditions && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>Current Conditions:</strong> {weatherData.conditions}
                </p>
                {weatherData.forecast && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>24h Forecast:</strong> {weatherData.forecast}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contacts & Resources (for citizens) */}
      {user?.role === 'citizen' && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Phone className="mr-2 h-5 w-5 text-red-600" />
              Emergency Contacts & Resources
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">Emergency Services</h4>
                <p className="text-xl font-bold text-red-600 mt-1">112</p>
                <p className="text-xs text-gray-500">Police, Fire, Medical</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">MINEMA</h4>
                <p className="text-lg font-bold text-blue-600 mt-1">+250-788-000-000</p>
                <p className="text-xs text-gray-500">Emergency Management</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">Health Emergency</h4>
                <p className="text-lg font-bold text-green-600 mt-1">+250-788-111-222</p>
                <p className="text-xs text-gray-500">Medical Emergency Line</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Emergency Preparedness</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Stay informed about weather conditions and follow evacuation instructions. 
                    Keep emergency supplies ready and know your nearest shelter location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Log */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent System Activity
          </h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
          <div className="px-6 py-3 flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">System health check completed</span>
            <span className="text-gray-400">2 min ago</span>
          </div>
          <div className="px-6 py-3 flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Weather data synchronized</span>
            <span className="text-gray-400">5 min ago</span>
          </div>
          <div className="px-6 py-3 flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">SMS gateway connection restored</span>
            <span className="text-gray-400">12 min ago</span>
          </div>
          <div className="px-6 py-3 flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Database backup completed</span>
            <span className="text-gray-400">1 hour ago</span>
          </div>
          <div className="px-6 py-3 flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">User subscription count updated</span>
            <span className="text-gray-400">2 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;