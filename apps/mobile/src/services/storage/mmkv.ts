import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'formalio-local-cache' });

export const storageKeys = {
  authUser: 'auth.user',
  selectedBusinessId: 'business.selectedId',
  businesses: 'businesses.cache',
  transactions: 'transactions.cache',
  reports: 'reports.cache',
  offlineQueue: 'offline.queue',
  onboardingCompleted: 'onboarding.completed',
  language: 'settings.language'
} as const;

export function getJson<T>(key: string, fallback: T): T {
  const raw = storage.getString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJson<T>(key: string, value: T) {
  storage.set(key, JSON.stringify(value));
}