import { MMKV } from "react-native-mmkv";
  import { Env } from "@/config/env";

  export const prefsStorage = new MMKV({ id: "formalio-prefs",       encryptionKey: Env.mmkvEncryptionKey });
  export const queueStorage = new MMKV({ id: "formalio-queue",       encryptionKey: Env.mmkvEncryptionKey });
  export const queryStorage = new MMKV({ id: "formalio-query-cache", encryptionKey: Env.mmkvEncryptionKey });
  export const auditStorage = new MMKV({ id: "formalio-audit",       encryptionKey: Env.mmkvEncryptionKey });

  export const storageKeys = {
    prefs: { language: "prefs.language", onboardingCompleted: "prefs.onboardingCompleted", apiBaseUrlOverride: "prefs.apiBaseUrlOverride" },
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

  export function getJson<T>(store: MMKV, key: string, fallback: T): T {
    const raw = store.getString(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }
  export function setJson<T>(store: MMKV, key: string, value: T): void {
    store.set(key, JSON.stringify(value));
  }
  