import type { User } from './user';

export interface DashboardStats {
  totalUsers: number;
  totalRiders: number;
  totalDrivers: number;
  bannedUsers: number;
  activeDrivers: number;
  completedRides: number;
  revenueToday: number;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  tone?: 'green' | 'yellow' | 'red' | 'neutral';
}

export interface UsersResponse {
  users: User[];
}
