-- Progressive MVP email verification.
-- Supabase Auth email confirmations are disabled for smoother first access, so
-- Formalio tracks verification separately in the user profile.

alter table public.profiles
  add column if not exists email_verification_status text not null default 'unverified'
    check (email_verification_status in ('unverified', 'sent', 'queued', 'deferred', 'verified')),
  add column if not exists email_verified_at timestamptz,
  add column if not exists email_verification_sent_at timestamptz,
  add column if not exists email_verification_next_attempt_at timestamptz,
  add column if not exists email_verification_attempts integer not null default 0 check (email_verification_attempts >= 0),
  add column if not exists email_verification_last_error text;

create index if not exists profiles_email_verification_status_idx
  on public.profiles (email_verification_status)
  where email_verification_status <> 'verified';

create index if not exists profiles_email_verification_next_attempt_idx
  on public.profiles (email_verification_next_attempt_at)
  where email_verification_next_attempt_at is not null
    and email_verification_status in ('queued', 'deferred');

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    id,
    email,
    phone,
    full_name,
    language,
    onboarding_completed,
    account_status,
    email_verification_status,
    email_verified_at
  )
  values (
    new.id,
    nullif(new.email, ''),
    nullif(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'language', 'fr'),
    false,
    'active',
    'unverified',
    null
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = excluded.phone,
        full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
        email_verification_status = case
          when profiles.email is distinct from excluded.email then 'unverified'
          else profiles.email_verification_status
        end,
        email_verified_at = case
          when profiles.email is distinct from excluded.email then null
          else profiles.email_verified_at
        end,
        email_verification_last_error = case
          when profiles.email is distinct from excluded.email then null
          else profiles.email_verification_last_error
        end,
        updated_at = now();

  return new;
end;
$$;
