-- Formalio cloud-first fintech/accounting backend.
-- This migration is intentionally broad: it establishes the production data model,
-- membership-scoped Row Level Security, storage policies, financial aggregation
-- helpers, and auth bootstrap triggers used by the Expo application.

begin;

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.member_role as enum ('owner', 'admin', 'accountant', 'operator', 'viewer');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_status as enum ('invited', 'active', 'suspended', 'removed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.company_status as enum ('onboarding', 'active', 'suspended', 'closed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_tier as enum ('free', 'starter', 'growth', 'enterprise');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.kyc_status as enum ('pending', 'under_review', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.transaction_type as enum ('income', 'expense', 'transfer', 'adjustment');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.transaction_status as enum ('draft', 'pending', 'completed', 'reconciled', 'voided');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.invoice_status as enum ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'voided');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_type as enum ('bilan', 'resultat', 'cashflow', 'tva', 'loan_readiness', 'dashboard_summary');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('processing', 'ready', 'failed', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_kind as enum ('profile_photo', 'company_banner', 'kyc_id_front', 'kyc_id_back', 'kyc_selfie', 'kyc_address_proof', 'receipt', 'invoice', 'report_export', 'contract', 'other');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_status as enum ('unread', 'read', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_message_role as enum ('user', 'assistant', 'system', 'tool');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.loan_status as enum ('submitted', 'under_review', 'risk_assessment', 'pending_documents', 'approved', 'rejected', 'disbursed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.bank_connection_status as enum ('pending', 'connected', 'syncing', 'error', 'revoked');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Private helper functions used by triggers and RLS policies.
-- Kept outside the exposed public schema because they run with elevated rights.
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.set_transaction_date()
returns trigger
language plpgsql
as $$
begin
  new.transaction_date = new.occurred_at::date;
  return new;
end;
$$;

create or replace function private.is_company_member(target_company_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  return exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
end;
$$;

create or replace function private.has_company_role(target_company_id uuid, allowed_roles public.member_role[])
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  return exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role = any(allowed_roles)
  );
end;
$$;

create or replace function private.can_manage_company(target_company_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  return private.has_company_role(target_company_id, array['owner', 'admin']::public.member_role[]);
end;
$$;

create or replace function private.can_manage_accounting(target_company_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  return private.has_company_role(target_company_id, array['owner', 'admin', 'accountant']::public.member_role[]);
end;
$$;

create or replace function private.can_bootstrap_owner_membership(
  target_company_id uuid,
  target_user_id uuid,
  target_role public.member_role
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if target_user_id <> auth.uid() or target_role <> 'owner' then
    return false;
  end if;

  return exists (
    select 1
    from public.companies c
    where c.id = target_company_id
      and c.owner_user_id = auth.uid()
      and c.created_by = auth.uid()
  );
end;
$$;

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
    account_status
  )
  values (
    new.id,
    nullif(new.email, ''),
    nullif(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'language', 'fr'),
    false,
    'active'
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = excluded.phone,
        updated_at = now();

  return new;
end;
$$;

create or replace function private.can_access_storage_object(bucket_name text, object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage, auth
as $$
declare
  company_folder uuid;
begin
  if bucket_name not in ('business-documents', 'kyc-documents', 'profile-media', 'report-exports') then
    return false;
  end if;

  begin
    company_folder := (storage.foldername(object_name))[1]::uuid;
  exception when others then
    return false;
  end;

  return private.is_company_member(company_folder);
end;
$$;

create or replace function private.can_manage_storage_object(bucket_name text, object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage, auth
as $$
declare
  company_folder uuid;
begin
  if bucket_name not in ('business-documents', 'kyc-documents', 'profile-media', 'report-exports') then
    return false;
  end if;

  begin
    company_folder := (storage.foldername(object_name))[1]::uuid;
  exception when others then
    return false;
  end;

  return private.can_manage_company(company_folder);
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity, organization, roles, subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  phone text,
  full_name text not null default '',
  avatar_document_id uuid,
  language text not null default 'fr' check (language in ('fr', 'en', 'pcm')),
  timezone text not null default 'Africa/Douala',
  onboarding_completed boolean not null default false,
  biometric_enabled boolean not null default false,
  account_status text not null default 'active' check (account_status in ('active', 'locked', 'disabled')),
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  name text not null,
  legal_name text,
  description text,
  category text not null default 'Commerce',
  business_type text,
  registration_number text,
  tax_id text,
  phone text,
  email citext,
  address text,
  city text,
  country text not null default 'CM',
  currency text not null default 'XAF',
  tax_regime text,
  kyc_status public.kyc_status not null default 'pending',
  profile_photo_document_id uuid,
  banner_document_id uuid,
  status public.company_status not null default 'onboarding',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'operator',
  status public.membership_status not null default 'active',
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  fiscal_year_start_month int not null default 1 check (fiscal_year_start_month between 1 and 12),
  default_vat_rate numeric(5,2) not null default 19.25,
  reporting_currency text not null default 'XAF',
  invoice_prefix text not null default 'INV',
  receipt_ocr_enabled boolean not null default true,
  ai_assistant_enabled boolean not null default true,
  realtime_sync_enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  biometric_prompt_enabled boolean not null default true,
  dark_mode_enabled boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'trialing',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  seats int not null default 1 check (seats > 0),
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);

-- ---------------------------------------------------------------------------
-- Documents and storage metadata
-- ---------------------------------------------------------------------------

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null default auth.uid(),
  kind public.document_kind not null,
  bucket text not null,
  object_path text not null,
  file_name text,
  mime_type text,
  byte_size bigint,
  checksum text,
  public_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, object_path)
);

alter table public.profiles
  add constraint profiles_avatar_document_fk
  foreign key (avatar_document_id) references public.documents(id) on delete set null
  not valid;

alter table public.companies
  add constraint companies_profile_photo_document_fk
  foreign key (profile_photo_document_id) references public.documents(id) on delete set null
  not valid;

alter table public.companies
  add constraint companies_banner_document_fk
  foreign key (banner_document_id) references public.documents(id) on delete set null
  not valid;

-- ---------------------------------------------------------------------------
-- Accounting taxonomy, tags, and financial records
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  kind public.transaction_type not null,
  account_code text,
  color text,
  icon text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name, kind)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  color text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  type public.transaction_type not null,
  status public.transaction_status not null default 'completed',
  amount numeric(18,2) not null check (amount >= 0),
  signed_amount numeric(18,2) generated always as (
    case
      when type = 'income' then amount
      when type = 'expense' then -amount
      else 0
    end
  ) stored,
  currency text not null default 'XAF',
  description text not null,
  merchant_name text,
  payment_method text,
  reference_number text,
  ticket_number text,
  occurred_at timestamptz not null default now(),
  transaction_date date not null default current_date,
  tax_rate numeric(7,4) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  document_id uuid references public.documents(id) on delete set null,
  ocr_payload jsonb,
  metadata jsonb not null default '{}'::jsonb,
  reconciled_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transaction_id, tag_id)
);

create table if not exists public.accounting_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  entry_date date not null default current_date,
  account_code text not null,
  account_label text not null,
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  currency text not null default 'XAF',
  memo text,
  source text not null default 'transaction',
  metadata jsonb not null default '{}'::jsonb,
  posted_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_name text not null,
  customer_email citext,
  invoice_number text not null,
  status public.invoice_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(18,2) not null default 0,
  tax_total numeric(18,2) not null default 0,
  total numeric(18,2) not null default 0,
  amount_paid numeric(18,2) not null default 0,
  currency text not null default 'XAF',
  notes text,
  document_id uuid references public.documents(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, invoice_number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  description text not null,
  quantity numeric(18,2) not null default 1,
  unit_price numeric(18,2) not null default 0,
  tax_rate numeric(7,4) not null default 0,
  line_total numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reports, analytics, tax, loans
-- ---------------------------------------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type public.report_type not null,
  title text not null,
  period_start date not null,
  period_end date not null,
  status public.report_status not null default 'processing',
  payload jsonb not null default '{}'::jsonb,
  file_document_id uuid references public.documents(id) on delete set null,
  generated_by uuid references public.profiles(id) on delete set null default auth.uid(),
  generated_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tva_declarations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  collected_tax numeric(18,2) not null default 0,
  deductible_tax numeric(18,2) not null default 0,
  net_tax_due numeric(18,2) generated always as (greatest(collected_tax - deductible_tax, 0)) stored,
  status text not null default 'draft' check (status in ('draft', 'ready', 'submitted', 'accepted', 'rejected')),
  report_id uuid references public.reports(id) on delete set null,
  submitted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, period_start, period_end)
);

create table if not exists public.cash_flow_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  opening_balance numeric(18,2) not null default 0,
  inflows numeric(18,2) not null default 0,
  outflows numeric(18,2) not null default 0,
  net_cash_flow numeric(18,2) generated always as (inflows - outflows) stored,
  closing_balance numeric(18,2) generated always as (opening_balance + inflows - outflows) stored,
  generated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (company_id, period_start, period_end)
);

create table if not exists public.financial_analytics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  metric_key text not null,
  metric_label text not null,
  metric_value numeric(18,4),
  period_start date,
  period_end date,
  trend text check (trend in ('up', 'down', 'flat')),
  confidence numeric(5,2) check (confidence is null or confidence between 0 and 100),
  payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (company_id, metric_key, period_start, period_end)
);

create table if not exists public.loan_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null default auth.uid(),
  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'XAF',
  duration_months int not null check (duration_months > 0),
  purpose text not null,
  interest_rate numeric(7,4),
  processing_fee numeric(18,2) not null default 0,
  total_repayment numeric(18,2),
  approval_probability numeric(5,2),
  borrowing_strength_index numeric(5,2),
  status public.loan_status not null default 'submitted',
  expected_review_duration text,
  partner_reference text,
  timeline jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- KYC, notifications, AI, integrations, audit
-- ---------------------------------------------------------------------------

create table if not exists public.kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  submitted_by uuid references public.profiles(id) on delete set null default auth.uid(),
  status public.kyc_status not null default 'pending',
  current_step int not null default 0 check (current_step between 0 and 7),
  personal_info jsonb not null default '{}'::jsonb,
  business_info jsonb not null default '{}'::jsonb,
  address_info jsonb not null default '{}'::jsonb,
  review_notes text,
  reviewer_id uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kyc_verification_id uuid not null references public.kyc_verifications(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  kind public.document_kind not null,
  extracted_text text,
  extraction_payload jsonb not null default '{}'::jsonb,
  confidence numeric(5,2),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  status public.notification_status not null default 'unread',
  category text not null default 'system',
  action_url text,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (company_id is not null or user_id is not null)
);

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_id text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (token)
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  title text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null default auth.uid(),
  role public.ai_message_role not null,
  content text not null,
  quick_actions jsonb not null default '[]'::jsonb,
  model text,
  tokens_used int,
  latency_ms int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.banking_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,
  provider_connection_id text,
  status public.bank_connection_status not null default 'pending',
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.banking_connections(id) on delete cascade,
  provider_account_id text,
  account_name text not null,
  account_type text,
  currency text not null default 'XAF',
  masked_number text,
  current_balance numeric(18,2) not null default 0,
  available_balance numeric(18,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null default auth.uid(),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  old_record jsonb,
  new_record jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists companies_owner_idx on public.companies(owner_user_id);
create index if not exists memberships_user_idx on public.company_memberships(user_id, status);
create index if not exists memberships_company_role_idx on public.company_memberships(company_id, role, status);
create index if not exists documents_company_kind_idx on public.documents(company_id, kind, created_at desc);
create index if not exists transactions_company_date_idx on public.transactions(company_id, occurred_at desc) where deleted_at is null;
create index if not exists transactions_company_type_idx on public.transactions(company_id, type, status, occurred_at desc) where deleted_at is null;
create index if not exists transactions_search_idx on public.transactions using gin ((description || ' ' || coalesce(merchant_name, '') || ' ' || coalesce(reference_number, '')) gin_trgm_ops);
create unique index if not exists categories_system_unique_idx on public.categories(name, kind) where company_id is null and is_system;
create index if not exists accounting_entries_company_date_idx on public.accounting_entries(company_id, entry_date desc);
create index if not exists invoices_company_status_idx on public.invoices(company_id, status, due_date);
create index if not exists reports_company_type_period_idx on public.reports(company_id, type, period_start, period_end);
create index if not exists notifications_user_status_idx on public.notifications(user_id, status, created_at desc);
create index if not exists notifications_company_status_idx on public.notifications(company_id, status, created_at desc);
create index if not exists ai_messages_conversation_idx on public.ai_messages(conversation_id, created_at);
create index if not exists loan_requests_company_status_idx on public.loan_requests(company_id, status, submitted_at desc);
create index if not exists audit_logs_company_created_idx on public.audit_logs(company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'companies', 'company_memberships', 'company_settings', 'user_settings',
    'subscriptions', 'documents', 'categories', 'tags', 'transactions', 'accounting_entries',
    'invoices', 'reports', 'tva_declarations', 'loan_requests', 'kyc_verifications',
    'device_push_tokens', 'ai_conversations', 'banking_connections', 'bank_accounts'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()', table_name);
  end loop;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Accounting automation
-- ---------------------------------------------------------------------------

create or replace function private.create_accounting_entries_from_transaction()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  expense_code text;
  income_code text;
begin
  if new.status not in ('completed', 'reconciled') or new.deleted_at is not null then
    return new;
  end if;

  delete from public.accounting_entries where transaction_id = new.id;

  income_code := coalesce((select c.account_code from public.categories c where c.id = new.category_id), '701');
  expense_code := coalesce((select c.account_code from public.categories c where c.id = new.category_id), '607');

  if new.type = 'income' then
    insert into public.accounting_entries (company_id, transaction_id, entry_date, account_code, account_label, debit, credit, currency, memo, posted_by)
    values
      (new.company_id, new.id, new.transaction_date, '570', 'Cash and mobile money', new.amount, 0, new.currency, new.description, new.created_by),
      (new.company_id, new.id, new.transaction_date, income_code, 'Revenue', 0, new.amount, new.currency, new.description, new.created_by);
  elsif new.type = 'expense' then
    insert into public.accounting_entries (company_id, transaction_id, entry_date, account_code, account_label, debit, credit, currency, memo, posted_by)
    values
      (new.company_id, new.id, new.transaction_date, expense_code, 'Operating expense', new.amount, 0, new.currency, new.description, new.created_by),
      (new.company_id, new.id, new.transaction_date, '570', 'Cash and mobile money', 0, new.amount, new.currency, new.description, new.created_by);
  end if;

  return new;
end;
$$;

drop trigger if exists create_accounting_entries_after_transaction on public.transactions;
drop trigger if exists set_transaction_date_before_transaction on public.transactions;
create trigger set_transaction_date_before_transaction
  before insert or update of occurred_at
  on public.transactions
  for each row execute function private.set_transaction_date();

create trigger create_accounting_entries_after_transaction
  after insert or update of amount, type, status, category_id, deleted_at, occurred_at
  on public.transactions
  for each row execute function private.create_accounting_entries_from_transaction();

-- ---------------------------------------------------------------------------
-- Public API helper functions. These are security invoker, so RLS still applies.
-- ---------------------------------------------------------------------------

create or replace function public.create_company_with_owner(
  p_name text,
  p_category text default 'Commerce',
  p_country text default 'CM',
  p_currency text default 'XAF'
)
returns public.companies
language plpgsql
security invoker
set search_path = public, auth
as $$
declare
  created_company public.companies;
begin
  insert into public.companies (owner_user_id, created_by, name, category, country, currency, status)
  values (auth.uid(), auth.uid(), p_name, coalesce(p_category, 'Commerce'), coalesce(p_country, 'CM'), coalesce(p_currency, 'XAF'), 'active')
  returning * into created_company;

  insert into public.company_memberships (company_id, user_id, role, status, accepted_at)
  values (created_company.id, auth.uid(), 'owner', 'active', now())
  on conflict (company_id, user_id) do update
    set role = 'owner', status = 'active', accepted_at = now(), updated_at = now();

  insert into public.company_settings (company_id, updated_by)
  values (created_company.id, auth.uid())
  on conflict (company_id) do nothing;

  insert into public.subscriptions (company_id, tier, status, current_period_start, current_period_end)
  values (created_company.id, 'free', 'trialing', now(), now() + interval '14 days')
  on conflict (company_id) do nothing;

  return created_company;
end;
$$;

create or replace function public.dashboard_metrics(
  p_company_id uuid,
  p_period_start date default date_trunc('month', now())::date,
  p_period_end date default current_date
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with scoped_transactions as (
    select *
    from public.transactions t
    where t.company_id = p_company_id
      and t.deleted_at is null
      and t.status in ('completed', 'reconciled')
      and t.transaction_date between p_period_start and p_period_end
  ),
  totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0) as revenue,
      coalesce(sum(amount) filter (where type = 'expense'), 0) as expenses,
      coalesce(sum(tax_amount) filter (where type = 'income'), 0) as tax_collected,
      coalesce(sum(tax_amount) filter (where type = 'expense'), 0) as tax_deductible,
      count(*) as transaction_count
    from scoped_transactions
  )
  select jsonb_build_object(
    'companyId', p_company_id,
    'periodStart', p_period_start,
    'periodEnd', p_period_end,
    'revenue', revenue,
    'expenses', expenses,
    'profit', revenue - expenses,
    'profitMargin', case when revenue = 0 then 0 else round(((revenue - expenses) / revenue) * 100, 2) end,
    'taxCollected', tax_collected,
    'taxDeductible', tax_deductible,
    'taxDue', greatest(tax_collected - tax_deductible, 0),
    'transactionCount', transaction_count,
    'cashFlow', revenue - expenses,
    'healthScore', least(100, greatest(0, 58 + case when revenue > expenses then 22 else -12 end + least(transaction_count, 20)))
  )
  from totals
  where private.is_company_member(p_company_id);
$$;

create or replace function public.generate_report(
  p_company_id uuid,
  p_report_type public.report_type,
  p_period_start date,
  p_period_end date
)
returns public.reports
language plpgsql
security invoker
set search_path = public
as $$
declare
  metrics jsonb;
  title text;
  report_row public.reports;
begin
  metrics := public.dashboard_metrics(p_company_id, p_period_start, p_period_end);

  title := case p_report_type
    when 'bilan' then 'Bilan comptable'
    when 'resultat' then 'Compte de resultat'
    when 'cashflow' then 'Flux de tresorerie'
    when 'tva' then 'Declaration TVA'
    when 'loan_readiness' then 'Dossier eligibilite financement'
    else 'Synthese dashboard'
  end;

  insert into public.reports (
    company_id,
    type,
    title,
    period_start,
    period_end,
    status,
    payload,
    generated_by,
    generated_at
  )
  values (
    p_company_id,
    p_report_type,
    title,
    p_period_start,
    p_period_end,
    'ready',
    jsonb_build_object(
      'metrics', metrics,
      'bilan', jsonb_build_object(
        'assets', jsonb_build_object('cash', metrics->'cashFlow', 'receivables', 0, 'inventoryEstimate', 0),
        'liabilities', jsonb_build_object('taxDue', metrics->'taxDue', 'payables', 0),
        'equity', jsonb_build_object('retainedEarnings', metrics->'profit')
      ),
      'resultat', jsonb_build_object('revenue', metrics->'revenue', 'expenses', metrics->'expenses', 'netIncome', metrics->'profit'),
      'cashflow', jsonb_build_object('inflows', metrics->'revenue', 'outflows', metrics->'expenses', 'netCashFlow', metrics->'cashFlow'),
      'tva', jsonb_build_object('collected', metrics->'taxCollected', 'deductible', metrics->'taxDeductible', 'due', metrics->'taxDue')
    ),
    auth.uid(),
    now()
  )
  returning * into report_row;

  if p_report_type = 'tva' then
    insert into public.tva_declarations (company_id, period_start, period_end, collected_tax, deductible_tax, status, report_id)
    values (
      p_company_id,
      p_period_start,
      p_period_end,
      coalesce((metrics->>'taxCollected')::numeric, 0),
      coalesce((metrics->>'taxDeductible')::numeric, 0),
      'ready',
      report_row.id
    )
    on conflict (company_id, period_start, period_end) do update
      set collected_tax = excluded.collected_tax,
          deductible_tax = excluded.deductible_tax,
          status = 'ready',
          report_id = excluded.report_id,
          updated_at = now();
  end if;

  return report_row;
end;
$$;

create or replace function public.loan_timeline(initial_status public.loan_status default 'submitted')
returns jsonb
language sql
immutable
as $$
  select jsonb_build_array(
    jsonb_build_object('stage', 'submitted', 'label', 'Submitted', 'status', case when initial_status in ('submitted','under_review','risk_assessment','pending_documents','approved','rejected','disbursed') then 'complete' else 'pending' end),
    jsonb_build_object('stage', 'under_review', 'label', 'Under Review', 'status', case when initial_status in ('under_review','risk_assessment','pending_documents','approved','rejected','disbursed') then 'active' else 'pending' end),
    jsonb_build_object('stage', 'risk_assessment', 'label', 'Risk Assessment', 'status', 'pending'),
    jsonb_build_object('stage', 'pending_documents', 'label', 'Pending Documents', 'status', 'pending'),
    jsonb_build_object('stage', 'approved', 'label', 'Approved', 'status', 'pending'),
    jsonb_build_object('stage', 'disbursed', 'label', 'Disbursed', 'status', 'pending')
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;

grant execute on function public.create_company_with_owner(text, text, text, text) to authenticated;
grant execute on function public.dashboard_metrics(uuid, date, date) to authenticated;
grant execute on function public.generate_report(uuid, public.report_type, date, date) to authenticated;
grant execute on function public.loan_timeline(public.loan_status) to authenticated;
grant execute on function private.is_company_member(uuid) to authenticated;
grant execute on function private.has_company_role(uuid, public.member_role[]) to authenticated;
grant execute on function private.can_manage_company(uuid) to authenticated;
grant execute on function private.can_manage_accounting(uuid) to authenticated;
grant execute on function private.can_bootstrap_owner_membership(uuid, uuid, public.member_role) to authenticated;
grant execute on function private.can_access_storage_object(text, text) to authenticated;
grant execute on function private.can_manage_storage_object(text, text) to authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_settings enable row level security;
alter table public.user_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.documents enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_tags enable row level security;
alter table public.accounting_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.reports enable row level security;
alter table public.tva_declarations enable row level security;
alter table public.cash_flow_snapshots enable row level security;
alter table public.financial_analytics enable row level security;
alter table public.loan_requests enable row level security;
alter table public.kyc_verifications enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.notifications enable row level security;
alter table public.device_push_tokens enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.banking_connections enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_self" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_self" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "companies_select_member" on public.companies for select using (private.is_company_member(id));
create policy "companies_insert_creator" on public.companies for insert with check (owner_user_id = auth.uid() and created_by = auth.uid());
create policy "companies_update_manager" on public.companies for update using (private.can_manage_company(id)) with check (private.can_manage_company(id));
create policy "companies_delete_owner" on public.companies for delete using (private.has_company_role(id, array['owner']::public.member_role[]));

create policy "memberships_select_company_member" on public.company_memberships for select using (private.is_company_member(company_id) or user_id = auth.uid());
create policy "memberships_insert_owner_bootstrap_or_manager" on public.company_memberships
  for insert with check (
    private.can_manage_company(company_id)
    or private.can_bootstrap_owner_membership(company_id, user_id, role)
  );
create policy "memberships_update_manager" on public.company_memberships for update using (private.can_manage_company(company_id)) with check (private.can_manage_company(company_id));
create policy "memberships_delete_owner" on public.company_memberships for delete using (private.has_company_role(company_id, array['owner']::public.member_role[]));

create policy "company_settings_select_member" on public.company_settings for select using (private.is_company_member(company_id));
create policy "company_settings_write_manager" on public.company_settings for all using (private.can_manage_company(company_id)) with check (private.can_manage_company(company_id));

create policy "user_settings_self" on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "subscriptions_select_member" on public.subscriptions for select using (private.is_company_member(company_id));
create policy "subscriptions_write_manager" on public.subscriptions for all using (private.can_manage_company(company_id)) with check (private.can_manage_company(company_id));

create policy "documents_select_member" on public.documents for select using (private.is_company_member(company_id));
create policy "documents_insert_member" on public.documents for insert with check (private.is_company_member(company_id));
create policy "documents_update_member" on public.documents for update using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));
create policy "documents_delete_manager" on public.documents for delete using (private.can_manage_company(company_id));

