export type Role = 'RIDER' | 'DRIVER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'BANNED';
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type Gender = 'FEMALE' | 'MALE' | 'OTHER';

export interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: Role;
  gender?: Gender;
  banned: boolean;
  createdAt?: string;
  lastActiveAt?: string;
  kycStatus?: KycStatus;
  totalRides?: number;
  rating?: number;
  vehicle?: string | {
    make?: string;
    model?: string;
    year?: string;
    plateNumber?: string;
    color?: string;
  };
  banReason?: string;
}

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  gender?: Gender;
}

export interface AuthResponse {
  token: string;
  user: User;
}
