import React, { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Building,
  Phone,
  MapPin,
  Calendar,
  User,
  ChevronDown,
  MoreHorizontal,
  CheckSquare,
  Square
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const IncidentReportManagement = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    priority: '',
    disaster_type: '',
    assigned_to: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Data for dropdowns
  const [disasterTypes, setDisasterTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const STATUS_COLORS = {
    'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
    'under_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'verified': 'bg-green-100 text-green-800 border-green-200',
    'resolved': 'bg-gray-100 text-gray-800 border-gray-200',
    'dismissed': 'bg-red-100 text-red-800 border-red-200'
  };

  const PRIORITY_COLORS = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-blue-500',
    5: 'bg-gray-500'
  };

  const REPORT_TYPE_ICONS = {
    'emergency': AlertTriangle,
    'hazard': AlertTriangle,
    'infrastructure': Building,
    'health': Phone,
    'security': AlertTriangle,
    'other': Clock
  };

  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'verified', label: 'Verified' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' }
  ];

  const REPORT_TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'hazard', label: 'Hazard' },
    { value: 'infrastructure', label: 'Infrastructure Damage' },
    { value: 'health', label: 'Health Emergency' },
    { value: 'security', label: 'Security Incident' },
    { value: 'other', label: 'Other' }
  ];

  const PRIORITY_OPTIONS = [
    { value: '', label: 'All Priorities' },
    { value: '1', label: 'Priority 1 (Highest)' },
    { value: '2', label: 'Priority 2' },
    { value: '3', label: 'Priority 3' },
    { value: '4', label: 'Priority 4' },
    { value: '5', label: 'Priority 5 (Lowest)' }
  ];

  useEffect(() => {
    loadInitialData();
    loadIncidents();
  }, [currentPage, searchTerm, filters]);

  const loadInitialData = async () => {
    try {
      const [disasterTypesRes, usersRes] = await Promise.all([
        apiService.getDisasterTypes().catch(() => ({ results: [] })),
        apiService.getUsers({ user_type: 'admin,operator,authority' }).catch(() => ({ results: [] }))
      ]);
      
      setDisasterTypes(disasterTypesRes.results || []);
      setUsers(usersRes.results || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        search: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      const response = await apiService.getIncidents(params);
      setIncidents(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / itemsPerPage));
      setTotalCount(response.count || 0);
      
    } catch (err) {
      setError('Failed to load incidents');
      console.error('Load incidents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      report_type: '',
      priority: '',
      disaster_type: '',
      assigned_to: '',
      date_from: '',
      date_to: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSelectIncident = (incidentId) => {
    setSelectedIncidents(prev => {
      if (prev.includes(incidentId)) {
        return prev.filter(id => id !== incidentId);
      } else {
        return [...prev, incidentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIncidents.length === incidents.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(incidents.map(incident => incident.id));
    }
  };

  const handleStatusUpdate = async (incidentId, action, additionalData = {}) => {
    try {
      let response;
      switch (action) {
        case 'verify':
          response = await apiService.verifyIncident(incidentId);
          break;
        case 'resolve':
          const notes = prompt('Resolution notes:');
          if (notes === null) return;
          response = await apiService.resolveIncident(incidentId, notes);
          break;
        case 'assign':
          if (!additionalData.assignedTo) {
            const assignedTo = prompt('Enter user ID to assign to:');
            if (!assignedTo) return;
            additionalData.assignedTo = assignedTo;
          }
          response = await apiService.assignIncident(incidentId, additionalData.assignedTo);
          break;
        default:
          return;
      }
      
      // Refresh the list
      await loadIncidents();
    } catch (err) {
      console.error('Status update error:', err);
      alert(`Failed to update incident: ${err.message}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIncidents.length === 0) {
      alert('Please select incidents to perform bulk action');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedIncidents.map(id => {
        switch (action) {
          case 'verify':
            return apiService.verifyIncident(id);
          case 'delete':
            return apiService.deleteIncident(id);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      setSelectedIncidents([]);
      await loadIncidents();
    } catch (err) {
      console.error('Bulk action error:', err);
      alert(`Failed to perform bulk action: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const params = {
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
        search: searchTerm
      };
      
      const blob = await apiService.exportIncidents(format, params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `incidents_export_${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export incidents');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeIcon = (reportType) => {
    const Icon = REPORT_TYPE_ICONS[reportType] || AlertTriangle;
    return <Icon className="w-4 h-4" />;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Incidents</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadIncidents}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Incident Report Management</h1>
              <p className="text-gray-600">Monitor and manage all incident reports</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('csv')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={loadIncidents}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select
                    value={filters.report_type}
                    onChange={(e) => handleFilterChange('report_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {REPORT_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disaster Type</label>
                  <select
                    value={filters.disaster_type}
                    onChange={(e) => handleFilterChange('disaster_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Disaster Types</option>
                    {disasterTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select
                    value={filters.assigned_to}
                    onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Users</option>
                    <option value="unassigned">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.user_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedIncidents.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-blue-800 font-medium">
                  {selectedIncidents.length} incident(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('verify')}
                  disabled={bulkActionLoading}
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify Selected
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedIncidents.length} incident(s)?`)) {
                      handleBulkAction('delete');
                    }
                  }}
                  disabled={bulkActionLoading}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            Showing {incidents.length} of {totalCount} incidents
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={handleSelectAll} className="flex items-center gap-2">
                      {selectedIncidents.length === incidents.length && incidents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Incident</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Reporter</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Assigned To</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-4" />
                      <p className="text-gray-600">Loading incidents...</p>
                    </td>
                  </tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
                      <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                    </td>
                  </tr>
                ) : (
                  incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSelectIncident(incident.id)}
                          className="flex items-center"
                        >
                          {selectedIncidents.includes(incident.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="text-red-500 mt-0.5">
                            {getReportTypeIcon(incident.report_type)}
                          </div>
                          <div>
                            <Link
                              to={`/incidents/admin/${incident.id}/view`}
                              className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                            >
                              {incident.title}
                            </Link>
                            <p className="text-sm text-gray-600 mt-1">
                              #{incident.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{incident.reporter_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 capitalize">
                          {incident.report_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[incident.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[incident.priority] || 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-900">P{incident.priority}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatDate(incident.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {incident.assigned_to_name ? (
                          <span className="text-sm text-gray-900">{incident.assigned_to_name}</span>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/incidents/admin/${incident.id}/view`}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/incidents/admin/${incident.id}/edit`}
                            className="text-gray-600 hover:text-gray-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          
                          {/* Quick Actions Dropdown */}
                          <div className="relative group">
                            <button className="text-gray-600 hover:text-gray-800 p-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <div className="py-1">
                                {incident.status === 'submitted' && (
                                  <button
                                    onClick={() => handleStatusUpdate(incident.id, 'verify')}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Verify
                                  </button>
                                )}
                                {incident.status === 'verified' && (
                                  <button
                                    onClick={() => handleStatusUpdate(incident.id, 'resolve')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Resolve
                                  </button>
                                )}
                                {!incident.assigned_to && (
                                  <button
                                    onClick={() => handleStatusUpdate(incident.id, 'assign')}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                                  >
                                    <Users className="w-4 h-4" />
                                    Assign
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this incident?')) {
                                      apiService.deleteIncident(incident.id)
                                        .then(() => loadIncidents())
                                        .catch(err => alert('Failed to delete incident'));
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({totalCount} total)
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {incidents.filter(i => i.status === 'submitted' || i.status === 'under_review').length}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {incidents.filter(i => i.priority <= 2).length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-gray-600">
                  {incidents.filter(i => !i.assigned_to).length}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportManagement;