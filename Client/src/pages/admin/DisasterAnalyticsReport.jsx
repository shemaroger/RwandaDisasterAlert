import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Search, Filter, Eye, X, Loader, AlertTriangle, Users, Calendar,
    MapPin, TrendingUp, Activity, BarChart3, Download, FileText,
    Shield, Bell, CheckCircle, XCircle, Clock, Zap, Heart,
    Database, Target, PieChart, LineChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const DisasterAnalyticsReport = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [disasterTypes, setDisasterTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewAlert, setViewAlert] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        disasterType: 'all',
        severity: 'all',
        district: 'all',
        status: 'all',
        searchTerm: ''
    });

    const severityLevels = [
        { value: 'critical', label: 'Critical', color: 'red' },
        { value: 'high', label: 'High', color: 'orange' },
        { value: 'medium', label: 'Medium', color: 'yellow' },
        { value: 'low', label: 'Low', color: 'blue' }
    ];

    // Rwanda Districts
    const rwandaDistricts = [
        { id: 'bugesera', name: 'Bugesera' },
        { id: 'burera', name: 'Burera' },
        { id: 'gakenke', name: 'Gakenke' },
        { id: 'gasabo', name: 'Gasabo' },
        { id: 'gatsibo', name: 'Gatsibo' },
        { id: 'gicumbi', name: 'Gicumbi' },
        { id: 'gisagara', name: 'Gisagara' },
        { id: 'huye', name: 'Huye' },
        { id: 'kamonyi', name: 'Kamonyi' },
        { id: 'karongi', name: 'Karongi' },
        { id: 'kayonza', name: 'Kayonza' },
        { id: 'kicukiro', name: 'Kicukiro' },
        { id: 'kirehe', name: 'Kirehe' },
        { id: 'muhanga', name: 'Muhanga' },
        { id: 'musanze', name: 'Musanze' },
        { id: 'ngoma', name: 'Ngoma' },
        { id: 'ngororero', name: 'Ngororero' },
        { id: 'nyabihu', name: 'Nyabihu' },
        { id: 'nyagatare', name: 'Nyagatare' },
        { id: 'nyamagabe', name: 'Nyamagabe' },
        { id: 'nyanza', name: 'Nyanza' },
        { id: 'nyarugenge', name: 'Nyarugenge' },
        { id: 'nyaruguru', name: 'Nyaruguru' },
        { id: 'rubavu', name: 'Rubavu' },
        { id: 'ruhango', name: 'Ruhango' },
        { id: 'rulindo', name: 'Rulindo' },
        { id: 'rusizi', name: 'Rusizi' },
        { id: 'rutsiro', name: 'Rutsiro' },
        { id: 'rwamagana', name: 'Rwamagana' }
    ];

    // Check if user can access reports using useAuth hook
    const canAccessReports = user?.user_type === 'admin';

    useEffect(() => {
        if (!canAccessReports) {
            toast.error('Access denied. Administrator privileges required.');
            navigate('/dashboard');
            return;
        }
        fetchAllData();
    }, [canAccessReports, navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [alertsRes, incidentsRes, usersRes, locationsRes, disasterTypesRes] = await Promise.all([
                apiService.getAlerts({ page_size: 1000 }),
                apiService.getIncidents({ page_size: 1000 }),
                apiService.getUsers({ page_size: 1000 }),
                apiService.getLocations(),
                apiService.getDisasterTypes()
            ]);

            setAlerts(alertsRes.results || alertsRes || []);
            setIncidents(incidentsRes.results || incidentsRes || []);
            setUsers(usersRes.results || usersRes || []);
            setLocations(locationsRes.results || locationsRes || []);
            setDisasterTypes(disasterTypesRes.results || disasterTypesRes || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error loading analytics data');
        } finally {
            setLoading(false);
        }
    };

    // Data Processing
    const getFilteredAlerts = () => {
        return alerts.filter(alert => {
            if (filters.startDate && new Date(alert.created_at) < new Date(filters.startDate)) return false;
            if (filters.endDate && new Date(alert.created_at) > new Date(filters.endDate)) return false;
            if (filters.disasterType !== 'all' && alert.disaster_type !== parseInt(filters.disasterType)) return false;
            if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
            if (filters.district !== 'all' && alert.district !== filters.district) return false;
            if (filters.status !== 'all' && alert.status !== filters.status) return false;
            
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const title = (alert.title || '').toLowerCase();
                const message = (alert.message || '').toLowerCase();
                if (!title.includes(searchLower) && !message.includes(searchLower)) return false;
            }
            
            return true;
        });
    };

    const getFilteredIncidents = () => {
        return incidents.filter(incident => {
            if (filters.startDate && new Date(incident.created_at) < new Date(filters.startDate)) return false;
            if (filters.endDate && new Date(incident.created_at) > new Date(filters.endDate)) return false;
            if (filters.disasterType !== 'all' && incident.disaster_type !== parseInt(filters.disasterType)) return false;
            if (filters.severity !== 'all' && incident.severity !== filters.severity) return false;
            if (filters.district !== 'all' && incident.district !== filters.district) return false;
            return true;
        });
    };

    const calculateStats = () => {
        const filteredAlerts = getFilteredAlerts();
        const filteredIncidents = getFilteredIncidents();

        const stats = {
            // Alert statistics
            totalAlerts: filteredAlerts.length,
            activeAlerts: filteredAlerts.filter(a => a.status === 'active').length,
            resolvedAlerts: filteredAlerts.filter(a => a.status === 'resolved').length,
            cancelledAlerts: filteredAlerts.filter(a => a.status === 'cancelled').length,

            // Severity breakdown
            criticalAlerts: filteredAlerts.filter(a => a.severity === 'critical').length,
            highAlerts: filteredAlerts.filter(a => a.severity === 'high').length,
            mediumAlerts: filteredAlerts.filter(a => a.severity === 'medium').length,
            lowAlerts: filteredAlerts.filter(a => a.severity === 'low').length,

            // Incident statistics
            totalIncidents: filteredIncidents.length,
            verifiedIncidents: filteredIncidents.filter(i => i.is_verified).length,
            resolvedIncidents: filteredIncidents.filter(i => i.status === 'resolved').length,
            pendingIncidents: filteredIncidents.filter(i => i.status === 'pending').length,

            // User statistics - Only admin and citizen
            totalUsers: users.length,
            citizens: users.filter(u => u.user_type === 'citizen').length,
            admins: users.filter(u => u.user_type === 'admin').length,

            // Response metrics
            averageResponseTime: 0,
            districtsAffected: 0,
            disasterTypesActive: 0
        };

        // Calculate affected districts
        const affectedDistricts = new Set(
            [...filteredAlerts, ...filteredIncidents]
                .map(item => item.district)
                .filter(Boolean)
        );
        stats.districtsAffected = affectedDistricts.size;

        // Calculate active disaster types
        const activeDisasterTypes = new Set(
            [...filteredAlerts, ...filteredIncidents]
                .map(item => item.disaster_type)
                .filter(Boolean)
        );
        stats.disasterTypesActive = activeDisasterTypes.size;

        return stats;
    };

    const getUniqueDistricts = () => {
        const districts = [...new Set(
            [...alerts, ...incidents]
                .map(item => item.district)
                .filter(Boolean)
        )];
        return districts.sort();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            'critical': 'bg-red-100 text-red-800 border-red-300',
            'high': 'bg-orange-100 text-orange-800 border-orange-300',
            'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'low': 'bg-blue-100 text-blue-800 border-blue-300'
        };
        return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getStatusColor = (status) => {
        const colors = {
            'active': 'bg-green-100 text-green-800',
            'resolved': 'bg-blue-100 text-blue-800',
            'cancelled': 'bg-gray-100 text-gray-800',
            'pending': 'bg-yellow-100 text-yellow-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handleView = async (alert) => {
        try {
            const result = await apiService.getAlert(alert.id);
            setViewAlert(result);
            setShowViewModal(true);
        } catch (error) {
            console.error('Error fetching alert details:', error);
            toast.error('Error loading alert details');
        }
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            disasterType: 'all',
            severity: 'all',
            district: 'all',
            status: 'all',
            searchTerm: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.startDate || filters.endDate || filters.disasterType !== 'all' ||
            filters.severity !== 'all' || filters.district !== 'all' || 
            filters.status !== 'all' || filters.searchTerm;
    };

    const generatePDFReport = () => {
        const filteredAlerts = getFilteredAlerts();
        const filteredIncidents = getFilteredIncidents();
        const stats = calculateStats();

        if (filteredAlerts.length === 0 && filteredIncidents.length === 0) {
            alert('No data to export. Please adjust your filters.');
            return;
        }

        const printWindow = window.open('', '_blank');
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>MINEMA Disaster Analytics Report</title>
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
                        text-align: center;
                        border-bottom: 2px solid #000;
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
                        margin: 20px 0 10px 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        border-bottom: 1px solid white;
                        padding-bottom: 5px;
                    }
                    .report-date {
                        font-size: 12px;
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
                    .footer {
                        margin-top: 30px;
                        padding: 20px;
                        background: #f5f5f5;
                        border-top: 2px solid #000;
                    }
                    .signature-section {
                        padding-top: 30px;
                        border-top: 1px solid #000;
                        margin-top: 20px;
                    }
                    .signature-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 60px;
                        margin-top: 20px;
                    }
                    .signature-line {
                        border-bottom: 1px solid #000;
                        margin: 40px 0 10px 0;
                    }
                    .signature-label {
                        font-weight: bold;
                        font-size: 12px;
                        text-transform: uppercase;
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
                        <div class="system-info">
                            <h1>MINEMA Alert System</h1>
                            <p>Ministry in Charge of Emergency Management</p>
                            <p>Rwanda Disaster Management & Emergency Response</p>
                        </div>
                        <div class="report-title">Disaster Analytics Report</div>
                        <div class="report-date">Generated on ${new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</div>
                    </div>
                    
                    <div class="content">
                        <h2 class="section-title">Emergency Alert Statistics</h2>
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-value">${stats.totalAlerts}</div>
                                <div class="stat-label">Total Alerts</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${stats.activeAlerts}</div>
                                <div class="stat-label">Active Alerts</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${stats.criticalAlerts}</div>
                                <div class="stat-label">Critical Level</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${stats.districtsAffected}</div>
                                <div class="stat-label">Districts Affected</div>
                            </div>
                        </div>

                        <h2 class="section-title">Severity Distribution</h2>
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-value" style="color: #dc2626;">${stats.criticalAlerts}</div>
                                <div class="stat-label">Critical</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value" style="color: #f97316;">${stats.highAlerts}</div>
                                <div class="stat-label">High</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value" style="color: #eab308;">${stats.mediumAlerts}</div>
                                <div class="stat-label">Medium</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value" style="color: #3b82f6;">${stats.lowAlerts}</div>
                                <div class="stat-label">Low</div>
                            </div>
                        </div>

                        <h2 class="section-title">Alert Details</h2>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Alert Title</th>
                                    <th>Severity</th>
                                    <th>District</th>
                                    <th>Date/Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredAlerts.map(alert => `
                                    <tr>
                                        <td>${alert.title || 'N/A'}</td>
                                        <td>${(alert.severity || 'N/A').toUpperCase()}</td>
                                        <td>${alert.district || 'Multiple'}</td>
                                        <td>${formatDate(alert.created_at)}</td>
                                        <td>${(alert.status || 'N/A').toUpperCase()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <h2 class="section-title">Incident Reports</h2>
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-value">${stats.totalIncidents}</div>
                                <div class="stat-label">Total Incidents</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${stats.verifiedIncidents}</div>
                                <div class="stat-label">Verified</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${stats.resolvedIncidents}</div>
                                <div class="stat-label">Resolved</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${stats.pendingIncidents}</div>
                                <div class="stat-label">Pending</div>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 10px 0;">Analytics Summary</h3>
                            <p style="margin: 5px 0;"><strong>Total Alerts Issued:</strong> ${stats.totalAlerts}</p>
                            <p style="margin: 5px 0;"><strong>Total Incidents Reported:</strong> ${stats.totalIncidents}</p>
                            <p style="margin: 5px 0;"><strong>Districts Covered:</strong> ${stats.districtsAffected}</p>
                            <p style="margin: 5px 0;"><strong>Active Disaster Types:</strong> ${stats.disasterTypesActive}</p>
                            <p style="margin: 5px 0;"><strong>System Users:</strong> ${stats.totalUsers}</p>
                        </div>
                        <div class="signature-section">
                            <div class="signature-grid">
                                <div class="signature-box">
                                    <div class="signature-line"></div>
                                    <div class="signature-label">Emergency Response Coordinator</div>
                                    <div style="font-size: 10px; margin-top: 5px;">
                                        Date: ${new Date().toLocaleDateString('en-US')}
                                    </div>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-line"></div>
                                    <div class="signature-label">MINEMA Director</div>
                                    <div style="font-size: 10px; margin-top: 5px;">
                                        Date: _________________
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(reportHTML);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    const filteredAlerts = getFilteredAlerts();
    const filteredIncidents = getFilteredIncidents();
    const stats = calculateStats();
    const uniqueDistricts = getUniqueDistricts();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <Loader className="w-8 h-8 animate-spin text-red-600" />
                    <span className="text-gray-600">Loading disaster analytics...</span>
                </div>
            </div>
        );
    }

    if (!canAccessReports) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You need administrator privileges to access this page.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold uppercase">
                                    Disaster Analytics Report
                                </h1>
                                <p className="text-red-100 text-sm">Comprehensive emergency response metrics</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={generatePDFReport}
                                disabled={loading || (filteredAlerts.length === 0 && filteredIncidents.length === 0)}
                                className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button
                                onClick={fetchAllData}
                                className="bg-red-800 hover:bg-red-900 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                            >
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 uppercase flex items-center">
                                <Filter className="w-5 h-5 mr-2" />
                                Analytics Filters
                            </h3>
                            {hasActiveFilters() && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Disaster Type
                                </label>
                                <select
                                    value={filters.disasterType}
                                    onChange={(e) => setFilters({ ...filters, disasterType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="all">All Types</option>
                                    {disasterTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Severity
                                </label>
                                <select
                                    value={filters.severity}
                                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="all">All Severities</option>
                                    {severityLevels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    District
                                </label>
                                <select
                                    value={filters.district}
                                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="all">All Districts</option>
                                    {rwandaDistricts.map(district => (
                                        <option key={district.id} value={district.name}>
                                            {district.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search alerts by title or message..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Total Alerts</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAlerts}</p>
                            </div>
                            <Bell className="w-12 h-12 text-red-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Active Alerts</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeAlerts}</p>
                            </div>
                            <Activity className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-orange-500 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Total Incidents</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalIncidents}</p>
                            </div>
                            <FileText className="w-12 h-12 text-orange-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Districts Affected</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.districtsAffected}</p>
                            </div>
                            <MapPin className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Severity Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-md p-6 border border-red-200">
                        <div className="text-center">
                            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-red-900 uppercase mb-2">Critical</p>
                            <p className="text-3xl font-bold text-red-600">{stats.criticalAlerts}</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-6 border border-orange-200">
                        <div className="text-center">
                            <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-orange-900 uppercase mb-2">High</p>
                            <p className="text-3xl font-bold text-orange-600">{stats.highAlerts}</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-md p-6 border border-yellow-200">
                        <div className="text-center">
                            <Activity className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-yellow-900 uppercase mb-2">Medium</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.mediumAlerts}</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-blue-900 uppercase mb-2">Low</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.lowAlerts}</p>
                        </div>
                    </div>
                </div>

                {/* Alert Details Table */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 uppercase flex items-center">
                            <Bell className="w-5 h-5 mr-2 text-red-600" />
                            Alert Details
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{filteredAlerts.length} alerts analyzed</p>
                    </div>
                    <div className="p-6">
                        {filteredAlerts.length === 0 ? (
                            <div className="text-center py-12">
                                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No Alert Data Found</h3>
                                <p className="text-gray-600 mb-4">
                                    {hasActiveFilters()
                                        ? 'No alerts match the selected filters'
                                        : 'No alert data available'}
                                </p>
                                {hasActiveFilters() && (
                                    <button
                                        onClick={clearFilters}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Alert Information
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Severity & Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Date & Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredAlerts.map((alert, index) => (
                                            <tr key={alert.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {alert.title || 'Untitled Alert'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                        {alert.message || 'No message'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(alert.severity)}`}>
                                                        {(alert.severity || 'unknown').toUpperCase()}
                                                    </span>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        {alert.disaster_type_name || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                                        {alert.district || 'Multiple Districts'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                                        {formatDate(alert.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(alert.status)}`}>
                                                        {(alert.status || 'unknown').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleView(alert)}
                                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                                                    >
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Incident Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Total Incidents</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalIncidents}</p>
                            </div>
                            <FileText className="w-10 h-10 text-purple-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Verified</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.verifiedIncidents}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Resolved</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.resolvedIncidents}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-blue-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Pending</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingIncidents}</p>
                            </div>
                            <Clock className="w-10 h-10 text-yellow-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* System Users Summary - Updated for Admin and Citizen only */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 uppercase mb-6 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-red-600" />
                        System Users & Coverage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                            <p className="text-sm text-gray-600 uppercase font-semibold">Total Users</p>
                        </div>
                        <div className="text-center">
                            <Heart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-600">{stats.citizens}</p>
                            <p className="text-sm text-gray-600 uppercase font-semibold">Citizens</p>
                        </div>
                        <div className="text-center">
                            <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
                            <p className="text-sm text-gray-600 uppercase font-semibold">Administrators</p>
                        </div>
                    </div>
                </div>

                {/* Analytics Summary */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-md border border-red-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 uppercase mb-6 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-red-600" />
                        Analytics Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-3 uppercase text-sm">Alert Overview</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Alerts:</span>
                                    <span className="font-bold text-gray-900">{stats.totalAlerts}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Active:</span>
                                    <span className="font-bold text-green-600">{stats.activeAlerts}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Resolved:</span>
                                    <span className="font-bold text-blue-600">{stats.resolvedAlerts}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Cancelled:</span>
                                    <span className="font-bold text-gray-600">{stats.cancelledAlerts}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-3 uppercase text-sm">Incident Overview</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Reports:</span>
                                    <span className="font-bold text-gray-900">{stats.totalIncidents}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Verified:</span>
                                    <span className="font-bold text-green-600">{stats.verifiedIncidents}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Resolved:</span>
                                    <span className="font-bold text-blue-600">{stats.resolvedIncidents}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pending:</span>
                                    <span className="font-bold text-yellow-600">{stats.pendingIncidents}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-3 uppercase text-sm">Coverage Metrics</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Districts:</span>
                                    <span className="font-bold text-gray-900">{stats.districtsAffected}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Active Disasters:</span>
                                    <span className="font-bold text-orange-600">{stats.disasterTypesActive}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">System Users:</span>
                                    <span className="font-bold text-purple-600">{stats.totalUsers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Citizens Protected:</span>
                                    <span className="font-bold text-blue-600">{stats.citizens}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-300">
                        <div className="text-sm text-gray-700 space-y-2">
                            <p><strong>Report Generated:</strong> {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                            <p><strong>Data Source:</strong> MINEMA Live Disaster Management System</p>
                            <p><strong>Filters Applied:</strong> {hasActiveFilters() ? 'Yes - Custom filters active' : 'None - Showing all data'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {showViewModal && viewAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-red-600 text-white p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Alert Details</h3>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-white hover:text-red-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                                <p className="text-gray-900">{viewAlert.title || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                                <p className="text-gray-900">{viewAlert.message || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Severity</label>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(viewAlert.severity)}`}>
                                        {(viewAlert.severity || 'N/A').toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(viewAlert.status)}`}>
                                        {(viewAlert.status || 'N/A').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">District</label>
                                <p className="text-gray-900">{viewAlert.district || 'Multiple Districts'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Created</label>
                                <p className="text-gray-900">{formatDate(viewAlert.created_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisasterAnalyticsReport;