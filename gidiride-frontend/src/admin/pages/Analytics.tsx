import { useEffect, useMemo, useState } from 'react';
import { analyticsApi } from '../../api/analytics';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { AdminAnalyticsSnapshot, HeatMapPoint, SeriesPoint } from '../../types/analytics';
import { LineChart, Map, Activity, DollarSign, Users, ShieldAlert, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { LiveMap } from '../components/LiveMap';

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0);
}

function BarChart({ points, moneyMode = false }: { points: SeriesPoint[]; moneyMode?: boolean }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="space-y-4 mt-4">
      {points.map((point, i) => (
        <div key={point.label + i} className="flex items-center gap-4 text-sm">
          <span className="w-24 font-bold text-gray-400 truncate" title={point.label}>{point.label}</span>
          <div className="flex-1 h-3 overflow-hidden rounded-full bg-gray-900 border border-gray-800">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, (point.value / max) * 100)}%` }}
              transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#00A859] to-[#00A859]/60 shadow-[0_0_10px_rgba(0,168,89,0.3)]" 
            />
          </div>
          <b className="w-20 text-right text-white font-medium">{moneyMode ? money(point.value) : point.value}</b>
        </div>
      ))}
    </div>
  );
}

function pointStyle(point: HeatMapPoint) {
  const left = Math.max(10, Math.min(88, 16 + (point.lng - 3.28) * 185));
  const top = Math.max(10, Math.min(86, 80 - (point.lat - 6.38) * 240));
  const size = 28 + point.intensity * 0.46;
  return { left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px` };
}

export function Analytics() {
  const [snapshot, setSnapshot] = useState<AdminAnalyticsSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    analyticsApi
      .getAdminAnalytics()
      .then((data) => mounted && setSnapshot(data))
      .catch((err) => mounted && setError(getFriendlyError(err)));
    return () => { mounted = false; };
  }, []);

  const heatMap = snapshot?.heatMap || [];
  const revenueSeries = snapshot?.revenueSeries || [];
  const peakHours = snapshot?.peakHours || [];
  const rideSeries = snapshot?.rideSeries || [];
  const paymentMix = snapshot?.paymentMix || [];
  const featureUsage = snapshot?.featureUsage || [];

  const maxHeat = useMemo(() => Math.max(...(heatMap.length ? heatMap.map((p) => p.intensity) : [1])), [heatMap]);

  if (!snapshot) return <LoadingSpinner label="Loading intelligence dashboard" />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#00A859] font-bold text-xs tracking-wider uppercase mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3" /> System Intelligence
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Heat Maps</h1>
          <p className="text-gray-400 mt-2">Platform performance, demand tracking, and operational metrics.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 shadow-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Generated At</span>
          <span className="text-gray-300 font-mono text-sm">
            {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.generatedAt))}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#00A859]/5 rounded-bl-full -z-10 group-hover:bg-[#00A859]/10 transition-colors" />
          <div className="flex items-center gap-2 mb-2">
            <LineChart className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Rides</p>
          </div>
          <strong className="text-3xl font-black text-white">{(snapshot.totals?.rides || 0).toLocaleString()}</strong>
          <small className="text-gray-500 mt-1">all-time tracked</small>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#00A859]/5 rounded-bl-full -z-10 group-hover:bg-[#00A859]/10 transition-colors" />
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#00A859]" />
            <p className="text-xs font-bold text-[#00A859] uppercase tracking-wider">Gross Revenue</p>
          </div>
          <strong className="text-3xl font-black text-[#00A859]">{money(snapshot.totals?.revenue || 0)}</strong>
          <small className="text-gray-500 mt-1">platform lifetime</small>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -z-10 group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Active Supply</p>
          </div>
          <strong className="text-3xl font-black text-white">{(snapshot.totals?.activeDrivers || 0).toLocaleString()}</strong>
          <small className="text-gray-500 mt-1">approved drivers</small>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-bl-full -z-10 group-hover:bg-red-500/10 transition-colors" />
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Safety Desk</p>
          </div>
          <strong className="text-3xl font-black text-white">{(snapshot.totals?.disputes || 0) + (snapshot.totals?.sosAlerts || 0)}</strong>
          <small className="text-gray-500 mt-1">open disputes + sos</small>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Heat Map */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col relative z-0">
          <div className="flex items-end justify-between mb-6 relative z-10">
            <div>
              <p className="text-[#00A859] font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                <Map className="w-4 h-4" /> Demand Intelligence
              </p>
              <h3 className="text-2xl font-bold text-white">Nigeria Hot Zones</h3>
            </div>
            <span className="text-xs font-mono text-gray-500 bg-gray-950 px-3 py-1 rounded-lg border border-gray-800">
              Intensity Max: {maxHeat}
            </span>
          </div>
          
          <div className="relative flex-1 min-h-[450px]">
            <LiveMap snapshot={snapshot} />
          </div>
        </div>

        {/* Side Charts */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Revenue Trend</h3>
            <p className="text-xs text-gray-500 mb-6">Last 5 periods</p>
            <BarChart points={revenueSeries} moneyMode />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Peak Hours</h3>
            <p className="text-xs text-gray-500 mb-6">Activity by time of day</p>
            <BarChart points={peakHours} />
          </div>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Ride Volume</h3>
          <BarChart points={rideSeries} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Payment Mix</h3>
          <BarChart points={paymentMix} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Feature Usage</h3>
          <BarChart points={featureUsage} />
        </div>
      </div>
    </div>
  );
}
