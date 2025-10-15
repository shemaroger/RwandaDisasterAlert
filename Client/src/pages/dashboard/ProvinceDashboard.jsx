// pages/dashboard/ProvinceDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import {
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  MapPin,
  Phone,
  Activity,
  FileText,
  AlertCircle,
  Building,
  Eye,
  Plus,
  BarChart3,
  Target,
  Bell,
  Zap,
  Shield,
  BookOpen,
  Map,
  PieChart
} from 'lucide-react';

const ProvinceDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncidents: 0,
    districtIncidents: 0,
    sectorIncidents: 0,
    villageIncidents: 0,
    pendingIncidents: 0,
    resolvedIncidents: 0,
    escalatedUp: 0,
    escalatedDown: 0,
    activeAlerts: 0,
    districts: 0,
    sectors: 0,
    villages: 0,
    totalPopulation: 0,
    averageResponseTime: 0,
    safetyGuides: 0,
    alertsSent: 0,
    resolutionRate: 0
  });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [incidentTrends, setIncidentTrends] = useState([]);
  const [timeFilter, setTimeFilter] = useState('month');

  useEffect(() => {
    loadDashboardData();
  }, [timeFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDashboardStats('province', timeFilter);
      setStats(response.stats || stats);
      setRecentIncidents(response.recentIncidents || []);
      setDistrictStats(response.districtStats || []);
      setActiveAlerts(response.activeAlerts || []);
      setIncidentTrends(response.incidentTrends || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        {trend !== undefined && (
          <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            <TrendingUp className={`w-4 h-4 inline ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading province dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Province Level Dashboard</h1>
              <p className="text-purple-100 mt-1">
                {user?.first_name} {user?.last_name} • {user?.district || 'Province Administrator'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 border border-purple-300 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              >
                <option value="week" className="text-gray-900">This Week</option>
                <option value="month" className="text-gray-900">This Month</option>
                <option value="quarter" className="text-gray-900">This Quarter</option>
                <option value="year" className="text-gray-900">This Year</option>
              </select>
              <button
                onClick={() => navigate('/admin/alerts/create')}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 font-medium"
              >
                <Bell className="w-4 h-4" />
                Create Alert
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FileText}
            title="Total Incidents"
            value={stats.totalIncidents}
            subtitle={`${stats.districts} districts, ${stats.sectors} sectors`}
            color="bg-purple-600"
            onClick={() => navigate('/incidents/admin/list')}
            trend={5}
          />
          <StatCard
            icon={Clock}
            title="Pending Action"
            value={stats.pendingIncidents}
            subtitle="Requires response"
            color="bg-yellow-600"
            onClick={() => navigate('/incidents/admin/list?status=pending')}
          />
          <StatCard
            icon={CheckCircle}
            title="Resolution Rate"
            value={`${stats.resolutionRate}%`}
            subtitle={`${stats.resolvedIncidents} resolved`}
            color="bg-green-600"
            trend={12}
          />
          <StatCard
            icon={Bell}
            title="Active Alerts"
            value={stats.activeAlerts}
            subtitle="Province-wide alerts"
            color="bg-red-600"
            onClick={() => navigate('/admin/alerts')}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Map className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Coverage</p>
                <p className="text-2xl font-bold text-gray-900">{stats.districts}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Districts managed</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <ArrowUpCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">To National</p>
                <p className="text-2xl font-bold text-gray-900">{stats.escalatedUp}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Escalated up</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-teal-100">
                <ArrowDownCircle className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">From Districts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.escalatedDown}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Escalated from below</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Response</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}h</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Avg. response time</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-indigo-100">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Population</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.totalPopulation / 1000000).toFixed(2)}M</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Total coverage</p>
          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Active Province-Wide Alerts</h3>
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="bg-white rounded-lg p-4 border border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                              {alert.severity}
                            </span>
                            <span className="text-xs text-gray-500">
                              {alert.affected_districts} districts affected
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Sent {new Date(alert.created_at).toLocaleString()} • {alert.recipients.toLocaleString()} recipients
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/alerts/edit/${alert.id}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* District Performance Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">District Performance</h3>
            <button
              onClick={() => navigate('/analytics')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              <PieChart className="w-4 h-4" />
              Detailed Analytics
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {districtStats.map((district, index) => (
              <div key={index} className="p-5 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Map className="w-4 h-4 text-purple-600" />
                    {district.name}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    district.performance >= 80 ? 'bg-green-100 text-green-800' :
                    district.performance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {district.performance}% eff.
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Incidents:</span>
                    <span className="font-semibold text-gray-900">{district.totalIncidents}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Resolved:</span>
                    <span className="font-semibold text-green-600">{district.resolved}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Pending:</span>
                    <span className="font-semibold text-yellow-600">{district.pending}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Escalated:</span>
                    <span className="font-semibold text-orange-600">{district.escalated}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Sectors:</span>
                    <span className="font-medium text-gray-900">{district.sectors}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        district.performance >= 80 ? 'bg-green-500' :
                        district.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${district.performance}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Avg. Response: {district.avgResponseTime}h
                    </p>
                    <button
                      onClick={() => navigate(`/analytics?district=${district.id}`)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent High-Priority Incidents</h2>
              <button
                onClick={() => navigate('/incidents/admin/list')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incident
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentIncidents.length > 0 ? (
                  recentIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/incidents/admin/${incident.id}/view`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                        <div className="text-xs text-gray-500">{incident.report_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {incident.district}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            incident.priority === 1 ? 'bg-red-500' :
                            incident.priority === 2 ? 'bg-orange-500' :
                            'bg-yellow-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">P{incident.priority}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {incident.status_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {incident.current_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(incident.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/incidents/admin/${incident.id}/view`);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No recent high-priority incidents in your province
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/alerts/create')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-gray-900">Create Province-Wide Alert</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/incidents/citizen/reports')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Report Incident</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Advanced Analytics</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/safety-guides')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <span className="font-medium text-gray-900">Manage Safety Guides</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/admin/disaster-types')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Disaster Management</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">Contact National Office</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Province Resources</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Emergency Hotline</p>
                    <p className="text-sm text-gray-600">24/7 Emergency Support</p>
                  </div>
                </div>
                <a href="tel:112" className="text-red-600 font-bold text-lg">112</a>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">National Command</p>
                    <p className="text-sm text-gray-600">Escalation & Coordination</p>
                  </div>
                </div>
                <a href="tel:+250788000000" className="text-purple-600 font-bold">Call</a>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm mb-2">Province Statistics</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-semibold text-gray-900">{stats.districts}</span> Districts
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{stats.sectors}</span> Sectors
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{stats.villages}</span> Villages
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">{(stats.totalPopulation / 1000000).toFixed(2)}M</span> People
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm mb-1">Performance Goals</p>
                    <p className="text-xs text-gray-600">
                      Resolution Rate: <span className="font-semibold text-gray-900">{stats.resolutionRate}%</span> | 
                      Target: <span className="font-semibold">85%</span>
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-300"
                        style={{ width: `${(stats.resolutionRate / 85) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvinceDashboard;