create schema if not exists private;

create or replace function private.formalio_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.formalio_record_visible(record_user_id uuid, record_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    auth.uid() = record_user_id
    or (
      record_company_id is not null
      and exists (
        select 1
        from public.company_memberships cm
        where cm.company_id = record_company_id
          and cm.user_id = auth.uid()
          and coalesce(cm.status, 'active') = 'active'
      )
    );
$$;

create or replace function private.formalio_ensure_sync_columns(p_table_name text)
returns void
language plpgsql
as $$
begin
  execute format('alter table public.%I add column if not exists company_id uuid references public.companies(id) on delete set null', p_table_name);
  execute format('alter table public.%I add column if not exists user_id uuid references auth.users(id)', p_table_name);
  execute format('alter table public.%I add column if not exists is_synced boolean not null default false', p_table_name);
  execute format('alter table public.%I add column if not exists sync_status text not null default %L', p_table_name, 'pending');
  execute format('alter table public.%I add column if not exists synced_at timestamptz', p_table_name);
  execute format('alter table public.%I add column if not exists deleted_at timestamptz', p_table_name);
  execute format('alter table public.%I add column if not exists version bigint not null default 1', p_table_name);
  execute format('alter table public.%I add column if not exists last_modified_device_id text', p_table_name);
  execute format('alter table public.%I add column if not exists created_at timestamptz not null default now()', p_table_name);
  execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', p_table_name);
end;
$$;

create or replace function private.formalio_apply_sync_indexes(p_table_name text)
returns void
language plpgsql
as $$
begin
  execute format('create index if not exists %I on public.%I(user_id)', p_table_name || '_user_id_idx', p_table_name);
  execute format('create index if not exists %I on public.%I(company_id)', p_table_name || '_company_id_idx', p_table_name);
  execute format('create index if not exists %I on public.%I(updated_at)', p_table_name || '_updated_at_idx', p_table_name);
  execute format('create index if not exists %I on public.%I(sync_status)', p_table_name || '_sync_status_idx', p_table_name);
  execute format('create index if not exists %I on public.%I(deleted_at)', p_table_name || '_deleted_at_idx', p_table_name);
end;
$$;

create or replace function private.formalio_apply_rls(p_table_name text)
returns void
language plpgsql
as $$
begin
  execute format('alter table public.%I enable row level security', p_table_name);

  execute format('drop policy if exists %I on public.%I', 'formalio_select_own_or_company', p_table_name);
  execute format(
    'create policy %I on public.%I for select to authenticated using (private.formalio_record_visible(user_id, company_id))',
    'formalio_select_own_or_company',
    p_table_name
  );

  execute format('drop policy if exists %I on public.%I', 'formalio_insert_own_or_company', p_table_name);
  execute format(
    'create policy %I on public.%I for insert to authenticated with check (private.formalio_record_visible(user_id, company_id))',
    'formalio_insert_own_or_company',
    p_table_name
  );

  execute format('drop policy if exists %I on public.%I', 'formalio_update_own_or_company', p_table_name);
  execute format(
    'create policy %I on public.%I for update to authenticated using (private.formalio_record_visible(user_id, company_id)) with check (private.formalio_record_visible(user_id, company_id))',
    'formalio_update_own_or_company',
    p_table_name
  );

  execute format('drop policy if exists %I on public.%I', 'formalio_delete_own_or_company', p_table_name);
  execute format(
    'create policy %I on public.%I for delete to authenticated using (private.formalio_record_visible(user_id, company_id))',
    'formalio_delete_own_or_company',
    p_table_name
  );

  execute format('grant select, insert, update, delete on public.%I to authenticated', p_table_name);
end;
$$;

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  business_name text,
  owner_name text,
  business_type text,
  sector text,
  city text,
  quarter text,
  phone_number text,
  mtn_momo_number text,
  orange_money_number text,
  tax_regime text,
  tax_id text,
  rccm_number text,
  preferred_language text,
  subscription_plan text default 'free',
  subscription_expires_at timestamptz,
  onboarding_completed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id),
  type text not null,
  amount numeric not null,
  payment_method text,
  syscohada_code text,
  syscohada_label text,
  category text,
  subcategory text,
  description text,
  voice_input_original text,
  entry_method text,
  stock_item_id uuid,
  quantity numeric,
  unit_price numeric,
  customer_phone text,
  supplier_name text,
  momo_sms_id uuid,
  momo_reference text,
  momo_verified boolean default false,
  receipt_image_path text,
  is_pending_payment boolean default false,
  is_deleted boolean default false,
  recorded_at timestamptz,
  transaction_date date default current_date,
  occurred_at timestamptz default now(),
  status text default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id),
  name text not null,
  barcode text,
  category text,
  unit text,
  current_quantity numeric default 0,
  minimum_alert_quantity numeric,
  purchase_price_per_unit numeric,
  selling_price_per_unit numeric,
  total_stock_value numeric,
  margin_percentage numeric,
  total_units_sold_all_time numeric,
  total_revenue_generated numeric,
  days_since_last_sale numeric,
  average_daily_sales numeric,
  days_of_stock_remaining numeric,
  is_dead_stock boolean default false,
  supplier_name text,
  supplier_phone text,
  image_path text,
  notes text,
  is_active boolean default true,
  last_sold_at timestamptz,
  last_restocked_at timestamptz,
  quantity numeric not null default 0,
  price_type text not null default 'fixed',
  unit_price numeric,
  min_price numeric,
  max_price numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  stock_item_id uuid,
  movement_type text,
  quantity_before numeric,
  quantity_changed numeric,
  quantity_after numeric,
  unit_price_at_time numeric,
  transaction_id uuid,
  notes text,
  moved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.treasury_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  record_date timestamptz,
  opening_cash numeric default 0,
  closing_cash numeric default 0,
  mtn_momo_balance numeric default 0,
  orange_money_balance numeric default 0,
  bank_balance numeric default 0,
  total_liquid_assets numeric default 0,
  total_stock_value numeric default 0,
  total_net_worth numeric default 0,
  daily_revenue numeric default 0,
  daily_expenses numeric default 0,
  daily_profit numeric default 0,
  accounts_receivable numeric default 0,
  accounts_payable numeric default 0,
  is_manually_adjusted boolean default false,
  adjustment_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.momo_sms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  sender_id text,
  sender_type text,
  full_body text,
  parsed_amount numeric,
  direction text,
  momo_operator text,
  momo_reference text,
  balance_after numeric,
  counterpart_number text,
  review_status text default 'pending',
  matched_transaction_id uuid,
  is_known_personal_contact boolean default false,
  is_known_customer boolean default false,
  is_telecom_service boolean default false,
  received_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.contact_classifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  phone_number text,
  contact_name text,
  classification text,
  times_classified integer default 0,
  last_transaction_type text,
  auto_classify boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.mosika_scores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  total_score numeric not null,
  previous_score numeric,
  score_change numeric,
  pillar_regularite numeric,
  pillar_revenus numeric,
  pillar_gestion numeric,
  pillar_stock numeric,
  pillar_anciennete numeric,
  pillar_paiement numeric,
  sub_score_frequence numeric,
  sub_score_continuite numeric,
  sub_score_revenu_absolu numeric,
  sub_score_tendance numeric,
  sub_score_stabilite numeric,
  sub_score_ratio_depenses numeric,
  sub_score_tresorerie numeric,
  sub_score_rotation_stock numeric,
  sub_score_stock_mort numeric,
  sub_score_momo numeric,
  sub_score_remboursement numeric,
  hard_penalties_applied numeric,
  loan_eligible boolean default false,
  max_loan_amount numeric,
  min_loan_amount numeric,
  improvement_tips jsonb not null default '[]'::jsonb,
  calculated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.loan_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id),
  amount_requested numeric,
  amount_approved numeric,
  amount numeric,
  duration_months integer,
  purpose text,
  purpose_detail text,
  mfi_id text,
  mfi_name text,
  mfi_contact_name text,
  interest_rate_monthly numeric,
  interest_rate numeric,
  processing_fee numeric,
  monthly_repayment numeric,
  total_repayment numeric,
  approval_probability numeric,
  borrowing_strength_index numeric,
  mosika_score_at_apply numeric,
  mosika_score_at_application numeric,
  status text default 'submitted',
  rejection_reason text,
  disbursement_method text,
  disbursed_at timestamptz,
  repayment_start_date timestamptz,
  submitted_at timestamptz,
  decision_at timestamptz,
  expected_review_duration text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.loan_repayments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  loan_request_id uuid,
  installment_number integer,
  amount_due numeric,
  amount_paid numeric,
  due_date timestamptz,
  paid_date timestamptz,
  status text default 'upcoming',
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.tax_obligations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  tax_type text,
  period text,
  amount_calculated numeric,
  amount_paid numeric,
  due_date timestamptz,
  paid_date timestamptz,
  status text default 'calculated',
  dgi_form_generated boolean default false,
  form_file_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  session_id text,
  role text,
  content text,
  context_type text,
  tokens_used integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

create table if not exists public.generated_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  report_type text,
  period_start timestamptz,
  period_end timestamptz,
  file_path text,
  file_size_bytes bigint,
  generated_at timestamptz,
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  version bigint not null default 1,
  last_modified_device_id text
);

select private.formalio_ensure_sync_columns(table_name)
from (values
  ('business_profiles'),
  ('transactions'),
  ('stock_items'),
  ('stock_movements'),
  ('treasury_records'),
  ('momo_sms'),
  ('contact_classifications'),
  ('mosika_scores'),
  ('loan_requests'),
  ('loan_repayments'),
  ('tax_obligations'),
  ('ai_conversations'),
  ('generated_reports')
) as tables(table_name);

alter table public.business_profiles
  add column if not exists business_name text,
  add column if not exists owner_name text,
  add column if not exists business_type text,
  add column if not exists sector text,
  add column if not exists city text,
  add column if not exists quarter text,
  add column if not exists phone_number text,
  add column if not exists mtn_momo_number text,
  add column if not exists orange_money_number text,
  add column if not exists tax_regime text,
  add column if not exists tax_id text,
  add column if not exists rccm_number text,
  add column if not exists preferred_language text,
  add column if not exists subscription_plan text default 'free',
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists onboarding_completed boolean default false;

alter table public.transactions
  add column if not exists payment_method text,
  add column if not exists syscohada_code text,
  add column if not exists syscohada_label text,
  add column if not exists category text,
  add column if not exists subcategory text,
  add column if not exists voice_input_original text,
  add column if not exists entry_method text,
  add column if not exists stock_item_id uuid,
  add column if not exists quantity numeric,
  add column if not exists unit_price numeric,
  add column if not exists customer_phone text,
  add column if not exists supplier_name text,
  add column if not exists momo_sms_id uuid,
  add column if not exists momo_reference text,
  add column if not exists momo_verified boolean default false,
  add column if not exists receipt_image_path text,
  add column if not exists is_pending_payment boolean default false,
  add column if not exists is_deleted boolean default false,
  add column if not exists recorded_at timestamptz,
  add column if not exists transaction_date date default current_date,
  add column if not exists occurred_at timestamptz default now(),
  add column if not exists status text default 'completed',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.stock_items
  add column if not exists barcode text,
  add column if not exists category text,
  add column if not exists unit text,
  add column if not exists current_quantity numeric default 0,
  add column if not exists minimum_alert_quantity numeric,
  add column if not exists purchase_price_per_unit numeric,
  add column if not exists selling_price_per_unit numeric,
  add column if not exists total_stock_value numeric,
  add column if not exists margin_percentage numeric,
  add column if not exists total_units_sold_all_time numeric,
  add column if not exists total_revenue_generated numeric,
  add column if not exists days_since_last_sale numeric,
  add column if not exists average_daily_sales numeric,
  add column if not exists days_of_stock_remaining numeric,
  add column if not exists is_dead_stock boolean default false,
  add column if not exists supplier_name text,
  add column if not exists supplier_phone text,
  add column if not exists image_path text,
  add column if not exists notes text,
  add column if not exists is_active boolean default true,
  add column if not exists last_sold_at timestamptz,
  add column if not exists last_restocked_at timestamptz,
  add column if not exists quantity numeric not null default 0,
  add column if not exists price_type text not null default 'fixed',
  add column if not exists unit_price numeric,
  add column if not exists min_price numeric,
  add column if not exists max_price numeric,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.stock_movements
  add column if not exists stock_item_id uuid,
  add column if not exists movement_type text,
  add column if not exists quantity_before numeric,
  add column if not exists quantity_changed numeric,
  add column if not exists quantity_after numeric,
  add column if not exists unit_price_at_time numeric,
  add column if not exists transaction_id uuid,
  add column if not exists notes text,
  add column if not exists moved_at timestamptz;

