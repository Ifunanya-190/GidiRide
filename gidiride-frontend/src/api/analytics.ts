import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import type { AdminAnalyticsSnapshot, NotificationPreference, ReferralInvite, ReferralProfile, SeriesPoint } from '../types/analytics';
import type { RideRequest } from '../types/ride';
import type { User, Role } from '../types/user';
import { getStoredUser } from '../auth/session';

const REFERRAL_PREFIX = 'gidiride.phase9.referral';
const REFERRAL_INVITES_KEY = 'gidiride.phase9.referral.invites';
const NOTIFICATION_PREFIX = 'gidiride.phase9.notifications';
const USER_KEY = 'gidiride.user';
const USERS_KEY = 'gidiride.mock.users';
const RIDER_RIDES_PREFIX = 'gidiride.rider.rides.';

function delay(ms = 220) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
function saveJson<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }
function currentUser(): User | null { return getStoredUser() || readJson<User | null>(USER_KEY, null); }
function referralKey(userId: string) { return `${REFERRAL_PREFIX}.${userId}`; }
function notificationKey(userId: string) { return `${NOTIFICATION_PREFIX}.${userId}`; }

function allUsers(): User[] {
  const users = readJson<Array<User & { password?: string }>>(USERS_KEY, []);
  return users.map(({ password: _password, ...user }) => user);
}

function allRides(): RideRequest[] {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(RIDER_RIDES_PREFIX))
    .flatMap((key) => readJson<RideRequest[]>(key, []));
}

function allInvites(): ReferralInvite[] { return readJson<ReferralInvite[]>(REFERRAL_INVITES_KEY, []); }

function seededSeries(base: number, labels: string[]): SeriesPoint[] {
  return labels.map((label, index) => ({ label, value: Math.max(1, Math.round(base * (0.72 + index * 0.08 + (index % 2) * 0.18))) }));
}

function buildAnalytics(): AdminAnalyticsSnapshot {
  const users = allUsers();
  const rides = allRides();
  const invites = allInvites();
  const disputes = readJson<unknown[]>('gidiride.disputes', []);
  const sos = readJson<unknown[]>('gidiride.sos.alerts', []);
  const bidFares = readJson<unknown[]>('gidiride.lagos.bidFare.requests', []);
  const groups = readJson<unknown[]>('gidiride.phase8.groupRides', []);

  const rideCount = Math.max(rides.length, 42);
  const revenue = Math.max(rides.reduce((sum, ride) => sum + ride.totalFare, 0), 842500);
  const completed = rides.filter((ride) => ride.status === 'COMPLETED').length;
  const drivers = users.filter((user) => user.role === 'DRIVER');
  const riders = users.filter((user) => user.role === 'RIDER');

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      rides: rideCount,
      revenue,
      riders: Math.max(riders.length, 3),
      drivers: Math.max(drivers.length, 3),
      activeDrivers: Math.max(drivers.filter((driver) => !driver.banned && driver.kycStatus === 'APPROVED').length, 1),
      disputes: disputes.length,
      sosAlerts: sos.length,
      referrals: invites.length
    },
    revenueSeries: seededSeries(Math.round(revenue / 7), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    rideSeries: seededSeries(Math.round(rideCount / 7), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    peakHours: [
      { label: '6am', value: 18 }, { label: '8am', value: 44 }, { label: '12pm', value: 26 },
      { label: '4pm', value: 31 }, { label: '6pm', value: 57 }, { label: '10pm', value: 22 }
    ],
    heatMap: [
      { id: 'yaba', area: 'Yaba', intensity: 74, rides: 126, revenue: 384000, lat: 6.5095, lng: 3.3711 },
      { id: 'ikeja', area: 'Ikeja', intensity: 82, rides: 149, revenue: 492500, lat: 6.6145, lng: 3.3581 },
      { id: 'lekki', area: 'Lekki Phase 1', intensity: 95, rides: 188, revenue: 812000, lat: 6.4474, lng: 3.4723 },
      { id: 'vi', area: 'Victoria Island', intensity: 88, rides: 162, revenue: 725000, lat: 6.4265, lng: 3.4301 },
      { id: 'ajah', area: 'Ajah', intensity: 62, rides: 91, revenue: 355000, lat: 6.4698, lng: 3.5852 }
    ],
    paymentMix: [
      { label: 'Cash', value: rides.filter((ride) => ride.paymentMethod === 'CASH').length || 18 },
      { label: 'Wallet', value: rides.filter((ride) => ride.paymentMethod === 'WALLET').length || 14 },
      { label: 'Card', value: rides.filter((ride) => ride.paymentMethod === 'CARD').length || 9 },
      { label: 'Pay Later', value: readJson<unknown[]>('gidiride.phase8.payLaterTx.rider-101', []).length || 4 }
    ],
    featureUsage: [
      { label: 'Completed', value: completed || 29 },
      { label: 'Bid Fare', value: bidFares.length || 6 },
      { label: 'Danfo Mode', value: groups.length || 2 },
      { label: 'SOS', value: sos.length },
      { label: 'Disputes', value: disputes.length }
    ]
  };
}

