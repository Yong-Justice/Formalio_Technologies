import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Env } from '@/config/env';

export const isSupabaseConfigured = Boolean(Env.supabaseUrl && Env.supabasePublishableKey);

export const supabase = createClient(Env.supabaseUrl || 'https://placeholder.supabase.co', Env.supabasePublishableKey || 'placeholder', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 8,
    },
  },
});
