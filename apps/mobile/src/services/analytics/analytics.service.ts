import { Env } from '@/config/env';

export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'login_completed'
  | 'transaction_added'
  | 'report_generated'
  | 'loan_request_submitted'
  | 'ai_chat_message_sent';

export const analytics = {
  identify(userId: string, properties?: Record<string, unknown>) {
    // Connect PostHog, Segment, or Firebase Analytics here.
    if (__DEV__) console.log('[analytics.identify]', { userId, properties, host: Env.posthogHost });
  },
  track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
    if (__DEV__) console.log('[analytics.track]', event, properties);
  }
};