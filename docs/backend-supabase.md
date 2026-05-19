# Formalio Supabase Backend

This project includes a Supabase-first backend for the Expo fintech app. The architecture is cloud-managed: Supabase Auth owns identity/session state, Postgres owns business/accounting data, Storage owns uploads, Edge Functions own server-side orchestration, and Row Level Security scopes all company data by membership.

## Cloud Model

- `profiles`: one row per Supabase Auth user.
- `companies`: business/store profile, tax identity, KYC status, and operating currency.
- `company_memberships`: multi-user access with `owner`, `admin`, `accountant`, `operator`, and `viewer` roles.
- `transactions`, `accounting_entries`, `invoices`, `reports`, `tva_declarations`, `cash_flow_snapshots`, and `financial_analytics`: accounting and reporting core.
- `documents` plus Supabase Storage buckets: receipts, KYC uploads, profile media, report exports.
- `ai_conversations` and `ai_messages`: Mosika assistant session memory and financial context.
- `loan_requests`: request tracking through submitted, review, risk assessment, documents, approved/rejected, and disbursed states.
- `notifications`, `device_push_tokens`, `subscriptions`, `banking_connections`, `bank_accounts`, and `audit_logs`: production platform support.

## Security Model

Every exposed public table has RLS enabled. Policies use private helper functions to check active company membership and role. Mobile clients use only the publishable key; service-role/secret keys are reserved for Supabase Edge Functions and must never be shipped in the app.

Storage object paths must start with the company UUID:

```text
<company_id>/profile/avatar.jpg
<company_id>/kyc/id-front.jpg
<company_id>/receipts/receipt-001.jpg
<company_id>/reports/2026-05-resultat.pdf
```

## Edge Functions

- `analytics`: returns dashboard KPIs from real transactions.
- `reports-generate`: creates bilan, compte de resultat, cashflow, TVA, loan readiness, and dashboard reports.
- `ai-assistant`: stores chat messages and returns financial/accounting insight from live metrics.
- `ocr-ticket`: production-ready OCR boundary with simulated extraction until a real OCR provider is connected.
- `notifications`: list, create, and mark notifications.

## Expo Environment

Set these in your local `.env` or EAS environment:

```bash
EXPO_PUBLIC_API_BASE_URL=https://<project-ref>.supabase.co/functions/v1
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

The Expo app preserves the current UI. When Supabase env vars are present, auth, bootstrap, profile updates, transactions, loan requests, and Mosika chat use Supabase. Without env vars, the prototype can still open for local UI work.

## Deployment

Production deployment is currently linked to Supabase project `skxyktfeeozjzgsotekp`.

1. Create a Supabase project.
2. In the Supabase dashboard, configure Auth providers:
   - Email/password enabled.
   - Email confirmations disabled for MVP first-login onboarding.
   - App-level progressive email verification tracked on `public.profiles`.
   - Supabase built-in auth email sender enabled for free MVP/testing mode.
   - Custom SMTP and SMS OTP disabled until the paid provider upgrade points in [auth-verification.md](./auth-verification.md) are ready.
   - Google OAuth can be enabled after Google client ID/secret are available.
   - Apple OAuth can be enabled later with Apple developer credentials.
   - Add mobile redirect URLs such as `formalio://auth/callback` and `formalio://reset-password`.
3. Link the local repo:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
```

4. Deploy the database:

```bash
npx supabase db push
```

5. Push Auth, API, and Storage config:

```bash
npx supabase config push --project-ref <project-ref>
```

6. Deploy functions:

```bash
npx supabase functions deploy --project-ref <project-ref> --use-api
```

7. Add the Expo public env vars to EAS or your local `.env`, then run:

```bash
npm run mobile:typecheck
npx expo start
```

## Current Production Status

- Database migrations are applied to production.
- RLS is enabled on all 28 public application tables.
- Storage buckets are created: `profile-media`, `business-documents`, `kyc-documents`, `report-exports`.
- Edge Functions are deployed and active: `analytics`, `reports-generate`, `ai-assistant`, `ocr-ticket`, `notifications`.
- Auth is configured with email/password, progressive app-level email verification, 8-character minimum passwords, required lower/upper/digit characters, refresh token rotation, disabled anonymous sign-ins, and TOTP MFA support.
- MVP auth currently uses Supabase built-in auth emails with custom SMTP and SMS disabled. This is suitable for controlled testing and preview builds, not high-volume public production delivery.
- Supabase advisor checks report no warn-level issues after the hardening migrations.
