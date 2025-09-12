// src/pages/incidents/IncidentsManagement.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  AlertTriangle, Plus, Search, Filter, RefreshCw, Eye, Edit, Trash2, CheckCircle2,
  Shield, UserPlus, Check, X, MapPin, Image as ImageIcon, Video, Target, Clock, Loader2,
  ChevronDown, ChevronUp, UploadCloud, Paperclip, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

/* ====================== Map (Leaflet via CDN) ====================== */

const RW_BOUNDS = [
  [-2.90, 28.85], // SW
  [-1.05, 30.90], // NE
];

function MapPicker({ lat, lng, onPick, height = 240, className = '' }) {
  const elRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!elRef.current || map) return;

    const ensureLeaflet = () =>
      new Promise((resolve) => {
        if (window.L) return resolve();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = () => resolve();
        document.body.appendChild(script);
      });

    const init = async () => {
      await ensureLeaflet();
      const L = window.L;

      const center = [lat ?? -1.9441, lng ?? 30.0619]; // Kigali default
      const zoom = lat && lng ? 13 : 8;

      const mapInstance = L.map(elRef.current, {
        center,
        zoom,
        maxBounds: RW_BOUNDS,
        maxBoundsViscosity: 0.8,
        worldCopyJump: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance);

      mapInstance.on('click', (e) => {
        const { lat: la, lng: ln } = e.latlng;
        onPick(Number(la.toFixed(6)), Number(ln.toFixed(6)));
      });

      setMap(mapInstance);
      setReady(true);
    };

    init();

    return () => {
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redraw marker when lat/lng change
  useEffect(() => {
    if (!ready || !map || !window.L) return;
    const L = window.L;
    if (marker) {
      map.removeLayer(marker);
      setMarker(null);
    }
    if (typeof lat === 'number' && typeof lng === 'number') {
      const m = L.marker([lat, lng], { draggable: true }).addTo(map);
      m.on('dragend', (e) => {
        const { lat: la, lng: ln } = e.target.getLatLng();
        onPick(Number(la.toFixed(6)), Number(ln.toFixed(6)));
      });
      setMarker(m);
      map.setView([lat, lng], map.getZoom());
    }
  }, [ready, map, lat, lng, onPick, marker]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Target className="w-4 h-4 text-gray-500" />
          Click on the map to set location
        </div>
        {lat != null && lng != null && (
          <button
            type="button"
            onClick={() => onPick(null, null)}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>
      <div ref={elRef} style={{ height }} className="w-full rounded-lg border border-gray-300 bg-gray-100" />
      {lat != null && lng != null && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

/* ====================== Small Utils ====================== */

const REPORT_TYPES = [
  { value: 'emergency', label: 'Emergency' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'infrastructure', label: 'Infrastructure Damage' },
  { value: 'health', label: 'Health Emergency' },
  { value: 'security', label: 'Security Incident' },
  { value: 'other', label: 'Other' },
];

const STATUS = {
  submitted: { label: 'Submitted', cls: 'bg-gray-100 text-gray-800' },
  under_review: { label: 'Under Review', cls: 'bg-amber-100 text-amber-800' },
  verified: { label: 'Verified', cls: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-800' },
  dismissed: { label: 'Dismissed', cls: 'bg-red-100 text-red-800' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

/* ====================== Create/Edit Modal ====================== */

function IncidentModal({
  open,
  onClose,
  onSubmit,
  locations,
  disasterTypes,
  initial = null,
  isEdit = false
}) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]); // File[] for create only
  const [videos, setVideos] = useState([]); // File[] for create only

  const [form, setForm] = useState({
    report_type: 'emergency',
    disaster_type: '',
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    address: '',
    casualties: '',
    property_damage: '',
    immediate_needs: '',
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setImages([]);
    setVideos([]);

    if (initial && isEdit) {
      setForm({
        report_type: initial.report_type || 'emergency',
        disaster_type: initial.disaster_type || '',
        title: initial.title || '',
        description: initial.description || '',
        location: initial.location || '',
        latitude: initial.latitude ?? '',
        longitude: initial.longitude ?? '',
        address: initial.address || '',
        casualties: initial.casualties ?? '',
        property_damage: initial.property_damage || '',
        immediate_needs: initial.immediate_needs || '',
      });
    } else {
      setForm((f) => ({ ...f, disaster_type: disasterTypes?.[0]?.id || '' }));
    }
  }, [open, initial, isEdit, disasterTypes]);

  const setField = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const pickMap = useCallback((lat, lng) => {
    setField('latitude', lat ?? '');
    setField('longitude', lng ?? '');
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      if (isEdit) {
        const payload = {
          ...form,
          location: form.location || null,
          latitude: form.latitude || null,
          longitude: form.longitude || null,
          casualties: form.casualties || null,
        };
        await onSubmit(payload);
      } else {
        // create uses multipart (apiService.createIncident builds FormData)
        const payload = {
          ...form,
          images,
          videos,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to save incident');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">{isEdit ? 'Edit Incident' : 'Report Incident'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={form.report_type}
                onChange={(e) => setField('report_type', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disaster Type</label>
              <select
                value={form.disaster_type}
                onChange={(e) => setField('disaster_type', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">None</option>
                {disasterTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${errors.title ? 'border-red-300 bg-red-50' : ''}`}
                placeholder="e.g., Landslide blocking road in Nyamagabe"
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${errors.description ? 'border-red-300 bg-red-50' : ''}`}
                placeholder="Explain what happened, current risks, nearby landmarks, etc."
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Administrative Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">None</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.location_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number" step="any"
                  value={form.latitude}
                  onChange={(e) => setField('latitude', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="-1.9441"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number" step="any"
                  value={form.longitude}
                  onChange={(e) => setField('longitude', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="30.0619"
                />
              </div>
            </div>

            <div className="mt-4">
              <MapPicker
                lat={typeof form.latitude === 'number' ? form.latitude : null}
                lng={typeof form.longitude === 'number' ? form.longitude : null}
                onPick={pickMap}
                height={260}
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address / Landmark</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Near Nyabarongo River bridge, 200m east of the station..."
              />
            </div>
          </div>

          {/* Additional */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Casualties</label>
              <input
                type="number" min="0"
                value={form.casualties}
                onChange={(e) => setField('casualties', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Immediate Needs</label>
              <input
                value={form.immediate_needs}
                onChange={(e) => setField('immediate_needs', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Evacuation, medical aid, shelter, food, etc."
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Damage</label>
              <textarea
                rows={2}
                value={form.property_damage}
                onChange={(e) => setField('property_damage', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Road washed out, 3 houses collapsed, etc."
              />
            </div>
          </div>

          {/* Media (create only) */}
          {!isEdit && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-gray-600" />
                Attachments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setImages(Array.from(e.target.files || []))}
                  />
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium">Upload Images</div>
                    <div className="text-xs text-gray-500">{images.length ? `${images.length} selected` : 'JPG, PNG'}</div>
                  </div>
                </label>
                <label className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setVideos(Array.from(e.target.files || []))}
                  />
                  <Video className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium">Upload Videos</div>
                    <div className="text-xs text-gray-500">{videos.length ? `${videos.length} selected` : 'MP4, MOV'}</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg border">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ====================== View Modal ====================== */

function ViewIncidentModal({ open, onClose, incident }) {
  if (!open || !incident) return null;
  const s = STATUS[incident.status] || { label: incident.status, cls: 'bg-gray-100 text-gray-800' };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{incident.title}</h2>
              <div className={`inline-flex text-xs px-2 py-0.5 rounded-full mt-1 ${s.cls}`}>{s.label}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            <div><span className="font-medium">Reporter:</span> {incident.reporter_name || '—'}</div>
            <div><span className="font-medium">Type:</span> {incident.report_type}</div>
            <div><span className="font-medium">Disaster:</span> {incident.disaster_type_name || '—'}</div>
            <div><span className="font-medium">Location:</span> {incident.location_name || '—'}</div>
            <div><span className="font-medium">Coords:</span> {incident.latitude ?? '—'}, {incident.longitude ?? '—'}</div>
            <div><span className="font-medium">Address:</span> {incident.address || '—'}</div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{incident.description}</p>
          </div>

          {(incident.images?.length || incident.videos?.length) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Attachments</h3>
              <div className="flex flex-wrap gap-3">
                {(incident.images || []).map((src, i) => (
                  <a key={`img-${i}`} href={src} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                    <ImageIcon className="w-4 h-4" /> Image {i + 1}
                  </a>
                ))}
                {(incident.videos || []).map((src, i) => (
                  <a key={`vid-${i}`} href={src} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                    <Video className="w-4 h-4" /> Video {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div><span className="font-medium">Priority:</span> {incident.priority}</div>
            <div><span className="font-medium">Assigned To:</span> {incident.assigned_to_name || '—'}</div>
            <div><span className="font-medium">Verified By:</span> {incident.verified_by_name || '—'}</div>
            <div><span className="font-medium">Created:</span> {fmtDate(incident.created_at)}</div>
            <div><span className="font-medium">Updated:</span> {fmtDate(incident.updated_at)}</div>
            <div><span className="font-medium">Resolved At:</span> {fmtDate(incident.resolved_at)}</div>
          </div>

          {incident.resolution_notes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Resolution Notes</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{incident.resolution_notes}</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t">
          <button onClick={onClose} className="w-full py-2 rounded-lg border">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ====================== Main Page ====================== */

export default function IncidentsManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [disasterTypes, setDisasterTypes] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    report_type: '',
    disaster_type: '',
    status: '',
    location: '',
    priority: '',
  });

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showFilters, setShowFilters] = useState(true);

  // modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const canManage = user?.user_type === 'admin' || user?.user_type === 'authority' || user?.user_type === 'operator';
  const isCitizen = user?.user_type === 'citizen';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, locRes, dtRes] = await Promise.all([
        apiService.getIncidents(
          {
            ...(filters.report_type ? { report_type: filters.report_type } : {}),
            ...(filters.disaster_type ? { disaster_type: filters.disaster_type } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.location ? { location: filters.location } : {}),
            ...(filters.priority ? { priority: filters.priority } : {}),
            search: filters.search || undefined,
            page_size: 1000
          }
        ),
        apiService.getLocations({ page_size: 1000 }),
        apiService.getDisasterTypes({ page_size: 1000 }),
      ]);

      setIncidents(incRes?.results || incRes || []);
      setLocations(locRes?.results || locRes || []);
      setDisasterTypes(dtRes?.results || dtRes || []);
    } catch (err) {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resetFilters = () => {
    setFilters({ search: '', report_type: '', disaster_type: '', status: '', location: '', priority: '' });
  };

  const openCreate = () => {
    setCreateOpen(true);
  };

  const openEdit = (inc) => {
    setCurrent(inc);
    setEditOpen(true);
  };

  const openView = (inc) => {
    setCurrent(inc);
    setViewOpen(true);
  };

  const doCreate = async (payload) => {
    await apiService.createIncident(payload);
    toast.success('Incident submitted');
    await fetchAll();
  };

  const doUpdate = async (updates) => {
    if (!current) return;
    await apiService.updateIncident(current.id, updates);
    toast.success('Incident updated');
    await fetchAll();
  };

  const doDelete = async (id) => {
    if (!window.confirm('Delete this incident? This cannot be undone.')) return;
    await apiService.deleteIncident(id);
    toast.success('Incident deleted');
    await fetchAll();
  };

  const doAssign = async (inc) => {
    const userId = prompt('Assign to user ID:');
    if (!userId) return;
    await apiService.assignIncident(inc.id, userId);
    toast.success('Assigned');
    await fetchAll();
  };

  const doVerify = async (inc) => {
    await apiService.verifyIncident(inc.id);
    toast.success('Verified');
    await fetchAll();
  };

  const doResolve = async (inc) => {
    const notes = prompt('Resolution notes (optional):', '');
    await apiService.resolveIncident(inc.id, notes || '');
    toast.success('Resolved');
    await fetchAll();
  };

  const filtered = useMemo(() => incidents, [incidents]); // server-side filters already applied

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
                <p className="text-gray-600">Citizen-generated incidents and field verifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAll}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              {isCitizen && (
                <button
                  onClick={openCreate}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Report Incident
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {showFilters && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg"
                    placeholder="Title or description..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.report_type}
                  onChange={(e) => setFilters((f) => ({ ...f, report_type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">All</option>
                  {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disaster</label>
                <select
                  value={filters.disaster_type}
                  onChange={(e) => setFilters((f) => ({ ...f, disaster_type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">All</option>
                  {disasterTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">All</option>
                  {Object.entries(STATUS).map(([v, o]) => (
                    <option key={v} value={v}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">All</option>
                  {[1,2,3,4,5].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">All</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-6 flex items-center justify-end gap-2">
                <button onClick={resetFilters} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Clear</button>
                <button onClick={fetchAll} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 text-sm">
              <button
                className={`px-3 py-1.5 rounded-md ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'border'}`}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
              <button
                className={`px-3 py-1.5 rounded-md ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'border'}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
            </div>
            <div className="text-sm text-gray-600 px-2">Total: {filtered.length}</div>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading incidents...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-600">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              No incidents found. {isCitizen ? 'Create one to get started.' : 'Try adjusting filters.'}
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Disaster</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((inc) => {
                    const s = STATUS[inc.status] || { label: inc.status, cls: 'bg-gray-100 text-gray-800' };
                    return (
                      <tr key={inc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{inc.title}</div>
                          <div className="text-xs text-gray-500">{inc.reporter_name}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inc.report_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inc.disaster_type_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inc.location_name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full inline-flex ${s.cls}`}>{s.label}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inc.priority}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{fmtDate(inc.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openView(inc)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {(isCitizen && inc.status === 'submitted') || canManage ? (
                              <button
                                onClick={() => openEdit(inc)}
                                className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            ) : null}

                            {canManage && (
                              <>
                                <button
                                  onClick={() => doAssign(inc)}
                                  className="p-2 rounded-lg hover:bg-purple-50 text-purple-600"
                                  title="Assign"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                                {inc.status !== 'verified' && (
                                  <button
                                    onClick={() => doVerify(inc)}
                                    className="p-2 rounded-lg hover:bg-amber-50 text-amber-600"
                                    title="Verify"
                                  >
                                    <Shield className="w-4 h-4" />
                                  </button>
                                )}
                                {inc.status !== 'resolved' && (
                                  <button
                                    onClick={() => doResolve(inc)}
                                    className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                                    title="Resolve"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}

                            {(isCitizen || canManage) && (
                              <button
                                onClick={() => doDelete(inc.id)}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((inc) => {
                const s = STATUS[inc.status] || { label: inc.status, cls: 'bg-gray-100 text-gray-800' };
                return (
                  <div key={inc.id} className="border rounded-xl p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 line-clamp-1">{inc.title}</div>
                          <div className="text-xs text-gray-500">{inc.reporter_name} • {fmtDate(inc.created_at)}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>

                    <div className="text-sm text-gray-700 mt-3 line-clamp-3">{inc.description}</div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div><span className="font-medium">Type:</span> {inc.report_type}</div>
                      <div><span className="font-medium">Disaster:</span> {inc.disaster_type_name || '—'}</div>
                      <div><span className="font-medium">Location:</span> {inc.location_name || '—'}</div>
                      <div><span className="font-medium">Priority:</span> {inc.priority}</div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button onClick={() => openView(inc)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      {(isCitizen && inc.status === 'submitted') || canManage ? (
                        <button onClick={() => openEdit(inc)} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      ) : null}
                      {canManage && (
                        <>
                          <button onClick={() => doAssign(inc)} className="p-2 rounded-lg hover:bg-purple-50 text-purple-600" title="Assign">
                            <UserPlus className="w-4 h-4" />
                          </button>
                          {inc.status !== 'verified' && (
                            <button onClick={() => doVerify(inc)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600" title="Verify">
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          {inc.status !== 'resolved' && (
                            <button onClick={() => doResolve(inc)} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Resolve">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {(isCitizen || canManage) && (
                        <button onClick={() => doDelete(inc.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <IncidentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={doCreate}
        locations={locations}
        disasterTypes={disasterTypes}
        initial={null}
        isEdit={false}
      />
      <IncidentModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setCurrent(null); }}
        onSubmit={doUpdate}
        locations={locations}
        disasterTypes={disasterTypes}
        initial={current}
        isEdit={true}
      />
      <ViewIncidentModal
        open={viewOpen}
        onClose={() => { setViewOpen(false); setCurrent(null); }}
        incident={current}
      />
    </div>
  );
}
