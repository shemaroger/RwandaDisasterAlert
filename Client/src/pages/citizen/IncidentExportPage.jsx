import React, { useState, useEffect } from 'react';
import { 
  Download,
  RefreshCw,
  Calendar,
  Filter,
  FileText,
  Table,
  Code,
  ArrowLeft,
  MapPin,
  Users,
  Home,
  AlertTriangle,
  X,
  Shield,
  Building,
  Building2,
  Layers,
  Map,
  Globe,
  Phone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const IncidentExportPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    priority: '',
    disaster_type: '',
    property_damage: '',
    date_from: '',
    date_to: '',
    format: 'csv'
  });
  const [exportStats, setExportStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    statuses: [
      { value: 'submitted', label: t('status.submitted', { defaultValue: 'Submitted' }), color: 'blue' },
      { value: 'under_review', label: t('status.underReview', { defaultValue: 'Under Review' }), color: 'yellow' },
      { value: 'in_progress', label: t('status.inProgress', { defaultValue: 'In Progress' }), color: 'indigo' },
      { value: 'escalated', label: t('status.escalated', { defaultValue: 'Escalated' }), color: 'orange' },
      { value: 'resolved', label: t('status.resolved', { defaultValue: 'Resolved' }), color: 'green' },
      { value: 'dismissed', label: t('status.dismissed', { defaultValue: 'Dismissed' }), color: 'gray' }
    ],
    reportTypes: [
      { value: 'emergency', label: t('reportType.emergency', { defaultValue: 'Emergency' }), icon: '🚨' },
      { value: 'hazard', label: t('reportType.hazard', { defaultValue: 'Hazard' }), icon: '⚠️' },
      { value: 'infrastructure', label: t('reportType.infrastructure', { defaultValue: 'Infrastructure' }), icon: '🏗️' },
      { value: 'health', label: t('reportType.health', { defaultValue: 'Health' }), icon: '🏥' },
      { value: 'security', label: t('reportType.security', { defaultValue: 'Security' }), icon: '🔒' },
      { value: 'other', label: t('reportType.other', { defaultValue: 'Other' }), icon: '📋' }
    ],
    priorities: [
      { value: '1', label: t('priority.critical', { defaultValue: 'Priority 1 (Critical)' }), color: 'red' },
      { value: '2', label: t('priority.high', { defaultValue: 'Priority 2 (High)' }), color: 'orange' },
      { value: '3', label: t('priority.medium', { defaultValue: 'Priority 3 (Medium)' }), color: 'yellow' },
      { value: '4', label: t('priority.low', { defaultValue: 'Priority 4 (Low)' }), color: 'blue' },
      { value: '5', label: t('priority.minimal', { defaultValue: 'Priority 5 (Minimal)' }), color: 'gray' }
    ],
    propertyDamage: [
      { value: 'none', label: t('propertyDamage.none', { defaultValue: 'No visible damage' }) },
      { value: 'minor', label: t('propertyDamage.minor', { defaultValue: 'Minor damage' }) },
      { value: 'moderate', label: t('propertyDamage.moderate', { defaultValue: 'Moderate damage' }) },
      { value: 'severe', label: t('propertyDamage.severe', { defaultValue: 'Severe damage' }) },
      { value: 'total', label: t('propertyDamage.total', { defaultValue: 'Total destruction' }) }
    ],
    disasterTypes: []
  });
  const [activeFilters, setActiveFilters] = useState([]);

  // Load dynamic filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Update export stats when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      getExportStats();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Update active filters display
  useEffect(() => {
    updateActiveFilters();
  }, [filters]);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading filter options...');
      
      const disasterTypesRes = await apiService.getDisasterTypes({ is_active: true, page_size: 100 })
        .catch(() => ({ results: [] }));

      setFilterOptions(prev => ({
        ...prev,
        disasterTypes: (disasterTypesRes.results || []).map(dt => ({
          value: dt.id.toString(),
          label: dt.name,
          name_rw: dt.name_rw,
          name_fr: dt.name_fr
        }))
      }));

      console.log('✅ Filter options loaded');
    } catch (error) {
      console.error('❌ Failed to load filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateActiveFilters = () => {
    const active = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'format') {
        let label = '';
        let displayValue = value;

        switch(key) {
          case 'status':
            const status = filterOptions.statuses.find(s => s.value === value);
            label = t('filter.status', { defaultValue: 'Status' });
            displayValue = status?.label || value;
            break;
          case 'report_type':
            const type = filterOptions.reportTypes.find(t => t.value === value);
            label = t('filter.reportType', { defaultValue: 'Report Type' });
            displayValue = type?.label || value;
            break;
          case 'priority':
            const priority = filterOptions.priorities.find(p => p.value === value);
            label = t('filter.priority', { defaultValue: 'Priority' });
            displayValue = priority?.label || value;
            break;
          case 'disaster_type':
            const disaster = filterOptions.disasterTypes.find(d => d.value === value);
            label = t('filter.disasterType', { defaultValue: 'Disaster Type' });
            displayValue = disaster?.label || value;
            break;
          case 'property_damage':
            const damage = filterOptions.propertyDamage.find(p => p.value === value);
            label = t('filter.propertyDamage', { defaultValue: 'Property Damage' });
            displayValue = damage?.label || value;
            break;
          case 'date_from':
            label = t('filter.fromDate', { defaultValue: 'From Date' });
            displayValue = new Date(value).toLocaleDateString();
            break;
          case 'date_to':
            label = t('filter.toDate', { defaultValue: 'To Date' });
            displayValue = new Date(value).toLocaleDateString();
            break;
          default:
            return;
        }

        active.push({ key, label, value: displayValue });
      }
    });

    setActiveFilters(active);
  };

  const removeFilter = (key) => {
    setFilters(prev => ({
      ...prev,
      [key]: ''
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: '',
      report_type: '',
      priority: '',
      disaster_type: '',
      property_damage: '',
      date_from: '',
      date_to: '',
      format: filters.format
    });
  };

  const getExportStats = async () => {
    try {
      const params = { ...filters };
      delete params.format;
      
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await apiService.getIncidents({
        ...params,
        page_size: 1
      });
      
      setExportStats({
        total_records: response.count || 0,
        estimated_file_size: Math.ceil((response.count || 0) * 0.5)
      });
    } catch (error) {
      console.error('Failed to get export stats:', error);
      setExportStats({
        total_records: 0,
        estimated_file_size: 0
      });
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const exportParams = { ...filters };
      delete exportParams.format;
      
      Object.keys(exportParams).forEach(key => {
        if (!exportParams[key]) delete exportParams[key];
      });

      console.log('📥 Exporting with params:', exportParams);

      const blob = await apiService.exportIncidents(filters.format, exportParams);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const levelSuffix = user?.user_type !== 'admin' ? `_${user?.user_type}` : '';
      a.download = `incidents_export${levelSuffix}_${new Date().toISOString().split('T')[0]}.${filters.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert(t('export.success', { 
        count: exportStats.total_records, 
        defaultValue: `✅ Successfully exported ${exportStats.total_records} incidents!` 
      }));
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(t('export.failed', { defaultValue: 'Export failed. Please try again.' }));
    } finally {
      setExporting(false);
    }
  };

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: Table, description: t('format.csv', { defaultValue: 'Best for Excel & spreadsheets' }) },
    { value: 'xlsx', label: 'Excel', icon: FileText, description: t('format.xlsx', { defaultValue: 'Native Excel with formatting' }) },
    { value: 'json', label: 'JSON', icon: Code, description: t('format.json', { defaultValue: 'For developers & APIs' }) }
  ];

  const quickPresets = [
    {
      name: t('preset.last30Days', { defaultValue: 'Last 30 Days' }),
      description: t('preset.last30DaysDesc', { defaultValue: 'All incidents from the past month' }),
      filters: {
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
        format: 'csv'
      }
    },
    {
      name: t('preset.unresolvedCritical', { defaultValue: 'Unresolved Critical' }),
      description: t('preset.unresolvedCriticalDesc', { defaultValue: 'Priority 1-2 incidents not yet resolved' }),
      filters: {
        priority: '1,2',
        status: 'submitted,under_review,in_progress,escalated',
        format: 'xlsx'
      }
    },
    {
      name: t('preset.emergencyReports', { defaultValue: 'Emergency Reports' }),
      description: t('preset.emergencyReportsDesc', { defaultValue: 'All emergency type incidents' }),
      filters: {
        report_type: 'emergency',
        format: 'csv'
      }
    },
    {
      name: t('preset.severeDamage', { defaultValue: 'Severe Damage' }),
      description: t('preset.severeDamageDesc', { defaultValue: 'Incidents with severe or total property damage' }),
      filters: {
        property_damage: 'severe,total',
        format: 'xlsx'
      }
    },
    {
      name: t('preset.resolvedThisWeek', { defaultValue: 'Resolved This Week' }),
      description: t('preset.resolvedThisWeekDesc', { defaultValue: 'Recently resolved incidents' }),
      filters: {
        status: 'resolved',
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
        format: 'xlsx'
      }
    }
  ];

  const getUserLevelIcon = () => {
    const icons = {
      admin: Shield,
      village: Home,
      cell: Building,
      sector: Building2,
      district: Layers,
      province: Map,
      national: Globe
    };
    return icons[user?.user_type] || Shield;
  };

  const UserLevelIcon = getUserLevelIcon();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('loading', { defaultValue: 'Loading export options...' })}</p>
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
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link 
                  to={user?.user_type === 'citizen' ? '/incidents/citizen/my-reports' : '/incidents/admin/list'} 
                  className="hover:text-gray-700 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('nav.incidents', { defaultValue: 'Incidents' })}
                </Link>
                <span>/</span>
                <span className="text-gray-900">{t('nav.export', { defaultValue: 'Export' })}</span>
              </nav>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('export.title', { defaultValue: 'Export Incident Reports' })}
                </h1>
                {user?.user_type !== 'admin' && user?.user_type !== 'citizen' && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <UserLevelIcon className="w-4 h-4" />
                    {user?.user_type.charAt(0).toUpperCase() + user?.user_type.slice(1)} Level
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {t('export.subtitle', { defaultValue: 'Download incident data with advanced filtering options' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Level Notice */}
        {user?.user_type !== 'admin' && user?.user_type !== 'citizen' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <UserLevelIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  {t('export.levelBasedTitle', { defaultValue: 'Level-Based Export' })}
                </h3>
                <p className="text-sm text-blue-700">
                  {t('export.levelBasedDesc', { 
                    level: user?.user_type,
                    defaultValue: `You are exporting data for your administrative level (${user?.user_type}).` 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Citizen-specific notice */}
        {user?.user_type === 'citizen' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  {t('export.personalDataTitle', { defaultValue: 'Personal Data Export' })}
                </h3>
                <p className="text-sm text-green-700">
                  {t('export.personalDataDesc', { defaultValue: 'You can only export your own incident reports.' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Bar */}
        {activeFilters.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                {t('filter.activeFilters', { count: activeFilters.length, defaultValue: `Active Filters (${activeFilters.length})` })}
              </h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                {t('filter.clearAll', { defaultValue: 'Clear All' })}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span className="font-medium">{filter.label}:</span>
                  <span>{filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Filters */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {t('filter.options', { defaultValue: 'Filter Options' })}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Report Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('filter.status', { defaultValue: 'Status' })}
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('filter.allStatuses', { defaultValue: 'All Statuses' })}</option>
                      {filterOptions.statuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('filter.reportType', { defaultValue: 'Report Type' })}
                    </label>
                    <select
                      value={filters.report_type}
                      onChange={(e) => handleFilterChange('report_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('filter.allTypes', { defaultValue: 'All Types' })}</option>
                      {filterOptions.reportTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority & Disaster Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('filter.priority', { defaultValue: 'Priority Level' })}
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('filter.allPriorities', { defaultValue: 'All Priorities' })}</option>
                      {filterOptions.priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {t('filter.disasterType', { defaultValue: 'Disaster Type' })}
                    </label>
                    <select
                      value={filters.disaster_type}
                      onChange={(e) => handleFilterChange('disaster_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('filter.allDisasterTypes', { defaultValue: 'All Disaster Types' })}</option>
                      {filterOptions.disasterTypes.map(disaster => (
                        <option key={disaster.value} value={disaster.value}>
                          {disaster.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Property Damage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {t('filter.propertyDamage', { defaultValue: 'Property Damage' })}
                  </label>
                  <select
                    value={filters.property_damage}
                    onChange={(e) => handleFilterChange('property_damage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('filter.allDamageLevels', { defaultValue: 'All Damage Levels' })}</option>
                    {filterOptions.propertyDamage.map(damage => (
                      <option key={damage.value} value={damage.value}>
                        {damage.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('filter.dateRange', { defaultValue: 'Date Range' })}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('filter.fromDate', { defaultValue: 'From date' })}</p>
                    </div>
                    <div>
                      <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('filter.toDate', { defaultValue: 'To date' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-semibold text-gray-900">
                  {t('preset.title', { defaultValue: 'Quick Export Presets' })}
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          ...preset.filters
                        }));
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{preset.name}</h4>
                      <p className="text-sm text-gray-600">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden sticky top-6">
              <div className="bg-blue-50 px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  {t('export.settings', { defaultValue: 'Export Settings' })}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('export.format', { defaultValue: 'Export Format' })}
                  </label>
                  <div className="space-y-2">
                    {formatOptions.map((format) => {
                      const IconComponent = format.icon;
                      return (
                        <label
                          key={format.value}
                          className={`relative flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            filters.format === format.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="format"
                            value={format.value}
                            checked={filters.format === format.value}
                            onChange={(e) => handleFilterChange('format', e.target.value)}
                            className="sr-only"
                          />
                          <IconComponent className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                            filters.format === format.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${
                              filters.format === format.value ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {format.label}
                            </div>
                            <div className={`text-xs ${
                              filters.format === format.value ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {format.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Export Stats */}
                {exportStats && (
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        {t('export.recordsToExport', { defaultValue: 'Records to export' })}
                      </span>
                      <button
                        onClick={getExportStats}
                        className="text-blue-600 hover:text-blue-700"
                        title={t('export.refreshCount', { defaultValue: 'Refresh count' })}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {exportStats.total_records.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('export.estimatedSize', { 
                        size: exportStats.estimated_file_size, 
                        defaultValue: `Est. file size: ~${exportStats.estimated_file_size} KB` 
                      })}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={exporting || (exportStats && exportStats.total_records === 0)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {exporting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {t('export.exporting', { defaultValue: 'Exporting...' })}
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      {t('export.exportData', { defaultValue: 'Export Data' })}
                    </>
                  )}
                </button>

                {exportStats && exportStats.total_records === 0 && (
                  <p className="text-sm text-amber-600 text-center">
                    {t('export.noMatches', { defaultValue: 'No incidents match your filters' })}
                  </p>
                )}

                {/* Export Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    {t('export.information', { defaultValue: 'Export Information' })}
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• {t('export.info1', { defaultValue: 'All data matching filters will be included' })}</li>
                    <li>• {t('export.info2', { defaultValue: 'Media files included as URLs only' })}</li>
                    <li>• {t('export.info3', { defaultValue: 'Large exports may take time to process' })}</li>
                    <li>• {t('export.info4', { defaultValue: 'Download starts automatically when ready' })}</li>
                    {user?.user_type !== 'admin' && user?.user_type !== 'citizen' && (
                      <li className="font-semibold">
                        • {t('export.info5', { defaultValue: 'Limited to your administrative level' })}
                      </li>
                    )}
                    {user?.user_type === 'citizen' && (
                      <li className="font-semibold">
                        • {t('export.info6', { defaultValue: 'Only your own reports will be exported' })}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Info */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                {t('emergency.title', { defaultValue: 'Emergency Contacts' })}
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-red-800">
                <div>
                  <p className="font-medium">
                    {t('emergency.police', { defaultValue: 'Police Emergency' })}: <span className="text-lg">912</span>
                  </p>
                  <p>{t('emergency.medical', { defaultValue: 'Medical' })}: 114</p>
                </div>
                <div>
                  <p>{t('emergency.fire', { defaultValue: 'Fire Emergency' })}: 113</p>
                  <p>{t('emergency.sms', { defaultValue: 'SMS Emergency' })}: 3030</p>
                </div>
                <div>
                  <p className="text-xs text-red-600 mt-1">
                    {t('emergency.callFirst', { 
                      defaultValue: 'For life-threatening emergencies, call immediately.' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentExportPage;