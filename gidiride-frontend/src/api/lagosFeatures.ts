import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import { getStoredUser, updateSessionUser } from '../auth/session';
import { lagosLocations } from './rider';
import type { BidFareRequest, DriverBadgeProfile, DriverBid, FuelSplitQuote, SkillBadge, TipPayload } from '../types/lagos';
import type { RideRequest } from '../types/ride';
import type { User } from '../types/user';

const BID_KEY = 'gidiride.lagos.bidFare.requests';
const DRIVER_BID_KEY = 'gidiride.lagos.driverBids';
const BADGE_KEY = 'gidiride.lagos.driverBadges';

function delay(ms = 240) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function readUser(): User | null {
  return getStoredUser();
}
function readList<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}
function saveList<T>(key: string, list: T[]) { localStorage.setItem(key, JSON.stringify(list)); }

function seedBidRequests(): BidFareRequest[] {
  const existing = readList<BidFareRequest>(BID_KEY);
  const user = readUser();
  const userId = user?.id || 'rider-101';
  const userName = user?.fullName || 'Rider';

  // If existing data has bids but none belong to the current user, re-seed
  if (existing.length && existing.some(r => r.riderId === userId)) return existing;

  // Clear stale data from other users
  const seed: BidFareRequest[] = [
    {
      id: 'GR-BID-7401',
      riderId: userId,
      riderName: userName,
      pickup: lagosLocations[2],
      dropoff: lagosLocations[5],
      rideType: 'ECONOMY',
      proposedCash: 4500,
      barterOffer: 'Fresh plantain basket if cash is tight',
      femaleDriverOnly: false,
      maleDriverOnly: false,
      notes: 'Need AC. Leaving in 10 minutes.',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 9 * 60000).toISOString()
    },
    {
      id: 'GR-BID-7402',
      riderId: userId,
      riderName: userName,
      pickup: lagosLocations[0],
      dropoff: lagosLocations[3],
      rideType: 'BIKE',
      proposedCash: 1800,
      femaleDriverOnly: false,
      maleDriverOnly: false,
      notes: 'Small backpack only.',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 16 * 60000).toISOString()
    }
  ];
  saveList(BID_KEY, seed);
  return seed;
}

function seedDriverBids(): DriverBid[] {
  const existing = readList<DriverBid>(DRIVER_BID_KEY);
  if (existing.length > 1) return existing;
  const seed: DriverBid[] = [
    {
      id: 'GR-DBID-1001',
      bidRequestId: 'GR-BID-7401',
      driverId: 'driver-201',
      driverName: 'Kunle Adeyemi',
      driverRating: 4.9,
      vehicle: 'Toyota Corolla - EKY-821KT',
      cashAmount: 5200,
      acceptsBarter: false,
      message: 'I can pick you in 6 minutes. AC is working well.',
      etaMin: 6,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 4 * 60000).toISOString()
    },
    {
      id: 'GR-DBID-1002',
      bidRequestId: 'GR-BID-7401',
      driverId: 'driver-202',
      driverName: 'Blessing Johnson',
      driverRating: 4.7,
      vehicle: 'Honda Civic - APP-502FG',
      cashAmount: 4800,
      acceptsBarter: true,
      message: 'I\'ll accept your barter offer plus NGN 3,000 cash.',
      etaMin: 9,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3 * 60000).toISOString()
    },
    {
      id: 'GR-DBID-1003',
      bidRequestId: 'GR-BID-7402',
      driverId: 'driver-203',
      driverName: 'Emeka Nwosu',
      driverRating: 4.5,
      vehicle: 'Bajaj Boxer Bike - KTU-118AA',
      cashAmount: 2000,
      acceptsBarter: false,
      message: 'Ready now. I know a shortcut through Ojodu.',
      etaMin: 3,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 2 * 60000).toISOString()
    }
  ];
  saveList(DRIVER_BID_KEY, seed);
  return seed;
}

function emptyBadgeProfile(driverId: string, driverName: string): DriverBadgeProfile {
  return {
    driverId,
    driverName,
    tipTotal: 0,
    badges: {
      SAFE_DRIVER: 0,
      GOOD_AC: 0,
      PLAYS_MY_MUSIC: 0,
      CLEAN_CAR: 0,
      FAST_PICKUP: 0,
      POLITE: 0
    }
  };
}

function getBadgeProfiles(): DriverBadgeProfile[] {
  const existing = readList<DriverBadgeProfile>(BADGE_KEY);
  if (existing.length) return existing;
  const seed = [
    { ...emptyBadgeProfile('driver-201', 'Kunle Adeyemi'), tipTotal: 18500, badges: { SAFE_DRIVER: 21, GOOD_AC: 15, PLAYS_MY_MUSIC: 8, CLEAN_CAR: 19, FAST_PICKUP: 11, POLITE: 24 } },
    { ...emptyBadgeProfile('driver-202', 'Blessing Johnson'), tipTotal: 9200, badges: { SAFE_DRIVER: 14, GOOD_AC: 9, PLAYS_MY_MUSIC: 3, CLEAN_CAR: 10, FAST_PICKUP: 7, POLITE: 18 } }
  ];
  saveList(BADGE_KEY, seed);
  return seed;
}

