export type RideType = 'BIKE' | 'ECONOMY' | 'PREMIUM';
export type PaymentMethod = 'CASH' | 'CARD' | 'WALLET' | 'UPI';
export type RideStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'MATCHING'
  | 'MATCHED'
  | 'DRIVER_ARRIVING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface LagosLocation {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
}

export interface FareEstimateRequest {
  pickup: LagosLocation;
  dropoff: LagosLocation;
  rideType: RideType;
  paymentMethod: PaymentMethod;
  femaleDriverOnly?: boolean;
  maleDriverOnly?: boolean;
}

export interface FareEstimate {
  id: string;
  pickup: LagosLocation;
  dropoff: LagosLocation;
  rideType: RideType;
  paymentMethod: PaymentMethod;
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  distanceFare: number;
  surge: number;
  serviceFee: number;
  totalFare: number;
  note: string;
}

export interface RideRequest extends FareEstimate {
  riderId: string;
  riderName?: string;
  status: RideStatus;
  requestedAt: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    vehicle: string;
    plateNumber: string;
    etaMin: number;
  };
  safety: {
    shareTrip: boolean;
    sosEnabled: boolean;
    femaleDriverOnly: boolean;
  };
}

export interface RiderProfileSettings {
  emergencyContact1: string;
  emergencyContact2: string;
  emergencyContact3: string;
  defaultPaymentMethod: PaymentMethod;
  femaleDriverOnly: boolean;
  maleDriverOnly: boolean;
  autoShareTrip: boolean;
  liveAudioSafety: boolean;
}
