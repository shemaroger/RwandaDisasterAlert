import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    User, MapPin, Bell, FileText, Calendar, Download, Loader,
    AlertTriangle, CheckCircle, Clock, Heart, Shield, Activity,
    TrendingUp, Eye, Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const CitizenReportPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [myIncidents, setMyIncidents] = useState([]);
    const [myAlertResponses, setMyAlertResponses] = useState([]);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Date filter states
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: ''
    });

    // Check if user is a citizen
    const isCitizen = user?.user_type === 'citizen';

    useEffect(() => {
        if (!isCitizen) {
            toast.error('This page is only accessible to citizens.');
            navigate('/dashboard');
            return;
        }
        fetchCitizenData();
    }, [isCitizen, navigate]);

    const fetchCitizenData = async () => {
        setLoading(true);
        try {
            const [incidentsRes, alertsRes, responsesRes] = await Promise.all([
                apiService.getMyIncidentReports(),
                apiService.getActiveAlerts(),
                apiService.getMyAlertResponses()
            ]);

            setMyIncidents(incidentsRes || []);
            setActiveAlerts(alertsRes.results || alertsRes || []);
            setMyAlertResponses(responsesRes || []);
        } catch (error) {
            console.error('Error fetching citizen data:', error);
            toast.error('Error loading your report data');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        return {
            totalIncidents: myIncidents.length,
            pendingIncidents: myIncidents.filter(i => i.status === 'pending').length,
            resolvedIncidents: myIncidents.filter(i => i.status === 'resolved').length,
            activeAlertsCount: activeAlerts.length,
            respondedAlerts: myAlertResponses.length,
            safeResponses: myAlertResponses.filter(r => r.status === 'safe').length,
        };
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

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'resolved': 'bg-green-100 text-green-800 border-green-300',
            'in_progress': 'bg-blue-100 text-blue-800 border-blue-300',
            'verified': 'bg-purple-100 text-purple-800 border-purple-300'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getSeverityColor = (severity) => {
        const colors = {
            'critical': 'bg-red-100 text-red-800',
            'high': 'bg-orange-100 text-orange-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'low': 'bg-blue-100 text-blue-800'
        };
        return colors[severity] || 'bg-gray-100 text-gray-800';
    };

    const generatePDFReport = () => {
        const stats = calculateStats();
        
        const printWindow = window.open('', '_blank');
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>My MINEMA Citizen Report</title>
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
                        max-width: 1000px;
                        margin: 0 auto;
                        background: white;
                        border: 2px solid #000;
                    }
                    .header {
                        background: #2563eb;
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-bottom: 2px solid #000;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .header p {
                        margin: 5px 0;
                        font-size: 14px;
                    }
                    .content {
                        padding: 20px;
                    }
                    .citizen-info {
                        background: #f0f9ff;
                        border: 2px solid #2563eb;
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 20px 0 10px 0;
                        padding-bottom: 5px;
                        border-bottom: 2px solid #2563eb;
                        text-transform: uppercase;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
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
                        color: #2563eb;
                    }
                    .stat-label {
                        font-size: 11px;
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
                        padding: 8px;
                        text-align: left;
                        font-size: 11px;
                    }
                    .table th {
                        background: #2563eb;
                        color: white;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .table tr:nth-child(even) {
                        background: #f9f9f9;
                    }
                    .footer {
                        margin-top: 30px;
                        padding: 20px;
                        background: #f5f5f5;
                        border-top: 2px solid #000;
                        text-align: center;
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
                        <h1>MINEMA Citizen Activity Report</h1>
                        <p>Rwanda Emergency Management</p>
                        <p>Generated on ${new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                    
                    <div class="content">
                        <div class="citizen-info">
                            <h3 style="margin: 0 0 10px 0;">Citizen Information</h3>
                            <p><strong>Name:</strong> ${user?.first_name} ${user?.last_name}</p>
                            <p><strong>Email:</strong> ${user?.email}</p>
                            <p><strong>Phone:</strong> ${user?.phone_number || 'N/A'}</p>
                            <p><strong>District:</strong> ${user?.district || 'N/A'}</p>
                        </div>

                        <h2 class="section-title">Activity Summary</h2>
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-value">${stats.totalIncidents}</div>
                                <div class="stat-label">Incidents Reported</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${stats.respondedAlerts}</div>
                                <div class="stat-label">Alerts Responded</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${stats.activeAlertsCount}</div>
                                <div class="stat-label">Active Alerts</div>
                            </div>
                        </div>

                        <h2 class="section-title">My Incident Reports</h2>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Date Reported</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${myIncidents.length === 0 ? 
                                    '<tr><td colspan="4" style="text-align: center;">No incidents reported</td></tr>' :
                                    myIncidents.map(incident => `
                                        <tr>
                                            <td>${incident.title || 'Untitled'}</td>
                                            <td>${incident.disaster_type_name || 'N/A'}</td>
                                            <td>${(incident.status || 'pending').toUpperCase()}</td>
                                            <td>${formatDate(incident.created_at)}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>

                        <h2 class="section-title">Alert Responses</h2>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Alert</th>
                                    <th>Your Status</th>
                                    <th>Response Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${myAlertResponses.length === 0 ? 
                                    '<tr><td colspan="3" style="text-align: center;">No alert responses</td></tr>' :
                                    myAlertResponses.map(response => `
                                        <tr>
                                            <td>${response.alert_title || 'N/A'}</td>
                                            <td>${(response.status || 'unknown').toUpperCase()}</td>
                                            <td>${formatDate(response.created_at)}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>

                    <div class="footer">
                        <p><strong>MINEMA - Ministry in Charge of Emergency Management</strong></p>
                        <p style="font-size: 12px; margin-top: 10px;">
                            For emergency assistance, call <strong>112</strong> or contact your local authorities
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(reportHTML);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    const stats = calculateStats();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading your report...</span>
                </div>
            </div>
        );
    }

    if (!isCitizen) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        This page is only accessible to citizens.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    My MINEMA Report
                                </h1>
                                <p className="text-blue-100 text-sm">Your emergency activity summary</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={generatePDFReport}
                                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 flex items-center space-x-2 shadow-lg"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button
                                onClick={fetchCitizenData}
                                className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Citizen Info Card */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-600" />
                        Your Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-semibold text-gray-900">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-semibold text-gray-900">{user?.phone_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">District</p>
                            <p className="font-semibold text-gray-900 flex items-center">
                                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                {user?.district || 'Not set'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">My Incidents</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalIncidents}</p>
                            </div>
                            <FileText className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Alert Responses</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.respondedAlerts}</p>
                            </div>
                            <Bell className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-orange-500 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase">Active Alerts</p>
                                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.activeAlertsCount}</p>
                            </div>
                            <AlertTriangle className="w-12 h-12 text-orange-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Incident Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-md p-6 border border-yellow-200">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-yellow-600">{stats.pendingIncidents}</p>
                            <p className="text-sm font-bold text-yellow-900 uppercase mt-2">Pending</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200">
                        <div className="text-center">
                            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-green-600">{stats.resolvedIncidents}</p>
                            <p className="text-sm font-bold text-green-900 uppercase mt-2">Resolved</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
                        <div className="text-center">
                            <Heart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-blue-600">{stats.safeResponses}</p>
                            <p className="text-sm font-bold text-blue-900 uppercase mt-2">Safe Status</p>
                        </div>
                    </div>
                </div>

                {/* My Incidents Table */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                            My Incident Reports
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{myIncidents.length} reports submitted</p>
                    </div>
                    <div className="p-6">
                        {myIncidents.length === 0 ? (
                            <div className="text-center py-12">
                                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No Incidents Reported</h3>
                                <p className="text-gray-600 mb-4">You haven't reported any incidents yet.</p>
                                <button
                                    onClick={() => navigate('/incidents/citizen/reports')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                                >
                                    Report an Incident
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {myIncidents.map((incident, index) => (
                                            <tr key={incident.id || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                    {incident.title || 'Untitled'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {incident.disaster_type_name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(incident.status)}`}>
                                                        {(incident.status || 'pending').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(incident.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => navigate(`/incidents/citizen/${incident.id}/view`)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        <Eye className="w-4 h-4 inline mr-1" />
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

                {/* Active Alerts */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                            Active Emergency Alerts
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{activeAlerts.length} active alerts in your area</p>
                    </div>
                    <div className="p-6">
                        {activeAlerts.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Alerts</h3>
                                <p className="text-gray-600">There are currently no active emergency alerts in your area.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeAlerts.map((alert, index) => (
                                    <div key={alert.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                                                        {(alert.severity || 'medium').toUpperCase()}
                                                    </span>
                                                    <span className="text-sm text-gray-600 flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1" />
                                                        {formatDate(alert.created_at)}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 mb-2">{alert.title}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    {alert.district || 'Multiple Districts'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CitizenReportPage;