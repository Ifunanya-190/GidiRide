import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getFriendlyError } from '../../api/client';
import { riderApi } from '../../api/rider';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { PaymentMethod, RiderProfileSettings } from '../../types/ride';
import { Shield, CreditCard, Users, Settings2, ShieldAlert, CheckCircle2, AlertCircle, Phone, Lock, Camera } from 'lucide-react';

const emptySettings: RiderProfileSettings = {
  emergencyContact1: '',
  emergencyContact2: '',
  emergencyContact3: '',
  defaultPaymentMethod: 'CASH',
  femaleDriverOnly: false,
  maleDriverOnly: false,
  autoShareTrip: true,
  liveAudioSafety: false
};

export function RiderProfile() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RiderProfileSettings | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Editable profile fields
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => localStorage.getItem('gidiride_profile_photo_' + (user?.id || '')));
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    riderApi
      .getProfileSettings()
      .then((data) => mounted && setSettings(data))
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  function update<K extends keyof RiderProfileSettings>(key: K, value: RiderProfileSettings[K]) {
    setSettings((current) => ({ ...(current || emptySettings), [key]: value }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setProfilePhoto(dataUrl);
      localStorage.setItem('gidiride_profile_photo_' + (user?.id || ''), dataUrl);
      setSuccess('Profile photo updated!');
      setTimeout(() => setSuccess(''), 3000);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setProfileBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await riderApi.updateProfile({ fullName: editName, phone: editPhone, email: editEmail });
      setEditingProfile(false);
      setSuccess('Profile updated! Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setProfileBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      setSettings(await riderApi.saveProfileSettings(settings));
      setSuccess('Rider safety preferences saved successfully.');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading rider profile..." />;
  if (!settings) return (
    <div className="max-w-5xl mx-auto p-8 text-center bg-gray-900 border border-gray-800 rounded-3xl mt-12">
      <h2 className="text-2xl font-bold text-white mb-2">Could not load profile</h2>
      <p className="text-gray-400 mb-4">{error || 'There was a problem communicating with the backend.'}</p>
      <button onClick={() => window.location.reload()} className="bg-[#00A859] text-white px-6 py-2 rounded-xl font-bold">Retry</button>
    </div>
  );

  return (
    <section className="max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">Rider Profile</h2>
          <p className="text-gray-400 text-lg">Manage your identity, safety features, and trip preferences.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-start">
        
        {/* Identity Card */}
        <article className="bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00A859]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          {/* Profile Photo */}
          <label className="w-24 h-24 rounded-full bg-gray-900 border-2 border-gray-800 overflow-hidden shadow-xl mb-2 flex items-center justify-center cursor-pointer relative z-10 hover:border-[#00A859] transition-colors group">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#00A859] flex items-center justify-center text-white text-3xl font-black">
                {(user?.fullName || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera size={20} className="text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
          
          <div className="relative z-10 w-full">
            {!editingProfile ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">{user?.fullName}</h2>
                <div className="flex flex-col gap-1 text-gray-400 text-sm">
                  <span className="flex items-center justify-center gap-2"><Phone size={14} /> {user?.phone || 'No phone'}</span>
                  <span>{user?.email || 'No email'}</span>
                </div>
                <button
                  type="button"
                  className="mt-4 w-full py-2.5 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-xl font-bold text-sm transition-colors"
                  onClick={() => { setEditingProfile(true); setEditName(user?.fullName || ''); setEditPhone(user?.phone || ''); setEditEmail(user?.email || ''); }}
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 w-full text-left">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-bold uppercase">Full Name</span>
                  <input className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00A859] transition-colors text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-bold uppercase">Phone</span>
                  <input className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00A859] transition-colors text-sm" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-bold uppercase">Email</span>
                  <input className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00A859] transition-colors text-sm" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                </label>
                <div className="flex gap-2 mt-2">
                  <button type="button" className="flex-1 py-2.5 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50" disabled={profileBusy} onClick={saveProfile}>
                    {profileBusy ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-colors" onClick={() => setEditingProfile(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-2 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-800 text-xs text-gray-500 font-mono flex items-center gap-2 relative z-10">
            <Lock size={12} /> Role locked to <b className="text-white">/rider</b>
          </div>
        </article>

        {/* Settings Form */}
        <form className="bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-8" onSubmit={submit}>
          
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
            <ShieldAlert className="text-[#00A859] w-6 h-6" />
            <h3 className="text-2xl font-bold text-white">Trip Preferences</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Users size={14} /> Emergency Contact 1</span>
              <input 
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors" 
                value={settings.emergencyContact1} 
                onChange={(e) => update('emergencyContact1', e.target.value)} 
                placeholder="+234..."
              />
            </label>
            
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Users size={14} /> Emergency Contact 2</span>
              <input 
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors" 
                value={settings.emergencyContact2} 
                onChange={(e) => update('emergencyContact2', e.target.value)} 
                placeholder="+234..."
              />
            </label>
            
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Users size={14} /> Emergency Contact 3</span>
              <input 
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors" 
                value={settings.emergencyContact3} 
                onChange={(e) => update('emergencyContact3', e.target.value)} 
                placeholder="+234..."
              />
            </label>
            
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><CreditCard size={14} /> Default Payment</span>
              <select 
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859] transition-colors" 
                value={settings.defaultPaymentMethod} 
                onChange={(e) => update('defaultPaymentMethod', e.target.value as PaymentMethod)}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="WALLET">Wallet</option>
              </select>
            </label>
          </div>
          
          <div className="flex flex-col gap-4 mt-2 p-6 bg-gray-900/50 rounded-2xl border border-gray-800">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2"><Shield size={16} className="text-[#00A859]" /> Safety Toggles</h4>
            
            <label className="flex items-center gap-4 cursor-pointer p-3 hover:bg-gray-800 rounded-xl transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-[#00A859] cursor-pointer" 
                checked={settings.femaleDriverOnly} 
                onChange={(e) => { update('femaleDriverOnly', e.target.checked); if (e.target.checked) update('maleDriverOnly', false); }} 
              />
              <span className="text-white font-medium select-none">Prefer female drivers only</span>
            </label>
            
            <label className="flex items-center gap-4 cursor-pointer p-3 hover:bg-gray-800 rounded-xl transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-[#00A859] cursor-pointer" 
                checked={settings.maleDriverOnly} 
                onChange={(e) => { update('maleDriverOnly', e.target.checked); if (e.target.checked) update('femaleDriverOnly', false); }} 
              />
              <span className="text-white font-medium select-none">Prefer male drivers only</span>
            </label>
            
            <p className="text-xs text-gray-500 px-3 -mt-2">When neither is active, both male and female drivers can accept your rides.</p>
            
            <label className="flex items-center gap-4 cursor-pointer p-3 hover:bg-gray-800 rounded-xl transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-[#00A859] cursor-pointer" 
                checked={settings.autoShareTrip} 
                onChange={(e) => update('autoShareTrip', e.target.checked)} 
              />
              <span className="text-white font-medium select-none">Auto-share trip with contacts</span>
            </label>
            
            <label className="flex items-center gap-4 cursor-pointer p-3 hover:bg-gray-800 rounded-xl transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-[#00A859] cursor-pointer" 
                checked={settings.liveAudioSafety} 
                onChange={(e) => update('liveAudioSafety', e.target.checked)} 
              />
              <div className="flex flex-col">
                <span className="text-white font-medium select-none">Live audio safety monitoring placeholder</span>
                <span className="text-xs text-gray-500 mt-1">Requires microphone permission during active rides.</span>
              </div>
            </label>
          </div>
          
          <button 
            className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,168,89,0.2)] mt-2 flex items-center justify-center gap-2" 
            disabled={busy}
          >
            {busy ? 'Saving...' : <><Settings2 size={18} /> Save Rider Profile</>}
          </button>
        </form>
        
      </div>
    </section>
  );
}
