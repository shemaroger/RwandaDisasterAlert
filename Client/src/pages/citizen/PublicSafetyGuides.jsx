import React, { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  BookOpen,
  Star,
  Users,
  Building,
  User,
  Calendar,
  Clock,
  Target,
  Paperclip,
  ChevronRight,
  Globe,
  Languages,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

const PublicSafetyGuides = () => {
  const [guides, setGuides] = useState([]);
  const [featuredGuides, setFeaturedGuides] = useState([]);
  const [disasterTypes, setDisasterTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('');
  const [selectedDisasterType, setSelectedDisasterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
  }, []);

  useEffect(() => {
    loadSafetyGuides();
  }, [searchTerm, selectedCategory, selectedAudience, selectedDisasterType, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Loading initial data...');
      
      // Load featured guides and disaster types in parallel
      const promises = [];
      
      // Featured guides
      promises.push(
        apiService.getFeaturedSafetyGuides().catch(err => {
          console.warn('Failed to load featured guides:', err);
          return { results: [], data: [] };
        })
      );
      
      // Disaster types
      promises.push(
        apiService.getDisasterTypes().catch(err => {
          console.warn('Failed to load disaster types:', err);
          return { results: [], data: [] };
        })
      );

      const [featuredResponse, disasterTypesResponse] = await Promise.all(promises);

      console.log('Featured guides response:', featuredResponse);
      console.log('Disaster types response:', disasterTypesResponse);

      const featured = featuredResponse.results || featuredResponse.data || featuredResponse || [];
      const disasters = disasterTypesResponse.results || disasterTypesResponse.data || disasterTypesResponse || [];

      setFeaturedGuides(Array.isArray(featured) ? featured : []);
      setDisasterTypes(Array.isArray(disasters) ? disasters : []);
      
      console.log('Set featured guides:', featured.length);
      console.log('Set disaster types:', disasters.length);
      
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load safety guides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSafetyGuides = async () => {
    try {
      setGuidesLoading(true);
      setError(null);
      
      const params = {
        is_published: true,
        page: currentPage,
        page_size: 12
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedAudience) params.target_audience = selectedAudience;
      if (selectedDisasterType) params.disaster_types = selectedDisasterType;

      console.log('Loading safety guides with params:', params);

      const response = await apiService.getSafetyGuides(params);
      
      console.log('Safety guides API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));

      // Handle different response structures
      let guidesData = [];
      let count = 0;

      if (response) {
        if (Array.isArray(response)) {
          // Direct array response
          guidesData = response;
          count = response.length;
        } else if (response.results && Array.isArray(response.results)) {
          // Paginated response with results array
          guidesData = response.results;
          count = response.count || response.results.length;
        } else if (response.data && Array.isArray(response.data)) {
          // Response with data array
          guidesData = response.data;
          count = response.count || response.data.length;
        } else {
          console.warn('Unexpected response structure:', response);
        }
      }
      
      console.log('Processed guides data:', guidesData);
      console.log('Total count:', count);
      
      setGuides(guidesData);
      setTotalPages(Math.ceil(count / 12) || 1);
      setTotalCount(count);
      
    } catch (err) {
      console.error('Failed to load safety guides:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(`Failed to load safety guides: ${err.message}`);
      setGuides([]);
      setTotalCount(0);
    } finally {
      setGuidesLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedAudience('');
    setSelectedDisasterType('');
    setCurrentPage(1);
  };

  const handleRetry = () => {
    setError(null);
    loadInitialData();
    loadSafetyGuides();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const getAudienceIcon = (audience) => {
    const Icon = AUDIENCE_ICONS[audience] || Users;
    return <Icon className="w-4 h-4" />;
  };

  const hasMultipleLanguages = (guide) => {
    return guide?.title_rw || guide?.title_fr || guide?.content_rw || guide?.content_fr;
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const SafetyGuideCard = ({ guide, featured = false }) => {
    if (!guide) return null;

    return (
      <div className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${featured ? 'ring-2 ring-yellow-200' : ''}`}>
        {/* Featured Image */}
        {guide.featured_image_url && (
          <div className="aspect-w-16 aspect-h-9 bg-gray-200">
            <img
              src={guide.featured_image_url}
              alt={guide.title || 'Safety guide'}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${CATEGORY_COLORS[guide.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                  {CATEGORY_OPTIONS.find(cat => cat.value === guide.category)?.label || guide.category || 'Uncategorized'}
                </span>
                {featured && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </span>
                )}
                {(guide.attachment_count > 0 || (guide.all_attachments && guide.all_attachments.length > 0)) && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    <Paperclip className="w-3 h-3 mr-1" />
                    {guide.attachment_count || guide.all_attachments?.length || 0}
                  </span>
                )}
                {hasMultipleLanguages(guide) && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    <Languages className="w-3 h-3 mr-1" />
                    Multi-lang
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {guide.title || 'Untitled Guide'}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {truncateContent(guide.content)}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              {getAudienceIcon(guide.target_audience)}
              <span>{TARGET_AUDIENCE_OPTIONS.find(aud => aud.value === guide.target_audience)?.label || guide.target_audience || 'General'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(guide.created_at)}</span>
            </div>
          </div>

          {/* Disaster Types */}
          {guide.disaster_types_data && guide.disaster_types_data.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {guide.disaster_types_data.slice(0, 3).map(type => (
                  <span key={type.id} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    <Target className="w-3 h-3 mr-1" />
                    {type.name}
                  </span>
                ))}
                {guide.disaster_types_data.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    +{guide.disaster_types_data.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action */}
          <Link
            to={`/safety-guides/public/${guide.id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm group"
          >
            Read Full Guide
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  };

  // Debug section
  const debugInfo = {
    loading,
    guidesLoading,
    error,
    guidesCount: guides.length,
    featuredCount: featuredGuides.length,
    disasterTypesCount: disasterTypes.length,
    totalCount,
    currentPage,
    totalPages,
    hasFilters: !!(searchTerm || selectedCategory || selectedAudience || selectedDisasterType)
  };

  console.log('Component state:', debugInfo);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading safety guides...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Safety & Preparedness Guides</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive guides to help you prepare for, respond to, and recover from emergencies and disasters.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search safety guides..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={guidesLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {guidesLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
            </form>

            {/* Filters */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={guidesLoading}
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={guidesLoading}
              >
                {TARGET_AUDIENCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedDisasterType}
                onChange={(e) => setSelectedDisasterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={guidesLoading}
              >
                <option value="">All Disaster Types</option>
                {disasterTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>

              <button
                onClick={clearFilters}
                disabled={guidesLoading}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">Error Loading Safety Guides</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Featured Guides */}
        {!error && featuredGuides.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Guides</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGuides.slice(0, 3).map(guide => (
                <SafetyGuideCard key={guide.id} guide={guide} featured={true} />
              ))}
            </div>
          </div>
        )}

        {/* All Guides */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              All Safety Guides
              {totalCount > 0 && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({totalCount} guide{totalCount !== 1 ? 's' : ''})
                </span>
              )}
            </h2>
            {guidesLoading && (
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            )}
          </div>

          {!error && guides.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {guides.map(guide => (
                  <SafetyGuideCard key={guide.id} guide={guide} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || guidesLoading}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          disabled={guidesLoading}
                          className={`px-3 py-2 border rounded-lg disabled:opacity-50 ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || guidesLoading}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : !error && !guidesLoading ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Safety Guides Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory || selectedAudience || selectedDisasterType
                  ? "No guides match your current search criteria. Try adjusting your filters."
                  : "No published safety guides are currently available."}
              </p>
              {(searchTerm || selectedCategory || selectedAudience || selectedDisasterType) && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : guidesLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading safety guides...</p>
            </div>
          ) : null}
        </div>

        {/* Development Debug Info */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <details>
              <summary className="cursor-pointer font-medium">Debug Info (Development Only)</summary>
              <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSafetyGuides;