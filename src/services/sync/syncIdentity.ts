import { isSupabaseConfigured, supabase } from '@/services/api/supabase';

const ZERO_UUID = '00000000-0000-4000-8000-000000000001';

export function isSyncableUserId(value?: string | null) {
  return Boolean(
    value &&
      value !== ZERO_UUID &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

export async function getCurrentSyncUserId(fallback?: string | null) {
  if (isSyncableUserId(fallback)) return fallback;
  if (!isSupabaseConfigured) return isSyncableUserId(fallback) ? fallback : null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return isSyncableUserId(data.user?.id) ? data.user!.id : null;
  } catch {
    return null;
  }
}
