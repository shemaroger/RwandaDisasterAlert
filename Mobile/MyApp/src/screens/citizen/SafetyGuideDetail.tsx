import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
  Share,
  Platform,
} from 'react-native';
import apiService, { API_BASE_URL } from '../../services/api';

type SafetyGuideDetailProps = {
  navigation: any;
  route: any;
};

// Helper function for media URLs
const getMediaUrl = (mediaPath: string | null) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
  return `${API_BASE_URL.replace('/api', '')}/${cleanPath}`;
};

const SafetyGuideDetail: React.FC<SafetyGuideDetailProps> = ({ navigation, route }) => {
  const { guideId } = route.params;
  
  const [guide, setGuide] = useState<any>(null);
  const [relatedGuides, setRelatedGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState('en');

  const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    'before': { bg: '#DBEAFE', text: '#1E40AF' },
    'during': { bg: '#FEE2E2', text: '#991B1B' },
    'after': { bg: '#D1FAE5', text: '#065F46' },
    'general': { bg: '#F3F4F6', text: '#374151' }
  };

  const CATEGORY_LABELS: Record<string, string> = {
    'before': 'Before Disaster',
    'during': 'During Disaster',
    'after': 'After Disaster',
    'general': 'General Preparedness'
  };

  const TARGET_AUDIENCE_LABELS: Record<string, string> = {
    'general': 'General Public',
    'families': 'Families with Children',
    'elderly': 'Elderly',
    'disabled': 'People with Disabilities',
    'business': 'Businesses',
    'schools': 'Schools'
  };

  useEffect(() => {
    loadSafetyGuide();
  }, [guideId]);

  const loadSafetyGuide = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getSafetyGuide(guideId);
      const guideData = response.data || response;
      
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
          const related = (relatedResponse.results || []).filter((g: any) => g.id !== guideData.id);
          setRelatedGuides(related.slice(0, 3));
        } catch (err) {
          console.error('Failed to load related guides:', err);
        }
      }
      
    } catch (err: any) {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        const fileName = url ? url.split('/').pop() : (name || `attachment_${i}`);
        const fileType = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'unknown';
        
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
      guide.all_attachments.forEach((attachment: any, index: number) => {
        if (attachment.source === 'legacy') {
          attachments.push({
            ...attachment,
            id: attachment.id || `legacy_${index}`
          });
        }
      });
    }
    
    return attachments;
  };

  const getFileTypeIcon = (fileType?: string) => {
    if (!fileType) return '📄';
    
    const type = fileType.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type)) {
      return '🖼️';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
      return '🎥';
    } else if (['mp3', 'wav', 'ogg', 'aac'].includes(type)) {
      return '🎵';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
      return '📦';
    } else {
      return '📄';
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this safety guide: ${guide.title}`,
        title: guide.title,
      });
    } catch (err) {
      console.log('Sharing cancelled', err);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading safety guide...</Text>
      </View>
    );
  }

  if (error || !guide) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>
          {error ? 'Error Loading Guide' : 'Guide Not Found'}
        </Text>
        <Text style={styles.errorText}>
          {error || "The guide you're looking for doesn't exist or is not available."}
        </Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Back to Safety Guides</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentContent = getCurrentContent();
  const availableLanguages = getAvailableLanguages();
  const allAttachments = getAllAttachments();
  const categoryColor = CATEGORY_COLORS[guide.category] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}>
            <Text style={[styles.categoryBadgeText, { color: categoryColor.text }]}>
              {CATEGORY_LABELS[guide.category] || guide.category}
            </Text>
          </View>
          {guide.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
            </View>
          )}
          {allAttachments.length > 0 && (
            <View style={styles.attachmentsBadge}>
              <Text style={styles.attachmentsBadgeText}>
                📎 {allAttachments.length} attachment{allAttachments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{currentContent.title}</Text>

        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            👥 {TARGET_AUDIENCE_LABELS[guide.target_audience] || guide.target_audience}
          </Text>
          <Text style={styles.metadataText}>
            📅 {formatDate(guide.created_at)}
          </Text>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>🔗 Share Guide</Text>
        </TouchableOpacity>
      </View>

      {/* Language Selector */}
      {availableLanguages.length > 1 && (
        <View style={styles.languageSelector}>
          <Text style={styles.languageLabel}>Language:</Text>
          <View style={styles.languageButtons}>
            {availableLanguages.map(lang => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.languageButton,
                  activeLanguage === lang.key && styles.languageButtonActive
                ]}
                onPress={() => setActiveLanguage(lang.key)}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    activeLanguage === lang.key && styles.languageButtonTextActive
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Featured Image */}
      {guide.featured_image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: guide.featured_image_url }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.contentText}>{currentContent.content}</Text>
      </View>

      {/* Quick Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Info</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Target Audience</Text>
          <Text style={styles.infoValue}>
            {TARGET_AUDIENCE_LABELS[guide.target_audience] || guide.target_audience}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>
            {CATEGORY_LABELS[guide.category] || guide.category}
          </Text>
        </View>

        {allAttachments.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Resources</Text>
            <Text style={styles.infoValue}>
              {allAttachments.length} attachment{allAttachments.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Published</Text>
          <Text style={styles.infoValue}>{formatDate(guide.created_at)}</Text>
        </View>

        {guide.updated_at !== guide.created_at && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>{formatDate(guide.updated_at)}</Text>
          </View>
        )}
      </View>

      {/* Applicable Disasters */}
      {guide.disaster_types_data && guide.disaster_types_data.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Applicable Disasters</Text>
          {guide.disaster_types_data.map((type: any) => (
            <View key={type.id} style={styles.disasterItem}>
              <Text style={styles.disasterIcon}>🎯</Text>
              <Text style={styles.disasterText}>{type.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Attachments */}
      {allAttachments.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            📎 Additional Resources ({allAttachments.length})
          </Text>
          {allAttachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentItem}>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentIcon}>
                  {getFileTypeIcon(attachment.type)}
                </Text>
                <View style={styles.attachmentDetails}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name || `Attachment ${attachment.slot || ''}`}
                  </Text>
                  {attachment.description && (
                    <Text style={styles.attachmentDescription} numberOfLines={1}>
                      {attachment.description}
                    </Text>
                  )}
                  <View style={styles.attachmentMeta}>
                    {attachment.size_display && (
                      <Text style={styles.attachmentMetaText}>{attachment.size_display}</Text>
                    )}
                    {attachment.type && (
                      <Text style={styles.attachmentMetaText}>{attachment.type.toUpperCase()}</Text>
                    )}
                  </View>
                </View>
              </View>
              {attachment.url && (
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownload(attachment.url)}
                >
                  <Text style={styles.downloadIcon}>⬇️</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Language Support */}
      {hasMultipleLanguages() && (
        <View style={styles.languageCard}>
          <Text style={styles.languageCardIcon}>🌐</Text>
          <View style={styles.languageCardContent}>
            <Text style={styles.languageCardTitle}>Available Languages</Text>
            <Text style={styles.languageCardText}>✓ English</Text>
            {(guide.title_rw || guide.content_rw) && (
              <Text style={styles.languageCardText}>✓ Kinyarwanda</Text>
            )}
            {(guide.title_fr || guide.content_fr) && (
              <Text style={styles.languageCardText}>✓ French</Text>
            )}
          </View>
        </View>
      )}

      {/* Related Guides */}
      {relatedGuides.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Safety Guides</Text>
          {relatedGuides.map((relatedGuide) => {
            const relatedColor = CATEGORY_COLORS[relatedGuide.category] || { bg: '#F3F4F6', text: '#374151' };
            return (
              <TouchableOpacity
                key={relatedGuide.id}
                style={styles.relatedCard}
                onPress={() => navigation.push('SafetyGuideDetail', { guideId: relatedGuide.id })}
              >
                {relatedGuide.featured_image_url && (
                  <Image
                    source={{ uri: relatedGuide.featured_image_url }}
                    style={styles.relatedImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.relatedContent}>
                  <View style={[styles.relatedBadge, { backgroundColor: relatedColor.bg }]}>
                    <Text style={[styles.relatedBadgeText, { color: relatedColor.text }]}>
                      {CATEGORY_LABELS[relatedGuide.category] || relatedGuide.category}
                    </Text>
                  </View>
                  <Text style={styles.relatedCardTitle} numberOfLines={2}>
                    {relatedGuide.title}
                  </Text>
                  <Text style={styles.relatedCardText} numberOfLines={2}>
                    {relatedGuide.content?.substring(0, 100)}...
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  attachmentsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
  },
  attachmentsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metadataText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  languageSelector: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  languageButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  languageButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  languageButtonTextActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  imageContainer: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  featuredImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  content: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
  },
  disasterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  disasterIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  disasterText: {
    fontSize: 14,
    color: '#111827',
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  attachmentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  attachmentDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  attachmentMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentMetaText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  downloadButton: {
    padding: 8,
  },
  downloadIcon: {
    fontSize: 18,
  },
  languageCard: {
    backgroundColor: '#DBEAFE',
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  languageCardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  languageCardContent: {
    flex: 1,
  },
  languageCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  languageCardText: {
    fontSize: 13,
    color: '#1E3A8A',
    paddingVertical: 2,
  },
  relatedSection: {
    padding: 16,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  relatedCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  relatedImage: {
    width: '100%',
    height: 120,
  },
  relatedContent: {
    padding: 12,
  },
  relatedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  relatedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  relatedCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  relatedCardText: {
    fontSize: 13,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default SafetyGuideDetail;