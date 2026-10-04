import { useEffect, useState } from 'react';
import { badgeLabel, lagosFeaturesApi } from '../../api/lagosFeatures';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { DriverBadgeProfile } from '../../types/lagos';

function money(value: number) { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0); }

export function Badges() {
  const [profiles, setProfiles] = useState<DriverBadgeProfile[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    lagosFeaturesApi.getDriverBadges()
      .then(setProfiles)
      .catch((err) => setError(getFriendlyError(err)))
      .finally(() => setLoading(false)); 
  }, []);

  if (loading) return <LoadingSpinner label="Loading badge profile" />;
  return (
    <section className="grid gap-4">
      <div className="section-heading"><div><p className="eyebrow">Tip jar + skill badges</p><h2>Driver reputation</h2><p>Badges help top Lagos drivers stand out for AC, safety, music, cleanliness, and polite driving.</p></div></div>
      {error && <div className="alert danger">{error}</div>}
      
      {!profiles.length && !error && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center flex flex-col items-center">
          <h3 className="text-xl font-bold text-white mb-2">No badges yet</h3>
          <p className="text-gray-400">Complete more rides to earn badges and tips from riders.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {profiles.map((profile) => (
          <article key={profile.driverId} className="rounded-[2rem] border-2 border-white/10 bg-white/[.03] p-5 shadow-gidi grid gap-4">
            <div className="flex flex-wrap justify-between gap-3"><div><p className="eyebrow">{profile.driverId}</p><h3 className="text-2xl font-black tracking-[-.06em]">{profile.driverName}</h3></div><strong className="text-gidi-green text-2xl">{money(profile.tipTotal)}</strong></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(profile.badges).map(([badge, count]) => (
                <div key={badge} className="rounded-3xl border border-white/10 bg-black/20 p-4"><strong className="block text-gidi-yellow">{count}</strong><small className="text-gidi-chalk/65">{badgeLabel(badge as keyof typeof profile.badges)}</small></div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
