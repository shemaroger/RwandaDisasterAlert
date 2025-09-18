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
  Phone,
  ChevronDown,
  CheckSquare,
  Square
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
    'before': 'bg-blue-100 text-blue-800 border-blue-200',
    'during': 'bg-red-100 text-red-800 border-red-200',
    'after': 'bg-green-100 text-green-800 border-green-200',
    'general': 'bg-gray-100 text-gray-800 border-gray-200'
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

  const loadSafetyGuides = async () => {
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
      
      const response = await apiService.getSafetyGuides(params);
      setGuides(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / itemsPerPage));
      setTotalCount(response.count || 0);
      
    } catch (err) {
      setError('Failed to load safety guides');
      console.error('Load safety guides error:', err);
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
      await apiService.updateSafetyGuide(guideId, { is_featured: !currentFeatured });
      await loadSafetyGuides();
    } catch (err) {
      console.error('Toggle featured error:', err);
      alert('Failed to update featured status');
    }
  };

  const handleTogglePublished = async (guideId, currentPublished) => {
    try {
      await apiService.updateSafetyGuide(guideId, { is_published: !currentPublished });
      await loadSafetyGuides();
    } catch (err) {
      console.error('Toggle published error:', err);
      alert('Failed to update published status');
    }
  };

  const handleDelete = async (guideId) => {
    if (!confirm('Are you sure you want to delete this safety guide?')) {
      return;
    }

    try {
      await apiService.deleteSafetyGuide(guideId);
      await loadSafetyGuides();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete safety guide');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedGuides.length === 0) {
      alert('Please select safety guides to perform bulk action');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedGuides.map(id => {
        switch (action) {
          case 'feature':
            return apiService.updateSafetyGuide(id, { is_featured: true });
          case 'unfeature':
            return apiService.updateSafetyGuide(id, { is_featured: false });
          case 'publish':
            return apiService.updateSafetyGuide(id, { is_published: true });
          case 'unpublish':
            return apiService.updateSafetyGuide(id, { is_published: false });
          case 'delete':
            return apiService.deleteSafetyGuide(id);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      setSelectedGuides([]);
      await loadSafetyGuides();
    } catch (err) {
      console.error('Bulk action error:', err);
      alert(`Failed to perform bulk action: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
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

  if (error) {
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
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckSquare className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <p className="text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Guides</h1>
              <p className="text-gray-600">Manage safety guides and preparedness information</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/safety-guides/admin/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Guide
              </Link>
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
                        {user.username}
                      </option>
                    ))}
                  </select>
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
        {selectedGuides.length > 0 && (
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
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedGuides.length} guide(s)?`)) {
                      handleBulkAction('delete');
                    }
                  }}
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
          {guides.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedGuides.length === guides.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Safety Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))
          ) : guides.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No safety guides found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
              <Link
                to="/safety-guides/admin/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Guide
              </Link>
            </div>
          ) : (
            guides.map((guide) => (
              <div key={guide.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Selection checkbox */}
                <div className="p-4 pb-0">
                  <button
                    onClick={() => handleSelectGuide(guide.id)}
                    className="flex items-center mb-3"
                  >
                    {selectedGuides.includes(guide.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Featured Image */}
                {guide.featured_image && (
                  <div className="px-4 pb-4">
                    <img
                      src={getMediaUrl(guide.featured_image)}
                      alt={guide.title}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer"
                      onClick={() => window.open(`/safety-guides/admin/${guide.id}/view`, '_blank')}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="p-4 pt-0">
                  {/* Status badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${CATEGORY_COLORS[guide.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {guide.category}
                    </span>
                    {guide.is_featured && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </span>
                    )}
                    {!guide.is_published && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 
                    className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                    onClick={() => window.open(`/safety-guides/admin/${guide.id}/view`, '_blank')}
                  >
                    {guide.title}
                  </h3>

                  {/* Content preview */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {guide.content.substring(0, 150)}...
                  </p>

                  {/* Metadata */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {getAudienceIcon(guide.target_audience)}
                      <span className="capitalize">{guide.target_audience.replace('_', ' ')}</span>
                      {hasMultipleLanguages(guide) && (
                        <>
                          <span className="mx-1">•</span>
                          <Languages className="w-3 h-3" />
                          <span>Multi-language</span>
                        </>
                      )}
                    </div>
                    
                    {guide.disaster_types_data && guide.disaster_types_data.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Target className="w-3 h-3" />
                        <span>{guide.disaster_types_data.map(dt => dt.name).join(', ')}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span>{guide.created_by_name}</span>
                      <span className="mx-1">•</span>
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(guide.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/safety-guides/admin/${guide.id}/view`}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/safety-guides/admin/${guide.id}/edit`}
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFeatured(guide.id, guide.is_featured)}
                        className={`p-1 rounded ${guide.is_featured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-yellow-600'}`}
                        title={guide.is_featured ? 'Unfeature' : 'Feature'}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleTogglePublished(guide.id, guide.is_published)}
                        className={`p-1 rounded ${guide.is_published ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-green-600'}`}
                        title={guide.is_published ? 'Unpublish' : 'Publish'}
                      >
                        <Globe className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(guide.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
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
                <p className="text-sm text-gray-600">Total Guides</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {guides.filter(g => g.is_published).length}
                </p>
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
                <p className="text-2xl font-bold text-yellow-600">
                  {guides.filter(g => g.is_featured).length}
                </p>
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
                <p className="text-2xl font-bold text-gray-600">
                  {guides.filter(g => !g.is_published).length}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyGuideList;