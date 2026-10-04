import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/admin';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { DriverProfile } from '../../types/driver';
import type { User } from '../../types/user';
import { CheckCircle2, XCircle, FileText, ChevronDown, ChevronUp, UserX, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function KycReview() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Record<string, DriverProfile | null>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');

  useEffect(() => {
    let mounted = true;
    adminApi
      .getUsers('DRIVER')
      .then(async (data) => {
        if (!mounted) return;
        setDrivers(data);
        
        // Use allSettled so one failed fetch doesn't crash the whole page
        const results = await Promise.allSettled(
          data.map(async (driver) => {
            const profile = await adminApi.getDriverDocuments(driver.id);
            return [driver.id, profile] as const;
          })
        );
        
        if (!mounted) return;
        
        const profileMap: Record<string, DriverProfile | null> = {};
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            profileMap[result.value[0]] = result.value[1];
          }
        });
        setProfiles(profileMap);
      })
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const pending = useMemo(() => drivers.filter((driver) => driver.kycStatus === 'PENDING'), [drivers]);
  const reviewed = useMemo(() => drivers.filter((driver) => driver.kycStatus && driver.kycStatus !== 'PENDING' && driver.kycStatus !== 'NOT_SUBMITTED'), [drivers]);

  function patchDriver(updated: User) {
    setDrivers((current) => current.map((driver) => (driver.id === updated.id ? updated : driver)));
  }

  async function approve(driver: User) {
    setBusyId(driver.id);
    setError('');
    try {
      patchDriver(await adminApi.approveDriverKyc(driver.id));
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyId('');
    }
  }

  async function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    setError('');
    try {
      patchDriver(await adminApi.rejectDriverKyc(rejectTarget.id, reason || 'Documents need correction.'));
      setRejectTarget(null);
      setReason('');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyId('');
    }
  }

  if (loading) return <LoadingSpinner label="Loading driver KYC queue" />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#00A859] font-bold text-xs tracking-wider uppercase mb-1">Admin KYC Review</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Driver verification queue</h1>
          <p className="text-gray-400 mt-2">Approve clean drivers or reject weak/fake documents before they can go online.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex flex-col items-center justify-center shadow-lg">
          <strong className="text-4xl font-black text-white leading-none">{pending.length}</strong>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Pending</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00A859]" />
            Awaiting Review
          </h2>
          
          <div className="space-y-4">
            {pending.map((driver) => {
              const profile = profiles[driver.id];
              const expanded = expandedId === driver.id;
              
              return (
                <div key={driver.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors">
                  <div className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#00A859]/20 text-[#00A859] flex items-center justify-center font-bold text-xl shrink-0">
                        {driver.fullName ? driver.fullName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{driver.fullName || 'Unknown Driver'}</h3>
                        <p className="text-sm text-gray-400 truncate">{driver.phone || driver.email}</p>
                      </div>
                    </div>

                    <div className="bg-gray-950 rounded-xl p-3 mb-4 space-y-2 border border-gray-800/50">
                      {profile && profile.documents && profile.documents.length > 0 ? (
                        profile.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{doc.label}</span>
                            <span className="text-white font-medium truncate ml-4">{doc.fileName}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 italic text-center py-2">
                          {profile ? 'No documents uploaded yet' : 'No KYC profile submitted yet'}
                        </div>
                      )}
                    </div>

                    <button 
                      type="button" 
                      className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors mb-4"
                      onClick={() => setExpandedId(expanded ? '' : driver.id)}
                    >
                      {expanded ? 'Hide details' : 'View identity & vehicle details'}
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                      {expanded && profile && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-800 mb-4">
                            <div>
                              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">License</span>
                              <strong className="text-sm text-white">{profile.licenseNumber || '—'}</strong>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">NIN</span>
                              <strong className="text-sm text-white">{profile.nin || '—'}</strong>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Home area</span>
                              <strong className="text-sm text-white">{profile.homeArea || '—'}</strong>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Vehicle</span>
                              <strong className="text-sm text-white truncate">
                                {[profile.vehicleMake, profile.vehicleModel, profile.vehicleColor].filter(Boolean).join(' ') || '—'}
                              </strong>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Plate Number</span>
                              <strong className="text-sm text-white">{profile.plateNumber || '—'}</strong>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Year</span>
                              <strong className="text-sm text-white">{profile.vehicleYear || '—'}</strong>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-3 mt-auto">
                      <button 
                        className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-transparent hover:border-red-500/50 rounded-xl font-medium transition-colors disabled:opacity-50"
                        disabled={busyId === driver.id} 
                        onClick={() => setRejectTarget(driver)}
                      >
                        Reject
                      </button>
                      <button 
                        className="flex-1 py-2.5 px-4 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/20"
                        disabled={busyId === driver.id} 
                        onClick={() => approve(driver)}
                      >
                        {busyId === driver.id ? 'Reviewing…' : 'Approve KYC'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {!pending.length && (
              <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-12 h-12 text-[#00A859] mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Queue is clear</h3>
                <p className="text-gray-400">No pending KYC applications right now.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gray-400" />
            Recently Reviewed
          </h2>
          
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-2">
            {reviewed.length ? reviewed.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400 shrink-0">
                    {driver.fullName ? driver.fullName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <strong className="block text-white font-medium">{driver.fullName || 'Unknown'}</strong>
                    <span className="text-xs text-gray-500">{driver.phone || driver.email}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  driver.kycStatus === 'APPROVED' ? 'bg-[#00A859]/20 text-[#00A859]' : 
                  driver.kycStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {driver.kycStatus}
                </span>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500">No recently reviewed drivers</div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={() => setRejectTarget(null)}>
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" 
              onSubmit={reject} 
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">Reject KYC</p>
                  <h3 className="text-xl font-bold text-white">{rejectTarget.fullName || 'Driver'}</h3>
                </div>
                <button type="button" className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors" onClick={() => setRejectTarget(null)}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-6">Tell the driver what must be corrected before they can resubmit their application.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
                  placeholder="e.g. The driver's license is expired or illegible."
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  required
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button type="button" className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors" onClick={() => setRejectTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20" disabled={busyId === rejectTarget.id || !reason.trim()}>
                  {busyId === rejectTarget.id ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
