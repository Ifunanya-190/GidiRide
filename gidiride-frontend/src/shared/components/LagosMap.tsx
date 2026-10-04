import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, ArrowUpRight, ArrowLeft, ArrowRight, Volume2, VolumeX, Crosshair, User } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LagosLocation, RideRequest } from '../../types/ride';

interface LagosMapProps {
  pickup?: LagosLocation;
  dropoff?: LagosLocation;
  ride?: RideRequest | null;
  compact?: boolean;
}

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];

/* ── Marker Icons ── */
const createCustomIcon = (color: string, icon: React.ReactElement, pulse = false) => {
  const html = renderToStaticMarkup(
    <div style={{
      backgroundColor: '#111827', border: `2px solid ${color}`, color,
      borderRadius: '50%', width: '32px', height: '32px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: pulse ? `0 0 15px ${color}` : `0 0 10px ${color}80`,
      animation: pulse ? 'pulse 2s infinite' : 'none'
    }}>{icon}</div>
  );
  return L.divIcon({ html, className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] });
};

const pickupIcon  = createCustomIcon('#059669', <MapPin size={18} />);
const dropoffIcon = createCustomIcon('#3B82F6', <MapPin size={18} />);
const driverIcon  = createCustomIcon('#F59E0B', <Navigation size={18} />);
const liveCarIcon = createCustomIcon('#00A859', <Navigation size={18} />, true);

/* ── OSRM Step Interface ── */
interface OsrmStep {
  distance: number;  // metres
  duration: number;  // seconds
  name: string;
  maneuver: { type: string; modifier?: string };
  geometry: { coordinates: number[][] };
}

/* ── Helper: build a human-readable instruction from an OSRM step ── */
function buildInstruction(step: OsrmStep): string {
  const t = step.maneuver.type;
  const m = step.maneuver.modifier || '';
  const road = step.name || 'the road';

  if (t === 'depart')   return `Head ${m} on ${road}`;
  if (t === 'arrive')   return `You are arriving at your destination`;
  if (t === 'turn')     return `Turn ${m} onto ${road}`;
  if (t === 'end of road') return `At the end of the road, turn ${m} onto ${road}`;
  if (t === 'fork')     return `Keep ${m} at the fork onto ${road}`;
  if (t === 'merge')    return `Merge ${m} onto ${road}`;
  if (t === 'new name') return `Continue onto ${road}`;
  if (t === 'roundabout' || t === 'rotary') return `At the roundabout, take exit onto ${road}`;
  if (t === 'continue') return `Continue straight on ${road}`;
  // fallback
  return `${m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Continue'} on ${road}`;
}

/* ── Direction icon for the maneuver ── */
function DirectionIcon({ type, modifier }: { type: string; modifier?: string }) {
  if (type === 'turn' && modifier?.includes('left'))  return <ArrowLeft size={28} />;
  if (type === 'turn' && modifier?.includes('right')) return <ArrowRight size={28} />;
  return <ArrowUpRight size={28} />;
}

/* ── MapUpdater: auto-pans unless user has dragged/zoomed ── */
function MapUpdater({ pickup, dropoff, livePos, autoPan, setAutoPan }: {
  pickup?: LagosLocation; dropoff?: LagosLocation;
  livePos?: [number, number] | null; autoPan: boolean;
  setAutoPan: (v: boolean) => void;
}) {
  const map = useMapEvents({
    dragstart: () => { if (livePos) setAutoPan(false); },
    zoomstart: () => { if (livePos) setAutoPan(false); },
  });

  useEffect(() => {
    if (livePos) {
      if (autoPan) map.setView(livePos, 16, { animate: true, duration: 1 });
    } else if (pickup && dropoff) {
      map.fitBounds(L.latLngBounds([pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]), { padding: [50, 50] });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 14);
    } else if (dropoff) {
      map.setView([dropoff.lat, dropoff.lng], 14);
    }
  }, [map, pickup?.id, dropoff?.id, livePos, autoPan]);

  return null;
}

