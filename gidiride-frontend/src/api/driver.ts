import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import { getStoredUser, updateSessionUser } from '../auth/session';
import type {
  DriverDashboardStats,
  DriverDocument,
  DriverOnlineStatus,
  DriverProfile,
  EarningsSummary,
  RideRequest
} from '../types/driver';
import type { User } from '../types/user';
import type { RideRequest as RiderRideRequest, RideType } from '../types/ride';
import { findRideAnywhere, getQueue, publishRideEvent, recordCompletedRideRevenue, removeFromQueue, updateRideEverywhere } from './realtimeStore';

const PROFILE_KEY = 'gidiride.driver.profile';
const STATUS_KEY = 'gidiride.driver.online';
const REQUESTS_KEY = 'gidiride.driver.requests';
const ACTIVE_TRIP_KEY = 'gidiride.driver.activeTrip';
const STATS_KEY = 'gidiride.driver.stats';
const TRIPS_KEY = 'gidiride.driver.completedTrips';

interface DriverAccumulatedStats {
  todayTrips: number;
  todayEarnings: number;
  weeklyEarnings: number;
  allTimeEarnings: number;
  walletBalance: number;
  todayDate: string;
}

function statsKey(userId: string) {
  return `${STATS_KEY}.${userId}`;
}

function tripsKey(userId: string) {
  return `${TRIPS_KEY}.${userId}`;
}

function getAccumulatedStats(userId: string): DriverAccumulatedStats {
  const raw = localStorage.getItem(statsKey(userId));
  const todayLabel = new Date().toDateString();
  if (raw) {
    const stored = JSON.parse(raw) as DriverAccumulatedStats;
    // "Today" earnings reset at the start of a new day; weekly/wallet keep accumulating.
    if (stored.todayDate !== todayLabel) {
      const reset = { ...stored, todayTrips: 0, todayEarnings: 0, todayDate: todayLabel };
      localStorage.setItem(statsKey(userId), JSON.stringify(reset));
      return reset;
    }
    return stored;
  }
  const fresh: DriverAccumulatedStats = { todayTrips: 0, todayEarnings: 0, weeklyEarnings: 0, allTimeEarnings: 0, walletBalance: 0, todayDate: todayLabel };
  localStorage.setItem(statsKey(userId), JSON.stringify(fresh));
  return fresh;
}

function creditCompletedTrip(userId: string, trip: RiderRideRequest) {
  const stats = getAccumulatedStats(userId);
  const next: DriverAccumulatedStats = {
    ...stats,
    todayTrips: stats.todayTrips + 1,
    todayEarnings: stats.todayEarnings + trip.totalFare,
    weeklyEarnings: stats.weeklyEarnings + trip.totalFare,
    allTimeEarnings: stats.allTimeEarnings + trip.totalFare,
    walletBalance: stats.walletBalance + trip.totalFare
  };
  localStorage.setItem(statsKey(userId), JSON.stringify(next));

  const trips = JSON.parse(localStorage.getItem(tripsKey(userId)) || '[]') as Array<{ id: string; route: string; amount: number; date: string; payoutStatus: 'PAID' | 'PENDING' }>;
  trips.unshift({ id: trip.id, route: `${trip.pickup.area} → ${trip.dropoff.area}`, amount: trip.totalFare, date: new Date().toISOString(), payoutStatus: 'PAID' });
  localStorage.setItem(tripsKey(userId), JSON.stringify(trips.slice(0, 50)));
}

function naira(value: number) {
  return value;
}

function getCurrentUser(): User | null {
  return getStoredUser();
}

function profileKey(userId: string) {
  return `${PROFILE_KEY}.${userId}`;
}

function statusKey(userId: string) {
  return `${STATUS_KEY}.${userId}`;
}

function requestKey(userId: string) {
  return `${REQUESTS_KEY}.${userId}`;
}

function activeTripKey(userId: string) {
  return `${ACTIVE_TRIP_KEY}.${userId}`;
}

function vehicleParts(vehicle?: string | { make?: string; model?: string; plateNumber?: string }) {
  if (!vehicle) return { vehicleMake: '', vehicleModel: '', plateNumber: '' };
  if (typeof vehicle === 'object') {
    return {
      vehicleMake: vehicle.make || '',
      vehicleModel: vehicle.model || '',
      plateNumber: vehicle.plateNumber || ''
    };
  }
  const [name = '', plate = ''] = vehicle.split('—').map((part) => part.trim());
  const [vehicleMake = '', ...modelParts] = name.split(' ');
  return { vehicleMake, vehicleModel: modelParts.join(' '), plateNumber: plate };
}

