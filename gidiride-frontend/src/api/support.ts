import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import { getStoredUser, updateSessionUser } from '../auth/session';
import type { RideRequest } from '../types/ride';
import type { RideDispute, RideReview, SosAlert } from '../types/support';
import type { User } from '../types/user';
import { publishRideEvent } from './realtimeStore';

const REVIEWS_KEY = 'gidiride.reviews';
const DISPUTES_KEY = 'gidiride.disputes';
const SOS_KEY = 'gidiride.sos.alerts';
const PROFILE_KEY = 'gidiride.rider.profile';

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readUser(): User | null {
  return getStoredUser();
}

function readList<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

function saveList<T>(key: string, list: T[]) {
  localStorage.setItem(key, JSON.stringify(list));
}

function riderContacts(riderId: string) {
  const raw = localStorage.getItem(`${PROFILE_KEY}.${riderId}`);
  if (!raw) return ['+2348011111111', '+2348022222222', '+2348033333333'];
  try {
    const profile = JSON.parse(raw) as { emergencyContact1?: string; emergencyContact2?: string; emergencyContact3?: string };
    return [profile.emergencyContact1, profile.emergencyContact2, profile.emergencyContact3].filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export const supportApi = {
  async submitReview(ride: RideRequest, stars: number, comment: string): Promise<RideReview> {
    try {
      const response = await apiClient.post<RideReview>(`/rider/rides/${ride.id}/review`, { stars, comment });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = readUser();
      if (!user) throw new Error('No user session found.');
      await delay();
      const review: RideReview = {
        id: `GR-REV-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        rideId: ride.id,
        reviewerId: user.id,
        driverId: ride.driver?.id,
        stars,
        comment,
        createdAt: new Date().toISOString()
      };
      saveList(REVIEWS_KEY, [review, ...readList<RideReview>(REVIEWS_KEY).filter((item) => item.rideId !== ride.id)]);
      return review;
    }
  },

  async getReviews(): Promise<RideReview[]> {
    try {
      const response = await apiClient.get<RideReview[]>('/rider/reviews');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay(120);
      return readList<RideReview>(REVIEWS_KEY);
    }
  },

  async createDispute(ride: RideRequest, category: RideDispute['category'], details: string): Promise<RideDispute> {
    try {
      const response = await apiClient.post<RideDispute>(`/support/disputes`, { rideId: ride.id, category, details });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = readUser();
      if (!user) throw new Error('No user session found.');
      await delay();
      const dispute: RideDispute = {
        id: `GR-DSP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        rideId: ride.id,
        openedBy: user.fullName,
        openedByRole: user.role,
        category,
        details,
        status: 'OPEN',
        priority: category === 'SAFETY' ? 'CRITICAL' : category === 'PAYMENT' ? 'HIGH' : 'MEDIUM',
        createdAt: new Date().toISOString()
      };
      saveList(DISPUTES_KEY, [dispute, ...readList<RideDispute>(DISPUTES_KEY)]);
      publishRideEvent(ride.id, 'Support dispute opened', `${category} dispute opened for this ride.`, category === 'SAFETY' ? 'red' : 'yellow');
      return dispute;
    }
  },

  async triggerSos(ride: RideRequest): Promise<SosAlert> {
    try {
      const response = await apiClient.post<SosAlert>('/safety/sos', { rideId: ride.id });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = readUser();
      if (!user) throw new Error('No rider session found.');
      await delay();
      const alert: SosAlert = {
        id: `GR-SOS-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        rideId: ride.id,
        riderId: user.id,
        riderName: user.fullName,
        driverName: ride.driver?.name,
        route: `${ride.pickup.area} → ${ride.dropoff.area}`,
        status: 'ACTIVE',
        emergencyContacts: riderContacts(user.id),
        createdAt: new Date().toISOString(),
        notes: 'Rider pressed SOS in live tracking.'
      };
      saveList(SOS_KEY, [alert, ...readList<SosAlert>(SOS_KEY)]);
      publishRideEvent(ride.id, 'SOS triggered', 'Emergency contacts and admin safety desk have been alerted.', 'red', ['RIDER', 'ADMIN']);
      return { ...alert, triggeredBy: 'RIDER' };
    }
  },

  async triggerDriverSos(ride: RideRequest, driverName: string): Promise<SosAlert> {
    try {
      const response = await apiClient.post<SosAlert>('/safety/sos', { rideId: ride.id, triggeredBy: 'DRIVER' });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      const alert: SosAlert = {
        id: `GR-SOS-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        rideId: ride.id,
        riderId: ride.riderId,
        riderName: `Rider ${ride.riderId.slice(-4).toUpperCase()}`,
        driverName,
        route: `${ride.pickup.area} → ${ride.dropoff.area}`,
        status: 'ACTIVE',
        emergencyContacts: [],
        createdAt: new Date().toISOString(),
        notes: 'Driver pressed SOS during an active trip.',
        triggeredBy: 'DRIVER'
      };
      saveList(SOS_KEY, [alert, ...readList<SosAlert>(SOS_KEY)]);
      publishRideEvent(ride.id, 'SOS triggered', 'Admin safety desk has been alerted.', 'red', ['DRIVER', 'ADMIN']);
      return alert;
    }
  },

  async getAdminDisputes(): Promise<RideDispute[]> {
    try {
      const response = await apiClient.get<RideDispute[]>('/admin/disputes');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      return readList<RideDispute>(DISPUTES_KEY);
    }
  },

  async getAdminSosAlerts(): Promise<SosAlert[]> {
    try {
      const response = await apiClient.get<SosAlert[]>('/admin/sos');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      return readList<SosAlert>(SOS_KEY);
    }
  },

  async resolveDispute(id: string, resolution: string): Promise<RideDispute> {
    try {
      const response = await apiClient.patch<RideDispute>(`/admin/disputes/${id}/resolve`, { resolution });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      const disputes = readList<RideDispute>(DISPUTES_KEY);
      const updated = disputes.map((item) => item.id === id ? { ...item, status: 'RESOLVED' as const, resolution, resolvedAt: new Date().toISOString() } : item);
      saveList(DISPUTES_KEY, updated);
      const found = updated.find((item) => item.id === id);
      if (!found) throw new Error('Dispute not found.');
      return found;
    }
  },

  async deleteDispute(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/disputes/${id}`);
      mockApi.clearWorkshopFlag();
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      saveList(DISPUTES_KEY, readList<RideDispute>(DISPUTES_KEY).filter((item) => item.id !== id));
    }
  },

  async resolveSos(id: string, notes: string): Promise<SosAlert> {
    try {
      const response = await apiClient.patch<SosAlert>(`/admin/sos/${id}/resolve`, { notes });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      const alerts = readList<SosAlert>(SOS_KEY);
      const updated = alerts.map((item) => item.id === id ? { ...item, status: 'RESOLVED' as const, notes, resolvedAt: new Date().toISOString() } : item);
      saveList(SOS_KEY, updated);
      const found = updated.find((item) => item.id === id);
      if (!found) throw new Error('SOS alert not found.');
      publishRideEvent(found.rideId, 'SOS resolved', notes || 'Admin safety desk closed this SOS alert.', 'green', ['RIDER', 'ADMIN']);
      return found;
    }
  },

  async deleteSos(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/sos/${id}`);
      mockApi.clearWorkshopFlag();
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      saveList(SOS_KEY, readList<SosAlert>(SOS_KEY).filter((item) => item.id !== id));
    }
  },

  async sendAdminSosMessage(rideId: string, recipient: 'RIDER' | 'DRIVER', message: string): Promise<void> {
    await delay();
    publishRideEvent(rideId, 'Message from GidiRide safety desk', message, 'yellow', [recipient, 'ADMIN']);
  },

  buildReceiptText(ride: RideRequest) {
    return `GidiRide Receipt\n\nRide: ${ride.id}\nRoute: ${ride.pickup.name} (${ride.pickup.area}) to ${ride.dropoff.name} (${ride.dropoff.area})\nType: ${ride.rideType}\nDistance: ${ride.distanceKm} km\nDuration: ${ride.durationMin} min\nPayment: ${ride.paymentMethod}\nFare: NGN ${ride.totalFare.toLocaleString()}\nDriver: ${ride.driver?.name || 'Not assigned'}\nVehicle: ${ride.driver?.vehicle || '-'} ${ride.driver?.plateNumber || ''}\nDate: ${new Date(ride.requestedAt).toLocaleString()}\n\nThank you for riding with GidiRide.`;
  }
};
