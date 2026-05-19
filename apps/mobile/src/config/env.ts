import Constants from 'expo-constants';

type AppEnv = 'development' | 'staging' | 'production';

const extra = Constants.expoConfig?.extra ?? {};

export const Env = {
  appEnv: (extra.appEnv ?? 'development') as AppEnv,
  apiBaseUrl: String(extra.apiBaseUrl ?? 'http://localhost:3000'),
  posthogKey: String(extra.posthogKey ?? ''),
  posthogHost: String(extra.posthogHost ?? 'https://app.posthog.com'),
  enableAI: process.env.EXPO_PUBLIC_ENABLE_AI !== 'false',
  enableNotchPay: process.env.EXPO_PUBLIC_ENABLE_NOTCHPAY !== 'false',
  enableMoMoCsvImport: process.env.EXPO_PUBLIC_ENABLE_MOMO_CSV_IMPORT !== 'false'
} as const;

export const isProduction = Env.appEnv === 'production';