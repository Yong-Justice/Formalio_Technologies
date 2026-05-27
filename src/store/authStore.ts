import { create } from 'zustand';
import { User } from '@/types/domain';
import { biometricEnrollmentStorage, refreshTokenStorage, secureKeys, secureStorage } from '@/services/storage/secureStorage';
import { setJson, storageKeys } from '@/services/storage/mmkv';
import { analytics } from '@/services/analytics/analytics.service';
import { notificationService } from '@/services/notifications/notificationService';
import { observability, type TelemetryUserContext } from '@/services/observability/observability.service';
import { clearTrustedOfflineSession, loadTrustedOfflineSession } from '@/services/auth/offlineSession';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (params: { user: User; accessToken: string; refreshToken: string }) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

type TelemetryUser = User & { businessId?: string; plan?: string };

function getTelemetryContext(user: User): TelemetryUserContext {
  const telemetryUser = user as TelemetryUser;
  return {
    userId: user.id,
    businessId: telemetryUser.businessId,
    plan: telemetryUser.plan,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  async hydrate() {
    const trusted = await loadTrustedOfflineSession().catch(() => null);
    const user = trusted?.snapshot.user ?? null;
    if (user) {
      const context = getTelemetryContext(user);
      observability.setUserContext(context);
      analytics.identify(user.id, { businessId: context.businessId, plan: context.plan });
    } else {
      observability.setUserContext(null);
    }
    set({ user, isAuthenticated: Boolean(user), isHydrated: true });
  },
  async setSession({ user, accessToken, refreshToken }) {
    await secureStorage.set(secureKeys.accessToken, accessToken);
    await refreshTokenStorage.set(refreshToken);
    await secureStorage.set(secureKeys.userId, user.id);
    setJson(storageKeys.authUser, user);
    const context = getTelemetryContext(user);
    observability.setUserContext(context);
    analytics.identify(user.id, { businessId: context.businessId, plan: context.plan });
    void notificationService.syncPushTokenRegistration(context, 'auth_success');
    set({ user, isAuthenticated: true, isHydrated: true });
  },
  setUser(user) {
    if (user) {
      setJson(storageKeys.authUser, user);
      const context = getTelemetryContext(user);
      observability.setUserContext(context);
      analytics.identify(user.id, { businessId: context.businessId, plan: context.plan });
    } else {
      observability.setUserContext(null);
    }
    set({ user, isAuthenticated: Boolean(user), isHydrated: true });
  },
  async logout() {
    await notificationService.unregisterDevicePushToken();
    await clearTrustedOfflineSession();
    await secureStorage.remove(secureKeys.accessToken);
    await refreshTokenStorage.remove();
    await secureStorage.remove(secureKeys.userId);
    await biometricEnrollmentStorage.clear();
    observability.setUserContext(null);
    analytics.reset();
    set({ user: null, isAuthenticated: false, isHydrated: true });
  }
}));
