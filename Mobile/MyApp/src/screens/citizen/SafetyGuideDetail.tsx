import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Users,
  Building,
  User,
  BookOpen,
  Star,
  Languages,
  Paperclip,
  ExternalLink,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  RefreshCw,
  XCircle,
  Globe,
  Share2,
  Printer
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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

// Helper function to get file type icon
const getFileTypeIcon = (fileType) => {
  if (!fileType) return FileText;
  
  const type = fileType.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type)) {
    return ImageIcon;
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
    return Video;
  } else if (['mp3', 'wav', 'ogg', 'aac'].includes(type)) {
    return Music;
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
    return Archive;
  } else {
    return FileText;
  }
};

const PublicSafetyGuideDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [relatedGuides, setRelatedGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState('en');

  const CATEGORY_COLORS = {
    'before': 'bg-blue-100 text-blue-800 border-blue-200',
    'during': 'bg-red-100 text-red-800 border-red-200',
    'after': 'bg-green-100 text-green-800 border-green-200',
    'general': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const CATEGORY_LABELS = {
    'before': 'Before Disaster',
    'during': 'During Disaster',
    'after': 'After Disaster',
    'general': 'General Preparedness'
  };

  const TARGET_AUDIENCE_LABELS = {
    'general': 'General Public',
    'families': 'Families with Children',
    'elderly': 'Elderly',
    'disabled': 'People with Disabilities',
    'business': 'Businesses',
    'schools': 'Schools'
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
    loadSafetyGuide();
  }, [id]);

  const loadSafetyGuide = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getSafetyGuide(id);
      const guideData = response.data || response;
      
      // Check if guide is published
      if (!guideData.is_published) {
        setError('This safety guide is not available for public viewing.');
        return;
      }
      
      setGuide(guideData);
      
      // Load related guides
      if (guideData.category) {
        try {
          const relatedResponse = await apiService.getSafetyGuides({
            category: guideData.category,
            is_published: true,
            page_size: 4
          });
          const related = (relatedResponse.results || []).filter(g => g.id !== guideData.id);
          setRelatedGuides(related.slice(0, 3));
        } catch (err) {
          console.error('Failed to load related guides:', err);
        }
      }
      
    } catch (err) {
      console.error('Load safety guide error:', err);
      if (err.response?.status === 404) {
        setError('Safety guide not found.');
      } else {
        setError('Failed to load safety guide details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAudienceIcon = (audience) => {
    const Icon = AUDIENCE_ICONS[audience] || Users;
    return <Icon className="w-5 h-5" />;
  };

  const hasMultipleLanguages = () => {
    return guide?.title_rw || guide?.title_fr || guide?.content_rw || guide?.content_fr;
  };

  const getAvailableLanguages = () => {
    const languages = [{ key: 'en', label: 'English', available: true }];
    
    if (guide?.title_rw || guide?.content_rw) {
      languages.push({ key: 'rw', label: 'Kinyarwanda', available: true });
    }
    
    if (guide?.title_fr || guide?.content_fr) {
      languages.push({ key: 'fr', label: 'French', available: true });
    }
    
    return languages;
  };

  const getCurrentContent = () => {
    switch (activeLanguage) {
      case 'rw':
        return {
          title: guide?.title_rw || guide?.title,
          content: guide?.content_rw || guide?.content
        };
      case 'fr':
        return {
          title: guide?.title_fr || guide?.title,
          content: guide?.content_fr || guide?.content
        };
      default:
        return {
          title: guide?.title,
          content: guide?.content
        };
    }
  };

  // Get all attachments using the unified method
  const getAllAttachments = () => {
    if (!guide) return [];
    
    const attachments = [];
    
    // Get file-based attachments (slots 1-5)
    for (let i = 1; i <= 5; i++) {
      const file = guide[`attachment_${i}`];
      const url = guide[`attachment_${i}_url`];
      const name = guide[`attachment_${i}_name`];
      const description = guide[`attachment_${i}_description`];
      const sizeDisplay = guide[`attachment_${i}_size_display`];
      
      if (file || url) {
        // Extract file type from URL or filename
        const fileName = url ? url.split('/').pop() : (name || `attachment_${i}`);
        const fileType = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : 'unknown';
        
        attachments.push({
          id: `slot_${i}`,
          name: name || fileName,
          description: description || '',
          url: url || file,
          type: fileType,
          size_display: sizeDisplay,
          source: 'file',
          slot: i
        });
      }
    }
    
    // Get legacy attachments
    if (guide.all_attachments) {
      guide.all_attachments.forEach((attachment, index) => {
        if (attachment.source === 'legacy') {
          attachments.push({
            ...attachment,
            id: attachment.id || `legacy_${index}`
          });
        }
      });
    } else if (guide.legacy_attachments) {
      guide.legacy_attachments.forEach((attachment, index) => {
        attachments.push({
          ...attachment,
          id: `legacy_${index}`,
          source: 'legacy'
        });
      });
    }
    
    return attachments;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: guide.title,
          text: `Check out this safety guide: ${guide.title}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Sharing cancelled');
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading safety guide...</p>
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error ? 'Error Loading Safety Guide' : 'Safety Guide Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The safety guide you're looking for doesn't exist or is not available."}
          </p>
          <Link
            to="/safety-guides/public"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Safety Guides
          </Link>
        </div>
      </div>
    );
  }

  const currentContent = getCurrentContent();
  const availableLanguages = getAvailableLanguages();
  const allAttachments = getAllAttachments();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link to="/safety-guides/public" className="hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Safety Guides
            </Link>
            <span>/</span>
            <span className="text-gray-900 truncate">{currentContent.title}</span>
          </nav>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${CATEGORY_COLORS[guide.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                  {CATEGORY_LABELS[guide.category] || guide.category}
                </span>
                {guide.is_featured && (
                  <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </span>
                )}
                {allAttachments.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    <Paperclip className="w-3 h-3 mr-1" />
                    {allAttachments.length} attachment{allAttachments.length !== 1 ? 's' : ''}
                  </span>
                )}
                {hasMultipleLanguages() && (
                  <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    <Languages className="w-3 h-3 mr-1" />
                    Multi-language
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">{currentContent.title}</h1>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  {getAudienceIcon(guide.target_audience)}
                  <span>{TARGET_AUDIENCE_LABELS[guide.target_audience] || guide.target_audience}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(guide.created_at)}</span>
                </div>
                {guide.updated_at !== guide.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Updated {formatDate(guide.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="Print"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Language Selector */}
              {availableLanguages.length > 1 && (
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Language:</span>
                    <div className="flex gap-2">
                      {availableLanguages.map(lang => (
                        <button
                          key={lang.key}
                          onClick={() => setActiveLanguage(lang.key)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${
                            activeLanguage === lang.key
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Featured Image */}
              {guide.featured_image_url && (
                <div className="px-6 py-4">
                  <img
                    src={guide.featured_image_url}
                    alt={currentContent.title}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="px-6 py-6">
                <div className="prose max-w-none">
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                    {currentContent.content}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {allAttachments.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Additional Resources ({allAttachments.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {allAttachments.map((attachment) => {
                      const FileIcon = getFileTypeIcon(attachment.type);
                      
                      return (
                        <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.name || `Attachment ${attachment.slot || ''}`}
                              </p>
                              {attachment.description && (
                                <p className="text-xs text-gray-600 truncate mt-1">
                                  {attachment.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {attachment.size_display && (
                                  <span className="text-xs text-gray-500">
                                    {attachment.size_display}
                                  </span>
                                )}
                                {attachment.type && (
                                  <span className="text-xs text-gray-500 uppercase">
                                    {attachment.type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {attachment.url && (
                            <a
                              href={getMediaUrl(attachment.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 p-2 flex-shrink-0 hover:bg-blue-50 rounded"
                              title="Download attachment"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Target Audience</dt>
                  <dd className="flex items-center text-sm text-gray-900 mt-1">
                    {getAudienceIcon(guide.target_audience)}
                    <span className="ml-2">
                      {TARGET_AUDIENCE_LABELS[guide.target_audience] || guide.target_audience}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {CATEGORY_LABELS[guide.category] || guide.category}
                  </dd>
                </div>

                {allAttachments.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Resources</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {allAttachments.length} attachment{allAttachments.length !== 1 ? 's' : ''}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Published</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {formatDate(guide.created_at)}
                  </dd>
                </div>

                {guide.updated_at !== guide.created_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {formatDate(guide.updated_at)}
                    </dd>
                  </div>
                )}
              </div>
            </div>

            {/* Applicable Disasters */}
            {guide.disaster_types_data && guide.disaster_types_data.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Applicable Disasters</h3>
                <div className="space-y-2">
                  {guide.disaster_types_data.map(type => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-900">{type.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Language Support */}
            {hasMultipleLanguages() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Languages className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Available Languages</h3>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>✓ English</p>
                      {(guide.title_rw || guide.content_rw) && <p>✓ Kinyarwanda</p>}
                      {(guide.title_fr || guide.content_fr) && <p>✓ French</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handlePrint}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Guide
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share Guide
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Guides */}
        {relatedGuides.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Safety Guides</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedGuides.map(relatedGuide => (
                <Link
                  key={relatedGuide.id}
                  to={`/safety-guides/public/${relatedGuide.id}`}
                  className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {relatedGuide.featured_image_url && (
                    <img
                      src={relatedGuide.featured_image_url}
                      alt={relatedGuide.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${CATEGORY_COLORS[relatedGuide.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        {CATEGORY_LABELS[relatedGuide.category] || relatedGuide.category}
                      </span>
                      {relatedGuide.is_featured && (
                        <Star className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedGuide.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {relatedGuide.content?.substring(0, 100)}...
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSafetyGuideDetail;