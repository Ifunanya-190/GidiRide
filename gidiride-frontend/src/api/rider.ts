import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import { getStoredUser, updateSessionUser } from '../auth/session';
import type {
  FareEstimate,
  FareEstimateRequest,
  LagosLocation,
  PaymentMethod,
  RideRequest,
  RideStatus,
  RideType,
  RiderProfileSettings
} from '../types/ride';
import type { User } from '../types/user';
import { getQueue, getRideEvents, publishRideEvent, pushToQueue, removeFromQueue, updateRideEverywhere, updateRideStatusEverywhere, type RideEvent } from './realtimeStore';
import { readLocalPricingSettings } from './payments';

const RIDES_KEY = 'gidiride.rider.rides';
const PROFILE_KEY = 'gidiride.rider.profile';
const DISMISSED_CANCELLED_KEY = 'gidiride.rider.dismissedCancelled';

function getDismissedRideIds(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_CANCELLED_KEY) || '[]'); } catch { return []; }
}

export const lagosLocations: LagosLocation[] = [
  { id: 'unilag', name: 'University of Lagos Gate', area: 'Akoka / Yaba', lat: 6.5158, lng: 3.3899 },
  { id: 'yaba', name: 'Yaba Bus Stop', area: 'Yaba', lat: 6.5095, lng: 3.3711 },
  { id: 'ikeja-city-mall', name: 'Ikeja City Mall', area: 'Alausa / Ikeja', lat: 6.6145, lng: 3.3581 },
  { id: 'maryland', name: 'Maryland Mall', area: 'Maryland', lat: 6.572, lng: 3.367 },
  { id: 'vi', name: 'Eko Hotel Roundabout', area: 'Victoria Island', lat: 6.4265, lng: 3.4301 },
  { id: 'lekki-phase-1', name: 'Admiralty Way', area: 'Lekki Phase 1', lat: 6.4474, lng: 3.4723 },
  { id: 'ajah', name: 'Ajah Under Bridge', area: 'Ajah', lat: 6.4698, lng: 3.5852 },
  { id: 'chevron', name: 'Chevron Drive', area: 'Lekki', lat: 6.434, lng: 3.532 },
  { id: 'surulere', name: 'National Stadium', area: 'Surulere', lat: 6.4972, lng: 3.3647 },
  { id: 'airport', name: 'Murtala Muhammed Airport', area: 'Ikeja', lat: 6.5774, lng: 3.3212 }
];

const ridePrices: Record<RideType, { base: number; perKm: number; speed: number }> = {
  BIKE: { base: 650, perKm: 180, speed: 26 },
  ECONOMY: { base: 1200, perKm: 330, speed: 20 },
  PREMIUM: { base: 2400, perKm: 520, speed: 22 }
};

function getCurrentUser(): User | null {
  return getStoredUser();
}

function rideKey(userId: string) {
  return `${RIDES_KEY}.${userId}`;
}

