import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Helper function to construct media URLs
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  
  // If it's already a full URL, return as is
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  
  // If it's a relative path, construct the full URL
  // Adjust this base URL to match your backend server
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
  
  return `${baseUrl}/${cleanPath}`;
};

const IncidentDetailPage = ({ citizenView = false }) => {
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const STATUS_COLORS = {
    'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
    'under_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'verified': 'bg-green-100 text-green-800 border-green-200',
    'resolved': 'bg-gray-100 text-gray-800 border-gray-200',
    'dismissed': 'bg-red-100 text-red-800 border-red-200'
  };

  const PRIORITY_COLORS = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-blue-500',
    5: 'bg-gray-500'
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
    console.log('IncidentDetailPage mounted with:', { citizenView, id, user: user?.username });
    loadIncident();
  }, [id]);

  const loadIncident = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading incident with ID:', id);
      const response = await apiService.getIncident(id);
      console.log('Incident loaded:', response);
      
      // Handle both direct incident object and wrapped response
      const incidentData = response.data || response;
      
      // Validate that this user can view this incident
      if (citizenView && user?.user_type === 'citizen' && incidentData.reporter !== user.id) {
        setError('You can only view your own incident reports.');
        return;
      }
      
      setIncident(incidentData);
    } catch (err) {
      console.error('Load incident error:', err);
      setError(`Failed to load incident details: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (action) => {
    if (citizenView) {
      alert('Only administrators can update incident status.');
      return;
    }

    try {
      let response;
      switch (action) {
        case 'verify':
          if (incident.status !== 'submitted' && incident.status !== 'under_review') {
            alert('This incident cannot be verified in its current status.');
            return;
          }
          response = await apiService.verifyIncident(id);
          break;
        case 'resolve':
          if (incident.status !== 'verified' && incident.status !== 'under_review') {
            alert('This incident cannot be resolved in its current status.');
            return;
          }
          const notes = prompt('Resolution notes:');
          if (notes === null) return; // User cancelled
          response = await apiService.resolveIncident(id, notes);
          break;
        default:
          return;
      }
      
      console.log('Status update response:', response);
      const updatedIncident = response.data || response;
      setIncident(prev => ({ ...prev, ...updatedIncident }));
    } catch (err) {
      console.error('Status update error:', err);
      alert(`Failed to update incident status: ${err.message || 'Unknown error'}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGoogleMapsLink = (lat, lng) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  };

  const getBackPath = () => {
    return citizenView ? '/incidents/citizen/my-reports' : '/incidents/admin/list';
  };

  const getEditPath = () => {
    return citizenView ? `/incidents/citizen/${id}/edit` : `/incidents/admin/${id}/edit`;
  };

  const canEdit = () => {
    if (citizenView) {
      return incident.status === 'submitted' && incident.reporter === user?.id;
    }
    return ['admin', 'operator', 'authority'].includes(user?.user_type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Incident</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Incident Not Found</h2>
          <p className="text-gray-600 mb-4">The incident you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const ReportTypeIcon = REPORT_TYPE_ICONS[incident.report_type] || AlertTriangle;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link to={getBackPath()} className="hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  {citizenView ? 'My Reports' : 'All Incidents'}
                </Link>
                <span>/</span>
                <span className="text-gray-900">#{incident.id.slice(0, 8)}</span>
              </nav>
              <div className="flex items-center gap-4 mb-3">
                <ReportTypeIcon className="w-8 h-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${STATUS_COLORS[incident.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {incident.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500 capitalize flex items-center gap-1">
                      <ReportTypeIcon className="w-4 h-4" />
                      {incident.report_type}
                    </span>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[incident.priority] || 'bg-gray-300'} mr-2`}></div>
                      <span className="text-sm text-gray-600">Priority {incident.priority}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!citizenView && incident.status === 'submitted' && (
                <button
                  onClick={() => handleStatusUpdate('verify')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify
                </button>
              )}
              {!citizenView && incident.status === 'verified' && (
                <button
                  onClick={() => handleStatusUpdate('resolve')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve
                </button>
              )}
              {canEdit() && (
                <Link
                  to={getEditPath()}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{incident.description}</p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h2>
              <div className="space-y-4">
                {incident.location_name && (
                  <div className="flex items-start">
                    <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-900">Administrative Area</span>
                      <p className="text-gray-700">{incident.location_name}</p>
                    </div>
                  </div>
                )}
                
                {incident.address && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-900">Address Details</span>
                      <p className="text-gray-700">{incident.address}</p>
                    </div>
                  </div>
                )}
                
                {incident.latitude && incident.longitude && (
                  <div className="flex items-start">
                    <Navigation className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-900">GPS Coordinates</span>
                      <div className="space-y-2">
                        <p className="text-gray-900 font-mono text-sm">
                          {parseFloat(incident.latitude).toFixed(6)}, {parseFloat(incident.longitude).toFixed(6)}
                        </p>
                        <a
                          href={getGoogleMapsLink(incident.latitude, incident.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Impact Assessment */}
            {(incident.casualties || incident.property_damage || incident.immediate_needs) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Impact Assessment</h2>
                <div className="space-y-4">
                  {incident.casualties && (
                    <div className="flex items-start">
                      <Users className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <span className="font-medium text-gray-900">People Affected</span>
                        <p className="text-gray-700">{incident.casualties} people</p>
                      </div>
                    </div>
                  )}
                  {incident.property_damage && (
                    <div className="flex items-start">
                      <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <span className="font-medium text-gray-900">Property Damage</span>
                        <p className="text-gray-700 capitalize">{incident.property_damage.replace('_', ' ')}</p>
                      </div>
                    </div>
                  )}
                  {incident.immediate_needs && (
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <span className="font-medium text-gray-900">Immediate Needs</span>
                        <p className="text-gray-700">{incident.immediate_needs}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Media - Enhanced with proper URL handling */}
            {(incident.images?.length > 0 || incident.videos?.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Media Evidence</h2>
                
                {incident.images?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Images ({incident.images.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {incident.images.map((image, index) => {
                        const imageUrl = getMediaUrl(image);
                        
                        return (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Incident evidence ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() => window.open(imageUrl, '_blank')}
                              onLoad={(e) => {
                                console.log('Image loaded successfully:', imageUrl);
                              }}
                              onError={(e) => {
                                console.error('Image failed to load:', imageUrl);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-32 bg-gray-100 rounded-lg border items-center justify-center flex-col">
                              <span className="text-gray-500 text-sm mb-2">Image not available</span>
                              <span className="text-gray-400 text-xs break-all px-2 text-center">{imageUrl}</span>
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {incident.videos?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Videos ({incident.videos.length})</h3>
                    <div className="space-y-4">
                      {incident.videos.map((video, index) => {
                        const videoUrl = getMediaUrl(video);
                        
                        return (
                          <div key={index} className="relative">
                            <video
                              src={videoUrl}
                              controls
                              className="w-full max-w-md rounded-lg border"
                              preload="metadata"
                              onLoadedMetadata={() => {
                                console.log('Video loaded successfully:', videoUrl);
                              }}
                              onError={(e) => {
                                console.error('Video failed to load:', videoUrl);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                            <div className="hidden bg-gray-100 rounded-lg border p-4 text-center">
                              <span className="text-gray-500">Video not available</span>
                              <br />
                              <span className="text-gray-400 text-xs break-all">{videoUrl}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Debug section - remove this in production */}
                {import.meta.env.DEV && (
                  <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                    <details>
                      <summary className="cursor-pointer text-gray-600">Debug Media URLs</summary>
                      <div className="mt-2">
                        <p><strong>Images:</strong></p>
                        <ul className="ml-4">
                          {incident.images?.map((img, i) => (
                            <li key={i} className="break-all">
                              Original: {img} → Processed: {getMediaUrl(img)}
                            </li>
                          ))}
                        </ul>
                        <p><strong>Videos:</strong></p>
                        <ul className="ml-4">
                          {incident.videos?.map((vid, i) => (
                            <li key={i} className="break-all">
                              Original: {vid} → Processed: {getMediaUrl(vid)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* Resolution */}
            {incident.resolution_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-semibold text-green-900 mb-2">Resolution</h2>
                    <p className="text-green-800">{incident.resolution_notes}</p>
                    {incident.resolved_at && (
                      <p className="text-sm text-green-600 mt-2">
                        Resolved on {formatDate(incident.resolved_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">ID</dt>
                  <dd className="text-sm text-gray-900 font-mono break-all">{incident.id}</dd>
                </div>
                
                {!citizenView && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Reporter</dt>
                    <dd className="flex items-center text-sm text-gray-900">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      {incident.reporter_name}
                    </dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Report Type</dt>
                  <dd className="text-sm text-gray-900 capitalize flex items-center">
                    <ReportTypeIcon className="w-4 h-4 text-gray-400 mr-2" />
                    {incident.report_type}
                  </dd>
                </div>

                {incident.disaster_type_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Disaster Type</dt>
                    <dd className="text-sm text-gray-900">{incident.disaster_type_name}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Status</dt>
                  <dd>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[incident.status] || 'bg-gray-100 text-gray-800'}`}>
                      {incident.status.replace('_', ' ')}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Priority</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[incident.priority] || 'bg-gray-300'} mr-2`}></div>
                    Priority {incident.priority}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    {formatDate(incident.created_at)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Last Updated</dt>
                  <dd className="flex items-center text-sm text-gray-900">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    {formatDate(incident.updated_at)}
                  </dd>
                </div>

                {!citizenView && incident.assigned_to_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Assigned To</dt>
                    <dd className="flex items-center text-sm text-gray-900">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      {incident.assigned_to_name}
                    </dd>
                  </div>
                )}

                {!citizenView && incident.verified_by_name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Verified By</dt>
                    <dd className="flex items-center text-sm text-gray-900">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {incident.verified_by_name}
                    </dd>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {canEdit() && (
                  <Link
                    to={getEditPath()}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Incident
                  </Link>
                )}
                
                {!citizenView && incident.status === 'submitted' && (
                  <button
                    onClick={() => handleStatusUpdate('verify')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Verified
                  </button>
                )}
                
                {!citizenView && incident.status === 'verified' && (
                  <button
                    onClick={() => handleStatusUpdate('resolve')}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Resolved
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Print Report
                </button>

                {incident.latitude && incident.longitude && (
                  <a
                    href={getGoogleMapsLink(incident.latitude, incident.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Maps
                  </a>
                )}
              </div>
            </div>

            {/* Emergency Contacts - Show for citizens */}
            {citizenView && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Emergency Contacts</h3>
                    <div className="space-y-2 text-sm text-red-800">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium">Police: <a href="tel:912" className="text-base underline">912</a></p>
                          <p>Medical: <a href="tel:114" className="underline">114</a></p>
                        </div>
                        <div>
                          <p>Fire: <a href="tel:113" className="underline">113</a></p>
                          <p>SMS: <a href="sms:3030" className="underline">3030</a></p>
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
    </div>
  );
};

export default IncidentDetailPage;