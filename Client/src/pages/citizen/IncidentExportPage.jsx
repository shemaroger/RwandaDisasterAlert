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
  Home,
  AlertTriangle,
  X,
  Shield,
  Building,
  Building2,
  Layers,
  Map,
  Globe,
  Phone,
  File
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/images/logo.png';

const IncidentExportPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      { value: 'submitted', label: 'Submitted', color: 'blue' },
      { value: 'under_review', label: 'Under Review', color: 'yellow' },
      { value: 'in_progress', label: 'In Progress', color: 'indigo' },
      { value: 'escalated', label: 'Escalated', color: 'orange' },
      { value: 'resolved', label: 'Resolved', color: 'green' },
      { value: 'dismissed', label: 'Dismissed', color: 'gray' }
    ],
    reportTypes: [
      { value: 'emergency', label: 'Emergency', icon: '🚨' },
      { value: 'hazard', label: 'Hazard', icon: '⚠️' },
      { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
      { value: 'health', label: 'Health', icon: '🏥' },
      { value: 'security', label: 'Security', icon: '🔒' },
      { value: 'other', label: 'Other', icon: '📋' }
    ],
    priorities: [
      { value: '1', label: 'Priority 1 (Critical)', color: 'red' },
      { value: '2', label: 'Priority 2 (High)', color: 'orange' },
      { value: '3', label: 'Priority 3 (Medium)', color: 'yellow' },
      { value: '4', label: 'Priority 4 (Low)', color: 'blue' },
      { value: '5', label: 'Priority 5 (Minimal)', color: 'gray' }
    ],
    propertyDamage: [
      { value: 'none', label: 'No visible damage' },
      { value: 'minor', label: 'Minor damage' },
      { value: 'moderate', label: 'Moderate damage' },
      { value: 'severe', label: 'Severe damage' },
      { value: 'total', label: 'Total destruction' }
    ],
    disasterTypes: []
  });
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    loadFilterOptions();
    getExportStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      getExportStats();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    updateActiveFilters();
  }, [filters]);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      const disasterTypesRes = await apiService.getDisasterTypes({
        is_active: true,
        page_size: 100,
        ordering: 'name'
      }).catch(() => ({ results: [] }));

      const disasterTypesData = disasterTypesRes.results || disasterTypesRes || [];

      setFilterOptions(prev => ({
        ...prev,
        disasterTypes: disasterTypesData.map(dt => ({
          value: dt.id.toString(),
          label: dt.name,
          name_rw: dt.name_rw,
          name_fr: dt.name_fr
        }))
      }));
    } catch (error) {
      console.error('Failed to load filter options:', error);
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
            label = 'Status';
            displayValue = status?.label || value;
            break;
          case 'report_type':
            const type = filterOptions.reportTypes.find(t => t.value === value);
            label = 'Report Type';
            displayValue = type?.label || value;
            break;
          case 'priority':
            const priority = filterOptions.priorities.find(p => p.value === value);
            label = 'Priority';
            displayValue = priority?.label || value;
            break;
          case 'disaster_type':
            const disaster = filterOptions.disasterTypes.find(d => d.value === value);
            label = 'Disaster Type';
            displayValue = disaster?.label || value;
            break;
          case 'property_damage':
            const damage = filterOptions.propertyDamage.find(p => p.value === value);
            label = 'Property Damage';
            displayValue = damage?.label || value;
            break;
          case 'date_from':
            label = 'From Date';
            displayValue = new Date(value).toLocaleDateString();
            break;
          case 'date_to':
            label = 'To Date';
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
      const params = {};

      if (filters.status) params.status = filters.status;
      if (filters.report_type) params.report_type = filters.report_type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.disaster_type) params.disaster_type = filters.disaster_type;
      if (filters.property_damage) params.property_damage = filters.property_damage;
      if (filters.date_from) params.created_at__gte = filters.date_from;
      if (filters.date_to) params.created_at__lte = filters.date_to;

      if (user?.user_type === 'citizen') {
        params.reporter = user.id;
      }

      params.page_size = 1;

      const response = await apiService.getIncidents(params);

      let totalRecords = 0;

      if (typeof response?.count === 'number') {
        totalRecords = response.count;
      } else if (Array.isArray(response?.results)) {
        totalRecords = response.results.length;
      } else if (Array.isArray(response)) {
        totalRecords = response.length;
      }

      setExportStats({
        total_records: totalRecords,
        estimated_file_size: Math.ceil(totalRecords * 0.5)
      });
    } catch (error) {
      console.error('Failed to get export stats:', error);
      setExportStats({
        total_records: 0,
        estimated_file_size: 0
      });
    }
  };

  const generateBrandedReport = (incidents, format) => {
    const printWindow = window.open('', '_blank');
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>MINEMA Incident Report</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  color: #000;
                  line-height: 1.4;
                  background: white;
              }
              .container {
                  max-width: 1200px;
                  margin: 0 auto;
                  background: white;
                  border: 2px solid #000;
              }
              .header {
                  background: #dc2626;
                  color: white;
                  padding: 30px;
                  border-bottom: 2px solid #000;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
              }
              .header-left {
                  display: flex;
                  align-items: center;
                  gap: 20px;
              }
              .logo-container {
                  background: white;
                  padding: 10px;
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              .logo-container img {
                  height: 80px;
                  width: auto;
              }
              .system-info h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: bold;
                  text-transform: uppercase;
              }
              .system-info p {
                  margin: 5px 0;
                  font-size: 14px;
              }
              .report-title {
                  font-size: 20px;
                  font-weight: bold;
                  margin: 10px 0 5px 0;
                  text-transform: uppercase;
                  letter-spacing: 1px;
              }
              .report-date {
                  font-size: 12px;
                  text-align: right;
              }
              .content {
                  padding: 20px;
              }
              .section-title {
                  font-size: 16px;
                  font-weight: bold;
                  margin: 20px 0 15px 0;
                  padding-bottom: 5px;
                  border-bottom: 2px solid #dc2626;
                  text-transform: uppercase;
                  color: #dc2626;
              }
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 15px;
                  margin: 20px 0;
              }
              .stat-box {
                  border: 2px solid #000;
                  padding: 15px;
                  text-align: center;
                  background: #f9f9f9;
              }
              .stat-value {
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 5px;
                  color: #dc2626;
              }
              .stat-label {
                  font-size: 12px;
                  text-transform: uppercase;
                  font-weight: bold;
              }
              .table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 15px;
                  border: 2px solid #000;
              }
              .table th, .table td {
                  border: 1px solid #000;
                  padding: 10px 8px;
                  text-align: left;
                  font-size: 11px;
              }
              .table th {
                  background: #dc2626;
                  color: white;
                  font-weight: bold;
                  text-transform: uppercase;
              }
              .table tr:nth-child(even) {
                  background: #fafafa;
              }
              .severity-critical { color: #dc2626; font-weight: bold; }
              .severity-high { color: #f97316; font-weight: bold; }
              .severity-medium { color: #eab308; font-weight: bold; }
              .severity-low { color: #3b82f6; font-weight: bold; }
              .footer {
                  margin-top: 30px;
                  padding: 20px;
                  background: #f5f5f5;
                  border-top: 2px solid #000;
              }
              .generated-by {
                  font-size: 10px;
                  text-align: right;
                  margin-top: 10px;
                  color: #666;
              }
              @media print {
                  body { background: white !important; }
                  .container { border: none; }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="header-left">
                      <div class="logo-container">
                          <img src="${logo}" alt="MINEMA Logo" />
                      </div>
                      <div class="system-info">
                          <h1>MINEMA Incident System</h1>
                          <p>Ministry in Charge of Emergency Management</p>
                          <p>Rwanda Disaster Management & Emergency Response</p>
                      </div>
                  </div>
                  <div class="header-right">
                      <div class="report-title">Incident Report</div>
                      <div class="report-date">Generated: ${new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                      })}</div>
                  </div>
              </div>

              <div class="content">
                  <h2 class="section-title">Incident Report</h2>
                  <table class="table">
                      <thead>
                          <tr>
                              <th>ID</th>
                              <th>Title</th>
                              <th>Status</th>
                              <th>Report Type</th>
                              <th>Priority</th>
                              <th>Disaster Type</th>
                              <th>Location</th>
                              <th>Date/Time</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${incidents.map(incident => `
                              <tr>
                                  <td>${incident.id || 'N/A'}</td>
                                  <td>${incident.title || 'N/A'}</td>
                                  <td>${incident.status || 'N/A'}</td>
                                  <td>${incident.report_type || 'N/A'}</td>
                                  <td>${incident.priority || 'N/A'}</td>
                                  <td>${incident.disaster_type_display || incident.disaster_type || 'N/A'}</td>
                                  <td>${incident.location_display || incident.location || 'N/A'}</td>
                                  <td>${new Date(incident.created_at).toLocaleString('en-US') || 'N/A'}</td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              </div>

              <div class="footer">
                  <div class="generated-by">
                      Generated by MINEMA Incident Management System
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();

    if (format === 'csv') {
      setTimeout(() => {
        const table = printWindow.document.querySelector('table');
        let csv = '';
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cols = row.querySelectorAll('td, th');
          const rowData = Array.from(cols).map(col => `"${col.innerText.replace(/"/g, '""')}"`).join(',');
          csv += rowData + '\r\n';
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        const levelSuffix = user?.user_type !== 'admin' ? `_${user?.user_type}` : '';
        a.download = `incidents_export${levelSuffix}_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        printWindow.close();
      }, 500);
    } else if (format === 'xlsx') {
      setTimeout(() => {
        alert('For Excel, copy the table below and paste into an Excel sheet, or print to PDF.');
      }, 500);
    }
  };

  const handleExport = async () => {
    if (!exportStats || exportStats.total_records === 0) {
      alert('⚠️ No incidents to export. Please adjust your filters.');
      return;
    }

    try {
      setExporting(true);

      const exportParams = {};

      if (filters.status) exportParams.status = filters.status;
      if (filters.report_type) exportParams.report_type = filters.report_type;
      if (filters.priority) exportParams.priority = filters.priority;
      if (filters.disaster_type) exportParams.disaster_type = filters.disaster_type;
      if (filters.property_damage) exportParams.property_damage = filters.property_damage;
      if (filters.date_from) exportParams.created_at__gte = filters.date_from;
      if (filters.date_to) exportParams.created_at__lte = filters.date_to;

      if (user?.user_type === 'citizen') {
        exportParams.reporter = user.id;
      }

      const allParams = { ...exportParams, page_size: 1000 };
      const allIncidents = await apiService.getIncidents(allParams);
      const incidents = allIncidents.results || allIncidents || [];

      if (incidents.length === 0) {
        alert('No data to export. Please adjust your filters.');
        return;
      }

      generateBrandedReport(incidents, filters.format);

    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`❌ Export failed: ${error.message || 'Please try again or contact support.'}`);
    } finally {
      setExporting(false);
    }
  };

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: Table, description: 'Best for Excel & spreadsheets' },
    { value: 'xlsx', label: 'Excel', icon: FileText, description: 'Copy table to Excel' },
    { value: 'pdf', label: 'PDF', icon: File, description: 'Portable document format' }
  ];

  const quickPresets = [
    {
      name: 'All Incidents',
      description: 'Export all available incidents',
      filters: {
        status: '',
        report_type: '',
        priority: '',
        disaster_type: '',
        property_damage: '',
        date_from: '',
        date_to: '',
        format: 'csv'
      }
    },
    {
      name: 'Last 30 Days',
      description: 'All incidents from the past month',
      filters: {
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
        format: 'csv'
      }
    },
    {
      name: 'Emergency Reports',
      description: 'All emergency type incidents',
      filters: {
        report_type: 'emergency',
        format: 'csv'
      }
    },
    {
      name: 'Unresolved Critical',
      description: 'Priority 1-2 not yet resolved',
      filters: {
        status: 'submitted,under_review,in_progress,escalated',
        format: 'csv'
      }
    },
    {
      name: 'Severe Damage',
      description: 'Severe or total property damage',
      filters: {
        property_damage: 'severe',
        format: 'csv'
      }
    },
    {
      name: 'Resolved This Week',
      description: 'Recently resolved incidents',
      filters: {
        status: 'resolved',
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
        format: 'csv'
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
          <p className="text-gray-600">Loading export options...</p>
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
                  Incidents
                </Link>
                <span>/</span>
                <span className="text-gray-900">Export</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">Export Incident Reports</h1>
              <p className="text-gray-600">Download incident data with advanced filtering options</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Level Notice */}
        {user?.user_type === 'citizen' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-green-900 mb-1">Personal Data Export</h3>
                <p className="text-sm text-green-700">
                  You can only export your own incident reports. Filters will be applied to your reports only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Bar */}
        {activeFilters.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Active Filters ({activeFilters.length})</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear All
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
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Options
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Report Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      {filterOptions.statuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                    <select
                      value={filters.report_type}
                      onChange={(e) => handleFilterChange('report_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      {filterOptions.reportTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority & Disaster Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Priorities</option>
                      {filterOptions.priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Disaster Type</label>
                    <select
                      value={filters.disaster_type}
                      onChange={(e) => handleFilterChange('disaster_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Disaster Types</option>
                      {filterOptions.disasterTypes.map(disaster => (
                        <option key={disaster.value} value={disaster.value}>{disaster.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Property Damage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Damage</label>
                  <select
                    value={filters.property_damage}
                    onChange={(e) => handleFilterChange('property_damage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Damage Levels</option>
                    {filterOptions.propertyDamage.map(damage => (
                      <option key={damage.value} value={damage.value}>{damage.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">From date</p>
                    </div>
                    <div>
                      <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">To date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-semibold text-gray-900">Quick Export Presets</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setFilters(prev => ({ ...prev, ...preset.filters }))}
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
                  Export Settings
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                  <div className="space-y-2">
                    {formatOptions.map((format) => {
                      const IconComponent = format.icon;
                      return (
                        <label
                          key={format.value}
                          className={`relative flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            filters.format === format.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
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
                      <span className="text-sm text-gray-600">Records to export</span>
                      <button onClick={getExportStats} className="text-blue-600 hover:text-blue-700" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {exportStats.total_records.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Est. file size: ~{exportStats.estimated_file_size} KB
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
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Export Data
                    </>
                  )}
                </button>

                {exportStats && exportStats.total_records === 0 && (
                  <div className="text-sm text-amber-600 text-center space-y-2">
                    <p>⚠️ No incidents match your filters</p>
                    <button
                      onClick={clearAllFilters}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}

                {/* Export Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Export Information</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• All data matching filters will be included</li>
                    <li>• Media files included as URLs only</li>
                    <li>• Large exports may take time to process</li>
                    <li>• For CSV/Excel: Copy the table or save as CSV/Excel from the browser</li>
                    <li>• For PDF: Print the report directly</li>
                    {user?.user_type === 'citizen' && (
                      <li className="font-semibold">• Only your own reports will be exported</li>
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
              <h3 className="text-sm font-semibold text-red-900 mb-2">Emergency Contacts</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-red-800">
                <div>
                  <p className="font-medium">Police Emergency: <span className="text-lg">912</span></p>
                  <p>Medical: 114</p>
                </div>
                <div>
                  <p>Fire Emergency: 113</p>
                  <p>SMS Emergency: 3030</p>
                </div>
                <div>
                  <p className="text-xs text-red-600 mt-1">
                    For life-threatening emergencies, call immediately.
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
