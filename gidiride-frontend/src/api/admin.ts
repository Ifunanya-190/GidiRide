import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import { publishUserNotice } from './realtimeStore';
import type { DashboardStats } from '../types/common';
import type { DriverProfile } from '../types/driver';
import type { Role, User } from '../types/user';

const WARNINGS_KEY = 'gidiride.admin.warnings';

export interface UserWarning {
  id: string;
  userId: string;
  reason: string;
  issuedAt: string;
}

export interface AccountTimelineEntry {
  id: string;
  type: 'RIDE' | 'WARNING' | 'BAN';
  title: string;
  detail: string;
  at: string;
}

function readWarnings(): UserWarning[] {
  try { return JSON.parse(localStorage.getItem(WARNINGS_KEY) || '[]') as UserWarning[]; } catch { return []; }
}

function normalizeUsers(data: unknown): User[] {
  if (Array.isArray(data)) return data.map(normalizeUser);
  if (typeof data === 'object' && data !== null) {
    const candidate = data as { users?: unknown; data?: unknown; content?: unknown };
    if (Array.isArray(candidate.users)) return candidate.users.map(normalizeUser);
    if (Array.isArray(candidate.data)) return candidate.data.map(normalizeUser);
    if (Array.isArray(candidate.content)) return candidate.content.map(normalizeUser);
  }
  return [];
}

function normalizeUser(raw: unknown): User {
  const user = raw as Partial<User> & { name?: string; status?: string };
  return {
    id: String(user.id || crypto.randomUUID()),
    fullName: user.fullName || user.name || 'Unnamed account',
    email: user.email,
    phone: user.phone,
    role: (String(user.role || 'RIDER').replace('ROLE_', '') || 'RIDER') as Role,
    gender: user.gender,
    banned: Boolean(user.banned || user.status === 'BANNED'),
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    kycStatus: user.kycStatus,
    totalRides: user.totalRides,
    rating: user.rating,
    vehicle: user.vehicle,
    banReason: user.banReason
  };
}

function normalizeStats(data: Partial<DashboardStats>): DashboardStats {
  return {
    totalUsers: Number(data.totalUsers || 0),
    totalRiders: Number(data.totalRiders || 0),
    totalDrivers: Number(data.totalDrivers || 0),
    bannedUsers: Number(data.bannedUsers || 0),
    activeDrivers: Number(data.activeDrivers || 0),
    completedRides: Number(data.completedRides || 0),
    revenueToday: Number(data.revenueToday || 0)
  };
}

