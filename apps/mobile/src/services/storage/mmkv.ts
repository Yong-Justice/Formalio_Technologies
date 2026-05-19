import { MMKV } from "react-native-mmkv";
  import { Env } from "@/config/env";

  // ---------------------------------------------------------------------------
  // Secure Local Storage Matrix — MMKV instances
  //
  // Data Type                  | Store         | Reason
  // ---------------------------|---------------|------------------------------------
  // User preferences           | prefsStorage  | Fast sync reads, encrypted partition
  // Offline transaction queue  | queueStorage  | Encrypted, survives app restart
  // React Query cache          | queryStorage  | Persisted offline display, encrypted
  // API base URL override      | prefsStorage  | Dev-only environment switching
  // Audit / integrity log      | auditStorage  | Encrypted, append-only risk log
  // ---------------------------------------------------------------------------

  export const prefsStorage = new MMKV({
    id: "formalio-prefs",
    encryptionKey: Env.mmkvEncryptionKey,
  });

  export const queueStorage = new MMKV({
    id: "formalio-queue",
    encryptionKey: Env.mmkvEncryptionKey,
  });

  export const queryStorage = new MMKV({
    id: "formalio-query-cache",
    encryptionKey: Env.mmkvEncryptionKey,
  });

  export const auditStorage = new MMKV({
    id: "formalio-audit",
    encryptionKey: Env.mmkvEncryptionKey,
  });

  export const storageKeys = {
    prefs: {
      language:           "prefs.language",
      onboardingCompleted:"prefs.onboardingCompleted",
      apiBaseUrlOverride: "prefs.apiBaseUrlOverride",
    },
    queue: {
      offlineTransactions: "queue.offlineTransactions",
    },
    query: {
      reactQueryCache: "query.rqCache",
    },
    audit: {
      integrityLog: "audit.integrity_log",
    },
  } as const;

  export function getJson<T>(store: MMKV, key: string, fallback: T): T {
    const raw = store.getString(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; }
    catch { return fallback; }
  }

  export function setJson<T>(store: MMKV, key: string, value: T): void {
    store.set(key, JSON.stringify(value));
  }
  