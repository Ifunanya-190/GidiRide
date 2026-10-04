import { FormEvent, useEffect, useState } from 'react';
import { getFriendlyError } from '../../api/client';
import { lagosFeaturesApi } from '../../api/lagosFeatures';
import { riderApi } from '../../api/rider';
import { LagosMap } from '../../shared/components/LagosMap';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { NumberField } from '../../shared/components/NumberField';
import type { BidFareRequest } from '../../types/lagos';
import type { LagosLocation, RideType } from '../../types/ride';
import { AlertCircle, CheckCircle2, ChevronRight, MessageSquare, Car, Handshake, X } from 'lucide-react';

function money(value: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0); }

export function BidFare() { // trigger HMR
  const [pickupId, setPickupId] = useState('ikeja-city-mall');
  const [dropoffId, setDropoffId] = useState('lekki-phase-1');
  const [rideType, setRideType] = useState<RideType>('ECONOMY');
  const [proposedCash, setProposedCash] = useState(4500);
  const [barterOffer, setBarterOffer] = useState('');
  const [femaleDriverOnly, setFemaleDriverOnly] = useState(false);
  const [maleDriverOnly, setMaleDriverOnly] = useState(false);
  const [notes, setNotes] = useState('AC preferred. I am ready now.');
  const [requests, setRequests] = useState<Array<BidFareRequest & { bids: Awaited<ReturnType<typeof lagosFeaturesApi.getMyBidFares>>[number]['bids'] }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pickup = riderApi.locations.find((item) => item.id === pickupId) as LagosLocation;
  const dropoff = riderApi.locations.find((item) => item.id === dropoffId) as LagosLocation;

  async function load() {
    setRequests(await lagosFeaturesApi.getMyBidFares() || []);
  }

  useEffect(() => {
    let mounted = true;
    load().catch((err) => mounted && setError(getFriendlyError(err))).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  async function cancelBid(id: string) {
    setBusy(true);
    try {
      setRequests(current => current.map(r => r.id === id ? { ...r, status: "CANCELLED" as any } : r));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setSuccess('');
    try {
      const created = await lagosFeaturesApi.createBidFare({ pickup, dropoff, rideType, proposedCash, barterOffer, femaleDriverOnly, maleDriverOnly, notes });
      setSuccess(`Bid ${created.id} posted. Drivers can now bid cash or barter.`);
      await load();
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusy(false); }
  }

  async function acceptBid(bidId: string) {
    setBusy(true); setError(''); setSuccess('');
    try {
      const bid = await lagosFeaturesApi.acceptDriverBid(bidId);
      setSuccess(`${bid.driverName}'s bid accepted for ${money(bid.cashAmount)}.`);
      await load();
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusy(false); }
  }

  if (loading) return <LoadingSpinner label="Loading bid fare board..." />;

  return (
    <section className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[#00A859] font-bold text-sm tracking-widest uppercase mb-1 block">Lagos Unique Feature</span>
          <h2 className="text-4xl font-bold text-white mb-2">Bid Fare + Barter</h2>
          <p className="text-gray-400 max-w-2xl">Post your own fare. Drivers can counter with cash, barter acceptance, ETA, and vehicle details.</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,500px)_1fr] gap-6 items-start">
        <form onSubmit={submit} className="bg-[#111] border border-gray-800 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-5">
          <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2"><MessageSquare size={20} className="text-[#00A859]" /> Post a Bid</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase">Pickup</span>
              <select className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors" value={pickupId} onChange={(e) => setPickupId(e.target.value)}>
                {riderApi.locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name} — {loc.area}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase">Dropoff</span>
              <select className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors" value={dropoffId} onChange={(e) => setDropoffId(e.target.value)}>
                {riderApi.locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name} — {loc.area}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase">Ride Type</span>
              <select className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors" value={rideType} onChange={(e) => setRideType(e.target.value as RideType)}>
                <option value="BIKE">Bike</option><option value="ECONOMY">Economy</option><option value="PREMIUM">Premium</option>
              </select>
            </label>
            <div className="flex flex-col gap-1.5">
              <NumberField label="Your cash offer" prefix="₦" min={500} value={proposedCash} onChange={setProposedCash} required helpText="Drivers see this before accepting." />
            </div>
          </div>

          <label className="flex flex-col gap-1.5 mt-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Barter Offer (Optional)</span>
            <input className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors placeholder-gray-700" value={barterOffer} onChange={(e) => setBarterOffer(e.target.value)} placeholder="e.g. 2kg rice, data bundle..." />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase">Notes</span>
            <textarea className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors resize-none placeholder-gray-700" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors">
            <input type="checkbox" className="w-5 h-5 accent-[#00A859] cursor-pointer" checked={femaleDriverOnly} onChange={(e) => { setFemaleDriverOnly(e.target.checked); if (e.target.checked) setMaleDriverOnly(false); }} />
            <span className="text-white font-medium select-none">Female driver only</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors">
            <input type="checkbox" className="w-5 h-5 accent-[#00A859] cursor-pointer" checked={maleDriverOnly} onChange={(e) => { setMaleDriverOnly(e.target.checked); if (e.target.checked) setFemaleDriverOnly(false); }} />
            <span className="text-white font-medium select-none">Male driver only</span>
          </label>
          
          <button className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,168,89,0.2)] mt-2" disabled={busy}>
            {busy ? 'Posting...' : 'Post Bid Fare'}
          </button>
        </form>
        
        <article className="rounded-[2rem] overflow-hidden border border-gray-800 shadow-2xl h-full min-h-[400px]">
          <LagosMap pickup={pickup} dropoff={dropoff} compact />
        </article>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">Active Bids</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(request => (
              <article key={request.id} className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-xl relative group flex flex-col gap-4">
                {request.status === 'OPEN' && (
                  <button onClick={() => cancelBid(request.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 bg-gray-900 p-2 rounded-full transition-colors" title="Cancel Request">
                    <X size={16} />
                  </button>
                )}
                
                <div className="mb-4 pr-8">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-3 ${request.status === 'OPEN' ? 'bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/50' : 'bg-gray-800 text-gray-400'}`}>
                    {request.status}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-bold">{request.pickup.area} → {request.dropoff.area}</span>
                    <span className="text-gray-500 text-xs truncate">{request.notes}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 p-4 bg-black/40 rounded-xl border border-white/5">
                  <span className="flex flex-col"><span className="text-xs text-gray-500">Offer</span><b className="text-yellow-500 text-lg">{money(request.proposedCash)}</b></span>
                  <span className="flex flex-col"><span className="text-xs text-gray-500">Type</span><b className="text-white">{request.rideType}</b></span>
                  <span className="flex flex-col"><span className="text-xs text-gray-500">Barter</span><b className="text-white truncate">{request.barterOffer || 'None'}</b></span>
                  <span className="flex flex-col"><span className="text-xs text-gray-500">Preference</span><b className="text-white">{request.femaleDriverOnly ? 'Female Only' : request.maleDriverOnly ? 'Male Only' : 'Any'}</b></span>
                </div>
            
            <div className="flex flex-col gap-3 mt-2">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Car size={16} /> Driver Bids ({request.bids?.length || 0})
              </h4>
              
              {request.bids?.map((bid) => (
                <div key={bid.id} className={`rounded-2xl p-4 border ${bid.status === 'ACCEPTED' ? 'bg-[#00A859]/10 border-[#00A859]/30' : 'bg-gray-800/50 border-gray-700'}`}>
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div>
                      <strong className="text-white block text-lg">{bid.driverName} <span className="text-yellow-500 text-sm font-normal">⭐ {typeof bid.driverRating === 'number' ? bid.driverRating.toFixed(1) : '5.0'}</span></strong>
                      <span className="text-gray-400 text-sm block">{bid.vehicle} • {bid.etaMin} min ETA</span>
                    </div>
                    <b className="text-[#00A859] text-xl">{money(bid.cashAmount)}</b>
                  </div>
                  
                  {bid.acceptsBarter && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-md mb-2 border border-blue-500/30">
                      <Handshake size={14} /> Accepts Barter
                    </div>
                  )}
                  
                  {bid.message && <p className="text-gray-300 text-sm italic mb-3 border-l-2 border-gray-600 pl-3">"{bid.message}"</p>}
                  
                  {bid.status === 'PENDING' && request.status !== 'ACCEPTED' && (
                    <button className="w-full bg-white text-black hover:bg-gray-200 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50" disabled={busy} onClick={() => acceptBid(bid.id)}>
                      Accept Bid
                    </button>
                  )}
                  {bid.status !== 'PENDING' && (
                    <div className="text-center w-full py-2 bg-black/40 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-widest border border-white/5">
                      {bid.status}
                    </div>
                  )}
                </div>
              ))}
              
              {(!request.bids || request.bids.length === 0) && (
                <div className="text-center p-6 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                  <span className="text-gray-500">No driver bids yet. Check back soon.</span>
                </div>
              )}
            </div>
          </article>
        ))}
        
        {(!requests || requests.length === 0) && (
          <div className="lg:col-span-2 text-center p-12 bg-gray-900/30 rounded-[2rem] border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-2">No Active Bids</h3>
            <p className="text-gray-400">You haven't posted any bid requests yet.</p>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