/* ════════════════════════════════════════════════════════════════ */
/*  LagosMap                                                       */
/* ════════════════════════════════════════════════════════════════ */
export function LagosMap({ pickup, dropoff, ride, compact }: LagosMapProps) {
  const activePickup  = pickup  || ride?.pickup;
  const activeDropoff = dropoff || ride?.dropoff;

  const [routeLine,  setRouteLine]  = useState<[number, number][] | null>(null);
  const [routeSteps, setRouteSteps] = useState<OsrmStep[]>([]);
  const [totalDistKm, setTotalDistKm] = useState(0);
  const [totalDurMin, setTotalDurMin]  = useState(0);

  // Navigation state
  const isNavigating = ride?.status === 'IN_PROGRESS';
  const [currentCarPos, setCurrentCarPos] = useState<[number, number] | null>(null);
  const [navInstruction, setNavInstruction] = useState('Proceed to route');
  const [navManeuver, setNavManeuver] = useState<{ type: string; modifier?: string }>({ type: 'depart' });
  const [distanceRemaining, setDistanceRemaining] = useState('');
  const [etaRemaining, setEtaRemaining] = useState('');

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const voiceEnabledRef = useRef(voiceEnabled);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  const [voiceGender, setVoiceGender]   = useState<'female' | 'male'>('female');
  const voiceGenderRef = useRef(voiceGender);
  useEffect(() => { voiceGenderRef.current = voiceGender; }, [voiceGender]);

  const [autoPan, setAutoPan]           = useState(true);

  /* 🚗 Voice helper 🚗 */
  const speak = (text: string) => {
    if (!voiceEnabledRef.current || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => {
      const n = v.name.toLowerCase();
      if (voiceGenderRef.current === 'female') return n.includes('female') || n.includes('samantha') || n.includes('zira') || n.includes('google uk english female');
      return n.includes('male') || n.includes('david') || n.includes('mark') || n.includes('google uk english male');
    });
    if (match) msg.voice = match;
    msg.rate = 0.95;
    window.speechSynthesis.speak(msg);
  };

  // Mute immediately when toggled off
  useEffect(() => { if (!voiceEnabled) window.speechSynthesis?.cancel(); }, [voiceEnabled]);
  // Preload voices
  useEffect(() => { window.speechSynthesis?.getVoices(); }, []);

  /* ── Fetch OSRM route WITH steps=true ── */
  useEffect(() => {
    if (!activePickup || !activeDropoff) { setRouteLine(null); setRouteSteps([]); return; }
    let mounted = true;
    const url = `https://router.project-osrm.org/route/v1/driving/` +
      `${activePickup.lng},${activePickup.lat};${activeDropoff.lng},${activeDropoff.lat}` +
      `?overview=full&geometries=geojson&steps=true`;

    fetch(url).then(r => r.json()).then(data => {
      if (!mounted || !data.routes?.[0]) return;
      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
      setRouteLine(coords);
      setTotalDistKm(+(route.distance / 1000).toFixed(1));
      setTotalDurMin(Math.ceil(route.duration / 60));
      setDistanceRemaining(`${(route.distance / 1000).toFixed(1)} km`);
      setEtaRemaining(`${Math.ceil(route.duration / 60)} min`);
      if (route.legs?.[0]?.steps) setRouteSteps(route.legs[0].steps);
    }).catch(() => { if (mounted) setRouteLine(null); });
    return () => { mounted = false; };
  }, [activePickup?.lat, activePickup?.lng, activeDropoff?.lat, activeDropoff?.lng]);

  /* ── Helper: Haversine distance in metres ── */
  const getDist = (p1: [number, number], p2: [number, number]) => {
    const R = 6371e3;
    const lat1 = p1[0] * Math.PI/180, lat2 = p2[0] * Math.PI/180;
    const dLat = (p2[0]-p1[0]) * Math.PI/180, dLon = (p2[1]-p1[1]) * Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1)*Math.cos(lat2) * Math.sin(dLon/2)*Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  /* ── Live Navigation Simulation ── */
  useEffect(() => {
    if (!isNavigating || !routeLine || routeLine.length < 2 || routeSteps.length === 0) return;

    setCurrentCarPos(routeLine[0]);
    setAutoPan(true);
    speak(`Starting route to ${activeDropoff?.name || 'destination'}. ${totalDistKm} kilometers, approximately ${totalDurMin} minutes.`);

    let lastStepIdx = -1;
    let spokenAcc = 0; // Prevent spamming same message

    const interval = setInterval(() => {
      setCurrentCarPos(prev => {
        if (!prev) return routeLine[0];
        const ci = routeLine.findIndex(p => p[0] === prev[0] && p[1] === prev[1]);
        const ni = ci >= 0 ? ci + 1 : 1;

        if (ni >= routeLine.length) {
          clearInterval(interval);
          const msg = 'You have arrived at your destination.';
          setNavInstruction(msg);
          setNavManeuver({ type: 'arrive' });
          setDistanceRemaining('0 km');
          setEtaRemaining('0 min');
          speak(msg);
          return routeLine[routeLine.length - 1];
        }

        // Calculate TRUE physical distance covered so far
        let distanceCovered = 0;
        for (let i = 0; i < ni; i++) {
          distanceCovered += getDist(routeLine[i], routeLine[i+1]);
        }
        
        let acc = 0;
        let stepIdx = 0;
        for (let i = 0; i < routeSteps.length; i++) {
          acc += routeSteps[i].distance;
          if (distanceCovered <= acc) {
            stepIdx = i;
            break;
          }
        }

        // Only speak if we entered a new step, AND we haven't just spammed speech for this specific location
        if (stepIdx > lastStepIdx) {
          const step = routeSteps[stepIdx];
          const instr = buildInstruction(step);
          
          // Distance remaining in THIS step
          const distMetres = acc - distanceCovered;
          
          // Avoid stuttering if points are extremely close
          if (Math.abs(distanceCovered - spokenAcc) > 10) {
            lastStepIdx = stepIdx;
            spokenAcc = distanceCovered;
            
            const prefix = distMetres >= 1000
              ? `In ${(distMetres / 1000).toFixed(1)} kilometers, `
              : distMetres > 50 ? `In ${Math.round(distMetres)} metres, ` : '';
            const voiceMsg = prefix + instr;
            setNavInstruction(instr);
            setNavManeuver(step.maneuver);
            speak(voiceMsg);
          }
        }

        // Remaining distance/time
        const ratio = Math.min(1, distanceCovered / (totalDistKm * 1000));
        const remainRatio = 1 - ratio;
        setDistanceRemaining(`${(totalDistKm * remainRatio).toFixed(1)} km`);
        setEtaRemaining(`${Math.max(1, Math.ceil(totalDurMin * remainRatio))} min`);

        return routeLine[ni];
      });
    }, 1500);

    return () => { clearInterval(interval); window.speechSynthesis?.cancel(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating, routeLine, routeSteps]);

  const fallback: [number, number][] = (activePickup && activeDropoff && !routeLine)
    ? [[activePickup.lat, activePickup.lng], [activeDropoff.lat, activeDropoff.lng]] : [];

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-gray-800 shadow-xl relative ${compact ? 'h-[250px]' : 'h-[500px]'}`}>
      <MapContainer center={LAGOS_CENTER} zoom={11} scrollWheelZoom={true} className="w-full h-full z-0 bg-[#0a0a0a]">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles-dark" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
        <MapUpdater pickup={activePickup} dropoff={activeDropoff} livePos={isNavigating ? currentCarPos : null} autoPan={autoPan} setAutoPan={setAutoPan} />

        {activePickup && !isNavigating && (
          <Marker position={[activePickup.lat, activePickup.lng]} icon={pickupIcon}>
            <Popup><strong className="text-emerald-500">Pickup</strong><br/>{activePickup.name}</Popup>
          </Marker>
        )}
        {activeDropoff && (
          <Marker position={[activeDropoff.lat, activeDropoff.lng]} icon={dropoffIcon}>
            <Popup><strong className="text-blue-500">Dropoff</strong><br/>{activeDropoff.name}</Popup>
          </Marker>
        )}
        {isNavigating && currentCarPos && (
          <Marker position={currentCarPos} icon={liveCarIcon}><Popup>Live Location</Popup></Marker>
        )}
        {ride?.driver && activePickup && !isNavigating && (
          <Marker position={[activePickup.lat - 0.002, activePickup.lng - 0.002]} icon={driverIcon}>
            <Popup>Driver ETA: {ride.driver.etaMin} min</Popup>
          </Marker>
        )}
        {routeLine && (<>
          <Polyline positions={routeLine} color="#000000" weight={8} opacity={0.6} />
          <Polyline positions={routeLine} color="#00A859" weight={4} opacity={1} />
        </>)}
        {fallback.length === 2 && (
          <Polyline positions={fallback} color="#059669" weight={4} dashArray="10, 10" className="animate-pulse opacity-60" />
        )}
      </MapContainer>

      {/* Recenter button – only visible when user has panned away during navigation */}
      {isNavigating && !autoPan && (
        <button onClick={() => setAutoPan(true)}
          className="absolute bottom-6 right-6 z-[1000] bg-[#00A859] text-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform"
          title="Recenter on car">
          <Crosshair size={24} />
        </button>
      )}

      {/* Turn-by-Turn Overlay */}
      {isNavigating && routeLine && (
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-gray-900/95 backdrop-blur-md px-5 py-4 rounded-2xl border border-[#00A859] shadow-2xl flex items-center gap-4">
          <div className="bg-[#00A859] text-white p-3 rounded-full shadow-lg">
            <DirectionIcon type={navManeuver.type} modifier={navManeuver.modifier} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-lg md:text-xl font-bold truncate">{navInstruction}</h3>
            <p className="text-gray-400 font-medium text-sm flex gap-2 truncate">
              <span>{distanceRemaining} remaining</span> • <span>Towards {activeDropoff?.area}</span>
            </p>
          </div>
          <div className="text-right border-l border-gray-700 pl-4 flex flex-col items-end shrink-0">
            <strong className="block text-[#00A859] text-2xl font-bold">{etaRemaining}</strong>
            <small className="text-gray-400 font-medium">ETA</small>
          </div>
          <div className="flex flex-col gap-2 ml-2 shrink-0">
            <button onClick={() => { setVoiceEnabled(v => !v); }}
              className={`p-2 rounded-full transition-colors ${voiceEnabled ? 'bg-[#00A859]/20 text-[#00A859]' : 'bg-red-500/20 text-red-500'}`}
              title={voiceEnabled ? 'Mute voice' : 'Unmute voice'}>
              {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            {voiceEnabled && (
              <button onClick={() => setVoiceGender(g => g === 'female' ? 'male' : 'female')}
                className="p-2 rounded-full bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
                title={`Switch to ${voiceGender === 'female' ? 'Male' : 'Female'} voice`}>
                <User size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Static Status Pill */}
      {!isNavigating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-gray-800 shadow-2xl flex flex-col items-center">
          <strong className="text-white text-sm font-bold uppercase tracking-wider">
            {ride?.status ? ride.status.replace('_', ' ') : 'Route Preview'}
          </strong>
          <small className="text-gray-400 font-medium">
            {activePickup && activeDropoff ? `${activePickup.area} → ${activeDropoff.area}` : 'Choose locations'}
            {totalDistKm > 0 && ` • ${totalDistKm} km • ${totalDurMin} min`}
          </small>
        </div>
      )}
    </div>
  );
}
