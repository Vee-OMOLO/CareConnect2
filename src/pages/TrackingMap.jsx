import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import PageHeader from '../components/PageHeader';
import Toggle from '../components/Toggle';
import { useToast } from '../components/Toast';
import { SkeletonMap } from '../components/Skeleton';
import { activityColors } from '../constants/activityData';

const activityColorMap = activityColors;
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const caregiverIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:32px;height:32px;background:#041627;border-radius:8px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center">
    <span class="material-symbols-outlined" style="color:white;font-size:18px">person</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function LocationUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 18);
  }, [position, map]);
  return null;
}

export default function TrackingMap() {
  const [position, setPosition] = useState(null);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const watchIdRef = useRef(null);
  const defaultPosition = [-1.2921, 36.8219];
  const toast = useToast();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => { setError('Location access denied. Using default.'); setPosition(defaultPosition); },
        { enableHighAccuracy: true }
      );
    } else { setPosition(defaultPosition); }
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  function toggleTracking() {
    if (watching) {
      if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
      setWatching(false);
    } else if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => { setError('Could not track location'); setWatching(false); },
        { enableHighAccuracy: true, maximumAge: 10000, distanceFilter: 10 }
      );
      setWatching(true);
    }
  }

  function copyMapsLink() {
    if (position) {
      navigator.clipboard.writeText(`https://www.google.com/maps?q=${position[0]},${position[1]}`);
      toast.success('Location link copied!');
    }
  }

  const recentLocations = [
    { name: 'Home', address: '123 Oak Street', time: 'Current', status: 'active', icon: 'home', type: 'play' },
    { name: "Children's Hospital", address: '456 Medical Ave', time: 'Yesterday', status: 'visited', icon: 'local_hospital', type: 'medicine' },
    { name: 'City Pharmacy', address: '789 Main St', time: 'Mar 13', status: 'visited', icon: 'local_pharmacy', type: 'feeding' },
    { name: 'Central Park', address: '101 Park Lane', time: 'Mar 12', status: 'visited', icon: 'park', type: 'play' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="GPS Tracking" subtitle="Real-time location" onBack />

      {/* Toggle */}
      <div className="card p-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${watching ? 'bg-health-bg' : 'bg-surface-container-low'}`}>
              <span className={`material-symbols-outlined ${watching ? 'text-health' : 'text-outline'} text-[20px]`}>location_on</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Live Tracking</p>
              <p className="text-xs text-outline">{watching ? 'Active' : 'Tap to start'}</p>
            </div>
          </div>
          <Toggle checked={watching} onChange={toggleTracking} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-medicine-bg px-3 py-2 rounded-xl text-sm font-medium text-medicine animate-fade-in-up">
          <span className="material-symbols-outlined text-[16px]">info</span>
          {error}
        </div>
      )}

      {/* Map */}
      {!position ? (
        <SkeletonMap />
      ) : (
        <div className="rounded-xl overflow-hidden animate-scale-in" style={{ height: 'clamp(200px, 40vw, 400px)' }}>
          <MapContainer
            center={position}
            zoom={18}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            whenReady={() => setMapReady(true)}
          >
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position} icon={caregiverIcon}>
              <Popup><div className="text-center text-sm"><strong>Caregiver</strong><br />{position[0].toFixed(6)}, {position[1].toFixed(6)}</div></Popup>
            </Marker>
            <LocationUpdater position={position} />
          </MapContainer>
        </div>
      )}

      {/* Coordinates */}
      {position && (
        <div className="card p-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] text-outline font-medium">Coordinates</p>
              <p className="text-sm font-mono font-semibold text-on-surface truncate">{position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
            </div>
            <button onClick={copyMapsLink} className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface card-interactive flex-shrink-0">Copy</button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.06s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">History</h2>
        <div className="flex flex-col gap-2">
          {recentLocations.map(loc => (
            <div key={loc.name} className="card p-3" style={{ borderLeft: `3px solid ${activityColors[loc.type]?.text || '#74777d'}` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activityColors[loc.type]?.bg || '#edeeef' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: activityColors[loc.type]?.text || '#44474c' }}>{loc.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{loc.name}</p>
                  <p className="text-xs text-outline">{loc.address}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${loc.status === 'active' ? 'bg-health-bg text-health' : 'bg-surface-container-low text-outline'}`}>
                    {loc.status === 'active' ? 'Active' : 'Visited'}
                  </span>
                  <p className="text-[10px] text-outline mt-0.5">{loc.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
