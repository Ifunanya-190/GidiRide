import type { PaymentMethod, RideType } from './ride';

export type PaymentProvider = 'PAYSTACK' | 'CASH' | 'WALLET' | 'CARD_MOCK';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type WithdrawalStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface RidePricingRule {
  rideType: RideType;
  label: string;
  baseFare: number;
  perKm: number;
  serviceFee: number;
  surgeMultiplier: number;
  fuelAdjustment: number;
  enabled: boolean;
}

export interface PricingSettings {
  rules: RidePricingRule[];
  globalSurgeEnabled: boolean;
  hotZones: Array<{
    id: string;
    name: string;
    multiplier: number;
    active: boolean;
  }>;
  updatedAt: string;
}

export interface WalletAccount {
  userId: string;
  balance: number;
  currency: 'NGN';
  paystackCustomerCode?: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'TOP_UP' | 'RIDE_PAYMENT' | 'REFUND' | 'DRIVER_EARNING' | 'WITHDRAWAL';
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  reference: string;
  description: string;
  createdAt: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: Exclude<PaymentMethod, 'CASH' | 'UPI'> | 'BANK_TRANSFER';
  label: string;
  last4?: string;
  provider: PaymentProvider;
  isDefault: boolean;
}

export interface TopUpRequest {
  amount: number;
  provider: PaymentProvider;
}

export interface TopUpResponse {
  authorizationUrl?: string;
  reference: string;
  wallet: WalletAccount;
  transaction: WalletTransaction;
}

export interface WithdrawalRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface DriverWithdrawal extends WithdrawalRequest {
  id: string;
  driverId: string;
  status: WithdrawalStatus;
  createdAt: string;
  rejectionReason?: string;
}
