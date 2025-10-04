import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Users, MapPin, Clock, CheckCircle, XCircle,
  MessageSquare, FileText, Eye, ArrowUp, ArrowDown, RefreshCw,
  Download, Target, Radio, TrendingUp, Activity, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const OperatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [stats, setStats] = useState({
    activeAlerts: 0,
    pendingIncidents: 0,
    totalResolved: 0,
    alertsChange: 0,
    incidentsChange: 0,
    resolvedChange: 0
  });
  
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [incidentTrendData, setIncidentTrendData] = useState([]);
  const [alertsByTypeData, setAlertsByTypeData] = useState([]);
  const [responseTimeHistogram, setResponseTimeHistogram] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to load dashboard data...');
      
      await loadAlerts();
      await loadIncidents();
      
      console.log('Dashboard data loaded successfully');
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      console.log('Loading alerts...');
      const response = await apiService.getAlerts({ 
        limit: 100,
        ordering: '-created_at'
      });
      
      console.log('Alerts Response:', response);
      
      const allAlerts = Array.isArray(response) ? response : (response.results || []);
      console.log('Total alerts:', allAlerts.length);
      
      const activeAlerts = allAlerts.filter(alert => 
        alert.status === 'active' || alert.status === 'sent'
      );
      
      console.log('Active alerts:', activeAlerts.length);
      
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
      
      setStats(prev => ({ 
        ...prev, 
        activeAlerts: activeAlerts.length,
        alertsChange: 0
      }));

      // Process alerts by type for pie chart
      const alertTypes = {};
      allAlerts.forEach(alert => {
        const type = (alert.alert_type || alert.type || 'other').toLowerCase();
        alertTypes[type] = (alertTypes[type] || 0) + 1;
      });

      console.log('Alert types:', alertTypes);

      const typeColors = {
        emergency: '#ef4444',
        weather: '#f97316',
        health: '#3b82f6',
        security: '#8b5cf6',
        other: '#6b7280'
      };

      const chartData = Object.entries(alertTypes).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: typeColors[name] || '#6b7280'
      }));

      console.log('Alerts chart data:', chartData);
      setAlertsByTypeData(chartData);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setRecentAlerts([]);
      setAlertsByTypeData([]);
    }
  };

  const loadIncidents = async () => {
    try {
      console.log('Loading incidents...');
      const response = await apiService.getIncidents({
        limit: 100,
        ordering: '-created_at'
      });
      
      console.log('Incidents Response:', response);
      
      const allIncidents = Array.isArray(response) ? response : (response.results || []);
      console.log('Total incidents:', allIncidents.length);
      
      const pending = allIncidents.filter(i => 
        i.status === 'submitted' || i.status === 'under_review'
      );
      
      const totalResolved = allIncidents.filter(i => i.status === 'resolved');
      
      console.log('Pending incidents:', pending.length);
      console.log('Total resolved:', totalResolved.length);
      
      setPendingIncidents(pending.slice(0, 5).map(incident => ({
        id: incident.id,
        title: incident.title || 'Untitled Incident',
        reporter: incident.reporter_name || incident.reporter?.username || incident.reporter?.first_name || 'Unknown',
        location: incident.location_name || incident.address || incident.district || 'Unknown',
        priority: incident.priority || 3,
        time: getTimeAgo(incident.created_at || incident.timestamp),
        status: incident.status || 'submitted'
      })));
      
      setStats(prev => ({ 
        ...prev, 
        pendingIncidents: pending.length,
        totalResolved: totalResolved.length,
        incidentsChange: 0,
        resolvedChange: 0
      }));

      // Process incident trends for bar chart (last 7 days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const trendData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        
        const submitted = allIncidents.filter(inc => {
          const incDate = new Date(inc.created_at);
          return incDate.toDateString() === date.toDateString();
        }).length;

        const resolved = allIncidents.filter(inc => {
          if (inc.status !== 'resolved') return false;
          const resDate = new Date(inc.resolved_at || inc.updated_at);
          return resDate.toDateString() === date.toDateString();
        }).length;

        trendData.push({ day: dayName, submitted, resolved });
      }

      console.log('Trend data:', trendData);
      setIncidentTrendData(trendData);

      // Process response time histogram
      const resolvedIncidents = allIncidents.filter(i => i.status === 'resolved' && i.created_at && i.resolved_at);
      console.log('Resolved incidents with timestamps:', resolvedIncidents.length);
      
      const timeBuckets = {
        '0-1h': 0,
        '1-3h': 0,
        '3-6h': 0,
        '6-12h': 0,
        '12-24h': 0,
        '24h+': 0
      };

      resolvedIncidents.forEach(incident => {
        const created = new Date(incident.created_at);
        const resolved = new Date(incident.resolved_at);
        const hours = (resolved - created) / (1000 * 60 * 60);

        if (hours <= 1) timeBuckets['0-1h']++;
        else if (hours <= 3) timeBuckets['1-3h']++;
        else if (hours <= 6) timeBuckets['3-6h']++;
        else if (hours <= 12) timeBuckets['6-12h']++;
        else if (hours <= 24) timeBuckets['12-24h']++;
        else timeBuckets['24h+']++;
      });

      const histogramData = Object.entries(timeBuckets).map(([range, count]) => ({
        range,
        count
      }));

      console.log('Histogram data:', histogramData);
      setResponseTimeHistogram(histogramData);
    } catch (err) {
      console.error('Error loading incidents:', err);
      setPendingIncidents([]);
      setIncidentTrendData([]);
      setResponseTimeHistogram([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      const users = Array.isArray(response) ? response : (response.results || []);
      
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show label for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Operator Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.first_name || 'Operator'} {user?.last_name || ''}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalResolved}</h3>
            <p className="text-gray-600 text-sm">Total Resolved</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Trends Bar Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Incident Trends (Bar Chart)
              </h2>
            </div>
            {incidentTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incidentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="submitted" fill="#ef4444" name="Submitted" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="resolved" fill="#22c55e" name="Resolved" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Alerts by Type Pie Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Alerts by Type (Pie Chart)
              </h2>
            </div>
            {alertsByTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={alertsByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomPieLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {alertsByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Response Time Histogram */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Response Time Distribution (Histogram)
            </h2>
          </div>
          {responseTimeHistogram.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={responseTimeHistogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: 'Number of Incidents', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8b5cf6" name="Incidents" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
              <p>No data available</p>
            </div>
          )}
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