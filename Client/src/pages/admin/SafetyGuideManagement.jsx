import React, { useState, useEffect, useRef } from 'react';
import { 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
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
  Square,
  BookOpen,
  Star,
  Globe,
  Image,
  FileText,
  Languages,
  Target,
  X,
  Save,
  Upload,
  Camera
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

const SafetyGuideManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGuides, setSelectedGuides] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
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
  const itemsPerPage = 20;

  // Form data for create/edit
  const [formData, setFormData] = useState({
    title: '',
    title_rw: '',
    title_fr: '',
    content: '',
    content_rw: '',
    content_fr: '',
    category: 'general',
    target_audience: 'general',
    disaster_types: [],
    featured_image: '',
    attachments: [],
    is_featured: false,
    is_published: true,
    display_order: 0
  });
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

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

  const resetForm = () => {
    setFormData({
      title: '',
      title_rw: '',
      title_fr: '',
      content: '',
      content_rw: '',
      content_fr: '',
      category: 'general',
      target_audience: 'general',
      disaster_types: [],
      featured_image: '',
      attachments: [],
      is_featured: false,
      is_published: true,
      display_order: 0
    });
    setFormErrors({});
  };

  const handleCreateClick = () => {
    resetForm();
    setCurrentGuide(null);
    setShowCreateModal(true);
  };

  const handleEditClick = async (guide) => {
    setCurrentGuide(guide);
    setFormData({
      title: guide.title || '',
      title_rw: guide.title_rw || '',
      title_fr: guide.title_fr || '',
      content: guide.content || '',
      content_rw: guide.content_rw || '',
      content_fr: guide.content_fr || '',
      category: guide.category || 'general',
      target_audience: guide.target_audience || 'general',
      disaster_types: guide.disaster_types || [],
      featured_image: guide.featured_image || '',
      attachments: guide.attachments || [],
      is_featured: guide.is_featured || false,
      is_published: guide.is_published !== undefined ? guide.is_published : true,
      display_order: guide.display_order || 0
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleViewClick = async (guide) => {
    try {
      setModalLoading(true);
      const fullGuide = await apiService.getSafetyGuide(guide.id);
      setCurrentGuide(fullGuide);
      setShowViewModal(true);
    } catch (err) {
      console.error('Failed to load guide details:', err);
      alert('Failed to load guide details');
    } finally {
      setModalLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }
    
    if (formData.content.trim().length < 50) {
      errors.content = 'Content must be at least 50 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setModalLoading(true);
    try {
      if (currentGuide) {
        // Update existing guide
        await apiService.updateSafetyGuide(currentGuide.id, formData);
        setShowEditModal(false);
      } else {
        // Create new guide
        await apiService.createSafetyGuide(formData);
        setShowCreateModal(false);
      }
      
      await loadSafetyGuides();
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
      setFormErrors({ submit: 'Failed to save safety guide. Please try again.' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDisasterTypesChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      disaster_types: checked 
        ? [...prev.disaster_types, value]
        : prev.disaster_types.filter(id => id !== value)
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // In a real implementation, you'd upload to your storage service
    // For now, we'll simulate with a URL
    const imageUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      featured_image: imageUrl
    }));
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

  // Modal Component
  const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
      'sm': 'max-w-md',
      'lg': 'max-w-2xl',
      'xl': 'max-w-4xl',
      'full': 'max-w-6xl'
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-screen overflow-y-auto`}>
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    );
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Guide Management</h1>
              <p className="text-gray-600">Create and manage safety guides and preparedness information</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Guide
              </button>
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
              <button
                onClick={handleCreateClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Guide
              </button>
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
                      onClick={() => handleViewClick(guide)}
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
                    onClick={() => handleViewClick(guide)}
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
                      <button
                        onClick={() => handleViewClick(guide)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(guide)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={currentGuide ? 'Edit Safety Guide' : 'Create Safety Guide'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formErrors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-red-800">{formErrors.submit}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {CATEGORY_OPTIONS.slice(1).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience *
              </label>
              <select
                name="target_audience"
                value={formData.target_audience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {TARGET_AUDIENCE_OPTIONS.slice(1).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (English) *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (Kinyarwanda)
                </label>
                <input
                  type="text"
                  name="title_rw"
                  value={formData.title_rw}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (French)
                </label>
                <input
                  type="text"
                  name="title_fr"
                  value={formData.title_fr}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Content Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content (English) *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={8}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {formErrors.content && (
                <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content (Kinyarwanda)
                </label>
                <textarea
                  name="content_rw"
                  value={formData.content_rw}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content (French)
                </label>
                <textarea
                  name="content_fr"
                  value={formData.content_fr}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Camera className="w-4 h-4" />
                Upload Image
              </button>
              {formData.featured_image && (
                <div className="flex items-center gap-2">
                  <img
                    src={getMediaUrl(formData.featured_image)}
                    alt="Featured"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Disaster Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable Disaster Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {disasterTypes.map(type => (
                <label key={type.id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={type.id}
                    checked={formData.disaster_types.includes(type.id)}
                    onChange={handleDisasterTypesChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured Guide</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Published</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {modalLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {currentGuide ? 'Update Guide' : 'Create Guide'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Safety Guide Details"
        size="xl"
      >
        {currentGuide && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentGuide.title}</h2>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${CATEGORY_COLORS[currentGuide.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {currentGuide.category}
                    </span>
                    {currentGuide.is_featured && (
                      <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Star className="w-4 h-4 mr-1" />
                        Featured
                      </span>
                    )}
                    <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${currentGuide.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {currentGuide.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditClick(currentGuide);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  {getAudienceIcon(currentGuide.target_audience)}
                  <span className="capitalize">{currentGuide.target_audience.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{currentGuide.created_by_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(currentGuide.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {currentGuide.featured_image && (
              <div>
                <img
                  src={getMediaUrl(currentGuide.featured_image)}
                  alt={currentGuide.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Content */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Content (English)</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{currentGuide.content}</p>
                </div>
              </div>

              {currentGuide.content_rw && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Content (Kinyarwanda)</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{currentGuide.content_rw}</p>
                  </div>
                </div>
              )}

              {currentGuide.content_fr && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Content (French)</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{currentGuide.content_fr}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Disaster Types */}
            {currentGuide.disaster_types_data && currentGuide.disaster_types_data.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Applicable Disaster Types</h3>
                <div className="flex flex-wrap gap-2">
                  {currentGuide.disaster_types_data.map(type => (
                    <span
                      key={type.id}
                      className="inline-flex px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                    >
                      {type.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

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
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyGuideManagement;