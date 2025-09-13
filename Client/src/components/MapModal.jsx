// src/components/MapModal.jsx - Fixed version
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
  const mapInstanceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Clean up map when modal closes
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
        setIsMapReady(false);
      } catch (e) {
        console.warn('Error cleaning up map:', e);
      }
    }
  }, [isOpen]);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || !mapRef.current || mapInstanceRef.current) return;

    let mounted = true;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        // Load Leaflet if not already loaded
        if (!window.L) {
          await loadLeafletLibrary();
        }

        // Small delay to ensure DOM is ready
        setTimeout(() => {
          if (mounted && window.L && mapRef.current) {
            createMap();
          }
        }, 100);

      } catch (error) {
        console.error('Error initializing map:', error);
        if (mounted) {
          setMapError(error.message || 'Failed to load map');
          setIsLoading(false);
        }
      }
    };

    const loadLeafletLibrary = () => {
      return new Promise((resolve, reject) => {
        // Check if already loading
        if (window.leafletLoading) {
          const checkLoaded = () => {
            if (window.L) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
          return;
        }

        window.leafletLoading = true;

        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        script.onload = () => {
          window.leafletLoading = false;
          resolve();
        };
        
        script.onerror = () => {
          window.leafletLoading = false;
          reject(new Error('Failed to load Leaflet library'));
        };
        
        document.head.appendChild(script);
      });
    };

    const createMap = () => {
      try {
        if (!window.L || !mapRef.current || !mounted) return;

        const L = window.L;
        
        // Default coordinates for Rwanda
        const defaultLat = centerLat && !isNaN(centerLat) ? centerLat : -1.9441;
        const defaultLng = centerLng && !isNaN(centerLng) ? centerLng : 30.0619;
        const defaultZoom = (centerLat && centerLng) ? 13 : 8;

        // Create map with proper container check
        const container = mapRef.current;
        
        // Clear any existing map instance
        if (container._leaflet_id) {
          container._leaflet_id = null;
        }

        const mapInstance = L.map(container, {
          center: [defaultLat, defaultLng],
          zoom: defaultZoom,
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true,
          touchZoom: true,
          boxZoom: true,
          keyboard: true,
          maxZoom: 18,
          minZoom: 5
        });

        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEyOCIgeT0iMTI4IiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TWFwIFRpbGUgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+'
        });

        tileLayer.addTo(mapInstance);

        // Handle tile loading errors
        tileLayer.on('tileerror', (e) => {
          console.warn('Tile loading error:', e);
        });

        // Add click handler
        mapInstance.on('click', (e) => {
          if (mounted && onLocationChange) {
            const { lat, lng } = e.latlng;
            onLocationChange(lat, lng);
          }
        });

        // Handle map ready event
        mapInstance.whenReady(() => {
          if (mounted) {
            setIsMapReady(true);
            setIsLoading(false);
            setMapError(null);
            
            // Force a resize to ensure proper rendering
            setTimeout(() => {
              if (mapInstance && mounted) {
                mapInstance.invalidateSize();
              }
            }, 100);
          }
        });

        mapInstanceRef.current = mapInstance;

      } catch (error) {
        console.error('Error creating map:', error);
        if (mounted) {
          setMapError('Failed to create map: ' + error.message);
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Update markers when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    try {
      // Remove existing marker and circle
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }

      // Add new marker if coordinates are valid
      if (centerLat && centerLng && 
          typeof centerLat === 'number' && typeof centerLng === 'number' &&
          !isNaN(centerLat) && !isNaN(centerLng)) {
        
        // Create custom marker icon
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 25px;
              height: 25px;
              background: #dc2626;
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              position: relative;
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [25, 25],
          iconAnchor: [12, 25],
          popupAnchor: [0, -25]
        });

        const marker = L.marker([centerLat, centerLng], {
          draggable: true,
          icon: customIcon
        }).addTo(map);

        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          if (onLocationChange) {
            onLocationChange(lat, lng);
          }
        });

        markerRef.current = marker;

        // Add circle if radius is specified
        if (radiusKm && radiusKm > 0) {
          const circle = L.circle([centerLat, centerLng], {
            color: '#dc2626',
            fillColor: '#fca5a5',
            fillOpacity: 0.2,
            weight: 2,
            opacity: 0.8,
            radius: radiusKm * 1000 // Convert km to meters
          }).addTo(map);

          circleRef.current = circle;
        }

        // Center map on marker with smooth animation
        map.setView([centerLat, centerLng], Math.max(map.getZoom(), 12), {
          animate: true
        });
      }
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }, [centerLat, centerLng, radiusKm, isMapReady, onLocationChange]);

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Rwanda')}&limit=5&countrycodes=rw`,
        {
          headers: {
            'User-Agent': 'Emergency Alert System'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Search service unavailable');
      }
      
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon } = results[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
          onLocationChange(latitude, longitude);
          mapInstanceRef.current.setView([latitude, longitude], 14, { animate: true });
        } else {
          throw new Error('Invalid coordinates received');
        }
      } else {
        alert('Location not found in Rwanda. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again or click directly on the map.');
    } finally {
      setIsSearching(false);
    }
  };

  const adjustRadius = (delta) => {
    const newRadius = Math.max(0.1, Math.min(100, (radiusKm || 1) + delta));
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  const handleClearLocation = () => {
    if (onLocationChange) {
      onLocationChange(null, null);
    }
    setSearchQuery('');
  };

  const zoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const centerOnRwanda = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-1.9441, 30.0619], 8, { animate: true });
    }
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
              <p className="text-sm text-gray-600">Click on the map or search for a location in Rwanda</p>
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
                onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                placeholder="Search for a location in Rwanda (e.g., Kigali, Butare, Gisenyi)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={isSearching}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-50"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
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
        <div className="flex-1 relative bg-gray-100">
          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Map Unavailable</h3>
                <p className="text-gray-500 mb-4 text-sm">{mapError}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMapError(null);
                      setIsLoading(true);
                      // Force re-initialization
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.remove();
                        mapInstanceRef.current = null;
                      }
                      // Trigger re-initialization
                      setTimeout(() => {
                        if (mapRef.current) {
                          setIsLoading(false);
                        }
                      }, 100);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mr-2"
                  >
                    Retry
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div 
                ref={mapRef} 
                className="w-full h-full"
                style={{ minHeight: '400px' }}
              />
              
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Loading interactive map...</p>
                    <p className="text-gray-500 text-sm mt-1">Connecting to map services</p>
                  </div>
                </div>
              )}

              {/* Map Controls */}
              {isMapReady && !isLoading && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={zoomIn}
                    className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={zoomOut}
                    className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Instructions overlay */}
              {isMapReady && !centerLat && !centerLng && (
                <div className="absolute top-4 left-4 right-20 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Set Target Location</p>
                      <p className="text-xs text-blue-700">
                        Click anywhere on the map to set your alert target location, or use the search bar above to find a specific place in Rwanda.
                      </p>
                    </div>
                  </div>
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
                  `~${(Math.PI * radiusKm * radiusKm).toFixed(1)} km² coverage` : 
                  'Area calculation'
                }
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustRadius(-0.5)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0 && onRadiusChange) {
                      onRadiusChange(value);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="5.0"
                />
                <span className="text-sm text-gray-500 font-medium">km</span>
              </div>
              
              <button
                type="button"
                onClick={() => adjustRadius(0.5)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
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
              onClick={onClose}
              disabled={!centerLat || !centerLng}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
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