import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { analytics } from '@/services/analytics/analytics.service';
import { observability } from '@/services/observability/observability.service';

interface NetworkState {
  isOnline: boolean;
  initNetworkListener: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  initNetworkListener: () => {
    let previousOnline = useNetworkStore.getState().isOnline;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (isOnline !== previousOnline) {
        analytics.track(isOnline ? 'offline_mode_exited' : 'offline_mode_entered');
        observability.addBreadcrumb('network', isOnline ? 'online' : 'offline');
        previousOnline = isOnline;
      }
      set({ isOnline });
    });
    return unsubscribe;
  }
}));
