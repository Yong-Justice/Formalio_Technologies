import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Env } from '@/constants/config';

export const isSupabaseConfigured = Boolean(Env.supabaseUrl && Env.supabasePublishableKey);

const sessionStorage = {
  async getItem(key: string) {
    try {
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue != null) return secureValue;
    } catch {
      // SecureStore can be unavailable on web/some emulators; AsyncStorage keeps Expo dev builds working.
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore SecureStore cleanup failures and still clear the AsyncStorage fallback.
    }
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(Env.supabaseUrl || 'https://placeholder.supabase.co', Env.supabasePublishableKey || 'placeholder', {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 8,
    },
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __formalioSupabaseAppStateListenerInstalled: boolean | undefined;
}

if (Platform.OS !== 'web' && !globalThis.__formalioSupabaseAppStateListenerInstalled) {
  globalThis.__formalioSupabaseAppStateListenerInstalled = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

export function getSupabaseRuntimeConfig() {
  const host = Env.supabaseUrl ? new URL(Env.supabaseUrl).host : '';
  const key = Env.supabasePublishableKey;
  return {
    configured: isSupabaseConfigured,
    host,
    keyPrefix: key ? key.slice(0, 14) : '',
    keySuffix: key ? key.slice(-6) : '',
    appEnv: Env.appEnv,
  };
}
