# Formalio Progressive MVP Auth Verification

Formalio is configured for Supabase free-tier authentication without a custom domain, custom SMTP provider, or paid SMS provider. MVP onboarding is progressive: users can enter the app immediately after signup, while email verification is encouraged inside the profile, settings, and security areas.

## Current Free/Testing Mode

- Email/password signup is enabled.
- Supabase Auth email confirmation gating is disabled for MVP onboarding.
- Formalio stores app-level verification state on `public.profiles`.
- Signup attempts a non-blocking verification OTP/magic-link email after the session is created.
- If the free email sender is rate-limited, the profile is marked `queued` or `deferred` instead of blocking account creation.
- Forgot password and password reset still use Supabase Auth recovery emails.
- Session persistence is handled by `@supabase/supabase-js` with Expo AsyncStorage.
- Anonymous sign-ins are disabled.
- SMS OTP is disabled for MVP mode.
- Custom SMTP and custom auth templates are disabled.

Supabase's built-in email provider is suitable for controlled MVP testing and preview builds, but it has very low delivery limits, may restrict delivery to authorized/team email addresses, and has no production deliverability guarantee.

## Verification State

`public.profiles` tracks:

- `email_verification_status`: `unverified`, `sent`, `queued`, `deferred`, or `verified`.
- `email_verified_at`
- `email_verification_sent_at`
- `email_verification_next_attempt_at`
- `email_verification_attempts`
- `email_verification_last_error`

Do not use user-editable `raw_user_meta_data` for authorization decisions. If verification later gates high-risk features, enforce that from trusted profile columns, server-side functions, or app metadata.

## What Works Now

- Signup creates a Supabase Auth user and allows immediate app access.
- The app attempts a verification email in the background.
- Email send quota/rate-limit errors are converted into queued/deferred verification state.
- Users see non-blocking verification reminders in Profile, Settings, and Security.
- Users can resend verification after the cooldown.
- Users can enter the received email OTP in-app.
- Login uses email and password.
- Forgot password sends a Supabase recovery email.
- Password reset updates the authenticated recovery session password.

## Free-Tier Limitations

- Supabase built-in email sender is rate-limited. Current Supabase docs list 2 auth emails per hour for email-send endpoints with the built-in provider.
- Sender domain is controlled by Supabase, not Formalio.
- SMS OTP is not available without configuring an SMS provider.
- Branded email templates are not active in this mode.
- Public launch should move to custom SMTP before relying on verification delivery.

## Current Supabase Settings

- `auth.email.enable_signup = true`
- `auth.email.enable_confirmations = false`
- `auth.email.otp_length = 8`
- `auth.email.otp_expiry = 3600`
- `auth.email.smtp.enabled = false`
- `auth.sms.enable_signup = false`
- `auth.sms.enable_confirmations = false`
- `auth.sms.twilio.enabled = false`
- Refresh token rotation enabled.
- Minimum password length: 8.
- Password requirements: lowercase, uppercase, and digits.

## Environment Variables Needed Now

Only public Expo/Supabase values are needed for MVP auth:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
EXPO_PUBLIC_API_BASE_URL=https://<project-ref>.supabase.co/functions/v1
```

No Resend, Twilio, SPF, DKIM, DMARC, or custom domain is required for the current MVP flow.

## Future Upgrade Points

Custom SMTP with Resend:

- Buy or configure a sending domain such as `auth.formalio.cm`.
- Add SPF, DKIM, and DMARC DNS records.
- Create a Resend API/SMTP key.
- Set `RESEND_SMTP_PASSWORD` as a server-only secret.
- Enable `[auth.email.smtp]` in `supabase/config.toml`.
- Optionally activate the branded templates in `supabase/templates/`.

SMS OTP with Twilio:

- Create a Twilio account with billing enabled.
- Create a Messaging Service.
- Add `SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID`.
- Add `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN`.
- Add `SUPABASE_AUTH_SMS_TWILIO_MESSAGE_SERVICE_SID`.
- Enable `[auth.sms]` and `[auth.sms.twilio]` in `supabase/config.toml`.
- Re-enable SMS OTP UI only after provider testing.

Production anti-abuse:

- Enable CAPTCHA in Supabase Auth before public launch traffic.
- Add custom SMTP before raising email limits.
- Use Edge Functions or a background job to process queued verification requests.
- Gate sensitive future features, not first login, behind verified email/KYC/trust checks.
- Monitor Supabase Auth logs for failed OTP and recovery attempts.
- Keep service-role, SMTP, and SMS provider credentials server-only.

## Verification Checklist

1. Run `npx supabase db push`.
2. Run `npx supabase config push --project-ref skxyktfeeozjzgsotekp`.
3. Open the app with `npx expo start`.
4. Create an account with a real email address.
5. Confirm the app enters onboarding/dashboard without requiring email verification first.
6. Open Profile, Settings, or Security and confirm the verification card is visible.
7. Send or resend verification and confirm cooldown behavior.
8. Enter the email OTP if delivered.
9. Confirm the profile status changes to `verified`.
10. Test forgot password with the same email.
