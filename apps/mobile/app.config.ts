import "dotenv/config";
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Formalio",
  slug: "formalio-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/official-logo.png",
  scheme: "formalio",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/official-logo.png",
    resizeMode: "contain",
    backgroundColor: "#052320",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "africa.formalio.mobile",
    buildNumber: "1",
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
      NSCameraUsageDescription:
        "Formalio uses your camera to scan receipts and business documents.",
      NSFaceIDUsageDescription:
        "Formalio uses Face ID to securely unlock your account.",
    },
  },
  android: {
    package: "africa.formalio.mobile",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/images/official-logo.png",
      backgroundColor: "#052320",
    },
    permissions: ["CAMERA", "RECORD_AUDIO", "NOTIFICATIONS"],
  },
  plugins: [
    "expo-asset",
    "expo-router",
    "expo-secure-store",
    "expo-local-authentication",
    [
      "expo-camera",
      { cameraPermission: "Allow Formalio to scan receipts and documents." },
    ],
    [
      "expo-notifications",
      { icon: "./assets/images/notification-icon.png", color: "#28A745" },
    ],
    "@sentry/react-native",
  ],
  experiments: {
    typedRoutes: false,
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  extra: {
    router: {
      root: "app",
    },
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? "development",
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sentryRelease: process.env.SENTRY_RELEASE,
    requestSigningSecret: process.env.EXPO_PUBLIC_REQUEST_SIGNING_SECRET,
    mmkvEncryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY,
    brandAssets: {
      logo: "./assets/images/official-logo.png",
      socialPreview: "./assets/images/social-preview.png",
    },
    eas: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
      ? {
          projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
        }
      : undefined,
  },
};

export default config;