alter table public.treasury_records
  add column if not exists record_date timestamptz,
  add column if not exists opening_cash numeric default 0,
  add column if not exists closing_cash numeric default 0,
  add column if not exists mtn_momo_balance numeric default 0,
  add column if not exists orange_money_balance numeric default 0,
  add column if not exists bank_balance numeric default 0,
  add column if not exists total_liquid_assets numeric default 0,
  add column if not exists total_stock_value numeric default 0,
  add column if not exists total_net_worth numeric default 0,
  add column if not exists daily_revenue numeric default 0,
  add column if not exists daily_expenses numeric default 0,
  add column if not exists daily_profit numeric default 0,
  add column if not exists accounts_receivable numeric default 0,
  add column if not exists accounts_payable numeric default 0,
  add column if not exists is_manually_adjusted boolean default false,
  add column if not exists adjustment_notes text;

alter table public.momo_sms
  add column if not exists sender_id text,
  add column if not exists sender_type text,
  add column if not exists full_body text,
  add column if not exists parsed_amount numeric,
  add column if not exists direction text,
  add column if not exists momo_operator text,
  add column if not exists momo_reference text,
  add column if not exists balance_after numeric,
  add column if not exists counterpart_number text,
  add column if not exists review_status text default 'pending',
  add column if not exists matched_transaction_id uuid,
  add column if not exists is_known_personal_contact boolean default false,
  add column if not exists is_known_customer boolean default false,
  add column if not exists is_telecom_service boolean default false,
  add column if not exists received_at timestamptz,
  add column if not exists reviewed_at timestamptz;

