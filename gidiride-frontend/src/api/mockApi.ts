import type { DashboardStats } from '../types/common';
import type { AuthResponse, RegisterPayload, Role, User } from '../types/user';
import { getPlatformStats } from './realtimeStore';

const USERS_KEY = 'gidiride.mock.users';
const TOKEN_PREFIX = 'mock-gidiride-token';

type MockUser = User & { password: string };

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

const seedUsers: MockUser[] = [
  {
    id: 'admin-001',
    fullName: 'GidiRide Control Room',
    gender: 'OTHER',
    email: 'admin@gidiride.ng',
    phone: '+2348010000001',
    password: 'GidiRide@123',
    role: 'ADMIN',
    banned: false,
    createdAt: daysAgo(38),
    lastActiveAt: new Date().toISOString(),
    totalRides: 0
  },
  {
    id: 'rider-101',
    fullName: 'Adaeze Okonkwo',
    gender: 'FEMALE',
    email: 'ada@gidiride.ng',
    phone: '+2348034561180',
    password: 'password123',
    role: 'RIDER',
    banned: false,
    createdAt: daysAgo(11),
    lastActiveAt: daysAgo(1),
    totalRides: 14,
    rating: 4.8
  },
  {
    id: 'rider-102',
    fullName: 'Musa Balogun',
    gender: 'MALE',
    email: 'musa@gidiride.ng',
    phone: '+2348129943317',
    password: 'password123',
    role: 'RIDER',
    banned: false,
    createdAt: daysAgo(7),
    lastActiveAt: daysAgo(0),
    totalRides: 7,
    rating: 4.4
  },
  {
    id: 'rider-103',
    fullName: 'Tomi Akinyele',
    gender: 'FEMALE',
    email: 'tomi@gidiride.ng',
    phone: '+2347013332200',
    password: 'password123',
    role: 'RIDER',
    banned: true,
    banReason: 'Repeated safety reports pending review',
    createdAt: daysAgo(31),
    lastActiveAt: daysAgo(8),
    totalRides: 29,
    rating: 3.2
  },
  {
    id: 'driver-201',
    fullName: 'Kunle Adeyemi',
    gender: 'MALE',
    email: 'kunle@gidiride.ng',
    phone: '+2349057771201',
    password: 'password123',
    role: 'DRIVER',
    banned: false,
    createdAt: daysAgo(18),
    lastActiveAt: daysAgo(0),
    kycStatus: 'APPROVED',
    totalRides: 86,
    rating: 4.9,
    vehicle: 'Toyota Corolla • EKY-821KT'
  },
  {
    id: 'driver-202',
    fullName: 'Blessing Johnson',
    gender: 'FEMALE',
    email: 'blessing@gidiride.ng',
    phone: '+2348094451302',
    password: 'password123',
    role: 'DRIVER',
    banned: false,
    createdAt: daysAgo(5),
    lastActiveAt: daysAgo(1),
    kycStatus: 'PENDING',
    totalRides: 12,
    rating: 4.7,
    vehicle: 'Honda Accord • BDG-774HN'
  },
  {
    id: 'driver-203',
    fullName: 'Emeka Nwosu',
    gender: 'MALE',
    email: 'emeka@gidiride.ng',
    phone: '+2348187800090',
    password: 'password123',
    role: 'DRIVER',
    banned: true,
    banReason: 'Admin safety lock after dispute ticket #GR-5521',
    createdAt: daysAgo(42),
    lastActiveAt: daysAgo(14),
    kycStatus: 'APPROVED',
    totalRides: 131,
    rating: 3.7,
    vehicle: 'Lexus ES350 • FST-102AB'
  }
];

const delay = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms));

function getStoredUsers(): MockUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
    return seedUsers;
  }
  try {
    return JSON.parse(raw) as MockUser[];
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
    return seedUsers;
  }
}

