import { FormEvent, useEffect, useState } from 'react';
import { getFriendlyError } from '../../api/client';
import { lagosFeaturesApi } from '../../api/lagosFeatures';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { NumberField } from '../../shared/components/NumberField';
import type { BidFareRequest } from '../../types/lagos';

function money(value: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0); }

type RequestWithBids = Awaited<ReturnType<typeof lagosFeaturesApi.getOpenBidFares>>[number];

export function FareBids() { // trigger HMR
  const [requests, setRequests] = useState<RequestWithBids[]>([]);
  const [cashAmount, setCashAmount] = useState<Record<string, number>>({});
  const [acceptsBarter, setAcceptsBarter] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() { setRequests(await lagosFeaturesApi.getOpenBidFares()); }
  useEffect(() => {
    let mounted = true;
    load().catch((err) => mounted && setError(getFriendlyError(err))).finally(() => mounted && setLoading(false));
    const interval = window.setInterval(() => load().catch(() => undefined), 4000);
    return () => { mounted = false; window.clearInterval(interval); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>, request: BidFareRequest) {
    event.preventDefault();
    setBusyId(request.id); setError(''); setSuccess('');
    try {
      const bid = await lagosFeaturesApi.submitDriverBid(request.id, cashAmount[request.id] || request.proposedCash + 700, acceptsBarter[request.id] || false, message[request.id] || 'I can take this route now.');
      setSuccess(`Bid ${bid.id} sent to ${request.riderName}.`);
      await load();
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusyId(''); }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-gray-950">
      <LoadingSpinner label="Loading Lagos fare bids..." />
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen bg-gray-950">
      <div className="flex flex-col gap-2 border-b border-gray-800 pb-4">
        <p className="text-sm font-bold text-[#00A859] uppercase tracking-wider">Lagos bid board</p>
        <h1 className="text-3xl font-bold text-white">Fare Bids</h1>
        <p className="text-gray-400 text-sm">Counter rider fares with your cash price, ETA, and whether you accept barter.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {requests.length === 0 && !loading && (
         <div className="bg-[#111] border border-gray-800 rounded-3xl p-12 text-center text-gray-500 shadow-2xl">
           <h3 className="text-lg font-bold text-white mb-2">No active fare bids</h3>
           <p className="text-sm">When riders propose a custom price, they will appear here for you to counter.</p>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.map((request) => (
          <form key={request.id} onSubmit={(e) => submit(e, request)} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Trip ID: {request.id.slice(0, 8)}</p>
                <h3 className="text-xl font-bold text-white leading-tight">
                  {request.pickup.area} <span className="text-gray-600 mx-2">→</span> {request.dropoff.area}
                </h3>
                <p className="text-sm text-gray-400 mt-2">Rider: <span className="font-medium text-gray-300">{request.riderName}</span></p>
              </div>
              <div className="bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/30 px-3 py-1.5 rounded-xl whitespace-nowrap">
                <span className="text-sm font-black">{money(request.proposedCash)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-800/50">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Barter Proposed</span>
                <span className="text-sm font-medium text-white">{request.barterOffer || 'None'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Distance</span>
                <span className="text-sm font-medium text-white">~5.0 km</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Cash Price</label>
                  <input 
                    type="number"
                    value={cashAmount[request.id] ?? (request.proposedCash + 500)}
                    onChange={(e) => setCashAmount({ ...cashAmount, [request.id]: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] font-medium"
                    min={500}
                    step={100}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors h-[46px]">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-[#00A859] rounded"
                      checked={acceptsBarter[request.id] ?? false}
                      onChange={(e) => setAcceptsBarter({ ...acceptsBarter, [request.id]: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-white">Accept Barter</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message to Rider</label>
                <input 
                  type="text"
                  value={message[request.id] ?? ''}
                  onChange={(e) => setMessage({ ...message, [request.id]: e.target.value })}
                  placeholder="e.g. Can be there in 3 mins"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] text-sm"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={busyId === request.id}
              className="mt-2 w-full bg-[#00A859] hover:bg-[#008f4c] text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busyId === request.id ? 'Sending Bid...' : 'Send Counter Bid'}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