function seedProfile(user: User): DriverProfile {
  const vehicle = vehicleParts(user.vehicle);
  return {
    userId: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    nin: user.kycStatus === 'APPROVED' ? '***********' : '',
    licenseNumber: user.kycStatus === 'APPROVED' ? 'LAS-DRV-2091' : '',
    vehicleMake: vehicle.vehicleMake,
    vehicleModel: vehicle.vehicleModel,
    vehicleColor: user.kycStatus === 'APPROVED' ? 'Black' : '',
    plateNumber: vehicle.plateNumber,
    vehicleYear: user.kycStatus === 'APPROVED' ? '2017' : '',
    homeArea: 'Yaba / Surulere axis',
    kycStatus: user.kycStatus || 'NOT_SUBMITTED',
    onlineStatus: (localStorage.getItem(statusKey(user.id)) as DriverOnlineStatus) || 'OFFLINE',
    documents:
      user.kycStatus === 'NOT_SUBMITTED' || !user.kycStatus
        ? []
        : [
            {
              id: 'doc-license',
              label: 'Driver license',
              fileName: 'license-upload.jpg',
              uploadedAt: new Date(Date.now() - 86400000).toISOString(),
              status: user.kycStatus
            },
            {
              id: 'doc-car-paper',
              label: 'Car papers',
              fileName: 'vehicle-papers.pdf',
              uploadedAt: new Date(Date.now() - 86400000).toISOString(),
              status: user.kycStatus
            }
          ],
    rejectionReason: user.kycStatus === 'REJECTED' ? user.banReason : undefined
  };
}

function getStoredProfile(): DriverProfile {
  const user = getCurrentUser();
  if (!user) throw new Error('No driver session found.');
  const raw = localStorage.getItem(profileKey(user.id));
  if (raw) {
    const parsed = JSON.parse(raw) as DriverProfile;
    return {
      ...parsed,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      kycStatus: user.kycStatus || parsed.kycStatus,
      onlineStatus: (localStorage.getItem(statusKey(user.id)) as DriverOnlineStatus) || parsed.onlineStatus
    };
  }
  const seeded = seedProfile(user);
  localStorage.setItem(profileKey(user.id), JSON.stringify(seeded));
  return seeded;
}

function saveProfile(profile: DriverProfile) {
  localStorage.setItem(profileKey(profile.userId), JSON.stringify(profile));
}

function seedRequests(userId: string): RideRequest[] {
  const raw = localStorage.getItem(requestKey(userId));
  if (raw) return JSON.parse(raw) as RideRequest[];
  const requests: RideRequest[] = [
    {
      id: 'GR-RQ-7712',
      riderName: 'Ngozi B.',
      pickup: 'University of Lagos Gate, Akoka',
      dropoff: 'Admiralty Way, Lekki Phase 1',
      distanceKm: 18.4,
      estimatedFare: 7200,
      rideType: 'Economy',
      requestedAt: new Date(Date.now() - 4 * 60000).toISOString(),
      status: 'WAITING',
      isSample: true
    },
    {
      id: 'GR-RQ-7713',
      riderName: 'Femi A.',
      pickup: 'Ikeja City Mall',
      dropoff: 'Maryland Mall',
      distanceKm: 6.8,
      estimatedFare: 3100,
      rideType: 'Bike',
      requestedAt: new Date(Date.now() - 12 * 60000).toISOString(),
      status: 'WAITING',
      isSample: true
    }
  ];
  localStorage.setItem(requestKey(userId), JSON.stringify(requests));
  return requests;
}

function saveRequests(userId: string, requests: RideRequest[]) {
  localStorage.setItem(requestKey(userId), JSON.stringify(requests));
}


function titleRideType(type: RideType): RideRequest['rideType'] {
  if (type === 'BIKE') return 'Bike';
  if (type === 'PREMIUM') return 'Premium';
  return 'Economy';
}

function driverRequestFromRiderRide(ride: RiderRideRequest): RideRequest {
  return {
    id: ride.id,
    riderName: `Rider ${ride.riderId.slice(-4).toUpperCase()}`,
    pickup: `${ride.pickup.name}, ${ride.pickup.area}`,
    dropoff: `${ride.dropoff.name}, ${ride.dropoff.area}`,
    distanceKm: ride.distanceKm,
    estimatedFare: ride.totalFare,
    rideType: titleRideType(ride.rideType),
    requestedAt: ride.requestedAt,
    status: 'WAITING'
  };
}