function saveUsers(users: MockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function publicUser(user: MockUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
}

function makeToken(user: MockUser) {
  return `${TOKEN_PREFIX}.${user.role}.${user.id}.${Date.now()}`;
}

export const mockApi = {
  async login(emailOrPhone: string, password: string): Promise<AuthResponse> {
    await delay();
    const identity = emailOrPhone.trim().toLowerCase();
    const user = getStoredUsers().find(
      (candidate) =>
        candidate.email?.toLowerCase() === identity ||
        candidate.phone?.replace(/\s/g, '') === emailOrPhone.replace(/\s/g, '')
    );

    if (!user || user.password !== password) {
      throw new Error('Wrong email/phone or password.');
    }

    if (user.banned) {
      throw new Error(user.banReason || 'This account has been banned. Contact GidiRide support.');
    }

    user.lastActiveAt = new Date().toISOString();
    saveUsers(getStoredUsers().map((candidate) => (candidate.id === user.id ? user : candidate)));

    return { token: makeToken(user), user: publicUser(user) };
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await delay(340);
    const users = getStoredUsers();
    const email = payload.email.trim().toLowerCase();
    const phone = payload.phone.trim();
    const exists = users.some(
      (candidate) => candidate.email?.toLowerCase() === email || candidate.phone === phone
    );

    if (exists) {
      throw new Error('A GidiRide account already exists with that email or phone.');
    }

    const next: MockUser = {
      id: `${payload.role.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`,
      fullName: payload.fullName.trim(),
      email,
      phone,
      password: payload.password,
      role: payload.role,
      gender: payload.gender,
      banned: false,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      kycStatus: payload.role === 'DRIVER' ? 'NOT_SUBMITTED' : undefined,
      totalRides: 0,
      rating: payload.role === 'ADMIN' ? undefined : 5
    };
    saveUsers([next, ...users]);
    return { token: makeToken(next), user: publicUser(next) };
  },

  async users(role?: Role): Promise<User[]> {
    await delay(220);
    return getStoredUsers().filter((user) => (role ? user.role === role : true)).map(publicUser);
  },

  async stats(): Promise<DashboardStats> {
    await delay(220);
    const users = getStoredUsers();
    const riders = users.filter((user) => user.role === 'RIDER');
    const drivers = users.filter((user) => user.role === 'DRIVER');
    const platform = getPlatformStats();
    return {
      totalUsers: users.length,
      totalRiders: riders.length,
      totalDrivers: drivers.length,
      bannedUsers: users.filter((user) => user.banned).length,
      activeDrivers: drivers.filter((user) => !user.banned && user.kycStatus === 'APPROVED').length,
      completedRides: platform.completedRides,
      revenueToday: platform.revenueToday
    };
  },


  async setKycStatus(userId: string, kycStatus: User['kycStatus'], reason?: string): Promise<User> {
    await delay(260);
    const users = getStoredUsers();
    const user = users.find((candidate) => candidate.id === userId && candidate.role === 'DRIVER');
    if (!user) throw new Error('Driver not found.');
    user.kycStatus = kycStatus;
    user.banReason = kycStatus === 'REJECTED' ? reason || 'KYC documents need correction' : user.banReason;
    saveUsers(users.map((candidate) => (candidate.id === userId ? user : candidate)));
    return publicUser(user);
  },

  async updateDriverVehicle(userId: string, vehicle: string, kycStatus?: User['kycStatus']): Promise<User> {
    await delay(220);
    const users = getStoredUsers();
    const user = users.find((candidate) => candidate.id === userId && candidate.role === 'DRIVER');
    if (!user) throw new Error('Driver not found.');
    user.vehicle = vehicle;
    if (kycStatus) user.kycStatus = kycStatus;
    saveUsers(users.map((candidate) => (candidate.id === userId ? user : candidate)));
    return publicUser(user);
  },

  async setBan(userId: string, banned: boolean, reason?: string): Promise<User> {
    await delay(260);
    const users = getStoredUsers();
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.role === 'ADMIN' && banned) throw new Error('Admin accounts cannot be banned here.');
    user.banned = banned;
    user.banReason = banned ? reason || 'Admin safety action' : undefined;
    saveUsers(users.map((candidate) => (candidate.id === userId ? user : candidate)));
    return publicUser(user);
  },

  usingLocalWorkshopData() {
    localStorage.setItem('gidiride.demoFallbackUsed', 'true');
  },

  clearWorkshopFlag() {
    localStorage.removeItem('gidiride.demoFallbackUsed');
  }
};
