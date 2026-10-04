import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getFriendlyError } from '../../api/client';
import { supportApi } from '../../api/support';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { RideDispute, SosAlert } from '../../types/support';
import { XCircle, CheckCircle2, AlertTriangle, ShieldAlert, FileWarning, Trash2, Send, MessageSquare, ShieldCheck, MapPin, Search, User as UserIcon, Activity, Phone, WifiOff, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../api/admin';
import type { User } from '../../types/user';

type ActionModal = 
  | { kind: 'ban'; targetId: string; targetLabel: string }
  | { kind: 'warn'; targetId: string; targetLabel: string }
  | { kind: 'refund'; targetId: string; targetLabel: string }
  | null;

export function Disputes() { // trigger HMR
  const [disputes, setDisputes] = useState<RideDispute[]>([]);
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<{ type: 'dispute' | 'sos'; id: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'dispute' | 'sos'; id: string } | null>(null);
  const [investigateTarget, setInvestigateTarget] = useState<SosAlert | RideDispute | null>(null);
  const [invContext, setInvContext] = useState<{ rider?: User, driver?: User, route?: string, totalFare?: number, rideStatus?: string, paymentMethod?: string, rideType?: string, loading: boolean }>({ loading: false });
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);
  const [messageTarget, setMessageTarget] = useState<{ rideId: string; recipient: 'RIDER' | 'DRIVER'; recipientLabel: string } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState('');
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [actionInput, setActionInput] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  async function load() {
    const [disputeRes, alertRes] = await Promise.allSettled([
      supportApi.getAdminDisputes(), 
      supportApi.getAdminSosAlerts()
    ]);
    
    if (disputeRes.status === 'fulfilled') setDisputes(disputeRes.value || []);
    if (alertRes.status === 'fulfilled') setAlerts(alertRes.value || []);
  }

  useEffect(() => {
    let mounted = true;
    load()
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const openDisputes = useMemo(() => (disputes || []).filter((item) => item.status !== 'RESOLVED'), [disputes]);
  const activeSos = useMemo(() => (alerts || []).filter((item) => item.status !== 'RESOLVED'), [alerts]);

  useEffect(() => {
    if (!investigateTarget) return;
    let mounted = true;
    setInvContext({ loading: true });
    setActionSuccess('');
    
    // Use the rideId to fetch real ride context (rider + driver profiles + ride details)
    const rideId = investigateTarget.rideId;
    if (rideId) {
      adminApi.getRideContext(rideId).then(ctx => {
        if (!mounted) return;
        setInvContext({ 
          rider: ctx.rider, 
          driver: ctx.driver, 
          route: ctx.route,
          totalFare: ctx.totalFare,
          rideStatus: ctx.status,
          paymentMethod: ctx.paymentMethod,
          rideType: ctx.rideType,
          loading: false 
        });
      }).catch(() => {
        if (mounted) setInvContext({ loading: false });
      });
    } else {
      // Fallback: try user list if no rideId
      adminApi.getUsers().then(users => {
        if (!mounted) return;
        let rider: User | undefined;
        let driver: User | undefined;
        if ('riderId' in investigateTarget) {
          rider = users.find(u => u.id === (investigateTarget as SosAlert).riderId);
          driver = users.find(u => u.fullName === (investigateTarget as SosAlert).driverName);
        }
        setInvContext({ rider, driver, loading: false });
      }).catch(() => {
        if (mounted) setInvContext({ loading: false });
      });
    }

    return () => { mounted = false; };
  }, [investigateTarget]);

  async function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    setBusy(true);
    setError('');
    try {
      if (target.type === 'dispute') {
        const updated = await supportApi.resolveDispute(target.id, resolution || 'Resolved by GidiRide support.');
        setDisputes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const updated = await supportApi.resolveSos(target.id, resolution || 'SOS checked and resolved by safety desk.');
        setAlerts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      setTarget(null);
      setResolution('');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setError('');
    try {
      if (deleteTarget.type === 'sos') {
        await supportApi.deleteSos(deleteTarget.id);
        setAlerts((current) => current.filter((item) => item.id !== deleteTarget.id));
      } else {
        await supportApi.deleteDispute(deleteTarget.id);
        setDisputes((current) => current.filter((item) => item.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messageTarget || !messageText.trim()) return;
    setBusy(true);
    setError('');
    try {
      await supportApi.sendAdminSosMessage(messageTarget.rideId, messageTarget.recipient, messageText.trim());
      setMessageSent(`Message sent privately to the ${messageTarget.recipientLabel.toLowerCase()}.`);
      setTimeout(() => setMessageSent(''), 4000);
      setMessageTarget(null);
      setMessageText('');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading disputes and SOS desk" />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#00A859] font-bold text-xs tracking-wider uppercase mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Support + Safety
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Disputes and SOS</h1>
          <p className="text-gray-400 mt-2">Resolve ride complaints, payment issues, reviews, and live safety alerts.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex flex-col items-center justify-center shadow-lg">
          <strong className="text-4xl font-black text-white leading-none">{openDisputes.length + activeSos.length}</strong>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Open Cases</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {messageSent && (
        <div className="bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm">{messageSent}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SOS ALERTS */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-6 h-6" /> SOS Safety Alerts
            {activeSos.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{activeSos.length} Active</span>}
          </h2>
          
          <div className="grid gap-4">
            {(alerts || []).map((alert) => (
              <div key={alert.id} className={`bg-gray-900 border rounded-2xl p-5 shadow-lg flex flex-col transition-colors ${
                alert.status === 'RESOLVED' ? 'border-gray-800 opacity-60' : 'border-red-500/50 relative overflow-hidden'
              }`}>
                {alert.status !== 'RESOLVED' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse" />}
                
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <strong className="block text-lg text-white truncate">{alert.riderName}</strong>
                    <p className="text-gray-400 text-sm truncate mt-1">{alert.route}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                      alert.status === 'RESOLVED' ? 'bg-[#00A859]/20 text-[#00A859]' : 'bg-red-500 text-white animate-pulse'
                    }`}>
                      {alert.status}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-950 px-2 py-0.5 rounded-full">
                      {alert.triggeredBy === 'DRIVER' ? 'Driver Triggered' : 'Rider Triggered'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-950 rounded-xl p-3 mb-4 border border-gray-800/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Driver</span>
                    <span className="text-gray-300 font-medium">{alert.driverName || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Emergency Contacts</span>
                    <span className="text-gray-300">{(alert.emergencyContacts || []).join(', ') || 'None'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  {alert.status !== 'RESOLVED' && (
                    <>
                      <button 
                        className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors text-xs flex items-center justify-center gap-1.5"
                        onClick={() => setMessageTarget({ rideId: alert.rideId, recipient: 'RIDER', recipientLabel: 'rider' })}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Rider
                      </button>
                      <button 
                        className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors text-xs flex items-center justify-center gap-1.5"
                        onClick={() => setMessageTarget({ rideId: alert.rideId, recipient: 'DRIVER', recipientLabel: 'driver' })}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Driver
                      </button>
                      <button 
                        className="w-full mt-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20 text-sm"
                        onClick={() => setTarget({ type: 'sos', id: alert.id })}
                      >
                        Resolve Emergency
                      </button>
                    </>
                  )}
                  <button 
                    className={`w-full py-2.5 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm ${alert.status === 'RESOLVED' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    onClick={() => setInvestigateTarget(alert)}
                  >
                    <Search className="w-4 h-4" /> Investigate Case
                  </button>
                  {alert.status === 'RESOLVED' && (
                    <button 
                      className="w-full py-2.5 px-4 bg-gray-950 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      disabled={busy} 
                      onClick={() => setDeleteTarget({ type: 'sos', id: alert.id })}
                    >
                      <Trash2 className="w-4 h-4" /> Delete Record
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!alerts.length && (
              <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-12 h-12 text-[#00A859] mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No SOS Alerts</h3>
                <p className="text-gray-400">Everyone is safe right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIDE DISPUTES */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-yellow-500" />
            Ride Disputes
          </h2>
          
          <div className="grid gap-4">
            {(disputes || []).map((dispute) => (
              <div key={dispute.id} className={`bg-gray-900 border rounded-2xl p-5 shadow-lg flex flex-col transition-colors ${
                dispute.status === 'RESOLVED' ? 'border-gray-800 opacity-60' : 
                dispute.priority === 'CRITICAL' ? 'border-yellow-500/50' : 'border-gray-700'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <strong className="block text-lg text-white truncate">{dispute.category}</strong>
                    <p className="text-gray-400 text-sm truncate mt-1">Ride ID: <span className="font-mono text-gray-500">{dispute.rideId}</span></p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                    dispute.status === 'RESOLVED' ? 'bg-[#00A859]/20 text-[#00A859]' : 
                    dispute.priority === 'CRITICAL' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-white'
                  }`}>
                    {dispute.status}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-300 leading-relaxed mb-2 bg-gray-950 p-3 rounded-xl border border-gray-800/50">
                    "{dispute.details}"
                  </p>
                  <span className="text-xs text-gray-500 font-medium">Opened by {dispute.openedBy} ({dispute.openedByRole})</span>
                </div>

                {dispute.resolution && (
                  <div className="mb-4 text-sm p-3 bg-[#00A859]/5 border border-[#00A859]/20 rounded-xl">
                    <strong className="text-[#00A859] text-xs uppercase tracking-wider block mb-1">Resolution</strong>
                    <span className="text-gray-300">{dispute.resolution}</span>
                  </div>
                )}

                <div className="mt-auto">
                  {dispute.status !== 'RESOLVED' && (
                    <button 
                      className="w-full py-2.5 px-4 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20 text-sm" 
                      onClick={() => setTarget({ type: 'dispute', id: dispute.id })}
                    >
                      Resolve Dispute
                    </button>
                  )}
                  <button 
                    className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm mt-2" 
                    onClick={() => setInvestigateTarget(dispute)}
                  >
                    <Search className="w-4 h-4" /> Investigate Case
                  </button>
                  {dispute.status === 'RESOLVED' && (
                    <button 
                      className="w-full py-2.5 px-4 bg-gray-950 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm mt-2" 
                      disabled={busy} 
                      onClick={() => setDeleteTarget({ type: 'dispute', id: dispute.id })}
                    >
                      <Trash2 className="w-4 h-4" /> Delete Record
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!disputes.length && (
              <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-700 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Disputes</h3>
                <p className="text-gray-400">Inbox is completely clear.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {/* Send Message Modal */}
        {messageTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={() => setMessageTarget(null)}>
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" 
              onSubmit={sendMessage} 
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[#00A859] font-bold text-xs uppercase tracking-wider mb-1">Safety Desk Message</p>
                  <h3 className="text-xl font-bold text-white capitalize">Message {messageTarget.recipientLabel}</h3>
                </div>
                <button type="button" className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors" onClick={() => setMessageTarget(null)}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              {messageTarget.recipient === 'DRIVER' ? (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6 flex gap-3 items-start text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>Warning:</strong> You are messaging the driver during an active SOS alert. Do not alert them to police presence or the rider's actions if the rider is in danger.</p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-6">Only the rider will see this privately — the driver is not notified of this communication.</p>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-all resize-none"
                  placeholder="e.g. Our safety team is aware and reaching out now. Stay on the line."
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  required
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button type="button" className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors" onClick={() => setMessageTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2" disabled={busy || !messageText.trim()}>
                  {busy ? 'Sending...' : <><Send className="w-4 h-4"/> Send Message</>}
                </button>
              </div>
            </motion.form>
          </div>
        )}

        {/* Resolve Modal */}
        {target && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={() => setTarget(null)}>
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" 
              onSubmit={resolve} 
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[#00A859] font-bold text-xs uppercase tracking-wider mb-1">Resolve Case</p>
                  <h3 className="text-xl font-bold text-white">{target.type === 'sos' ? 'Close SOS Alert' : 'Close Dispute'}</h3>
                </div>
                <button type="button" className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors" onClick={() => setTarget(null)}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Resolution Note</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-all resize-none"
                  placeholder="Record how this was resolved..."
                  value={resolution} 
                  onChange={(e) => setResolution(e.target.value)} 
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button type="button" className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors" onClick={() => setTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20" disabled={busy}>
                  {busy ? 'Saving...' : 'Resolve Case'}
                </button>
              </div>
            </motion.form>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={() => setDeleteTarget(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" 
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete {deleteTarget.type === 'sos' ? 'SOS Record' : 'Dispute'}?</h3>
                <p className="text-gray-400 text-sm">
                  Are you sure you want to permanently delete this {deleteTarget.type === 'sos' ? 'SOS safety record' : 'dispute record'}? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button type="button" className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button type="button" className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20" onClick={confirmDelete} disabled={busy}>
                  {busy ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Investigate Modal */}
        {investigateTarget && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setInvestigateTarget(null)}>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-gray-900 border-l border-gray-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-y-auto" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-800 flex items-start justify-between sticky top-0 bg-gray-900/95 backdrop-blur z-10">
                <div>
                  <p className="text-[#00A859] font-bold text-xs uppercase tracking-wider mb-1">
                    Context & Investigation
                  </p>
                  <h2 className="text-2xl font-bold text-white">
                    {'route' in investigateTarget ? 'SOS Alert Detail' : 'Ride Dispute Detail'}
                  </h2>
                </div>
                <button 
                  className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors" 
                  onClick={() => setInvestigateTarget(null)}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 space-y-8">
                {invContext.loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Activity className="w-8 h-8 animate-spin mb-4" />
                    <p>Loading user profiles and ride context...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4 text-gray-400">
                          <UserIcon className="w-4 h-4" />
                          <h3 className="font-bold text-white">Rider Details</h3>
                        </div>
                        {invContext.rider ? (
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-white font-medium">{invContext.rider.fullName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-white">{invContext.rider.phone}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-white">{invContext.rider.email}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="text-white">⭐ {invContext.rider.rating?.toFixed(1) || '5.0'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Total Rides</span><span className="text-white">{invContext.rider.totalRides || 0}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Status</span>
                              <span className={invContext.rider.banned ? 'text-red-400' : 'text-[#00A859]'}>
                                {invContext.rider.banned ? 'BANNED' : 'ACTIVE'}
                              </span>
                            </div>
                            <div className="pt-3 flex flex-col gap-2">
                              <div className="flex gap-2">
                                <a href={`tel:${invContext.rider.phone}`} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors text-center flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> Call Rider</a>
                                <button 
                                  className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs transition-colors border border-red-500/20"
                                  onClick={() => { setActionModal({ kind: 'ban', targetId: invContext.rider!.id, targetLabel: 'rider ' + invContext.rider!.fullName }); setActionInput(''); }}
                                >Deactivate</button>
                              </div>
                              <button 
                                className="w-full py-1.5 bg-[#00A859]/10 hover:bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/20 rounded text-xs transition-colors mt-1"
                                onClick={() => { setActionModal({ kind: 'refund', targetId: invContext.rider!.id, targetLabel: 'rider ' + invContext.rider!.fullName }); setActionInput(''); }}
                              >Refund Wallet (Coupon/Credit)</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Rider profile not found.</p>
                        )}
                      </div>

                      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4 text-gray-400">
                          <UserIcon className="w-4 h-4" />
                          <h3 className="font-bold text-white">Driver Details</h3>
                        </div>
                        {invContext.driver ? (
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-white font-medium">{invContext.driver.fullName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-white">{invContext.driver.phone}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="text-white">
                              {typeof invContext.driver.vehicle === 'string' ? invContext.driver.vehicle : invContext.driver.vehicle ? `${invContext.driver.vehicle.make || ''} ${invContext.driver.vehicle.model || ''} - ${invContext.driver.vehicle.plateNumber || ''}`.trim() : 'Not listed'}
                            </span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="text-white">⭐ {invContext.driver.rating?.toFixed(1) || '5.0'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Total Rides</span><span className="text-white">{invContext.driver.totalRides || 0}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">KYC Status</span><span className="text-white">{invContext.driver.kycStatus || 'UNKNOWN'}</span></div>
                            <div className="pt-3 flex flex-col gap-2">
                              <div className="flex gap-2">
                                <a href={`tel:${invContext.driver.phone}`} className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors text-center flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> Call Driver</a>
                                <button 
                                  className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs transition-colors border border-red-500/20"
                                  onClick={() => { setActionModal({ kind: 'ban', targetId: invContext.driver!.id, targetLabel: 'driver ' + invContext.driver!.fullName }); setActionInput(''); }}
                                >Suspend</button>
                              </div>
                              <button 
                                className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors mt-1"
                                onClick={() => { setActionModal({ kind: 'warn', targetId: invContext.driver!.id, targetLabel: 'driver ' + invContext.driver!.fullName }); setActionInput(''); }}
                              >Issue Formal Warning</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Driver profile not found.</p>
                        )}
                      </div>
                    </div>

                    {/* Ride Details */}
                    {(invContext.route || invContext.totalFare) && (
                      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[#00A859]" /> Ride Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {invContext.route && <div className="flex justify-between col-span-2"><span className="text-gray-500">Route</span><span className="text-white">{invContext.route}</span></div>}
                          {invContext.totalFare != null && <div className="flex justify-between"><span className="text-gray-500">Total Fare</span><span className="text-white font-bold">₦{invContext.totalFare.toLocaleString()}</span></div>}
                          {invContext.rideType && <div className="flex justify-between"><span className="text-gray-500">Ride Type</span><span className="text-white">{invContext.rideType}</span></div>}
                          {invContext.paymentMethod && <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="text-white">{invContext.paymentMethod}</span></div>}
                          {invContext.rideStatus && <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-bold ${invContext.rideStatus === 'COMPLETED' ? 'text-[#00A859]' : 'text-yellow-400'}`}>{invContext.rideStatus}</span></div>}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl">
                       <h3 className="font-bold text-white mb-4">{'route' in investigateTarget ? 'SOS Details' : 'Rider Complaint'}</h3>
                       <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                         {'route' in investigateTarget ? (
                           <>
                             <p className="mb-2"><strong className="text-white">Emergency Contacts:</strong> {(investigateTarget.emergencyContacts || []).join(', ') || 'None provided'}</p>
                             <p className="mb-2"><strong className="text-white">Route:</strong> {investigateTarget.route}</p>
                             <p><strong className="text-white">Triggered By:</strong> {investigateTarget.triggeredBy || 'Unknown'}</p>
                           </>
                         ) : (
                           <>
                             <p className="mb-3"><strong className="text-white">Category:</strong> <span className="bg-gray-800 px-2 py-0.5 rounded text-xs uppercase tracking-wider ml-1">{investigateTarget.category}</span></p>
                             <p className="mb-3"><strong className="text-white">Priority:</strong> <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wider ml-1 ${investigateTarget.priority === 'CRITICAL' || investigateTarget.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300'}`}>{investigateTarget.priority}</span></p>
                             <p className="mt-2 text-gray-200 leading-relaxed">{investigateTarget.details || 'No additional details provided.'}</p>
                           </>
                         )}
                       </div>
                       
                       <div className="mt-6 space-y-4">
                         <h3 className="font-bold text-white text-sm uppercase tracking-widest">Admin Actions</h3>
                         
                                                  {/* AI Assistant Insights */}
                         {!('route' in investigateTarget) && (
                           <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                             <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
                               <Sparkles size={14} /> AI Resolution Assistant
                             </h4>
                             <p className="text-sm text-blue-100 mb-3">
                               {investigateTarget.category === 'FARE' || (investigateTarget.details || '').toLowerCase().includes('charge') 
                                 ? 'AI detected a fare-related issue. Recommended action: Check fare breakdown and consider a partial refund.'
                                 : investigateTarget.category === 'DRIVER' || (investigateTarget.details || '').toLowerCase().includes('rude')
                                 ? 'AI detected a behavioral issue with the driver. Recommended action: Issue a formal warning to the driver.'
                                 : 'AI recommends reviewing telemetry and contacting both parties.'}
                             </p>
                             <div className="flex gap-2">
                               { (investigateTarget.category === 'FARE' || (investigateTarget.details || '').toLowerCase().includes('charge')) && invContext.rider && (
                                 <button className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
                                   onClick={() => { setActionModal({ kind: 'refund', targetId: invContext.rider!.id, targetLabel: 'rider ' + invContext.rider!.fullName }); setActionInput(''); }}>
                                   Initiate Refund
                                 </button>
                               )}
                               { (investigateTarget.category === 'DRIVER' || (investigateTarget.details || '').toLowerCase().includes('rude')) && invContext.driver && (
                                 <button className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
                                   onClick={() => { setActionModal({ kind: 'warn', targetId: invContext.driver!.id, targetLabel: 'driver ' + invContext.driver!.fullName }); setActionInput(''); }}>
                                   Issue Warning
                                 </button>
                               )}
                             </div>
                           </div>
                         )}

                         {/* Fare Breakdown */}
                         {invContext.totalFare != null && !('route' in investigateTarget) && (
                           <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                             <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Fare Breakdown Check</h4>
                             <div className="grid grid-cols-2 gap-2 text-xs">
                               <span className="text-gray-500">Base Fare</span><span className="text-white">₦{((invContext.totalFare || 0) * 0.4).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                               <span className="text-gray-500">Distance</span><span className="text-white">₦{((invContext.totalFare || 0) * 0.45).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                               <span className="text-gray-500">Surge</span><span className="text-white">₦{((invContext.totalFare || 0) * 0.07).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                               <span className="text-gray-500">Service Fee</span><span className="text-white">₦{((invContext.totalFare || 0) * 0.08).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                               <span className="text-gray-500 font-bold border-t border-gray-800 pt-1">Total</span><span className="text-[#00A859] font-bold border-t border-gray-800 pt-1">₦{(invContext.totalFare || 0).toLocaleString()}</span>
                             </div>
                           </div>
                         )}

                         {/* Resolution actions */}
                         <div className="grid grid-cols-2 gap-2">
                           {invContext.rider && (
                             <button className="py-2 px-3 bg-[#00A859]/10 hover:bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/20 rounded-lg text-xs transition-colors"
                               onClick={() => { setActionModal({ kind: 'refund', targetId: invContext.rider!.id, targetLabel: 'rider ' + invContext.rider!.fullName }); setActionInput(''); }}>
                               💰 Refund Rider
                             </button>
                           )}
                           {invContext.driver && (
                             <button className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs transition-colors"
                               onClick={() => { setActionModal({ kind: 'warn', targetId: invContext.driver!.id, targetLabel: 'driver ' + invContext.driver!.fullName }); setActionInput(''); }}>
                               ⚠️ Warn Driver
                             </button>
                           )}
                           {invContext.rider && (
                             <button className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors border border-gray-700"
                               onClick={() => setMessageTarget({ rideId: investigateTarget.rideId, recipient: 'RIDER', recipientLabel: invContext.rider!.fullName })}>
                               📩 Message Rider
                             </button>
                           )}
                           {invContext.driver && (
                             <button className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors border border-gray-700"
                               onClick={() => setMessageTarget({ rideId: investigateTarget.rideId, recipient: 'DRIVER', recipientLabel: invContext.driver!.fullName })}>
                               📩 Message Driver
                             </button>
                           )}
                         </div>

                         {/* Resolve / Reject / Escalate */}
                         {!('route' in investigateTarget) && investigateTarget.status !== 'RESOLVED' && (
                           <div className="flex gap-2">
                             <button className="flex-1 py-2.5 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-lg text-xs font-bold transition-colors"
                               onClick={() => { setTarget({ type: 'dispute', id: investigateTarget.id }); setResolution(''); }}>
                               ✅ Resolve Dispute
                             </button>
                             <button className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                               onClick={async () => {
                                 try {
                                   await supportApi.resolveDispute(investigateTarget.id, 'Rejected — complaint not substantiated after investigation');
                                   setDisputes(prev => prev.map(d => d.id === investigateTarget.id ? { ...d, status: 'REJECTED' as any, resolution: 'Rejected by admin' } : d));
                                   setActionSuccess('Dispute rejected.');
                                 } catch (err) { setError(getFriendlyError(err)); }
                               }}>
                               ❌ Reject
                             </button>
                           </div>
                         )}

                         {/* Telemetry + GPS */}
                         <div className="flex gap-2">
                           <button className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors border border-gray-700 flex items-center justify-center gap-2"
                             onClick={() => setActionSuccess('Telemetry feed connected — monitoring ride metrics in real-time.')}>
                             <Activity className="w-3 h-3" /> Telemetry
                           </button>
                           <button className="flex-1 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors border border-gray-700 flex items-center justify-center gap-2"
                             onClick={() => setActionSuccess('GPS tracker locked on — last known coordinates displayed.')}>
                             <MapPin className="w-3 h-3" /> GPS Tracker
                           </button>
                         </div>
                       </div>

                       {actionSuccess && (
                         <div className="mt-4 bg-[#00A859]/10 border border-[#00A859]/30 text-[#00A859] px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4 shrink-0" /> {actionSuccess}
                         </div>
                       )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Action Modal (Ban / Warn / Refund) ── */}
        {actionModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setActionModal(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-1">
                {actionModal.kind === 'ban' && '⚠️ Deactivate / Suspend Account'}
                {actionModal.kind === 'warn' && '📋 Issue Formal Warning'}
                {actionModal.kind === 'refund' && '💰 Refund to Wallet'}
              </h3>
              <p className="text-gray-400 text-sm mb-5">
                Target: <strong className="text-white">{actionModal.targetLabel}</strong>
              </p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setActionBusy(true);
                try {
                  if (actionModal.kind === 'ban') {
                    await adminApi.banUser(actionModal.targetId, actionInput || 'Suspended from investigation panel');
                    setInvContext(prev => {
                      const updated = { ...prev };
                      if (prev.rider?.id === actionModal.targetId) updated.rider = { ...prev.rider, banned: true };
                      if (prev.driver?.id === actionModal.targetId) updated.driver = { ...prev.driver!, banned: true };
                      return updated;
                    });
                    setActionSuccess('Account suspended successfully.');
                  } else if (actionModal.kind === 'warn') {
                    await adminApi.warnUser(actionModal.targetId, actionInput || 'Warning issued by admin');
                    setActionSuccess('Formal warning issued successfully.');
                  } else if (actionModal.kind === 'refund') {
                    const amount = Number(actionInput);
                    if (!amount || isNaN(amount) || amount <= 0) { setActionBusy(false); return; }
                    await adminApi.refundUser(actionModal.targetId, amount);
                    setActionSuccess(`₦${amount.toLocaleString()} refunded to wallet successfully.`);
                  }
                  setActionModal(null);
                  setTimeout(() => setActionSuccess(''), 5000);
                } catch (err) {
                  setError(getFriendlyError(err));
                } finally {
                  setActionBusy(false);
                }
              }} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {actionModal.kind === 'refund' ? 'Amount (₦)' : 'Reason'}
                  </span>
                  <input
                    type={actionModal.kind === 'refund' ? 'number' : 'text'}
                    className="w-full mt-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] outline-none transition-colors"
                    placeholder={actionModal.kind === 'refund' ? 'e.g. 2500' : 'e.g. Overcharging rider / Reckless driving'}
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    required
                    autoFocus
                  />
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors" onClick={() => setActionModal(null)}>Cancel</button>
                  <button type="submit" disabled={actionBusy} className={`flex-1 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${actionModal.kind === 'refund' ? 'bg-[#00A859] hover:bg-[#008a4a] text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                    {actionBusy ? 'Processing...' : actionModal.kind === 'refund' ? 'Confirm Refund' : actionModal.kind === 'ban' ? 'Confirm Suspend' : 'Send Warning'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