alter table public.contact_classifications
  add column if not exists phone_number text,
  add column if not exists contact_name text,
  add column if not exists classification text,
  add column if not exists times_classified integer default 0,
  add column if not exists last_transaction_type text,
  add column if not exists auto_classify boolean default false,
  add column if not exists notes text;

alter table public.mosika_scores
  add column if not exists total_score numeric,
  add column if not exists previous_score numeric,
  add column if not exists score_change numeric,
  add column if not exists pillar_regularite numeric,
  add column if not exists pillar_revenus numeric,
  add column if not exists pillar_gestion numeric,
  add column if not exists pillar_stock numeric,
  add column if not exists pillar_anciennete numeric,
  add column if not exists pillar_paiement numeric,
  add column if not exists sub_score_frequence numeric,
  add column if not exists sub_score_continuite numeric,
  add column if not exists sub_score_revenu_absolu numeric,
  add column if not exists sub_score_tendance numeric,
  add column if not exists sub_score_stabilite numeric,
  add column if not exists sub_score_ratio_depenses numeric,
  add column if not exists sub_score_tresorerie numeric,
  add column if not exists sub_score_rotation_stock numeric,
  add column if not exists sub_score_stock_mort numeric,
  add column if not exists sub_score_momo numeric,
  add column if not exists sub_score_remboursement numeric,
  add column if not exists hard_penalties_applied numeric,
  add column if not exists loan_eligible boolean default false,
  add column if not exists max_loan_amount numeric,
  add column if not exists min_loan_amount numeric,
  add column if not exists improvement_tips jsonb not null default '[]'::jsonb,
  add column if not exists calculated_at timestamptz;

