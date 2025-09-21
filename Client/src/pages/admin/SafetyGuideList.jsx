import React, { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Star,
  Globe,
  User,
  Calendar,
  Languages,
  Target,
  BookOpen,
  Users,
  Building,
  ChevronDown,
  CheckSquare,
  Square,
  Copy,
  Download,
  MoreVertical
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Helper function for media URLs
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
  return `${baseUrl}/${cleanPath}`;
};

const SafetyGuideList = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGuides, setSelectedGuides] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    target_audience: '',
    disaster_types: '',
    is_featured: '',
    is_published: '',
    created_by: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Data for dropdowns
  const [disasterTypes, setDisasterTypes] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12;

  const CATEGORY_OPTIONS = [
    { value: '', label: 'All Categories' },
    { value: 'before', label: 'Before Disaster' },
    { value: 'during', label: 'During Disaster' },
    { value: 'after', label: 'After Disaster' },
    { value: 'general', label: 'General Preparedness' }
  ];

  const TARGET_AUDIENCE_OPTIONS = [
    { value: '', label: 'All Audiences' },
    { value: 'general', label: 'General Public' },
    { value: 'families', label: 'Families with Children' },
    { value: 'elderly', label: 'Elderly' },
    { value: 'disabled', label: 'People with Disabilities' },
    { value: 'business', label: 'Businesses' },
    { value: 'schools', label: 'Schools' }
  ];

  const CATEGORY_COLORS = {
    'before': 'bg-blue-100 text-blue-800',
    'during': 'bg-red-100 text-red-800',
    'after': 'bg-green-100 text-green-800',
    'general': 'bg-gray-100 text-gray-800'
  };

  const AUDIENCE_ICONS = {
    'general': Users,
    'families': Users,
    'elderly': User,
    'disabled': User,
    'business': Building,
    'schools': BookOpen
  };

  useEffect(() => {
    // Show success message if navigated from create/edit
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    
    loadInitialData();
    loadSafetyGuides();
    loadStats();
  }, [currentPage, searchTerm, filters]);

  const loadInitialData = async () => {
    try {
      const promises = [];
      
      // Always try to load disaster types
      promises.push(
        apiService.getDisasterTypes?.() 
          ? apiService.getDisasterTypes().catch(() => ({ results: [] }))
          : Promise.resolve({ results: [] })
      );
      
      // Load users for admin users only, with better error handling
      if (user?.user_type !== 'citizen' && apiService.getUsers) {
        // Try to get users with individual requests to avoid 400 error
        promises.push(
          Promise.all([
            apiService.getUsers({ user_type: 'admin' }).catch(() => ({ results: [] })),
            apiService.getUsers({ user_type: 'operator' }).catch(() => ({ results: [] })),
            apiService.getUsers({ user_type: 'authority' }).catch(() => ({ results: [] }))
          ]).then(responses => ({
            results: responses.flatMap(r => r.results || [])
          })).catch(() => ({ results: [] }))
        );
      } else {
        promises.push(Promise.resolve({ results: [] }));
      }
      
      const [disasterTypesRes, usersRes] = await Promise.all(promises);
      
      setDisasterTypes(disasterTypesRes.results || []);
      setUsers(usersRes.results || []);
      
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const loadSafetyGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if getSafetyGuides method exists
      if (!apiService.getSafetyGuides) {
        throw new Error('getSafetyGuides method not available in API service');
      }
      
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        search: searchTerm,
        ordering: 'display_order,title',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      console.log('Making API call with params:', params);
      
      const response = await apiService.getSafetyGuides(params);
      
      console.log('API response:', response);
      console.log('Response structure:', {
        hasResults: !!response.results,
        resultsType: typeof response.results,
        resultsLength: response.results?.length,
        count: response.count
      });
      
      // Handle different response formats
      let guides = [];
      let count = 0;
      
      if (response.results && Array.isArray(response.results)) {
        // Standard paginated response
        guides = response.results;
        count = response.count || response.results.length;
      } else if (Array.isArray(response)) {
        // Direct array response
        guides = response;
        count = response.length;
      } else if (response.data && Array.isArray(response.data)) {
        // Nested data response
        guides = response.data;
        count = response.total || response.data.length;
      }
      
      console.log('Processed guides:', guides.length, 'Total count:', count);
      
      setGuides(guides);
      setTotalPages(Math.ceil(count / itemsPerPage));
      setTotalCount(count);
      
    } catch (err) {
      console.error('Load safety guides error:', err);
      setError(`Failed to load safety guides: ${err.message}`);
      
      // Set empty data to prevent cascading errors
      setGuides([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (user?.user_type !== 'citizen') {
      try {
        if (apiService.getSafetyGuideStats) {
          const statsData = await apiService.getSafetyGuideStats();
          setStats(statsData);
        } else {
          // Generate fallback stats
          setStats({
            total: totalCount,
            published: guides.filter(g => g.is_published).length,
            featured: guides.filter(g => g.is_featured).length,
            drafts: guides.filter(g => !g.is_published).length
          });
        }
      } catch (err) {
        console.warn('Failed to load stats:', err);
        // Generate stats from current data as fallback
        setStats({
          total: totalCount,
          published: guides.filter(g => g.is_published).length,
          featured: guides.filter(g => g.is_featured).length,
          drafts: guides.filter(g => !g.is_published).length
        });
      }
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
      category: '',
      target_audience: '',
      disaster_types: '',
      is_featured: '',
      is_published: '',
      created_by: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSelectGuide = (guideId) => {
    setSelectedGuides(prev => {
      if (prev.includes(guideId)) {
        return prev.filter(id => id !== guideId);
      } else {
        return [...prev, guideId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedGuides.length === guides.length) {
      setSelectedGuides([]);
    } else {
      setSelectedGuides(guides.map(guide => guide.id));
    }
  };

  const handleToggleFeatured = async (guideId, currentFeatured) => {
    try {
      if (!apiService.updateSafetyGuide) {
        throw new Error('Update method not available');
      }
      
      await apiService.updateSafetyGuide(guideId, { is_featured: !currentFeatured });
      await loadSafetyGuides();
      await loadStats();
      setSuccessMessage(`Guide ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Toggle featured error:', err);
      setError('Failed to update featured status');
    }
  };

  const handleTogglePublished = async (guideId, currentPublished) => {
    try {
      if (!apiService.updateSafetyGuide) {
        throw new Error('Update method not available');
      }
      
      await apiService.updateSafetyGuide(guideId, { is_published: !currentPublished });
      await loadSafetyGuides();
      await loadStats();
      setSuccessMessage(`Guide ${!currentPublished ? 'published' : 'unpublished'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Toggle published error:', err);
      setError('Failed to update published status');
    }
  };

  const handleDelete = async (guideId) => {
    if (!confirm('Are you sure you want to delete this safety guide?')) {
      return;
    }

    try {
      if (!apiService.deleteSafetyGuide) {
        throw new Error('Delete method not available');
      }
      
      await apiService.deleteSafetyGuide(guideId);
      await loadSafetyGuides();
      await loadStats();
      setSuccessMessage('Safety guide deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete safety guide');
    }
  };

  const handleDuplicate = async (guideId) => {
    try {
      if (!apiService.duplicateSafetyGuide) {
        throw new Error('Duplicate method not available');
      }
      
      await apiService.duplicateSafetyGuide(guideId);
      await loadSafetyGuides();
      await loadStats();
      setSuccessMessage('Safety guide duplicated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Duplicate error:', err);
      setError('Failed to duplicate safety guide');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedGuides.length === 0) {
      setError('Please select safety guides to perform bulk action');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setBulkActionLoading(true);
    try {
      let updateData = {};
      
      switch (action) {
        case 'feature':
          updateData = { is_featured: true };
          break;
        case 'unfeature':
          updateData = { is_featured: false };
          break;
        case 'publish':
          updateData = { is_published: true };
          break;
        case 'unpublish':
          updateData = { is_published: false };
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedGuides.length} guide(s)?`)) {
            setBulkActionLoading(false);
            return;
          }
          
          if (!apiService.bulkDeleteSafetyGuides) {
            throw new Error('Bulk delete method not available');
          }
          
          const deleteResults = await apiService.bulkDeleteSafetyGuides(selectedGuides);
          setSuccessMessage(`Successfully deleted ${deleteResults.successCount} guides`);
          setSelectedGuides([]);
          await loadSafetyGuides();
          await loadStats();
          setBulkActionLoading(false);
          setTimeout(() => setSuccessMessage(null), 3000);
          return;
      }

      // For non-delete actions, use bulk update
      if (!apiService.bulkUpdateSafetyGuides) {
        throw new Error('Bulk update method not available');
      }
      
      const results = await apiService.bulkUpdateSafetyGuides(selectedGuides, updateData);
      setSuccessMessage(`Successfully updated ${results.successCount || selectedGuides.length} guides`);
      setSelectedGuides([]);
      await loadSafetyGuides();
      await loadStats();
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error('Bulk action error:', err);
      setError(`Failed to perform bulk action: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!apiService.exportSafetyGuides) {
        throw new Error('Export method not available');
      }
      
      const response = await apiService.exportSafetyGuides('json', filters);
      
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safety-guides-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccessMessage('Export completed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export safety guides');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAudienceIcon = (audience) => {
    const Icon = AUDIENCE_ICONS[audience] || Users;
    return <Icon className="w-4 h-4" />;
  };

  const hasMultipleLanguages = (guide) => {
    return guide.title_rw || guide.title_fr || guide.content_rw || guide.content_fr;
  };

  // Show public view for citizens
  const isPublicView = user?.user_type === 'citizen';

  // Debug logging
  console.log('Current component state:', {
    guides: guides,
    guidesLength: guides.length,
    loading: loading,
    error: error,
    totalCount: totalCount,
    isPublicView: isPublicView
  });

  if (error && !guides.length && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Safety Guides</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadSafetyGuides}
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
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckSquare className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <p className="text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isPublicView ? 'Safety Guides' : 'Safety Guides Management'}
              </h1>
              <p className="text-gray-600">
                {isPublicView 
                  ? 'Preparedness information and safety guidelines'
                  : 'Manage safety guides and preparedness information'
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {!isPublicView && (
                <>
                  <button
                    onClick={handleExport}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <Link
                    to="/safety-guides/admin/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Guide
                  </Link>
                </>
              )}
              <button
                onClick={loadSafetyGuides}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Cards - Only for admin users */}
        {!isPublicView && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Guides</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Featured</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.drafts}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search safety guides..."
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={filters.target_audience}
                    onChange={(e) => handleFilterChange('target_audience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TARGET_AUDIENCE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!isPublicView && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.is_published}
                      onChange={(e) => handleFilterChange('is_published', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="true">Published</option>
                      <option value="false">Draft</option>
                    </select>
                  </div>
                )}

                {!isPublicView && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Featured</label>
                    <select
                      value={filters.is_featured}
                      onChange={(e) => handleFilterChange('is_featured', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      <option value="true">Featured</option>
                      <option value="false">Not Featured</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disaster Type</label>
                  <select
                    value={filters.disaster_types}
                    onChange={(e) => handleFilterChange('disaster_types', e.target.value)}
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

                {!isPublicView && users.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                    <select
                      value={filters.created_by}
                      onChange={(e) => handleFilterChange('created_by', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Authors</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
        {!isPublicView && selectedGuides.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-blue-800 font-medium">
                  {selectedGuides.length} guide(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('feature')}
                  disabled={bulkActionLoading}
                  className="bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  Feature
                </button>
                <button
                  onClick={() => handleBulkAction('publish')}
                  disabled={bulkActionLoading}
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Publish
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            Showing {guides.length} of {totalCount} safety guides
          </p>
          {!isPublicView && guides.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedGuides.length === guides.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Safety Guides Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading safety guides...</p>
            </div>
          ) : guides.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No safety guides found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No safety guides are available yet.'}
              </p>
              {!isPublicView && (
                <Link
                  to="/safety-guides/admin/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Guide
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {!isPublicView && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedGuides.length === guides.length && guides.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {!isPublicView && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guides.map((guide) => (
                    <tr key={guide.id} className="hover:bg-gray-50">
                      {!isPublicView && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedGuides.includes(guide.id)}
                            onChange={() => handleSelectGuide(guide.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {guide.featured_image && (
                            <img
                              className="h-10 w-10 rounded-lg object-cover mr-3"
                              src={getMediaUrl(guide.featured_image)}
                              alt={guide.title}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              <Link
                                to={`/safety-guides/${isPublicView ? 'public' : 'admin'}/${guide.id}/view`}
                                className="hover:text-blue-600"
                              >
                                {guide.title}
                              </Link>
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {guide.content ? guide.content.substring(0, 60) + '...' : 'No content'}
                            </div>
                            {hasMultipleLanguages(guide) && (
                              <div className="flex items-center mt-1">
                                <Languages className="w-3 h-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500">Multi-language</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${CATEGORY_COLORS[guide.category] || 'bg-gray-100 text-gray-800'}`}>
                          {guide.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          {getAudienceIcon(guide.target_audience)}
                          <span className="ml-2 capitalize">
                            {guide.target_audience?.replace('_', ' ') || 'General'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            guide.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {guide.is_published ? 'Published' : 'Draft'}
                          </span>
                          {guide.is_featured && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      {!isPublicView && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {guide.created_by_name || guide.created_by?.username || 'Unknown'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {guide.created_at ? formatDate(guide.created_at) : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/safety-guides/${isPublicView ? 'public' : 'admin'}/${guide.id}/view`}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {!isPublicView && (
                            <>
                              <Link
                                to={`/safety-guides/admin/${guide.id}/edit`}
                                className="text-gray-600 hover:text-gray-800"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleToggleFeatured(guide.id, guide.is_featured)}
                                className={`${guide.is_featured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
                                title={guide.is_featured ? 'Unfeature' : 'Feature'}
                              >
                                <Star className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTogglePublished(guide.id, guide.is_published)}
                                className={`${guide.is_published ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-green-600'}`}
                                title={guide.is_published ? 'Unpublish' : 'Publish'}
                              >
                                <Globe className="w-4 h-4" />
                              </button>
                              <div className="relative group">
                                <button className="text-gray-400 hover:text-gray-600">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                                  <button
                                    onClick={() => handleDuplicate(guide.id)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                  </button>
                                  <button
                                    onClick={() => handleDelete(guide.id)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    </div>
  );
};

export default SafetyGuideList;