function isQueuedRiderRide(requestId: string) {
  return getQueue().some((ride) => ride.id === requestId);
}

function acceptQueuedRide(requestId: string, profile: DriverProfile, status: 'ACCEPTED' | 'DECLINED'): RideRequest {
  const queuedRide = getQueue().find((ride) => ride.id === requestId);
  if (!queuedRide) throw new Error('Ride request not found.');
  const currentDriver = getCurrentUser();
  if (queuedRide.safety.femaleDriverOnly && currentDriver?.gender !== 'FEMALE') {
    throw new Error('This rider requested a female driver.');
  }
  const driverRequest = driverRequestFromRiderRide(queuedRide);

  if (status === 'DECLINED') {
    publishRideEvent(queuedRide.id, 'Driver declined', `${profile.fullName} declined this ride. Searching continues.`, 'neutral');
    return { ...driverRequest, status: 'DECLINED' };
  }

  const acceptedRide: RiderRideRequest = {
    ...queuedRide,
    status: 'MATCHED',
    driver: {
      id: profile.userId,
      name: profile.fullName,
      phone: profile.phone || '+2340000000000',
      rating: 4.8,
      vehicle: `${profile.vehicleMake || 'GidiRide'} ${profile.vehicleModel || 'Car'}`.trim(),
      plateNumber: profile.plateNumber || 'GIDI-001',
      etaMin: Math.max(3, Math.min(12, Math.round(queuedRide.durationMin * 0.32)))
    }
  };
  updateRideEverywhere(acceptedRide);
  localStorage.setItem(activeTripKey(profile.userId), JSON.stringify(acceptedRide));
  removeFromQueue(acceptedRide.id);
  publishRideEvent(acceptedRide.id, 'Driver matched', `${profile.fullName} accepted the ride and is heading to pickup.`, 'green');
  return { ...driverRequest, status: 'ACCEPTED' };
}

export function adjustDriverWallet(driverId: string, delta: number) {
  const stats = getAccumulatedStats(driverId);
  const next = { ...stats, walletBalance: Math.max(0, stats.walletBalance + delta) };
  localStorage.setItem(statsKey(driverId), JSON.stringify(next));
}

export function getDriverWalletBalance(driverId: string): number {
  return getAccumulatedStats(driverId).walletBalance;
}

