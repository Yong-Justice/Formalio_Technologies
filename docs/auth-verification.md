# Formalio Auth Verification Runbook

This runbook describes the production setup required for email verification, password recovery, and SMS OTP in Supabase Auth.

## Current Project State

- Supabase project: `skxyktfeeozjzgsotekp`.
- Email/password auth is enabled.
- Email confirmation is enabled.
- Anonymous sign-ins are disabled.
- Passwords require at least 8 characters with lowercase, uppercase, and digits.
- Custom SMTP is not active until the Resend SMTP secret is provided and `supabase config push` is run.
- Phone/SMS auth must not be pushed live until Twilio credentials are available.

## Required Email Provider Setup

Recommended MVP provider: Resend.

Create or provide:

- Resend account.
- Sending domain, recommended: `auth.formalio.cm` or `formalio.cm`.
- SMTP password/API key from Resend.
- Sender address: `no-reply@auth.formalio.cm`.
- DNS records from Resend:
  - SPF/TXT.
  - DKIM records.
  - DMARC record.
  - Optional custom return-path/bounce record if offered.

Supabase settings:

- Custom SMTP enabled.
- SMTP host: `smtp.resend.com`.
- SMTP port: `465`.
- SMTP user: `resend`.
- SMTP password: `RESEND_SMTP_PASSWORD`.
- Sender email: `no-reply@auth.formalio.cm`.
- Sender name: `Formalio`.
- Email confirmation enabled.
- Password recovery enabled through Supabase Auth.
- Redirect URLs include:
  - `formalio://auth/callback`
  - `formalio://reset-password`
  - development Expo URLs.

## Required SMS Provider Setup

Recommended MVP provider: Twilio Verify or Twilio Messaging Service through Supabase Auth.

Create or provide:

- Twilio account with billing enabled.
- Messaging Service SID.
- Account SID.
- Auth token.
- Sender setup approved for target countries.
- Cameroon and target market coverage confirmed in Twilio's country pricing/coverage pages.
- Alphanumeric sender ID or long code/short code where required by local regulation.

Supabase settings:

- Phone provider enabled.
- Phone signup enabled if phone-only accounts are allowed.
- Phone confirmation enabled.
- OTP length: 6.
- OTP expiry: 5 minutes.
- SMS resend frequency: 60 seconds.
- SMS template: `Formalio verification code: {{ .Code }}. It expires soon. Do not share this code.`

## Deployment Commands

Set server-only environment variables locally for config push:

```bash
set RESEND_SMTP_PASSWORD=re_xxx
set SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
set SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
set SUPABASE_AUTH_SMS_TWILIO_MESSAGE_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then push the Supabase Auth config:

```bash
npx supabase config push --project-ref skxyktfeeozjzgsotekp
```

Verify:

```bash
npx supabase db advisors --linked --type all --level warn --fail-on none
```

## Frontend Flows

- Signup sends a Supabase email confirmation code/link.
- The app shows an email OTP screen and verifies `type: signup`.
- Resend verification calls Supabase Auth resend for `signup`.
- Forgot password sends a recovery code/link.
- Recovery OTP verifies `type: recovery`, then updates the password.
- SMS login sends OTP with `signInWithOtp` and verifies `type: sms`.
- SMS resend calls Supabase Auth resend for `sms`.

## Security Minimums

- Rotate any leaked access tokens immediately.
- Never expose SMTP, Twilio, service role, or secret keys to Expo.
- Keep anonymous sign-ins disabled.
- Keep refresh token rotation enabled.
- Use CAPTCHA once public signup traffic starts.
- Add monitoring for Auth error spikes and SMS/email send failures.
- Use invite-only or waitlist gating if fake account abuse appears during launch.
