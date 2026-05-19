# Formalio Free MVP Auth Verification

Formalio is currently configured for Supabase free-tier authentication without a custom domain, custom SMTP provider, or paid SMS provider.

## Current Free/Testing Mode

- Email/password signup is enabled.
- Email confirmation is enabled.
- Forgot password and password reset use Supabase Auth recovery emails.
- Resend verification uses Supabase Auth resend.
- Session persistence is handled by `@supabase/supabase-js` with Expo AsyncStorage.
- Anonymous sign-ins are disabled.
- SMS OTP is disabled for MVP mode.
- Custom SMTP is disabled.
- Custom email templates are not active; Supabase hosted default auth emails are used.

Supabase's built-in email provider is suitable for MVP testing and preview builds, but it has very low delivery limits, may restrict delivery to authorized/team email addresses, and has no production deliverability guarantee.

## What Works Now

- Signup creates a Supabase Auth user and blocks access until email verification completes.
- The app shows an email OTP screen after signup.
- Users can request another signup verification email with a 60-second resend cooldown.
- Login uses email and password only.
- Unverified users cannot log in because Supabase email confirmation is required.
- Forgot password sends a Supabase recovery email.
- Recovery OTP verification opens the password reset screen.
- Password reset updates the authenticated recovery session password.

## Free-Tier Limitations

- Supabase built-in email sender is rate-limited. Current Supabase docs list 2 auth emails per hour for the built-in provider.
- Some hosted Supabase projects only deliver built-in auth emails to addresses authorized through the Supabase organization/team while custom SMTP is disabled.
- Sender domain is controlled by Supabase, not Formalio.
- Deliverability is best effort.
- SMS OTP is not available without configuring an SMS provider.
- Branded email templates are not active in this mode.

## Current Supabase Settings

- `auth.email.enable_signup = true`
- `auth.email.enable_confirmations = true`
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
- Re-enable the SMS OTP UI in the Expo auth flow.

Production anti-abuse:

- Enable CAPTCHA in Supabase Auth before public launch traffic.
- Increase email/SMS limits only after real providers are configured.
- Monitor Supabase Auth logs for failed OTP and recovery attempts.
- Keep service-role, SMTP, and SMS provider credentials server-only.

## Verification Checklist

1. Run `npx supabase config push --project-ref skxyktfeeozjzgsotekp`.
2. Open the app with `npx expo start`.
3. Create an account with a real email address.
4. Confirm that a Supabase email arrives.
5. Enter the 8-digit code if shown, or open the confirmation link from the email.
6. Confirm the app does not enter the dashboard before verification.
7. Test resend after the 60-second cooldown.
8. Test forgot password with the same email.
9. Enter the recovery code if shown, or open the recovery link.
10. Set a new password and log in.
