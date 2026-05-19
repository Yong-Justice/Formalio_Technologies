import { Env } from "@/config/env";

type SyncStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
};

type MMKVConstructor = new (config: { id: string; encryptionKey?: string }) => SyncStorage;

function createMemoryStorage(): SyncStorage {
  const values = new Map<string, string>();
  return {
    getString: (key) => values.get(key),
    set: (key, value) => {
      values.set(key, value);
    },
  };
}

function resolveMMKV(): MMKVConstructor | null {
  try {
    return require("react-native-mmkv").MMKV as MMKVConstructor;
  } catch {
    return null;
  }
}

function createStorage(id: string): SyncStorage {
  const MMKV = resolveMMKV();
  if (!MMKV) return createMemoryStorage();

  try {
    return new MMKV({ id, encryptionKey: Env.mmkvEncryptionKey });
  } catch {
    return createMemoryStorage();
  }
}

  export const prefsStorage = createStorage("formalio-prefs");
  export const queueStorage = createStorage("formalio-queue");
  export const queryStorage = createStorage("formalio-query-cache");
  export const auditStorage = createStorage("formalio-audit");

  export const storageKeys = {
    authUser: "auth.user",
    onboardingCompleted: "prefs.onboardingCompleted",
    language: "prefs.language",
    auth: { user: "auth.user" },
    prefs: { language: "prefs.language", onboardingCompleted: "prefs.onboardingCompleted", apiBaseUrlOverride: "prefs.apiBaseUrlOverride" },
    notifications: {
      lastTappedId: "notifications.lastTappedId",
      lastRoutedUrl: "notifications.lastRoutedUrl",
    },
    queue: { offlineTransactions: "queue.offlineTransactions" },
    query: {
      reactQueryCache: "query.rqCache",
      businesses: "query.businesses", selectedBusinessId: "query.selectedBusinessId",
      transactions: "query.transactions", walletBalance: "query.walletBalance",
      walletLastUpdated: "query.walletLastUpdated", creditScore: "query.creditScore",
      creditScoreLastUpdated: "query.creditScoreLastUpdated", exchangeRates: "query.exchangeRates",
      exchangeRatesLastUpdated: "query.exchangeRatesLastUpdated",
    },
    audit: { integrityLog: "audit.integrity_log" },
  } as const;

  export function getJson<T>(key: string, fallback: T): T;
  export function getJson<T>(store: SyncStorage, key: string, fallback: T): T;
  export function getJson<T>(storeOrKey: SyncStorage | string, keyOrFallback: string | T, maybeFallback?: T): T {
    const store = typeof storeOrKey === "string" ? prefsStorage : storeOrKey;
    const key = typeof storeOrKey === "string" ? storeOrKey : keyOrFallback as string;
    const fallback = typeof storeOrKey === "string" ? keyOrFallback as T : maybeFallback as T;
    const raw = store.getString(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }

  export function setJson<T>(key: string, value: T): void;
  export function setJson<T>(store: SyncStorage, key: string, value: T): void;
  export function setJson<T>(storeOrKey: SyncStorage | string, keyOrValue: string | T, maybeValue?: T): void {
    const store = typeof storeOrKey === "string" ? prefsStorage : storeOrKey;
    const key = typeof storeOrKey === "string" ? storeOrKey : keyOrValue as string;
    const value = typeof storeOrKey === "string" ? keyOrValue as T : maybeValue as T;
    store.set(key, JSON.stringify(value));
  }
  
