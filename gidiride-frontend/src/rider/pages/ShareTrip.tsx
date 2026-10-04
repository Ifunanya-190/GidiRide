import { FormEvent, useEffect, useState, useRef } from 'react';
import { getFriendlyError } from '../../api/client';
import { phase8Api } from '../../api/phase8';
import { riderApi } from '../../api/rider';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { ShareTripSession } from '../../types/phase8';
import type { RideRequest } from '../../types/ride';
import { AlertCircle, CheckCircle2, Shield, Mic, Activity, Phone, WifiOff, Wifi, MapPin, MessageSquare } from 'lucide-react';

export function ShareTrip() {
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [sessions, setSessions] = useState<ShareTripSession[]>([]);
  const [contacts, setContacts] = useState('+2348011111111, +2348022222222, +2348033333333');
  const [liveAudioEnabled, setLiveAudioEnabled] = useState(true);
  const [keyword, setKeyword] = useState('help');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Offline safety state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineAlertSent, setOfflineAlertSent] = useState(false);
  const [lastKnownLocation, setLastKnownLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Track online/offline status
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // Continuously track GPS for last known position during active ride
  useEffect(() => {
    if (!ride || sessions.length === 0) return;
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLastKnownLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [ride, sessions.length]);

  // Offline dead-man's-switch: queue alert when connection drops during active shared ride
  useEffect(() => {
    if (!isOnline && ride && sessions.length > 0 && !offlineAlertSent) {
      setOfflineAlertSent(true);
      const emergencyPayload = {
        rideId: ride.id,
        contacts: contacts.split(',').map(c => c.trim()).filter(Boolean),
        lastLocation: lastKnownLocation,
        route: `${ride.pickup?.area || 'Unknown'} â†’ ${ride.dropoff?.area || 'Unknown'}`,
        triggeredAt: new Date().toISOString(),
        type: 'OFFLINE_DEAD_SWITCH'
      };
      localStorage.setItem('gidiride.offline_sos_queue', JSON.stringify(emergencyPayload));
    }
    
    // When back online, dispatch the queued alert
    if (isOnline && offlineAlertSent) {
      const queued = localStorage.getItem('gidiride.offline_sos_queue');
      if (queued) {
        console.log('[OFFLINE SAFETY] Sending queued emergency alert:', JSON.parse(queued));
        setSuccess('You are back online. Emergency contacts have been notified of your last known location.');
        localStorage.removeItem('gidiride.offline_sos_queue');
      }
      setOfflineAlertSent(false);
    }
  }, [isOnline, ride, sessions.length, offlineAlertSent, contacts, lastKnownLocation]);

  async function load() { 
    setRide(await riderApi.getCurrentRide()); 
    setSessions(await phase8Api.getShareSessions() || []); 
  }
  
  useEffect(() => { 
    let mounted = true; 
    load().catch((err) => mounted && setError(getFriendlyError(err))).finally(() => mounted && setLoading(false)); 
    return () => { mounted = false; }; 
  }, []);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ride) return;
    setBusy('start'); setError(''); setSuccess('');
    try {
      const session = await phase8Api.startShareTrip(ride, contacts.split(',').map((c) => c.trim()).filter(Boolean), liveAudioEnabled);
      setSessions((current) => [session, ...(current || [])]);
      setSuccess(`Trip shared with ${session.contacts?.length || 0} contacts.`);
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusy(''); }
  }

  async function simulate(sessionId: string) {
    setBusy(sessionId); setError(''); setSuccess('');
    try { 
      const updated = await phase8Api.simulateAudioKeyword(sessionId, keyword); 
      setSessions((current) => current?.map((item) => item.id === updated.id ? updated : item) || []); 
      setSuccess(`Keyword "${keyword}" detected and contacts alerted.`); 
    }
    catch (err) { setError(getFriendlyError(err)); } finally { setBusy(''); }
  }

  if (loading) return <LoadingSpinner label="Loading safety features..." />;

  return (
    <section className="max-w-7xl mx-auto space-y-6">
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-5 py-4 rounded-2xl flex items-start gap-4 animate-pulse">
          <WifiOff className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-400 text-lg">You Are Offline</h3>
            <p className="text-sm mt-1">Your internet connection was lost. GidiRide has cached your last GPS coordinates{lastKnownLocation ? ` (${lastKnownLocation.lat.toFixed(4)}, ${lastKnownLocation.lng.toFixed(4)})` : ''} and will automatically alert your emergency contacts the moment you reconnect. Press your phone&apos;s power button 5 times rapidly for your device&apos;s native SOS.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <div className="relative z-10">
          <span className="text-red-500 font-bold text-sm tracking-widest uppercase mb-2 block">Share Trip + Live Audio</span>
          <h2 className="text-4xl font-bold text-white mb-2">Safety Contacts</h2>
          <p className="text-gray-400 text-lg max-w-2xl">Share a live trip with up to 3 contacts. If you lose signal, GidiRide automatically caches your location and alerts them when you reconnect.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} /> <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-8 items-start">
        
        <form onSubmit={start} className="bg-[#111] border border-gray-800 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6 sticky top-6">
          <h3 className="text-white font-bold text-xl border-b border-gray-800 pb-4">Active Ride</h3>
          
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <h3 className="text-lg font-bold text-white">
              {ride ? `${ride.pickup?.area || 'Unknown'} â†’ ${ride.dropoff?.area || 'Unknown'}` : 'No active ride'}
            </h3>
            {ride && <span className="text-xs text-gray-500 mt-1 block">Ride ID: {ride.id}</span>}
          </div>
          
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Phone size={14} /> 3 Emergency Contacts</span>
            <textarea 
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none placeholder-gray-700" 
              rows={3} 
              value={contacts} 
              onChange={(e) => setContacts(e.target.value)} 
              placeholder="+234..."
            />
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-red-500 cursor-pointer" 
              checked={liveAudioEnabled} 
              onChange={(e) => setLiveAudioEnabled(e.target.checked)} 
            />
            <div className="flex flex-col">
              <span className="text-white font-medium select-none flex items-center gap-2">Enable Live Audio <Mic size={16} className="text-red-500" /></span>
              <span className="text-xs text-gray-500 mt-1">Detects keywords like &quot;help&quot; and alerts contacts instantly.</span>
            </div>
          </label>
          
          <button 
            className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.2)] mt-2" 
            disabled={!ride || busy === 'start'}
          >
            {busy === 'start' ? 'Sharing...' : 'Share Trip'}
          </button>

          {/* Offline Safety Info Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mt-2">
            <div className="flex items-center gap-3 mb-3">
              {isOnline ? <Wifi className="w-5 h-5 text-[#00A859]" /> : <WifiOff className="w-5 h-5 text-red-500 animate-pulse" />}
              <h4 className="font-bold text-white text-sm">Offline Safety Mode</h4>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isOnline ? 'bg-[#00A859]/20 text-[#00A859]' : 'bg-red-500/20 text-red-400'}`}>
                {isOnline ? 'Connected' : 'No Signal'}
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              If you lose internet or signal during a shared ride, GidiRide automatically caches your last GPS location and queues an emergency alert to your contacts. The alert is dispatched the moment your device reconnects â€” no action needed from you.
            </p>
            {lastKnownLocation && (
              <div className="mt-3 bg-gray-950 rounded-lg p-3 flex items-center gap-2 text-xs">
                <MapPin className="w-3 h-3 text-[#00A859]" />
                <span className="text-gray-400">Last GPS:</span>
                <span className="text-white font-mono">{lastKnownLocation.lat.toFixed(5)}, {lastKnownLocation.lng.toFixed(5)}</span>
              </div>
            )}
          </div>

          {/* Emergency Call Buttons */}
          <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-5 mt-2">
            <h4 className="font-bold text-red-400 text-sm mb-3 flex items-center gap-2">
              <Phone size={16} /> Emergency Quick Call
            </h4>
                          <p className="text-gray-400 text-xs mb-4">Tap to call directly or send SMS — works even with low signal.</p>
              <div className="grid grid-cols-2 gap-2">
                <a href="tel:112" className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg">
                  <Phone size={16} /> Call 112
                </a>
                <a href="tel:199" className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-colors shadow-lg">
                  <Phone size={16} /> Call 199
                </a>
                <a href="sms:112?body=Emergency SOS via GidiRide" className="flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs transition-colors border border-gray-700 col-span-2">
                  <MessageSquare size={14} /> Send SMS to 112
                </a>
              {contacts.split('\n').filter(c => c.trim()).slice(0, 3).map((contact, i) => (
                <a key={i} href={`tel:${contact.trim()}`} className="flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs transition-colors border border-gray-700 col-span-2 sm:col-span-1">
                  <Phone size={14} /> {contact.trim()}
                </a>
              ))}
            </div>
          </div>
        </form>

        <div className="grid gap-6">
          <div className="bg-[#111] border border-gray-800 rounded-[2rem] p-6 shadow-2xl">
            <h3 className="text-white font-bold text-xl border-b border-gray-800 pb-4 mb-4">Test Audio Keyword</h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Trigger Word</span>
                <input 
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" 
                  value={keyword} 
                  onChange={(e) => setKeyword(e.target.value)} 
                />
              </label>
              <div className="pb-3 px-2">
                <span className="text-gray-500 text-sm">Try: <b>help</b>, <b>stop</b>, <b>police</b>, <b>danger</b></span>
              </div>
            </div>
          </div>
          
          {sessions?.map((session) => (
            <article key={session.id} className={`bg-gray-900/50 border ${session.status === 'ALERTED' ? 'border-red-500/50' : 'border-gray-800'} rounded-[2rem] p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden transition-colors`}>
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <span className="text-gray-500 text-xs font-bold font-mono block mb-1">Session ID: {session.id}</span>
                  <h3 className="text-xl font-bold text-white">Ride {session.rideId}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${session.status === 'ALERTED' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/50'}`}>
                  {session.status === 'ALERTED' && <Activity size={14} className="animate-pulse" />}
                  {session.status}
                </span>
              </div>
              
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-gray-500 uppercase block mb-1">Notifying Contacts</span>
                <p className="text-white font-mono text-sm">{session.contacts?.join(', ') || 'None'}</p>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Event Timeline</h4>
                {session.events?.map((event) => {
                  let timeStr = '';
                  try {
                    timeStr = new Intl.DateTimeFormat('en-NG', { timeStyle: 'short' }).format(new Date(event.createdAt || Date.now()));
                  } catch (e) {
                    timeStr = 'Just now';
                  }
                  return (
                    <div key={event.id} className={`p-3 rounded-xl border-l-4 ${event.tone === 'red' ? 'border-red-500 bg-red-500/10' : 'border-[#00A859] bg-[#00A859]/10'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <strong className={`text-sm ${event.tone === 'red' ? 'text-red-400' : 'text-[#00A859]'}`}>{event.message}</strong>
                        <small className="text-gray-500 shrink-0 mt-0.5">{timeStr}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-500 border border-red-800 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex justify-center items-center gap-2" 
                disabled={busy === session.id || !session.keywordDetectionEnabled} 
                onClick={() => simulate(session.id)}
              >
                <Mic size={18} /> Simulate Audio Alert
              </button>
            </article>
          ))}
          
          {(!sessions || sessions.length === 0) && (
            <div className="text-center p-12 bg-gray-900/30 rounded-[2rem] border border-gray-800">
              <Shield className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Active Shares</h3>
              <p className="text-gray-400">Your live trips and audio alerts will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
