import type { Role } from './user';

export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
export type SosStatus = 'ACTIVE' | 'ESCALATED' | 'RESOLVED';

export interface RideReview {
  id: string;
  rideId: string;
  reviewerId: string;
  driverId?: string;
  stars: number;
  comment: string;
  createdAt: string;
}

export interface RideDispute {
  id: string;
  rideId: string;
  openedBy: string;
  openedByRole: Role;
  category: 'FARE' | 'SAFETY' | 'DRIVER' | 'RIDER' | 'PAYMENT' | 'OTHER';
  details: string;
  status: DisputeStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface SosAlert {
  id: string;
  rideId: string;
  riderId: string;
  riderName: string;
  driverName?: string;
  route: string;
  status: SosStatus;
  emergencyContacts: string[];
  createdAt: string;
  resolvedAt?: string;
  notes?: string;
  triggeredBy?: 'RIDER' | 'DRIVER';
}
