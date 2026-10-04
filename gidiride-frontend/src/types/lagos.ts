import type { LagosLocation, RideType } from './ride';

export type BidStatus = 'OPEN' | 'BIDDED' | 'ACCEPTED' | 'CANCELLED';
export type DriverBidStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type SkillBadge = 'SAFE_DRIVER' | 'GOOD_AC' | 'PLAYS_MY_MUSIC' | 'CLEAN_CAR' | 'FAST_PICKUP' | 'POLITE';

export interface BidFareRequest {
  id: string;
  riderId: string;
  riderName: string;
  pickup: LagosLocation;
  dropoff: LagosLocation;
  rideType: RideType;
  proposedCash: number;
  barterOffer?: string;
  femaleDriverOnly: boolean;
  maleDriverOnly: boolean;
  notes: string;
  status: BidStatus;
  createdAt: string;
  acceptedBidId?: string;
}

export interface DriverBid {
  id: string;
  bidRequestId: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  vehicle: string;
  cashAmount: number;
  acceptsBarter: boolean;
  message: string;
  etaMin: number;
  status: DriverBidStatus;
  createdAt: string;
}

export interface FuelSplitQuote {
  rideId: string;
  oldFuelPrice: number;
  newFuelPrice: number;
  extraCost: number;
  riderShare: number;
  driverShare: number;
  explanation: string;
}

export interface DriverBadgeProfile {
  driverId: string;
  driverName: string;
  badges: Record<SkillBadge, number>;
  tipTotal: number;
  lastTipAt?: string;
}

export interface TipPayload {
  driverId: string;
  driverName: string;
  amount: number;
  badge: SkillBadge;
  note: string;
}
