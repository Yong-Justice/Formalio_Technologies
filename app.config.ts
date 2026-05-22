import "dotenv/config";
import type { ExpoConfig } from "expo/config";

const sentryPlugin: NonNullable<ExpoConfig["plugins"]> =
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
    ? [
        [
          "@sentry/react-native",
          {
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
          },
        ],
      ]
    : [];
const easOwner = process.env.EXPO_PUBLIC_EAS_OWNER ?? "yongjustice";
const easProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  (process.env.EXPO_PUBLIC_EAS_OWNER ? undefined : "792092c6-07a1-4608-933f-bcc618880a62");

const config: ExpoConfig = {
  name: "Formalio",
  slug: "formalio-mobile",
  owner: easOwner,
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
    softwareKeyboardLayoutMode: "resize",
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
    ...sentryPlugin,
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
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
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
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
  },
};

export default config;
