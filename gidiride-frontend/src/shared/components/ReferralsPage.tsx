import { FormEvent, useEffect, useState } from 'react';
import { analyticsApi } from '../../api/analytics';
import { getFriendlyError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import type { ReferralInvite, ReferralProfile } from '../../types/analytics';
import type { Role } from '../../types/user';
import { Gift, Share2, CheckCircle2, AlertCircle, X } from 'lucide-react';

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0);
}

export function ReferralsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [invites, setInvites] = useState<ReferralInvite[]>([]);
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'ADMIN'>>('RIDER');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hiddenInvites, setHiddenInvites] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    analyticsApi.getReferralProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data.profile);
        setInvites(data.invites);
      })
      .catch((err) => mounted && setError(getFriendlyError(err)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setSuccess('');
    try {
      const response = await analyticsApi.sendReferralInvite(phoneOrEmail, role);
      setProfile(response.profile);
      setInvites((current) => [response.invite, ...current]);
      setSuccess(`Referral invite sent to ${phoneOrEmail}. Code: ${response.profile.code}`);
      setPhoneOrEmail('');
    } catch (err) { setError(getFriendlyError(err)); } finally { setBusy(false); }
  }

  if (loading) return <LoadingSpinner label="Loading referrals..." />;
  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto">
      <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center shadow-xl mb-6 border border-gray-800">
        <Gift className="w-12 h-12 text-gray-500" />
      </div>
      <h2 className="text-3xl font-black text-white mb-4">Could not load referrals</h2>
      <p className="text-gray-400 mb-8">{error || 'There was an issue communicating with the backend.'}</p>
      <button className="bg-[#00A859] text-white px-8 py-3 rounded-full font-bold" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <section className="max-w-6xl mx-auto space-y-8">
      <div>
        <p className="text-[#00A859] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2"><Gift size={14} /> Referral System</p>
        <h2 className="text-4xl font-black text-white mb-2">{user?.role === 'DRIVER' ? 'Driver' : 'Rider'} Referrals</h2>
        <p className="text-gray-400 text-lg">Invite riders or drivers, track completions, and earn rewards.</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-[400px_minmax(0,1fr)] gap-8 items-start">
        
        <article className="bg-[#111] rounded-[2rem] border border-gray-800 p-8 shadow-2xl flex flex-col gap-6 sticky top-6">
          <div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Your Personal Code</p>
            <div className="bg-gradient-to-r from-[#00A859] to-[#008f4c] rounded-3xl p-6 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,168,89,0.2)]">
              <strong className="text-4xl font-black tracking-[0.2em] text-white">{profile.code}</strong>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
            <Share2 className="text-gray-500 shrink-0" size={20} />
            <span className="text-gray-400 text-sm break-all font-mono">{profile.link}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <strong className="block text-3xl font-black text-white mb-1">{profile.invited}</strong>
              <small className="text-gray-500 text-xs font-bold uppercase">Invited</small>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <strong className="block text-3xl font-black text-white mb-1">{profile.completed}</strong>
              <small className="text-gray-500 text-xs font-bold uppercase">Done</small>
            </div>
            <div className="bg-gray-900 border border-emerald-900/50 rounded-2xl p-4 text-center shadow-[inset_0_0_20px_rgba(0,168,89,0.05)]">
              <strong className="block text-2xl font-black text-[#00A859] mb-1">{money(profile.rewardBalance)}</strong>
              <small className="text-[#00A859]/70 text-xs font-bold uppercase">Rewards</small>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-8">
          
          <form onSubmit={send} className="bg-[#111] rounded-[2rem] border border-gray-800 p-8 shadow-2xl flex flex-col gap-5">
            <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2"><Share2 size={20} className="text-blue-500" /> Send Invite</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Email or Phone</span>
                <input 
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-700"
                  value={phoneOrEmail} 
                  onChange={(e) => setPhoneOrEmail(e.target.value)} 
                  placeholder="+234..."
                  required
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Invite As</span>
                <select 
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={role} 
                  onChange={(e) => setRole(e.target.value as Exclude<Role, 'ADMIN'>)}
                >
                  <option value="RIDER">Rider</option>
                  <option value="DRIVER">Driver</option>
                </select>
              </label>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 mt-2 shadow-[0_0_20px_rgba(37,99,235,0.2)]" disabled={busy || !phoneOrEmail}>
              {busy ? 'Sending...' : 'Send Referral Invite'}
            </button>
          </form>

          <article className="bg-[#111] rounded-[2rem] border border-gray-800 p-8 shadow-2xl overflow-x-auto">
            <h3 className="text-white font-bold text-xl mb-6">Invite History</h3>
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-bold rounded-tl-xl">Contact</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Reward</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold rounded-tr-xl"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {invites.filter((i) => !hiddenInvites.has(i.id)).map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{invite.phoneOrEmail}</td>
                    <td className="px-6 py-4">{invite.role}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${invite.status === 'REWARDED' ? 'bg-[#00A859]/20 text-[#00A859] border-[#00A859]/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {invite.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-yellow-500">{money(invite.reward)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invite.createdAt ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(invite.createdAt)) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setHiddenInvites(prev => new Set(prev).add(invite.id))} className="text-gray-600 hover:text-red-500 p-1 bg-gray-800 hover:bg-red-900/30 rounded-lg transition-colors">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!invites.filter((i) => !hiddenInvites.has(i.id)).length && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center bg-gray-900/30 rounded-b-xl border-dashed border-t-0">
                      <Gift className="mx-auto h-8 w-8 text-gray-700 mb-3" />
                      <span className="text-gray-500">No invites found. Send one above!</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </article>

        </div>
      </div>
    </section>
  );
}
