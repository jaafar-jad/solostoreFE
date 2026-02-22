export type UserRole = 'user' | 'developer' | 'admin';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  isEmailVerified: boolean;
  currentPlan: string | null;
  planExpiry: string | null;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}
