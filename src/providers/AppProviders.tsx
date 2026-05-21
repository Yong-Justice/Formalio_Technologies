import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { analytics } from '@/services/analytics/analytics.service';
import { useAuthStore } from '@/features/auth/state/auth.store';
import { useFinanceStore } from '@/features/finance/state/finance.store';
import { notificationService } from '@/services/notifications/notifications.service';
import { observability } from '@/services/observability/observability.service';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useOfflineSync } from '@/services/offline/sync';

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

  React.useEffect(() => {
    hydrateAuth();
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
            <OfflineSyncBoot />
            {children}
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
