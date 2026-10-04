import type { RideRequest, RideStatus } from '../types/ride';

export const MATCHING_QUEUE_KEY = 'gidiride.matching.queue';
export const RIDE_EVENT_KEY = 'gidiride.ride.events';
export const USER_NOTICE_KEY = 'gidiride.user.notices';
const PLATFORM_STATS_KEY = 'gidiride.platform.stats';

interface PlatformStats {
  completedRides: number;
  revenueToday: number;
  revenueAllTime: number;
  todayDate: string;
}

function readPlatformStats(): PlatformStats {
  const raw = localStorage.getItem(PLATFORM_STATS_KEY);
  const todayLabel = new Date().toDateString();
  if (raw) {
    const stored = JSON.parse(raw) as PlatformStats;
    if (stored.todayDate !== todayLabel) {
      const reset = { ...stored, revenueToday: 0, todayDate: todayLabel };
      localStorage.setItem(PLATFORM_STATS_KEY, JSON.stringify(reset));
      return reset;
    }
    return stored;
  }
  const fresh: PlatformStats = { completedRides: 0, revenueToday: 0, revenueAllTime: 0, todayDate: todayLabel };
  localStorage.setItem(PLATFORM_STATS_KEY, JSON.stringify(fresh));
  return fresh;
}

export function recordCompletedRideRevenue(serviceFee: number) {
  const stats = readPlatformStats();
  const next: PlatformStats = {
    ...stats,
    completedRides: stats.completedRides + 1,
    revenueToday: stats.revenueToday + serviceFee,
    revenueAllTime: stats.revenueAllTime + serviceFee
  };
  localStorage.setItem(PLATFORM_STATS_KEY, JSON.stringify(next));
}

export function getPlatformStats(): { completedRides: number; revenueToday: number; revenueAllTime: number } {
  const stats = readPlatformStats();
  return { completedRides: stats.completedRides, revenueToday: stats.revenueToday, revenueAllTime: stats.revenueAllTime };
}

export const RIDER_RIDES_PREFIX = 'gidiride.rider.rides';

export interface UserNotice {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  tone: 'green' | 'yellow' | 'red' | 'neutral';
}

export function publishUserNotice(userId: string, title: string, body: string, tone: UserNotice['tone'] = 'yellow') {
  const raw = localStorage.getItem(USER_NOTICE_KEY);
  const notices = raw ? (JSON.parse(raw) as UserNotice[]) : [];
  const next: UserNotice = { id: crypto.randomUUID(), userId, title, body, createdAt: new Date().toISOString(), tone };
  localStorage.setItem(USER_NOTICE_KEY, JSON.stringify([next, ...notices].slice(0, 50)));
  window.dispatchEvent(new CustomEvent('gidiride:ride-event', { detail: next }));
}

export function getUserNotices(userId: string): UserNotice[] {
  const raw = localStorage.getItem(USER_NOTICE_KEY);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as UserNotice[]).filter((notice) => notice.userId === userId);
  } catch {
    return [];
  }
}

export interface RideEvent {
  id: string;
  rideId: string;
  title: string;
  body: string;
  createdAt: string;
  tone: 'green' | 'yellow' | 'red' | 'neutral';
  /** When set, only these roles (plus the ride's own rider/driver match check) may see this event. Omitted = visible to rider, driver, and admin (default, backward compatible). */
  audience?: Array<'RIDER' | 'DRIVER' | 'ADMIN'>;
}

export function getQueue(): RideRequest[] {
  const raw = localStorage.getItem(MATCHING_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RideRequest[];
  } catch {
    localStorage.removeItem(MATCHING_QUEUE_KEY);
    return [];
  }
}

export function saveQueue(queue: RideRequest[]) {
  localStorage.setItem(MATCHING_QUEUE_KEY, JSON.stringify(queue));
}

export function pushToQueue(ride: RideRequest) {
  const queue = getQueue().filter((item) => item.id !== ride.id);
  saveQueue([ride, ...queue]);
  publishRideEvent(ride.id, 'Ride request broadcast', `${ride.pickup.area} to ${ride.dropoff.area} is searching for a driver.`, 'yellow');
}

export function removeFromQueue(rideId: string) {
  saveQueue(getQueue().filter((ride) => ride.id !== rideId));
}

export function getRiderRides(riderId: string): RideRequest[] {
  const raw = localStorage.getItem(`${RIDER_RIDES_PREFIX}.${riderId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RideRequest[];
  } catch {
    return [];
  }
}

export function saveRiderRides(riderId: string, rides: RideRequest[]) {
  localStorage.setItem(`${RIDER_RIDES_PREFIX}.${riderId}`, JSON.stringify(rides));
}

export function upsertRiderRide(ride: RideRequest) {
  const rides = getRiderRides(ride.riderId);
  const exists = rides.some((item) => item.id === ride.id);
  saveRiderRides(ride.riderId, exists ? rides.map((item) => (item.id === ride.id ? ride : item)) : [ride, ...rides]);
}

export function updateRideEverywhere(ride: RideRequest) {
  upsertRiderRide(ride);
  const shouldRemainQueued = ride.status === 'MATCHING' || ride.status === 'REQUESTED';
  if (shouldRemainQueued) {
    pushToQueue(ride);
  } else {
    removeFromQueue(ride.id);
  }
}

export function updateRideStatusEverywhere(rideId: string, status: RideStatus): RideRequest | null {
  const queueRide = getQueue().find((ride) => ride.id === rideId);
  if (queueRide) {
    const next = { ...queueRide, status };
    updateRideEverywhere(next);
    return next;
  }

  const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${RIDER_RIDES_PREFIX}.`));
  for (const key of keys) {
    const rides = JSON.parse(localStorage.getItem(key) || '[]') as RideRequest[];
    const found = rides.find((ride) => ride.id === rideId);
    if (found) {
      const next = { ...found, status };
      const riderId = key.replace(`${RIDER_RIDES_PREFIX}.`, '');
      saveRiderRides(riderId, rides.map((ride) => (ride.id === rideId ? next : ride)));
      if (status === 'CANCELLED' || status === 'COMPLETED') removeFromQueue(rideId);
      return next;
    }
  }
  return null;
}

export function findRideAnywhere(rideId: string): RideRequest | null {
  const queueRide = getQueue().find((ride) => ride.id === rideId);
  if (queueRide) return queueRide;
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${RIDER_RIDES_PREFIX}.`));
  for (const key of keys) {
    const rides = JSON.parse(localStorage.getItem(key) || '[]') as RideRequest[];
    const found = rides.find((ride) => ride.id === rideId);
    if (found) return found;
  }
  return null;
}

export function publishRideEvent(rideId: string, title: string, body: string, tone: RideEvent['tone'] = 'neutral', audience?: RideEvent['audience']) {
  const raw = localStorage.getItem(RIDE_EVENT_KEY);
  const events = raw ? (JSON.parse(raw) as RideEvent[]) : [];
  const next: RideEvent = { id: crypto.randomUUID(), rideId, title, body, createdAt: new Date().toISOString(), tone, ...(audience ? { audience } : {}) };
  localStorage.setItem(RIDE_EVENT_KEY, JSON.stringify([next, ...events].slice(0, 30)));
  window.dispatchEvent(new CustomEvent('gidiride:ride-event', { detail: next }));
}

export function getRideEvents(rideId: string): RideEvent[] {
  const raw = localStorage.getItem(RIDE_EVENT_KEY);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as RideEvent[]).filter((event) => event.rideId === rideId);
  } catch {
    return [];
  }
}
