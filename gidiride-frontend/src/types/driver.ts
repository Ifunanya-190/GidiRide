import type { KycStatus } from './user';

export type DriverOnlineStatus = 'ONLINE' | 'OFFLINE';
export type RideRequestStatus = 'WAITING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface DriverDocument {
  id: string;
  label: string;
  fileName: string;
  uploadedAt: string;
  status: KycStatus;
}

export interface DriverProfile {
  userId: string;
  fullName: string;
  phone?: string;
  email?: string;
  nin: string;
  licenseNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  plateNumber: string;
  vehicleYear: string;
  homeArea: string;
  kycStatus: KycStatus;
  onlineStatus: DriverOnlineStatus;
  documents: DriverDocument[];
  rejectionReason?: string;
}

export interface DriverDashboardStats {
  onlineStatus: DriverOnlineStatus;
  kycStatus: KycStatus;
  todayTrips: number;
  todayEarnings: number;
  weeklyEarnings: number;
  acceptanceRate: number;
  rating: number;
  walletBalance: number;
}

export interface RideRequest {
  id: string;
  riderName: string;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  estimatedFare: number;
  rideType: 'Bike' | 'Economy' | 'Premium';
  requestedAt: string;
  status: RideRequestStatus;
  isSample?: boolean;
}

export interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  walletBalance: number;
  withdrawalsPending: number;
  trips: Array<{
    id: string;
    route: string;
    amount: number;
    date: string;
    payoutStatus: 'PAID' | 'PENDING';
  }>;
}
