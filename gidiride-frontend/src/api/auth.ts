import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/user';

interface LooseAuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: Partial<User>;
  id?: string | number;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  gender?: string;
  banned?: boolean;
}

function normalizeAuthResponse(data: LooseAuthResponse): AuthResponse {
  const token = data.token || data.accessToken || data.jwt;
  const rawUser = (data.user || data) as Partial<User> & { name?: string; status?: string };

  if (!token) {
    throw new Error('Backend response did not include a JWT token.');
  }

  return {
    token,
    user: {
      id: String(rawUser.id || 'me'),
      fullName: rawUser.fullName || rawUser.name || 'GidiRide User',
      email: rawUser.email,
      phone: rawUser.phone,
      role: ((String(rawUser.role || 'RIDER').replace('ROLE_', '')) as User['role']) || 'RIDER',
      gender: rawUser.gender as User['gender'],
      banned: Boolean(rawUser.banned),
      createdAt: rawUser.createdAt,
      lastActiveAt: rawUser.lastActiveAt,
      kycStatus: rawUser.kycStatus,
      totalRides: rawUser.totalRides,
      rating: rawUser.rating,
      vehicle: rawUser.vehicle,
      banReason: rawUser.banReason
    }
  };
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<LooseAuthResponse>('/auth/login', payload);
      mockApi.clearWorkshopFlag();
      return normalizeAuthResponse(response.data);
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        mockApi.usingLocalWorkshopData();
        return mockApi.login(payload.emailOrPhone, payload.password);
      }
      throw error;
    }
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<LooseAuthResponse>('/auth/register', payload);
      mockApi.clearWorkshopFlag();
      return normalizeAuthResponse(response.data);
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        mockApi.usingLocalWorkshopData();
        return mockApi.register(payload);
      }
      throw error;
    }
  }
};
