import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiSearch, FiPlus, FiEdit, FiX, FiDownload, FiRefreshCw,
  FiMapPin, FiMap, FiAlertCircle, FiInfo, FiGlobe,
  FiChevronDown, FiChevronUp, FiFilter, FiTrash2,
  FiChevronLeft, FiChevronRight, FiSave, FiEye
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GeoZoneManagement = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const abortControllerRef = useRef();
  const searchTimeoutRef = useRef();
  
  // State management
  const [geoZones, setGeoZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    level: '',
    search: '',
    code: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20
  });

  // Administrative levels for Rwanda
  const ADMIN_LEVELS = [
    'country',
    'province', 
    'district',
    'sector',
    'cell',
    'village'
  ];

  // Compute level stats
  const levelStats = geoZones.reduce((acc, zone) => {
    const key = zone?.level || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch geo zones
  const fetchGeoZones = useCallback(async (page = 1, showLoadingState = true) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );

      const params = {
        ...cleanFilters,
        page,
        page_size: pagination.pageSize
      };

      const response = await apiService.getGeoZones(params);
      
      if (response?.results) {
        setGeoZones(response.results);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: Math.ceil(response.count / pagination.pageSize),
          totalCount: response.count
        }));
      } else if (Array.isArray(response)) {
        setGeoZones(response);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalPages: 1,
          totalCount: response.length
        }));
      } else {
        setGeoZones([]);
      }
    } catch (err) {
      if (err.message !== 'Request cancelled') {
        const errorMessage = err.message || 'Failed to fetch geo zones';
        setError(errorMessage);
        if (showLoadingState) {
          toast.error(`Error: ${errorMessage}`);
        }
      }
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => {
    fetchGeoZones();
  }, [fetchGeoZones]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced filter handling
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'search') {
      setSearchTerm(value);
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      level: '',
      search: '',
      code: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchTerm !== '';

  // Zone actions
  const handleZoneAction = async (zoneId, action) => {
    try {
      console.log(`Performing action: ${action} on zone: ${zoneId}`);
      setActionLoading(prev => ({ ...prev, [`${zoneId}-${action}`]: true }));
      let successMessage = '';
      
      switch (action) {
        case 'delete':
          if (window.confirm('Are you sure you want to delete this geo zone? This action cannot be undone.')) {
            await apiService.deleteGeoZone(zoneId);
            successMessage = 'Geo zone deleted successfully';
          } else {
            return;
          }
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      toast.success(successMessage);
      await fetchGeoZones(pagination.currentPage, false);
      
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${zoneId}-${action}`]: false }));
    }
  };

  // Bulk operations
  const handleBulkAction = async () => {
    if (!bulkAction || selectedZones.length === 0) {
      toast.warning('Please select zones and an action');
      return;
    }

    if (bulkAction === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedZones.length} geo zones? This action cannot be undone.`)) {
        return;
      }
      
      try {
        setLoading(true);
        const results = await Promise.allSettled(
          selectedZones.map(id => apiService.deleteGeoZone(id))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        if (successful > 0) {
          toast.success(`${successful} geo zones deleted successfully`);
        }
        if (failed > 0) {
          toast.warning(`${failed} geo zones failed to delete`);
        }
        
        await fetchGeoZones(pagination.currentPage, false);
        setSelectedZones([]);
        setBulkAction('');
      } catch (err) {
        console.error('Bulk delete error:', err);
        toast.error(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Export functionality
  const handleExport = async (format = 'csv') => {
    try {
      const response = await apiService.request('/geozones/export/', {
        method: 'GET',
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/json'
        }
      });
      
      const blob = new Blob([response], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `geozones_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export completed successfully');
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  // Selection management
  const toggleZoneSelection = (zoneId) => {
    setSelectedZones(prev =>
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const toggleAllZonesSelection = () => {
    if (selectedZones.length === geoZones.length && geoZones.length > 0) {
      setSelectedZones([]);
    } else {
      setSelectedZones(geoZones.map(z => z.id));
    }
  };

  // Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchGeoZones(newPage);
    }
  };

  // Modal handlers
  const handleCreateZone = () => {
    setSelectedZone(null);
    setShowCreateModal(true);
  };

  const handleEditZone = async (zoneId) => {
    try {
      setModalLoading(true);
      const zoneData = await apiService.getGeoZoneById(zoneId);
      setSelectedZone(zoneData);
      setShowEditModal(true);
    } catch (err) {
      toast.error(`Error loading geo zone: ${err.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewZone = async (zoneId) => {
    try {
      setModalLoading(true);
      const zoneData = await apiService.getGeoZoneById(zoneId);
      setSelectedZone(zoneData);
      setShowViewModal(true);
    } catch (err) {
      toast.error(`Error loading geo zone: ${err.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedZone(null);
  };

  // Utility functions
  const getLevelColor = (level) => {
    switch (level) {
      case 'country': return 'bg-purple-100 text-purple-800';
      case 'province': return 'bg-blue-100 text-blue-800';
      case 'district': return 'bg-green-100 text-green-800';
      case 'sector': return 'bg-yellow-100 text-yellow-800';
      case 'cell': return 'bg-orange-100 text-orange-800';
      case 'village': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelDisplayName = (level) => {
    return level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown';
  };

  // Render zone row
  const renderZoneRow = (zone) => {
    if (!zone) return null;

    return (
      <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="checkbox"
            checked={selectedZones.includes(zone.id)}
            onChange={() => toggleZoneSelection(zone.id)}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiMapPin className="text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{zone.name}</div>
              <div className="text-sm text-gray-500">{zone.code}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(zone.level)}`}>
            {getLevelDisplayName(zone.level)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {zone.center_lat && zone.center_lng ? (
            <span className="flex items-center">
              <FiGlobe className="mr-1 h-3 w-3" />
              {zone.center_lat}, {zone.center_lng}
            </span>
          ) : (
            'Not set'
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {zone.bbox ? (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {zone.bbox.length > 20 ? zone.bbox.substring(0, 20) + '...' : zone.bbox}
            </span>
          ) : (
            'Not set'
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleViewZone(zone.id)}
              className="text-blue-600 hover:text-blue-900 transition-colors"
              title="View Details"
            >
              <FiEye />
            </button>

            <button
              onClick={() => handleEditZone(zone.id)}
              className="text-blue-600 hover:text-blue-900 transition-colors"
              title="Edit"
            >
              <FiEdit />
            </button>

            <button
              onClick={() => handleZoneAction(zone.id, 'delete')}
              disabled={actionLoading[`${zone.id}-delete`]}
              className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
              title="Delete Zone"
            >
              {actionLoading[`${zone.id}-delete`] ? 
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div> :
                <FiTrash2 />
              }
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">User information is not available. Please log in again.</p>
          <button
            onClick={() => logout()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Create Zone Modal */}
      <CreateGeoZoneModal 
        isOpen={showCreateModal}
        onClose={closeModals}
        onSuccess={() => {
          closeModals();
          fetchGeoZones(pagination.currentPage, false);
        }}
        levels={ADMIN_LEVELS}
      />

      {/* Edit Zone Modal */}
      <EditGeoZoneModal 
        isOpen={showEditModal}
        onClose={closeModals}
        zone={selectedZone}
        onSuccess={() => {
          closeModals();
          fetchGeoZones(pagination.currentPage, false);
        }}
        levels={ADMIN_LEVELS}
      />

      {/* View Zone Modal */}
      <ViewGeoZoneModal 
        isOpen={showViewModal}
        onClose={closeModals}
        zone={selectedZone}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Geo Zone Management</h1>
            <p className="text-gray-600 mt-1">
              Manage administrative areas and geographical zones • {pagination.totalCount} total zones
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => fetchGeoZones(pagination.currentPage, false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <FiRefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <FiDownload className="mr-2 h-4 w-4" /> Export
            </button>
            <button
              onClick={handleCreateZone}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <FiPlus className="mr-2 h-4 w-4" /> New Zone
            </button>
          </div>
        </div>

        {/* Level Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {ADMIN_LEVELS.map(level => (
            <div key={level} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate capitalize">{level}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{levelStats[level] || 0}</dd>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Section */}
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FiFilter className="mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Active
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-900 transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={searchTerm}
                      onChange={handleFilterChange}
                      className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Name or code..."
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={filters.level}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Levels</option>
                    {ADMIN_LEVELS.map(level => (
                      <option key={level} value={level} className="capitalize">{level}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    id="code"
                    value={filters.code}
                    onChange={handleFilterChange}
                    className="focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Zone code..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedZones.length > 0 && (
          <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">
                  {selectedZones.length} zone{selectedZones.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedZones([])}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear selection
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                >
                  <option value="">Choose bulk action...</option>
                  <option value="delete">Delete Zones</option>
                </select>
                
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || selectedZones.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Action
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zones Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedZones.length > 0 && selectedZones.length === geoZones.length && geoZones.length > 0}
                      onChange={toggleAllZonesSelection}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bounding Box
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-2"></div>
                        <span className="text-sm text-gray-500">Loading geo zones...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FiAlertCircle className="h-8 w-8 text-red-500 mb-2" />
                        <span className="text-sm text-red-600">{error}</span>
                        <button
                          onClick={() => fetchGeoZones(pagination.currentPage)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : geoZones.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FiMap className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">No geo zones found matching your criteria</span>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  geoZones.map(renderZoneRow)
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((pagination.currentPage - 1) * pagination.pageSize) + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.totalCount}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.currentPage
                              ? 'z-10 bg-red-50 border-red-500 text-red-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create GeoZone Modal Component
const CreateGeoZoneModal = ({ isOpen, onClose, onSuccess, levels }) => {
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    code: '',
    bbox: '',
    center_lat: '',
    center_lng: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.level) newErrors.level = 'Level is required';
    if (!formData.code) newErrors.code = 'Code is required';
    
    // Validate coordinates if provided
    if (formData.center_lat && (isNaN(formData.center_lat) || formData.center_lat < -90 || formData.center_lat > 90)) {
      newErrors.center_lat = 'Latitude must be between -90 and 90';
    }
    if (formData.center_lng && (isNaN(formData.center_lng) || formData.center_lng < -180 || formData.center_lng > 180)) {
      newErrors.center_lng = 'Longitude must be between -180 and 180';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const submitData = { ...formData };
      
      // Convert coordinates to numbers if provided
      if (submitData.center_lat) submitData.center_lat = parseFloat(submitData.center_lat);
      if (submitData.center_lng) submitData.center_lng = parseFloat(submitData.center_lng);
      
      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          delete submitData[key];
        }
      });
      
      await apiService.createGeoZone(submitData);
      toast.success('Geo zone created successfully');
      onSuccess();
      setFormData({
        name: '',
        level: '',
        code: '',
        bbox: '',
        center_lat: '',
        center_lng: ''
      });
    } catch (err) {
      toast.error(`Error creating geo zone: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Geo Zone</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Kigali City"
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level *
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.level ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                <option value="">Select Level</option>
                {levels.map(level => (
                  <option key={level} value={level} className="capitalize">{level}</option>
                ))}
              </select>
              {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., RW-KIGALI-GASABO"
                required
              />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Center Latitude
              </label>
              <input
                type="number"
                step="any"
                name="center_lat"
                value={formData.center_lat}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.center_lat ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., -1.9441"
              />
              {errors.center_lat && <p className="text-red-500 text-xs mt-1">{errors.center_lat}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Center Longitude
              </label>
              <input
                type="number"
                step="any"
                name="center_lng"
                value={formData.center_lng}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.center_lng ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., 30.0619"
              />
              {errors.center_lng && <p className="text-red-500 text-xs mt-1">{errors.center_lng}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bounding Box
              </label>
              <input
                type="text"
                name="bbox"
                value={formData.bbox}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., 29.0,−2.0,31.0,−1.0 (minx,miny,maxx,maxy)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Enter bounding box coordinates as comma-separated values (minx,miny,maxx,maxy)
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <FiSave className="mr-2 h-4 w-4" />
              Create Zone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit GeoZone Modal Component
const EditGeoZoneModal = ({ isOpen, onClose, zone, onSuccess, levels }) => {
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    code: '',
    bbox: '',
    center_lat: '',
    center_lng: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || '',
        level: zone.level || '',
        code: zone.code || '',
        bbox: zone.bbox || '',
        center_lat: zone.center_lat || '',
        center_lng: zone.center_lng || ''
      });
    }
  }, [zone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.level) newErrors.level = 'Level is required';
    if (!formData.code) newErrors.code = 'Code is required';
    
    // Validate coordinates if provided
    if (formData.center_lat && (isNaN(formData.center_lat) || formData.center_lat < -90 || formData.center_lat > 90)) {
      newErrors.center_lat = 'Latitude must be between -90 and 90';
    }
    if (formData.center_lng && (isNaN(formData.center_lng) || formData.center_lng < -180 || formData.center_lng > 180)) {
      newErrors.center_lng = 'Longitude must be between -180 and 180';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const submitData = { ...formData };
      
      // Convert coordinates to numbers if provided
      if (submitData.center_lat) submitData.center_lat = parseFloat(submitData.center_lat);
      if (submitData.center_lng) submitData.center_lng = parseFloat(submitData.center_lng);
      
      // Remove empty fields except for coordinates which should be null
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' && !['center_lat', 'center_lng'].includes(key)) {
          delete submitData[key];
        } else if (submitData[key] === '' && ['center_lat', 'center_lng'].includes(key)) {
          submitData[key] = null;
        }
      });
      
      await apiService.updateGeoZone(zone.id, submitData);
      toast.success('Geo zone updated successfully');
      onSuccess();
    } catch (err) {
      toast.error(`Error updating geo zone: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Geo Zone</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level *
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.level ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                <option value="">Select Level</option>
                {levels.map(level => (
                  <option key={level} value={level} className="capitalize">{level}</option>
                ))}
              </select>
              {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Center Latitude
              </label>
              <input
                type="number"
                step="any"
                name="center_lat"
                value={formData.center_lat}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.center_lat ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.center_lat && <p className="text-red-500 text-xs mt-1">{errors.center_lat}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Center Longitude
              </label>
              <input
                type="number"
                step="any"
                name="center_lng"
                value={formData.center_lng}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.center_lng ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.center_lng && <p className="text-red-500 text-xs mt-1">{errors.center_lng}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bounding Box
              </label>
              <input
                type="text"
                name="bbox"
                value={formData.bbox}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., 29.0,−2.0,31.0,−1.0 (minx,miny,maxx,maxy)"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <FiSave className="mr-2 h-4 w-4" />
              Update Zone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View GeoZone Modal Component
const ViewGeoZoneModal = ({ isOpen, onClose, zone }) => {
  if (!isOpen || !zone) return null;

  const getLevelColor = (level) => {
    switch (level) {
      case 'country': return 'bg-purple-100 text-purple-800';
      case 'province': return 'bg-blue-100 text-blue-800';
      case 'district': return 'bg-green-100 text-green-800';
      case 'sector': return 'bg-yellow-100 text-yellow-800';
      case 'cell': return 'bg-orange-100 text-orange-800';
      case 'village': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelDisplayName = (level) => {
    return level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Geo Zone Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Zone Header */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <FiMapPin className="text-blue-600 h-8 w-8" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{zone.name}</h4>
              <p className="text-gray-600">{zone.code}</p>
              <span className={`mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(zone.level)}`}>
                {getLevelDisplayName(zone.level)}
              </span>
            </div>
          </div>

          {/* Zone Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiInfo className="mr-2 h-4 w-4" />
                Basic Information
              </h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Zone ID:</span>
                  <span className="ml-2 text-gray-900 font-mono">{zone.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 text-gray-900">{zone.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Code:</span>
                  <span className="ml-2 text-gray-900 font-mono">{zone.code}</span>
                </div>
                <div>
                  <span className="text-gray-500">Level:</span>
                  <span className="ml-2 text-gray-900">{getLevelDisplayName(zone.level)}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiGlobe className="mr-2 h-4 w-4" />
                Geographic Data
              </h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Center Latitude:</span>
                  <span className="ml-2 text-gray-900 font-mono">
                    {zone.center_lat ? zone.center_lat : 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Center Longitude:</span>
                  <span className="ml-2 text-gray-900 font-mono">
                    {zone.center_lng ? zone.center_lng : 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Bounding Box:</span>
                  <div className="ml-2 text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                    {zone.bbox || 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Preview Placeholder */}
          {(zone.center_lat && zone.center_lng) && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiMap className="mr-2 h-4 w-4" />
                Location Preview
              </h5>
              <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FiMap className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Map preview would appear here</p>
                  <p className="text-xs">Coordinates: {zone.center_lat}, {zone.center_lng}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeoZoneManagement;