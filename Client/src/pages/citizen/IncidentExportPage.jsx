import React, { useState } from 'react';
import { 
  Download,
  RefreshCw,
  Calendar,
  Filter,
  FileText,
  Table,
  Code,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const IncidentExportPage = () => {
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    report_type: '',
    priority: '',
    date_from: '',
    date_to: '',
    format: 'csv'
  });
  const [exportStats, setExportStats] = useState(null);
  const navigate = useNavigate();

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getExportStats = async () => {
    try {
      // This would call an API endpoint that returns count of matching records
      const params = { ...filters };
      delete params.format;
      
      const response = await apiService.getIncidents({
        ...params,
        count_only: true
      });
      
      setExportStats({
        total_records: response.count || 0,
        estimated_file_size: Math.ceil((response.count || 0) * 0.5) // Rough estimate in KB
      });
    } catch (error) {
      console.error('Failed to get export stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await apiService.exportIncidents(filters.format, filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents_export_${new Date().toISOString().split('T')[0]}.${filters.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success message
      alert('Export completed successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  React.useEffect(() => {
    getExportStats();
  }, [filters]);

  const formatOptions = [
    { value: 'csv', label: 'CSV (Comma Separated Values)', icon: Table, description: 'Best for spreadsheet applications like Excel' },
    { value: 'xlsx', label: 'Excel (XLSX)', icon: FileText, description: 'Native Excel format with formatting support' },
    { value: 'json', label: 'JSON', icon: Code, description: 'Structured data format for developers' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link to="/incidents" className="hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Incidents
                </Link>
                <span>/</span>
                <span className="text-gray-900">Export</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">Export Incidents</h1>
              <p className="text-gray-600">Download incident data in your preferred format</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Export Configuration */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Export Configuration</h2>
                <p className="text-sm text-gray-600">Configure your export settings and filters</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Filters */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Data Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Filter
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="verified">Verified</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type Filter
                    </label>
                    <select
                      value={filters.report_type}
                      onChange={(e) => handleFilterChange('report_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="emergency">Emergency</option>
                      <option value="hazard">Hazard</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="health">Health</option>
                      <option value="security">Security</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Filter
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Priorities</option>
                      <option value="1">Priority 1 (Highest)</option>
                      <option value="2">Priority 2</option>
                      <option value="3">Priority 3</option>
                      <option value="4">Priority 4</option>
                      <option value="5">Priority 5 (Lowest)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  Export Format
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formatOptions.map((format) => {
                    const IconComponent = format.icon;
                    return (
                      <label
                        key={format.value}
                        className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                        <IconComponent className={`w-5 h-5 mr-3 mt-0.5 ${
                          filters.format === format.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${
                            filters.format === format.value ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {format.label}
                          </div>
                          <div className={`text-sm ${
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
            </div>
          </div>

          {/* Export Stats */}
          {exportStats && (
            <div className="bg-gray-50 border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{exportStats.total_records}</span> incidents match your filters
                  </p>
                  <p className="text-xs text-gray-500">
                    Estimated file size: ~{exportStats.estimated_file_size} KB
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={getExportStats}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="bg-white border-t px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleExport}
                disabled={exporting || (exportStats && exportStats.total_records === 0)}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Exporting {exportStats?.total_records || 0} records...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Export {exportStats?.total_records || 0} Incidents
                  </>
                )}
              </button>
              
              <Link
                to="/incidents"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center font-medium"
              >
                Cancel
              </Link>
            </div>

            {exportStats && exportStats.total_records === 0 && (
              <p className="text-sm text-amber-600 mt-3 text-center">
                No incidents match your current filters. Please adjust your filters and try again.
              </p>
            )}
          </div>

          {/* Export Information */}
          <div className="bg-blue-50 border-t px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-1 rounded">
                <Download className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Export Information</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• The export will include all incident data matching your selected filters</p>
                  <p>• Media files (images/videos) are not included in exports - only file URLs</p>
                  <p>• Large exports may take a few minutes to process</p>
                  <p>• Your download will start automatically when ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Export Presets */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Export Presets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setFilters({
                  status: '',
                  report_type: '',
                  priority: '',
                  date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  date_to: new Date().toISOString().split('T')[0],
                  format: 'csv'
                });
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-1">Last 30 Days</h4>
              <p className="text-sm text-gray-600">All incidents from the past month in CSV format</p>
            </button>

            <button
              onClick={() => {
                setFilters({
                  status: 'resolved',
                  report_type: '',
                  priority: '',
                  date_from: '',
                  date_to: '',
                  format: 'xlsx'
                });
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-1">Resolved Incidents</h4>
              <p className="text-sm text-gray-600">All resolved incidents in Excel format</p>
            </button>

            <button
              onClick={() => {
                setFilters({
                  status: '',
                  report_type: 'emergency',
                  priority: '',
                  date_from: '',
                  date_to: '',
                  format: 'csv'
                });
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-1">Emergency Reports</h4>
              <p className="text-sm text-gray-600">All emergency type incidents in CSV format</p>
            </button>

            <button
              onClick={() => {
                setFilters({
                  status: '',
                  report_type: '',
                  priority: '1',
                  date_from: '',
                  date_to: '',
                  format: 'xlsx'
                });
              }}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-1">High Priority</h4>
              <p className="text-sm text-gray-600">Priority 1 incidents in Excel format</p>
            </button>
          </div>
        </div>

        {/* Export History */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">incidents_export_2025-01-15.csv</p>
                  <p className="text-xs text-gray-500">245 records • Downloaded 2 hours ago</p>
                </div>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Completed</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Table className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">incidents_export_2025-01-12.xlsx</p>
                  <p className="text-xs text-gray-500">189 records • Downloaded 5 days ago</p>
                </div>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Completed</span>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Export history is kept for 30 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentExportPage;