import React, { FormEvent, useState, useEffect } from 'react';
import { driverApi } from '../../api/driver';
import { paymentApi } from '../../api/payments';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { EarningsSummary } from '../../types/driver';
import type { DriverWithdrawal } from '../../types/payment';
import { DollarSign, Wallet, TrendingUp, Clock, AlertCircle, CheckCircle2, ArrowDownToLine, Banknote, Loader2 } from 'lucide-react';

export function Earnings() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<DriverWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<number>(0);
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = async () => {
    try {
      const [earningsRes, withdrawalsRes] = await Promise.all([
        driverApi.getEarnings(),
        paymentApi.getDriverWithdrawals()
      ]);
      setEarnings(earningsRes);
      setWithdrawals(withdrawalsRes || []);
      setError(null);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    if (!amount || amount <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }
    
    if (earnings && amount > earnings.walletBalance) {
      setWithdrawError('Insufficient wallet balance.');
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      setWithdrawError('Please fill in all bank details.');
      return;
    }

    setWithdrawing(true);
    try {
      await paymentApi.requestWithdrawal({
        amount,
        bankName,
        accountNumber,
        accountName
      });
      setWithdrawSuccess('Withdrawal requested successfully!');
      setAmount(0);
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      fetchData(); // refresh balances
    } catch (err) {
      setWithdrawError(getFriendlyError(err));
    } finally {
      setWithdrawing(false);
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);
  };

  const safeDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading && !earnings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-950 min-h-screen">
        <LoadingSpinner />
        <p className="mt-4">Loading earnings data...</p>
      </div>
    );
  }

  if (error && !earnings) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto bg-gray-950 min-h-screen">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#00A859]/20 flex items-center justify-center">
          <Banknote className="text-[#00A859]" size={24} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#00A859] uppercase tracking-wider">Financials</h2>
          <h1 className="text-3xl font-bold text-white">Earnings & Payouts</h1>
          <p className="text-gray-400 mt-1">Manage your wallet and track your rides</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 border border-[#00A859]/30 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#00A859]/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <Wallet className="text-[#00A859]" size={20} />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Wallet Balance</h3>
          </div>
          <p className="text-3xl font-bold text-white relative z-10">{formatMoney(earnings?.walletBalance || 0)}</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-blue-500" size={20} />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Today's Earnings</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatMoney(earnings?.today || 0)}</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-purple-500" size={20} />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">This Week</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatMoney(earnings?.week || 0)}</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-orange-500" size={20} />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending Withdrawals</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatMoney(earnings?.withdrawalsPending || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Withdrawal Form */}
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <ArrowDownToLine className="text-[#00A859]" size={24} />
            <h2 className="text-xl font-bold text-white">Request Withdrawal</h2>
          </div>
          
          {withdrawError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="text-sm">{withdrawError}</span>
            </div>
          )}
          
          {withdrawSuccess && (
            <div className="mb-6 bg-[#00A859]/10 border border-[#00A859]/50 text-[#00A859] px-4 py-3 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={20} />
              <span className="text-sm">{withdrawSuccess}</span>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount (NGN)</label>
              <input
                type="number"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                placeholder="e.g. GTBank"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                placeholder="10 digit account number"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00A859]"
                placeholder="Name on account"
              />
            </div>
            
            <button
              type="submit"
              disabled={withdrawing}
              className="w-full mt-6 py-3 px-4 rounded-xl font-bold transition-all bg-[#00A859] hover:bg-[#008f4c] text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {withdrawing ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Withdrawal History */}
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-white">Recent Payouts</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {withdrawals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <Wallet className="text-gray-700 mb-3" size={32} />
                <p className="text-gray-500">No withdrawal requests yet.</p>
              </div>
            ) : (
              withdrawals.map(w => (
                <div key={w.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{formatMoney(w.amount)}</div>
                      <div className="text-xs text-gray-500 mt-1">{safeDate(w.createdAt)}</div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        w.status === 'PAID' ? 'bg-[#00A859]/20 text-[#00A859]' :
                        w.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {w.status}
                      </span>
                    </div>
                  </div>
                  {w.status === 'REJECTED' && w.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-red-400 text-xs font-bold mb-1">REJECTION REASON</p>
                      <p className="text-gray-300 text-sm">{w.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl overflow-x-auto">
        <h2 className="text-xl font-bold text-white mb-6">Completed Trips</h2>
        
        {(!earnings?.trips || earnings.trips.length === 0) ? (
          <div className="text-center py-10 text-gray-500">
            No completed trips to display.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-4">Trip ID</th>
                <th className="py-4 px-4">Route</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(earnings.trips || []).map(trip => (
                <tr key={trip.id} className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                  <td className="py-4 px-4 text-gray-400 text-xs truncate max-w-[100px]">{trip.id}</td>
                  <td className="py-4 px-4 font-medium text-white">{trip.route}</td>
                  <td className="py-4 px-4 text-gray-300">{safeDate(trip.date)}</td>
                  <td className="py-4 px-4 font-bold text-[#00A859]">{formatMoney(trip.amount)}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${trip.payoutStatus === 'PAID' ? 'bg-[#00A859]/20 text-[#00A859]' : 'bg-gray-800 text-gray-300'}`}>
                      {trip.payoutStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
