import { useNetworkStore } from '@/services/sync/network';

export function useOffline() {
  return useNetworkStore((state) => !state.isOnline);
}
