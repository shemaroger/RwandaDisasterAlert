// src/pages/admin/LocationManagement.jsx (or .tsx)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MapPin, Plus, Search, Filter, Download, RefreshCw, Edit, Trash2, Eye,
  ChevronDown, ChevronUp, X, Save, AlertTriangle, Clock,
  Map as MapIcon, Globe, Users, TreePine, Building2, Home,
  ChevronRight, Layers, Target, Navigation
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

// NOTE: Do NOT import Leaflet CSS here to avoid Vite path issues.
// Load it once in src/main.jsx:   import 'leaflet/dist/leaflet.css'

// Map libs
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/* ===================== MapCoordinatePicker ===================== */
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

function ClickHandler({ onPick, disabled }) {
  useMapEvents({
    click(e) {
      if (!disabled) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCoordinatePicker({
  value,
  onChange,
  height = 320,
  defaultCenter = { lat: -1.9441, lng: 30.0619 }, // Kigali
  defaultZoom = 7,
  readOnly = false,
}) {
  const hasPoint = typeof value?.lat === 'number' && typeof value?.lng === 'number';
  const center = hasPoint ? { lat: value.lat, lng: value.lng } : defaultCenter;

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={hasPoint ? 10 : defaultZoom}
        scrollWheelZoom
        style={{ height }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!readOnly && (
          <ClickHandler
            disabled={readOnly}
            onPick={(lat, lng) => onChange({ lat, lng })}
          />
        )}

        {hasPoint && (
          <Marker
            position={[value.lat, value.lng]}
            icon={markerIcon}
            draggable={!readOnly}
            eventHandlers={{
              dragend: (e) => {
                const m = e.target;
                const { lat, lng } = m.getLatLng();
                onChange({ lat, lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

/* ===================== Constants ===================== */
const LOCATION_TYPES = [
  { value: 'country', label: 'Country', icon: Globe, color: 'bg-purple-50 text-purple-700 border-purple-200', level: 0 },
  { value: 'province', label: 'Province', icon: MapIcon, color: 'bg-blue-50 text-blue-700 border-blue-200', level: 1 },
  { value: 'district', label: 'District', icon: Building2, color: 'bg-green-50 text-green-700 border-green-200', level: 2 },
  { value: 'sector', label: 'Sector', icon: Layers, color: 'bg-yellow-50 text-yellow-700 border-yellow-200', level: 3 },
  { value: 'cell', label: 'Cell', icon: Target, color: 'bg-orange-50 text-orange-700 border-orange-200', level: 4 },
  { value: 'village', label: 'Village', icon: Home, color: 'bg-red-50 text-red-700 border-red-200', level: 5 }
];

/* ===================== Utils ===================== */
const getLocationTypeConfig = (locationType) =>
  LOCATION_TYPES.find(t => t.value === locationType) || LOCATION_TYPES[0];

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCoordinates = (lat, lng) => {
  if (lat === '' || lng === '' || lat === null || lng === null || typeof lat === 'undefined' || typeof lng === 'undefined') return 'Not set';
  const nlat = Number(lat);
  const nlng = Number(lng);
  if (Number.isNaN(nlat) || Number.isNaN(nlng)) return 'Not set';
  return `${nlat.toFixed(4)}, ${nlng.toFixed(4)}`;
};

const formatPopulation = (population) => {
  if (!population && population !== 0) return 'Unknown';
  try { return Number(population).toLocaleString(); } catch { return String(population); }
};

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
};

/* ===================== Data Hook ===================== */
const useLocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [hierarchyData, setHierarchyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', location_type: '', parent: '', has_coordinates: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0, totalPages: 1 });
  const didInitRef = useRef(false); // avoid double fetch in React StrictMode

  const fetchLocations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
        page, page_size: pagination.pageSize
      };
      const response = await apiService.getLocations(params);
      if (response?.results) {
        setLocations(response.results);
        setPagination(prev => ({ ...prev, page, total: response.count, totalPages: Math.ceil(response.count / pagination.pageSize) }));
      } else if (Array.isArray(response)) {
        setLocations(response);
        setPagination(prev => ({ ...prev, page: 1, total: response.length, totalPages: 1 }));
      } else {
        setLocations([]);
        setPagination(prev => ({ ...prev, page: 1, total: 0, totalPages: 1 }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load locations');
      toast.error(`Failed to load locations: ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  const fetchHierarchy = useCallback(async () => {
    try {
      const response = await apiService.getLocationHierarchy();
      setHierarchyData(response?.hierarchy || []);
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    }
  }, []);

  const createLocation = useCallback(async (locationData) => {
    try {
      await apiService.createLocation(locationData);
      toast.success('Location created successfully');
      await fetchLocations(pagination.page);
      await fetchHierarchy();
      return { ok: true };
    } catch (err) {
      const msg = err?.message || 'Failed to create location';
      toast.error(`Failed to create location: ${msg}`);
      return { ok: false, error: msg };
    }
  }, [fetchLocations, fetchHierarchy, pagination.page]);

  const updateLocation = useCallback(async (locationId, updates) => {
    try {
      await apiService.updateLocation(locationId, updates);
      toast.success('Location updated successfully');
      await fetchLocations(pagination.page);
      await fetchHierarchy();
      return { ok: true };
    } catch (err) {
      const msg = err?.message || 'Failed to update location';
      toast.error(`Failed to update location: ${msg}`);
      return { ok: false, error: msg };
    }
  }, [fetchLocations, fetchHierarchy, pagination.page]);

  const deleteLocation = useCallback(async (locationId) => {
    try {
      await apiService.deleteLocation(locationId);
      toast.success('Location deleted successfully');
      await fetchLocations(pagination.page);
      await fetchHierarchy();
      return { ok: true };
    } catch (err) {
      const msg = err?.message || 'Failed to delete location';
      toast.error(`Failed to delete location: ${msg}`);
      return { ok: false, error: msg };
    }
  }, [fetchLocations, fetchHierarchy, pagination.page]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchLocations();
    fetchHierarchy();
  }, [fetchLocations, fetchHierarchy]);

  return { locations, hierarchyData, loading, error, filters, setFilters, pagination, setPagination, fetchLocations, createLocation, updateLocation, deleteLocation };
};

/* ===================== Presentational Components ===================== */
const StatsCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 bg-${color}-100 rounded-xl`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

const HierarchyNode = ({ location, level = 0, onEdit, onView, onAddChild }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const typeConfig = getLocationTypeConfig(location.location_type);
  const IconComponent = typeConfig.icon;
  const hasChildren = location.children && location.children.length > 0;

  return (
    <div className="space-y-2">
      <div className={`flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors ${level === 0 ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'}`} style={{ marginLeft: `${level * 20}px` }}>
        {hasChildren && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-gray-100 rounded" aria-label="Toggle children">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <div className={`p-2 rounded-lg ${typeConfig.color} border`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900">{location.name}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>{typeConfig.label}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            {location.population && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{formatPopulation(location.population)}</span>
              </div>
            )}
            {(location.center_lat !== null && location.center_lng !== null && location.center_lat !== '' && location.center_lng !== '') && (
              <div className="flex items-center space-x-1">
                <Navigation className="w-3 h-3" />
                <span>{formatCoordinates(location.center_lat, location.center_lng)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => onView(location)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => onEdit(location)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit Location">
            <Edit className="w-4 h-4" />
          </button>
          {level < 5 && (
            <button onClick={() => onAddChild(location)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Add Child Location">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="space-y-2">
          {location.children.map(child => (
            <HierarchyNode
              key={child.id}
              location={child}
              level={level + 1}
              onEdit={onEdit}
              onView={onView}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LocationCard = ({ location, onEdit, onView, onDelete, onAddChild }) => {
  const typeConfig = getLocationTypeConfig(location.location_type);
  const IconComponent = typeConfig.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${typeConfig.color} border`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
            {location.name_rw && location.name_rw !== location.name && (
              <p className="text-sm text-gray-600">Kinyarwanda: {location.name_rw}</p>
            )}
            {location.name_fr && location.name_fr !== location.name && (
              <p className="text-sm text-gray-600">Français: {location.name_fr}</p>
            )}
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${typeConfig.color}`}>{typeConfig.label}</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {location.parent_name && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>Parent: {location.parent_name}</span>
          </div>
        )}
        {location.population && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>Population: {formatPopulation(location.population)}</span>
          </div>
        )}
        {(location.center_lat !== '' && location.center_lng !== '' && location.center_lat !== null && location.center_lng !== null) && (
          <div className="flex items-center text-sm text-gray-600">
            <Navigation className="w-4 h-4 mr-2" />
            <span>Coordinates: {formatCoordinates(location.center_lat, location.center_lng)}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-2" />
          <span>Created: {formatDate(location.created_at)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button onClick={() => onView(location)} className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">View Details</button>
          <button onClick={() => onEdit(location)} className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium">Edit</button>
        </div>
        <div className="flex items-center space-x-2">
          {typeConfig.level < 5 && (
            <button onClick={() => onAddChild(location)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Add Child Location">
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => { if (window.confirm(`Delete "${location.name}"? This action cannot be undone.`)) onDelete(location.id); }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Location"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, onFilterChange, onClearFilters, showFilters, onToggleFilters, parentOptions }) => {
  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button onClick={onClearFilters} className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors">Clear All</button>
            )}
            <button onClick={onToggleFilters} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Toggle filters">
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      {showFilters && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Location name..."
                  value={filters.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
              <select
                value={filters.location_type}
                onChange={(e) => onFilterChange('location_type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
              >
                <option value="">All Types</option>
                {LOCATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Location</label>
              <select
                value={filters.parent}
                onChange={(e) => onFilterChange('parent', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
              >
                <option value="">All Parents</option>
                {parentOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name} ({option.location_type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Has Coordinates</label>
              <select
                value={filters.has_coordinates}
                onChange={(e) => onFilterChange('has_coordinates', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
              >
                <option value="">All Locations</option>
                <option value="true">With Coordinates</option>
                <option value="false">Without Coordinates</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===================== Modals ===================== */
const LocationModal = ({ isOpen, onClose, onSubmit, location, parentOptions, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '', name_rw: '', name_fr: '',
    location_type: 'district', parent: '',
    center_lat: '', center_lng: '',
    population: '', is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (location && mode === 'edit') {
      setFormData({
        name: location.name || '',
        name_rw: location.name_rw || '',
        name_fr: location.name_fr || '',
        location_type: location.location_type || 'district',
        parent: location.parent || '',
        center_lat: location.center_lat ?? '',
        center_lng: location.center_lng ?? '',
        population: location.population ?? '',
        is_active: location.is_active !== undefined ? location.is_active : true
      });
    } else if (location && mode === 'add_child') {
      const childType = LOCATION_TYPES.find(t => t.level === getLocationTypeConfig(location.location_type).level + 1);
      setFormData({
        name: '', name_rw: '', name_fr: '',
        location_type: childType ? childType.value : 'village',
        parent: location.id,
        center_lat: '', center_lng: '',
        population: '', is_active: true
      });
    } else {
      setFormData({
        name: '', name_rw: '', name_fr: '',
        location_type: 'district', parent: '',
        center_lat: '', center_lng: '',
        population: '', is_active: true
      });
    }
    setErrors({});
    setShowMap(false);
  }, [location, mode]);

  const setCoords = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      center_lat: typeof lat === 'number' ? Number(lat.toFixed(6)) : '',
      center_lng: typeof lng === 'number' ? Number(lng.toFixed(6)) : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: 'Location name is required' });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...formData,
        center_lat: formData.center_lat === '' ? null : Number(formData.center_lat),
        center_lng: formData.center_lng === '' ? null : Number(formData.center_lng),
        population: formData.population === '' ? null : Number(formData.population),
      };
      const result = await onSubmit(payload);
      const ok = result === true || result?.ok === true;
      if (ok) {
        onClose();
        setFormData({
          name: '', name_rw: '', name_fr: '',
          location_type: 'district', parent: '',
          center_lat: '', center_lng: '',
          population: '', is_active: true
        });
      } else {
        const msg = result?.error || 'Failed to save. Please fix the errors and try again.';
        setErrors(prev => ({ ...prev, form: msg }));
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setErrors(prev => ({ ...prev, form: err?.message || 'Unexpected error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = type === 'checkbox' ? checked : value;
    if (name === 'center_lat' || name === 'center_lng' || name === 'population') {
      v = v === '' ? '' : Number(v);
      if (Number.isNaN(v)) v = '';
    }
    setFormData(prev => ({ ...prev, [name]: v }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.form) setErrors(prev => ({ ...prev, form: '' }));
  };

  if (!isOpen) return null;

  const getModalTitle = () => mode === 'edit' ? 'Edit Location' : mode === 'add_child' ? `Add Child Location to ${location?.name}` : 'Create New Location';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{getModalTitle()}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.form && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {errors.form}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Name (English) *</label>
              <input
                type="text" name="name" value={formData.name} onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Enter location name" required
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name (Kinyarwanda)</label>
              <input type="text" name="name_rw" value={formData.name_rw} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Izina mu Kinyarwanda" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name (French)</label>
              <input type="text" name="name_fr" value={formData.name_fr} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Nom en français" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Type *</label>
              <select name="location_type" value={formData.location_type} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={mode === 'add_child'} required
              >
                {LOCATION_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parent Location</label>
              <select name="parent" value={formData.parent} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={mode === 'add_child'}
              >
                <option value="">No Parent (Top Level)</option>
                {parentOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name} ({option.location_type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="number" step="any" name="center_lat" value={formData.center_lat} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="-1.9441"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number" step="any" name="center_lng" value={formData.center_lng} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="30.0619"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button" onClick={() => setShowMap(s => !s)}
                className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {showMap ? 'Hide map selector' : 'Pick coordinates on map'}
              </button>
            </div>

            {showMap && (
              <div className="md:col-span-2">
                <MapCoordinatePicker
                  value={{
                    lat: typeof formData.center_lat === 'number' ? formData.center_lat : (formData.center_lat === '' ? undefined : Number(formData.center_lat)),
                    lng: typeof formData.center_lng === 'number' ? formData.center_lng : (formData.center_lng === '' ? undefined : Number(formData.center_lng)),
                  }}
                  onChange={({ lat, lng }) => setCoords(lat, lng)}
                  defaultCenter={{ lat: -1.95, lng: 30.06 }}
                  defaultZoom={8}
                />
                <p className="text-xs text-gray-500 mt-2">Click to drop a marker, or drag it to fine-tune. Fields update automatically.</p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Population</label>
              <input
                type="number" name="population" value={formData.population} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter population count"
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active Location</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'edit' ? 'Update Location' : 'Create Location'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewLocationModal = ({ isOpen, onClose, location }) => {
  if (!isOpen || !location) return null;
  const typeConfig = getLocationTypeConfig(location.location_type);
  const IconComponent = typeConfig.icon;

  const hasCoords =
    location.center_lat !== null && location.center_lng !== null &&
    location.center_lat !== '' && location.center_lng !== '' &&
    typeof location.center_lat !== 'undefined' && typeof location.center_lng !== 'undefined';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl ${typeConfig.color} border`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{location.name}</h2>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>{typeConfig.label}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">English Name</label>
                <p className="text-gray-900 mt-1">{location.name}</p>
              </div>
              {location.name_rw && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Kinyarwanda Name</label>
                  <p className="text-gray-900 mt-1">{location.name_rw}</p>
                </div>
              )}
              {location.name_fr && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">French Name</label>
                  <p className="text-gray-900 mt-1">{location.name_fr}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Location Type</label>
                <p className="text-gray-900 mt-1">{typeConfig.label}</p>
              </div>
              {location.parent_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Parent Location</label>
                  <p className="text-gray-900 mt-1">{location.parent_name}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hasCoords ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Latitude</label>
                    <p className="text-gray-900 mt-1">{Number(location.center_lat).toFixed(6)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Longitude</label>
                    <p className="text-gray-900 mt-1">{Number(location.center_lng).toFixed(6)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Map</label>
                    <MapCoordinatePicker
                      value={{ lat: Number(location.center_lat), lng: Number(location.center_lng) }}
                      onChange={() => {}}
                      readOnly
                      height={260}
                      defaultZoom={12}
                    />
                    <div className="mt-2">
                      <a
                        href={`https://maps.google.com/?q=${location.center_lat},${location.center_lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Coordinates</label>
                  <p className="text-gray-500 mt-1">No coordinates set</p>
                </div>
              )}
              {location.population && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Population</label>
                  <p className="text-gray-900 mt-1">{formatPopulation(location.population)}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${location.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {location.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-gray-900 mt-1">{formatDate(location.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Location ID</label>
                <p className="text-gray-900 mt-1 font-mono text-sm">{location.id}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Main Component ===================== */
const LocationManagement = () => {
  const {
    locations, hierarchyData, loading, error,
    filters, setFilters, pagination, setPagination,
    fetchLocations, createLocation, updateLocation, deleteLocation
  } = useLocationManagement();

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [viewMode, setViewMode] = useState('hierarchy');

  const debouncedSearch = useDebounce(filters.search, 300);
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch }));
    }
  }, [debouncedSearch, filters.search, setFilters]);

  const locationStats = useMemo(() => {
    const stats = { total: locations.length, withCoordinates: locations.filter(l => l.center_lat || l.center_lng).length, byType: {} };
    LOCATION_TYPES.forEach(type => { stats.byType[type.value] = locations.filter(l => l.location_type === type.value).length; });
    return stats;
  }, [locations]);

  const parentOptions = useMemo(() => {
    return locations
      .filter(loc => loc.location_type !== 'village')
      .sort((a, b) => {
        const aLevel = getLocationTypeConfig(a.location_type).level;
        const bLevel = getLocationTypeConfig(b.location_type).level;
        return aLevel - bLevel || a.name.localeCompare(b.name);
      });
  }, [locations]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [setFilters, setPagination]);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', location_type: '', parent: '', has_coordinates: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [setFilters, setPagination]);

  const handleLocationAction = useCallback(async (action, data) => {
    switch (action) {
      case 'create': return await createLocation(data);
      case 'update': return await updateLocation(selectedLocation.id, data);
      case 'delete': return await deleteLocation(data);
      default: return { ok: false, error: 'Unknown action' };
    }
  }, [createLocation, updateLocation, deleteLocation, selectedLocation]);

  const openCreateModal = () => { setSelectedLocation(null); setModalMode('create'); setShowCreateModal(true); };
  const openEditModal = (loc) => { setSelectedLocation(loc); setModalMode('edit'); setShowEditModal(true); };
  const openAddChildModal = (parentLoc) => { setSelectedLocation(parentLoc); setModalMode('add_child'); setShowCreateModal(true); };
  const openViewModal = (loc) => { setSelectedLocation(loc); setShowViewModal(true); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-green-100 p-3 rounded-xl">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
                  <p className="text-gray-600">Manage Rwanda's administrative boundaries</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1"><MapPin className="w-4 h-4" /><span>{pagination.total} locations</span></div>
                <div className="flex items-center space-x-1"><Navigation className="w-4 h-4" /><span>{locationStats.withCoordinates} with coordinates</span></div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => fetchLocations(pagination.page)} className="inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </button>
              <button onClick={() => { /* TODO: Export */ }} className="inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors">
                <Download className="w-4 h-4 mr-2" /> Export
              </button>
              <div className="flex bg-white border border-gray-300 rounded-lg p-1">
                <button onClick={() => setViewMode('hierarchy')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'hierarchy' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>Tree</button>
                <button onClick={() => setViewMode('grid')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>Grid</button>
                <button onClick={() => setViewMode('table')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>Table</button>
              </div>
              <button onClick={openCreateModal} className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-lg transition-colors">
                <Plus className="w-4 h-4 mr-2" /> New Location
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard icon={MapPin} title="Total Locations" value={locationStats.total} subtitle={`${locationStats.withCoordinates} mapped`} color="blue" />
          {LOCATION_TYPES.slice(1, 4).map(type => (
            <StatsCard key={type.value} icon={type.icon} title={type.label + 's'} value={locationStats.byType[type.value] || 0} color={type.value === 'province' ? 'blue' : type.value === 'district' ? 'green' : 'yellow'} />
          ))}
        </div>

        {/* Filters */}
        {viewMode !== 'hierarchy' && (
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            parentOptions={parentOptions}
          />
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading locations...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={() => fetchLocations(pagination.page)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Try Again</button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {viewMode === 'hierarchy' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Location Hierarchy</h3>
                    <p className="text-sm text-gray-500">Click nodes to expand/collapse, use action buttons to manage locations</p>
                  </div>
                  {hierarchyData.length === 0 ? (
                    <div className="text-center py-12">
                      <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hierarchy data</h3>
                      <p className="text-gray-600 mb-4">Create locations to build the administrative hierarchy.</p>
                      <button onClick={openCreateModal} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Create First Location</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hierarchyData.map(root => (
                        <HierarchyNode
                          key={root.id}
                          location={root}
                          level={0}
                          onEdit={openEditModal}
                          onView={openViewModal}
                          onAddChild={openAddChildModal}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div>
                  {locations.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                      <p className="text-gray-600 mb-4">
                        {Object.values(filters).some(v => v !== '') ? 'Try adjusting your filters or search terms.' : 'Get started by creating your first location.'}
                      </p>
                      {Object.values(filters).some(v => v !== '') ? (
                        <button onClick={clearFilters} className="px-4 py-2 text-green-600 hover:text-green-700 font-medium">Clear Filters</button>
                      ) : (
                        <button onClick={openCreateModal} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">Create First Location</button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {locations.map(loc => (
                        <LocationCard
                          key={loc.id}
                          location={loc}
                          onEdit={openEditModal}
                          onView={openViewModal}
                          onDelete={(id) => handleLocationAction('delete', id)}
                          onAddChild={openAddChildModal}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Population</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {locations.map(loc => {
                        const typeConfig = getLocationTypeConfig(loc.location_type);
                        const IconComponent = typeConfig.icon;
                        return (
                          <tr key={loc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${typeConfig.color} border mr-3`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{loc.name}</div>
                                  {loc.name_rw && loc.name_rw !== loc.name && (
                                    <div className="text-xs text-gray-500">{loc.name_rw}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${typeConfig.color}`}>{typeConfig.label}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.parent_name || 'None'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.population ? formatPopulation(loc.population) : 'Unknown'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(loc.center_lat || loc.center_lng) ? formatCoordinates(loc.center_lat, loc.center_lng) : 'Not set'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => openViewModal(loc)} className="text-blue-600 hover:text-blue-900" title="View Details"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => openEditModal(loc)} className="text-green-600 hover:text-green-900" title="Edit Location"><Edit className="w-4 h-4" /></button>
                                {typeConfig.level < 5 && (
                                  <button onClick={() => openAddChildModal(loc)} className="text-purple-600 hover:text-purple-900" title="Add Child Location"><Plus className="w-4 h-4" /></button>
                                )}
                                <button
                                  onClick={() => { if (window.confirm(`Delete "${loc.name}"? This action cannot be undone.`)) handleLocationAction('delete', loc.id); }}
                                  className="text-red-600 hover:text-red-900" title="Delete Location"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {viewMode !== 'hierarchy' && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchLocations(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) pageNum = i + 1;
                        else if (pagination.page <= 3) pageNum = i + 1;
                        else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                        else pageNum = pagination.page - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchLocations(pageNum)}
                            className={`px-3 py-2 text-sm rounded-lg ${pageNum === pagination.page ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => fetchLocations(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LocationModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setSelectedLocation(null); setModalMode('create'); }}
        onSubmit={(data) => handleLocationAction(modalMode === 'edit' ? 'update' : 'create', data)}
        location={selectedLocation}
        parentOptions={parentOptions}
        mode={modalMode}
      />
      <LocationModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedLocation(null); setModalMode('create'); }}
        onSubmit={(data) => handleLocationAction('update', data)}
        location={selectedLocation}
        parentOptions={parentOptions}
        mode="edit"
      />
      <ViewLocationModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedLocation(null); }}
        location={selectedLocation}
      />
    </div>
  );
};

export default LocationManagement;
