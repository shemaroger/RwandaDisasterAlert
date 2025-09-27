// src/components/AlertMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AlertMap = ({ lat, lng, radiusKm, title }) => {
  if (!lat || !lng) return <div className="text-center p-4 text-gray-500">No location data available</div>;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      style={{ height: '300px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Circle
        center={[lat, lng]}
        radius={radiusKm * 1000} // Convert km to meters
        color="blue"
        fillColor="blue"
        fillOpacity={0.2}
      >
        <Popup>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p>Radius: {radiusKm} km</p>
          </div>
        </Popup>
      </Circle>
    </MapContainer>
  );
};

export default AlertMap;
