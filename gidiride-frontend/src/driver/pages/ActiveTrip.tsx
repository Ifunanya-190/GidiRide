import { useEffect, useState } from 'react';
import { driverApi } from '../../api/driver';
import { getFriendlyError } from '../../api/client';
import { supportApi } from '../../api/support';
import { getStoredUser } from '../../auth/session';
import { LagosMap } from '../../shared/components/LagosMap';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { RideRequest, RideStatus } from '../../types/ride';
import { motion } from 'framer-motion';
import { ShieldAlert, Car, MapPin, Navigation2, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

const driverNext: Partial<Record<RideStatus, { label: string; status: RideStatus }>> = {
  MATCHED: { label: 'I am arriving', status: 'DRIVER_ARRIVING' },
  DRIVER_ARRIVING: { label: 'Start trip', status: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Complete trip', status: 'COMPLETED' }
};

export function ActiveTrip() {
  const [trip, setTrip] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sosMessage, setSosMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = () => {
      driverApi
        .getActiveTrip()
        .then((data) => mounted && setTrip(data))
        .catch((err) => mounted && setError(getFriendlyError(err)))
        .finally(() => mounted && setLoading(false));
    };
    load();
    const interval = window.setInterval(load, 3000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  async function update(status: RideStatus) {
    setBusy(true);
    setError('');
    try {
      setTrip(await driverApi.updateActiveTripStatus(status));
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function triggerSos() {
    if (!trip) return;
    setBusy(true);
    setError('');
    setSosMessage('');
    try {
      const user = getStoredUser();
      const alert = await supportApi.triggerDriverSos(trip, user?.fullName || 'Driver');
      setSosMessage(`SOS ${alert.id} sent to the admin safety desk.`);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading active trip..." />;

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto">
        <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center shadow-xl mb-6 border border-gray-800">
          <img src="/gidiride-logo-transparent.png" alt="GidiRide" className="w-16 h-16 object-contain" />
        </div>
        <p className="text-[#00A859] font-bold tracking-widest uppercase text-sm mb-2">No Active Trip</p>
        <h2 className="text-3xl font-black text-white mb-4">Accept a request first.</h2>
        <p className="text-gray-400">When you accept a rider request, navigation and trip status controls will appear here automatically.</p>
      </div>
    );
  }

  const next = driverNext[trip.status];

  if (['CANCELLED', 'COMPLETED'].includes(trip.status)) {
    const isCompleted = trip.status === 'COMPLETED';
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto">
        {isCompleted ? (
          <CheckCircle2 className="w-24 h-24 text-[#00A859] mb-6 drop-shadow-[0_0_15px_rgba(0,168,89,0.3)]" />
        ) : (
          <XCircle className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
        )}
        <p className={`${isCompleted ? 'text-[#00A859]' : 'text-red-500'} font-bold tracking-widest uppercase text-sm mb-2`}>
          {isCompleted ? 'Trip Completed' : 'Ride Cancelled'}
        </p>
        <h2 className="text-3xl font-black text-white mb-4">
          {isCompleted ? 'Great job on another trip!' : 'This trip was cancelled.'}
        </h2>
        <p className="text-gray-400 mb-8">
          {trip.pickup?.name} → {trip.dropoff?.name} is {isCompleted ? 'finished' : 'no longer active'}. 
          {isCompleted && trip.totalFare && typeof trip.serviceFee === 'number' && (
            <span className="block mt-2 font-bold text-white">Net earnings: {money(trip.totalFare - trip.serviceFee)}</span>
          )}
        </p>
        <button 
          className="bg-gray-800 text-white font-bold px-8 py-3 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
          onClick={async () => { await driverApi.dismissActiveTrip().catch(() => {}); setTrip(null); }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} /> <p>{error}</p>
        </div>
      )}
      
      {sosMessage && (
        <div className="bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 size={20} /> <p>{sosMessage}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start h-full">
        {/* Map View */}
        <div className="w-full lg:w-2/3 rounded-3xl overflow-hidden border border-gray-800 shadow-xl bg-[#111]">
          <LagosMap ride={trip} />
        </div>

        {/* Control Panel */}
        <div className="w-full lg:w-1/3 bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
          
          <div className="border-b border-gray-800 pb-4">
            <p className="text-[#00A859] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2"><Navigation2 size={14} /> Driver Navigation</p>
            <h2 className="text-3xl font-black text-white">{trip.status.replace('_', ' ')}</h2>
            <p className="text-gray-400 font-medium text-sm mt-1 truncate">{trip.pickup?.name} → {trip.dropoff?.name}</p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Rider</span>
              <strong className="text-white">{trip.riderName ? trip.riderName.split(' ')[0] : `Rider ${trip.riderId?.slice(-4)?.toUpperCase() || ''}`}</strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Pickup</span>
              <strong className="text-white text-right max-w-[150px] truncate">{trip.pickup?.area}</strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Dropoff</span>
              <strong className="text-white text-right max-w-[150px] truncate">{trip.dropoff?.area}</strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Distance</span>
              <strong className="text-white">{trip.distanceKm} km</strong>
            </div>
            <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-800">
              <span className="text-gray-400 font-bold">Rider Fare</span>
              <strong className="text-white text-xl font-bold">{money(trip.totalFare || 0)}</strong>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#00A859] font-bold">Your Earnings</span>
              <strong className="text-[#00A859] text-xl font-black">{money((trip.totalFare || 0) - (trip.serviceFee || 0))}</strong>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
              <MapPin size={12} /> Live Tracking Hook
            </span>
            {trip.safety?.femaleDriverOnly && (
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1">
                <ShieldAlert size={12} /> Female Driver Required
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {next && (
              <button 
                className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(0,168,89,0.3)] transition-all disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                disabled={busy} 
                onClick={() => update(next.status)}
              >
                {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Car size={20} /> {next.label}</>}
              </button>
            )}
            
            {!['COMPLETED', 'CANCELLED'].includes(trip.status) && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  disabled={busy} 
                  onClick={triggerSos}
                >
                  <ShieldAlert size={16} /> SOS
                </button>
                <button 
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm"
                  disabled={busy} 
                  onClick={() => update('CANCELLED')}
                >
                  Cancel Trip
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
