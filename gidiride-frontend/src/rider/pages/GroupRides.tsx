import { FormEvent, useEffect, useState } from 'react';
import { getFriendlyError } from '../../api/client';
import { phase8Api } from '../../api/phase8';
import { riderApi } from '../../api/rider';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { NumberField } from '../../shared/components/NumberField';
import type { GroupRide } from '../../types/phase8';
import type { LagosLocation } from '../../types/ride';
import { AlertCircle, CheckCircle2, Users, MapPin, Clock, Info } from 'lucide-react';

function money(value: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0); }

export function GroupRides() {
  const [groups, setGroups] = useState<GroupRide[]>([]);
  const [pickupId, setPickupId] = useState('yaba');
  const [dropoffId, setDropoffId] = useState('lekki-phase-1');
  const [departureTime, setDepartureTime] = useState(() => {
    const d = new Date(Date.now() + 3 * 3600000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [pricePerSeat, setPricePerSeat] = useState(2500);
  const [notes, setNotes] = useState('Scheduled group ride. Share cost, arrive together.');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pickup = riderApi.locations.find((item) => item.id === pickupId) as LagosLocation;
  const dropoff = riderApi.locations.find((item) => item.id === dropoffId) as LagosLocation;

  async function load() { 
    setGroups(await phase8Api.getGroupRides() || []); 
  }
  
  useEffect(() => { 
    let mounted = true; 
    load().catch((err) => mounted && setError(getFriendlyError(err))).finally(() => mounted && setLoading(false)); 
    return () => { mounted = false; }; 
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy('create'); setError(''); setSuccess('');
    try {
      const group = await phase8Api.createGroupRide({ routeName: `${pickup.area} to ${dropoff.area}`, pickup, dropoff, departureTime: new Date(departureTime).toISOString(), seatsTotal: 4, pricePerSeat, rideType: 'ECONOMY', notes, createdAt: new Date().toISOString() } as Omit<GroupRide, 'id' | 'creatorId' | 'status' | 'seatsTaken' | 'members'>);
      setSuccess(`Ride ${group.id} scheduled. Riders can now join this Danfo Mode ride.`);
      await load();
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusy(''); }
  }

  async function join(id: string) {
    setBusy(id); setError(''); setSuccess('');
    try { 
      const group = await phase8Api.joinGroupRide(id); 
      setSuccess(`Joined ${group.routeName}. Seat ${group.seatsTaken}/${group.seatsTotal} reserved.`); 
      await load(); 
    }
    catch (err) { setError(getFriendlyError(err)); } finally { setBusy(''); }
  }

  if (loading) return <LoadingSpinner label="Loading Danfo Mode..." />;

  return (
    <section className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A859]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="w-16 h-16 rounded-full bg-[#00A859]/20 border border-[#00A859]/50 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,168,89,0.3)]">
          <Users className="w-8 h-8 text-[#00A859]" />
        </div>
        <div className="relative z-10">
          <span className="text-[#00A859] font-bold text-sm tracking-widest uppercase mb-2 block">Danfo Mode</span>
          <h2 className="text-4xl font-bold text-white mb-2">Scheduled Group Ride</h2>
          <p className="text-gray-400 text-lg max-w-2xl">Bundle riders going the same way. Four people split one car and each pays less.</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[460px_minmax(0,1fr)] gap-8 items-start">
        
        <form onSubmit={create} className="bg-[#111] border border-gray-800 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-5 sticky top-6">
          <h3 className="text-white font-bold text-xl border-b border-gray-800 pb-4">Create Group Ride</h3>
          
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
          
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase">Departure</span>
              <input type="datetime-local" className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors [color-scheme:dark]" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
            </label>
            <div className="flex flex-col gap-1.5 mt-[-2px]">
              <NumberField label="Price/seat" prefix="₦" min={0} value={pricePerSeat} onChange={setPricePerSeat} required />
            </div>
          </div>
          
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase">Notes</span>
            <textarea className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors resize-none placeholder-gray-700" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          
          <button className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,168,89,0.2)] mt-2" disabled={busy === 'create'}>
            {busy === 'create' ? 'Creating...' : 'Create Group Ride'}
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups?.map((group) => (
            <article key={group.id} className="bg-gray-900/50 border border-gray-800 rounded-[2rem] p-6 shadow-xl flex flex-col gap-5 relative overflow-hidden group hover:border-gray-700 transition-colors">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-gray-500 text-xs font-bold font-mono block mb-1">ID: {group.id}</span>
                  <h3 className="text-xl font-bold text-white leading-tight">{group.routeName}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${group.status === 'FULL' ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/50'}`}>
                  {group.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
                <span className="flex flex-col gap-1"><span className="text-xs text-gray-500 uppercase">Seats</span><b className="text-yellow-500 text-lg">{group.seatsTaken}/{group.seatsTotal}</b></span>
                <span className="flex flex-col gap-1"><span className="text-xs text-gray-500 uppercase">Fare</span><b className="text-[#00A859] text-lg">{money(group.pricePerSeat)}</b></span>
                <span className="flex flex-col gap-1"><span className="text-xs text-gray-500 uppercase">Depart</span><b className="text-white text-sm">{group.departureTime ? new Intl.DateTimeFormat('en-NG', { timeStyle: 'short', dateStyle: 'medium' }).format(new Date(group.departureTime)) : 'TBD'}</b></span>
                <span className="flex flex-col gap-1"><span className="text-xs text-gray-500 uppercase">Type</span><b className="text-white text-sm">{group.rideType}</b></span>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 text-sm text-gray-400 bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{group.notes}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {group.members?.map((m) => (
                  <span key={m.userId} className="rounded-full bg-gray-800 border border-gray-700 px-3 py-1 text-xs font-medium text-gray-300 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    {m.name}
                  </span>
                ))}
              </div>
              
              <button 
                className="w-full bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 mt-2" 
                disabled={busy === group.id || group.seatsTaken >= group.seatsTotal} 
                onClick={() => join(group.id)}
              >
                {group.seatsTaken >= group.seatsTotal ? 'Ride Full' : 'Join Group Ride'}
              </button>
            </article>
          ))}

          {(!groups || groups.length === 0) && (
            <div className="md:col-span-2 text-center p-12 bg-gray-900/30 rounded-[2rem] border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-2">No Group Rides Available</h3>
              <p className="text-gray-400">Be the first to schedule a Danfo Mode ride.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
