import { FormEvent, useEffect, useState } from 'react';
import { adminPayoutsApi } from '../../api/payments';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { DriverWithdrawal } from '../../types/payment';
import { CheckCircle2, XCircle, Banknote, History, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function money(value: number) { 
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0); 
}

function formatDate(value?: string) { 
  if (!value || value === 'null') return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); 
  } catch {
    return '—';
  }
}

export function AdminPayouts() {
  const [withdrawals, setWithdrawals] = useState<DriverWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectTarget, setRejectTarget] = useState<DriverWithdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  function load() {
    adminPayoutsApi
      .getAllWithdrawals()
      .then(setWithdrawals)
      .catch((err) => setError(getFriendlyError(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function approve(id: string) {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await adminPayoutsApi.approveWithdrawal(id);
      setSuccess('Payout approved and marked paid.');
      setTimeout(() => setSuccess(''), 4000);
      load();
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
    setSuccess('');
    try {
      await adminPayoutsApi.rejectWithdrawal(rejectTarget.id, rejectReason.trim() || 'Rejected by admin.');
      setSuccess(`Payout rejected. ${money(rejectTarget.amount)} returned to the driver's wallet.`);
      setTimeout(() => setSuccess(''), 4000);
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyId('');
    }
  }

  if (loading) return <LoadingSpinner label="Loading payout requests" />;

  const pending = withdrawals.filter((item) => item.status === 'PENDING');
  const resolved = withdrawals.filter((item) => item.status !== 'PENDING');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#00A859] font-bold text-xs tracking-wider uppercase mb-1">Driver Payouts</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Withdrawal Requests</h1>
          <p className="text-gray-400 mt-2">Approve sends the payout and marks it paid. Reject returns funds to the driver's wallet.</p>
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
      
      {success && (
        <div className="bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Pending Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#00A859]" />
          Awaiting Review
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pending.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors flex flex-col shadow-lg">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <strong className="block text-lg text-white truncate">{item.accountName}</strong>
                  <p className="text-gray-400 text-sm truncate">{item.bankName} • {item.accountNumber}</p>
                </div>
                <strong className="text-xl text-[#f6b91a] whitespace-nowrap">{money(item.amount)}</strong>
              </div>
              
              <div className="bg-gray-950 rounded-xl p-3 mb-6 border border-gray-800/50">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Reference ID</span>
                  <span className="text-gray-300 font-mono">{item.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Requested</span>
                  <span className="text-gray-300">{formatDate(item.createdAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-auto">
                <button 
                  className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-transparent hover:border-red-500/50 rounded-xl font-medium transition-colors disabled:opacity-50 text-sm"
                  disabled={busyId === item.id} 
                  onClick={() => { setRejectTarget(item); setRejectReason(''); }}
                >
                  Reject
                </button>
                <button 
                  className="flex-[2] py-2.5 px-4 bg-[#00A859] hover:bg-[#008a4a] text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-lg shadow-emerald-900/20 text-sm whitespace-nowrap"
                  disabled={busyId === item.id} 
                  onClick={() => approve(item.id)}
                >
                  {busyId === item.id ? 'Working…' : 'Approve & Pay'}
                </button>
              </div>
            </div>
          ))}
          
          {!pending.length && (
            <div className="col-span-full bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Banknote className="w-12 h-12 text-[#00A859] mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">No pending requests</h3>
              <p className="text-gray-400">All driver withdrawal requests have been processed.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      {resolved.length > 0 && (
        <div className="space-y-4 pt-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            Payout History
          </h2>
          
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-gray-950 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Reference</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Driver / Bank</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Amount</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {resolved.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">{item.id}</td>
                    <td className="px-6 py-4">
                      <strong className="block text-white font-medium">{item.accountName}</strong>
                      <span className="block text-xs text-gray-500 mt-1">{item.bankName} • {item.accountNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{money(item.amount)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status === 'PAID' ? 'bg-[#00A859]/20 text-[#00A859]' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.status}
                        </span>
                        {item.rejectionReason && (
                          <span className="text-[10px] text-red-400/80 truncate max-w-[200px]" title={item.rejectionReason}>
                            {item.rejectionReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
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
                  <p className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">Reject Payout</p>
                  <h3 className="text-xl font-bold text-white">Reject {money(rejectTarget.amount)}?</h3>
                </div>
                <button type="button" className="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-colors" onClick={() => setRejectTarget(null)}>
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-6">The full amount will be returned to the driver's wallet immediately, and they'll see why it was rejected.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
                  placeholder="Example: Account name doesn't match the driver's KYC name."
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)} 
                  required
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button type="button" className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors" onClick={() => setRejectTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20" disabled={busyId === rejectTarget.id || !rejectReason.trim()}>
                  {busyId === rejectTarget.id ? 'Rejecting...' : 'Reject & Refund'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
