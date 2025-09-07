// pages/dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, Settings, BarChart3, AlertTriangle, 
  Activity, CheckCircle, XCircle, RefreshCw, FileText,
  Clock, Bell, Radio, Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setStats({
        totalUsers: 2547,
        activeAlerts: 3,
        pendingIncidents: 12,
        systemUptime: 99.9,
        newUsersToday: 23,
        alertsToday: 8,
        incidentsToday: 15,
        pendingApprovals: 18
      });
    } catch (error) {
      console.error('Failed to load data:', error);
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
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
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

      {/* Today's Activity */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Today's Activity</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.newUsersToday}</p>
              <p className="text-sm text-gray-600">New Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.alertsToday}</p>
              <p className="text-sm text-gray-600">Alerts Sent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.incidentsToday}</p>
              <p className="text-sm text-gray-600">New Incidents</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">SMS Gateway</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Push Service</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Email Service</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors"
        >
          <Users className="w-8 h-8 mb-3" />
          <h3 className="font-semibold">Manage Users</h3>
          <p className="text-sm opacity-90">User accounts & roles</p>
        </Link>

        <Link
          to="/alerts"
          className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg transition-colors"
        >
          <Radio className="w-8 h-8 mb-3" />
          <h3 className="font-semibold">Alert System</h3>
          <p className="text-sm opacity-90">Manage emergency alerts</p>
        </Link>

        <Link
          to="/analytics"
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors"
        >
          <BarChart3 className="w-8 h-8 mb-3" />
          <h3 className="font-semibold">Analytics</h3>
          <p className="text-sm opacity-90">System reports</p>
        </Link>

        <Link
          to="/admin/settings"
          className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-lg transition-colors"
        >
          <Settings className="w-8 h-8 mb-3" />
          <h3 className="font-semibold">Settings</h3>
          <p className="text-sm opacity-90">System configuration</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;