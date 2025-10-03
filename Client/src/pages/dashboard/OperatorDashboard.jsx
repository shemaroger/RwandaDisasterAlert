// OperatorDashboard.jsx - Complete with Charts and Better Data Handling
import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Users, MapPin, Clock, CheckCircle, XCircle,
  MessageSquare, FileText, Eye, ArrowUp, ArrowDown, RefreshCw,
  Download, Target, Radio, TrendingUp, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const OperatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState({
    activeAlerts: 0,
    pendingIncidents: 0,
    resolvedToday: 0,
    activeUsers: 0,
    responseTime: '0 min',
    alertsChange: 0,
    incidentsChange: 0,
    resolvedChange: 0,
    usersChange: 0
  });
  
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [error, setError] = useState(null);
  
  // Chart data states
  const [chartData, setChartData] = useState({
    incidentTrend: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      submitted: [5, 8, 6, 12, 9, 4, 7],
      resolved: [4, 6, 8, 10, 11, 5, 6]
    },
    alertsByType: {
      emergency: 5,
      weather: 8,
      health: 3,
      security: 6,
      other: 2
    },
    incidentsByPriority: {
      p1: 8,
      p2: 15,
      p3: 22,
      p4: 10,
      p5: 5
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadAlerts(),
        loadIncidents(),
        loadUsers()
      ]);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await apiService.getAlerts({ 
        limit: 100,
        ordering: '-created_at'
      });
      
      console.log('Alerts Response:', response);
      
      const allAlerts = Array.isArray(response) ? response : (response.results || []);
      
      // Filter active alerts
      const activeAlerts = allAlerts.filter(alert => 
        alert.status === 'active' || alert.status === 'sent'
      );
      
      // Map recent alerts
      setRecentAlerts(activeAlerts.slice(0, 5).map(alert => ({
        id: alert.id,
        type: alert.alert_type || alert.type || 'general',
        title: alert.title || 'Untitled Alert',
        location: alert.location?.name || alert.location_name || alert.district || alert.location || 'Unknown',
        severity: (alert.severity || alert.alert_level || 'info').toLowerCase(),
        time: getTimeAgo(alert.created_at || alert.timestamp || alert.sent_at),
        status: alert.status || 'active',
        affectedPeople: alert.affected_population || alert.affected_count || 0
      })));
      
      // Update stats
      setStats(prev => ({ 
        ...prev, 
        activeAlerts: activeAlerts.length,
        alertsChange: 0 // Calculate if you have historical data
      }));
    } catch (err) {
      console.error('Error loading alerts:', err);
      setRecentAlerts([]);
    }
  };

  const loadIncidents = async () => {
    try {
      const response = await apiService.getIncidents({
        limit: 100,
        ordering: '-created_at'
      });
      
      console.log('Incidents Response:', response);
      
      const allIncidents = Array.isArray(response) ? response : (response.results || []);
      
      // Filter by status
      const pending = allIncidents.filter(i => 
        i.status === 'submitted' || i.status === 'under_review'
      );
      
      const resolvedToday = allIncidents.filter(i => {
        if (i.status !== 'resolved') return false;
        const resolvedDate = new Date(i.resolved_at || i.updated_at);
        const today = new Date();
        return resolvedDate.toDateString() === today.toDateString();
      });
      
      // Map pending incidents
      setPendingIncidents(pending.slice(0, 5).map(incident => ({
        id: incident.id,
        title: incident.title || 'Untitled Incident',
        reporter: incident.reporter_name || incident.reporter?.username || incident.reporter?.first_name || 'Unknown',
        location: incident.location_name || incident.address || incident.district || 'Unknown',
        priority: incident.priority || 3,
        time: getTimeAgo(incident.created_at || incident.timestamp),
        status: incident.status || 'submitted'
      })));
      
      // Update stats
      setStats(prev => ({ 
        ...prev, 
        pendingIncidents: pending.length,
        resolvedToday: resolvedToday.length,
        incidentsChange: 0,
        resolvedChange: 0
      }));
    } catch (err) {
      console.error('Error loading incidents:', err);
      setPendingIncidents([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      const users = Array.isArray(response) ? response : (response.results || []);
      
      // Count active users (is_active = true)
      const activeUsers = users.filter(u => u.is_active).length;
      
      setStats(prev => ({ 
        ...prev, 
        activeUsers,
        usersChange: 0
      }));
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
    return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'info': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Operator Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.first_name} {user?.last_name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <button 
              onClick={() => navigate('/analytics')}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              {stats.alertsChange !== 0 && (
                <span className={`flex items-center gap-1 text-sm ${stats.alertsChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.alertsChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(stats.alertsChange)}%
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.activeAlerts}</h3>
            <p className="text-gray-600 text-sm">Active Alerts</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              {stats.incidentsChange !== 0 && (
                <span className={`flex items-center gap-1 text-sm ${stats.incidentsChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.incidentsChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(stats.incidentsChange)}%
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingIncidents}</h3>
            <p className="text-gray-600 text-sm">Pending Incidents</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              {stats.resolvedChange !== 0 && (
                <span className={`flex items-center gap-1 text-sm ${stats.resolvedChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.resolvedChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(stats.resolvedChange)}%
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.resolvedToday}</h3>
            <p className="text-gray-600 text-sm">Resolved Today</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              {stats.usersChange !== 0 && (
                <span className={`flex items-center gap-1 text-sm ${stats.usersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.usersChange > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(stats.usersChange)}%
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.activeUsers}</h3>
            <p className="text-gray-600 text-sm">Active Users</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.responseTime}</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 w-3/4"></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-teal-50 p-2 rounded-lg">
                <Target className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.resolvedToday > 0 && stats.pendingIncidents >= 0 
                    ? `${Math.round((stats.resolvedToday / (stats.resolvedToday + stats.pendingIncidents)) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-teal-600"
                style={{ 
                  width: stats.resolvedToday > 0 && stats.pendingIncidents >= 0
                    ? `${Math.round((stats.resolvedToday / (stats.resolvedToday + stats.pendingIncidents)) * 100)}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-50 p-2 rounded-lg">
                <Radio className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900">99.8%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 w-full"></div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Trends Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Incident Trends
              </h2>
            </div>
            <div className="space-y-4">
              {chartData.incidentTrend.labels.map((label, index) => {
                const submitted = chartData.incidentTrend.submitted[index];
                const resolved = chartData.incidentTrend.resolved[index];
                const maxValue = Math.max(...chartData.incidentTrend.submitted, ...chartData.incidentTrend.resolved);
                
                return (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">{label}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-red-600 text-xs">Submit: {submitted}</span>
                        <span className="text-green-600 text-xs">Resolved: {resolved}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div 
                          className="bg-red-500 h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                          style={{ width: `${(submitted / maxValue) * 100}%` }}
                        >
                          {submitted > 0 && submitted}
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div 
                          className="bg-green-500 h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                          style={{ width: `${(resolved / maxValue) * 100}%` }}
                        >
                          {resolved > 0 && resolved}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts by Type Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Alerts by Type
              </h2>
            </div>
            <div className="space-y-3">
              {Object.entries(chartData.alertsByType).map(([type, count]) => {
                const total = Object.values(chartData.alertsByType).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors = {
                  emergency: 'bg-red-500',
                  weather: 'bg-orange-500',
                  health: 'bg-blue-500',
                  security: 'bg-purple-500',
                  other: 'bg-gray-500'
                };
                
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                      <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full ${colors[type]} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Incidents by Priority Doughnut */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Incidents by Priority
            </h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(chartData.incidentsByPriority).map(([priority, count]) => {
              const total = Object.values(chartData.incidentsByPriority).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors = {
                p1: 'bg-red-500',
                p2: 'bg-orange-500',
                p3: 'bg-yellow-500',
                p4: 'bg-blue-500',
                p5: 'bg-gray-500'
              };
              const labels = {
                p1: 'Critical',
                p2: 'High',
                p3: 'Medium',
                p4: 'Low',
                p5: 'Info'
              };
              
              return (
                <div key={priority} className="text-center">
                  <div className={`${colors[priority]} w-full h-32 rounded-lg flex flex-col items-center justify-center text-white mb-2 shadow-lg`}>
                    <div className="text-3xl font-bold">{count}</div>
                    <div className="text-xs opacity-90">{percentage}%</div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">{labels[priority]}</div>
                  <div className="text-xs text-gray-500">Priority {priority.replace('p', '')}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Active Alerts
                </h2>
                <button 
                  onClick={() => navigate('/admin/alerts')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  View All
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No active alerts</p>
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    onClick={() => navigate(`/admin/alerts/${alert.id}`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500">{alert.time}</span>
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">{alert.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alert.location}
                          </span>
                          {alert.affectedPeople > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {alert.affectedPeople} affected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Incidents */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  Pending Incidents
                </h2>
                <button 
                  onClick={() => navigate('/incidents/admin/list')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  View All
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {pendingIncidents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No pending incidents</p>
                </div>
              ) : (
                pendingIncidents.map((incident) => (
                  <div 
                    key={incident.id}
                    onClick={() => navigate(`/incidents/admin/${incident.id}/view`)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(incident.priority)}`}></div>
                          <span className="text-xs text-gray-500">{incident.time}</span>
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">{incident.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {incident.reporter}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {incident.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/admin/alerts')}
            className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-xl hover:shadow-xl transition-all group"
          >
            <AlertTriangle className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Send Alert</h3>
            <p className="text-sm text-red-50">Create emergency alert</p>
          </button>

          <button 
            onClick={() => navigate('/chat')}
            className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl hover:shadow-xl transition-all group"
          >
            <MessageSquare className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Messages</h3>
            <p className="text-sm text-blue-50">View all messages</p>
          </button>

          <button 
            onClick={() => navigate('/analytics')}
            className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-xl hover:shadow-xl transition-all group"
          >
            <FileText className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Reports</h3>
            <p className="text-sm text-green-50">Generate reports</p>
          </button>

          <button 
            onClick={() => navigate('/users')}
            className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-xl hover:shadow-xl transition-all group"
          >
            <Users className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Users</h3>
            <p className="text-sm text-purple-50">Manage users</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;