// pages/dashboard/CellDashboard.jsx
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
  Filter,
  Calendar,
  MessageCircle,
  BarChart3
} from 'lucide-react';

const CellDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncidents: 0,
    pendingIncidents: 0,
    resolvedIncidents: 0,
    escalatedIncidents: 0,
    receivedFromVillages: 0,
    escalatedToSector: 0,
    activeAlerts: 0,
    citizenReports: 0,
    averageResponseTime: 0,
    villagesManaged: 0,
    population: 0
  });
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [timeFilter, setTimeFilter] = useState('week');

  useEffect(() => {
    loadDashboardData();
  }, [timeFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch dashboard statistics for cell level
      const response = await apiService.getDashboardStats('cell', timeFilter);
      setStats(response.stats || stats);
      setRecentIncidents(response.recentIncidents || []);
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
          <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            <TrendingUp className={`w-4 h-4 inline ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  const IncidentRow = ({ incident }) => {
    const statusColors = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      escalated: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800'
    };

    const priorityColors = {
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-blue-500',
      5: 'bg-gray-500'
    };

    const levelColors = {
      village: 'bg-green-100 text-green-800',
      cell: 'bg-teal-100 text-teal-800',
      sector: 'bg-blue-100 text-blue-800'
    };

    return (
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/incidents/admin/${incident.id}/view`)}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${priorityColors[incident.priority]} mr-3`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">{incident.title}</div>
              <div className="text-xs text-gray-500">{incident.location_name}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${levelColors[incident.current_level] || 'bg-gray-100 text-gray-800'}`}>
            {incident.current_level === 'village' ? 'Village' : incident.current_level === 'cell' ? 'Cell' : 'Sector'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[incident.status]}`}>
            {incident.status_display}
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
            className="text-blue-600 hover:text-blue-900"
          >
            <Eye className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cell dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-7 h-7 text-teal-600" />
                Cell Level Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.first_name} {user?.last_name} • {user?.district || 'Cell Administrator'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Coordinating {stats.villagesManaged} villages • Population: {stats.population?.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={() => navigate('/incidents/citizen/reports')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Report Incident
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
            subtitle="Cell & village level"
            color="bg-teal-600"
            onClick={() => navigate('/incidents/admin/list')}
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
            title="Resolved"
            value={stats.resolvedIncidents}
            subtitle={`${timeFilter === 'week' ? 'This week' : 'This month'}`}
            color="bg-green-600"
            trend={12}
          />
          <StatCard
            icon={ArrowUpCircle}
            title="Escalated to Sector"
            value={stats.escalatedToSector}
            subtitle="Forwarded upstream"
            color="bg-orange-600"
          />
        </div>

        {/* Escalation Flow Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100">
                  <ArrowDownCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">From Villages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.receivedFromVillages}</p>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-xs text-gray-500">Incidents escalated from village level</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate('/incidents/admin/list?source=village')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                View all from villages →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-100">
                  <ArrowUpCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">To Sector</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.escalatedToSector}</p>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-xs text-gray-500">Incidents escalated to sector level</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate('/incidents/admin/list?escalated=true')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                View all escalated →
              </button>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Citizens notified in cell area</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-indigo-100">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Citizen Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.citizenReports}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Direct reports from community</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-teal-100">
                <Activity className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}h</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Average time to first response</p>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Incidents</h2>
              <button
                onClick={() => navigate('/incidents/admin/list')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
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
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                    <IncidentRow key={incident.id} incident={incident} />
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No recent incidents in your cell
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions and Emergency Contacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/incidents/citizen/reports')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-teal-600" />
                  <span className="font-medium text-gray-900">Report New Incident</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/incidents/admin/list')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">View All Incidents</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/incidents/admin/list?source=village')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ArrowDownCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Village Escalations</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Contact Sector Office</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Emergency</p>
                    <p className="text-sm text-gray-600">All emergencies</p>
                  </div>
                </div>
                <a href="tel:112" className="text-red-600 font-bold text-lg">112</a>
              </div>
              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-900">MINEMA Hotline</p>
                    <p className="text-sm text-gray-600">Direct support</p>
                  </div>
                </div>
                <a href="tel:+250788000000" className="text-teal-600 font-bold">Call</a>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Sector Office</p>
                    <p className="text-sm text-gray-600">Coordination center</p>
                  </div>
                </div>
                <a href="tel:+250788111111" className="text-blue-600 font-bold">Call</a>
              </div>
            </div>
          </div>
        </div>

        {/* Cell Level Info Card */}
        <div className="mt-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Building className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cell Level Coordination</h3>
              <p className="text-sm text-gray-700 mb-3">
                As a cell administrator, you coordinate incident management between {stats.villagesManaged} villages and the sector level. 
                You can receive escalations from villages, manage cell-level incidents, and escalate to the sector when needed.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Receive from villages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-600" />
                  <span className="text-gray-600">Manage at cell level</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-600">Escalate to sector</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CellDashboard;