function buildReferralProfile(user: User): ReferralProfile {
  const existing = readJson<ReferralProfile | null>(referralKey(user.id), null);
  if (existing) return existing;
  const code = `${user.role.slice(0, 1)}-${user.fullName.replace(/[^a-z]/gi, '').slice(0, 5).toUpperCase() || 'GIDI'}-${user.id.slice(-4).toUpperCase()}`;
  const profile: ReferralProfile = {
    id: `GR-REF-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    ownerId: user.id,
    ownerRole: user.role,
    code,
    link: `https://gidiride.ng/ref/${code}`,
    invited: 0,
    completed: 0,
    rewardBalance: 0,
    createdAt: new Date().toISOString()
  };
  saveJson(referralKey(user.id), profile);
  return profile;
}

export const analyticsApi = {
  async getAdminAnalytics(): Promise<AdminAnalyticsSnapshot> {
    try { const response = await apiClient.get<AdminAnalyticsSnapshot>('/admin/analytics'); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) { if (!shouldUseMockFallback(error)) throw error; mockApi.usingLocalWorkshopData(); await delay(); return buildAnalytics(); }
  },

  async getReferralProfile(): Promise<{ profile: ReferralProfile; invites: ReferralInvite[] }> {
    try { const response = await apiClient.get<{ profile: ReferralProfile; invites: ReferralInvite[] }>('/referrals/me'); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = currentUser();
      if (!user) throw new Error('No user session found.');
      await delay();
      const profile = buildReferralProfile(user);
      const invites = allInvites().filter((invite) => invite.profileId === profile.id);
      return { profile: { ...profile, invited: invites.length, completed: invites.filter((invite) => invite.status !== 'SENT').length, rewardBalance: invites.reduce((sum, invite) => sum + invite.reward, 0) }, invites };
    }
  },

  async sendReferralInvite(phoneOrEmail: string, role: Exclude<Role, 'ADMIN'>): Promise<{ profile: ReferralProfile; invite: ReferralInvite }> {
    try { const response = await apiClient.post<{ profile: ReferralProfile; invite: ReferralInvite }>('/referrals/invite', { phoneOrEmail, role }); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = currentUser();
      if (!user) throw new Error('No user session found.');
      await delay();
      const profile = buildReferralProfile(user);
      const invite: ReferralInvite = { id: `GR-INV-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, profileId: profile.id, phoneOrEmail, role, status: 'SENT', reward: 0, createdAt: new Date().toISOString() };
      saveJson(REFERRAL_INVITES_KEY, [invite, ...allInvites()]);
      return { profile: { ...profile, invited: profile.invited + 1 }, invite };
    }
  },

  async getNotificationPreference(): Promise<NotificationPreference> {
    const user = currentUser();
    if (!user) throw new Error('No user session found.');
    try { const response = await apiClient.get<NotificationPreference>('/notifications/preferences'); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      return readJson<NotificationPreference>(notificationKey(user.id), { userId: user.id, pushEnabled: false, rideUpdates: true, promos: false, safetyAlerts: true, earnings: user.role === 'DRIVER', updatedAt: new Date().toISOString() });
    }
  },

  async saveNotificationPreference(payload: NotificationPreference): Promise<NotificationPreference> {
    try { const response = await apiClient.put<NotificationPreference>('/notifications/preferences', payload); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      const next = { ...payload, updatedAt: new Date().toISOString() };
      saveJson(notificationKey(payload.userId), next);
      return next;
    }
  }
};
