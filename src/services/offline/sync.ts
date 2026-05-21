import { useEffect, useRef } from "react";
  import { AppState, type AppStateStatus } from "react-native";
  import { flushOfflineQueue, getOfflineQueue } from "./queue";
  import { analytics } from "@/services/analytics/analytics.service";
  import { notificationService } from "@/services/notifications/notifications.service";
  import { observability } from "@/services/observability/observability.service";
  import { useNetworkStore } from "./network";

  const SYNC_INTERVAL_MS = 30_000;

  async function flushAndReport(source: "online_resume" | "foreground_interval") {
    try {
      const result = await flushOfflineQueue();
      if (result.succeeded > 0) {
        analytics.track("offline_sync_completed", { source, ...result });
        if (getOfflineQueue().length === 0) {
          void notificationService.scheduleSyncCompleteNotification({ succeeded: result.succeeded });
        }
      }
      return result;
    } catch (error) {
      analytics.track("offline_sync_failed", { source });
      observability.captureException(error, { operation: "offline_queue_flush", source });
      throw error;
    }
  }

  /**
   * Mount once at app root. Handles:
   * 1. NetInfo listener (keeps isOnline accurate)
   * 2. Immediate flush when device comes back online
   * 3. 30s polling while foregrounded — stops in background to save battery
   */
  export function useOfflineSync() {
    const isOnline = useNetworkStore(s => s.isOnline);
    const initNetworkListener = useNetworkStore(s => s.initNetworkListener);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => initNetworkListener(), [initNetworkListener]);

    useEffect(() => {
      if (isOnline && getOfflineQueue().length > 0) void flushAndReport("online_resume");
    }, [isOnline]);

    useEffect(() => {
      function start() {
        if (intervalRef.current) return;
        intervalRef.current = setInterval(() => {
          if (isOnline && getOfflineQueue().length > 0) void flushAndReport("foreground_interval");
        }, SYNC_INTERVAL_MS);
      }
      function stop() {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }
      const sub = AppState.addEventListener("change", (s: AppStateStatus) => s === "active" ? start() : stop());
      if (isOnline) start();
      return () => { stop(); sub.remove(); };
    }, [isOnline]);
  }

  /** Conflict resolution — called after successful sync */
  export function resolveConflict<T extends object>(
    strategy: "last-write-wins" | "server-authoritative",
    local: T, server: T
  ): T {
    return strategy === "server-authoritative" ? server : { ...server, ...local };
  }
  
