import { FormEvent, useEffect, useState } from 'react';
import { riderApi } from '../../api/rider';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { RideRequest } from '../../types/ride';
import { Users, Link2, CheckCircle2, AlertCircle, Calculator } from 'lucide-react';
import { NumberField } from '../../shared/components/NumberField';

function money(value: number) { 
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0); 
}

export function FuelSplit() {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [friendsCount, setFriendsCount] = useState(2);
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [splitMode, setSplitMode] = useState<'ride' | 'custom'>('custom');
  const [splitResult, setSplitResult] = useState<{ total: number, split: number, friends: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    riderApi.getRideHistory()
      .then((data) => {
        if (!mounted) return;
        const valid = data || [];
        setRides(valid);
        if (valid.length > 0) setSelectedId(valid[0].id);
      })
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    
    let total = 0;
    
    if (splitMode === 'custom') {
      if (!customAmount || customAmount < 100) {
        setError("Please enter a valid amount (minimum ₦100).");
        return;
      }
      total = customAmount;
    } else {
      const ride = rides.find((item) => item.id === selectedId);
      if (!ride) {
        setError("Please select a valid ride to split.");
        return;
      }
      total = ride.totalFare;
    }
    
    if (friendsCount < 2) {
      setError("You need at least 2 people (including yourself) to split a fare.");
      return;
    }

    const split = Math.round(total / friendsCount / 10) * 10;
    
    setSplitResult({ total, split, friends: friendsCount });
    setCopied(false);
  }

  function copyLink() {
    if (!splitResult) return;
    const text = `Hey! Pay your share of our GidiRide: ${money(splitResult.split)}.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (loading) return <LoadingSpinner label="Loading rides..." />;

  return (
    <section className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <Users className="w-8 h-8 text-blue-400" />
        </div>
        <div className="relative z-10">
          <span className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-2 block">Ride With Friends</span>
          <h2 className="text-4xl font-bold text-white mb-2">Fare Split</h2>
          <p className="text-gray-400 text-lg max-w-2xl">Easily divide the cost of your ride with your friends. Calculate the exact split and send them a payment request link.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 items-start">
        
        <form onSubmit={calculate} className="bg-[#111] border border-gray-800 rounded-[2rem] p-8 shadow-2xl flex flex-col gap-6 sticky top-6">
          <h3 className="text-white font-bold text-xl border-b border-gray-800 pb-4 flex items-center gap-2">
            <Calculator size={20} className="text-blue-400" /> Calculate Split
          </h3>
          
          <div className="flex gap-2 p-1 bg-gray-900 border border-gray-800 rounded-xl mb-2">
            <button 
              type="button" 
              onClick={() => setSplitMode('custom')} 
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${splitMode === 'custom' ? 'bg-[#00A859] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              Custom Amount
            </button>
            <button 
              type="button" 
              onClick={() => setSplitMode('ride')} 
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${splitMode === 'ride' ? 'bg-[#00A859] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              Past Ride
            </button>
          </div>

          {splitMode === 'custom' ? (
            <NumberField 
              label="Amount to Split" 
              prefix="₦"
              min={100} 
              value={customAmount === '' ? 0 : customAmount} 
              onChange={(v) => setCustomAmount(v === 0 ? '' : v)} 
              required 
            />
          ) : (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Select Ride</span>
              <select 
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={selectedId} 
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {rides.length === 0 && <option value="">No rides available</option>}
                {rides.map((ride) => (
                  <option key={ride.id} value={ride.id}>
                    {new Date(ride.requestedAt || Date.now()).toLocaleDateString()} - {ride.pickup.area} to {ride.dropoff.area} ({money(ride.totalFare)})
                  </option>
                ))}
              </select>
            </label>
          )}
          
          <NumberField 
            label="Total number of people (including you)" 
            min={2} 
            max={6} 
            value={friendsCount} 
            onChange={setFriendsCount} 
            required 
            helpText="We will divide the total fare evenly." 
          />
          
          <button 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] mt-2" 
            disabled={rides.length === 0}
          >
            Calculate Fair Split
          </button>
        </form>

        <div className="flex flex-col gap-6">
          {splitResult ? (
            <article className="bg-[#111] rounded-[2rem] border border-blue-500/30 p-8 shadow-[0_0_40px_rgba(59,130,246,0.1)] flex flex-col items-center text-center gap-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
              
              <div className="z-10 w-full border-b border-gray-800 pb-6">
                <span className="text-gray-500 text-sm font-bold uppercase tracking-widest block mb-2">Total Fare</span>
                <strong className="text-3xl font-black text-white">{money(splitResult.total)}</strong>
              </div>
              
              <div className="z-10 flex flex-col items-center">
                <span className="text-blue-400 text-sm font-bold uppercase tracking-widest block mb-2">Each Person Pays</span>
                <strong className="text-5xl font-black text-white mb-2">{money(splitResult.split)}</strong>
                <span className="text-gray-500 text-sm">Divided among {splitResult.friends} people</span>
              </div>
              
              <button 
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-2 z-10 ${copied ? 'bg-[#00A859] text-white shadow-[0_0_20px_rgba(0,168,89,0.3)]' : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'}`}
                onClick={copyLink}
                type="button"
              >
                {copied ? <><CheckCircle2 size={18} /> Copied to Clipboard!</> : <><Link2 size={18} /> Copy Payment Request Link</>}
              </button>
            </article>
          ) : (
            <article className="bg-[#111] rounded-[2rem] border border-gray-800 p-8 shadow-2xl flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
              <Users className="w-12 h-12 text-gray-700 mb-2" />
              <h3 className="text-xl font-bold text-gray-300">Ready to Split</h3>
              <p className="text-gray-500 text-sm">Select a ride and the number of people to calculate the fare breakdown.</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
