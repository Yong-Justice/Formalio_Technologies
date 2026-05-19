import * as SecureStore from "expo-secure-store";

  // ---------------------------------------------------------------------------
  // Secure Local Storage Matrix — SecureStore entries
  //
  // Data Type                  | Accessibility
  // ---------------------------|----------------------------------------------------
  // JWT access token           | WHEN_UNLOCKED_THIS_DEVICE_ONLY
  // JWT refresh token          | WHEN_UNLOCKED_THIS_DEVICE_ONLY + requireAuthentication
  // Biometric enrollment flag  | WHEN_UNLOCKED_THIS_DEVICE_ONLY
  // User ID                    | WHEN_UNLOCKED_THIS_DEVICE_ONLY
  // ---------------------------------------------------------------------------

  export const secureKeys = {
    accessToken:         "formalio.accessToken",
    refreshToken:        "formalio.refreshToken",
    biometricEnrollment: "formalio.biometricEnrollment",
    userId:              "formalio.userId",
  } as const;

  export type SecureKey = (typeof secureKeys)[keyof typeof secureKeys];

  const DEFAULT_OPTIONS: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };

  /** Hardware-backed encrypted storage — access token, userId, enrollment flag */
  export const secureStorage = {
    async get(key: string): Promise<string | null> {
      return SecureStore.getItemAsync(key, DEFAULT_OPTIONS);
    },
    async set(key: string, value: string): Promise<void> {
      await SecureStore.setItemAsync(key, value, DEFAULT_OPTIONS);
    },
    async remove(key: string): Promise<void> {
      await SecureStore.deleteItemAsync(key, DEFAULT_OPTIONS);
    },
  };

  /**
   * Refresh token storage — requires biometric / PIN authentication on read.
   * iOS:     kSecAccessControlBiometryCurrentSet (Face ID or Touch ID)
   * Android: setUserAuthenticationRequired(true) via Keystore
   * Cannot be read without live user presence — protects against memory dumps.
   */
  const REFRESH_TOKEN_OPTIONS: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: true,
    authenticationPrompt: "Confirm your identity to continue",
  };

  export const refreshTokenStorage = {
    async get(): Promise<string | null> {
      return SecureStore.getItemAsync(secureKeys.refreshToken, REFRESH_TOKEN_OPTIONS);
    },
    async set(value: string): Promise<void> {
      await SecureStore.setItemAsync(secureKeys.refreshToken, value, REFRESH_TOKEN_OPTIONS);
    },
    async remove(): Promise<void> {
      await SecureStore.deleteItemAsync(secureKeys.refreshToken, DEFAULT_OPTIONS);
    },
  };

  /** Biometric enrollment flag — controls whether biometric prompt appears */
  export const biometricEnrollmentStorage = {
    async isEnrolled(): Promise<boolean> {
      const val = await secureStorage.get(secureKeys.biometricEnrollment);
      return val === "true";
    },
    async setEnrolled(enrolled: boolean): Promise<void> {
      await secureStorage.set(secureKeys.biometricEnrollment, enrolled ? "true" : "false");
    },
    async clear(): Promise<void> {
      await secureStorage.remove(secureKeys.biometricEnrollment);
    },
  };
  