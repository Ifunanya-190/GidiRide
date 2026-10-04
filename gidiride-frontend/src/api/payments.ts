import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import { getStoredUser, updateSessionUser } from '../auth/session';
import { adjustDriverWallet, getDriverWalletBalance } from './driver';
import type {
  DriverWithdrawal,
  PaymentProvider,
  PricingSettings,
  SavedPaymentMethod,
  TopUpRequest,
  TopUpResponse,
  WalletAccount,
  WalletTransaction,
  WithdrawalRequest
} from '../types/payment';
import type { User } from '../types/user';

export const PRICING_KEY = 'gidiride.pricing.settings';
const WALLET_PREFIX = 'gidiride.wallet';
const TRANSACTIONS_PREFIX = 'gidiride.wallet.transactions';
const METHODS_PREFIX = 'gidiride.payment.methods';
const WITHDRAWALS_PREFIX = 'gidiride.driver.withdrawals';

export const defaultPricingSettings: PricingSettings = {
  globalSurgeEnabled: true,
  updatedAt: new Date().toISOString(),
  rules: [
    { rideType: 'BIKE', label: 'Bike', baseFare: 650, perKm: 180, serviceFee: 90, surgeMultiplier: 1.05, fuelAdjustment: 0, enabled: true },
    { rideType: 'ECONOMY', label: 'Economy', baseFare: 1200, perKm: 330, serviceFee: 120, surgeMultiplier: 1.08, fuelAdjustment: 0, enabled: true },
    { rideType: 'PREMIUM', label: 'Premium', baseFare: 2400, perKm: 520, serviceFee: 180, surgeMultiplier: 1.12, fuelAdjustment: 0, enabled: true }
  ],
  hotZones: [
    { id: 'lekki-phase-1', name: 'Lekki Phase 1', multiplier: 1.18, active: true },
    { id: 'vi', name: 'Victoria Island', multiplier: 1.16, active: true },
    { id: 'airport', name: 'Airport', multiplier: 1.14, active: false }
  ]
};

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCurrentUser(): User | null {
  return getStoredUser();
}

function walletKey(userId: string) {
  return `${WALLET_PREFIX}.${userId}`;
}

function transactionKey(userId: string) {
  return `${TRANSACTIONS_PREFIX}.${userId}`;
}

function methodKey(userId: string) {
  return `${METHODS_PREFIX}.${userId}`;
}

function withdrawalKey(driverId: string) {
  return `${WITHDRAWALS_PREFIX}.${driverId}`;
}

export function readLocalPricingSettings(): PricingSettings {
  const raw = localStorage.getItem(PRICING_KEY);
  if (!raw) {
    localStorage.setItem(PRICING_KEY, JSON.stringify(defaultPricingSettings));
    return defaultPricingSettings;
  }
  try {
    const parsed = JSON.parse(raw) as PricingSettings;
    return { ...defaultPricingSettings, ...parsed, rules: parsed.rules || defaultPricingSettings.rules };
  } catch {
    localStorage.setItem(PRICING_KEY, JSON.stringify(defaultPricingSettings));
    return defaultPricingSettings;
  }
}

function saveLocalPricingSettings(settings: PricingSettings) {
  localStorage.setItem(PRICING_KEY, JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }));
}

