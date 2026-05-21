# Formalio Mobile App

Production-ready Expo/React Native mobile application shell for Formalio.

## Quick Start

```bash
npm install
cp .env.example .env
npx expo start
```

## Where to Configure Things

- Backend URL: `.env` -> `EXPO_PUBLIC_API_BASE_URL`
- Expo app identifiers: `app.config.ts`
- EAS build profiles: `eas.json`
- API endpoints: `src/services/api/endpoints.ts`
- Auth providers / token refresh: `src/features/auth/services/auth.service.ts`
- AI backend routes and prompts: `src/features/ai/**`
- Push notifications: `src/services/notifications/notifications.service.ts`
- Offline queue and sync: `src/services/offline/**`
- Payment checkout placeholders: `src/features/subscriptions/**`
- Theme tokens: `src/theme/tokens.ts`
- Localization strings: `src/i18n/**`

## Security Rules

- Do not place Anthropic/OpenAI, NotchPay secret keys, Twilio tokens, or DB service keys in mobile env files.
- The app calls your backend `/ai/*`, `/payments/*`, `/webhooks/*` routes. Secrets remain server-side only.
- Access and refresh tokens are stored with Expo SecureStore.
- Non-sensitive cached financial data is stored with MMKV and synchronized with the offline queue.

## Store Deployment

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

## Architecture Summary

The app uses Expo Router for navigation, Zustand for local domain state, TanStack Query for API state, React Hook Form + Zod for validation, Axios for API calls, SecureStore/MMKV for persistence, and a lightweight offline queue for optimistic writes.
