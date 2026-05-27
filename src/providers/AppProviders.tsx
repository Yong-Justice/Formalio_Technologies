import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { analytics } from '@/services/analytics/analytics.service';
import { useAuthStore } from '@/store/authStore';
import { useFinanceStore } from '@/store/financeStore';
import { notificationService } from '@/services/notifications/notificationService';
import { observability } from '@/services/observability/observability.service';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useOfflineSync } from '@/services/sync/syncService';
import { initializeDatabase } from '@/database';
import { importLegacyCaches } from '@/database/bootstrap';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1
    }
  }
});

function OfflineSyncBoot() {
  useOfflineSync();
  return null;
}

function getUserTelemetry(user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>) {
  const telemetryUser = user as typeof user & { businessId?: string; plan?: string };
  return {
    userId: user.id,
    businessId: telemetryUser.businessId,
    plan: telemetryUser.plan,
  };
}

function AppBoot() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateFinance = useFinanceStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const selectedBusinessId = useFinanceStore((s) => s.selectedBusinessId);

  React.useEffect(() => {
    void hydrateAuth();
    if (Platform.OS !== 'web') {
      void initializeDatabase().catch((error) => {
        observability.captureException(error, { operation: 'database_boot' });
      });
    }

    const timer = setTimeout(() => {
      hydrateFinance();
    }, 0);

    let cleanupNotifications: (() => void) | undefined;
    void notificationService
      .configureNotificationInteractions()
      .then((cleanup) => {
        cleanupNotifications = cleanup;
      })
      .catch((error) => {
        observability.captureException(error, { operation: 'notification_boot' });
      });

    return () => {
      clearTimeout(timer);
      cleanupNotifications?.();
    };
  }, [hydrateAuth, hydrateFinance]);

  React.useEffect(() => {
    if (!user) return;
    if (Platform.OS === 'web') return;
    const telemetryUser = user as typeof user & { businessId?: string };
    const companyId = selectedBusinessId ?? telemetryUser.businessId ?? null;
    void importLegacyCaches(user.id, companyId).catch((error) => {
      observability.captureException(error, { operation: 'database_legacy_import' });
    });
  }, [selectedBusinessId, user]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && user) {
        void notificationService.syncPushTokenRegistration(getUserTelemetry(user), 'app_resume');
      }
    });

    return () => subscription.remove();
  }, [user]);

  return null;
}

function NavigationTelemetry() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const paramKeys = Object.keys(params);

  React.useEffect(() => {
    observability.addNavigationBreadcrumb(pathname);
    analytics.screen(pathname, { paramCount: paramKeys.length });
  }, [pathname, paramKeys.length]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AppBoot />
            <NavigationTelemetry />
            {Platform.OS !== 'web' ? <OfflineSyncBoot /> : null}
            {children}
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
