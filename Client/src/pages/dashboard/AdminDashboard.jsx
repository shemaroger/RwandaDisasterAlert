// pages/dashboard/AdminDashboard.jsx
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
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState({
    weeklyTrend: [],
    alertsByType: [],
    incidentsByStatus: [],
    systemHealth: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== DASHBOARD DATA LOADING ===');
      console.log('API Base URL:', apiService.baseUrl);
      console.log('Is Authenticated:', apiService.isAuthenticated());
      
      // Initialize stats with defaults
      let dashboardStats = {
        totalUsers: 0,
        activeAlerts: 0,
        pendingIncidents: 0,
        systemUptime: 99.9,
        newUsersToday: 0,
        alertsToday: 0,
        incidentsToday: 0,
        pendingApprovals: 0,
        systemStatus: {
          sms: true,
          push: true,
          email: true
        }
      };

      // Function to extract count from API response (handles both array and paginated responses)
      const extractCount = (response) => {
        if (Array.isArray(response)) {
          return response.length;
        } else if (response?.count !== undefined) {
          return response.count;
        } else if (response?.results && Array.isArray(response.results)) {
          return response.results.length;
        } else if (response?.total !== undefined) {
          return response.total;
        }
        return 0;
      };

      // Try to load real data from individual endpoints
      const dataPromises = [];
      
      // 1. Get total users count
      console.log('Fetching users...');
      dataPromises.push(
        apiService.getUsers({ page_size: 1000 }) // Get more to get accurate count
          .then(response => {
            console.log('Users response:', response);
            const count = extractCount(response);
            dashboardStats.totalUsers = count;
            return { success: true, data: count, type: 'users' };
          })
          .catch(err => {
            console.error('Users fetch failed:', err);
            return { success: false, error: err.message, type: 'users' };
          })
      );

      // 2. Get active alerts - try multiple approaches since getActiveAlerts() returns empty
      console.log('Fetching active alerts...');
      dataPromises.push(
        apiService.getAlerts({ status: 'active' })
          .then(response => {
            console.log('Active alerts (filtered) response:', response);
            const count = extractCount(response);
            dashboardStats.activeAlerts = count;
            return { success: true, data: count, type: 'activeAlerts' };
          })
          .catch(err => {
            console.error('Active alerts (filtered) fetch failed:', err);
            // Fallback to getActiveAlerts()
            return apiService.getActiveAlerts()
              .then(response => {
                console.log('Active alerts (dedicated endpoint) response:', response);
                const count = extractCount(response);
                dashboardStats.activeAlerts = count;
                return { success: true, data: count, type: 'activeAlerts' };
              })
              .catch(fallbackErr => {
                console.error('Active alerts fallback also failed:', fallbackErr);
                // Last resort: get all alerts and filter client-side for active status
                return apiService.getAlerts()
                  .then(allAlertsResponse => {
                    console.log('All alerts response for filtering:', allAlertsResponse);
                    let activeCount = 0;
                    if (Array.isArray(allAlertsResponse)) {
                      activeCount = allAlertsResponse.filter(alert => alert.status === 'active').length;
                    }
                    dashboardStats.activeAlerts = activeCount;
                    return { success: true, data: activeCount, type: 'activeAlerts' };
                  })
                  .catch(() => ({ success: false, error: fallbackErr.message, type: 'activeAlerts' }));
              });
          })
      );

      // 3. Get all incidents count
      console.log('Fetching incidents...');
      dataPromises.push(
        apiService.getIncidents({ page_size: 1000 })
          .then(response => {
            console.log('Incidents response:', response);
            const count = extractCount(response);
            return { success: true, data: count, type: 'incidents' };
          })
          .catch(err => {
            console.error('Incidents fetch failed:', err);
            return { success: false, error: err.message, type: 'incidents' };
          })
      );

      // 4. Get pending incidents - try correct status values from your IncidentListPage
      console.log('Fetching pending incidents...');
      dataPromises.push(
        apiService.getIncidents({ status: 'submitted' })
          .then(response => {
            console.log('Submitted incidents response:', response);
            const count = extractCount(response);
            dashboardStats.pendingIncidents = count;
            return { success: true, data: count, type: 'pendingIncidents' };
          })
          .catch(err => {
            console.error('Submitted incidents fetch failed:', err);
            // Try 'under_review' as fallback
            return apiService.getIncidents({ status: 'under_review' })
              .then(response => {
                console.log('Under review incidents response:', response);
                const count = extractCount(response);
                dashboardStats.pendingIncidents = count;
                return { success: true, data: count, type: 'pendingIncidents' };
              })
              .catch(fallbackErr => {
                console.error('Under review incidents also failed:', fallbackErr);
                // Last resort: get all incidents and filter client-side
                return apiService.getIncidents()
                  .then(allIncidentsResponse => {
                    console.log('All incidents for filtering:', allIncidentsResponse);
                    let pendingCount = 0;
                    if (Array.isArray(allIncidentsResponse)) {
                      // Count incidents that are either submitted or under_review
                      pendingCount = allIncidentsResponse.filter(incident => 
                        incident.status === 'submitted' || incident.status === 'under_review'
                      ).length;
                    }
                    dashboardStats.pendingIncidents = pendingCount;
                    return { success: true, data: pendingCount, type: 'pendingIncidents' };
                  })
                  .catch(() => ({ success: false, error: fallbackErr.message, type: 'pendingIncidents' }));
              });
          })
      );

      // 5. Get today's data - improved date filtering logic
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log('Getting today stats for:', todayStr);

      // Today's alerts - filter client-side with better date comparison
      dataPromises.push(
        apiService.getAlerts()
          .then(response => {
            console.log('Today alerts response:', response);
            let todayCount = 0;
            if (Array.isArray(response)) {
              todayCount = response.filter(alert => {
                if (alert.created_at || alert.issued_at) {
                  const alertDateStr = alert.created_at || alert.issued_at;
                  const alertDate = new Date(alertDateStr);
                  const alertDateOnly = alertDate.toISOString().split('T')[0];
                  console.log('Comparing alert date:', alertDateOnly, 'with today:', todayStr);
                  return alertDateOnly === todayStr;
                }
                return false;
              }).length;
              console.log('Today alerts filtered count:', todayCount);
            }
            dashboardStats.alertsToday = todayCount;
            return { success: true, data: todayCount, type: 'alertsToday' };
          })
          .catch(err => {
            console.error('Today alerts fetch failed:', err);
            return { success: false, error: err.message, type: 'alertsToday' };
          })
      );

      // Today's incidents - filter client-side with better date comparison
      dataPromises.push(
        apiService.getIncidents()
          .then(response => {
            console.log('Today incidents response:', response);
            let todayCount = 0;
            if (Array.isArray(response)) {
              todayCount = response.filter(incident => {
                if (incident.created_at) {
                  const incidentDateStr = incident.created_at;
                  const incidentDate = new Date(incidentDateStr);
                  const incidentDateOnly = incidentDate.toISOString().split('T')[0];
                  console.log('Comparing incident date:', incidentDateOnly, 'with today:', todayStr);
                  return incidentDateOnly === todayStr;
                }
                return false;
              }).length;
              console.log('Today incidents filtered count:', todayCount);
            }
            dashboardStats.incidentsToday = todayCount;
            return { success: true, data: todayCount, type: 'incidentsToday' };
          })
          .catch(err => {
            console.error('Today incidents fetch failed:', err);
            return { success: false, error: err.message, type: 'incidentsToday' };
          })
      );

      // Today's users - filter client-side with better date comparison
      dataPromises.push(
        apiService.getUsers()
          .then(response => {
            console.log('Today users response:', response);
            let todayCount = 0;
            if (Array.isArray(response)) {
              todayCount = response.filter(user => {
                if (user.date_joined) {
                  const userDateStr = user.date_joined;
                  const userDate = new Date(userDateStr);
                  const userDateOnly = userDate.toISOString().split('T')[0];
                  console.log('Comparing user date:', userDateOnly, 'with today:', todayStr);
                  return userDateOnly === todayStr;
                }
                return false;
              }).length;
              console.log('Today users filtered count:', todayCount);
            }
            dashboardStats.newUsersToday = todayCount;
            return { success: true, data: todayCount, type: 'newUsersToday' };
          })
          .catch(err => {
            console.error('Today users fetch failed:', err);
            return { success: false, error: err.message, type: 'newUsersToday' };
          })
      );

      // Wait for all requests to complete
      const results = await Promise.allSettled(dataPromises);
      console.log('All API results:', results);

      // Process results and count successes/failures
      let successCount = 0;
      let failureCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
          console.log(`✅ ${result.value.type}: ${result.value.data}`);
        } else {
          failureCount++;
          const errorInfo = result.status === 'rejected' ? result.reason : result.value.error;
          console.error(`❌ API call ${index} failed:`, errorInfo);
        }
      });

      console.log(`Dashboard loading completed: ${successCount} successes, ${failureCount} failures`);
      console.log('Final dashboard stats:', dashboardStats);

      // Prepare chart data based on the collected raw data
      const prepareChartData = (usersData, alertsData, incidentsData) => {
        console.log('Preparing chart data...');
        
        // Weekly trend data (last 7 days)
        const weeklyTrend = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          let dayUsers = 0, dayAlerts = 0, dayIncidents = 0;
          
          if (Array.isArray(usersData)) {
            dayUsers = usersData.filter(user => {
              if (user.date_joined) {
                const userDate = new Date(user.date_joined).toISOString().split('T')[0];
                return userDate === dateStr;
              }
              return false;
            }).length;
          }
          
          if (Array.isArray(alertsData)) {
            dayAlerts = alertsData.filter(alert => {
              if (alert.created_at) {
                const alertDate = new Date(alert.created_at).toISOString().split('T')[0];
                return alertDate === dateStr;
              }
              return false;
            }).length;
          }
          
          if (Array.isArray(incidentsData)) {
            dayIncidents = incidentsData.filter(incident => {
              if (incident.created_at) {
                const incidentDate = new Date(incident.created_at).toISOString().split('T')[0];
                return incidentDate === dateStr;
              }
              return false;
            }).length;
          }
          
          weeklyTrend.push({
            day: dayName,
            date: dateStr,
            users: dayUsers,
            alerts: dayAlerts,
            incidents: dayIncidents
          });
        }
        
        // Alerts by type/severity
        const alertsByType = [];
        if (Array.isArray(alertsData)) {
          const severityCount = alertsData.reduce((acc, alert) => {
            const severity = alert.severity || 'unknown';
            acc[severity] = (acc[severity] || 0) + 1;
            return acc;
          }, {});
          
          Object.entries(severityCount).forEach(([severity, count]) => {
            alertsByType.push({ 
              name: severity.charAt(0).toUpperCase() + severity.slice(1), 
              value: count,
              color: severity === 'extreme' ? '#dc2626' :
                     severity === 'severe' ? '#ea580c' :
                     severity === 'moderate' ? '#d97706' :
                     severity === 'minor' ? '#2563eb' : '#6b7280'
            });
          });
        }
        
        // Incidents by status
        const incidentsByStatus = [];
        if (Array.isArray(incidentsData)) {
          const statusCount = incidentsData.reduce((acc, incident) => {
            const status = incident.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
          
          Object.entries(statusCount).forEach(([status, count]) => {
            incidentsByStatus.push({ 
              name: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1), 
              value: count,
              color: status === 'resolved' ? '#16a34a' :
                     status === 'verified' ? '#2563eb' :
                     status === 'under_review' ? '#d97706' :
                     status === 'submitted' ? '#6b7280' : '#dc2626'
            });
          });
        }
        
        // System health data
        const systemHealth = [
          { name: 'SMS Gateway', status: dashboardStats.systemStatus.sms ? 'Online' : 'Offline', value: dashboardStats.systemStatus.sms ? 100 : 0, color: dashboardStats.systemStatus.sms ? '#16a34a' : '#dc2626' },
          { name: 'Push Service', status: dashboardStats.systemStatus.push ? 'Online' : 'Offline', value: dashboardStats.systemStatus.push ? 100 : 0, color: dashboardStats.systemStatus.push ? '#16a34a' : '#dc2626' },
          { name: 'Email Service', status: dashboardStats.systemStatus.email ? 'Online' : 'Offline', value: dashboardStats.systemStatus.email ? 100 : 0, color: dashboardStats.systemStatus.email ? '#16a34a' : '#dc2626' }
        ];
        
        return {
          weeklyTrend,
          alertsByType,
          incidentsByStatus,
          systemHealth
        };
      };

      // Store raw data for chart preparation
      let rawUsersData = [], rawAlertsData = [], rawIncidentsData = [];
      
      // Collect raw data from successful API calls for charts
      try {
        const [users, alerts, incidents] = await Promise.all([
          apiService.getUsers().catch(() => []),
          apiService.getAlerts().catch(() => []),
          apiService.getIncidents().catch(() => [])
        ]);
        
        rawUsersData = Array.isArray(users) ? users : [];
        rawAlertsData = Array.isArray(alerts) ? alerts : [];
        rawIncidentsData = Array.isArray(incidents) ? incidents : [];
        
        console.log('Raw data for charts:', { users: rawUsersData.length, alerts: rawAlertsData.length, incidents: rawIncidentsData.length });
      } catch (err) {
        console.warn('Failed to collect raw data for charts:', err);
      }
      
      const charts = prepareChartData(rawUsersData, rawAlertsData, rawIncidentsData);
      setChartData(charts);
      console.log('Chart data prepared:', charts);

      // Try system health with better error handling and realistic fallbacks
      try {
        const healthResponse = await apiService.getSystemHealth();
        console.log('System health response:', healthResponse);
        
        if (healthResponse && typeof healthResponse === 'object') {
          dashboardStats.systemUptime = healthResponse.uptime_percentage || healthResponse.uptime || 99.9;
          dashboardStats.systemStatus = {
            sms: healthResponse.sms_gateway_status === 'healthy' || healthResponse.sms_status === 'online' || healthResponse.sms === true,
            push: healthResponse.push_service_status === 'healthy' || healthResponse.push_status === 'online' || healthResponse.push === true,
            email: healthResponse.email_service_status === 'healthy' || healthResponse.email_status === 'online' || healthResponse.email === true
          };
        } else {
          // If health endpoint doesn't exist, show realistic status based on API functionality
          console.log('Health endpoint not available, using fallback status');
          dashboardStats.systemStatus = {
            sms: true, // Assume online since API is responding
            push: true,
            email: true
          };
        }
      } catch (healthErr) {
        console.warn('System health check failed:', healthErr);
        // Show realistic status - if we can make API calls, basic systems are working
        dashboardStats.systemStatus = {
          sms: successCount > 0, // If any API calls worked, assume services are up
          push: successCount > 0,
          email: successCount > 0
        };
      }

      setStats(dashboardStats);

      if (failureCount > 0 && successCount === 0) {
        setError(`Failed to load dashboard data. Check your API endpoints and authentication.`);
      } else if (failureCount > 0) {
        console.warn(`Some dashboard data failed to load (${failureCount}/${failureCount + successCount} requests failed)`);
      }

    } catch (error) {
      console.error('Dashboard loading error:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
      
      // Set fallback stats
      setStats({
        totalUsers: 0,
        activeAlerts: 0,
        pendingIncidents: 0,
        systemUptime: 0,
        newUsersToday: 0,
        alertsToday: 0,
        incidentsToday: 0,
        pendingApprovals: 0,
        systemStatus: {
          sms: false,
          push: false,
          email: false
        }
      });
    } finally {
      setLoading(false);
    }
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
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
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
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers?.toLocaleString() || '0'}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts || '0'}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.pendingIncidents || '0'}</p>
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
              <p className="text-2xl font-bold text-gray-900">
                {stats.systemUptime ? `${stats.systemUptime}%` : 'N/A'}
              </p>
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
            <AreaChart data={chartData.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                labelFormatter={(label) => `Day: ${label}`}
              />
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
                data={chartData.alertsByType}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chartData.alertsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
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
            <BarChart data={chartData.incidentsByStatus} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb">
                {chartData.incidentsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
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
            {chartData.systemHealth.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <div 
                    className={`w-3 h-3 rounded-full mr-3 ${
                      service.value === 100 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium text-gray-700">{service.name}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-semibold ${
                    service.value === 100 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {service.status}
                  </span>
                  <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        service.value === 100 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${service.value}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Overall Uptime</span>
              <span className="text-lg font-bold text-blue-700">
                {stats.systemUptime ? `${stats.systemUptime}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {stats.pendingApprovals > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                {stats.pendingApprovals} pending
              </span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600">You have {stats.pendingApprovals} user accounts waiting for approval.</p>
            <Link
              to="/admin/users"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Review Approvals
            </Link>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;