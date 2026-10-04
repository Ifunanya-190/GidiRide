import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverApi } from '../../api/driver';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { MapPin, Navigation, Car, AlertCircle, Clock, Loader2 } from 'lucide-react';

export function RideRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const fetchRequests = () => {
    setError(null);
    driverApi.getRideRequests()
      .then(res => setRequests(res || []))
      .catch(err => setError(getFriendlyError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await driverApi.respondToRequest(id, 'ACCEPTED');
      navigate('/driver/trip');
    } catch (err) {
      setError(getFriendlyError(err));
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await driverApi.respondToRequest(id, 'DECLINED');
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#00A859]/20 flex items-center justify-center">
          <Car className="text-[#00A859]" size={24} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#00A859] uppercase tracking-wider">Ride Matching</h2>
          <h1 className="text-3xl font-bold text-white">Ride Requests</h1>
          <p className="text-gray-400 mt-1">Available rides in your vicinity</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content */}
      {loading && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <LoadingSpinner />
          <p className="mt-4">Scanning for nearby requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mb-4">
            <Car className="text-gray-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Requests Found</h3>
          <p className="text-gray-500 max-w-sm">
            There are no active ride requests matching your location right now. Keep this screen open; new requests will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map(request => (
            <div key={request.id} className="bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 flex-grow space-y-6">
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#00A859]/20 text-[#00A859] mb-2">
                      {request.rideType || 'Standard'}
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {request.riderName || 'Rider'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      {formatMoney(request.totalFare || 0)}
                    </div>
                    {request.distance && (
                      <div className="text-sm text-gray-400 mt-1">
                        {(request.distance / 1000).toFixed(1)} km
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800/50 relative">
                  <div className="absolute left-[27px] top-[32px] bottom-[32px] w-[2px] bg-gray-800"></div>
                  
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="mt-1 bg-gray-900 rounded-full p-1 border border-gray-700">
                      <MapPin className="text-[#00A859]" size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pickup</p>
                      <p className="text-white font-medium">
                        {request.pickup?.area || request.pickup?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start relative z-10">
                    <div className="mt-1 bg-gray-900 rounded-full p-1 border border-gray-700">
                      <Navigation className="text-blue-500" size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dropoff</p>
                      <p className="text-white font-medium">
                        {request.dropoff?.area || request.dropoff?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Status: <span className="text-gray-300 font-semibold">{request.status?.replace('_', ' ') || 'UNKNOWN'}</span></span>
                  </div>
                </div>

              </div>

              {request.status === 'MATCHING' && (
                <div className="p-4 bg-gray-900/80 border-t border-gray-800 flex gap-4">
                  <button
                    onClick={() => handleDecline(request.id)}
                    disabled={actionLoading === request.id}
                    className="flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-red-900/40 hover:bg-red-900/60 text-red-500 border border-red-800 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={actionLoading === request.id}
                    className="flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-[#00A859] hover:bg-[#008f4c] text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === request.id ? <Loader2 className="animate-spin" size={20} /> : 'Accept Ride'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
