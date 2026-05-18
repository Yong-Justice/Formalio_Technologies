import type { ID, Timestamps } from "./common";

export type UserRole = "admin" | "accountant" | "client" | "staff";

export type User = {
  id: ID;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
} & Timestamps;

export type UserProfile = Omit<User, "isActive">;
