import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { ActivityItem, DashboardStats } from '../../types/common';
import { Users, CarFront, Shield, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const fallbackStats: DashboardStats = {
  totalUsers: 0,
  totalRiders: 0,
  totalDrivers: 0,
  bannedUsers: 0,
  activeDrivers: 0,
  completedRides: 0,
  revenueToday: 0
};

const activity: ActivityItem[] = [
  {
    id: 'a1',
    actor: 'Safety desk',
    action: 'flagged a rider report around Chevron Drive',
    timestamp: '12 min ago',
    tone: 'yellow'
  },
  {
    id: 'a2',
    actor: 'KYC desk',
    action: 'approved a driver vehicle paper upload',
    timestamp: '28 min ago',
    tone: 'green'
  },
  {
    id: 'a3',
    actor: 'Pricing watch',
    action: 'noticed higher Lekki → Ikeja demand',
    timestamp: '1 hr ago',
    tone: 'neutral'
  }
];

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    adminApi
      .getStats()
      .then((data) => mounted && setStats(data))
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading GidiRide dashboard" />;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="flex-1">
          <p className="text-[#00A859] font-bold text-sm tracking-wider uppercase mb-2">Today in Nigeria</p>
          <h2 className="text-3xl font-bold text-white mb-4">Platform pulse without the noise.</h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
            See the people, safety locks, active supply, and cash movement. Phase 1 keeps the admin layer
            clean before rider and driver flows go deeper.
          </p>
        </div>
        <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 flex flex-col items-center justify-center min-w-[200px]">
          <span className="text-gray-400 text-sm font-medium mb-1">Active drivers</span>
          <strong className="text-5xl font-black text-[#00A859]">{stats.activeDrivers}</strong>
          <small className="text-gray-500 text-xs mt-2 uppercase tracking-wider">ready or verified</small>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-gray-400 font-medium mb-1">Riders</p>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalRiders}</h3>
            <p className="text-xs text-gray-500">registered rider accounts</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CarFront className="w-24 h-24 text-yellow-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 border border-yellow-500/20">
              <CarFront className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-gray-400 font-medium mb-1">Drivers</p>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalDrivers}</h3>
            <p className="text-xs text-gray-500">driver accounts in system</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-24 h-24 text-red-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 border border-red-500/20">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-gray-400 font-medium mb-1">Banned</p>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.bannedUsers}</h3>
            <p className="text-xs text-gray-500">safety locks applied</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
              <DollarSign className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-gray-400 font-medium mb-1">Revenue today</p>
            <h3 className="text-3xl font-bold text-white mb-2">{money(stats.revenueToday)}</h3>
            <p className="text-xs text-gray-500">payment rails ready</p>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.article 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-6"
        >
          <div className="mb-6">
            <p className="text-[#00A859] font-bold text-xs uppercase tracking-wider mb-1">Recent activity</p>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5" /> Operator log
            </h3>
          </div>
          <div className="space-y-6">
            {activity.map((item) => {
              const dotColor = item.tone === 'green' ? 'bg-emerald-500' : item.tone === 'yellow' ? 'bg-yellow-500' : item.tone === 'red' ? 'bg-red-500' : 'bg-gray-500';
              return (
                <div key={item.id} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${dotColor}`} />
                    <div className="flex-1 w-px bg-gray-800 my-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-baseline justify-between mb-1">
                      <strong className="text-white text-sm">{item.actor}</strong>
                      <small className="text-gray-500 text-xs">{item.timestamp}</small>
                    </div>
                    <p className="text-gray-400 text-sm">{item.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.article>

        <motion.article 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A859]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[#00A859] font-bold text-xs uppercase tracking-wider mb-2">Next build lane</p>
            <h3 className="text-2xl font-bold text-white mb-4">Driver onboarding comes after this.</h3>
            <p className="text-gray-400 leading-relaxed">
              KYC review, online/offline status, ride requests, and earnings will plug into this same protected
              role structure without mixing admin pages into driver screens.
            </p>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
