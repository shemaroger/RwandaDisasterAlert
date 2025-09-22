import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  XCircle,
  Star,
  Globe,
  User,
  Calendar,
  Clock,
  Target,
  FileText,
  Download,
  ExternalLink,
  Languages,
  BookOpen,
  Users,
  Building,
  Phone,
  Copy,
  Check,
  AlertTriangle,
  X,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Constants moved to top level
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

// Enhanced helper function for media URLs (with reduced logging for production)
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) {
    console.warn('getMediaUrl: No media path provided');
    return null;
  }
  
  // If it's already a full URL, return as-is
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  
  // Construct URL from base URL and path
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
  
  // Handle files that might not have the uploads prefix
  const finalPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  
  // Properly encode the URL components
  const encodedPath = finalPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const fullUrl = `${baseUrl}/${encodedPath}`;
  
  // Only log in development
  if (import.meta.env.DEV) {
    console.log('getMediaUrl:', mediaPath, '→', fullUrl);
  }
  
  return fullUrl;
};

// Custom confirmation modal component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-start">
          <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
            type === 'danger' ? 'bg-red-100' : type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
          } sm:mx-0 sm:h-10 sm:w-10`}>
            <AlertTriangle className={`h-6 w-6 ${
              type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
            }`} />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${typeStyles[type]}`}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast notification component