export const adminApi = {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/admin/stats');
      mockApi.clearWorkshopFlag();
      return normalizeStats(response.data);
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        mockApi.usingLocalWorkshopData();
        return mockApi.stats();
      }
      throw error;
    }
  },

  async getUsers(role?: Role): Promise<User[]> {
    try {
      const response = await apiClient.get('/admin/users', { params: role ? { role } : undefined });
      mockApi.clearWorkshopFlag();
      return normalizeUsers(response.data);
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        mockApi.usingLocalWorkshopData();
        return mockApi.users(role);
      }
      throw error;
    }
  },

  async banUser(userId: string, reason: string): Promise<User> {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/ban`, { reason });
      mockApi.clearWorkshopFlag();
      return normalizeUser(response.data);
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        mockApi.usingLocalWorkshopData();
        return mockApi.setBan(userId, true, reason);
      }
      throw error;
    }
  },

  async unbanUser(userId: string): Promise<User> {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/unban`);
      mockApi.clearWorkshopFlag();
      return normalizeUser(response.data);
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        mockApi.usingLocalWorkshopData();
        return mockApi.setBan(userId, false);
      }
      throw error;
    }
  },

  async refundUser(userId: string, amount: number): Promise<void> {
    const response = await apiClient.post('/admin/refund', { userId, amount });
    return response.data;
  },

  async getRideContext(rideId: string): Promise<{ rider?: User; driver?: User; route?: string; totalFare?: number; status?: string; paymentMethod?: string; rideType?: string }> {
    try {
      const response = await apiClient.get(`/admin/rides/${rideId}/context`);
      const data = response.data as any;
      return {
        rider: data.rider ? normalizeUser(data.rider) : undefined,
        driver: data.driver ? normalizeUser(data.driver) : undefined,
        route: data.route,
        totalFare: data.totalFare,
        status: data.status,
        paymentMethod: data.paymentMethod,
        rideType: data.rideType,
      };
    } catch {
      return {};
    }
  },

  async warnUser(userId: string, reason: string): Promise<void> {
    try {
      await apiClient.post(`/admin/users/${userId}/warn`, { reason });
      mockApi.clearWorkshopFlag();
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await new Promise((resolve) => setTimeout(resolve, 260));
      const warning: UserWarning = { id: `GR-WARN-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, userId, reason, issuedAt: new Date().toISOString() };
      localStorage.setItem(WARNINGS_KEY, JSON.stringify([warning, ...readWarnings()]));
    }
    publishUserNotice(userId, 'Policy warning from GidiRide', reason, 'red');
  },

  async getWarnings(userId: string): Promise<UserWarning[]> {
    return readWarnings().filter((item) => item.userId === userId);
  },

  async getAccountTimeline(user: User): Promise<AccountTimelineEntry[]> {
    const entries: AccountTimelineEntry[] = [];

    for (const warning of readWarnings().filter((item) => item.userId === user.id)) {
      entries.push({ id: warning.id, type: 'WARNING', title: 'Policy warning issued', detail: warning.reason, at: warning.issuedAt });
    }

    if (user.role === 'RIDER') {
      try {
        const rides = JSON.parse(localStorage.getItem(`gidiride.rider.rides.${user.id}`) || '[]') as Array<{ id: string; pickup: { area: string }; dropoff: { area: string }; totalFare: number; status: string; requestedAt: string }>;
        for (const ride of rides) {
          entries.push({
            id: ride.id,
            type: 'RIDE',
            title: `${ride.pickup.area} → ${ride.dropoff.area}`,
            detail: `${ride.status.replace('_', ' ')} · ₦${ride.totalFare.toLocaleString()}`,
            at: ride.requestedAt
          });
        }
      } catch {
        // no ride history yet
      }
    }

    if (user.role === 'DRIVER') {
      try {
        const trips = JSON.parse(localStorage.getItem(`gidiride.driver.completedTrips.${user.id}`) || '[]') as Array<{ id: string; route: string; amount: number; date: string }>;
        for (const trip of trips) {
          entries.push({ id: trip.id, type: 'RIDE', title: trip.route, detail: `Completed · ₦${trip.amount.toLocaleString()} earned`, at: trip.date });
        }
      } catch {
        // no trip history yet
      }
    }

    if (user.banned) {
      entries.push({ id: `${user.id}-ban`, type: 'BAN', title: 'Account currently banned', detail: user.banReason || 'No reason on file', at: user.lastActiveAt || new Date().toISOString() });
    }

    return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  },

  async getDriverDocuments(driverId: string): Promise<DriverProfile | null> {
    try {
      const response = await apiClient.get<DriverProfile>(`/admin/drivers/${driverId}/profile`);
      return response.data;
    } catch {
      return null;
    }
  },

  async approveDriverKyc(userId: string): Promise<User> {
    try {
      const response = await apiClient.patch(`/admin/drivers/${userId}/kyc/approve`);
      mockApi.clearWorkshopFlag();
      return normalizeUser(response.data);
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        mockApi.usingLocalWorkshopData();
        return mockApi.setKycStatus(userId, 'APPROVED');
      }
      throw error;
    }
  },

  async rejectDriverKyc(userId: string, reason: string): Promise<User> {
    try {
      const response = await apiClient.patch(`/admin/drivers/${userId}/kyc/reject`, { reason });
      mockApi.clearWorkshopFlag();
      return normalizeUser(response.data);
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        mockApi.usingLocalWorkshopData();
        return mockApi.setKycStatus(userId, 'REJECTED', reason);
      }
      throw error;
    }
  }
};