function getWallet(userId: string): WalletAccount {
  const raw = localStorage.getItem(walletKey(userId));
  if (raw) return JSON.parse(raw) as WalletAccount;
  const wallet: WalletAccount = {
    userId,
    balance: 0,
    currency: 'NGN',
    paystackCustomerCode: `CUS_${userId.slice(-6).toUpperCase()}`,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(walletKey(userId), JSON.stringify(wallet));
  return wallet;
}

function saveWallet(wallet: WalletAccount) {
  localStorage.setItem(walletKey(wallet.userId), JSON.stringify({ ...wallet, updatedAt: new Date().toISOString() }));
}

function getTransactions(userId: string): WalletTransaction[] {
  const raw = localStorage.getItem(transactionKey(userId));
  if (raw) return JSON.parse(raw) as WalletTransaction[];
  const transactions: WalletTransaction[] = [];
  localStorage.setItem(transactionKey(userId), JSON.stringify(transactions));
  return transactions;
}

function saveTransactions(userId: string, transactions: WalletTransaction[]) {
  localStorage.setItem(transactionKey(userId), JSON.stringify(transactions));
}

function getPaymentMethods(userId: string): SavedPaymentMethod[] {
  const raw = localStorage.getItem(methodKey(userId));
  if (raw) return JSON.parse(raw) as SavedPaymentMethod[];
  const methods: SavedPaymentMethod[] = [
    { id: 'pm-wallet', type: 'WALLET', label: 'GidiRide Wallet', provider: 'WALLET', isDefault: true },
    { id: 'pm-card-4242', type: 'CARD', label: 'Paystack Visa', last4: '4242', provider: 'PAYSTACK', isDefault: false }
  ];
  localStorage.setItem(methodKey(userId), JSON.stringify(methods));
  return methods;
}

function getWithdrawals(driverId: string): DriverWithdrawal[] {
  const raw = localStorage.getItem(withdrawalKey(driverId));
  if (raw) return JSON.parse(raw) as DriverWithdrawal[];
  const list: DriverWithdrawal[] = [];
  localStorage.setItem(withdrawalKey(driverId), JSON.stringify(list));
  return list;
}

function saveWithdrawals(driverId: string, withdrawals: DriverWithdrawal[]) {
  localStorage.setItem(withdrawalKey(driverId), JSON.stringify(withdrawals));
}

export const pricingApi = {
  async getPricing(): Promise<PricingSettings> {
    try {
      const response = await apiClient.get<PricingSettings>('/admin/pricing');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      return readLocalPricingSettings();
    }
  },

  async savePricing(settings: PricingSettings): Promise<PricingSettings> {
    try {
      const response = await apiClient.put<PricingSettings>('/admin/pricing', settings);
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      const next = { ...settings, updatedAt: new Date().toISOString() };
      saveLocalPricingSettings(next);
      return next;
    }
  }
};

export const paymentApi = {
  async getWallet(): Promise<WalletAccount> {
    try {
      const response = await apiClient.get<WalletAccount>('/rider/wallet');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = getCurrentUser();
      if (!user) throw new Error('No user session found.');
      await delay();
      return getWallet(user.id);
    }
  },

  async getTransactions(): Promise<WalletTransaction[]> {
    try {
      const response = await apiClient.get<WalletTransaction[]>('/rider/wallet/transactions');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = getCurrentUser();
      if (!user) return [];
      await delay();
      return getTransactions(user.id);
    }
  },

  async topUp(payload: TopUpRequest): Promise<TopUpResponse> {
    try {
      const response = await apiClient.post<TopUpResponse>('/rider/wallet/top-up', payload);
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = getCurrentUser();
      if (!user) throw new Error('No user session found.');
      if (payload.amount < 500) throw new Error('Minimum wallet top-up is ₦500.');
      await delay(320);
      const wallet = getWallet(user.id);
      const nextWallet = { ...wallet, balance: wallet.balance + payload.amount };
      saveWallet(nextWallet);
      const transaction: WalletTransaction = {
        id: `GR-PAY-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        userId: user.id,
        type: 'TOP_UP',
        amount: payload.amount,
        status: 'SUCCESS',
        provider: payload.provider,
        reference: `PAYSTACK_MOCK_${Date.now()}`,
        description: `Wallet top-up via ${payload.provider}`,
        createdAt: new Date().toISOString()
      };
      saveTransactions(user.id, [transaction, ...getTransactions(user.id)]);
      return {
        authorizationUrl: 'https://checkout.paystack.com/mock-gidiride',
        reference: transaction.reference,
        wallet: nextWallet,
        transaction
      };
    }
  },

  async getPaymentMethods(): Promise<SavedPaymentMethod[]> {
    try {
      const response = await apiClient.get<SavedPaymentMethod[]>('/rider/payment-methods');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = getCurrentUser();
      if (!user) return [];
      await delay();
      return getPaymentMethods(user.id);
    }
  },

  async addMockCard(last4: string): Promise<SavedPaymentMethod[]> {
    try {
      const response = await apiClient.post<SavedPaymentMethod[]>('/rider/payment-methods', { last4 });
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      const user = getCurrentUser();
      if (!user) throw new Error('No user session found.');
      const methods = getPaymentMethods(user.id);
      const next: SavedPaymentMethod = {
        id: `pm-card-${last4}-${Date.now()}`,
        type: 'CARD',
        label: 'Paystack Card',
        last4,
        provider: 'PAYSTACK',
        isDefault: !methods.length
      };
      const updated = [next, ...methods];
      localStorage.setItem(methodKey(user.id), JSON.stringify(updated));
      return updated;
    }
  },

  async removePaymentMethod(id: string): Promise<SavedPaymentMethod[]> {
    try {
      const response = await apiClient.delete<SavedPaymentMethod[]>(`/rider/payment-methods/${id}`);
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay(200);
      const user = getCurrentUser();
      if (!user) throw new Error('No user session found.');
      const methods = getPaymentMethods(user.id);
      const removingDefault = methods.find((item) => item.id === id)?.isDefault;
      let updated = methods.filter((item) => item.id !== id);
      if (removingDefault && updated.length) updated = updated.map((item, index) => ({ ...item, isDefault: index === 0 }));
      localStorage.setItem(methodKey(user.id), JSON.stringify(updated));
      return updated;
    }
  },

  async setDefaultPaymentMethod(id: string): Promise<SavedPaymentMethod[]> {
    try {
      const response = await apiClient.patch<SavedPaymentMethod[]>(`/rider/payment-methods/${id}/default`);
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay(200);
      const user = getCurrentUser();
      if (!user) throw new Error('No user session found.');
      const updated = getPaymentMethods(user.id).map((item) => ({ ...item, isDefault: item.id === id }));
      localStorage.setItem(methodKey(user.id), JSON.stringify(updated));
      return updated;
    }
  },

  async getDriverWithdrawals(): Promise<DriverWithdrawal[]> {
    try {
      const response = await apiClient.get<DriverWithdrawal[]>('/driver/withdrawals');
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = getCurrentUser();
      if (!user) return [];
      await delay();
      return getWithdrawals(user.id);
    }
  },

  async requestWithdrawal(payload: WithdrawalRequest): Promise<DriverWithdrawal> {
    try {
      const response = await apiClient.post<DriverWithdrawal>('/driver/withdrawals', payload);
      mockApi.clearWorkshopFlag();
      return response.data;
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = getCurrentUser();
      if (!user) throw new Error('No driver session found.');
      if (payload.amount < 1000) throw new Error('Minimum withdrawal is ₦1,000.');
      if (payload.amount > getDriverWalletBalance(user.id)) throw new Error('This exceeds your available wallet balance.');
      await delay(320);
      const withdrawal: DriverWithdrawal = {
        id: `GR-WD-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        driverId: user.id,
        ...payload,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      saveWithdrawals(user.id, [withdrawal, ...getWithdrawals(user.id)]);
      adjustDriverWallet(user.id, -payload.amount);
      return withdrawal;
    }
  }
};

export const adminPayoutsApi = {
  async getAllWithdrawals(): Promise<DriverWithdrawal[]> {
    const response = await apiClient.get<DriverWithdrawal[]>('/admin/payouts');
    return response.data;
  },

  async approveWithdrawal(id: string): Promise<DriverWithdrawal> {
    const response = await apiClient.patch<DriverWithdrawal>(`/admin/payouts/${id}/approve`);
    return response.data;
  },

  async rejectWithdrawal(id: string, reason: string): Promise<DriverWithdrawal> {
    const response = await apiClient.patch<DriverWithdrawal>(`/admin/payouts/${id}/reject`, { reason });
    // In a real app, backend service would refund wallet. 
    // For now we just return the updated withdrawal.
    return response.data;
  }
};

export function providerLabel(provider: PaymentProvider) {
  if (provider === 'PAYSTACK') return 'Paystack';
  if (provider === 'WALLET') return 'GidiRide Wallet';
  if (provider === 'CASH') return 'Cash';
  return 'Debit Card';
}