create policy "categories_select_system_or_member" on public.categories for select using (company_id is null or private.is_company_member(company_id));
create policy "categories_insert_member" on public.categories for insert with check (company_id is not null and private.is_company_member(company_id));
create policy "categories_update_member" on public.categories for update using (company_id is not null and private.is_company_member(company_id)) with check (company_id is not null and private.is_company_member(company_id));
create policy "categories_delete_manager" on public.categories for delete using (company_id is not null and private.can_manage_company(company_id));

create policy "tags_member_all" on public.tags for all using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));

create policy "transactions_member_select" on public.transactions for select using (private.is_company_member(company_id));
create policy "transactions_member_insert" on public.transactions for insert with check (private.is_company_member(company_id));
create policy "transactions_member_update" on public.transactions for update using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));
create policy "transactions_accounting_delete" on public.transactions for delete using (private.can_manage_accounting(company_id));

create policy "transaction_tags_member_all" on public.transaction_tags for all using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));
create policy "accounting_entries_accounting_select" on public.accounting_entries for select using (private.is_company_member(company_id));
create policy "accounting_entries_accounting_write" on public.accounting_entries for all using (private.can_manage_accounting(company_id)) with check (private.can_manage_accounting(company_id));

create policy "invoices_member_all" on public.invoices for all using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));
create policy "invoice_items_member_all" on public.invoice_items for all using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));

