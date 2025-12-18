import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Search,
    Filter,
    Loader,
    Users,
    AlertTriangle,
    MapPin,
    Bell,
    Download,
    Activity,
    BarChart3,
    TrendingUp,
    Shield,
    Database,
    Calendar,
    AlertCircle,
    RefreshCw,
    X,
    CheckCircle,
    Clock,
    Target,
    Zap,
    MessageSquare,
    FileText,
    Globe
} from 'lucide-react';
import apiService from '../services/api';
import logo from '../assets/images/logo.png'; // Your logo path

const DisasterManagementReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data states
    const [users, setUsers] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [locations, setLocations] = useState([]);
    const [disasterTypes, setDisasterTypes] = useState([]);
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [safetyGuides, setSafetyGuides] = useState([]);
    const [deliveryStats, setDeliveryStats] = useState({});

    // Filter states
    const [filters, setFilters] = useState({
        reportType: 'overview',
        accountType: 'all', // all, citizen, operator, authority, admin
        dateFrom: '',
        dateTo: '',
        dateInterval: 'all',
        status: 'all',
        severity: 'all',
        searchTerm: '',
        sortBy: 'created_at',
        sortOrder: 'desc'
    });

    const dateIntervals = [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'this_week', label: 'This Week' },
        { value: 'last_week', label: 'Last Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'this_year', label: 'This Year' },
        { value: 'last_year', label: 'Last Year' },
        { value: 'custom', label: 'Custom Range' }
    ];

    const accountTypes = [
        { value: 'all', label: 'All User Types' },
        { value: 'citizen', label: 'Citizens' },
        { value: 'operator', label: 'Operators' },
        { value: 'authority', label: 'Authorities' },
        { value: 'admin', label: 'Administrators' }
    ];

    const sortOptions = [
        { value: 'created_at', label: 'Date Created' },
        { value: 'name', label: 'Name' },
        { value: 'status', label: 'Status' },
        { value: 'severity', label: 'Severity/Priority' }
    ];

    const severityLevels = [
        { value: 'all', label: 'All Severities' },
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
    ];

    // Get user data and verify admin role
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isAdmin = userData?.user_type === 'admin' || userData?.role === 'admin';

    useEffect(() => {
        if (!isAdmin) {
            toast.error('Access denied. Admin privileges required.');
            navigate('/dashboard');
            return;
        }
        fetchAllData();
    }, []);

    // Calculate date range based on interval
    const calculateDateRange = (interval) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let from, to;

        switch (interval) {
            case 'today':
                from = today;
                to = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
                break;
            case 'yesterday':
                from = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                to = new Date(today.getTime() - 1);
                break;
            case 'this_week':
                const dayOfWeek = today.getDay();
                from = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
                to = now;
                break;
            case 'last_week':
                const lastWeekEnd = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000 - 1);
                from = new Date(lastWeekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
                to = lastWeekEnd;
                break;
            case 'this_month':
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                to = now;
                break;
            case 'last_month':
                from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                break;
            case 'this_year':
                from = new Date(now.getFullYear(), 0, 1);
                to = now;
                break;
            case 'last_year':
                from = new Date(now.getFullYear() - 1, 0, 1);
                to = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
                break;
            case 'all':
            default:
                return { from: null, to: null };
        }

        return { from, to };
    };

    const handleDateIntervalChange = (interval) => {
        setFilters(prev => ({ ...prev, dateInterval: interval }));
        
        if (interval !== 'custom' && interval !== 'all') {
            const { from, to } = calculateDateRange(interval);
            setFilters(prev => ({
                ...prev,
                dateFrom: from ? from.toISOString().split('T')[0] : '',
                dateTo: to ? to.toISOString().split('T')[0] : ''
            }));
        } else if (interval === 'all') {
            setFilters(prev => ({
                ...prev,
                dateFrom: '',
                dateTo: ''
            }));
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔄 Fetching all disaster management data...');
            
            const [
                usersResponse,
                alertsResponse,
                incidentsResponse,
                locationsResponse,
                disasterTypesResponse,
                emergencyContactsResponse,
                safetyGuidesResponse,
                deliveryStatsResponse
            ] = await Promise.all([
                apiService.getUsers({ page_size: 1000 }).catch(e => ({ results: [] })),
                apiService.getAlerts({ page_size: 1000 }).catch(e => ({ results: [] })),
                apiService.getIncidents({ page_size: 1000 }).catch(e => ({ results: [] })),
                apiService.getLocations({ page_size: 1000 }).catch(e => ({ results: [] })),
                apiService.getDisasterTypes({ page_size: 1000 }).catch(e => ({ results: [] })),
                apiService.getEmergencyContacts({ page_size: 1000 }).catch(e => ({ results: [] })),
                apiService.getSafetyGuides({ page_size: 1000 }).catch(e => ({ results: [] })),
                apiService.getDeliveryStatistics().catch(e => ({}))
            ]);

            const extractData = (response) => {
                if (!response) return [];
                if (Array.isArray(response)) return response;
                if (response.data) {
                    if (Array.isArray(response.data)) return response.data;
                    if (response.data.results) return response.data.results;
                }
                if (response.results) return response.results;
                return [];
            };

            const usersData = extractData(usersResponse);
            const alertsData = extractData(alertsResponse);
            const incidentsData = extractData(incidentsResponse);
            const locationsData = extractData(locationsResponse);
            const disasterTypesData = extractData(disasterTypesResponse);
            const emergencyContactsData = extractData(emergencyContactsResponse);
            const safetyGuidesData = extractData(safetyGuidesResponse);

            console.log('✅ Data fetched:', {
                users: usersData.length,
                alerts: alertsData.length,
                incidents: incidentsData.length,
                locations: locationsData.length,
                disasterTypes: disasterTypesData.length,
                emergencyContacts: emergencyContactsData.length,
                safetyGuides: safetyGuidesData.length
            });

            setUsers(usersData);
            setAlerts(alertsData);
            setIncidents(incidentsData);
            setLocations(locationsData);
            setDisasterTypes(disasterTypesData);
            setEmergencyContacts(emergencyContactsData);
            setSafetyGuides(safetyGuidesData);
            setDeliveryStats(deliveryStatsResponse);

            toast.success('System data loaded successfully');
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            setError('Failed to load system data');
            toast.error('Failed to load system data');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        // Apply date filtering
        const filterByDate = (items) => {
            if (!filters.dateFrom && !filters.dateTo) return items;
            
            return items.filter(item => {
                const itemDate = new Date(item.created_at || item.timestamp);
                
                if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) return false;
                if (filters.dateTo) {
                    const toDate = new Date(filters.dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (itemDate > toDate) return false;
                }
                
                return true;
            });
        };

        // Apply account type filtering
        const filterByAccountType = (items) => {
            if (filters.accountType === 'all') return items;
            return items.filter(item => item.user_type === filters.accountType || item.role === filters.accountType);
        };

        // Apply severity filtering
        const filterBySeverity = (items) => {
            if (filters.severity === 'all') return items;
            return items.filter(item => item.severity === filters.severity || item.priority === filters.severity);
        };

        // Apply sorting
        const sortData = (items, field) => {
            const sorted = [...items].sort((a, b) => {
                let aVal, bVal;
                
                switch (field) {
                    case 'created_at':
                        aVal = new Date(a.created_at || a.timestamp || 0);
                        bVal = new Date(b.created_at || b.timestamp || 0);
                        break;
                    case 'name':
                        aVal = (a.username || a.title || a.name || '').toLowerCase();
                        bVal = (b.username || b.title || b.name || '').toLowerCase();
                        break;
                    case 'status':
                        aVal = (a.status || '').toString().toLowerCase();
                        bVal = (b.status || '').toString().toLowerCase();
                        break;
                    case 'severity':
                        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                        aVal = severityOrder[a.severity] || severityOrder[a.priority] || 0;
                        bVal = severityOrder[b.severity] || severityOrder[b.priority] || 0;
                        break;
                    default:
                        return 0;
                }
                
                if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
                if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
            
            return sorted;
        };

        // Filter and sort data
        const filteredUsers = sortData(filterByAccountType(filterByDate(users)), filters.sortBy);
        const filteredAlerts = sortData(filterBySeverity(filterByDate(alerts)), filters.sortBy);
        const filteredIncidents = sortData(filterBySeverity(filterByDate(incidents)), filters.sortBy);

        const stats = {
            // User stats
            totalUsers: filteredUsers.length,
            activeUsers: filteredUsers.filter(u => u.is_active !== false).length,
            citizenUsers: filteredUsers.filter(u => u.user_type === 'citizen' || u.role === 'citizen').length,
            operatorUsers: filteredUsers.filter(u => u.user_type === 'operator' || u.role === 'operator').length,
            authorityUsers: filteredUsers.filter(u => u.user_type === 'authority' || u.role === 'authority').length,
            adminUsers: filteredUsers.filter(u => u.user_type === 'admin' || u.role === 'admin').length,

            // Alert stats
            totalAlerts: filteredAlerts.length,
            activeAlerts: filteredAlerts.filter(a => a.status === 'active').length,
            criticalAlerts: filteredAlerts.filter(a => a.severity === 'critical').length,
            highPriorityAlerts: filteredAlerts.filter(a => a.severity === 'high').length,
            resolvedAlerts: filteredAlerts.filter(a => a.status === 'resolved' || a.status === 'cancelled').length,

            // Incident stats
            totalIncidents: filteredIncidents.length,
            pendingIncidents: filteredIncidents.filter(i => i.status === 'pending' || i.status === 'reported').length,
            verifiedIncidents: filteredIncidents.filter(i => i.status === 'verified').length,
            inProgressIncidents: filteredIncidents.filter(i => i.status === 'in_progress').length,
            resolvedIncidents: filteredIncidents.filter(i => i.status === 'resolved').length,

            // Location stats
            totalLocations: locations.length,
            provinces: locations.filter(l => l.level === 'province').length,
            districts: locations.filter(l => l.level === 'district').length,
            sectors: locations.filter(l => l.level === 'sector').length,
            villages: locations.filter(l => l.level === 'village').length,

            // Disaster type stats
            totalDisasterTypes: disasterTypes.length,
            activeDisasterTypes: disasterTypes.filter(d => d.is_active !== false).length,

            // Emergency contacts
            totalEmergencyContacts: emergencyContacts.length,

            // Safety guides
            totalSafetyGuides: safetyGuides.length,
            publishedSafetyGuides: safetyGuides.filter(s => s.is_published).length,
            featuredSafetyGuides: safetyGuides.filter(s => s.is_featured).length,

            // Notification delivery stats
            totalDeliveries: deliveryStats.total_deliveries || 0,
            deliverySuccessRate: deliveryStats.success_rate || 0,
            smsDeliveries: deliveryStats.by_method?.sms || 0,
            pushDeliveries: deliveryStats.by_method?.push || 0,
            emailDeliveries: deliveryStats.by_method?.email || 0,

            // Growth trends
            newUsersThisMonth: filteredUsers.filter(u => {
                const created = new Date(u.created_at || u.date_joined);
                return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
            }).length,
            newAlertsThisMonth: filteredAlerts.filter(a => {
                const created = new Date(a.created_at);
                return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
            }).length,
            newIncidentsThisMonth: filteredIncidents.filter(i => {
                const created = new Date(i.created_at);
                return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
            }).length,

            // System health
            systemResponseRate: filteredIncidents.length > 0 
                ? ((filteredIncidents.filter(i => i.status !== 'pending').length / filteredIncidents.length) * 100).toFixed(1)
                : 0,
            alertResolutionRate: filteredAlerts.length > 0
                ? ((filteredAlerts.filter(a => a.status === 'resolved' || a.status === 'cancelled').length / filteredAlerts.length) * 100).toFixed(1)
                : 0,
            
            // Filtered data for reports
            filteredUsers,
            filteredAlerts,
            filteredIncidents
        };

        return stats;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-US', {
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

    const clearFilters = () => {
        setFilters({
            reportType: 'overview',
            accountType: 'all',
            dateFrom: '',
            dateTo: '',
            dateInterval: 'all',
            status: 'all',
            severity: 'all',
            searchTerm: '',
            sortBy: 'created_at',
            sortOrder: 'desc'
        });
    };

    const generatePDFReport = () => {
        const stats = calculateStats();
        const { filteredUsers, filteredAlerts, filteredIncidents } = stats;

        const printWindow = window.open('', '_blank');
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Disaster Management System Report - ${formatDateTime(new Date())}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px;
                        color: #000;
                        background: white;
                        line-height: 1.6;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        border: 3px solid #000;
                        background: white;
                    }
                    .header {
                        background: white;
                        color: #000;
                        padding: 40px;
                        text-align: center;
                        border-bottom: 3px solid #000;
                    }
                    .header img.logo {
                        width: 100px;
                        height: auto;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        font-size: 32px;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        font-weight: bold;
                    }
                    .header .subtitle {
                        font-size: 16px;
                        font-weight: normal;
                    }
                    .report-meta {
                        background: #f8f8f8;
                        padding: 20px;
                        border-bottom: 2px solid #000;
                    }
                    .report-meta table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .report-meta td {
                        padding: 8px;
                        border-bottom: 1px solid #ccc;
                    }
                    .report-meta td:first-child {
                        font-weight: bold;
                        width: 200px;
                    }
                    .content {
                        padding: 30px;
                    }
                    .section {
                        margin-bottom: 40px;
                        page-break-inside: avoid;
                    }
                    .section-title {
                        font-size: 22px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 3px solid #000;
                        text-transform: uppercase;
                    }
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        border: 2px solid #000;
                    }
                    .data-table th,
                    .data-table td {
                        padding: 12px;
                        border: 1px solid #000;
                        text-align: left;
                        font-size: 11px;
                    }
                    .data-table th {
                        background: #000;
                        color: white;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .data-table tr:nth-child(even) {
                        background: #f5f5f5;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .summary-item {
                        padding: 15px;
                        background: #f8f8f8;
                        border: 2px solid #000;
                    }
                    .summary-item strong {
                        display: block;
                        margin-bottom: 5px;
                        font-size: 12px;
                    }
                    .summary-item .value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #000;
                    }
                    .badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border: 1px solid #000;
                        font-size: 10px;
                        font-weight: bold;
                        text-transform: uppercase;
                        background: white;
                    }
                    .badge-critical { background: #fee; border-color: #f00; color: #f00; }
                    .badge-high { background: #ffe; border-color: #f90; color: #f90; }
                    .badge-medium { background: #fef; border-color: #00f; color: #00f; }
                    .badge-low { background: #efe; border-color: #0a0; color: #0a0; }
                    .footer {
                        background: #f8f8f8;
                        padding: 30px;
                        border-top: 3px solid #000;
                    }
                    .signature-section {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 80px;
                        margin-top: 40px;
                    }
                    .signature-box {
                        text-align: center;
                    }
                    .signature-line {
                        border-bottom: 2px solid #000;
                        margin: 50px 20px 15px 20px;
                    }
                    .signature-label {
                        font-weight: bold;
                        font-size: 14px;
                        text-transform: uppercase;
                    }
                    @media print {
                        body { padding: 0; background: white !important; }
                        .container { border: none; }
                        .section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- Header -->
                    <div class="header">
                        <img src="${logo}" alt="Logo" class="logo" />
                        <h1>DISASTER MANAGEMENT SYSTEM REPORT</h1>
                        <div class="subtitle">Comprehensive Emergency Response Analytics</div>
                    </div>

                    <!-- Report Metadata -->
                    <div class="report-meta">
                        <table>
                            <tr>
                                <td>Report Generated:</td>
                                <td>${formatDateTime(new Date())}</td>
                            </tr>
                            <tr>
                                <td>Report Type:</td>
                                <td>Complete System Overview</td>
                            </tr>
                            <tr>
                                <td>Generated By:</td>
                                <td>${userData.username || 'System Administrator'}</td>
                            </tr>
                            <tr>
                                <td>Period Covered:</td>
                                <td>${filters.dateInterval !== 'all' && filters.dateInterval !== 'custom' 
                                    ? dateIntervals.find(d => d.value === filters.dateInterval)?.label 
                                    : filters.dateFrom && filters.dateTo 
                                        ? `${formatDate(filters.dateFrom)} to ${formatDate(filters.dateTo)}`
                                        : 'All Time'
                                }</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Content -->
                    <div class="content">
                        <!-- Executive Summary -->
                        <div class="section">
                            <div class="section-title">📊 EXECUTIVE SUMMARY</div>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <strong>Total Users</strong>
                                    <div class="value">${stats.totalUsers}</div>
                                    <small>${stats.activeUsers} Active (${stats.totalUsers > 0 ? ((stats.activeUsers/stats.totalUsers)*100).toFixed(1) : 0}%)</small>
                                </div>
                                <div class="summary-item">
                                    <strong>Total Alerts</strong>
                                    <div class="value">${stats.totalAlerts}</div>
                                    <small>${stats.activeAlerts} Currently Active</small>
                                </div>
                                <div class="summary-item">
                                    <strong>Total Incidents</strong>
                                    <div class="value">${stats.totalIncidents}</div>
                                    <small>${stats.pendingIncidents} Pending Response</small>
                                </div>
                                <div class="summary-item">
                                    <strong>Notification Deliveries</strong>
                                    <div class="value">${stats.totalDeliveries.toLocaleString()}</div>
                                    <small>${stats.deliverySuccessRate}% Success Rate</small>
                                </div>
                            </div>
                        </div>

                        <!-- User Breakdown by Type -->
                        ${(filters.accountType === 'all' || filters.accountType === 'citizen') ? `
                        <div class="section">
                            <div class="section-title">👥 CITIZEN ACCOUNTS (${filteredUsers.filter(u => u.user_type === 'citizen' || u.role === 'citizen').length})</div>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredUsers.filter(u => u.user_type === 'citizen' || u.role === 'citizen').slice(0, 50).map(user => `
                                        <tr>
                                            <td>${user.username || 'N/A'}</td>
                                            <td>${user.full_name || (user.first_name + ' ' + user.last_name) || 'N/A'}</td>
                                            <td>${user.email || 'Not provided'}</td>
                                            <td>${user.phone_number || user.phone || 'Not provided'}</td>
                                            <td>${user.location?.name || user.district || 'Not provided'}</td>
                                            <td>${user.is_active !== false ? 'ACTIVE' : 'INACTIVE'}</td>
                                            <td>${formatDate(user.created_at || user.date_joined)}</td>
                                        </tr>
                                    `).join('')}
                                    ${filteredUsers.filter(u => u.user_type === 'citizen' || u.role === 'citizen').length > 50 ? 
                                        `<tr><td colspan="7" style="text-align: center; font-style: italic;">... and ${filteredUsers.filter(u => u.user_type === 'citizen' || u.role === 'citizen').length - 50} more citizens</td></tr>` 
                                        : ''
                                    }
                                    ${filteredUsers.filter(u => u.user_type === 'citizen' || u.role === 'citizen').length === 0 ? 
                                        `<tr><td colspan="7" style="text-align: center; font-style: italic;">No citizen accounts found</td></tr>` 
                                        : ''
                                    }
                                </tbody>
                            </table>
                        </div>
                        ` : ''}

                        ${(filters.accountType === 'all' || filters.accountType === 'operator') ? `
                        <div class="section">
                            <div class="section-title">⚡ OPERATOR ACCOUNTS (${filteredUsers.filter(u => u.user_type === 'operator' || u.role === 'operator').length})</div>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredUsers.filter(u => u.user_type === 'operator' || u.role === 'operator').slice(0, 50).map(user => `
                                        <tr>
                                            <td>${user.username || 'N/A'}</td>
                                            <td>${user.full_name || (user.first_name + ' ' + user.last_name) || 'N/A'}</td>
                                            <td>${user.email || 'Not provided'}</td>
                                            <td>${user.phone_number || user.phone || 'Not provided'}</td>
                                            <td>${user.location?.name || user.district || 'Not provided'}</td>
                                            <td>${user.is_active !== false ? 'ACTIVE' : 'INACTIVE'}</td>
                                            <td>${formatDate(user.created_at || user.date_joined)}</td>
                                        </tr>
                                    `).join('')}
                                    ${filteredUsers.filter(u => u.user_type === 'operator' || u.role === 'operator').length === 0 ? 
                                        `<tr><td colspan="7" style="text-align: center; font-style: italic;">No operator accounts found</td></tr>` 
                                        : ''
                                    }
                                </tbody>
                            </table>
                        </div>
                        ` : ''}

                        <!-- Alert Analytics -->
                        ${filters.accountType === 'all' ? `
                        <div class="section">
                            <div class="section-title">🚨 ALERT ANALYTICS</div>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Alert Title</th>
                                        <th>Disaster Type</th>
                                        <th>Severity</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Target Users</th>
                                        <th>Created Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredAlerts.slice(0, 30).map(alert => `
                                        <tr>
                                            <td>${alert.title || 'N/A'}</td>
                                            <td>${alert.disaster_type?.name || 'N/A'}</td>
                                            <td><span class="badge badge-${alert.severity}">${(alert.severity || 'medium').toUpperCase()}</span></td>
                                            <td>${alert.location?.name || 'N/A'}</td>
                                            <td>${(alert.status || 'active').toUpperCase()}</td>
                                            <td>${alert.total_target_users || 0}</td>
                                            <td>${formatDate(alert.created_at)}</td>
                                        </tr>
                                    `).join('')}
                                    ${filteredAlerts.length > 30 ? 
                                        `<tr><td colspan="7" style="text-align: center; font-style: italic;">... and ${filteredAlerts.length - 30} more alerts</td></tr>` 
                                        : ''
                                    }
                                </tbody>
                            </table>
                        </div>

                        <!-- Incident Analytics -->
                        <div class="section">
                            <div class="section-title">📍 INCIDENT ANALYTICS</div>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Incident Title</th>
                                        <th>Disaster Type</th>
                                        <th>Priority</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Reported By</th>
                                        <th>Created Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredIncidents.slice(0, 30).map(incident => `
                                        <tr>
                                            <td>${incident.title || incident.description?.substring(0, 50) || 'N/A'}</td>
                                            <td>${incident.disaster_type?.name || 'N/A'}</td>
                                            <td><span class="badge badge-${incident.priority}">${(incident.priority || 'medium').toUpperCase()}</span></td>
                                            <td>${incident.location?.name || 'N/A'}</td>
                                            <td>${(incident.status || 'pending').toUpperCase()}</td>
                                            <td>${incident.reported_by?.username || 'Anonymous'}</td>
                                            <td>${formatDate(incident.created_at)}</td>
                                        </tr>
                                    `).join('')}
                                    ${filteredIncidents.length > 30 ? 
                                        `<tr><td colspan="7" style="text-align: center; font-style: italic;">... and ${filteredIncidents.length - 30} more incidents</td></tr>` 
                                        : ''
                                    }
                                </tbody>
                            </table>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                        <p style="text-align: center; margin-bottom: 20px; font-size: 12px;">
                            This report is confidential and intended for administrative use only.
                        </p>
                        <div class="signature-section">
                            <div class="signature-box">
                                <div class="signature-line"></div>
                                <div class="signature-label">System Administrator</div>
                                <div style="font-size: 11px; margin-top: 10px;">
                                    Date: ${formatDate(new Date())}
                                </div>
                            </div>
                            <div class="signature-box">
                                <div class="signature-line"></div>
                                <div class="signature-label">Emergency Coordinator</div>
                                <div style="font-size: 11px; margin-top: 10px;">
                                    Date: _________________
                                </div>
                            </div>
                        </div>
                        <p style="text-align: center; margin-top: 30px; font-size: 11px; color: #666;">
                            Disaster Management & Emergency Response System<br/>
                            © ${new Date().getFullYear()} All Rights Reserved
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(reportHTML);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center space-y-4">
                    <Loader className="w-12 h-12 animate-spin text-red-600" />
                    <span className="text-gray-600 text-lg font-semibold">Loading system data...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchAllData}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Again</span>
                    </button>
                </div>
            </div>
        );
    }

    const stats = calculateStats();

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white text-gray-800 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col items-center justify-center gap-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-900/10 p-3 rounded-xl mb-3">
                                <Database className="w-8 h-8 text-red-900" />
                            </div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide">
                                Disaster Management System Report
                            </h1>
                            <p className="text-gray-500 text-base mt-1">
                                Comprehensive Emergency Response Analytics & Management Dashboard
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={generatePDFReport}
                                className="bg-red-900 text-white hover:bg-red-950 px-6 py-2.5 rounded-lg font-medium shadow-md transition-all flex items-center space-x-2"
                            >
                                <Download className="w-5 h-5" />
                                <span>Download PDF Report</span>
                            </button>
                            <button
                                onClick={fetchAllData}
                                disabled={loading}
                                className="bg-red-900 text-white hover:bg-red-950 px-6 py-2.5 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 flex items-center space-x-2"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                <span>Refresh Data</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Filters Section */}
                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 mb-8 shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 uppercase flex items-center">
                            <Filter className="w-5 h-5 mr-2 text-red-600" />
                            Report Filters & Sorting
                        </h3>
                        {(filters.dateInterval !== 'all' || filters.accountType !== 'all' || filters.severity !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 border-2 border-gray-400 font-semibold rounded-lg flex items-center space-x-2"
                            >
                                <X className="w-4 h-4" />
                                <span>Clear Filters</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                                Account Type
                            </label>
                            <select
                                value={filters.accountType}
                                onChange={(e) => setFilters(prev => ({ ...prev, accountType: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                            >
                                {accountTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                                Severity Level
                            </label>
                            <select
                                value={filters.severity}
                                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                            >
                                {severityLevels.map(level => (
                                    <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                                Date Range
                            </label>
                            <select
                                value={filters.dateInterval}
                                onChange={(e) => handleDateIntervalChange(e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                            >
                                {dateIntervals.map(interval => (
                                    <option key={interval.value} value={interval.value}>{interval.label}</option>
                                ))}
                            </select>
                        </div>

                        {filters.dateInterval === 'custom' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
                                Sort By
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 font-medium"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-8 mb-8 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 uppercase flex items-center">
                            <Shield className="w-6 h-6 mr-3 text-red-600" />
                            Executive Summary
                        </h2>
                        <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-300">
                            {formatDateTime(new Date())}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <Users className="w-8 h-8 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                    USERS
                                </span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalUsers}</div>
                            <div className="text-sm text-gray-600">Total Users</div>
                            <div className="text-xs text-green-600 font-semibold mt-2">
                                {stats.activeUsers} Active
                            </div>
                        </div>

                        <div className="bg-white border-2 border-red-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <Bell className="w-8 h-8 text-red-600" />
                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                    ALERTS
                                </span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalAlerts}</div>
                            <div className="text-sm text-gray-600">Total Alerts</div>
                            <div className="text-xs text-red-600 font-semibold mt-2">
                                {stats.activeAlerts} Active
                            </div>
                        </div>

                        <div className="bg-white border-2 border-orange-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <AlertTriangle className="w-8 h-8 text-orange-600" />
                                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                    INCIDENTS
                                </span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalIncidents}</div>
                            <div className="text-sm text-gray-600">Total Incidents</div>
                            <div className="text-xs text-orange-600 font-semibold mt-2">
                                {stats.pendingIncidents} Pending
                            </div>
                        </div>

                        <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <MessageSquare className="w-8 h-8 text-green-600" />
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    DELIVERIES
                                </span>
                            </div>
                            <div className="text-4xl font-bold text-gray-900 mb-2">{stats.totalDeliveries.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Notifications Sent</div>
                            <div className="text-xs text-green-600 font-semibold mt-2">
                                {stats.deliverySuccessRate}% Success
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Statistics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* User Analytics */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-blue-600" />
                            User Analytics
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Citizens</span>
                                <span className="text-lg font-bold text-blue-600">{stats.citizenUsers}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Operators</span>
                                <span className="text-lg font-bold text-purple-600">{stats.operatorUsers}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Authorities</span>
                                <span className="text-lg font-bold text-green-600">{stats.authorityUsers}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Administrators</span>
                                <span className="text-lg font-bold text-red-600">{stats.adminUsers}</span>
                            </div>
                        </div>
                    </div>

                    {/* Alert Analytics */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Bell className="w-5 h-5 mr-2 text-red-600" />
                            Alert Analytics
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Total Alerts</span>
                                <span className="text-lg font-bold text-red-600">{stats.totalAlerts}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Active Alerts</span>
                                <span className="text-lg font-bold text-orange-600">{stats.activeAlerts}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Critical Alerts</span>
                                <span className="text-lg font-bold text-red-700">{stats.criticalAlerts}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Resolved Alerts</span>
                                <span className="text-lg font-bold text-green-600">{stats.resolvedAlerts}</span>
                            </div>
                        </div>
                    </div>

                    {/* Incident Analytics */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                            Incident Analytics
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Total Incidents</span>
                                <span className="text-lg font-bold text-orange-600">{stats.totalIncidents}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Pending</span>
                                <span className="text-lg font-bold text-yellow-600">{stats.pendingIncidents}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">In Progress</span>
                                <span className="text-lg font-bold text-blue-600">{stats.inProgressIncidents}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Resolved</span>
                                <span className="text-lg font-bold text-green-600">{stats.resolvedIncidents}</span>
                            </div>
                        </div>
                    </div>

                    {/* System Resources */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Database className="w-5 h-5 mr-2 text-purple-600" />
                            System Resources
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Locations</span>
                                <span className="text-lg font-bold text-purple-600">{stats.totalLocations}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Disaster Types</span>
                                <span className="text-lg font-bold text-indigo-600">{stats.totalDisasterTypes}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Emergency Contacts</span>
                                <span className="text-lg font-bold text-blue-600">{stats.totalEmergencyContacts}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Safety Guides</span>
                                <span className="text-lg font-bold text-green-600">{stats.totalSafetyGuides}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Growth Trends */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-3 text-red-600" />
                        Monthly Growth Trends
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-blue-200 rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.newUsersThisMonth}</div>
                            <div className="text-sm font-semibold text-gray-700 uppercase">New Users</div>
                        </div>
                        <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold text-red-600 mb-2">{stats.newAlertsThisMonth}</div>
                            <div className="text-sm font-semibold text-gray-700 uppercase">New Alerts</div>
                        </div>
                        <div className="bg-white border border-orange-200 rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.newIncidentsThisMonth}</div>
                            <div className="text-sm font-semibold text-gray-700 uppercase">New Incidents</div>
                        </div>
                    </div>
                </div>

                {/* System Health Indicators */}
                <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-green-600" />
                        System Health Indicators
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                {stats.totalUsers > 0 ? ((stats.activeUsers/stats.totalUsers)*100).toFixed(1) : 0}%
                            </div>
                            <div className="text-sm font-semibold text-gray-700">Active Users Rate</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                            <div className="text-4xl font-bold text-green-600 mb-2">{stats.systemResponseRate}%</div>
                            <div className="text-sm font-semibold text-gray-700">Incident Response Rate</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                            <div className="text-4xl font-bold text-red-600 mb-2">{stats.alertResolutionRate}%</div>
                            <div className="text-sm font-semibold text-gray-700">Alert Resolution Rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisasterManagementReport;