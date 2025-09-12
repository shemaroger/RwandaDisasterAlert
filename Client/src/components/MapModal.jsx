// src/components/MapModal.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  X, MapPin, Target, Plus, Minus, Navigation, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';

const MapModal = ({ 
  isOpen, 
  onClose, 
  centerLat, 
  centerLng, 
  radiusKm, 
  onLocationChange, 
  onRadiusChange 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [circle, setCircle] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Leaflet map when modal opens
  useEffect(() => {
    if (!isOpen || !mapRef.current || map) return;

    let mounted = true;

    const loadLeaflet = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        // Check if Leaflet is already loaded
        if (window.L) {
          initMap();
          return;
        }

        // Load CSS first
        const cssPromise = new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.onload = resolve;
          link.onerror = () => reject(new Error('Failed to load Leaflet CSS'));
          document.head.appendChild(link);
        });

        // Load JS
        const jsPromise = new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Leaflet JS'));
          document.head.appendChild(script);
        });

        // Wait for both to load
        await Promise.all([cssPromise, jsPromise]);
        
        setTimeout(() => {
          if (mounted && window.L) {
            initMap();
          }
        }, 300);

      } catch (error) {
        console.error('Error loading Leaflet:', error);
        if (mounted) {
          setMapError(error.message || 'Failed to load map library');
          setIsLoading(false);
        }
      }
    };

    const initMap = () => {
      try {
        if (!window.L || !mapRef.current || !mounted) return;

        const L = window.L;
        
        // Default to Rwanda center
        const defaultLat = centerLat || -1.9441;
        const defaultLng = centerLng || 30.0619;
        const defaultZoom = centerLat && centerLng ? 13 : 8;

        // Create map instance
        const mapInstance = L.map(mapRef.current, {
          preferCanvas: true,
          zoomControl: false, // We'll add custom controls
          attributionControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true,
          touchZoom: true,
          boxZoom: true,
          keyboard: true
        }).setView([defaultLat, defaultLng], defaultZoom);

        // Add tile layer
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
          minZoom: 5
        });

        tileLayer.addTo(mapInstance);

        // Add click handler
        mapInstance.on('click', (e) => {
          if (mounted) {
            const { lat, lng } = e.latlng;
            onLocationChange(lat, lng);
            
            // Visual feedback
            const clickMarker = L.circleMarker([lat, lng], {
              radius: 15,
              color: '#dc2626',
              fillColor: '#fca5a5',
              fillOpacity: 0.8,
              weight: 3
            }).addTo(mapInstance);
            
            setTimeout(() => {
              mapInstance.removeLayer(clickMarker);
            }, 800);
          }
        });

        // Force resize after initialization
        setTimeout(() => {
          if (mounted && mapInstance) {
            mapInstance.invalidateSize();
          }
        }, 500);

        if (mounted) {
          setMap(mapInstance);
          setIsMapReady(true);
          setIsLoading(false);
          setMapError(null);
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        if (mounted) {
          setMapError('Failed to initialize map: ' + error.message);
          setIsLoading(false);
        }
      }
    };

    loadLeaflet();

    return () => {
      mounted = false;
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        setMap(null);
        setIsMapReady(false);
      }
    };
  }, [isOpen]);

  // Update markers when coordinates change
  useEffect(() => {
    if (!map || !isMapReady || !window.L) return;

    const L = window.L;

    try {
      // Clean up existing layers
      if (marker) {
        map.removeLayer(marker);
        setMarker(null);
      }
      if (circle) {
        map.removeLayer(circle);
        setCircle(null);
      }

      // Add new marker if coordinates exist
      if (centerLat && centerLng && typeof centerLat === 'number' && typeof centerLng === 'number') {
        // Custom marker
        const newMarker = L.marker([centerLat, centerLng], {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="
              background: #dc2626;
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              border: 4px solid white;
              transform: rotate(-45deg);
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
              position: relative;
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map);

        newMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationChange(lat, lng);
        });

        newMarker.bindTooltip('Drag to adjust target location', {
          permanent: false,
          direction: 'top',
          offset: [0, -35]
        });

        setMarker(newMarker);

        // Add circle if radius exists
        if (radiusKm > 0) {
          const newCircle = L.circle([centerLat, centerLng], {
            color: '#dc2626',
            fillColor: '#fca5a5',
            fillOpacity: 0.2,
            weight: 3,
            opacity: 0.9,
            radius: radiusKm * 1000,
            dashArray: '8, 8'
          }).addTo(map);

          newCircle.bindTooltip(`${radiusKm}km coverage radius`, {
            permanent: false,
            direction: 'center'
          });

          setCircle(newCircle);
        }

        // Pan to location
        map.flyTo([centerLat, centerLng], Math.max(map.getZoom(), 12), {
          duration: 1
        });
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [map, isMapReady, centerLat, centerLng, radiusKm, onLocationChange]);

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim() || !map) return;

    setIsSearching(true);
    try {
      // Simple geocoding using Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=rw`
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon } = results[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        onLocationChange(latitude, longitude);
        map.flyTo([latitude, longitude], 14, { duration: 1.5 });
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const adjustRadius = (delta) => {
    const newRadius = Math.max(0.1, Math.min(100, (radiusKm || 1) + delta));
    onRadiusChange(newRadius);
  };

  const handleClearLocation = () => {
    onLocationChange(null, null);
    setSearchQuery('');
  };

  const zoomIn = () => map && map.zoomIn();
  const zoomOut = () => map && map.zoomOut();
  const centerOnRwanda = () => map && map.flyTo([-1.9441, 30.0619], 8, { duration: 1 });

  const handleSaveAndClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Set Alert Target Location</h2>
              <p className="text-sm text-gray-600">Click on the map or search for a location</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a location in Rwanda (e.g., Kigali, Butare, Gisenyi)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-50"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={centerOnRwanda}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Show Rwanda
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Map Unavailable</h3>
                <p className="text-gray-500 mb-4">{mapError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reload Page
                </button>
              </div>
            </div>
          ) : (
            <>
              <div 
                ref={mapRef} 
                className="w-full h-full"
              />
              
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading interactive map...</p>
                    <p className="text-gray-500 text-sm mt-1">Please wait while we prepare your map</p>
                  </div>
                </div>
              )}

              {/* Map Controls */}
              {isMapReady && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={zoomIn}
                    className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={zoomOut}
                    className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Instructions overlay */}
              {isMapReady && !centerLat && !centerLng && (
                <div className="absolute top-4 left-4 right-20 bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Click anywhere on the map</span> to set your alert target location, 
                    or use the search bar above to find a specific place.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 space-y-4">
          {/* Location Info */}
          {centerLat && centerLng && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">Target Location</span>
                </div>
                <button
                  onClick={handleClearLocation}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear
                </button>
              </div>
              <p className="text-sm font-mono text-gray-600">
                {centerLat.toFixed(6)}, {centerLng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Radius Control */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Alert Coverage Radius</label>
              <span className="text-xs text-gray-500">
                {centerLat && centerLng && radiusKm ? 
                  `~${(Math.PI * radiusKm * radiusKm).toFixed(1)} km²` : 
                  'Area calculation'
                }
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustRadius(-0.5)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                disabled={!radiusKm || radiusKm <= 0.5}
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={radiusKm || ''}
                  onChange={(e) => onRadiusChange(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="5.0"
                />
                <span className="text-sm text-gray-500 font-medium">km</span>
              </div>
              
              <button
                type="button"
                onClick={() => adjustRadius(0.5)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Save Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapModal;