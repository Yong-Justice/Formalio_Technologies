import { useCallback, useState } from 'react';
import { useNetworkStore } from '@/services/sync/network';
import { syncAllTables } from '@/services/sync/databaseSync';
import { useAuthStore } from '@/store/authStore';
import type { SyncSummary } from '@/types/database.types';

export function useSync() {
  const network = useNetworkStore();
  const userId = useAuthStore((state) => state.user?.id);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncSummary | null>(null);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncAllTables(userId);
      setLastResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

  return { ...network, isSyncing, lastResult, syncNow };
}
