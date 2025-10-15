// pages/dashboard/NationalDashboard.jsx
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
  PieChart,
  Globe,
  Settings,
  TrendingDown
} from 'lucide-react';

const NationalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncidents: 0,
    provinceIncidents: 0,
    districtIncidents: 0,
    sectorIncidents: 0,
    villageIncidents: 0,
    pendingIncidents: 0,
    resolvedIncidents: 0,
    criticalIncidents: 0,
    activeAlerts: 0,
    provinces: 5,
    districts: 30,
    sectors: 416,
    villages: 2148,
    totalPopulation: 13000000,
    averageResponseTime: 0,
    safetyGuides: 0,
    alertsSent: 0,
    resolutionRate: 0,
    systemHealth: 98
  });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [provinceStats, setProvinceStats] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [nationalTrends, setNationalTrends] = useState([]);
  const [timeFilter, setTimeFilter] = useState('month');

  useEffect(() => {
    loadDashboardData();
  }, [timeFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDashboardStats('national', timeFilter);
      setStats(response.stats || stats);
      setRecentIncidents(response.recentIncidents || []);
      setProvinceStats(response.provinceStats || []);
      setActiveAlerts(response.activeAlerts || []);
      setNationalTrends(response.nationalTrends || []);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading national command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">National Command Center</h1>
                  <p className="text-red-100 text-sm">
                    {user?.first_name} {user?.last_name} • National Level Administrator
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 border border-red-300 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              >
                <option value="today" className="text-gray-900">Today</option>
                <option value="week" className="text-gray-900">This Week</option>
                <option value="month" className="text-gray-900">This Month</option>
                <option value="quarter" className="text-gray-900">This Quarter</option>
                <option value="year" className="text-gray-900">This Year</option>
              </select>
              <button
                onClick={() => navigate('/admin/alerts/create')}
                className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
              >
                <Bell className="w-4 h-4" />
                National Alert
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-medium"
              >
                <Settings className="w-4 h-4" />
                System
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Critical Alert Banner */}
        {stats.criticalIncidents > 0 && (
          <div className="bg-red-600 text-white rounded-lg p-6 mb-8 shadow-lg">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Critical Incidents Require Immediate Attention</h3>
                <p className="text-red-100 mb-4">
                  {stats.criticalIncidents} critical incidents are currently active and require national-level response.
                </p>
                <button
                  onClick={() => navigate('/incidents/admin/list?priority=1')}
                  className="px-6 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  View Critical Incidents →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={Globe}
            title="National Coverage"
            value={`${stats.provinces}P`}
            subtitle={`${stats.districts}D • ${stats.sectors}S • ${stats.villages}V`}
            color="bg-red-600"
          />
          <StatCard
            icon={FileText}
            title="Total Incidents"
            value={stats.totalIncidents}
            subtitle="All time incidents"
            color="bg-blue-600"
            onClick={() => navigate('/incidents/admin/list')}
            trend={3}
          />
          <StatCard
            icon={AlertCircle}
            title="Critical"
            value={stats.criticalIncidents}
            subtitle="Priority 1 incidents"
            color="bg-red-600"
            onClick={() => navigate('/incidents/admin/list?priority=1')}
          />
          <StatCard
            icon={CheckCircle}
            title="Resolution Rate"
            value={`${stats.resolutionRate}%`}
            subtitle={`${stats.resolvedIncidents} resolved`}
            color="bg-green-600"
            trend={8}
          />
          <StatCard
            icon={Bell}
            title="Active Alerts"
            value={stats.activeAlerts}
            subtitle="Nation-wide alerts"
            color="bg-orange-600"
            onClick={() => navigate('/admin/alerts')}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}h</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">National average</span>
              <span className={`font-medium ${stats.averageResponseTime <= 24 ? 'text-green-600' : 'text-orange-600'}`}>
                {stats.averageResponseTime <= 24 ? 'On Target' : 'Needs Improvement'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-indigo-100">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Population</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.totalPopulation / 1000000).toFixed(1)}M</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Total population covered</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-teal-100">
                <BookOpen className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Safety Guides</p>
                <p className="text-2xl font-bold text-gray-900">{stats.safetyGuides}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Published guidelines</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-gray-900">{stats.systemHealth}%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${stats.systemHealth}%` }}></div>
            </div>
          </div>
        </div>

        {/* Active National Alerts */}
        {activeAlerts.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <Bell className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1 animate-pulse" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Active Nation-Wide Alerts</h3>
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {alert.affected_provinces} provinces • {alert.affected_districts} districts
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg">{alert.title}</h4>
                          <p className="text-sm text-gray-700 mt-2">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span>Sent: {new Date(alert.created_at).toLocaleString()}</span>
                            <span>Recipients: {alert.recipients.toLocaleString()}</span>
                            <span>Delivery Rate: {alert.deliveryRate}%</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/alerts/edit/${alert.id}`)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          Manage Alert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Province Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Province Overview</h3>
            <button
              onClick={() => navigate('/analytics')}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
            >
              <PieChart className="w-4 h-4" />
              Detailed Analytics
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {provinceStats.map((province, index) => (
              <div key={index} className="p-5 border-2 border-gray-200 rounded-lg hover:shadow-lg transition-all hover:border-red-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Map className="w-5 h-5 text-red-600" />
                    {province.name}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                    province.performance >= 85 ? 'bg-green-100 text-green-800' :
                    province.performance >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {province.performance}%
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-gray-900">{province.totalIncidents}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">Critical:</span>
                    <span className="font-bold text-red-600">{province.critical}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">Resolved:</span>
                    <span className="font-bold text-green-600">{province.resolved}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">Pending:</span>
                    <span className="font-bold text-yellow-600">{province.pending}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 pt-2 border-t">
                    <span className="text-xs">Districts:</span>
                    <span className="text-xs font-semibold">{province.districts}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        province.performance >= 85 ? 'bg-green-500' :
                        province.performance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${province.performance}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Avg: {province.avgResponseTime}h
                    </p>
                    <button
                      onClick={() => navigate(`/analytics?province=${province.id}`)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold"
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Critical & High Priority Incidents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Critical & High Priority Incidents</h2>
                <p className="text-sm text-gray-600 mt-1">Requires national-level attention</p>
              </div>
              <button
                onClick={() => navigate('/incidents/admin/list')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                View All Incidents
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
                    Location
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
                    Impact
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
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{incident.title}</div>
                        <div className="text-xs text-gray-500 capitalize">{incident.report_type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{incident.province}</div>
                        <div className="text-xs text-gray-500">{incident.district}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            incident.priority === 1 ? 'bg-red-500 animate-pulse' :
                            incident.priority === 2 ? 'bg-orange-500' :
                            'bg-yellow-500'
                          }`}></div>
                          <span className={`text-sm font-bold ${
                            incident.priority === 1 ? 'text-red-600' :
                            incident.priority === 2 ? 'text-orange-600' :
                            'text-yellow-600'
                          }`}>
                            P{incident.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {incident.status_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
                          {incident.current_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {incident.casualties ? `${incident.casualties} affected` : 'N/A'}
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
                          className="text-red-600 hover:text-red-900"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p>No critical incidents at the moment</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & National Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">National Command Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/alerts/create')}
                className="w-full flex items-center justify-between p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors bg-red-50/50"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-red-600" />
                  <div className="text-left">
                    <span className="font-bold text-gray-900 block">National Emergency Alert</span>
                    <span className="text-xs text-gray-600">Broadcast to all citizens</span>
                  </div>
                </div>
                <span className="text-red-600 text-xl font-bold">→</span>
              </button>
              <button
                onClick={() => navigate('/incidents/admin/list')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">All Incidents Dashboard</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">National Analytics</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/safety-guides')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <span className="font-medium text-gray-900">Safety Guidelines</span>
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
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">System Administration</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">National Statistics</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-gray-900">National Coverage</span>
                  </div>
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/70 rounded p-2">
                    <div className="text-2xl font-bold text-red-600">{stats.provinces}</div>
                    <div className="text-xs text-gray-600">Provinces</div>
                  </div>
                  <div className="bg-white/70 rounded p-2">
                    <div className="text-2xl font-bold text-red-600">{stats.districts}</div>
                    <div className="text-xs text-gray-600">Districts</div>
                  </div>
                  <div className="bg-white/70 rounded p-2">
                    <div className="text-2xl font-bold text-red-600">{stats.sectors}</div>
                    <div className="text-xs text-gray-600">Sectors</div>
                  </div>
                  <div className="bg-white/70 rounded p-2">
                    <div className="text-2xl font-bold text-red-600">{stats.villages}</div>
                    <div className="text-xs text-gray-600">Villages</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">Performance Metrics</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Resolution Rate</span>
                          <span className="font-bold text-gray-900">{stats.resolutionRate}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${stats.resolutionRate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">System Health</span>
                          <span className="font-bold text-gray-900">{stats.systemHealth}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${stats.systemHealth}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">Alert System Status</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Alerts Sent:</span>
                        <span className="font-bold text-gray-900">{stats.alertsSent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Now:</span>
                        <span className="font-bold text-orange-600">{stats.activeAlerts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SMS Gateway:</span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="font-medium text-green-600">Online</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">Emergency Contacts</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">National Emergency:</span>
                        <a href="tel:112" className="font-bold text-red-600 text-lg">112</a>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">MINEMA Command:</span>
                        <a href="tel:+250788000000" className="font-bold text-blue-600">+250-788-000-000</a>
                      </div>
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

export default NationalDashboard;