import { useEffect, useState } from 'react';
import { driverApi } from '../../api/driver';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { DriverDashboardStats, DriverOnlineStatus } from '../../types/driver';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Car, Banknote, Wallet, Calendar, AlertCircle, Info } from 'lucide-react';

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export function DriverHome() {
  const [stats, setStats] = useState<DriverDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    driverApi
      .getDashboard()
      .then((data) => mounted && setStats(data))
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function setStatus(status: DriverOnlineStatus) {
    setBusy(true);
    setError('');
    try {
      const onlineStatus = await driverApi.setOnlineStatus(status);
      setStats((current) => current && { ...current, onlineStatus });
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading driver console" />;
  if (!stats && error) return <div className="text-center p-12 text-red-500 font-bold">{error}</div>;
  if (!stats) return null;

  const canGoOnline = stats.kycStatus === 'APPROVED';
  const isOnline = stats.onlineStatus === 'ONLINE';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl"
        >
          {/* Background decoration */}
          <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none transition-colors duration-700 ${isOnline ? 'bg-[#00A859]/20' : 'bg-gray-700/20'}`} />

          <div className="z-10 text-center md:text-left flex-1">
            <span className="inline-block px-3 py-1 rounded-full bg-gray-800 text-xs font-bold text-gray-300 mb-4 border border-gray-700 uppercase tracking-wider shadow-sm">
              Live Status
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">
              {isOnline ? 'You are live on GidiRide.' : 'You are parked for now.'}
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-md leading-relaxed">
              Go online only after your documents are approved. This keeps rider requests safe and trusted.
            </p>
          </div>

          <div className="z-10 shrink-0 flex flex-col items-center">
            <button
              onClick={() => setStatus(isOnline ? 'OFFLINE' : 'ONLINE')}
              disabled={busy || !canGoOnline}
              className={`group relative flex flex-col items-center justify-center w-40 h-40 rounded-full border-8 transition-all duration-500 ${
                !canGoOnline 
                  ? 'border-gray-800 bg-gray-900 cursor-not-allowed opacity-50' 
                  : isOnline 
                    ? 'border-[#00A859]/30 bg-[#00A859] hover:bg-[#008a4a] shadow-[0_0_50px_rgba(0,168,89,0.4)] scale-105' 
                    : 'border-gray-800 bg-gray-800 hover:bg-gray-700 hover:scale-105'
              }`}
            >
              <Power className={`w-12 h-12 mb-2 transition-colors duration-500 ${!canGoOnline ? 'text-gray-600' : isOnline ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              <span className={`text-sm font-bold tracking-widest transition-colors duration-500 ${!canGoOnline ? 'text-gray-600' : isOnline ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {isOnline ? 'OFFLINE' : 'ONLINE'}
              </span>
              {busy && (
                <div className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              )}
            </button>
            {!canGoOnline && (
              <p className="text-center text-xs text-red-400 font-semibold mt-6 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                KYC approval required
              </p>
            )}
            {canGoOnline && (
              <p className={`text-center text-xs font-semibold mt-6 px-3 py-1.5 rounded-lg border transition-colors duration-500 ${
                isOnline 
                  ? 'bg-[#00A859]/10 text-[#00A859] border-[#00A859]/20' 
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}>
                {isOnline ? 'Visible to nearby riders' : 'Not receiving ride requests'}
              </p>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <StatCard 
            title="Today Trips" 
            value={stats.todayTrips || 0} 
            icon={<Car className="w-5 h-5 text-white" />} 
            delay={0.1} 
          />
          <StatCard 
            title="Today Earnings" 
            value={money(stats.todayEarnings || 0)} 
            icon={<Banknote className="w-5 h-5 text-[#00A859]" />} 
            delay={0.2} 
          />
          <StatCard 
            title="Weekly Earnings" 
            value={money(stats.weeklyEarnings || 0)} 
            icon={<Calendar className="w-5 h-5 text-[#00A859]" />} 
            delay={0.3} 
          />
          <StatCard 
            title="Wallet Balance" 
            value={money(stats.walletBalance || 0)} 
            icon={<Wallet className="w-5 h-5 text-[#00A859]" />} 
            delay={0.4} 
          />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 lg:p-8 shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#00A859]/10 flex items-center justify-center shrink-0 border border-[#00A859]/20">
            <Info className="w-6 h-6 text-[#00A859]" />
          </div>
          <div>
            <p className="text-[#00A859] text-xs font-bold uppercase tracking-wider mb-1">Driver Tips</p>
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Small habits, better ratings.</h3>
          </div>
        </div>
        
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Confirm the pickup pin with the rider before you set off",
            "Keep the car clean and AC running for Economy and Premium trips",
            "Call, don't just wait, if a rider is more than 3 minutes late",
            "End every trip in-app immediately so your next request comes through",
            "Top up your wallet before rush hour to avoid missing cash-only trips"
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-4 bg-gray-950/50 p-5 rounded-2xl border border-gray-800/50 hover:border-gray-700 hover:bg-gray-800/30 transition-all duration-300">
              <div className="w-7 h-7 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center shrink-0 text-sm font-bold shadow-sm">
                {i + 1}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium">{tip}</p>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, delay }: { title: string; value: string | number; icon: React.ReactNode; delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:bg-gray-800/80 transition-colors shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-400">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <strong className="text-2xl font-extrabold text-white tracking-tight">{value}</strong>
    </motion.div>
  );
}
