import type { Role } from './user';

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface HeatMapPoint {
  id: string;
  area: string;
  intensity: number;
  rides: number;
  revenue: number;
  lat: number;
  lng: number;
}

export interface AdminAnalyticsSnapshot {
  generatedAt: string;
  totals: {
    rides: number;
    revenue: number;
    riders: number;
    drivers: number;
    activeDrivers: number;
    disputes: number;
    sosAlerts: number;
    referrals: number;
  };
  revenueSeries: SeriesPoint[];
  rideSeries: SeriesPoint[];
  peakHours: SeriesPoint[];
  heatMap: HeatMapPoint[];
  paymentMix: SeriesPoint[];
  featureUsage: SeriesPoint[];
}

export interface ReferralProfile {
  id: string;
  ownerId: string;
  ownerRole: Role;
  code: string;
  link: string;
  invited: number;
  completed: number;
  rewardBalance: number;
  createdAt: string;
}

export interface ReferralInvite {
  id: string;
  profileId: string;
  phoneOrEmail: string;
  role: Exclude<Role, 'ADMIN'>;
  status: 'SENT' | 'SIGNED_UP' | 'REWARDED';
  reward: number;
  createdAt: string;
}

export interface NotificationPreference {
  userId: string;
  pushEnabled: boolean;
  rideUpdates: boolean;
  promos: boolean;
  safetyAlerts: boolean;
  earnings: boolean;
  endpoint?: string;
  updatedAt: string;
}
