import { FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFriendlyError } from '../../api/client';
import { riderApi } from '../../api/rider';
import { LagosMap } from '../../shared/components/LagosMap';
import type { FareEstimate, LagosLocation, PaymentMethod, RideType } from '../../types/ride';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, Car, Crown, Shield, CreditCard, Banknote, Wallet, Phone, MapPin, Search } from 'lucide-react';

const rideTypes: Array<{ value: RideType; label: string; note: string; icon: any }> = [
  { value: 'BIKE', label: 'Bike', note: 'Fast for traffic and short hops.', icon: Bike },
  { value: 'ECONOMY', label: 'Economy', note: 'Everyday car for Lagos movement.', icon: Car },
  { value: 'PREMIUM', label: 'Premium', note: 'Better car, comfort, and priority.', icon: Crown }
];

const payments: Array<{ value: PaymentMethod; label: string; icon: any }> = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'WALLET', label: 'Wallet', icon: Wallet },
];

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

/* ── Nominatim Search Hook ── */
function useAddressSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LagosLocation[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 3) { setResults([]); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Lagos Nigeria')}&limit=5&addressdetails=1`)
        .then(r => r.json())
        .then((data: any[]) => {
          const remoteResults = data.map((item, i) => ({
            id: `custom-${i}-${Date.now()}`,
            name: item.display_name.split(',').slice(0, 2).join(','),
            area: item.address?.suburb || item.address?.city_district || item.address?.city || 'Lagos',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }));
          const localResults = riderApi.locations.filter(l => 
            l.name.toLowerCase().includes(query.toLowerCase()) || 
            l.area.toLowerCase().includes(query.toLowerCase())
          );
          const finalResults = [...localResults];
          for (const rr of remoteResults) {
            if (!finalResults.some(lr => rr.name.toLowerCase().includes(lr.name.toLowerCase()))) {
              finalResults.push(rr);
            }
          }
          setResults(finalResults.slice(0, 6));
        })
        .catch(() => {
          const localResults = riderApi.locations.filter(l => 
            l.name.toLowerCase().includes(query.toLowerCase()) || 
            l.area.toLowerCase().includes(query.toLowerCase())
          );
          setResults(localResults);
        })
        .finally(() => setSearching(false));
    }, 400); // debounce
    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, searching, clearResults: () => { setResults([]); setQuery(''); } };
}

