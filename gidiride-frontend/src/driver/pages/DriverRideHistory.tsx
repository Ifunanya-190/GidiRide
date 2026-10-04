import { useEffect, useState } from 'react';
import { driverApi } from '../../api/driver';
import { getFriendlyError } from '../../api/client';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { EarningsSummary } from '../../types/driver';
import { X } from 'lucide-react';

function money(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export function DriverRideHistory() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [error, setError] = useState('');
  const [hiddenTrips, setHiddenTrips] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    driverApi
      .getEarnings()
      .then((data) => mounted && setEarnings(data))
      .catch((err) => mounted && setError(getFriendlyError(err)));
    return () => {
      mounted = false;
    };
  }, []);

  if (!earnings) return <LoadingSpinner label="Loading driver ride history" />;

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Driver ride history</p>
          <h2>Trips completed</h2>
          <p>Driver trip history is separated from rider receipts but shares payout and route data.</p>
        </div>
      </div>
      {error && <div className="alert danger">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {earnings.trips.filter(t => !hiddenTrips.has(t.id)).map((trip) => (
          <article key={trip.id} className="rounded-[1.75rem] border-2 border-white/10 bg-white/[.03] p-5 shadow-gidi relative">
            <button 
              onClick={() => setHiddenTrips(prev => new Set(prev).add(trip.id))}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 bg-gray-900 rounded-full transition-colors"
              title="Hide trip"
            >
              <X size={16} />
            </button>
            <p className="eyebrow">{trip.id}</p>
            <h3 className="text-2xl font-black tracking-[-.05em] pr-8">{trip.route}</h3>
            <div className="mt-4 grid gap-2 text-gidi-chalk/70">
              <span className="flex justify-between gap-3">Fare <b className="text-gidi-chalk">{money(trip.amount)}</b></span>
              <span className="flex justify-between gap-3">Payout <b className="text-gidi-chalk">{trip.payoutStatus}</b></span>
              <span className="flex justify-between gap-3">Date <b className="text-gidi-chalk">{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(trip.date))}</b></span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
