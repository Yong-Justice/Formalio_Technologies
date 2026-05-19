import * as SecureStore from "expo-secure-store";

export const secureKeys = {
  accessToken: "formalio.accessToken",
  refreshToken: "formalio.refreshToken",
  biometricEnrollment: "formalio.biometricEnrollment",
  userId: "formalio.userId",
  expoPushToken: "formalio.expoPushToken",
  pushTokenSyncedAt: "formalio.pushTokenSyncedAt",
} as const;

export type SecureKey = (typeof secureKeys)[keyof typeof secureKeys];

const DEFAULT_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const REFRESH_TOKEN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: true,
  authenticationPrompt: "Confirm your identity to continue",
};

const fallbackValues = new Map<string, string>();

function getFallbackValue(key: string) {
  if (typeof localStorage !== "undefined") return localStorage.getItem(key);
  return fallbackValues.get(key) ?? null;
}

function setFallbackValue(key: string, value: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
    return;
  }

  fallbackValues.set(key, value);
}

function removeFallbackValue(key: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
    return;
  }

  fallbackValues.delete(key);
}

async function getSecureItem(key: string, options: SecureStore.SecureStoreOptions) {
  try {
    return await SecureStore.getItemAsync(key, options);
  } catch {
    return getFallbackValue(key);
  }
}

async function setSecureItem(key: string, value: string, options: SecureStore.SecureStoreOptions) {
  try {
    await SecureStore.setItemAsync(key, value, options);
  } catch {
    setFallbackValue(key, value);
  }
}

async function removeSecureItem(key: string, options: SecureStore.SecureStoreOptions) {
  try {
    await SecureStore.deleteItemAsync(key, options);
  } catch {
    removeFallbackValue(key);
  }
}

export const secureStorage = {
  get(key: string): Promise<string | null> {
    return getSecureItem(key, DEFAULT_OPTIONS);
  },
  set(key: string, value: string): Promise<void> {
    return setSecureItem(key, value, DEFAULT_OPTIONS);
  },
  remove(key: string): Promise<void> {
    return removeSecureItem(key, DEFAULT_OPTIONS);
  },
};

export const refreshTokenStorage = {
  get(): Promise<string | null> {
    return getSecureItem(secureKeys.refreshToken, REFRESH_TOKEN_OPTIONS);
  },
  set(value: string): Promise<void> {
    return setSecureItem(secureKeys.refreshToken, value, REFRESH_TOKEN_OPTIONS);
  },
  remove(): Promise<void> {
    return removeSecureItem(secureKeys.refreshToken, DEFAULT_OPTIONS);
  },
};

export const biometricEnrollmentStorage = {
  async isEnrolled(): Promise<boolean> {
    const val = await secureStorage.get(secureKeys.biometricEnrollment);
    return val === "true";
  },
  setEnrolled(enrolled: boolean): Promise<void> {
    return secureStorage.set(secureKeys.biometricEnrollment, enrolled ? "true" : "false");
  },
  clear(): Promise<void> {
    return secureStorage.remove(secureKeys.biometricEnrollment);
  },
};