export function badgeLabel(badge: SkillBadge) {
  return badge.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase());
}

export const lagosFeaturesApi = {
  async createBidFare(payload: Omit<BidFareRequest, 'id' | 'riderId' | 'riderName' | 'status' | 'createdAt'>): Promise<BidFareRequest> {
    await delay();
    const user = readUser();
    if (!user) throw new Error("Not authenticated");
    const requests = seedBidRequests();
    const newBid: BidFareRequest = {
      ...payload,
      id: `GR-BID-${Math.floor(Math.random() * 10000)}`,
      riderId: user.id,
      riderName: user.fullName || 'Rider',
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    requests.unshift(newBid);
    saveList(BID_KEY, requests);
    return newBid;
  },

  async getMyBidFares(): Promise<Array<BidFareRequest & { bids: DriverBid[] }>> {
    await delay();
    const user = readUser();
    const requests = seedBidRequests().filter(r => r.riderId === user?.id);
    const allBids = seedDriverBids();
    return requests.map(r => ({ ...r, bids: allBids.filter(b => b.bidRequestId === r.id) }));
  },

  async acceptDriverBid(bidId: string): Promise<DriverBid> {
    await delay();
    const allBids = seedDriverBids();
    const bidIndex = allBids.findIndex(b => b.id === bidId);
    if (bidIndex === -1) throw new Error("Bid not found");
    const bid = allBids[bidIndex];
    bid.status = 'ACCEPTED';
    saveList(DRIVER_BID_KEY, allBids);

    const requests = seedBidRequests();
    const req = requests.find(r => r.id === bid.bidRequestId);
    if (req) {
      req.status = 'ACCEPTED';
      saveList(BID_KEY, requests);
    }
    return bid;
  },

  async getOpenBidFares(): Promise<Array<BidFareRequest & { bids: DriverBid[] }>> {
    await delay();
    const requests = seedBidRequests().filter(r => r.status === 'OPEN');
    const allBids = seedDriverBids();
    return requests.map(r => ({ ...r, bids: allBids.filter(b => b.bidRequestId === r.id) }));
  },

  async submitDriverBid(bidRequestId: string, cashAmount: number, acceptsBarter: boolean, message: string): Promise<DriverBid> {
    await delay();
    const user = readUser();
    if (!user) throw new Error("Not authenticated");
    const allBids = seedDriverBids();
    const newBid: DriverBid = {
      id: `GR-DBID-${Math.floor(Math.random() * 10000)}`,
      bidRequestId,
      driverId: user.id,
      driverName: user.fullName || 'Driver',
      driverRating: user.rating || 5.0,
      vehicle: 'Unknown Vehicle', // Should pull from profile ideally
      cashAmount,
      acceptsBarter,
      message,
      etaMin: 5 + Math.floor(Math.random() * 10),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    allBids.unshift(newBid);
    saveList(DRIVER_BID_KEY, allBids);
    return newBid;
  },

  async calculateFuelSplit(ride: Pick<RideRequest, 'id' | 'distanceKm' | 'rideType'>, oldFuelPrice = 620, newFuelPrice = 780): Promise<FuelSplitQuote> {
    await delay();
    const baseFuelLitres = (ride.distanceKm || 10) / 12; // Assume 12km/L
    const oldCost = baseFuelLitres * oldFuelPrice;
    const newCost = baseFuelLitres * newFuelPrice;
    const difference = newCost - oldCost;
    const split = Math.round(difference * 0.4); // Rider pays 40% of the diff
    return {
      rideId: ride.id,
      oldFuelPrice,
      newFuelPrice,
      extraCost: Math.round(difference),
      riderShare: split,
      driverShare: Math.round(difference - split),
      explanation: `Based on ${(ride.distanceKm || 10).toFixed(1)}km, fuel cost rose by ₦${Math.round(difference)}. You share 40% (₦${split}).`
    };
  },

  async sendTip(payload: TipPayload): Promise<DriverBadgeProfile> {
    await delay();
    const profiles = getBadgeProfiles();
    const index = profiles.findIndex(p => p.driverId === payload.driverId);
    let p = index >= 0 ? profiles[index] : emptyBadgeProfile(payload.driverId, payload.driverName || 'Driver');
    
    p.tipTotal += payload.amount;
    if (payload.badge && p.badges[payload.badge] !== undefined) {
        p.badges[payload.badge]++;
    }
    
    if (index >= 0) profiles[index] = p;
    else profiles.push(p);
    
    saveList(BADGE_KEY, profiles);
    return p;
  },

  async getDriverBadges(driverId?: string): Promise<DriverBadgeProfile[]> {
    await delay();
    const profiles = getBadgeProfiles();
    if (driverId) return profiles.filter(p => p.driverId === driverId);
    return profiles;
  }
};
