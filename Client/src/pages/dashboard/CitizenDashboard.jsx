// pages/dashboard/CitizenDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, Bell, Shield, MapPin, Phone, FileText, 
  CheckCircle, Clock, Navigation, Heart, Thermometer,
  Cloud, Users, Plus, Eye, RefreshCw, Radio, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [currentAlerts, setCurrentAlerts] = useState([]);
  const [myIncidents, setMyIncidents] = useState([]);
  const [nearbyShelters, setNearbyShelters] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 2 minutes for citizen alerts
    const interval = setInterval(() => {
      loadDashboardData();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentAlerts([
        {
          id: 1,
          title_en: "Heavy Rainfall Warning",
          title_rw: "Icyuho cyo Imvura Nyinshi",
          message_en: "Expected heavy rainfall in your area. Stay indoors and avoid low-lying areas.",
          message_rw: "Imvura nyinshi iteganywa mu karere kanyu. Mugume mu nzu kandi mwirinde ahantu hasi.",
          severity: "warning",
          type: "storm",
          effective_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title_en: "COVID-19 Health Advisory",
          title_rw: "Inama y'Ubuzima ya COVID-19",
          message_en: "Continue following health protocols. Vaccination available at health centers.",
          message_rw: "Komeza gukurikiza amabwiriza y'ubuzima. Urukingo ruraboneka mu bigo by'ubuzima.",
          severity: "info",
          type: "epidemic",
          effective_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ]);

      setMyIncidents([
        {
          id: 1,
          title: "Flooding on Nyabarongo Road",
          description: "Road flooded near market area",
          status: "triaged",
          incident_type: "report",
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);

      setNearbyShelters([
        {
          id: 1,
          name: "Gasabo Emergency Center",
          address: "KG 15 Ave, Gasabo",
          capacity: 500,
          occupancy: 45,
          distance: "2.3 km"
        },
        {
          id: 2,
          name: "Kimisagara Community Hall",
          address: "Kimisagara Sector",
          capacity: 300,
          occupancy: 12,
          distance: "4.1 km"
        }
      ]);

      setWeatherData({
        temperature: 22,
        humidity: 78,
        conditions: "Partly cloudy with chance of rain",
        windSpeed: 15,
        uvIndex: 6,
        alerts: 1
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'watch':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'triaged':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / 3600000);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.first_name}
          </h1>
          <p className="text-gray-600 mt-1">
            Stay informed about emergencies in {user?.district} District
          </p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <button
              onClick={loadDashboardData}
              className="ml-3 text-blue-600 hover:text-blue-700"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/citizen/incidents/new"
          className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg transition-colors group"
        >
          <div className="flex items-center">
            <Plus className="w-8 h-8 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-semibold">Report Emergency</h3>
              <p className="text-sm opacity-90">Submit incident report</p>
            </div>
          </div>
        </Link>

        <Link
          to="/citizen/safety/checkin"
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors group"
        >
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-semibold">Safety Check-in</h3>
              <p className="text-sm opacity-90">Confirm you're safe</p>
            </div>
          </div>
        </Link>

        <Link
          to="/citizen/shelters"
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors group"
        >
          <div className="flex items-center">
            <Shield className="w-8 h-8 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-semibold">Find Shelter</h3>
              <p className="text-sm opacity-90">Locate safe areas</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Current Alerts */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-red-600" />
              Active Alerts for Your Area
            </h2>
            {currentAlerts.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {currentAlerts.length} Active
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {currentAlerts.length > 0 ? (
            currentAlerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.severity === 'emergency' ? 'text-red-600' :
                        alert.severity === 'warning' ? 'text-orange-600' :
                        alert.severity === 'watch' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <h3 className="font-medium text-gray-900">
                        {user?.preferred_language === 'rw' ? alert.title_rw : alert.title_en}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">
                      {user?.preferred_language === 'rw' ? alert.message_rw : alert.message_en}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span>Type: {alert.type}</span>
                      <span>Issued: {formatTimeAgo(alert.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Alerts</h3>
              <p className="mt-1 text-sm text-gray-500">
                All clear in your area. Stay vigilant and prepared.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Information */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Cloud className="w-5 h-5 mr-2 text-blue-600" />
              Weather Conditions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <Thermometer className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{weatherData.temperature}°C</p>
                <p className="text-sm text-gray-600">Temperature</p>
              </div>
              <div className="text-center">
                <Cloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{weatherData.humidity}%</p>
                <p className="text-sm text-gray-600">Humidity</p>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Conditions:</strong> {weatherData.conditions}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Wind: {weatherData.windSpeed} km/h | UV Index: {weatherData.uvIndex}
              </p>
            </div>
          </div>
        </div>

        {/* My Incidents */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                My Reports
              </h2>
              <Link
                to="/citizen/incidents"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {myIncidents.length > 0 ? (
              myIncidents.map((incident) => (
                <div key={incident.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{incident.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <span className="capitalize">{incident.incident_type}</span>
                        <span>Reported: {formatTimeAgo(incident.created_at)}</span>
                      </div>
                    </div>
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Reports</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't submitted any incident reports yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nearby Shelters */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Nearby Emergency Shelters
            </h2>
            <Link
              to="/citizen/shelters"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {nearbyShelters.map((shelter) => (
            <div key={shelter.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{shelter.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {shelter.address}
                  </p>
                </div>
                <span className="text-sm text-blue-600 font-medium">{shelter.distance}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{shelter.occupancy}/{shelter.capacity}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    shelter.occupancy / shelter.capacity < 0.7 ? 'text-green-600' :
                    shelter.occupancy / shelter.capacity < 0.9 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round((1 - shelter.occupancy / shelter.capacity) * 100)}% Available
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Phone className="w-5 h-5 mr-2 text-red-600" />
          Emergency Contacts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-red-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Phone className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-medium text-gray-900">Emergency Services</h3>
            <p className="text-2xl font-bold text-red-600 mt-1">112</p>
            <p className="text-xs text-gray-600">Police, Fire, Medical</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">MINEMA Operations</h3>
            <p className="text-lg font-bold text-blue-600 mt-1">+250-788-000-000</p>
            <p className="text-xs text-gray-600">Disaster Management</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-green-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900">Health Emergency</h3>
            <p className="text-lg font-bold text-green-600 mt-1">+250-788-111-222</p>
            <p className="text-xs text-gray-600">Medical Emergency</p>
          </div>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-600" />
          Emergency Preparedness Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Before Emergency:</h3>
            <ul className="space-y-1 text-blue-800">
              <li>• Keep emergency kit ready (water, food, medicine)</li>
              <li>• Know evacuation routes from your area</li>
              <li>• Register for alert notifications</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">During Emergency:</h3>
            <ul className="space-y-1 text-blue-800">
              <li>• Follow official instructions immediately</li>
              <li>• Stay calm and help others if safe to do so</li>
              <li>• Report incidents through this app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;