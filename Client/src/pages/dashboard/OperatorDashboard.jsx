import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bell, 
  Phone,
  MessageSquare,
  Eye,
  Home,
  Activity,
  Filter,
  RefreshCw,
  Search,
  Plus,
  Calendar
} from 'lucide-react';

// Mock API service (replace with your actual import)
const mockApiService = {
  async getAlerts(params = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      results: [
        {
          id: 1,
          title: "Severe Weather Warning",
          description: "Thunderstorm approaching downtown area",
          severity: "high",
          status: "active",
          created_at: "2024-03-15T10:30:00Z",
          affected_zones: ["Downtown", "Industrial District"],
          estimated_affected: 25000
        },
        {
          id: 2,
          title: "Water Main Break",
          description: "Major water line rupture on Main Street",
          severity: "medium",
          status: "pending",
          created_at: "2024-03-15T09:15:00Z",
          affected_zones: ["City Center"],
          estimated_affected: 5000
        },
        {
          id: 3,
          title: "Traffic Incident",
          description: "Multi-vehicle accident on Highway 101",
          severity: "low",
          status: "resolved",
          created_at: "2024-03-15T08:45:00Z",
          affected_zones: ["North Highway"],
          estimated_affected: 1000
        }
      ],
      count: 3
    };
  },

  async getIncidents(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      results: [
        {
          id: 1,
          title: "Building Collapse Report",
          status: "triaged",
          priority: "critical",
          location: "123 Main St",
          created_at: "2024-03-15T11:00:00Z",
          reporter_name: "John Doe"
        },
        {
          id: 2,
          title: "Gas Leak Reported",
          status: "pending",
          priority: "high",
          location: "456 Oak Ave",
          created_at: "2024-03-15T10:45:00Z",
          reporter_name: "Jane Smith"
        }
      ],
      count: 2
    };
  },

  async getSubscribers(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      count: 15847,
      active_count: 14925
    };
  },

  async getCheckins(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      results: [
        {
          id: 1,
          user_name: "Alice Johnson",
          status: "safe",
          location: "Downtown Shelter",
          timestamp: "2024-03-15T11:30:00Z"
        },
        {
          id: 2,
          user_name: "Bob Wilson",
          status: "needs_help",
          location: "Residential Area",
          timestamp: "2024-03-15T11:15:00Z"
        }
      ],
      count: 2
    };
  }
};

const OperatorDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    activeAlerts: 0,
    pendingIncidents: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [alertsData, incidentsData, subscribersData, checkinsData] = await Promise.all([
        mockApiService.getAlerts({ limit: 10 }),
        mockApiService.getIncidents({ limit: 10 }),
        mockApiService.getSubscribers(),
        mockApiService.getCheckins({ limit: 5 })
      ]);

      setAlerts(alertsData.results || []);
      setIncidents(incidentsData.results || []);
      setCheckins(checkinsData.results || []);
      
      setStats({
        totalSubscribers: subscribersData.count || 0,
        activeSubscribers: subscribersData.active_count || 0,
        activeAlerts: alertsData.results?.filter(a => a.status === 'active').length || 0,
        pendingIncidents: incidentsData.results?.filter(i => i.status === 'pending').length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'triaged':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = alertFilter === 'all' || alert.status === alertFilter;
    return matchesSearch && matchesFilter;
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency Operations Center</h1>
                <p className="text-sm text-gray-500">Real-time monitoring and response coordination</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <span className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeAlerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Incidents</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingIncidents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeSubscribers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Safety Check-ins</p>
                <p className="text-2xl font-semibold text-gray-900">{checkins.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: Activity },
              { id: 'alerts', name: 'Active Alerts', icon: Bell },
              { id: 'incidents', name: 'Incidents', icon: AlertTriangle },
              { id: 'checkins', name: 'Check-ins', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {alerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                        <p className="text-xs text-gray-500">{alert.affected_zones?.join(', ')}</p>
                        <p className="text-xs text-gray-400">{formatTime(alert.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Incidents</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {incidents.map(incident => (
                    <div key={incident.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${getSeverityColor(incident.priority)}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{incident.title}</p>
                        <p className="text-xs text-gray-500">{incident.location}</p>
                        <p className="text-xs text-gray-400">Reported by: {incident.reporter_name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'alerts' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={alertFilter}
                    onChange={(e) => setAlertFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affected</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                          <p className="text-sm text-gray-500">{alert.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.estimated_affected?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(alert.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'incidents' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Incidents</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.map(incident => (
                    <tr key={incident.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(incident.priority)}`}>
                          {incident.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {incident.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.reporter_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(incident.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'checkins' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Safety Check-ins</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {checkins.map(checkin => (
                  <div key={checkin.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      checkin.status === 'safe' ? 'bg-green-100 text-green-600' : 
                      checkin.status === 'needs_help' ? 'bg-red-100 text-red-600' : 
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {checkin.status === 'safe' ? 
                        <CheckCircle className="w-5 h-5" /> : 
                        <AlertTriangle className="w-5 h-5" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{checkin.user_name}</p>
                      <p className="text-xs text-gray-500">{checkin.location}</p>
                      <p className="text-xs text-gray-400">{formatTime(checkin.timestamp)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        checkin.status === 'safe' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {checkin.status.replace('_', ' ')}
                      </span>
                      {checkin.status === 'needs_help' && (
                        <button className="p-1 text-red-600 hover:text-red-900">
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDashboard;