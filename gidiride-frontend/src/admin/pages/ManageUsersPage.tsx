import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApi, type AccountTimelineEntry } from '../../api/admin';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { Role, User } from '../../types/user';
import { UserTable } from '../components/UserTable';
import { Search, XCircle, ShieldAlert, AlertTriangle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManageUsersPageProps {
  role: Extract<Role, 'RIDER' | 'DRIVER'>;
}

export function ManageUsersPage({ role }: ManageUsersPageProps) {
  const subject = role === 'RIDER' ? 'rider' : 'driver';
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [warnTarget, setWarnTarget] = useState<User | null>(null);
  const [warnReason, setWarnReason] = useState('');
  const [warnSent, setWarnSent] = useState('');
  const [viewTarget, setViewTarget] = useState<User | null>(null);
  const [timeline, setTimeline] = useState<AccountTimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi
      .getUsers(role)
      .then((data) => mounted && setUsers(data))
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [role]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      const vehicleStr = typeof user.vehicle === 'string' 
        ? user.vehicle 
        : user.vehicle 
          ? `${user.vehicle.make || ''} ${user.vehicle.model || ''} ${user.vehicle.plateNumber || ''}` 
          : '';
          
      const matchesQuery =
        !needle ||
        (user.fullName && user.fullName.toLowerCase().includes(needle)) ||
        (user.email && user.email.toLowerCase().includes(needle)) ||
        (user.phone && user.phone.toLowerCase().includes(needle)) ||
        (vehicleStr.toLowerCase().includes(needle));
      const matchesStatus =
        status === 'ALL' || (status === 'ACTIVE' && !user.banned) || (status === 'BANNED' && user.banned);
      return matchesQuery && matchesStatus;
    });
  }, [query, status, users]);

  async function refreshUser(updated: User) {
    setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
  }

  async function handleUnban(user: User) {
    setBusyUserId(user.id);
    setError('');
    try {
      const updated = await adminApi.unbanUser(user.id);
      await refreshUser(updated);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyUserId(undefined);
    }
  }

  async function handleBanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!banTarget) return;
    setBusyUserId(banTarget.id);
    setError('');
    try {
      const updated = await adminApi.banUser(
        banTarget.id,
        banReason.trim() || `Admin safety ban for ${subject} account review`
      );
      await refreshUser(updated);
      setBanTarget(null);
      setBanReason('');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyUserId(undefined);
    }
  }

  async function handleWarnSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!warnTarget || !warnReason.trim()) return;
    setBusyUserId(warnTarget.id);
    setError('');
    try {
      await adminApi.warnUser(warnTarget.id, warnReason.trim());
      setWarnSent(`Warning sent to ${warnTarget.fullName}.`);
      setTimeout(() => setWarnSent(''), 4000);
      setWarnTarget(null);
      setWarnReason('');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyUserId(undefined);
    }
  }

  function openTimeline(user: User) {
    setViewTarget(user);
    setTimelineLoading(true);
    adminApi
      .getAccountTimeline(user)
      .then(setTimeline)
      .catch((err) => setError(getFriendlyError(err)))
      .finally(() => setTimelineLoading(false));
  }

  if (loading) return <LoadingSpinner label={`Loading ${subject}s`} />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#00A859] font-bold text-xs tracking-wider uppercase mb-1">Manage {subject}s</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">{role === 'RIDER' ? 'Rider accounts' : 'Driver accounts'}</h1>
          <p className="text-gray-400 mt-2">Search, inspect, and ban or unban accounts securely.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex flex-col items-center justify-center shadow-lg">
          <strong className="text-4xl font-black text-white leading-none">{filtered.length}</strong>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Found</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {warnSent && (
        <div className="bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
          <Users className="w-5 h-5 shrink-0" />
          <p className="text-sm">{warnSent}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#00A859] transition-colors placeholder-gray-600"
            placeholder={`Search ${subject}s by name, email, phone...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <div className="flex bg-gray-950 border border-gray-800 rounded-xl p-1 shrink-0">
          {(['ALL', 'ACTIVE', 'BANNED'] as const).map((item) => (
            <button
              key={item}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                status === item 
                  ? 'bg-gray-800 text-white shadow' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
              }`}
              onClick={() => setStatus(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <UserTable
        users={filtered}
        subject={subject}
        onBan={(user) => {
          setBanTarget(user);
          setBanReason(user.banReason || '');
        }}
        onUnban={handleUnban}
        onWarn={(user) => { setWarnTarget(user); setWarnReason(''); }}
        onView={openTimeline}
        busyUserId={busyUserId}
      />

      {/* Modals */}
      <AnimatePresence>
        {/* View Timeline Modal */}
        {viewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={() => setViewTarget(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col" 
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[#00A859] font-bold text-xs uppercase tracking-wider mb-1">Full account view</p>
                  <h3 className="text-2xl font-bold text-white">{viewTarget.fullName}</h3>
                </div>
                <button type="button" className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors" onClick={() => setViewTarget(null)}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-950 rounded-xl border border-gray-800 mb-6 shrink-0">
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Email</span>
                  <strong className="text-sm text-white truncate block">{viewTarget.email || '—'}</strong>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</span>
                  <strong className="text-sm text-white">{viewTarget.phone || '—'}</strong>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Joined</span>
                  <strong className="text-sm text-white">
                    {viewTarget.createdAt && viewTarget.createdAt !== 'null' ? new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(viewTarget.createdAt)) : '—'}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Status</span>
                  {viewTarget.banned ? (
                    <strong className="text-sm text-red-400">Banned — {viewTarget.banReason || 'no reason on file'}</strong>
                  ) : (
                    <strong className="text-sm text-[#00A859]">Active</strong>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-4">Activity Timeline</p>
                
                {timelineLoading ? (
                  <LoadingSpinner label="Loading timeline" />
                ) : timeline.length > 0 ? (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                    {timeline.map((entry, index) => (
                      <div key={entry.id + index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-gray-900 bg-gray-700 text-gray-900 group-[.is-active]:bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow" />
                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-800 bg-gray-950/50">
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-sm text-white font-bold">{entry.title}</strong>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(entry.at))}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{entry.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 border border-gray-800 border-dashed rounded-xl">
                    No activity on this account yet.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Warn Modal */}
        {warnTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={() => setWarnTarget(null)}>
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" 
              onSubmit={handleWarnSubmit} 
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-yellow-500 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Policy Warning</p>
                  <h3 className="text-xl font-bold text-white">Warn {warnTarget.fullName}?</h3>
                </div>
                <button type="button" className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors" onClick={() => setWarnTarget(null)}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-6">Use this for a first-time or minor policy issue that doesn't yet need a ban. They will see this immediately.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Warning Message</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all resize-none"
                  placeholder="Example: Please keep the vehicle interior clean — we've had two complaints this week."
                  value={warnReason} 
                  onChange={(e) => setWarnReason(e.target.value)} 
                  required
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button type="button" className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors" onClick={() => setWarnTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-yellow-900/20" disabled={busyUserId === warnTarget.id || !warnReason.trim()}>
                  {busyUserId === warnTarget.id ? 'Sending...' : 'Send Warning'}
                </button>
              </div>
            </motion.form>
          </div>
        )}

        {/* Ban Modal */}
        {banTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={() => setBanTarget(null)}>
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" 
              onSubmit={handleBanSubmit} 
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Safety Lock</p>
                  <h3 className="text-xl font-bold text-white">Ban {banTarget.fullName}?</h3>
                </div>
                <button type="button" className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors" onClick={() => setBanTarget(null)}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-6">Use this for serious issues: fraud, repeated bad reviews, fake documents, or anything that can harm users.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Ban Reason</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
                  placeholder="Example: Safety investigation after dispute ticket..."
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)} 
                  required
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button type="button" className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors" onClick={() => setBanTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20" disabled={busyUserId === banTarget.id}>
                  {busyUserId === banTarget.id ? 'Banning...' : 'Ban Account'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
