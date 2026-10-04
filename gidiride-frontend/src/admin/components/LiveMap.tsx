import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { AdminAnalyticsSnapshot } from '../../types/analytics';

// Fix Leaflet's default icon path issues in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A custom green car icon for vehicles
const carIcon = new L.DivIcon({
  html: `<div style="background-color: #00A859; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,168,89,0.8);"></div>`,
  className: 'live-car-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// Mock simulation of moving vehicles
function generateMockVehicles(count: number, centerLat: number, centerLng: number) {
  const vehicles = [];
  for (let i = 0; i < Math.min(count, 50); i++) {
    // Generate within a ~20km radius of center (approx 0.2 degrees)
    const lat = centerLat + (Math.random() - 0.5) * 0.4;
    const lng = centerLng + (Math.random() - 0.5) * 0.4;
    vehicles.push({ id: `veh-${i}`, lat, lng, speed: Math.random() * 0.001 });
  }
  return vehicles;
}

export function LiveMap({ snapshot }: { snapshot: AdminAnalyticsSnapshot }) {
  // Center roughly on Nigeria (Abuja is roughly 9.0820, 8.6753, but Lagos is more active, so let's default to Lagos/Nigeria center)
  // Let's use a central point for Nigeria: 9.0820, 8.6753. Or 6.5244, 3.3792 for Lagos focus if no hotzones exist.
  const defaultCenter = [9.0820, 8.6753] as [number, number];
  
  const hotzones = snapshot.heatMap || [];
  const mapCenter = hotzones.length > 0 ? [hotzones[0].lat, hotzones[0].lng] as [number, number] : defaultCenter;
  
  const [vehicles, setVehicles] = useState(() => generateMockVehicles(snapshot.totals?.activeDrivers || 15, mapCenter[0], mapCenter[1]));

  // Simulate vehicle movement
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(current => current.map(v => ({
        ...v,
        lat: v.lat + (Math.random() - 0.5) * v.speed,
        lng: v.lng + (Math.random() - 0.5) * v.speed,
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-gray-800 z-0 relative isolate">
      <MapContainer 
        center={mapCenter} 
        zoom={hotzones.length > 0 ? 11 : 6} 
        style={{ width: '100%', height: '100%', backgroundColor: '#0a1412' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Render Hot Zones */}
        {hotzones.map(zone => (
          <CircleMarker
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={Math.max(20, zone.intensity * 2)}
            pathOptions={{ color: '#EAB308', fillColor: '#EAB308', fillOpacity: 0.2, weight: 1 }}
          >
            <Popup className="bg-gray-900 border-gray-800 text-white">
              <strong className="block text-sm">{zone.area}</strong>
              <span className="text-xs text-gray-500">Intensity: {zone.intensity}</span>
            </Popup>
          </CircleMarker>
        ))}

        {/* Render Live Vehicles */}
        {vehicles.map(v => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={carIcon} />
        ))}
      </MapContainer>
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-none">
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A859] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00A859]"></span>
          </div>
          <span className="text-white text-xs font-bold uppercase tracking-wider">Live Tracking</span>
        </div>
      </div>
    </div>
  );
}
