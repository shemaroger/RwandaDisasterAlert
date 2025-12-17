import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Edit, 
  CheckCircle, 
  XCircle,
  MapPin,
  Navigation,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  Users,
  Building,
  Phone,
  Download,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  X,
  ArrowUpCircle,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Info
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Enhanced helper function to construct media URLs
const getMediaUrl = (media) => {
  if (!media) {
    console.warn('getMediaUrl: No media provided');
    return null;
  }
  
  if (typeof media === 'object' && media.file_url) {
    console.log('✓ Using file_url from serializer:', media.file_url);
    return media.file_url;
  }
  
  if (typeof media === 'object' && media.file) {
    const mediaPath = media.file;
    
    if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
      console.log('✓ File is already full URL:', mediaPath);
      return mediaPath;
    }
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    
    let fullUrl;
    if (mediaPath.startsWith('/media/')) {
      fullUrl = `${baseUrl}${mediaPath}`;
    } else if (mediaPath.startsWith('media/')) {
      fullUrl = `${baseUrl}/${mediaPath}`;
    } else {
      fullUrl = `${baseUrl}/media/${mediaPath}`;
    }
    
    console.log('→ Constructed URL:', { original: mediaPath, constructed: fullUrl });
    return fullUrl;
  }
  
  if (typeof media === 'string') {
    if (media.startsWith('http://') || media.startsWith('https://')) {
      return media;
    }
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    
    let fullUrl;
    if (media.startsWith('/media/')) {
      fullUrl = `${baseUrl}${media}`;
    } else if (media.startsWith('media/')) {
      fullUrl = `${baseUrl}/${media}`;
    } else {
      fullUrl = `${baseUrl}/media/${media}`;
    }
    
    return fullUrl;
  }
  
  console.error('✗ Unable to construct media URL from:', media);
  return null;
};

