import { useCallback, useEffect, useState } from 'react';
import { getFriendlyError } from '../../api/client';
import { riderApi } from '../../api/rider';
import type { RideRequest } from '../../types/ride';
import type { RideEvent } from '../../api/realtimeStore';

export function useRideRealtime() {
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [events, setEvents] = useState<RideEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const current = await riderApi.getCurrentRide();
      setRide(current);
      if (current) {
        setEvents(await riderApi.getRideEvents(current.id));
      } else {
        setEvents([]);
      }
      setConnected(true);
    } catch (err) {
      setError(getFriendlyError(err));
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 2500);
    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes('gidiride')) refresh();
    };
    const onRideEvent = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('gidiride:ride-event', onRideEvent);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('gidiride:ride-event', onRideEvent);
    };
  }, [refresh]);

  return { ride, setRide, events, loading, error, setError, isConnected, refresh };
}
