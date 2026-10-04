import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFriendlyError } from '../../api/client';
import { riderApi } from '../../api/rider';
import { supportApi } from '../../api/support';
import { LagosMap } from '../../shared/components/LagosMap';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { useRideRealtime } from '../../shared/hooks/useRideRealtime';
import type { RideStatus } from '../../types/ride';
import { AlertCircle, CheckCircle2, ChevronRight, Navigation2, ShieldAlert, X } from 'lucide-react';

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

const nextStatus: Partial<Record<RideStatus, RideStatus>> = {
  MATCHING: 'MATCHED',
  MATCHED: 'DRIVER_ARRIVING',
  DRIVER_ARRIVING: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED'
};

const statusOrder: RideStatus[] = ['MATCHING', 'MATCHED', 'DRIVER_ARRIVING', 'IN_PROGRESS', 'COMPLETED'];

export function LiveTracking() {
  const { ride, setRide, events, loading, error, setError, isConnected, refresh } = useRideRealtime();
  const [busy, setBusy] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (ride && ride.status === 'COMPLETED') {
      setTimeout(() => navigate('/rider/history'), 3000);
    }
  }, [ride, navigate]);

  async function advance() {
    if (!ride) return;
    const status = nextStatus[ride.status];
    if (!status) return;
    setBusy(true);
    setError('');
    try {
      setRide(await riderApi.advanceRide(ride.id, status));
      await refresh();
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!ride) return;
    setBusy(true);
    setError('');
    try {
      await riderApi.advanceRide(ride.id, 'CANCELLED');
      navigate('/rider/history');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function triggerSos() {
    if (!ride) return;
    setBusy(true);
    setError('');
    setSosMessage('');
    try {
      const alert = await supportApi.triggerSos(ride);
      setSosMessage(`SOS ${alert.id} sent to safety desk and ${alert.emergencyContacts?.length || 0} contacts.`);
      await refresh();
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading current ride..." />;

  if (!ride) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto">
        <img src="/gidiride-logo-transparent.png" alt="GidiRide" className="w-24 mb-6 opacity-50" />
        <span className="text-[#00A859] text-sm font-bold uppercase tracking-widest mb-2">No Active Trip</span>
        <h2 className="text-3xl font-bold text-white mb-4">You do not have a ride in motion.</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">Book a ride first, then come back here to watch driver ETA, track real-time routes, and access safety controls.</p>
        <Link to="/rider/book" className="bg-[#00A859] hover:bg-[#008f4c] text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,168,89,0.3)]">
          Book a New Ride
        </Link>
      </section>
    );
  }

  if (ride.status === 'CANCELLED') {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <X className="text-red-500 w-10 h-10" />
        </div>
        <span className="text-red-500 text-sm font-bold uppercase tracking-widest mb-2">Ride Cancelled</span>
        <h2 className="text-3xl font-bold text-white mb-4">This ride was cancelled.</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          {ride.pickup.name} → {ride.dropoff.name} is no longer active.
        </p>
        <button 
          className="bg-[#00A859] hover:bg-[#008f4c] text-white px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(0,168,89,0.3)]"
          onClick={async () => { await riderApi.dismissCurrentRide(ride.id); setRide(null); }}
        >
          Dismiss & Book Again
        </button>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start max-w-7xl mx-auto">
      
      {/* Map Column */}
      <article className="rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative sticky top-6">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl whitespace-nowrap">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {sosMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-red-600 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl whitespace-nowrap border border-red-400">
            <ShieldAlert size={18} /> {sosMessage}
          </div>
        )}
        
        <LagosMap ride={ride} />
      </article>

      {/* Control Panel Column */}
      <aside className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <span className="text-gray-400 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00A859] animate-pulse' : 'bg-yellow-500'}`} />
            {isConnected ? 'Live Data Sync' : 'Reconnecting...'}
          </span>
          <span className="text-[#00A859] font-bold text-sm bg-[#00A859]/10 px-3 py-1 rounded-full">
            {ride.status.replace('_', ' ')}
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-2 truncate">{ride.pickup?.area || 'Unknown Pickup'}</h2>
          <div className="flex items-center text-gray-500 mb-2">
            <div className="w-[2px] h-6 bg-gray-700 ml-2 mr-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-300 truncate">{ride.dropoff?.area || 'Unknown Dropoff'}</h2>
        </div>

        {ride.driver && (
          <div className="bg-gray-800/50 rounded-2xl p-4 flex items-center gap-4 border border-gray-700">
            <div className="w-12 h-12 rounded-full bg-[#00A859] text-white font-bold text-xl flex items-center justify-center shadow-lg">
              {ride.driver.name ? ride.driver.name.charAt(0) : 'D'}
            </div>
            <div className="flex-1">
              <strong className="text-white block">{ride.driver.name || 'Unknown Driver'}</strong>
              <small className="text-gray-400 block">{ride.driver.vehicle || 'Unknown Vehicle'} • {ride.driver.plateNumber || 'Unknown Plate'}</small>
              <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
                ⭐ {typeof ride.driver.rating === 'number' ? ride.driver.rating.toFixed(1) : '5.0'}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <span className="block text-xs text-gray-500 mb-1">Total Fare</span>
            <strong className="text-lg text-white">{money(ride.totalFare)}</strong>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <span className="block text-xs text-gray-500 mb-1">Driver ETA</span>
            <strong className="text-lg text-[#00A859]">{ride.driver?.etaMin ?? '--'} min</strong>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <span className="block text-xs text-gray-500 mb-1">Distance</span>
            <strong className="text-lg text-white">{ride.distanceKm} km</strong>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
            <span className="block text-xs text-gray-500 mb-1">Method</span>
            <strong className="text-lg text-white">{ride.paymentMethod}</strong>
          </div>
        </div>

        {/* Timeline */}
        <div className="border border-gray-800 rounded-2xl p-4 bg-gray-900/50">
          <div className="flex justify-between text-xs font-bold text-gray-600 mb-2 px-1">
            {statusOrder.map((step, idx) => {
              const isPast = statusOrder.indexOf(ride.status) >= idx;
              const isCurrent = step === ride.status;
              return (
                <div key={step} className="flex flex-col items-center gap-1 w-1/5">
                  <div className={`w-full h-1 rounded-full ${isCurrent ? 'bg-[#00A859] shadow-[0_0_10px_#00A859]' : isPast ? 'bg-[#00A859]/50' : 'bg-gray-800'}`} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 text-xs font-bold">
          <span className="bg-emerald-900/40 text-emerald-500 px-3 py-1.5 rounded-full border border-emerald-800 flex items-center gap-1">
            <ShieldAlert size={14} /> SOS Ready
          </span>
          {ride.safety?.shareTrip && (
            <span className="bg-blue-900/40 text-blue-500 px-3 py-1.5 rounded-full border border-blue-800 flex items-center gap-1">
              <Navigation2 size={14} /> Shared
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <button 
            className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,168,89,0.2)]"
            disabled={busy || !nextStatus[ride.status]} 
            onClick={advance}
          >
            {nextStatus[ride.status] ? `Simulate: Move to ${nextStatus[ride.status]?.replace('_', ' ')}` : 'Trip Finalised'}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            {!['COMPLETED', 'CANCELLED'].includes(ride.status) && (
              <button 
                className="bg-transparent hover:bg-gray-800 text-gray-300 py-3 rounded-xl font-bold transition-colors border border-gray-700 disabled:opacity-50"
                disabled={busy} 
                onClick={cancel}
              >
                Cancel Ride
              </button>
            )}
            <button 
              className="bg-red-900/40 hover:bg-red-900/60 text-red-500 py-3 rounded-xl font-bold transition-colors border border-red-800 disabled:opacity-50 flex justify-center items-center gap-2"
              disabled={busy || ['COMPLETED', 'CANCELLED'].includes(ride.status)} 
              onClick={triggerSos}
            >
              <ShieldAlert size={18} /> SOS Panic
            </button>
          </div>
        </div>

      </aside>
    </section>
  );
}