export function BookRide() {
  const navigate = useNavigate();
  const [pickupId, setPickupId] = useState('unilag');
  const [dropoffId, setDropoffId] = useState('lekki-phase-1');
  const [rideType, setRideType] = useState<RideType>('ECONOMY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [femaleDriverOnly, setFemaleDriverOnly] = useState(false);
  const [maleDriverOnly, setMaleDriverOnly] = useState(false);
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booking, setBooking] = useState(false);

  // Custom location state
  const [customPickup, setCustomPickup] = useState<LagosLocation | null>(null);
  const [customDropoff, setCustomDropoff] = useState<LagosLocation | null>(null);
  const pickupSearch = useAddressSearch();
  const dropoffSearch = useAddressSearch();

  const pickup = useMemo(() => customPickup || riderApi.locations.find((location) => location.id === pickupId) as LagosLocation, [pickupId, customPickup]);
  const dropoff = useMemo(() => customDropoff || riderApi.locations.find((location) => location.id === dropoffId) as LagosLocation, [dropoffId, customDropoff]);

  useEffect(() => {
    let mounted = true;
    setBusy(true);
    setError('');
    riderApi
      .estimateFare({ pickup, dropoff, rideType, paymentMethod, femaleDriverOnly })
      .then((data) => mounted && setEstimate(data))
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setBusy(false));
    return () => {
      mounted = false;
    };
  }, [dropoff, femaleDriverOnly, maleDriverOnly, paymentMethod, pickup, rideType]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pickup.id === dropoff.id) {
      setError('Pickup and dropoff cannot be the same point.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      await riderApi.requestRide({ pickup, dropoff, rideType, paymentMethod, femaleDriverOnly, maleDriverOnly });
      navigate('/rider/tracking');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      {/* Left Panel: Booking Form */}
      <motion.form 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onSubmit={submit} 
        className="w-full lg:w-1/2 flex flex-col gap-6"
      >
        <div>
          <p className="text-[#00A859] font-semibold uppercase tracking-wider text-sm mb-2">Book ride</p>
          <h2 className="text-3xl md:text-4xl font-bold">Where are we going?</h2>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl overflow-hidden"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pickup */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 font-medium text-sm">Pickup</span>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <select 
                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white appearance-none focus:ring-2 focus:ring-[#00A859] focus:border-transparent outline-none transition-all"
                value={customPickup ? '__custom__' : pickupId} 
                onChange={(event) => { setPickupId(event.target.value); setCustomPickup(null); pickupSearch.clearResults(); }}
              >
                {riderApi.locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name} — {location.area}</option>
                ))}
                {customPickup && <option value="__custom__">{customPickup.name}</option>}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text"
                placeholder="Or search any address..."
                value={pickupSearch.query}
                onChange={(e) => pickupSearch.setQuery(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:ring-2 focus:ring-[#00A859] focus:border-transparent outline-none transition-all placeholder:text-gray-600"
              />
              {pickupSearch.results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                  {pickupSearch.results.map(loc => (
                    <button key={loc.id} type="button" className="w-full text-left px-4 py-3 hover:bg-gray-800 text-sm text-white border-b border-gray-800 last:border-0 transition-colors"
                      onClick={() => { setCustomPickup(loc); pickupSearch.clearResults(); }}>
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-gray-500 text-xs block">{loc.area}</span>
                    </button>
                  ))}
                </div>
              )}
              {pickupSearch.searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Searching...</span>}
            </div>
          </div>
          
          {/* Dropoff */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 font-medium text-sm">Dropoff</span>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <select 
                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white appearance-none focus:ring-2 focus:ring-[#00A859] focus:border-transparent outline-none transition-all"
                value={customDropoff ? '__custom__' : dropoffId} 
                onChange={(event) => { setDropoffId(event.target.value); setCustomDropoff(null); dropoffSearch.clearResults(); }}
              >
                {riderApi.locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name} — {location.area}</option>
                ))}
                {customDropoff && <option value="__custom__">{customDropoff.name}</option>}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text"
                placeholder="Or search any address..."
                value={dropoffSearch.query}
                onChange={(e) => dropoffSearch.setQuery(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:ring-2 focus:ring-[#00A859] focus:border-transparent outline-none transition-all placeholder:text-gray-600"
              />
              {dropoffSearch.results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                  {dropoffSearch.results.map(loc => (
                    <button key={loc.id} type="button" className="w-full text-left px-4 py-3 hover:bg-gray-800 text-sm text-white border-b border-gray-800 last:border-0 transition-colors"
                      onClick={() => { setCustomDropoff(loc); dropoffSearch.clearResults(); }}>
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-gray-500 text-xs block">{loc.area}</span>
                    </button>
                  ))}
                </div>
              )}
              {dropoffSearch.searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Searching...</span>}
            </div>
          </div>
        </div>

        <fieldset className="flex flex-col gap-3 mt-2">
          <legend className="text-gray-400 font-medium mb-2 text-sm">Ride type</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rideTypes.map((item) => (
              <label 
                key={item.value} 
                className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                  rideType === item.value 
                    ? 'bg-gray-800 border-[#00A859] ring-1 ring-[#00A859]' 
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <input type="radio" name="rideType" value={item.value} checked={rideType === item.value} onChange={() => setRideType(item.value)} className="hidden" />
                <item.icon size={28} className={`mb-3 ${rideType === item.value ? 'text-[#00A859]' : 'text-gray-400'}`} />
                <strong className="text-lg font-bold mb-1">{item.label}</strong>
                <small className="text-gray-500 text-xs leading-tight">{item.note}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 mt-2">
          <span className="text-gray-400 font-medium text-sm">Payment method</span>
          <div className="flex flex-wrap gap-2">
            {payments.map((item) => (
              <button 
                type="button" 
                key={item.value} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  paymentMethod === item.value 
                    ? 'bg-gray-800 border-[#00A859] text-white shadow-sm shadow-emerald-900/20' 
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
                onClick={() => setPaymentMethod(item.value)}
              >
                <item.icon size={18} className={paymentMethod === item.value ? 'text-[#00A859]' : 'text-gray-500'} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl cursor-pointer hover:border-gray-700 transition-colors mt-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${femaleDriverOnly ? 'bg-[#00A859]/20 text-[#00A859]' : 'bg-gray-800 text-gray-400'}`}>
              <Shield size={20} />
            </div>
            <span className="font-medium">Female driver only mode</span>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${femaleDriverOnly ? 'bg-[#00A859]' : 'bg-gray-700'}`}>
            <motion.div 
              layout 
              className="w-4 h-4 bg-white rounded-full shadow-md"
              initial={false}
              animate={{ x: femaleDriverOnly ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
          <input type="checkbox" className="hidden" checked={femaleDriverOnly} onChange={(event) => { setFemaleDriverOnly(event.target.checked); if (event.target.checked) setMaleDriverOnly(false); }} />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl cursor-pointer hover:border-gray-700 transition-colors mt-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${maleDriverOnly ? 'bg-[#00A859]/20 text-[#00A859]' : 'bg-gray-800 text-gray-400'}`}>
              <Shield size={20} />
            </div>
            <span className="font-medium">Male driver only mode</span>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${maleDriverOnly ? 'bg-[#00A859]' : 'bg-gray-700'}`}>
            <motion.div 
              layout 
              className="w-4 h-4 bg-white rounded-full shadow-md"
              initial={false}
              animate={{ x: maleDriverOnly ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
          <input type="checkbox" className="hidden" checked={maleDriverOnly} onChange={(event) => { setMaleDriverOnly(event.target.checked); if (event.target.checked) setFemaleDriverOnly(false); }} />
        </label>

        <button 
          className="bg-[#00A859] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#008a4a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center text-lg" 
          disabled={busy || booking || !estimate} 
          type="submit"
        >
          {booking ? 'Requesting ride…' : busy ? 'Estimating fare…' : 'Request GidiRide'}
        </button>
      </motion.form>

      {/* Right Side: Map & Fare */}
      <motion.aside 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-1/2 flex flex-col gap-6"
      >
        <div className="h-[300px] lg:h-[450px] rounded-2xl overflow-hidden border border-gray-800 shadow-lg relative z-10">
          <LagosMap pickup={pickup} dropoff={dropoff} />
        </div>
        
        <article className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl">
          <p className="text-[#00A859] font-semibold uppercase tracking-wider text-sm mb-4">Fare estimate</p>
          {estimate ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center pb-6 border-b border-gray-800">
                <span className="text-gray-400 text-lg">Total</span>
                <strong className="text-4xl font-bold">{money(estimate.totalFare)}</strong>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance</span>
                  <span className="font-semibold">{estimate.distanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ETA</span>
                  <span className="font-semibold">{estimate.durationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Base</span>
                  <span className="font-semibold">{money(estimate.baseFare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Per-km</span>
                  <span className="font-semibold">{money(estimate.distanceFare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Surge</span>
                  <span className="font-semibold text-orange-400">{(typeof estimate.surge === 'number' ? estimate.surge : 1.0).toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fee</span>
                  <span className="font-semibold">{money(estimate.serviceFee)}</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm italic pt-4 border-t border-gray-800 leading-relaxed">{estimate.note}</p>
            </motion.div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              <p>Choose route to see fare.</p>
            </div>
          )}
        </article>
      </motion.aside>
    </div>
  );
}
