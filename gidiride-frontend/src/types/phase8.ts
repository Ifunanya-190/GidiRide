import type { LagosLocation, RideType } from './ride';

export type GroupRideStatus = 'SCHEDULED' | 'BOARDING' | 'FULL' | 'COMPLETED' | 'CANCELLED';

export interface GroupRide {
  id: string;
  creatorId: string;
  routeName: string;
  pickup: LagosLocation;
  dropoff: LagosLocation;
  departureTime: string;
  seatsTotal: number;
  seatsTaken: number;
  pricePerSeat: number;
  rideType: Extract<RideType, 'ECONOMY' | 'PREMIUM'>;
  status: GroupRideStatus;
  members: Array<{ userId: string; name: string; joinedAt: string }>;
  notes: string;
}

export interface ShareTripSession {
  id: string;
  rideId: string;
  contacts: string[];
  liveAudioEnabled: boolean;
  keywordDetectionEnabled: boolean;
  safeWords: string[];
  status: 'ACTIVE' | 'ALERTED' | 'ENDED';
  createdAt: string;
  lastAlertAt?: string;
  events: Array<{ id: string; message: string; tone: 'green' | 'yellow' | 'red'; createdAt: string }>;
}
