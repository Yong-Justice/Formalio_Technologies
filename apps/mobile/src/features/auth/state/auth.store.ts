import { create } from 'zustand';
import { User } from '@/types/domain';
import { secureKeys, secureStorage } from '@/services/storage/secureStorage';
import { setJson, storageKeys } from '@/services/storage/mmkv';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSession: (params: { user: User; accessToken: string; refreshToken: string }) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  async setSession({ user, accessToken, refreshToken }) {
    await secureStorage.set(secureKeys.accessToken, accessToken);
    await secureStorage.set(secureKeys.refreshToken, refreshToken);
    await secureStorage.set(secureKeys.userId, user.id);
    setJson(storageKeys.authUser, user);
    set({ user, isAuthenticated: true, isHydrated: true });
  },
  setUser(user) {
    if (user) setJson(storageKeys.authUser, user);
    set({ user, isAuthenticated: Boolean(user), isHydrated: true });
  },
  async logout() {
    await secureStorage.remove(secureKeys.accessToken);
    await secureStorage.remove(secureKeys.refreshToken);
    await secureStorage.remove(secureKeys.userId);
    set({ user: null, isAuthenticated: false, isHydrated: true });
  }
}));