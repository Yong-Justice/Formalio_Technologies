import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async get(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
  },
  async remove(key: string) {
    await SecureStore.deleteItemAsync(key);
  }
};

export const secureKeys = {
  accessToken: 'formalio.accessToken',
  refreshToken: 'formalio.refreshToken',
  userId: 'formalio.userId'
} as const;