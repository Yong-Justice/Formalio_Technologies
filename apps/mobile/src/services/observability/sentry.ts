import * as Sentry from '@sentry/react-native';
import { Env } from '@/config/env';

const release = Env.sentryRelease || `formalio-mobile@${Env.appVersion}+${Env.nativeBuildVersion}`;

Sentry.init({
  dsn: Env.sentryDsn || undefined,
  enabled: Boolean(Env.sentryDsn),
  environment: Env.appEnv,
  release,
  dist: Env.nativeBuildVersion,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});

export { Sentry };
