import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiService from '../../services/api';

type SafetyGuidesProps = {
  navigation: any;
};

const SafetyGuides: React.FC<SafetyGuidesProps> = ({ navigation }) => {
  const [guides, setGuides] = useState<any[]>([]);
  const [featuredGuides, setFeaturedGuides] = useState<any[]>([]);
  const [disasterTypes, setDisasterTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    'before': { bg: '#DBEAFE', text: '#1E40AF' },
    'during': { bg: '#FEE2E2', text: '#991B1B' },
    'after': { bg: '#D1FAE5', text: '#065F46' },
    'general': { bg: '#F3F4F6', text: '#374151' }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadSafetyGuides();
    }
  }, [searchTerm, selectedCategory, selectedAudience, selectedDisasterType, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [featuredResponse, disasterTypesResponse] = await Promise.all([
        apiService.getFeaturedSafetyGuides().catch(() => ({ results: [], data: [] })),
        apiService.getDisasterTypes().catch(() => ({ results: [], data: [] }))
      ]);

      const featured = featuredResponse.results || featuredResponse.data || featuredResponse || [];
      const disasters = disasterTypesResponse.results || disasterTypesResponse.data || disasterTypesResponse || [];

      setFeaturedGuides(Array.isArray(featured) ? featured : []);
      setDisasterTypes(Array.isArray(disasters) ? disasters : []);
      
    } catch (err: any) {
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
      
      const params: any = {
        is_published: true,
        page: currentPage,
        page_size: 12
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedAudience) params.target_audience = selectedAudience;
      if (selectedDisasterType) params.disaster_types = selectedDisasterType;

      const response = await apiService.getSafetyGuides(params);
      
      let guidesData: any[] = [];
      let count = 0;

      if (response) {
        if (Array.isArray(response)) {
          guidesData = response;
          count = response.length;
        } else if (response.results && Array.isArray(response.results)) {
          guidesData = response.results;
          count = response.count || response.results.length;
        } else if (response.data && Array.isArray(response.data)) {
          guidesData = response.data;
          count = response.count || response.data.length;
        }
      }
      
      setGuides(guidesData);
      setTotalPages(Math.ceil(count / 12) || 1);
      setTotalCount(count);
      
    } catch (err: any) {
      console.error('Failed to load safety guides:', err);
      setError(`Failed to load safety guides: ${err.message}`);
      setGuides([]);
      setTotalCount(0);
    } finally {
      setGuidesLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadSafetyGuides();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadSafetyGuides();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedAudience('');
    setSelectedDisasterType('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
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

  const truncateContent = (content: string, maxLength = 120) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const SafetyGuideCard = ({ guide, featured = false }: { guide: any; featured?: boolean }) => {
    const categoryColor = CATEGORY_COLORS[guide.category] || { bg: '#F3F4F6', text: '#374151' };
    const categoryLabel = CATEGORY_OPTIONS.find(cat => cat.value === guide.category)?.label || guide.category;
    const audienceLabel = TARGET_AUDIENCE_OPTIONS.find(aud => aud.value === guide.target_audience)?.label || guide.target_audience;

    return (
      <TouchableOpacity
        style={[styles.guideCard, featured && styles.featuredCard]}
        onPress={() => navigation.navigate('SafetyGuideDetail', { guideId: guide.id })}
        activeOpacity={0.7}
      >
        {guide.featured_image_url && (
          <Image
            source={{ uri: guide.featured_image_url }}
            style={styles.guideImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.guideContent}>
          {/* Badges */}
          <View style={styles.badgeContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryColor.text }]}>
                {categoryLabel}
              </Text>
            </View>
            {featured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
              </View>
            )}
            {guide.attachment_count > 0 && (
              <View style={styles.attachmentBadge}>
                <Text style={styles.attachmentBadgeText}>📎 {guide.attachment_count}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.guideTitle} numberOfLines={2}>
            {guide.title || 'Untitled Guide'}
          </Text>

          {/* Content Preview */}
          <Text style={styles.guidePreview} numberOfLines={3}>
            {truncateContent(guide.content)}
          </Text>

          {/* Metadata */}
          <View style={styles.guideMetadata}>
            <Text style={styles.metadataText}>👥 {audienceLabel || 'General'}</Text>
            <Text style={styles.metadataText}>📅 {formatDate(guide.created_at)}</Text>
          </View>

          {/* Disaster Types */}
          {guide.disaster_types_data && guide.disaster_types_data.length > 0 && (
            <View style={styles.disasterTypes}>
              {guide.disaster_types_data.slice(0, 2).map((type: any) => (
                <View key={type.id} style={styles.disasterTypeBadge}>
                  <Text style={styles.disasterTypeText}>🎯 {type.name}</Text>
                </View>
              ))}
              {guide.disaster_types_data.length > 2 && (
                <View style={styles.disasterTypeBadge}>
                  <Text style={styles.disasterTypeText}>+{guide.disaster_types_data.length - 2}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action */}
          <Text style={styles.readMore}>Read Full Guide →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search safety guides..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? '✕ Hide Filters' : '⚙️ Show Filters'}
        </Text>
      </TouchableOpacity>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Category</Text>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={setSelectedCategory}
              style={styles.picker}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Audience</Text>
            <Picker
              selectedValue={selectedAudience}
              onValueChange={setSelectedAudience}
              style={styles.picker}
            >
              {TARGET_AUDIENCE_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Disaster Type</Text>
            <Picker
              selectedValue={selectedDisasterType}
              onValueChange={setSelectedDisasterType}
              style={styles.picker}
            >
              <Picker.Item label="All Disaster Types" value="" />
              {disasterTypes.map((type) => (
                <Picker.Item key={type.id} label={type.name} value={type.id.toString()} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Featured Guides */}
      {featuredGuides.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>⭐ Featured Guides</Text>
          {featuredGuides.slice(0, 3).map((guide) => (
            <SafetyGuideCard key={guide.id} guide={guide} featured={true} />
          ))}
        </View>
      )}

      {/* Section Header */}
      <View style={styles.allGuidesHeader}>
        <Text style={styles.sectionTitle}>
          All Safety Guides
          {totalCount > 0 && (
            <Text style={styles.countText}> ({totalCount})</Text>
          )}
        </Text>
        {guidesLoading && <ActivityIndicator size="small" color="#3B82F6" />}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No Safety Guides Found</Text>
      <Text style={styles.emptyText}>
        {searchTerm || selectedCategory || selectedAudience || selectedDisasterType
          ? 'No guides match your search. Try adjusting filters.'
          : 'No published safety guides available.'}
      </Text>
      {(searchTerm || selectedCategory || selectedAudience || selectedDisasterType) && (
        <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
          <Text style={styles.emptyButtonText}>Clear all filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1 || guidesLoading}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || guidesLoading}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading safety guides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety & Preparedness Guides</Text>
        <Text style={styles.headerSubtitle}>
          Prepare for, respond to, and recover from emergencies
        </Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(null); loadSafetyGuides(); }}>
            <Text style={styles.errorRetry}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={guides}
        renderItem={({ item }) => <SafetyGuideCard guide={item} />}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!guidesLoading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={guides.length === 0 ? styles.flatListEmpty : styles.flatListContent}
      />
    </View>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  headerSection: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  filterToggle: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filtersContainer: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 16,
  },
  filterItem: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  picker: {
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  featuredSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  allGuidesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  flatListContent: {
    paddingBottom: 16,
  },
  flatListEmpty: {
    flexGrow: 1,
  },
  guideCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  guideImage: {
    width: '100%',
    height: 160,
  },
  guideContent: {
    padding: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  featuredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  attachmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
  },
  attachmentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  guidePreview: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  guideMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 11,
    color: '#6B7280',
  },
  disasterTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  disasterTypeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disasterTypeText: {
    fontSize: 11,
    color: '#374151',
  },
  readMore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  errorText: {
    color: '#991B1B',
    marginBottom: 8,
  },
  errorRetry: {
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '600',
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
});

export default SafetyGuides;