import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  initNetworkListener: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  initNetworkListener: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      set({ isOnline: Boolean(state.isConnected && state.isInternetReachable !== false) });
    });
    return unsubscribe;
  }
}));