const Toast = ({ message, type = "success", isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500"
  };

  return (
    <div className={`fixed top-4 right-4 ${typeStyles[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}>
      {type === 'success' && <Check className="w-5 h-5" />}
      {type === 'error' && <AlertTriangle className="w-5 h-5" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ViewSafetyGuide = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [actionLoading, setActionLoading] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [showImageDebug, setShowImageDebug] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);

  useEffect(() => {
    loadSafetyGuide();
  }, [id]);

  const loadSafetyGuide = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getSafetyGuide(id);
      const guideData = response.data || response;
      
      setGuide(guideData);
      
    } catch (err) {
      setError('Failed to load safety guide details');
      console.error('Load safety guide error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const setLoadingState = (action, isLoading) => {
    setActionLoading(prev => ({ ...prev, [action]: isLoading }));
  };

  const handleToggleAction = async (field, action, successMessage) => {
    setLoadingState(action, true);
    try {
      await apiService.updateSafetyGuide(id, { [field]: !guide[field] });
      setGuide(prev => ({ ...prev, [field]: !prev[field] }));
      showToast(successMessage, 'success');
    } catch (err) {
      console.error(`${action} error:`, err);
      showToast(`Failed to ${action.toLowerCase()}. Please try again.`, 'error');
    } finally {
      setLoadingState(action, false);
    }
  };

  const handleDelete = () => {
    setShowConfirmation({
      title: 'Delete Safety Guide',
      message: 'Are you sure you want to delete this safety guide? This action cannot be undone.',
      onConfirm: async () => {
        setLoadingState('delete', true);
        try {
          await apiService.deleteSafetyGuide(id);
          navigate('/safety-guides/admin', { 
            state: { message: 'Safety guide deleted successfully!' }
          });
        } catch (err) {
          console.error('Delete error:', err);
          showToast('Failed to delete safety guide. Please try again.', 'error');
          setLoadingState('delete', false);
        }
        setShowConfirmation(null);
      },
      onCancel: () => setShowConfirmation(null),
      type: 'danger'
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    console.error('Original path:', guide?.featured_image);
    console.error('Browser error:', e.type);
    setImageError({
      url: e.target.src,
      originalPath: guide?.featured_image,
      errorType: e.type,
      timestamp: new Date().toISOString()
    });
    e.target.style.display = 'none';
    // Show debug info automatically when image fails
    setShowImageDebug(true);
  };

  const handleImageLoad = (e) => {
    console.log('Image loaded successfully:', e.target.src);
    setImageError(null);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const currentContent = getCurrentContent();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentContent.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #333; }
            .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
            .content { margin-top: 30px; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h1>${currentContent.title}</h1>
          <div class="meta">
            <p><strong>Category:</strong> ${CATEGORY_LABELS[guide.category]}</p>
            <p><strong>Target Audience:</strong> ${TARGET_AUDIENCE_LABELS[guide.target_audience]}</p>
            <p><strong>Created:</strong> ${formatDate(guide.created_at)}</p>
            <p><strong>Created by:</strong> ${guide.created_by_name}</p>
          </div>
          ${guide.featured_image ? `<img src="${getMediaUrl(guide.featured_image)}" alt="Featured image" />` : ''}
          <div class="content">
            ${currentContent.content.split('\n').map(p => `<p>${p}</p>`).join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
            {error || "The safety guide you're looking for doesn't exist."}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/safety-guides/admin"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Safety Guides
            </Link>
            <button
              onClick={loadSafetyGuide}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentContent = getCurrentContent();
  const availableLanguages = getAvailableLanguages();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notifications */}
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />

      {/* Confirmation modal */}
      {showConfirmation && (
        <ConfirmationModal
          isOpen={true}
          title={showConfirmation.title}
          message={showConfirmation.message}
          onConfirm={showConfirmation.onConfirm}
          onClose={showConfirmation.onCancel}
          type={showConfirmation.type}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link to="/safety-guides/admin" className="hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Safety Guides
                </Link>
                <span>/</span>
                <span className="text-gray-900">#{id.slice(0, 8)}</span>
              </nav>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentContent.title}</h1>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${CATEGORY_COLORS[guide.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {CATEGORY_LABELS[guide.category] || guide.category}
                    </span>
                    {guide.is_featured && (
                      <span className="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </span>
                    )}
                    <span 
                      className={`inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full ${guide.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      aria-label={`Status: ${guide.is_published ? 'Published' : 'Draft'}`}
                    >
                      {guide.is_published ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {guide.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getAudienceIcon(guide.target_audience)}
                      <span>{TARGET_AUDIENCE_LABELS[guide.target_audience] || guide.target_audience}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{guide.created_by_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(guide.created_at)}</span>
                    </div>
                    {hasMultipleLanguages() && (
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        <span>Multi-language</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                title="Copy link to guide"
                aria-label="Copy link to guide"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>

              <button
                onClick={() => handleToggleAction('is_featured', 'feature', guide.is_featured ? 'Guide unfeatured successfully!' : 'Guide featured successfully!')}
                disabled={actionLoading.feature}
                className={`p-2 rounded-lg transition-colors ${guide.is_featured ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}
                title={guide.is_featured ? 'Unfeature guide' : 'Feature guide'}
                aria-label={guide.is_featured ? 'Unfeature guide' : 'Feature guide'}
              >
                {actionLoading.feature ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => handleToggleAction('is_published', 'publish', guide.is_published ? 'Guide unpublished successfully!' : 'Guide published successfully!')}
                disabled={actionLoading.publish}
                className={`p-2 rounded-lg transition-colors ${guide.is_published ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}
                title={guide.is_published ? 'Unpublish guide' : 'Publish guide'}
                aria-label={guide.is_published ? 'Unpublish guide' : 'Publish guide'}
              >
                {actionLoading.publish ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
              </button>

              <Link
                to={`/safety-guides/admin/${id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              
              <button
                onClick={handleDelete}
                disabled={actionLoading.delete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {actionLoading.delete ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                          aria-pressed={activeLanguage === lang.key}
                          aria-label={`Switch to ${lang.label} content`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Featured Image */}
              {guide.featured_image && (
                <div className="px-6 py-4">
                  <div className="relative">
                    <img
                      src={getMediaUrl(guide.featured_image)}
                      alt={`Featured image for ${currentContent.title}`}
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      onLoad={(e) => {
                        console.log('Image loaded successfully:', e.target.src);
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        console.error('Original path:', guide.featured_image);
                        e.target.style.display = 'none';
                        // Show fallback
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div 
                      className="w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hidden"
                      style={{ display: 'none' }}
                    >
                      <div className="text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Featured image unavailable</p>
                        <p className="text-xs mt-1">Path: {guide.featured_image}</p>
                        <button
                          onClick={() => {
                            console.log('Retrying image load...');
                            const img = document.querySelector(`img[alt*="Featured image"]`);
                            if (img) {
                              img.style.display = 'block';
                              img.src = img.src + '?retry=' + Date.now(); // Force reload
                              img.nextElementSibling.style.display = 'none';
                            }
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Retry loading image
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Debug info (remove in production) */}
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <strong>Debug:</strong> {guide.featured_image} → {getMediaUrl(guide.featured_image)}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="px-6 py-6">
                <div className="prose max-w-none">
                  <div 
                    className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base"
                    role="main"
                    aria-label="Guide content"
                  >
                    {currentContent.content}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {guide.attachments && guide.attachments.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Additional Resources</h3>
                  <div className="space-y-2" role="list">
                    {guide.attachments.map((attachment, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        role="listitem"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-900">
                            {attachment.name || `Attachment ${index + 1}`}
                          </span>
                        </div>
                        {attachment.url && (
                          <a
                            href={getMediaUrl(attachment.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 p-1"
                            aria-label={`Open ${attachment.name || 'attachment'} in new tab`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Guide Details</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">ID</dt>
                  <dd className="text-sm text-gray-900 font-mono break-all">{guide.id}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Category</dt>
                  <dd className="text-sm text-gray-900">
                    {CATEGORY_LABELS[guide.category] || guide.category}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Target Audience</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    {getAudienceIcon(guide.target_audience)}
                    <span className="ml-2">
                      {TARGET_AUDIENCE_LABELS[guide.target_audience] || guide.target_audience}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Display Order</dt>
                  <dd className="text-sm text-gray-900">{guide.display_order}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Status</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${guide.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {guide.is_published ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {guide.is_published ? 'Published' : 'Draft'}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Featured</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${guide.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      <Star className="w-3 h-3 mr-1" />
                      {guide.is_featured ? 'Yes' : 'No'}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Created By</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    {guide.created_by_name}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    {formatDate(guide.created_at)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Last Updated</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    {formatDate(guide.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Disaster Types */}
            {guide.disaster_types_data && guide.disaster_types_data.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Applicable Disasters</h3>
                <div className="space-y-2" role="list">
                  {guide.disaster_types_data.map(type => (
                    <div key={type.id} className="flex items-center gap-2" role="listitem">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-900">{type.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to={`/safety-guides/admin/${id}/edit`}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Guide
                </Link>
                
                <button
                  onClick={() => handleToggleAction('is_featured', 'feature', guide.is_featured ? 'Guide unfeatured successfully!' : 'Guide featured successfully!')}
                  disabled={actionLoading.feature}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    guide.is_featured
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50'
                      : 'border border-yellow-300 text-yellow-600 hover:bg-yellow-50 disabled:opacity-50'
                  }`}
                  aria-label={guide.is_featured ? 'Unfeature this guide' : 'Feature this guide'}
                >
                  {actionLoading.feature ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  {guide.is_featured ? 'Unfeature' : 'Feature'}
                </button>

                <button
                  onClick={() => handleToggleAction('is_published', 'publish', guide.is_published ? 'Guide unpublished successfully!' : 'Guide published successfully!')}
                  disabled={actionLoading.publish}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    guide.is_published
                      ? 'border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50'
                      : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                  }`}
                  aria-label={guide.is_published ? 'Unpublish this guide' : 'Publish this guide'}
                >
                  {actionLoading.publish ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {guide.is_published ? 'Unpublish' : 'Publish'}
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                  aria-label="Copy link to this guide"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                  aria-label="Print this guide"
                >
                  <Download className="w-4 h-4" />
                  Print Guide
                </button>

                <button
                  onClick={handleDelete}
                  disabled={actionLoading.delete}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  aria-label="Delete this guide permanently"
                >
                  {actionLoading.delete ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Guide
                </button>
              </div>
            </div>

            {/* Language Availability */}
            {hasMultipleLanguages() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Languages className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Multi-Language Support</h3>
                    <div className="space-y-1 text-sm text-blue-800" role="list">
                      <div className="flex items-center gap-1" role="listitem">
                        <Check className="w-3 h-3" />
                        <span>English</span>
                      </div>
                      {(guide.title_rw || guide.content_rw) && (
                        <div className="flex items-center gap-1" role="listitem">
                          <Check className="w-3 h-3" />
                          <span>Kinyarwanda</span>
                        </div>
                      )}
                      {(guide.title_fr || guide.content_fr) && (
                        <div className="flex items-center gap-1" role="listitem">
                          <Check className="w-3 h-3" />
                          <span>French</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Share Options */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Share Guide</h3>
              <div className="space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  aria-label="Copy link to share this guide"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Link Copied!' : 'Copy Share Link'}
                </button>
                
                <a
                  href={`mailto:?subject=${encodeURIComponent(currentContent.title)}&body=${encodeURIComponent(`Check out this safety guide: ${window.location.href}`)}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  aria-label="Share this guide via email"
                >
                  <Phone className="w-4 h-4" />
                  Share via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSafetyGuide;