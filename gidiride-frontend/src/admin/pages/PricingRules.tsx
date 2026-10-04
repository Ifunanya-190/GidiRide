import { FormEvent, useEffect, useState } from 'react';
import { pricingApi } from '../../api/payments';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { PricingSettings } from '../../types/payment';
import { Settings, Save, CheckCircle2, XCircle, MapPin, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0);
}

export function PricingRules() {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    pricingApi
      .getPricing()
      .then((data) => mounted && setSettings(data))
      .catch((err) => mounted && setError(getFriendlyError(err)));
    return () => {
      mounted = false;
    };
  }, []);

  function updateRule(index: number, key: keyof PricingSettings['rules'][number], value: string | number | boolean) {
    setSettings((current) => {
      if (!current || !current.rules) return current;
      const rules = current.rules.map((rule, i) => (i === index ? { ...rule, [key]: value } : rule));
      return { ...current, rules };
    });
  }

  function updateZone(index: number, key: keyof PricingSettings['hotZones'][number], value: string | number | boolean) {
    setSettings((current) => {
      if (!current || !current.hotZones) return current;
      const hotZones = current.hotZones.map((zone, i) => (i === index ? { ...zone, [key]: value } : zone));
      return { ...current, hotZones };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      setSettings(await pricingApi.savePricing(settings));
      setSuccess('Pricing rules saved. Rider fare estimates now use these values.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!settings) return <LoadingSpinner label="Loading pricing rules" />;

  const rules = settings.rules || [];
  const hotZones = settings.hotZones || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#00A859] font-bold text-xs tracking-wider uppercase mb-1 flex items-center gap-1">
            <Settings className="w-3 h-3" /> Payments + Pricing
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pricing Rules</h1>
          <p className="text-gray-400 mt-2">Control base fare, per-km pricing, service fees, surge, and multipliers.</p>
        </div>
        <label className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 cursor-pointer hover:border-gray-700 transition-colors shadow-lg">
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!settings.globalSurgeEnabled}
              onChange={(event) => setSettings({ ...settings, globalSurgeEnabled: event.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A859]"></div>
          </div>
          <span className="text-white font-bold text-sm uppercase tracking-wider">Global Surge</span>
        </label>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-8">
        
        {/* Ride Types Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {rules.map((rule, index) => {
            const sample = Math.round(((rule.baseFare || 0) + (rule.perKm || 0) * 10 + (rule.serviceFee || 0) + (rule.fuelAdjustment || 0)) * (rule.surgeMultiplier || 1) / 50) * 50;
            return (
              <motion.div 
                key={rule.rideType || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gray-900 border rounded-3xl p-6 shadow-xl transition-all ${rule.enabled ? 'border-gray-800' : 'border-gray-800 opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-2xl font-black text-white">{rule.label}</h3>
                  <div className="text-right">
                    <strong className="block text-2xl font-bold text-[#00A859]">{money(sample)}</strong>
                    <span className="text-xs text-gray-500">Sample 10km fare</span>
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/50 mb-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Class Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={!!rule.enabled} onChange={(e) => updateRule(index, 'enabled', e.target.checked)} />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A859]"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Base Fare (₦)</label>
                    <input type="number" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-colors" value={rule.baseFare || 0} onChange={(e) => updateRule(index, 'baseFare', Number(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Per KM (₦)</label>
                      <input type="number" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-colors" value={rule.perKm || 0} onChange={(e) => updateRule(index, 'perKm', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Service Fee</label>
                      <input type="number" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-colors" value={rule.serviceFee || 0} onChange={(e) => updateRule(index, 'serviceFee', Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500"/> Surge X</label>
                      <input type="number" step="0.01" className="w-full bg-gray-950 border border-yellow-500/30 rounded-xl px-4 py-2 text-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors" value={rule.surgeMultiplier || 1} onChange={(e) => updateRule(index, 'surgeMultiplier', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fuel Adj (₦)</label>
                      <input type="number" className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-colors" value={rule.fuelAdjustment || 0} onChange={(e) => updateRule(index, 'fuelAdjustment', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Hot Zones Grid */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-xl font-bold text-white">Nigeria Hot Zones</h3>
              <p className="text-sm text-gray-400">Demand multipliers per area</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotZones.map((zone, index) => (
              <div key={zone.id || index} className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <strong className="block text-white font-medium truncate">{zone.name}</strong>
                  <label className="relative inline-flex items-center cursor-pointer mt-2">
                    <input type="checkbox" className="sr-only peer" checked={!!zone.active} onChange={(e) => updateZone(index, 'active', e.target.checked)} />
                    <div className="w-7 h-4 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-none after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-500 peer-checked:after:bg-white"></div>
                    <span className="ml-2 text-xs text-gray-500 font-medium">Active</span>
                  </label>
                </div>
                <div className="w-24 shrink-0">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">x</span>
                    <input type="number" step="0.01" className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-6 pr-3 py-2 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors text-right font-mono" value={zone.multiplier || 1} onChange={(e) => updateZone(index, 'multiplier', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            ))}
            {hotZones.length === 0 && <div className="col-span-full p-4 text-center text-gray-500">No hot zones configured.</div>}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={busy} 
          className="w-full md:w-auto px-8 py-4 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
        >
          {busy ? <LoadingSpinner /> : <><Save className="w-5 h-5"/> Save Pricing Configuration</>}
        </button>
      </form>
    </div>
  );
}