create policy "reports_member_select" on public.reports for select using (private.is_company_member(company_id));
create policy "reports_member_insert" on public.reports for insert with check (private.is_company_member(company_id));
create policy "reports_member_update" on public.reports for update using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));
create policy "reports_manager_delete" on public.reports for delete using (private.can_manage_accounting(company_id));

create policy "tva_member_all" on public.tva_declarations for all using (private.can_manage_accounting(company_id)) with check (private.can_manage_accounting(company_id));
create policy "cashflow_member_select" on public.cash_flow_snapshots for select using (private.is_company_member(company_id));
create policy "cashflow_accounting_write" on public.cash_flow_snapshots for all using (private.can_manage_accounting(company_id)) with check (private.can_manage_accounting(company_id));
create policy "analytics_member_select" on public.financial_analytics for select using (private.is_company_member(company_id));
create policy "analytics_accounting_write" on public.financial_analytics for all using (private.can_manage_accounting(company_id)) with check (private.can_manage_accounting(company_id));

create policy "loan_requests_member_all" on public.loan_requests for all using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));
create policy "kyc_verifications_member_all" on public.kyc_verifications for all using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));
create policy "kyc_documents_member_all" on public.kyc_documents for all using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));

create policy "notifications_select_target" on public.notifications for select using ((user_id = auth.uid()) or (company_id is not null and private.is_company_member(company_id)));
create policy "notifications_insert_member" on public.notifications for insert with check ((user_id = auth.uid()) or (company_id is not null and private.is_company_member(company_id)));
create policy "notifications_update_target" on public.notifications for update using ((user_id = auth.uid()) or (company_id is not null and private.is_company_member(company_id))) with check ((user_id = auth.uid()) or (company_id is not null and private.is_company_member(company_id)));
create policy "notifications_delete_manager" on public.notifications for delete using (company_id is not null and private.can_manage_company(company_id));