// Resolution Modal Component
const ResolutionModal = ({ isOpen, onClose, onSubmit, incidentTitle }) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setError(t('modal.provideResolutionNotes', { defaultValue: 'Please provide resolution notes' }));
      return;
    }

    if (notes.trim().length < 10) {
      setError(t('modal.resolutionNotesMinLength', { defaultValue: 'Resolution notes must be at least 10 characters' }));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(notes.trim());
      setNotes('');
      onClose();
    } catch (err) {
      setError(err.message || t('messages.failedToResolve', { defaultValue: 'Failed to submit resolution notes' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNotes('');
      setError('');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('modal.resolveIncident', { defaultValue: 'Resolve Incident' })}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('modal.markAsResolved', { defaultValue: 'Mark this incident as resolved' })}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {t('modal.incident', { defaultValue: 'Incident' })}
              </p>
              <p className="text-gray-900">{incidentTitle}</p>
            </div>

            <div>
              <label 
                htmlFor="resolution-notes" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('modal.resolutionNotes', { defaultValue: 'Resolution Notes' })} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="resolution-notes"
                rows={6}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder={t('modal.resolutionNotesPlaceholder', { 
                  defaultValue: 'Describe how the incident was resolved, actions taken, and any follow-up required...' 
                })}
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('modal.minCharacters', { defaultValue: 'Minimum 10 characters. Press Ctrl+Enter to submit quickly.' })}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                {t('modal.resolutionGuidelines', { defaultValue: 'Guidelines for Resolution Notes:' })}
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>{t('modal.guidelineActions', { defaultValue: 'Describe the actions taken to resolve the incident' })}</li>
                <li>{t('modal.guidelineResources', { defaultValue: 'Include any resources deployed or personnel involved' })}</li>
                <li>{t('modal.guidelineFollowUp', { defaultValue: 'Note any remaining concerns or follow-up required' })}</li>
                <li>{t('modal.guidelineReporterContact', { defaultValue: 'Mention if the reporter was contacted/satisfied' })}</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !notes.trim()}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('actions.resolving', { defaultValue: 'Resolving...' })}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {t('actions.markAsResolved', { defaultValue: 'Mark as Resolved' })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Escalation Modal Component
const EscalationModal = ({ isOpen, onClose, onSubmit, incidentTitle, currentLevel, nextLevel }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const LEVEL_LABELS = {
    village: t('adminLevel.village', { defaultValue: 'Village' }),
    sector: t('adminLevel.sector', { defaultValue: 'Sector' }),
    district: t('adminLevel.district', { defaultValue: 'District' }),
    province: t('adminLevel.province', { defaultValue: 'Province' }),
    national: t('adminLevel.national', { defaultValue: 'National' })
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError(t('modal.provideEscalationReason', { defaultValue: 'Please provide an escalation reason' }));
      return;
    }

    if (reason.trim().length < 10) {
      setError(t('modal.escalationReasonMinLength', { defaultValue: 'Escalation reason must be at least 10 characters' }));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      setError(err.message || t('messages.failedToEscalate', { defaultValue: 'Failed to escalate incident' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <ArrowUpCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('modal.escalateIncident', { defaultValue: 'Escalate Incident' })}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('modal.escalateFrom', { 
                    from: LEVEL_LABELS[currentLevel], 
                    to: LEVEL_LABELS[nextLevel],
                    defaultValue: `Escalate from ${LEVEL_LABELS[currentLevel]} to ${LEVEL_LABELS[nextLevel]} level`
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {t('modal.incident', { defaultValue: 'Incident' })}
              </p>
              <p className="text-gray-900">{incidentTitle}</p>
            </div>

            <div>
              <label 
                htmlFor="escalation-reason" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('modal.reasonForEscalation', { defaultValue: 'Reason for Escalation' })} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="escalation-reason"
                rows={5}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder={t('modal.escalationPlaceholder', { 
                  defaultValue: 'Explain why this incident needs to be escalated to the next level (e.g., resources beyond our capacity, specialized expertise required, wider impact than initially assessed...)' 
                })}
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('modal.escalationMinCharacters', { defaultValue: 'Minimum 10 characters. Be specific about what resources or capabilities are needed.' })}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                {t('modal.whenToEscalate', { defaultValue: 'When to escalate:' })}
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>{t('modal.escalationReason1', { defaultValue: "Resources or expertise beyond current level's capacity" })}</li>
                <li>{t('modal.escalationReason2', { defaultValue: 'Impact wider than initially assessed' })}</li>
                <li>{t('modal.escalationReason3', { defaultValue: 'Requires coordination across multiple areas' })}</li>
                <li>{t('modal.escalationReason4', { defaultValue: 'Specialized equipment or personnel needed' })}</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason.trim()}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('actions.escalating', { defaultValue: 'Escalating...' })}
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  {t('modal.escalateTo', { level: LEVEL_LABELS[nextLevel], defaultValue: `Escalate to ${LEVEL_LABELS[nextLevel]}` })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Media Gallery Component
const MediaGallery = ({ mediaFiles }) => {
  const { t, i18n } = useTranslation();
  
  const images = mediaFiles.filter(m => m.media_type === 'image');
  const videos = mediaFiles.filter(m => m.media_type === 'video');
  const documents = mediaFiles.filter(m => m.media_type === 'document');

  const currentLocale = i18n.language || 'en-US';
  const safeLocale = ['en', 'en-US', 'fr', 'rw', 'sw', 'fr-FR', 'rw-RW', 'sw-KE'].includes(currentLocale) 
    ? currentLocale 
    : 'en-US';

  const formatDate = (dateString) => {
    if (!dateString) return t('unknownDate', { defaultValue: 'Unknown date' });
    try {
      return new Date(dateString).toLocaleDateString(safeLocale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return t('unknownDate', { defaultValue: 'Unknown date' });
    }
  };

  return (
    <div className="space-y-6">
      {images.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-5 h-5 text-gray-700" />
            <h3 className="font-medium text-gray-900">
              {t('media.images', { defaultValue: 'Images' })} ({images.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((media) => {
              const imageUrl = getMediaUrl(media);
              return (
                <div key={media.id} className="relative group">
                  <img
                    src={imageUrl}
                    alt={media.caption || t('media.incidentEvidence', { defaultValue: 'Incident evidence' })}
                    className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => window.open(imageUrl, '_blank')}
                    onLoad={() => console.log('✅ Image loaded:', imageUrl)}
                    onError={(e) => {
                      console.error('❌ Image failed:', imageUrl);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-32 bg-gray-100 rounded-lg border items-center justify-center flex-col p-2">
                    <XCircle className="w-8 h-8 text-red-400 mb-2" />
                    <span className="text-gray-500 text-xs text-center mb-2">
                      {t('media.imageUnavailable', { defaultValue: 'Image unavailable' })}
                    </span>
                    <button 
                      onClick={() => window.open(imageUrl, '_blank')} 
                      className="text-blue-600 text-xs hover:underline"
                    >
                      {t('media.tryOpeningDirectly', { defaultValue: 'Try opening directly' })}
                    </button>
                  </div>
                  {media.caption && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{media.caption}</p>}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Video className="w-5 h-5 text-gray-700" />
            <h3 className="font-medium text-gray-900">
              {t('media.videos', { defaultValue: 'Videos' })} ({videos.length})
            </h3>
          </div>
          <div className="space-y-4">
            {videos.map((media) => {
              const videoUrl = getMediaUrl(media);
              return (
                <div key={media.id} className="border rounded-lg p-3 bg-gray-50">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full max-w-md rounded-lg"
                    preload="metadata"
                    onLoadedMetadata={() => console.log('✅ Video loaded:', videoUrl)}
                    onError={(e) => {
                      console.error('❌ Video failed:', videoUrl);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  >
                    {t('media.browserNotSupported', { defaultValue: 'Your browser does not support the video tag.' })}
                  </video>
                  <div className="hidden bg-gray-100 rounded-lg border p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <span className="text-gray-500 block mb-2">
                      {t('media.videoUnavailable', { defaultValue: 'Video unavailable' })}
                    </span>
                    <a 
                      href={videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 text-sm hover:underline"
                    >
                      {t('media.tryOpeningDirectly', { defaultValue: 'Try opening directly' })}
                    </a>
                  </div>
                  {media.caption && <p className="text-sm text-gray-700 mt-2">{media.caption}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {t('media.uploaded', { defaultValue: 'Uploaded' })} {formatDate(media.uploaded_at)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-gray-700" />
            <h3 className="font-medium text-gray-900">
              {t('media.documents', { defaultValue: 'Documents' })} ({documents.length})
            </h3>
          </div>
          <div className="space-y-2">
            {documents.map((media) => {
              const docUrl = getMediaUrl(media);
              const fileName = media.file.split('/').pop();
              return (
                <a 
                  key={media.id} 
                  href={docUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{media.caption || fileName}</p>
                    <p className="text-xs text-gray-500">
                      {t('media.uploaded', { defaultValue: 'Uploaded' })} {formatDate(media.uploaded_at)}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const IncidentDetailPage = ({ citizenView = false }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { languageKey } = useLanguage();
  
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const currentLocale = i18n.language || 'en-US';
  const safeLocale = ['en', 'en-US', 'fr', 'rw', 'sw', 'fr-FR', 'rw-RW', 'sw-KE'].includes(currentLocale) 
    ? currentLocale 
    : 'en-US';

  const STATUS_COLORS = {
    'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
    'under_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
    'escalated': 'bg-orange-100 text-orange-800 border-orange-200',
    'resolved': 'bg-green-100 text-green-800 border-green-200',
    'dismissed': 'bg-red-100 text-red-800 border-red-200'
  };

  const PRIORITY_COLORS = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-blue-500',
    5: 'bg-gray-500'
  };

  const LEVEL_COLORS = {
    'village': 'bg-green-100 text-green-800 border-green-200',
    'sector': 'bg-blue-100 text-blue-800 border-blue-200',
    'district': 'bg-purple-100 text-purple-800 border-purple-200',
    'province': 'bg-orange-100 text-orange-800 border-orange-200',
    'national': 'bg-red-100 text-red-800 border-red-200'
  };

  const LEVEL_LABELS = {
    'village': t('adminLevel.village', { defaultValue: 'Village' }),
    'sector': t('adminLevel.sector', { defaultValue: 'Sector' }),
    'district': t('adminLevel.district', { defaultValue: 'District' }),
    'province': t('adminLevel.province', { defaultValue: 'Province' }),
    'national': t('adminLevel.national', { defaultValue: 'National' })
  };

  const REPORT_TYPE_ICONS = {
    'emergency': AlertTriangle,
    'hazard': AlertTriangle,
    'infrastructure': Building,
    'health': Phone,
    'security': AlertTriangle,
    'other': Clock
  };

  useEffect(() => {
    console.log('IncidentDetailPage mounted:', { citizenView, id, user: user?.username });
    loadIncident();
  }, [id]);

  const loadIncident = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Loading incident:', id);
      const response = await apiService.getIncident(id);
      console.log('✅ Incident loaded:', response);
      
      const incidentData = response.data || response;
      
      if (citizenView && user?.user_type === 'citizen' && incidentData.reporter !== user.id) {
        setError(t('messages.onlyViewOwnReports', { defaultValue: 'You can only view your own incident reports.' }));
        return;
      }
      
      if (incidentData.media_files) {
        console.log(`📁 Media files (${incidentData.media_files.length}):`, incidentData.media_files);
      }
      
      setIncident(incidentData);
    } catch (err) {
      console.error('❌ Load incident error:', err);
      setError(t('messages.failedToLoadDetails', { 
        error: err.message || t('unknownError', { defaultValue: 'Unknown error' }),
        defaultValue: `Failed to load incident details: ${err.message || 'Unknown error'}` 
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSubmit = async (notes) => {
    try {
      console.log('✓ Resolving incident with notes:', notes);
      const response = await apiService.resolveIncident(id, notes);
      console.log('✅ Resolution successful:', response);
      
      const updatedIncident = response.data || response;
      setIncident(prev => ({ ...prev, ...updatedIncident }));
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = t('messages.incidentResolvedSuccess', { defaultValue: 'Incident resolved successfully!' });
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
      await loadIncident();
    } catch (err) {
      console.error('❌ Resolution error:', err);
      throw new Error(err.message || t('messages.failedToResolve', { defaultValue: 'Failed to resolve incident' }));
    }
  };

  const handleEscalateSubmit = async (reason) => {
    try {
      console.log('⬆ Escalating incident with reason:', reason);
      const response = await apiService.escalateIncident(id, reason);
      console.log('✅ Escalation successful:', response);
      
      const updatedIncident = response.incident || response.data || response;
      setIncident(prev => ({ ...prev, ...updatedIncident }));
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.textContent = t('messages.incidentEscalatedSuccess', { 
        level: LEVEL_LABELS[updatedIncident.current_level],
        defaultValue: `Incident escalated to ${LEVEL_LABELS[updatedIncident.current_level]} level!` 
      });
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
      await loadIncident();
    } catch (err) {
      console.error('❌ Escalation error:', err);
      throw new Error(err.message || t('messages.failedToEscalate', { defaultValue: 'Failed to escalate incident' }));
    }
  };

  const canEscalate = () => {
    if (citizenView) return false;
    if (!incident?.can_escalate) return false;
    return user?.user_type === incident?.current_level || user?.user_type === 'admin';
  };

  const canResolve = () => {
    if (citizenView) return false;
    if (incident?.status === 'resolved') return false;
    return user?.user_type === incident?.current_level || ['admin', 'national'].includes(user?.user_type);
  };

  const canEdit = () => {
    if (citizenView) {
      return incident?.status === 'submitted' && incident?.reporter === user?.id;
    }
    return user?.user_type === incident?.current_level || ['admin', 'national'].includes(user?.user_type);
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('notSet', { defaultValue: 'Not set' });
    try {
      return new Date(dateString).toLocaleString(safeLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return t('invalidDate', { defaultValue: 'Invalid Date' });
    }
  };

  const getGoogleMapsLink = (lat, lng) => {
    return `https://maps.google.com/?q=${parseFloat(lat)},${parseFloat(lng)}`;
  };

  const getBackPath = () => {
    return citizenView ? '/incidents/citizen/my-reports' : '/incidents/admin/list';
  };

  const getEditPath = () => {
    return citizenView ? `/incidents/citizen/${id}/edit` : `/incidents/admin/${id}/edit`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('incidentDetail.loadingDetails', { defaultValue: 'Loading incident details...' })}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('incidentDetail.errorLoading', { defaultValue: 'Error Loading Incident' })}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate(getBackPath())} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('incidentDetail.backToReports', { defaultValue: 'Back to Reports' })}
          </button>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('incidentDetail.incidentNotFound', { defaultValue: 'Incident Not Found' })}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('messages.incidentNotFoundMessage', { defaultValue: "The incident you're looking for doesn't exist." })}
          </p>
          <button 
            onClick={() => navigate(getBackPath())} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('incidentDetail.backToReports', { defaultValue: 'Back to Reports' })}
          </button>
        </div>
      </div>
    );
  }

  const ReportTypeIcon = REPORT_TYPE_ICONS[incident.report_type] || AlertTriangle;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link to={getBackPath()} className="hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  {citizenView 
                    ? t('incidentDetail.myReports', { defaultValue: 'My Reports' })
                    : t('incidentDetail.allIncidents', { defaultValue: 'All Incidents' })
                  }
                </Link>
                <span>/</span>
                <span className="text-gray-900">#{incident.id.slice(0, 8)}</span>
              </nav>
              
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-shrink-0 mt-1">
                  <ReportTypeIcon className="w-8 h-8 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 break-words">{incident.title}</h1>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${STATUS_COLORS[incident.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {t(`status.${incident.status}`, { defaultValue: incident.status_display || incident.status.replace('_', ' ') })}
                    </span>
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${LEVEL_COLORS[incident.current_level] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {LEVEL_LABELS[incident.current_level]} {t('level', { defaultValue: 'Level' })}
                    </span>
                    <span className="text-sm text-gray-500 capitalize flex items-center gap-1">
                      <ReportTypeIcon className="w-4 h-4" />
                      {t(`reportType.${incident.report_type}`, { defaultValue: incident.report_type })}
                    </span>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[incident.priority] || 'bg-gray-300'} mr-2`}></div>
                      <span className="text-sm text-gray-600">
                        {t('priority.display', { defaultValue: 'Priority' })} {incident.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {incident.needs_escalation && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orange-900">
                        {t('details.escalationRequested', { defaultValue: 'Escalation Requested' })}
                      </p>
                      {incident.escalation_reason && <p className="text-sm text-orange-800 mt-1">{incident.escalation_reason}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
              {canEscalate() && (
                <button 
                  onClick={() => setShowEscalationModal(true)} 
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('actions.escalate', { defaultValue: 'Escalate' })}</span>
                </button>
              )}
              {canResolve() && (
                <button 
                  onClick={() => setShowResolutionModal(true)} 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('actions.resolve', { defaultValue: 'Resolve' })}</span>
                </button>
              )}
              {canEdit() && (
                <Link 
                  to={getEditPath()} 
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('actions.edit', { defaultValue: 'Edit' })}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('incidentDetail.description', { defaultValue: 'Description' })}
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
              </div>
            </div>

            {incident.level_responses && incident.level_responses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {t('incidentDetail.responseHistory', { defaultValue: 'Response History' })} ({incident.level_responses.length})
                </h2>
                <div className="space-y-4">
                  {incident.level_responses.map((response) => (
                    <div key={response.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${LEVEL_COLORS[response.admin_level]}`}>
                            {LEVEL_LABELS[response.admin_level]}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {response.action_type_display || response.action_type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(response.created_at)}</span>
                      </div>
                      {response.responder_name && (
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {response.responder_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 mb-2">{response.notes}</p>
                      {response.resources_deployed && (
                        <div className="bg-blue-100 rounded p-2 mb-2">
                          <p className="text-xs font-medium text-blue-900 mb-1">
                            {t('response.resourcesDeployed', { defaultValue: 'Resources Deployed:' })}
                          </p>
                          <p className="text-xs text-blue-800">{response.resources_deployed}</p>
                        </div>
                      )}
                      {response.outcome && (
                        <div className="bg-green-100 rounded p-2 mb-2">
                          <p className="text-xs font-medium text-green-900 mb-1">
                            {t('response.outcome', { defaultValue: 'Outcome:' })}
                          </p>
                          <p className="text-xs text-green-800">{response.outcome}</p>
                        </div>
                      )}
                      {response.escalation_needed && response.escalation_reason && (
                        <div className="bg-orange-100 rounded p-2">
                          <p className="text-xs font-medium text-orange-900 mb-1">
                            {t('response.escalationReason', { defaultValue: 'Escalation Reason:' })}
                          </p>
                          <p className="text-xs text-orange-800">{response.escalation_reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('incidentDetail.locationInfo', { defaultValue: 'Location Information' })}
              </h2>
              <div className="space-y-4">
                {incident.location_name && (
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 block">
                        {t('location.administrativeArea', { defaultValue: 'Administrative Area' })}
                      </span>
                      <p className="text-gray-700">{incident.location_name}</p>
                    </div>
                  </div>
                )}
                {incident.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 block">
                        {t('location.addressDetails', { defaultValue: 'Address Details' })}
                      </span>
                      <p className="text-gray-700">{incident.address}</p>
                    </div>
                  </div>
                )}
                {incident.latitude && incident.longitude && (
                  <div className="flex items-start gap-3">
                    <Navigation className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 block">
                        {t('location.gpsCoordinates', { defaultValue: 'GPS Coordinates' })}
                      </span>
                      <p className="text-gray-900 font-mono text-sm">
                        {parseFloat(incident.latitude).toFixed(6)}, {parseFloat(incident.longitude).toFixed(6)}
                      </p>
                      <a 
                        href={getGoogleMapsLink(incident.latitude, incident.longitude)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t('location.viewOnMaps', { defaultValue: 'View on Google Maps' })}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(incident.casualties || incident.property_damage || incident.immediate_needs) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('incidentDetail.impactAssessment', { defaultValue: 'Impact Assessment' })}
                </h2>
                <div className="space-y-4">
                  {incident.casualties && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {t('impact.peopleAffected', { defaultValue: 'People Affected' })}
                        </span>
                        <p className="text-gray-700">
                          {incident.casualties} {t('impact.people', { defaultValue: 'people' })}
                        </p>
                      </div>
                    </div>
                  )}
                  {incident.property_damage && (
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {t('impact.propertyDamage', { defaultValue: 'Property Damage' })}
                        </span>
                        <p className="text-gray-700 capitalize">
                          {t(`propertyDamage.${incident.property_damage}`, { 
                            defaultValue: incident.property_damage.replace('_', ' ') 
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {incident.immediate_needs && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-gray-900 block">
                          {t('impact.immediateNeeds', { defaultValue: 'Immediate Needs' })}
                        </span>
                        <p className="text-gray-700">{incident.immediate_needs}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {incident.media_files && incident.media_files.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  {t('incidentDetail.mediaEvidence', { defaultValue: 'Media Evidence' })} ({incident.media_files.length})
                </h2>
                <MediaGallery mediaFiles={incident.media_files} />
                {import.meta.env.DEV && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-yellow-900 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {t('media.debugMediaFiles', { defaultValue: 'Debug: Media Files Data' })}
                      </summary>
                      <div className="text-xs space-y-2 mt-3 max-h-96 overflow-y-auto">
                        <div className="bg-white p-2 rounded border">
                          <strong>{t('media.apiBaseUrl', { defaultValue: 'API Base URL' })}:</strong> {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <strong>{t('media.totalFiles', { defaultValue: 'Total Files' })}:</strong> {incident.media_files.length}
                        </div>
                        {incident.media_files.map((media, i) => (
                          <div key={i} className="bg-white p-3 rounded border space-y-1">
                            <div><strong>#{i + 1} - ID:</strong> {media.id}</div>
                            <div><strong>{t('media.type', { defaultValue: 'Type' })}:</strong> {media.media_type}</div>
                            <div><strong>{t('media.filePath', { defaultValue: 'File Path' })}:</strong> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{media.file}</code></div>
                            <div><strong>{t('media.fileUrl', { defaultValue: 'File URL' })}:</strong> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{media.file_url || 'Not provided by backend'}</code></div>
                            <div><strong>{t('media.constructed', { defaultValue: 'Constructed' })}:</strong> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded break-all">{getMediaUrl(media)}</code></div>
                            <div className="pt-2">
                              <a href={getMediaUrl(media)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {t('media.testDirectLink', { defaultValue: 'Test direct link' })}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}

            {incident.resolution_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-green-900 mb-2">
                      {t('incidentDetail.resolution', { defaultValue: 'Resolution' })}
                    </h2>
                    <p className="text-green-800 whitespace-pre-wrap">{incident.resolution_notes}</p>
                    {incident.resolved_at && (
                      <p className="text-sm text-green-600 mt-2">
                        {t('response.resolvedOn', { defaultValue: 'Resolved on' })} {formatDate(incident.resolved_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('incidentDetail.title', { defaultValue: 'Incident Details' })}
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    {t('details.id', { defaultValue: 'ID' })}
                  </dt>
                  <dd className="text-sm text-gray-900 font-mono break-all">{incident.id}</dd>
                </div>
                {!citizenView && incident.reporter_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      {t('details.reporter', { defaultValue: 'Reporter' })}
                    </dt>
                    <dd className="flex items-center text-sm text-gray-900">
                      <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="truncate">{incident.reporter_name}</span>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    {t('details.currentLevel', { defaultValue: 'Current Level' })}
                  </dt>
                  <dd>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${LEVEL_COLORS[incident.current_level]}`}>
                      {LEVEL_LABELS[incident.current_level]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    {t('details.reportType', { defaultValue: 'Report Type' })}
                  </dt>
                  <dd className="text-sm text-gray-900 capitalize flex items-center">
                    <ReportTypeIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {t(`reportType.${incident.report_type}`, { defaultValue: incident.report_type })}
                    </span>
                  </dd>
                </div>
                {incident.disaster_type_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      {t('details.disasterType', { defaultValue: 'Disaster Type' })}
                    </dt>
                    <dd className="text-sm text-gray-900">{incident.disaster_type_name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    {t('details.status', { defaultValue: 'Status' })}
                  </dt>
                  <dd>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[incident.status] || 'bg-gray-100 text-gray-800'}`}>
                      {t(`status.${incident.status}`, { defaultValue: incident.status_display || incident.status.replace('_', ' ') })}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    {t('details.priority', { defaultValue: 'Priority' })}
                  </dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[incident.priority] || 'bg-gray-300'} mr-2 flex-shrink-0`}></div>
                    <span>
                      {t('priority.label', { level: incident.priority, defaultValue: `Priority ${incident.priority}` })}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    {t('details.created', { defaultValue: 'Created' })}
                  </dt>
                  <dd className="flex items-start text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{formatDate(incident.created_at)}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    {t('details.lastUpdated', { defaultValue: 'Last Updated' })}
                  </dt>
                  <dd className="flex items-start text-sm text-gray-900">
                    <Clock className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="break-words">{formatDate(incident.updated_at)}</span>
                  </dd>
                </div>
                {!citizenView && incident.assigned_to_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      {t('details.assignedTo', { defaultValue: 'Assigned To' })}
                    </dt>
                    <dd className="flex items-center text-sm text-gray-900">
                      <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="truncate">{incident.assigned_to_name}</span>
                    </dd>
                  </div>
                )}
                {incident.response_count > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      {t('details.responses', { defaultValue: 'Responses' })}
                    </dt>
                    <dd className="flex items-center text-sm text-gray-900">
                      <MessageSquare className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      {incident.response_count}
                    </dd>
                  </div>
                )}
                {incident.media_files && incident.media_files.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      {t('details.mediaFiles', { defaultValue: 'Media Files' })}
                    </dt>
                    <dd className="flex items-center text-sm text-gray-900">
                      <ImageIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      {incident.media_files.length}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('incidentDetail.quickActions', { defaultValue: 'Quick Actions' })}
              </h2>
              <div className="space-y-3">
                {canEdit() && (
                  <Link 
                    to={getEditPath()} 
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {t('actions.editIncident', { defaultValue: 'Edit Incident' })}
                  </Link>
                )}
                {canEscalate() && (
                  <button 
                    onClick={() => setShowEscalationModal(true)} 
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    {t('actions.escalateToNextLevel', { defaultValue: 'Escalate to Next Level' })}
                  </button>
                )}
                {canResolve() && (
                  <button 
                    onClick={() => setShowResolutionModal(true)} 
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('actions.markAsResolved', { defaultValue: 'Mark as Resolved' })}
                  </button>
                )}
                <button 
                  onClick={() => window.print()} 
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('actions.printReport', { defaultValue: 'Print Report' })}
                </button>
                {incident.latitude && incident.longitude && (
                  <a 
                    href={getGoogleMapsLink(incident.latitude, incident.longitude)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('actions.openInMaps', { defaultValue: 'Open in Maps' })}
                  </a>
                )}
              </div>
            </div>

            {citizenView && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">
                      {t('emergency.contacts', { defaultValue: 'Emergency Contacts' })}
                    </h3>
                    <div className="space-y-2 text-sm text-red-800">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium">
                            {t('emergency.police', { defaultValue: 'Police' })}: <a href="tel:912" className="text-base underline">912</a>
                          </p>
                          <p>
                            {t('emergency.medical', { defaultValue: 'Medical' })}: <a href="tel:114" className="underline">114</a>
                          </p>
                        </div>
                        <div>
                          <p>
                            {t('emergency.fire', { defaultValue: 'Fire' })}: <a href="tel:113" className="underline">113</a>
                          </p>
                          <p>
                            {t('emergency.sms', { defaultValue: 'SMS' })}: <a href="sms:3030" className="underline">3030</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ResolutionModal 
        isOpen={showResolutionModal} 
        onClose={() => setShowResolutionModal(false)} 
        onSubmit={handleResolveSubmit} 
        incidentTitle={incident.title} 
      />
      <EscalationModal 
        isOpen={showEscalationModal} 
        onClose={() => setShowEscalationModal(false)} 
        onSubmit={handleEscalateSubmit} 
        incidentTitle={incident.title} 
        currentLevel={incident.current_level} 
        nextLevel={incident.next_level} 
      />
    </div>
  );
};

export default IncidentDetailPage;