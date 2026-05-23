import { useNetworkStore } from '@/services/sync/network';

export function useSync() {
  return useNetworkStore();
}