function profileKey(userId: string) {
  return `${PROFILE_KEY}.${userId}`;
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(a: LagosLocation, b: LagosLocation) {
  const radius = 6371;
  const dLat = degToRad(b.lat - a.lat);
  const dLng = degToRad(b.lng - a.lng);
  const lat1 = degToRad(a.lat);
  const lat2 = degToRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.max(1.2, Number((radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1.38).toFixed(1)));
}

function getStoredRides(userId: string): RideRequest[] {
  const raw = localStorage.getItem(rideKey(userId));
  if (raw) return JSON.parse(raw) as RideRequest[];

  const sample: RideRequest[] = [
    {
      ...buildEstimate({
        pickup: lagosLocations[0],
        dropoff: lagosLocations[5],
        rideType: 'ECONOMY',
        paymentMethod: 'CASH'
      }),
      riderId: userId,
      status: 'COMPLETED',
      requestedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      driver: {
        id: 'driver-201',
        name: 'Kunle Adeyemi',
        phone: '+2349057771201',
        rating: 4.9,
        vehicle: 'Toyota Corolla',
        plateNumber: 'EKY-821KT',
        etaMin: 0
      },
      safety: { shareTrip: true, sosEnabled: true, femaleDriverOnly: false }
    },
    {
      ...buildEstimate({
        pickup: lagosLocations[2],
        dropoff: lagosLocations[3],
        rideType: 'BIKE',
        paymentMethod: 'WALLET'
      }),
      riderId: userId,
      status: 'COMPLETED',
      requestedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      driver: {
        id: 'driver-301',
        name: 'Bayo Martins',
        phone: '+2348071112222',
        rating: 4.7,
        vehicle: 'Bajaj Bike',
        plateNumber: 'KJA-44QA',
        etaMin: 0
      },
      safety: { shareTrip: false, sosEnabled: true, femaleDriverOnly: false }
    }
  ];
  localStorage.setItem(rideKey(userId), JSON.stringify(sample));
  return sample;
}

function saveRides(userId: string, rides: RideRequest[]) {
  localStorage.setItem(rideKey(userId), JSON.stringify(rides));
}

function getProfileDefaults(): RiderProfileSettings {
  const user = getCurrentUser();
  if (!user) throw new Error('No rider session found.');
  const raw = localStorage.getItem(profileKey(user.id));
  if (raw) return JSON.parse(raw) as RiderProfileSettings;
  const defaults: RiderProfileSettings = {
    emergencyContact1: '+2348011111111',
    emergencyContact2: '+2348022222222',
    emergencyContact3: '+2348033333333',
    defaultPaymentMethod: 'CASH',
    femaleDriverOnly: false,
    maleDriverOnly: false,
    autoShareTrip: true,
    liveAudioSafety: false
  };
  localStorage.setItem(profileKey(user.id), JSON.stringify(defaults));
  return defaults;
}

function buildEstimate(payload: FareEstimateRequest): FareEstimate {
  const fallbackRate = ridePrices[payload.rideType];
  const pricing = readLocalPricingSettings();
  const pricingRule = pricing.rules.find((rule) => rule.rideType === payload.rideType && rule.enabled);
  const hotZone = pricing.hotZones.find((zone) => zone.id === payload.dropoff.id && zone.active);
  const distanceKm = calculateDistanceKm(payload.pickup, payload.dropoff);
  const durationMin = Math.max(6, Math.round((distanceKm / fallbackRate.speed) * 60 + 8));
  const demandSurge = pricing.globalSurgeEnabled ? hotZone?.multiplier || pricingRule?.surgeMultiplier || 1.05 : 1;
  const femaleDriverPremium = payload.femaleDriverOnly ? 450 : 0;
  const baseFare = pricingRule?.baseFare ?? fallbackRate.base;
  const distanceFare = Math.round(distanceKm * (pricingRule?.perKm ?? fallbackRate.perKm));
  const serviceFee = pricingRule?.serviceFee ?? (payload.paymentMethod === 'CARD' || payload.paymentMethod === 'UPI' ? 180 : 90);
  const fuelAdjustment = pricingRule?.fuelAdjustment ?? 0;
  const totalFare = Math.round((baseFare + distanceFare + serviceFee + femaleDriverPremium + fuelAdjustment) * demandSurge / 50) * 50;

  return {
    id: `GR-EST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    pickup: payload.pickup,
    dropoff: payload.dropoff,
    rideType: payload.rideType,
    paymentMethod: payload.paymentMethod,
    distanceKm,
    durationMin,
    baseFare,
    distanceFare,
    surge: demandSurge,
    serviceFee,
    totalFare,
    note: demandSurge > 1.1 ? 'Hot-zone or surge pricing is active right now.' : 'Normal Lagos traffic pricing.'
  };
}

function attachDriver(ride: RideRequest): RideRequest {
  if (ride.status === 'MATCHING' || ride.status === 'REQUESTED') {
    return {
      ...ride,
      status: 'MATCHED',
      driver: {
        id: ride.safety.femaleDriverOnly ? 'driver-202' : 'driver-201',
        name: ride.safety.femaleDriverOnly ? 'Blessing Johnson' : 'Kunle Adeyemi',
        phone: ride.safety.femaleDriverOnly ? '+2348094451302' : '+2349057771201',
        rating: ride.safety.femaleDriverOnly ? 4.7 : 4.9,
        vehicle: ride.rideType === 'BIKE' ? 'Bajaj Bike' : ride.safety.femaleDriverOnly ? 'Honda Accord' : 'Toyota Corolla',
        plateNumber: ride.rideType === 'BIKE' ? 'KJA-44QA' : ride.safety.femaleDriverOnly ? 'BDG-774HN' : 'EKY-821KT',
        etaMin: Math.max(3, Math.min(12, Math.round(ride.durationMin * 0.33)))
      }
    };
  }
  return ride;
}

function syncQueuedRide(ride: RideRequest): RideRequest {
  const queueRide = getQueue().find((item) => item.id === ride.id);
  if (queueRide && JSON.stringify(queueRide) !== JSON.stringify(ride)) {
    return queueRide;
  }
  return ride;
}

function simulateRealtimeRide(ride: RideRequest): RideRequest {
  const synced = syncQueuedRide(ride);
  const ageSeconds = (Date.now() - new Date(synced.requestedAt).getTime()) / 1000;

  // Do not auto-assign a fake driver here. The request should stay in MATCHING
  // until a real logged-in driver accepts it from /driver/requests.

  if (synced.status === 'MATCHED' && ageSeconds > 16) {
    const arriving = {
      ...synced,
      status: 'DRIVER_ARRIVING' as RideStatus,
      driver: synced.driver ? { ...synced.driver, etaMin: Math.max(1, synced.driver.etaMin - 2) } : synced.driver
    };
    updateRideEverywhere(arriving);
    publishRideEvent(arriving.id, 'Driver is arriving', `${arriving.driver?.name || 'Your driver'} is on the way to pickup.`, 'yellow');
    return arriving;
  }

  if (synced.status === 'DRIVER_ARRIVING' && synced.driver) {
    const etaMin = Math.max(1, synced.driver.etaMin - 1);
    const arriving = { ...synced, driver: { ...synced.driver, etaMin } };
    updateRideEverywhere(arriving);
    return arriving;
  }

  return synced;
}


export const riderApi = {
  locations: lagosLocations,

  async estimateFare(payload: FareEstimateRequest): Promise<FareEstimate> {
    const response = await apiClient.post<FareEstimate>('/rider/rides/estimate', payload);
    return response.data;
  },

  async requestRide(payload: FareEstimateRequest): Promise<RideRequest> {
    const response = await apiClient.post<RideRequest>('/rider/rides/request', payload);
    return response.data;
  },

  async getCurrentRide(): Promise<RideRequest | null> {
    const response = await apiClient.get<RideRequest | null>('/rider/rides/current');
    return response.data;
  },

  async dismissCurrentRide(rideId: string): Promise<void> {
    // Only used locally for dismiss tracking
    const dismissed = getDismissedRideIds();
    if (!dismissed.includes(rideId)) {
      localStorage.setItem(DISMISSED_CANCELLED_KEY, JSON.stringify([...dismissed, rideId]));
    }
  },

  async advanceRide(rideId: string, status: RideStatus): Promise<RideRequest> {
    const response = await apiClient.patch<RideRequest>(`/rider/rides/${rideId}/status`, { status });
    return response.data;
  },

  async getRideHistory(): Promise<RideRequest[]> {
    const response = await apiClient.get<RideRequest[]>('/rider/rides/history');
    return response.data;
  },

  async getRideEvents(rideId: string): Promise<RideEvent[]> {
    // In a real app this would fetch from a backend events endpoint.
    // For now we keep the simple local array since events aren't fully migrated.
    return getRideEvents(rideId).filter((event) => !event.audience || event.audience.includes('RIDER'));
  },

  async getProfileSettings(): Promise<RiderProfileSettings> {
    const response = await apiClient.get<RiderProfileSettings>('/rider/profile/settings');
    return response.data;
  },

  async saveProfileSettings(payload: RiderProfileSettings): Promise<RiderProfileSettings> {
    const response = await apiClient.put<RiderProfileSettings>('/rider/profile/settings', payload);
    return response.data;
  },

  async updateProfile(payload: { fullName: string; phone: string; email: string }): Promise<any> {
    const response = await apiClient.put('/rider/profile', payload);
    return response.data;
  }
};
