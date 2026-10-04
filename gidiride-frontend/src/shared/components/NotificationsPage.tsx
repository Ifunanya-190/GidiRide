import { FormEvent, useEffect, useState } from 'react';
import { analyticsApi } from '../../api/analytics';
import { getFriendlyError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import type { NotificationPreference } from '../../types/analytics';
import { Bell, CheckCircle2, AlertCircle, ShieldAlert, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export function NotificationsPage() {
  const { user } = useAuth();
  const [pref, setPref] = useState<NotificationPreference | null>(null);
  const [permission, setPermission] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    analyticsApi.getNotificationPreference()
      .then((data) => {
        if (!mounted) return;
        setPref(data);
      })
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  async function requestPermission() {
    if (!('Notification' in window)) { setError('This browser does not support push notifications.'); return; }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification('GidiRide notifications ready', { body: 'Ride updates, SOS alerts, referrals, and earnings can notify you.' });
      setPref((current) => current && { ...current, pushEnabled: true, endpoint: 'browser-notification-mock-endpoint' });
    }
  }

  function update<K extends keyof NotificationPreference>(key: K, value: NotificationPreference[K]) {
    setPref((current) => current && { ...current, [key]: value });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pref) return;
    setBusy(true); setError(''); setSuccess('');
    try { setPref(await analyticsApi.saveNotificationPreference(pref)); setSuccess('Notification preferences saved.'); }
    catch (err) { setError(getFriendlyError(err)); } finally { setBusy(false); }
  }

  if (loading) return <LoadingSpinner label="Loading notification settings..." />;
  
  if (!pref) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto">
      <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center shadow-xl mb-6 border border-gray-800">
        <Bell className="w-12 h-12 text-gray-500" />
      </div>
      <h2 className="text-3xl font-black text-white mb-4">Could not load settings</h2>
      <p className="text-gray-400 mb-8">{error || 'There was an issue communicating with the backend.'}</p>
      <button className="bg-[#00A859] text-white px-8 py-3 rounded-full font-bold" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <section className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-[#00A859] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2"><Bell size={14} /> PWA Push Notifications</p>
        <h2 className="text-4xl font-black text-white mb-2">Notification Settings</h2>
        <p className="text-gray-400 text-lg">Manage your alerts for ride updates, SOS, earnings, and promos.</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 items-start">
        <article className="bg-[#111] rounded-[2rem] border border-gray-800 p-8 shadow-2xl flex flex-col items-center text-center gap-6 sticky top-6">
          <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800 shadow-xl">
            <Smartphone className="w-10 h-10 text-gray-500" />
          </div>
          <div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Browser Permission</p>
            <strong className={`text-2xl font-black uppercase ${permission === 'granted' ? 'text-[#00A859]' : permission === 'denied' ? 'text-red-500' : 'text-yellow-500'}`}>
              {permission}
            </strong>
          </div>
          <p className="text-gray-400 text-sm">Choose which GidiRide updates should reach you: trips, safety, earnings, and promos.</p>
          <button 
            className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,168,89,0.2)] mt-2" 
            onClick={requestPermission}
          >
            Request Push Permission
          </button>
        </article>

        <form onSubmit={save} className="bg-[#111] rounded-[2rem] border border-gray-800 p-8 shadow-2xl flex flex-col gap-6">
          <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2 border-b border-gray-800 pb-4">
            <ShieldAlert size={20} className="text-blue-500" /> {user?.role === 'DRIVER' ? 'Driver' : 'Rider'} Preferences
          </h3>
          
          <div className="flex flex-col gap-4">
            {(['pushEnabled', 'rideUpdates', 'safetyAlerts', 'promos', 'earnings'] as const).map((key) => {
              const checked = Boolean(pref[key]);
              return (
                <label key={key} className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl cursor-pointer hover:border-gray-700 transition-colors">
                  <span className="font-medium text-white capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${checked ? 'bg-[#00A859]' : 'bg-gray-700'}`}>
                    <motion.div 
                      layout 
                      className="w-4 h-4 bg-white rounded-full shadow-md"
                      initial={false}
                      animate={{ x: checked ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                  <input type="checkbox" className="hidden" checked={checked} onChange={(e) => update(key, e.target.checked as never)} />
                </label>
              );
            })}
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50 mt-4" disabled={busy}>
            {busy ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </form>
      </div>
    </section>
  );
}
