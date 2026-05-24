import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { analytics } from '@/services/analytics/analytics.service';
import { notificationService } from '@/services/notifications/notificationService';
import { observability } from '@/services/observability/observability.service';
import { flushOfflineQueue, getOfflineQueue } from './offlineQueue';
import { syncAllTables } from './databaseSync';
import { useNetworkStore } from './network';

const SYNC_INTERVAL_MS = 30_000;

async function flushAndReport(source: 'online_resume' | 'foreground_interval') {
  try {
    const queued = getOfflineQueue().length > 0;
    const result = queued ? await flushOfflineQueue() : { succeeded: 0, failed: 0, remaining: 0 };
    const userId = useAuthStore.getState().user?.id;
    const databaseResult = await syncAllTables(userId);
    const succeeded = result.succeeded + databaseResult.pushed + databaseResult.pulled;

    if (succeeded > 0 || databaseResult.conflicts > 0 || databaseResult.failed > 0) {
      analytics.track('offline_sync_completed', { source, ...result, database: databaseResult });
      if (getOfflineQueue().length === 0 && databaseResult.failed === 0) {
        void notificationService.scheduleSyncCompleteNotification({ succeeded });
      }
    }

    return { ...result, database: databaseResult };
  } catch (error) {
    analytics.track('offline_sync_failed', { source });
    observability.captureException(error, { operation: 'offline_queue_flush', source });
    throw error;
  }
}

/**
 * Mount once at app root. Handles:
 * 1. NetInfo listener (keeps isOnline accurate)
 * 2. Immediate flush when device comes back online
 * 3. 30s polling while foregrounded; stops in background to save battery
 */
export function useOfflineSync() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const initNetworkListener = useNetworkStore((state) => state.initNetworkListener);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => initNetworkListener(), [initNetworkListener]);

  useEffect(() => {
    if (isOnline) void flushAndReport('online_resume');
  }, [isOnline]);

  useEffect(() => {
    function start() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (isOnline) void flushAndReport('foreground_interval');
      }, SYNC_INTERVAL_MS);
    }

    function stop() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    const sub = AppState.addEventListener('change', (state: AppStateStatus) =>
      state === 'active' ? start() : stop(),
    );
    if (isOnline) start();

    return () => {
      stop();
      sub.remove();
    };
  }, [isOnline]);
}

/** Conflict resolution called after successful legacy queue sync. */
export function resolveConflict<T extends object>(
  strategy: 'last-write-wins' | 'server-authoritative',
  local: T,
  server: T,
): T {
  return strategy === 'server-authoritative' ? server : { ...server, ...local };
}
