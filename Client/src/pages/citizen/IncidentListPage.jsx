import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const IncidentListPage = ({ citizenView = false }) => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    priority: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const navigate = useNavigate();

  const STATUS_COLORS = {
    'submitted': 'bg-blue-100 text-blue-800',
    'under_review': 'bg-yellow-100 text-yellow-800',
    'verified': 'bg-green-100 text-green-800',
    'resolved': 'bg-gray-100 text-gray-800',
    'dismissed': 'bg-red-100 text-red-800'
  };

  const PRIORITY_COLORS = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-blue-500',
    5: 'bg-gray-500'
  };

  useEffect(() => {
    loadIncidents();
  }, [pagination.page, searchTerm, filters, citizenView, user]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      };

      let response;
      
      if (citizenView && user?.user_type === 'citizen') {
        response = await apiService.getIncidents(params);
      } else {
        response = await apiService.getIncidents(params);
      }

      let incidentData = [];
      let totalCount = 0;

      if (response) {
        if (Array.isArray(response)) {
          incidentData = response;
          totalCount = response.length;
        } else if (response.results && Array.isArray(response.results)) {
          incidentData = response.results;
          totalCount = response.count || response.results.length;
        } else if (response.data && Array.isArray(response.data)) {
          incidentData = response.data;
          totalCount = response.count || response.total || response.data.length;
        } else {
          if (response.id && response.title) {
            incidentData = [response];
            totalCount = 1;
          } else {
            incidentData = [];
            totalCount = 0;
          }
        }
      }

      setIncidents(Array.isArray(incidentData) ? incidentData : []);
      setPagination(prev => ({
        ...prev,
        total: totalCount
      }));

    } catch (err) {
      setError(`Failed to load incidents: ${err.message || 'Unknown error'}`);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (incidentId) => {
    if (!window.confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteIncident(incidentId);
      setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
    } catch (err) {
      alert('Failed to delete incident');
    }
  };

  const handleStatusChange = async (incidentId, action) => {
    try {
      let response;
      switch (action) {
        case 'verify':
          response = await apiService.verifyIncident(incidentId);
          break;
        case 'resolve':
          const notes = prompt('Resolution notes (optional):');
          response = await apiService.resolveIncident(incidentId, notes || '');
          break;
        default:
          return;
      }
      
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === incidentId ? { ...incident, ...response } : incident
        )
      );
    } catch (err) {
      alert('Failed to update incident status');
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

  const getViewPath = (incidentId) => {
    return citizenView ? `/incidents/citizen/${incidentId}/view` : `/incidents/admin/${incidentId}/view`;
  };

  const getEditPath = (incidentId) => {
    return citizenView ? `/incidents/citizen/${incidentId}/edit` : `/incidents/admin/${incidentId}/edit`;
  };

  const getCreatePath = () => {
    return citizenView ? '/incidents/citizen/reports' : '/report-incident';
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading incidents...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">
                {citizenView ? 'My Incident Reports' : 'All Incident Reports'}
              </h1>
              <p className="text-gray-600">
                {citizenView 
                  ? 'Track your submitted incident reports' 
                  : 'Manage and track all incident reports'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!citizenView && (
                <button
                  onClick={() => navigate('/incidents/export')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
              <Link
                to={getCreatePath()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Report
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      {!citizenView && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>

              <select
                value={filters.report_type}
                onChange={(e) => setFilters(prev => ({ ...prev, report_type: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="emergency">Emergency</option>
                <option value="hazard">Hazard</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="health">Health</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="1">Priority 1 (Highest)</option>
                <option value="2">Priority 2</option>
                <option value="3">Priority 3</option>
                <option value="4">Priority 4</option>
                <option value="5">Priority 5 (Lowest)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="text-red-800">{error}</p>
                <button
                  onClick={loadIncidents}
                  className="text-red-700 hover:text-red-900 text-sm font-medium mt-2"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Incidents Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incident
                  </th>
                  {!citizenView && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reporter
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(incidents) && incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{incident.title}</div>
                        <div className="text-sm text-gray-500 capitalize">{incident.report_type}</div>
                        {incident.disaster_type_name && (
                          <div className="text-xs text-blue-600">{incident.disaster_type_name}</div>
                        )}
                      </div>
                    </td>
                    {!citizenView && (
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{incident.reporter_name}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm">
                          {incident.location_name && (
                            <div className="text-gray-900">{incident.location_name}</div>
                          )}
                          {incident.address && (
                            <div className="text-gray-500 truncate max-w-32">{incident.address}</div>
                          )}
                          {incident.latitude && incident.longitude && (
                            <div className="text-xs text-blue-600">
                              {parseFloat(incident.latitude).toFixed(4)}, {parseFloat(incident.longitude).toFixed(4)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[incident.status] || 'bg-gray-100 text-gray-800'}`}>
                        {incident.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[incident.priority] || 'bg-gray-300'} mr-2`}></div>
                        <span className="text-sm text-gray-900">P{incident.priority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {formatDate(incident.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={getViewPath(incident.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        {(citizenView ? incident.status === 'submitted' : true) && (
                          <Link
                            to={getEditPath(incident.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        
                        {!citizenView && (
                          <>
                            {incident.status === 'submitted' && (
                              <button
                                onClick={() => handleStatusChange(incident.id, 'verify')}
                                className="text-blue-600 hover:text-blue-800"
                                title="Verify"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {incident.status === 'verified' && (
                              <button
                                onClick={() => handleStatusChange(incident.id, 'resolve')}
                                className="text-green-600 hover:text-green-800"
                                title="Resolve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(incident.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* No results */}
          {incidents.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {citizenView ? 'No reports found' : 'No incidents found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {citizenView 
                  ? "You haven't submitted any incident reports yet."
                  : searchTerm || Object.values(filters).some(v => v) 
                    ? 'Try adjusting your search or filters.' 
                    : 'No incident reports have been submitted yet.'
                }
              </p>
              <Link
                to={getCreatePath()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {citizenView ? 'Submit Your First Report' : 'Create Incident Report'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentListPage;