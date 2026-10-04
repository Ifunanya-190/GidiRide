import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFriendlyError } from '../../api/client';
import { paymentApi, providerLabel } from '../../api/payments';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { NumberField } from '../../shared/components/NumberField';
import type { PaymentProvider, SavedPaymentMethod, WalletAccount, WalletTransaction } from '../../types/payment';
import { Wallet as WalletIcon, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight, History, Hash } from 'lucide-react';

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0);
}

export function Wallet() {
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [amount, setAmount] = useState(5000);
  const [provider, setProvider] = useState<PaymentProvider>('PAYSTACK');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    const [walletData, transactionData, methodData] = await Promise.all([paymentApi.getWallet(), paymentApi.getTransactions(), paymentApi.getPaymentMethods()]);
    setWallet(walletData);
    setTransactions(transactionData || []);
    setMethods(methodData || []);
    const defaultCard = (methodData || []).find((item) => item.type === 'CARD' && item.isDefault) || (methodData || []).find((item) => item.type === 'CARD');
    setSelectedMethodId(defaultCard?.id || '');
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

  async function topUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await paymentApi.topUp({ amount, provider });
      setWallet(response.wallet);
      setTransactions((current) => [response.transaction, ...(current || [])]);
      const usedMethod = methods?.find((item) => item.id === selectedMethodId);
      const via = usedMethod ? `${usedMethod.label} •••• ${usedMethod.last4}` : 'a new Paystack checkout card';
      setSuccess(`Wallet funded with ${money(amount)} via ${via}. Ref: ${response.reference}`);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading wallet..." />;
  if (!wallet) return (
    <div className="max-w-5xl mx-auto p-8 text-center bg-gray-900 border border-gray-800 rounded-3xl mt-12">
      <h2 className="text-2xl font-bold text-white mb-2">Could not load wallet</h2>
      <p className="text-gray-400 mb-4">{error || 'There was a problem communicating with the backend.'}</p>
      <button onClick={() => window.location.reload()} className="bg-[#00A859] text-white px-6 py-2 rounded-xl font-bold">Retry</button>
    </div>
  );

  return (
    <section className="max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">My Wallet</h2>
          <p className="text-gray-400 text-lg">Top up your balance for quick and seamless rides.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-800">
          <ShieldCheck size={16} className="text-[#00A859]" /> Secured by Paystack
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
        
        {/* Balance Card */}
        <article className="bg-[#00A859] rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,168,89,0.3)] relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-white/80 font-bold text-sm tracking-widest uppercase mb-1 block">GidiRide Wallet</span>
              <span className="text-white/90 text-lg">Available Balance</span>
            </div>
            <WalletIcon className="text-white/50 w-10 h-10" />
          </div>
          
          <div className="relative z-10 mt-6">
            <strong className="text-6xl font-black text-white tracking-tight">{money(wallet.balance)}</strong>
          </div>
          
          <div className="relative z-10 mt-8 pt-4 border-t border-white/20 flex flex-col gap-1 text-white/80 text-sm font-mono">
            <span className="flex items-center gap-2"><Hash size={14} /> Paystack Customer ID: {wallet.paystackCustomerCode}</span>
            <span className="text-xs text-white/60">This identifies you to Paystack — it's not a bank account number.</span>
          </div>
        </article>

        {/* Top Up Form */}
        <form className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5" onSubmit={topUp}>
          <div className="flex items-center gap-2 mb-2 text-gray-400 border-b border-gray-800 pb-4">
            <ArrowUpRight size={20} className="text-[#00A859]" />
            <h3 className="text-xl font-bold text-white">Fund Wallet</h3>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-[-2px]">
            <NumberField label="Amount to Add" prefix="₦" min={500} value={amount} onChange={setAmount} required />
          </div>
          
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><CreditCard size={14} /> Pay With</span>
            <select 
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#00A859] transition-colors appearance-none"
              value={selectedMethodId || 'NEW_PAYSTACK'}
              onChange={(e) => {
                if (e.target.value === 'NEW_PAYSTACK') { setSelectedMethodId(''); setProvider('PAYSTACK'); }
                else { setSelectedMethodId(e.target.value); setProvider('PAYSTACK'); }
              }}
            >
              {methods?.filter((method) => method.type === 'CARD').map((method) => (
                <option key={method.id} value={method.id}>{method.label} •••• {method.last4}{method.isDefault ? ' (Default)' : ''}</option>
              ))}
              <option value="NEW_PAYSTACK">Pay via Paystack Checkout (New Card)</option>
            </select>
          </label>
          
          {(!methods || !methods.some((method) => method.type === 'CARD')) && (
            <span className="text-xs text-gray-500">No saved cards yet. <Link to="/rider/payments" className="text-blue-400 hover:underline">Add one</Link> to skip checkout next time.</span>
          )}
          
          <button 
            className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,168,89,0.2)] mt-2" 
            disabled={busy}
          >
            {busy ? 'Opening Paystack...' : 'Top Up Wallet'}
          </button>
        </form>
      </div>

      {/* Transactions Ledger */}
      <article className="bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <History className="text-blue-500 w-6 h-6" />
          <h3 className="text-2xl font-bold text-white">Wallet Ledger</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Date</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Description</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Ref / Provider</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                <th className="p-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions?.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-900/50 transition-colors group">
                  <td className="p-4 text-gray-400 text-sm">
                    {tx.createdAt ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(tx.createdAt)) : 'Unknown Date'}
                  </td>
                  <td className="p-4 text-white font-medium">{tx.description}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-gray-300 font-mono text-sm">{tx.reference}</span>
                      <span className="text-gray-500 text-xs">{providerLabel(tx.provider)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tx.status === 'SUCCESS' ? 'bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/50' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <strong className="text-lg text-white">{money(tx.amount)}</strong>
                  </td>
                </tr>
              ))}
              
              {(!transactions || transactions.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <History className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-lg font-bold text-gray-400">No transactions yet.</p>
                    <p className="text-sm">Your wallet top-ups and ride payments will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
