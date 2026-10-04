import { FormEvent, useEffect, useState } from 'react';
import { getFriendlyError } from '../../api/client';
import { paymentApi, providerLabel } from '../../api/payments';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { SavedPaymentMethod } from '../../types/payment';
import { CreditCard, CheckCircle2, AlertCircle, X, Check, Plus, ShieldCheck } from 'lucide-react';

export function Payments() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [last4, setLast4] = useState('4242');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    paymentApi
      .getPaymentMethods()
      .then((data) => mounted && setMethods(data || []))
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function addCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId('new');
    setError('');
    setSuccess('');
    try {
      setMethods(await paymentApi.addMockCard(last4.slice(-4)) || []);
      setSuccess('Card saved successfully. It is now available for wallet top-ups.');
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyId('');
    }
  }

  async function makeDefault(id: string) {
    setBusyId(id);
    setError('');
    try {
      setMethods(await paymentApi.setDefaultPaymentMethod(id) || []);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyId('');
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Are you sure you want to remove this card?")) return;
    setBusyId(id);
    setError('');
    try {
      setMethods(await paymentApi.removePaymentMethod(id) || []);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setBusyId('');
    }
  }

  if (loading) return <LoadingSpinner label="Loading payment methods..." />;

  return (
    <section className="max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">Payment Methods</h2>
          <p className="text-gray-400 text-lg">Manage your saved cards for quick wallet top-ups.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        
        {/* Saved Cards */}
        <article className="bg-[#111] border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><CreditCard size={24} className="text-[#00A859]" /> Saved Cards</h3>
          
          <div className="flex flex-col gap-4">
            {methods?.map((method) => (
              <div key={method.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${method.isDefault ? 'bg-[#00A859]/5 border-[#00A859]/30' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
                
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${method.isDefault ? 'bg-[#00A859] text-white shadow-[0_0_15px_rgba(0,168,89,0.3)]' : 'bg-gray-800 text-gray-400'}`}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <strong className="text-white text-lg block">{method.label}</strong>
                    <span className="text-gray-500 text-sm">{providerLabel(method.provider)} {method.last4 ? `•••• ${method.last4}` : ''}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {method.isDefault ? (
                    <span className="bg-[#00A859]/20 text-[#00A859] border border-[#00A859]/30 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Check size={14} /> Default
                    </span>
                  ) : (
                    <button 
                      className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      disabled={busyId === method.id} 
                      onClick={() => makeDefault(method.id)}
                    >
                      Set as Default
                    </button>
                  )}
                  <button 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 disabled:opacity-50"
                    disabled={busyId === method.id} 
                    onClick={() => remove(method.id)}
                    aria-label="Remove card"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            {(!methods || methods.length === 0) && (
              <div className="text-center p-12 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
                <CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <h4 className="text-gray-300 font-bold">No saved cards</h4>
                <p className="text-gray-500 text-sm mt-1">Add a mock card below to quickly top up your wallet.</p>
              </div>
            )}
          </div>
        </article>

        {/* Add Card Form */}
        <form className="bg-[#111] border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 sticky top-6" onSubmit={addCard}>
          <div className="flex items-center gap-2 mb-2 text-gray-400 border-b border-gray-800 pb-4">
            <Plus size={20} className="text-blue-500" />
            <h3 className="text-xl font-bold text-white">Add New Card</h3>
          </div>
          
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Card Last 4 Digits</span>
            <input 
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-colors text-xl tracking-[0.5em] font-mono placeholder-gray-700" 
              maxLength={4} 
              value={last4} 
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} 
              placeholder="1234"
            />
            <span className="text-xs text-gray-500">For mock testing purposes only. Enter any 4 digits.</span>
          </label>
          
          <button 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 mt-2" 
            disabled={busyId === 'new' || last4.length < 4}
          >
            {busyId === 'new' ? 'Saving...' : 'Save Card'}
          </button>
        </form>
        
      </div>
    </section>
  );
}