export const driverApi = {
  async getDashboard(): Promise<DriverDashboardStats> {
    try {
      const response = await apiClient.get<DriverDashboardStats>('/driver/dashboard');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const profile = getStoredProfile();
      const stats = getAccumulatedStats(profile.userId);
      return {
        onlineStatus: profile.onlineStatus,
        kycStatus: profile.kycStatus,
        todayTrips: stats.todayTrips,
        todayEarnings: naira(stats.todayEarnings),
        weeklyEarnings: naira(stats.weeklyEarnings),
        acceptanceRate: 0,
        rating: 5,
        walletBalance: naira(stats.walletBalance)
      };
    }
  },

  async getProfile(): Promise<DriverProfile> {
    try {
      const response = await apiClient.get<DriverProfile>('/driver/profile');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      return getStoredProfile();
    }
  },

  async submitKyc(payload: Omit<DriverProfile, 'documents' | 'kycStatus' | 'onlineStatus'> & { documents: DriverDocument[] }): Promise<DriverProfile> {
    try {
      const response = await apiClient.post<DriverProfile>('/driver/kyc', payload);
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const profile: DriverProfile = {
        ...getStoredProfile(),
        ...payload,
        kycStatus: 'PENDING',
        documents: payload.documents.map((doc) => ({ ...doc, status: 'PENDING' }))
      };
      saveProfile(profile);
      const vehicle = `${profile.vehicleMake} ${profile.vehicleModel} • ${profile.plateNumber}`.trim();
      await mockApi.updateDriverVehicle(profile.userId, vehicle, 'PENDING');
      const current = getCurrentUser();
      if (current) {
        updateSessionUser({ ...current, vehicle, kycStatus: 'PENDING' });
      }
      return profile;
    }
  },

  async setOnlineStatus(status: DriverOnlineStatus): Promise<DriverOnlineStatus> {
    try {
      const response = await apiClient.patch<{ onlineStatus: DriverOnlineStatus }>('/driver/status', { onlineStatus: status });
      mockApi.clearWorkshopFlag();
      return response.data.onlineStatus;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const profile = getStoredProfile();
      if (profile.kycStatus !== 'APPROVED' && status === 'ONLINE') {
        throw new Error('KYC must be approved before a driver can go online.');
      }
      localStorage.setItem(statusKey(profile.userId), status);
      saveProfile({ ...profile, onlineStatus: status });
      return status;
    }
  },

  async getRideRequests(): Promise<RideRequest[]> {
    try {
      const response = await apiClient.get<RideRequest[]>('/driver/ride-requests');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const profile = getStoredProfile();
      const currentDriver = getCurrentUser();
      const liveRequests = getQueue()
        .filter((ride) => !ride.safety.femaleDriverOnly || currentDriver?.gender === 'FEMALE')
        .map(driverRequestFromRiderRide);
      const workshop = seedRequests(profile.userId);
      return [...liveRequests, ...workshop];
    }
  },

  async respondToRequest(requestId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<RideRequest> {
    try {
      const response = await apiClient.patch<RideRequest>(`/driver/ride-requests/${requestId}`, { status });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const profile = getStoredProfile();
      if (isQueuedRiderRide(requestId)) {
        return acceptQueuedRide(requestId, profile, status);
      }
      const requests = seedRequests(profile.userId);
      const next = requests.map((request) => (request.id === requestId ? { ...request, status } : request));
      saveRequests(profile.userId, next);
      const found = next.find((request) => request.id === requestId);
      if (!found) throw new Error('Ride request not found.');
      return found;
    }
  },


  async getActiveTrip(): Promise<RiderRideRequest | null> {
    try {
      const response = await apiClient.get<RiderRideRequest | null>('/driver/trips/active');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const profile = getStoredProfile();
      const raw = localStorage.getItem(activeTripKey(profile.userId));
      if (!raw) return null;
      const trip = JSON.parse(raw) as RiderRideRequest;
      if (trip.status !== 'CANCELLED' && trip.status !== 'COMPLETED') {
        const shared = findRideAnywhere(trip.id);
        if (shared && shared.status === 'CANCELLED') {
          const cancelled = { ...trip, status: shared.status };
          localStorage.setItem(activeTripKey(profile.userId), JSON.stringify(cancelled));
          publishRideEvent(trip.id, 'Ride cancelled', 'The rider cancelled this ride.', 'red');
          return cancelled;
        }
      }
      return trip;
    }
  },

  async updateActiveTripStatus(status: RiderRideRequest['status']): Promise<RiderRideRequest> {
    try {
      const response = await apiClient.patch<RiderRideRequest>('/driver/trips/active/status', { status });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const profile = getStoredProfile();
      const raw = localStorage.getItem(activeTripKey(profile.userId));
      if (!raw) throw new Error('No active driver trip.');
      const trip = JSON.parse(raw) as RiderRideRequest;
      const updated = { ...trip, status };
      localStorage.setItem(activeTripKey(profile.userId), JSON.stringify(updated));
      updateRideEverywhere(updated);
      publishRideEvent(updated.id, 'Driver trip update', `${profile.fullName} moved trip to ${status.replace('_', ' ')}.`, status === 'COMPLETED' ? 'green' : status === 'CANCELLED' ? 'red' : 'yellow');
      if (status === 'COMPLETED') {
        creditCompletedTrip(profile.userId, updated);
        recordCompletedRideRevenue(updated.serviceFee);
        localStorage.removeItem(activeTripKey(profile.userId));
      }
      return updated;
    }
  },

  async dismissActiveTrip(): Promise<void> {
    const profile = getStoredProfile();
    localStorage.removeItem(activeTripKey(profile.userId));
  },

  async getEarnings(): Promise<EarningsSummary> {
    try {
      const response = await apiClient.get<EarningsSummary>('/driver/earnings');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const profile = getStoredProfile();
      const stats = getAccumulatedStats(profile.userId);
      const pendingWithdrawals = (JSON.parse(localStorage.getItem(`gidiride.driver.withdrawals.${profile.userId}`) || '[]') as Array<{ amount: number; status: string }>)
        .filter((item) => item.status === 'PENDING')
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        today: stats.todayEarnings,
        week: stats.weeklyEarnings,
        month: stats.allTimeEarnings,
        walletBalance: stats.walletBalance,
        withdrawalsPending: pendingWithdrawals,
        trips: JSON.parse(localStorage.getItem(tripsKey(profile.userId)) || '[]')
      };
    }
  }
};
