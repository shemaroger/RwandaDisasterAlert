import React, { useState } from 'react';
import {
  X, MapPin, Target, Plus, Minus, Navigation, Search, Locate
} from 'lucide-react';

const SimpleLocationPicker = ({ 
  isOpen, 
  onClose, 
  centerLat, 
  centerLng, 
  radiusKm, 
  onLocationChange, 
  onRadiusChange 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [coordinates, setCoordinates] = useState({
    lat: centerLat || '',
    lng: centerLng || ''
  });

  // Rwanda locations with coordinates
  const rwandaLocations = [
    { name: 'Kigali', lat: -1.9441, lng: 30.0619, type: 'Capital' },
    { name: 'Butare (Huye)', lat: -2.5967, lng: 29.7394, type: 'City' },
    { name: 'Gisenyi (Rubavu)', lat: -1.7025, lng: 29.2281, type: 'City' },
    { name: 'Ruhengeri (Musanze)', lat: -1.4994, lng: 29.6333, type: 'City' },
    { name: 'Gitarama (Muhanga)', lat: -2.0850, lng: 29.7560, type: 'City' },
    { name: 'Byumba (Gicumbi)', lat: -1.5803, lng: 30.0614, type: 'City' },
    { name: 'Cyangugu (Rusizi)', lat: -2.4833, lng: 28.9167, type: 'City' },
    { name: 'Kibungo (Ngoma)', lat: -2.1500, lng: 30.4833, type: 'City' },
    { name: 'Nyanza', lat: -2.3547, lng: 29.7500, type: 'City' },
    { name: 'Rwamagana', lat: -1.9489, lng: 30.4347, type: 'City' },
    
    // Districts
    { name: 'Gasabo District', lat: -1.9706, lng: 30.1044, type: 'District' },
    { name: 'Kicukiro District', lat: -1.9706, lng: 30.1044, type: 'District' },
    { name: 'Nyarugenge District', lat: -1.9536, lng: 30.0606, type: 'District' },
    { name: 'Bugesera District', lat: -2.2167, lng: 30.2833, type: 'District' },
    { name: 'Gatsibo District', lat: -1.5833, lng: 30.4167, type: 'District' },
    { name: 'Kayonza District', lat: -1.8833, lng: 30.6167, type: 'District' },
    { name: 'Kirehe District', lat: -2.2167, lng: 30.7167, type: 'District' },
    { name: 'Ngoma District', lat: -2.1500, lng: 30.4833, type: 'District' },
    { name: 'Nyagatare District', lat: -1.2833, lng: 30.3167, type: 'District' },
    { name: 'Rwamagana District', lat: -1.9489, lng: 30.4347, type: 'District' },
    
    // More locations
    { name: 'Akagera National Park', lat: -1.9000, lng: 30.7500, type: 'Park' },
    { name: 'Volcanoes National Park', lat: -1.4667, lng: 29.5000, type: 'Park' },
    { name: 'Lake Kivu', lat: -2.3000, lng: 29.0000, type: 'Lake' },
    { name: 'Nyungwe Forest', lat: -2.5000, lng: 29.2000, type: 'Forest' }
  ];

  const filteredLocations = rwandaLocations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocationSelect = (location) => {
    setCoordinates({ lat: location.lat, lng: location.lng });
    setSelectedLocation(location.name);
    if (onLocationChange) {
      onLocationChange(location.lat, location.lng);
    }
  };

  const handleManualCoordinateChange = (field, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newCoords = { ...coordinates, [field]: numValue };
      setCoordinates(newCoords);
      if (onLocationChange && newCoords.lat && newCoords.lng) {
        onLocationChange(newCoords.lat, newCoords.lng);
      }
    } else {
      setCoordinates({ ...coordinates, [field]: value });
    }
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
          setSelectedLocation('Current Location');
          if (onLocationChange) {
            onLocationChange(lat, lng);
          }
          setIsSearching(false);
        },
        (error) => {
          alert('Unable to get your location. Please select manually.');
          setIsSearching(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const adjustRadius = (delta) => {
    const newRadius = Math.max(0.1, Math.min(100, (radiusKm || 1) + delta));
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  const clearLocation = () => {
    setCoordinates({ lat: '', lng: '' });
    setSelectedLocation('');
    if (onLocationChange) {
      onLocationChange(null, null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Set Alert Location</h2>
              <p className="text-sm text-gray-600">Choose a location and coverage radius for your alert</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Location Selection */}
          <div className="w-1/2 border-r flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Rwanda locations..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <button
                onClick={handleGetCurrentLocation}
                disabled={isSearching}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Locate className="w-4 h-4" />
                )}
                Use My Current Location
              </button>
            </div>

            {/* Location List */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Locations</h3>
              <div className="space-y-2">
                {filteredLocations.slice(0, 15).map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(location)}
                    className={`w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors ${
                      selectedLocation === location.name ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{location.name}</div>
                        <div className="text-sm text-gray-500">{location.type}</div>
                      </div>
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Coordinates and Settings */}
          <div className="w-1/2 flex flex-col">
            {/* Manual Coordinates */}
            <div className="p-4 border-b">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Manual Coordinates</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={coordinates.lat}
                    onChange={(e) => handleManualCoordinateChange('lat', e.target.value)}
                    placeholder="-1.9441 (Kigali)"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={coordinates.lng}
                    onChange={(e) => handleManualCoordinateChange('lng', e.target.value)}
                    placeholder="30.0619 (Kigali)"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Selected Location Display */}
            {(coordinates.lat && coordinates.lng) && (
              <div className="p-4 border-b bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Selected Location</h4>
                    <p className="text-xs text-green-600 mt-1">
                      {selectedLocation || 'Custom Location'}
                    </p>
                    <p className="text-xs font-mono text-green-700 mt-1">
                      {coordinates.lat.toFixed ? coordinates.lat.toFixed(6) : coordinates.lat}, {coordinates.lng.toFixed ? coordinates.lng.toFixed(6) : coordinates.lng}
                    </p>
                  </div>
                  <button
                    onClick={clearLocation}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Radius Control */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Coverage Radius</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustRadius(-0.5)}
                    disabled={!radiusKm || radiusKm <= 0.5}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={radiusKm || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0 && onRadiusChange) {
                          onRadiusChange(value);
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="5.0"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500 font-medium">km</div>
                  
                  <button
                    onClick={() => adjustRadius(0.5)}
                    className="p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {radiusKm && (
                  <div className="text-xs text-gray-500 text-center">
                    Coverage area: ~{(Math.PI * radiusKm * radiusKm).toFixed(1)} km²
                  </div>
                )}
              </div>
            </div>

            {/* Visual Map Alternative */}
            <div className="flex-1 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Location Preview</h3>
              <div className="bg-gray-100 rounded-lg p-4 h-full min-h-[200px] flex items-center justify-center">
                {coordinates.lat && coordinates.lng ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-700">{selectedLocation || 'Selected Location'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {radiusKm ? `${radiusKm} km radius` : 'No radius set'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Select a location to see preview</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            disabled={!coordinates.lat || !coordinates.lng}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleLocationPicker;