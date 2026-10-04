import { FormEvent, useEffect, useState } from 'react';
import { getFriendlyError } from '../../api/client';
import { lagosFeaturesApi } from '../../api/lagosFeatures';
import { riderApi } from '../../api/rider';
import { supportApi } from '../../api/support';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { NumberField } from '../../shared/components/NumberField';
import type { SkillBadge } from '../../types/lagos';
import type { RideRequest } from '../../types/ride';
import type { RideReview, RideDispute } from '../../types/support';
import { AlertCircle, CheckCircle2, FileText, Star, ThumbsUp, X, Clock, MapPin, Receipt, ShieldAlert } from 'lucide-react';

function money(value: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0); }

function badgeLabel(badge: SkillBadge) {
  const map: Record<SkillBadge, string> = {
    SAFE_DRIVER: '🛡️ Safe Driver',
    GOOD_AC: '❄️ Good AC',
    PLAYS_MY_MUSIC: '🎵 Aux Cord God',
    CLEAN_CAR: '✨ Spotless Car',
    FAST_PICKUP: '⚡ Fast Pickup',
    POLITE: '🤝 Very Polite'
  };
  return map[badge] || badge;
}

export function RideHistory() {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [reviewByRide, setReviewByRide] = useState<Map<string, RideReview>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hiddenRides, setHiddenRides] = useState<Set<string>>(new Set());

  const [receiptRide, setReceiptRide] = useState<RideRequest | null>(null);
  
  const [reviewRide, setReviewRide] = useState<RideRequest | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  const [disputeRide, setDisputeRide] = useState<RideRequest | null>(null);
  const [category, setCategory] = useState<RideDispute['category']>('FARE');
  const [details, setDetails] = useState('');

  const [tipRide, setTipRide] = useState<RideRequest | null>(null);
  const [tipAmount, setTipAmount] = useState(500);
  const [tipBadge, setTipBadge] = useState<SkillBadge>('SAFE_DRIVER');
  const [tipNote, setTipNote] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([riderApi.getRideHistory(), supportApi.getReviews()])
      .then(([rideData, reviewData]) => {
        if (!mounted) return;
        setRides(rideData || []);
        const map = new Map<string, RideReview>();
        (reviewData || []).forEach((r: RideReview) => map.set(r.rideId, r));
        setReviewByRide(map);
      })
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewRide) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      const review = await supportApi.submitReview(reviewRide, stars, comment);
      setReviewByRide((map) => new Map(map).set(review.rideId, review));
      setSuccess('Review submitted.');
      setReviewRide(null);
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusy(false); }
  }

  async function submitDispute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!disputeRide) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      const dispute = await supportApi.createDispute(disputeRide, category, details);
      setSuccess(`Dispute ${dispute.id} opened. We will review it shortly.`);
      setDisputeRide(null);
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusy(false); }
  }

  async function submitTip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tipRide || !tipRide.driver) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      const profile = await lagosFeaturesApi.sendTip({ driverId: tipRide.driver.id, driverName: tipRide.driver.name, amount: tipAmount, badge: tipBadge, note: tipNote });
      setSuccess(`${tipRide.driver.name} received ${money(tipAmount)} and a ${badgeLabel(tipBadge)} badge. Total tips: ${money(profile.tipTotal)}.`);
      setTipRide(null);
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusy(false); }
  }

  function downloadReceipt(ride: RideRequest) {
    const blob = new Blob([supportApi.buildReceiptText(ride)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${ride.id}-gidiride-receipt.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingSpinner label="Loading ride history..." />;

  return (
    <section className="max-w-6xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">Ride History</h2>
          <p className="text-gray-400 text-lg">View past trips, download receipts, rate drivers, and submit tips.</p>
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

      <div className="bg-[#111] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="p-5 font-bold text-gray-500 uppercase text-xs tracking-wider">Ride Details</th>
                <th className="p-5 font-bold text-gray-500 uppercase text-xs tracking-wider">Fare & Type</th>
                <th className="p-5 font-bold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                <th className="p-5 font-bold text-gray-500 uppercase text-xs tracking-wider">Rating</th>
                <th className="p-5 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Actions</th>
                </tr>
               </thead>
              <tbody className="divide-y divide-gray-800">
                {rides?.filter((ride) => !hiddenRides.has(ride.id)).map((ride) => {
                  const review = reviewByRide.get(ride.id);
                  const isCompleted = ride.status === 'COMPLETED';
                  const isCancelled = ride.status === 'CANCELLED';
                  
                  return (
                    <tr key={ride.id} className="hover:bg-gray-900/50 transition-colors group">
                      <td className="p-5 align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-white font-bold">{ride.pickup.area} → {ride.dropoff.area}</span>
                          <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                            <span>{ride.id}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {ride.durationMin}m</span>
                            <span className="flex items-center gap-1"><MapPin size={12} /> {ride.distanceKm}km</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 align-top">
                        <div className="flex flex-col gap-1">
                          <strong className="text-lg text-white">{money(ride.totalFare)}</strong>
                          <span className="text-xs text-gray-500 uppercase tracking-widest">{ride.rideType}</span>
                        </div>
                      </td>
                      <td className="p-5 align-top">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${isCancelled ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#00A859]/10 text-[#00A859] border border-[#00A859]/20'}`}>
                          {ride.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-5 align-top">
                        {review ? (
                          <div className="flex gap-0.5 text-yellow-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={16} fill={i < review.stars ? 'currentColor' : 'none'} className={i < review.stars ? '' : 'text-gray-700'} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-600 italic text-sm">—</span>
                        )}
                      </td>
                      <td className="p-5 align-top text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" onClick={() => setReceiptRide(ride)}>
                            <Receipt size={14} /> Receipt
                          </button>
                          <button className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50" onClick={() => setReviewRide(ride)} disabled={!isCompleted}>
                            <Star size={14} /> Rate
                          </button>
                          <button className="bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-500 border border-yellow-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50" onClick={() => setTipRide(ride)} disabled={!ride.driver}>
                            <ThumbsUp size={14} /> Tip
                          </button>
                          <button className="bg-red-900/30 hover:bg-red-900/50 text-red-500 border border-red-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" onClick={() => setDisputeRide(ride)}>
                            <ShieldAlert size={14} /> Dispute
                          </button>
                          <button className="bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center" onClick={() => setHiddenRides(prev => new Set(prev).add(ride.id))} title="Hide Ride">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!rides || rides.filter((ride) => !hiddenRides.has(ride.id)).length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                      <p className="text-lg font-bold text-gray-400">No rides yet.</p>
                      <p className="text-sm">Your completed and cancelled rides will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
          </table>
        </div>
      </div>

      {receiptRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onMouseDown={() => setReceiptRide(null)}>
          <article className="bg-[#111] border border-gray-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative transform transition-all" onMouseDown={(e) => e.stopPropagation()}>
            <button className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors" onClick={() => setReceiptRide(null)}><X size={24} /></button>
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
              <Receipt className="text-[#00A859] w-6 h-6" />
              <h3 className="text-2xl font-bold text-white">Ride Receipt</h3>
            </div>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-black border border-gray-800 p-6 text-sm font-mono leading-relaxed text-gray-300">
              {supportApi.buildReceiptText(receiptRide)}
            </pre>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-colors" onClick={() => setReceiptRide(null)}>Close</button>
              <button className="bg-[#00A859] hover:bg-[#008f4c] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(0,168,89,0.3)] flex items-center gap-2" onClick={() => downloadReceipt(receiptRide)}>
                Download .txt
              </button>
            </div>
          </article>
        </div>
      )}

      {reviewRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onMouseDown={() => setReviewRide(null)}>
          <form className="bg-[#111] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative transform transition-all flex flex-col gap-5" onSubmit={submitReview} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors" onClick={() => setReviewRide(null)}><X size={24} /></button>
            <div className="border-b border-gray-800 pb-4 mb-2">
              <span className="text-[#00A859] font-bold text-xs uppercase tracking-widest block mb-1">Rate Driver</span>
              <h3 className="text-2xl font-bold text-white">{reviewRide.driver?.name || 'Driver'}</h3>
            </div>
            
            <label className="flex flex-col gap-2 items-center">
              <span className="text-xs font-bold text-gray-500 uppercase">Select Stars</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button type="button" key={s} className="focus:outline-none transition-transform hover:scale-110" onClick={() => setStars(s)}>
                    <Star size={36} fill={s <= stars ? '#EAB308' : 'none'} className={s <= stars ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'text-gray-700'} />
                  </button>
                ))}
              </div>
            </label>
            
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Written Review (Optional)</span>
              <textarea className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors resize-none placeholder-gray-700" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the ride?" />
            </label>
            
            <div className="mt-4 flex gap-3">
              <button type="button" className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold transition-colors" onClick={() => setReviewRide(null)}>Cancel</button>
              <button className="flex-1 bg-[#00A859] hover:bg-[#008f4c] text-white py-4 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(0,168,89,0.3)] disabled:opacity-50" disabled={busy}>Submit Review</button>
            </div>
          </form>
        </div>
      )}

      {tipRide && tipRide.driver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onMouseDown={() => setTipRide(null)}>
          <form className="bg-[#111] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative transform transition-all flex flex-col gap-5" onSubmit={submitTip} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors" onClick={() => setTipRide(null)}><X size={24} /></button>
            <div className="border-b border-gray-800 pb-4 mb-2">
              <span className="text-yellow-500 font-bold text-xs uppercase tracking-widest block mb-1 flex items-center gap-1.5"><ThumbsUp size={14} /> Tip Jar + Badges</span>
              <h3 className="text-2xl font-bold text-white">{tipRide.driver.name}</h3>
            </div>
            
            <NumberField label="Tip Amount (₦)" prefix="₦" min={100} value={tipAmount} onChange={setTipAmount} required />
            
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Award a Skill Badge</span>
              <select className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors" value={tipBadge} onChange={(e) => setTipBadge(e.target.value as SkillBadge)}>
                {(['SAFE_DRIVER','GOOD_AC','PLAYS_MY_MUSIC','CLEAN_CAR','FAST_PICKUP','POLITE'] as SkillBadge[]).map((badge) => (
                  <option key={badge} value={badge}>{badgeLabel(badge)}</option>
                ))}
              </select>
            </label>
            
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Encouraging Note</span>
              <textarea className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors resize-none placeholder-gray-700" rows={2} value={tipNote} onChange={(e) => setTipNote(e.target.value)} placeholder="Thanks for the great ride!" />
            </label>
            
            <div className="mt-4 flex gap-3">
              <button type="button" className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold transition-colors" onClick={() => setTipRide(null)}>Cancel</button>
              <button className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-4 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)] disabled:opacity-50" disabled={busy}>Send Tip & Badge</button>
            </div>
          </form>
        </div>
      )}

      {disputeRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onMouseDown={() => setDisputeRide(null)}>
          <form className="bg-[#111] border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative transform transition-all flex flex-col gap-5" onSubmit={submitDispute} onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors" onClick={() => setDisputeRide(null)}><X size={24} /></button>
            <div className="border-b border-gray-800 pb-4 mb-2">
              <span className="text-red-500 font-bold text-xs uppercase tracking-widest block mb-1 flex items-center gap-1.5"><ShieldAlert size={14} /> Open Dispute</span>
              <h3 className="text-xl font-bold text-white font-mono">Ride: {disputeRide.id}</h3>
            </div>
            
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Category</span>
              <select className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors" value={category} onChange={(e) => setCategory(e.target.value as RideDispute['category'])}>
                <option value="FARE">Fare Issue</option>
                <option value="SAFETY">Safety Concern</option>
                <option value="DRIVER">Driver Behavior</option>
                <option value="PAYMENT">Payment Problem</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Details</span>
              <textarea className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none placeholder-gray-700" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Please explain what happened..." required />
            </label>
            
            <div className="mt-4 flex gap-3">
              <button type="button" className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold transition-colors" onClick={() => setDisputeRide(null)}>Cancel</button>
              <button className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50" disabled={busy}>Open Dispute</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