create policy "device_tokens_self_all" on public.device_push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_conversations_member_all" on public.ai_conversations for all using (user_id = auth.uid() and private.is_company_member(company_id)) with check (user_id = auth.uid() and private.is_company_member(company_id));
create policy "ai_messages_member_all" on public.ai_messages for all using (private.is_company_member(company_id)) with check (private.is_company_member(company_id));

create policy "banking_connections_member_select" on public.banking_connections for select using (private.is_company_member(company_id));
create policy "banking_connections_manager_write" on public.banking_connections for all using (private.can_manage_company(company_id)) with check (private.can_manage_company(company_id));
create policy "bank_accounts_member_select" on public.bank_accounts for select using (private.is_company_member(company_id));
create policy "bank_accounts_manager_write" on public.bank_accounts for all using (private.can_manage_company(company_id)) with check (private.can_manage_company(company_id));

create policy "audit_logs_accounting_select" on public.audit_logs for select using (company_id is not null and private.can_manage_accounting(company_id));
create policy "audit_logs_insert_member" on public.audit_logs for insert with check (company_id is null or private.is_company_member(company_id));

-- ---------------------------------------------------------------------------
-- Storage buckets and object policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('business-documents', 'business-documents', false, 26214400, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/csv']),
  ('kyc-documents', 'kyc-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('profile-media', 'profile-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('report-exports', 'report-exports', false, 52428800, array['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "formalio_storage_select_company_member" on storage.objects
  for select using (private.can_access_storage_object(bucket_id, name));
create policy "formalio_storage_insert_company_member" on storage.objects
  for insert with check (private.can_access_storage_object(bucket_id, name));
create policy "formalio_storage_update_company_member" on storage.objects
  for update using (private.can_access_storage_object(bucket_id, name)) with check (private.can_access_storage_object(bucket_id, name));
create policy "formalio_storage_delete_company_manager" on storage.objects
  for delete using (private.can_manage_storage_object(bucket_id, name));

-- ---------------------------------------------------------------------------
-- Realtime publication. Supabase owns the publication; add tables idempotently.
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.transactions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.loan_requests;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ai_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Initial system categories aligned with current frontend labels.
-- ---------------------------------------------------------------------------

insert into public.categories (company_id, name, kind, account_code, color, icon, is_system)
values
  (null, 'Ventes', 'income', '701', '#10b981', 'TrendingUp', true),
  (null, 'Services', 'income', '706', '#059669', 'Briefcase', true),
  (null, 'Locations', 'income', '708', '#2563eb', 'Home', true),
  (null, 'Apports', 'income', '101', '#f59e0b', 'Wallet', true),
  (null, 'Achats', 'expense', '607', '#ef4444', 'Package', true),
  (null, 'Transport', 'expense', '624', '#f97316', 'Truck', true),
  (null, 'Loyer', 'expense', '613', '#a855f7', 'Home', true),
  (null, 'Salaires', 'expense', '641', '#3b82f6', 'Users', true),
  (null, 'Taxes', 'expense', '445', '#b45309', 'Calculator', true),
  (null, 'Autres', 'expense', '658', '#64748b', 'Receipt', true)
on conflict do nothing;

commit;
