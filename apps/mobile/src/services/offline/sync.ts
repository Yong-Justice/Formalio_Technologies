import { useEffect } from 'react';
import { flushOfflineQueue } from './queue';
import { useNetworkStore } from './network';

export function useOfflineSync() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  const initNetworkListener = useNetworkStore((state) => state.initNetworkListener);

  useEffect(() => initNetworkListener(), [initNetworkListener]);

  useEffect(() => {
    if (isOnline) void flushOfflineQueue();
  }, [isOnline]);
}