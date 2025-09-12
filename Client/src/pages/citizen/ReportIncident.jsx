import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Save, MapPin, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';

// Minimal Map component (reuses logic like in alerts)
const MapSelector = ({ lat, lng, onLocationChange }) => {
  const mapRef = React.useRef(null);

  React.useEffect(() => {
    if (!mapRef.current) return;
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      const L = window.L;
      const map = L.map(mapRef.current).setView([lat || -1.9441, lng || 30.0619], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      let marker = null;
      if (lat && lng) {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationChange(lat, lng);
        });
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onLocationChange(lat, lng);
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationChange(lat, lng);
        });
      });
    }
  }, [lat, lng, onLocationChange]);

  return (
    <div ref={mapRef} className="w-full h-64 rounded-lg border bg-gray-100" />
  );
};

export default function ReportIncident() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    report_type: 'emergency',
    disaster_type: '',
    title: '',
    description: '',
    latitude: null,
    longitude: null,
    address: '',
    images: [],
    videos: [],
    casualties: '',
    property_damage: '',
    immediate_needs: ''
  });

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, key) => {
    setField(key, Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createIncident(form);
      toast.success('Incident report submitted');
      navigate('/incidents/my-reports');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit incident');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationChange = useCallback((lat, lng) => {
    setField('latitude', lat);
    setField('longitude', lng);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border rounded-lg bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Report an Incident</h1>
              <p className="text-sm text-gray-600">Submit details of an emergency or hazard</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. House fire in Kicukiro"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Provide more details about the incident..."
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={form.report_type}
              onChange={(e) => setField('report_type', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="emergency">Emergency</option>
              <option value="hazard">Hazard</option>
              <option value="infrastructure">Infrastructure Damage</option>
              <option value="health">Health Emergency</option>
              <option value="security">Security Incident</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Map Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <MapSelector
              lat={form.latitude}
              lng={form.longitude}
              onLocationChange={handleLocationChange}
            />
            {form.latitude && form.longitude && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* File Uploads */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Images
            </label>
            <input type="file" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'images')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Videos
            </label>
            <input type="file" multiple accept="video/*" onChange={(e) => handleFileChange(e, 'videos')} />
          </div>

          {/* Extra details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Casualties (if any)
            </label>
            <input
              type="number"
              min="0"
              value={form.casualties}
              onChange={(e) => setField('casualties', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Immediate Needs
            </label>
            <textarea
              value={form.immediate_needs}
              onChange={(e) => setField('immediate_needs', e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Submit Incident
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/incidents/my-reports')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
