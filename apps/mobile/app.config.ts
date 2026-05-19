import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Formalio',
  slug: 'formalio-mobile',
  owner: 'formalio',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'formalio',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#001F3F'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'africa.formalio.mobile',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'Formalio uses your camera to scan receipts and business documents.',
      NSFaceIDUsageDescription: 'Formalio uses Face ID to securely unlock your account.'
    }
  },
  android: {
    package: 'africa.formalio.mobile',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#001F3F'
    },
    permissions: ['CAMERA', 'RECORD_AUDIO', 'NOTIFICATIONS']
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
    ['expo-camera', { cameraPermission: 'Allow Formalio to scan receipts and documents.' }],
    ['expo-notifications', { icon: './assets/images/notification-icon.png', color: '#28A745' }]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    eas: {
      projectId: 'replace-with-eas-project-id'
    }
  }
};

export default config;