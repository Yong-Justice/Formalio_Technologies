import { Env } from '@/config/env';
import { prefsStorage } from '@/services/storage/mmkv';

export type AnalyticsEvent =
  | 'screen_viewed'
  | 'onboarding_completed'
  | 'login_completed'
  | 'transaction_added'
  | 'transaction_initiated'
  | 'transaction_completed'
  | 'transaction_failed'
  | 'feature_used'
  | 'offline_mode_entered'
  | 'offline_mode_exited'
  | 'offline_sync_completed'
  | 'offline_sync_failed'
  | 'biometric_auth_succeeded'
  | 'biometric_auth_failed'
  | 'push_token_registered'
  | 'push_token_registration_failed'
  | 'notification_tapped'
  | 'report_generated'
  | 'loan_request_submitted'
  | 'ai_chat_message_sent';

const DISTINCT_ID_KEY = 'analytics.distinctId';
const forbiddenPropertyKeys = new Set(['email', 'phone', 'fullName', 'name', 'identifier']);

function fallbackId() {
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getDistinctId() {
  const existing = prefsStorage.getString(DISTINCT_ID_KEY);
  if (existing) return existing;
  const generated = fallbackId();
  prefsStorage.set(DISTINCT_ID_KEY, generated);
  return generated;
}

function sanitize(properties?: Record<string, unknown>) {
  if (!properties) return undefined;
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => value !== undefined && !forbiddenPropertyKeys.has(key))
  );
}

async function capture(event: string, distinctId: string, properties?: Record<string, unknown>) {
  const safeProperties = sanitize(properties);
  if (__DEV__) console.log('[analytics.track]', event, safeProperties);
  if (!Env.posthogKey) return;

  try {
    await fetch(`${Env.posthogHost.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: Env.posthogKey,
        event,
        distinct_id: distinctId,
        properties: safeProperties,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Analytics must never break product flows.
  }
}

export const analytics = {
  identify(userId: string, properties?: Record<string, unknown>) {
    const previousId = getDistinctId();
    prefsStorage.set(DISTINCT_ID_KEY, userId);
    if (__DEV__) console.log('[analytics.identify]', { userId, properties: sanitize(properties), host: Env.posthogHost });
    void capture('$identify', userId, { $anon_distinct_id: previousId, $set: sanitize(properties) });
  },
  track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    void capture(event, getDistinctId(), properties);
  },
  screen(route: string, properties?: Record<string, unknown>) {
    void capture('screen_viewed', getDistinctId(), { route, ...properties });
  },
  featureUsed(feature: 'voice_input' | 'ai_assistant' | 'ohada_report_generation', properties?: Record<string, unknown>) {
    void capture('feature_used', getDistinctId(), { feature, ...properties });
  },
  reset() {
    prefsStorage.set(DISTINCT_ID_KEY, fallbackId());
  },
};
