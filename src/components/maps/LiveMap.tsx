"use client";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default icons in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function LiveMap() {
  const position: [number, number] = [40.7128, -74.0060]; // NYC
  const destination: [number, number] = [34.0522, -118.2437]; // LA

  return (
    <div className="h-full w-full rounded-[2rem] overflow-hidden border-8 border-white shadow-soft">
      <MapContainer center={position} zoom={4} className="h-full w-full">
        {/* Using CartoDB Positron for a clean, beige-friendly look */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        <Marker position={position} icon={customIcon}>
          <Popup>Current Location: In Transit</Popup>
        </Marker>
        <Polyline 
          positions={[position, destination]} 
          color="#2563EB" 
          weight={3} 
          dashArray="10, 10" 
        />
      </MapContainer>
    </div>
  );
}
