import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Icon } from './Icon';

const routes = {
  ADMIN: [
    ['/admin', 'Admin dashboard'], ['/admin/riders', 'Manage riders'], ['/admin/drivers', 'Manage drivers'],
    ['/admin/kyc', 'KYC review'], ['/admin/pricing', 'Pricing rules'], ['/admin/disputes', 'Disputes and SOS'], ['/admin/analytics', 'Analytics']
  ],
  RIDER: [
    ['/rider', 'Rider home'], ['/rider/book', 'Book ride'], ['/rider/tracking', 'Live tracking'], ['/rider/history', 'Ride history'],
    ['/rider/wallet', 'Wallet'], ['/rider/bid-fare', 'Bid fare'], ['/rider/group-rides', 'Danfo mode'], ['/rider/share-trip', 'Share trip']
  ],
  DRIVER: [
    ['/driver', 'Driver home'], ['/driver/profile', 'KYC profile'], ['/driver/requests', 'Ride requests'], ['/driver/trip', 'Active trip'],
    ['/driver/earnings', 'Earnings'], ['/driver/bids', 'Fare bids'], ['/driver/badges', 'Badges'], ['/driver/history', 'History']
  ]
} as const;

export function CommandPalette() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const matches = useMemo(() => {
    if (!user) return [];
    const needle = query.trim().toLowerCase();
    return routes[user.role].filter(([, label]) => !needle || label.toLowerCase().includes(needle));
  }, [query, user]);

  if (!user || !open) return null;

  return (
    <div className="command-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="command-panel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-input-row">
          <span><Icon name="search" className="h-4 w-4" /> Ctrl K</span>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search GidiRide actions…" />
        </div>
        <div className="command-results">
          {matches.map(([path, label]) => (
            <button
              key={path}
              onClick={() => {
                navigate(path);
                setOpen(false);
                setQuery('');
              }}
            >
              <span><Icon name="navigation" className="h-4 w-4" /></span>
              <div>
                <strong>{label}</strong>
                <small>{path}</small>
              </div>
            </button>
          ))}
          {!matches.length && <div className="command-empty">No action found.</div>}
        </div>
      </div>
    </div>
  );
}
