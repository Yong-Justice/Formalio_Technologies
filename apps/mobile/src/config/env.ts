import Constants from 'expo-constants';

type AppEnv = 'development' | 'staging' | 'production';

const extra = Constants.expoConfig?.extra ?? {};
const easProjectId = String(
  extra.eas?.projectId ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId ?? ''
);
const nativeBuildVersion = String(
  Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode ??
    'dev'
);

export const Env = {
  appEnv: (extra.appEnv ?? 'development') as AppEnv,
  apiBaseUrl: String(extra.apiBaseUrl ?? 'http://localhost:3000'),
  posthogKey: String(extra.posthogKey ?? ''),
  posthogHost: String(extra.posthogHost ?? 'https://app.posthog.com'),
  sentryDsn: String(extra.sentryDsn ?? ''),
  sentryRelease: String(extra.sentryRelease ?? ''),
  appVersion: String(Constants.expoConfig?.version ?? '1.0.0'),
  nativeBuildVersion,
  easProjectId,
  requestSigningSecret: String(extra.requestSigningSecret ?? ''),
  mmkvEncryptionKey: String(extra.mmkvEncryptionKey ?? 'formalio-dev-mmkv-key'),
  enableAI: process.env.EXPO_PUBLIC_ENABLE_AI !== 'false',
  enableNotchPay: process.env.EXPO_PUBLIC_ENABLE_NOTCHPAY !== 'false',
  enableMoMoCsvImport: process.env.EXPO_PUBLIC_ENABLE_MOMO_CSV_IMPORT !== 'false'
} as const;

export const isProduction = Env.appEnv === 'production';
