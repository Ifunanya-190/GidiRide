import { apiClient, shouldUseMockFallback } from './client';
import { mockApi } from './mockApi';
import { getStoredUser } from '../auth/session';
import { lagosLocations } from './rider';
import type { RideRequest } from '../types/ride';
import type {
  GroupRide,
  ShareTripSession
} from '../types/phase8';
import type { User } from '../types/user';
import { publishRideEvent } from './realtimeStore';

const GROUP_KEY = 'gidiride.phase8.groupRides';
const SHARE_KEY = 'gidiride.phase8.shareTrip';

function delay(ms = 230) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function readUser(): User | null {
  return getStoredUser();
}
function readList<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}
function saveList<T>(key: string, value: T[]) { localStorage.setItem(key, JSON.stringify(value)); }

function seedGroups(): GroupRide[] {
  const existing = readList<GroupRide>(GROUP_KEY);
  if (existing.length) return existing;
  const groups: GroupRide[] = [
    {
      id: 'GR-DANFO-8001',
      creatorId: 'rider-101',
      routeName: 'Yaba workers to Lekki Phase 1',
      pickup: lagosLocations[1],
      dropoff: lagosLocations[5],
      departureTime: new Date(Date.now() + 2 * 3600000).toISOString(),
      seatsTotal: 4,
      seatsTaken: 2,
      pricePerSeat: 2600,
      rideType: 'ECONOMY',
      status: 'SCHEDULED',
      members: [
        { userId: 'rider-101', name: 'Adaeze Okonkwo', joinedAt: new Date(Date.now() - 3600000).toISOString() },
        { userId: 'rider-102', name: 'Musa Balogun', joinedAt: new Date(Date.now() - 1800000).toISOString() }
      ],
      notes: 'Morning office route. No heavy luggage.'
    },
    {
      id: 'GR-DANFO-8002',
      creatorId: 'rider-102',
      routeName: 'Ikeja to VI after work',
      pickup: lagosLocations[2],
      dropoff: lagosLocations[4],
      departureTime: new Date(Date.now() + 5 * 3600000).toISOString(),
      seatsTotal: 4,
      seatsTaken: 3,
      pricePerSeat: 3100,
      rideType: 'PREMIUM',
      status: 'BOARDING',
      members: [{ userId: 'rider-102', name: 'Musa Balogun', joinedAt: new Date(Date.now() - 1200000).toISOString() }],
      notes: 'Premium carpool. Split toll and fuel transparently.'
    }
  ];
  saveList(GROUP_KEY, groups);
  return groups;
}

export const phase8Api = {
  async getGroupRides(): Promise<GroupRide[]> {
    try { const response = await apiClient.get<GroupRide[]>('/rider/group-rides'); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) { if (!shouldUseMockFallback(error)) throw error; mockApi.usingLocalWorkshopData(); await delay(); return seedGroups(); }
  },

  async createGroupRide(payload: Omit<GroupRide, 'id' | 'creatorId' | 'status' | 'seatsTaken' | 'members'>): Promise<GroupRide> {
    try { const response = await apiClient.post<GroupRide>('/rider/group-rides', payload); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = readUser();
      if (!user) throw new Error('No rider session found.');
      await delay();
      const group: GroupRide = { ...payload, id: `GR-DANFO-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, creatorId: user.id, status: 'SCHEDULED', seatsTaken: 1, members: [{ userId: user.id, name: user.fullName, joinedAt: new Date().toISOString() }] };
      saveList(GROUP_KEY, [group, ...seedGroups()]);
      return group;
    }
  },

  async joinGroupRide(groupId: string): Promise<GroupRide> {
    try { const response = await apiClient.post<GroupRide>(`/rider/group-rides/${groupId}/join`); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      const user = readUser();
      if (!user) throw new Error('No rider session found.');
      await delay();
      const groups = seedGroups();
      const next = groups.map((group) => {
        if (group.id !== groupId) return group;
        if (group.members.some((member) => member.userId === user.id)) return group;
        const seatsTaken = Math.min(group.seatsTotal, group.seatsTaken + 1);
        return { ...group, seatsTaken, status: seatsTaken >= group.seatsTotal ? 'FULL' as const : group.status, members: [...group.members, { userId: user.id, name: user.fullName, joinedAt: new Date().toISOString() }] };
      });
      saveList(GROUP_KEY, next);
      const found = next.find((group) => group.id === groupId);
      if (!found) throw new Error('Group ride not found.');
      return found;
    }
  },

  async startShareTrip(ride: RideRequest, contacts: string[], liveAudioEnabled: boolean): Promise<ShareTripSession> {
    try { const response = await apiClient.post<ShareTripSession>('/safety/share-trip', { rideId: ride.id, contacts, liveAudioEnabled }); mockApi.clearWorkshopFlag(); return response.data; }
    catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
      mockApi.usingLocalWorkshopData();
      await delay();
      const session: ShareTripSession = { id: `GR-SHARE-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, rideId: ride.id, contacts, liveAudioEnabled, keywordDetectionEnabled: liveAudioEnabled, safeWords: ['help', 'stop', 'police', 'danger'], status: 'ACTIVE', createdAt: new Date().toISOString(), events: [{ id: crypto.randomUUID(), message: `Live trip link sent to ${contacts.length} contacts.`, tone: 'green', createdAt: new Date().toISOString() }] };
      saveList(SHARE_KEY, [session, ...readList<ShareTripSession>(SHARE_KEY)]);
      publishRideEvent(ride.id, 'Trip shared', `Live trip shared with ${contacts.length} contacts.`, 'green');
      return session;
    }
  },

  async getShareSessions(): Promise<ShareTripSession[]> { await delay(); return readList<ShareTripSession>(SHARE_KEY); },

  async simulateAudioKeyword(sessionId: string, keyword: string): Promise<ShareTripSession> {
    await delay();
    const sessions = readList<ShareTripSession>(SHARE_KEY);
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) throw new Error('Share trip session not found.');
    const updated: ShareTripSession = { ...session, status: 'ALERTED', lastAlertAt: new Date().toISOString(), events: [{ id: crypto.randomUUID(), message: `Keyword "${keyword}" detected. Emergency contacts alerted.`, tone: 'red', createdAt: new Date().toISOString() }, ...session.events] };
    saveList(SHARE_KEY, [updated, ...sessions.filter((item) => item.id !== sessionId)]);
    publishRideEvent(session.rideId, 'Live audio keyword alert', `Keyword "${keyword}" triggered a safety alert.`, 'red');
    return updated;
  }
};