alter table public.loan_requests
  add column if not exists amount_requested numeric,
  add column if not exists amount_approved numeric,
  add column if not exists amount numeric,
  add column if not exists duration_months integer,
  add column if not exists purpose text,
  add column if not exists purpose_detail text,
  add column if not exists mfi_id text,
  add column if not exists mfi_name text,
  add column if not exists mfi_contact_name text,
  add column if not exists interest_rate_monthly numeric,
  add column if not exists interest_rate numeric,
  add column if not exists processing_fee numeric,
  add column if not exists monthly_repayment numeric,
  add column if not exists total_repayment numeric,
  add column if not exists approval_probability numeric,
  add column if not exists borrowing_strength_index numeric,
  add column if not exists mosika_score_at_apply numeric,
  add column if not exists mosika_score_at_application numeric,
  add column if not exists status text default 'submitted',
  add column if not exists rejection_reason text,
  add column if not exists disbursement_method text,
  add column if not exists disbursed_at timestamptz,
  add column if not exists repayment_start_date timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists decision_at timestamptz,
  add column if not exists expected_review_duration text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.loan_repayments
  add column if not exists loan_request_id uuid,
  add column if not exists installment_number integer,
  add column if not exists amount_due numeric,
  add column if not exists amount_paid numeric,
  add column if not exists due_date timestamptz,
  add column if not exists paid_date timestamptz,
  add column if not exists status text default 'upcoming',
  add column if not exists payment_method text,
  add column if not exists notes text;

alter table public.tax_obligations
  add column if not exists tax_type text,
  add column if not exists period text,
  add column if not exists amount_calculated numeric,
  add column if not exists amount_paid numeric,
  add column if not exists due_date timestamptz,
  add column if not exists paid_date timestamptz,
  add column if not exists status text default 'calculated',
  add column if not exists dgi_form_generated boolean default false,
  add column if not exists form_file_path text,
  add column if not exists notes text;

alter table public.ai_conversations
  add column if not exists session_id text,
  add column if not exists role text,
  add column if not exists content text,
  add column if not exists context_type text,
  add column if not exists tokens_used integer;

alter table public.generated_reports
  add column if not exists report_type text,
  add column if not exists period_start timestamptz,
  add column if not exists period_end timestamptz,
  add column if not exists file_path text,
  add column if not exists file_size_bytes bigint,
  add column if not exists generated_at timestamptz,
  add column if not exists shared_at timestamptz;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'business_profiles',
    'transactions',
    'stock_items',
    'stock_movements',
    'treasury_records',
    'momo_sms',
    'contact_classifications',
    'mosika_scores',
    'loan_requests',
    'loan_repayments',
    'tax_obligations',
    'ai_conversations',
    'generated_reports'
  ]
  loop
    perform private.formalio_apply_sync_indexes(table_name);
    perform private.formalio_apply_rls(table_name);
    execute format('drop trigger if exists %I on public.%I', 'formalio_set_updated_at', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.formalio_set_updated_at()',
      'formalio_set_updated_at',
      table_name
    );
  end loop;
end $$;

create index if not exists business_profiles_phone_number_idx on public.business_profiles(phone_number);
create index if not exists transactions_recorded_at_idx on public.transactions(recorded_at);
create index if not exists transactions_stock_item_id_idx on public.transactions(stock_item_id);
create index if not exists transactions_momo_sms_id_idx on public.transactions(momo_sms_id);
create index if not exists stock_items_name_idx on public.stock_items(lower(name));
create index if not exists stock_movements_stock_item_id_idx on public.stock_movements(stock_item_id);
create index if not exists stock_movements_transaction_id_idx on public.stock_movements(transaction_id);
create index if not exists treasury_records_record_date_idx on public.treasury_records(record_date);
create index if not exists momo_sms_reference_idx on public.momo_sms(momo_reference);
create index if not exists momo_sms_review_status_idx on public.momo_sms(review_status);
create index if not exists contact_classifications_phone_number_idx on public.contact_classifications(phone_number);
create index if not exists mosika_scores_calculated_at_idx on public.mosika_scores(calculated_at);
create index if not exists loan_requests_status_idx on public.loan_requests(status);
create index if not exists loan_repayments_loan_request_id_idx on public.loan_repayments(loan_request_id);
create index if not exists tax_obligations_due_date_idx on public.tax_obligations(due_date);
create index if not exists ai_conversations_session_id_idx on public.ai_conversations(session_id);
create index if not exists generated_reports_report_type_idx on public.generated_reports(report_type);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.transactions; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.stock_items; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.loan_requests; exception when duplicate_object then null; end;
  end if;
end $$;
