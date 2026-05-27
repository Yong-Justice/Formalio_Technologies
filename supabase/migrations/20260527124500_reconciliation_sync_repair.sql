alter table if exists public.transactions
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists category text,
  add column if not exists subcategory text,
  add column if not exists entry_method text,
  add column if not exists recorded_at timestamptz,
  add column if not exists synced_at timestamptz,
  add column if not exists is_synced boolean not null default false,
  add column if not exists sync_status text not null default 'pending',
  add column if not exists version bigint not null default 1,
  add column if not exists last_modified_device_id text;

do $$
begin
  if exists (select 1 from pg_type where typname = 'transaction_type') then
    alter type public.transaction_type add value if not exists 'retrait';
    alter type public.transaction_type add value if not exists 'fiche_reconciliation';
  end if;
end $$;

create table if not exists public.fiches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  fiche_type text,
  period_type text,
  date_debut text,
  date_fin text,
  stock_items_json text,
  service_items_json text,
  expenses_json text,
  revenus_theoriques numeric,
  total_depenses numeric,
  caisse_attendue numeric,
  caisse_reelle numeric,
  ecart numeric,
  ecart_percentage numeric,
  ecart_level text,
  ecart_justification text,
  ecart_category text,
  status text default 'completed',
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  synced_at timestamptz,
  deleted_at timestamptz,
  version bigint not null default 1,
  last_modified_device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.versements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references auth.users(id) not null,
  montant numeric not null,
  destination text,
  destination_label text,
  description text,
  versement_date text,
  versement_time text,
  is_synced boolean not null default false,
  sync_status text not null default 'pending',
  synced_at timestamptz,
  deleted_at timestamptz,
  version bigint not null default 1,
  last_modified_device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_category_idx on public.transactions(category);
create index if not exists fiches_user_id_idx on public.fiches(user_id);
create index if not exists fiches_company_id_idx on public.fiches(company_id);
create index if not exists fiches_updated_at_idx on public.fiches(updated_at);
create index if not exists fiches_sync_status_idx on public.fiches(sync_status);
create index if not exists fiches_deleted_at_idx on public.fiches(deleted_at);
create index if not exists fiches_date_debut_idx on public.fiches(date_debut);
create index if not exists fiches_status_idx on public.fiches(status);
create index if not exists versements_user_id_idx on public.versements(user_id);
create index if not exists versements_company_id_idx on public.versements(company_id);
create index if not exists versements_updated_at_idx on public.versements(updated_at);
create index if not exists versements_sync_status_idx on public.versements(sync_status);
create index if not exists versements_deleted_at_idx on public.versements(deleted_at);
create index if not exists versements_destination_idx on public.versements(destination);
create index if not exists versements_versement_date_idx on public.versements(versement_date);

alter table public.fiches enable row level security;
alter table public.versements enable row level security;

drop policy if exists fiches_select_own on public.fiches;
drop policy if exists fiches_insert_own on public.fiches;
drop policy if exists fiches_update_own on public.fiches;
drop policy if exists fiches_delete_own on public.fiches;
create policy fiches_select_own on public.fiches for select to authenticated using (auth.uid() = user_id);
create policy fiches_insert_own on public.fiches for insert to authenticated with check (auth.uid() = user_id);
create policy fiches_update_own on public.fiches for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fiches_delete_own on public.fiches for delete to authenticated using (auth.uid() = user_id);

drop policy if exists versements_select_own on public.versements;
drop policy if exists versements_insert_own on public.versements;
drop policy if exists versements_update_own on public.versements;
drop policy if exists versements_delete_own on public.versements;
create policy versements_select_own on public.versements for select to authenticated using (auth.uid() = user_id);
create policy versements_insert_own on public.versements for insert to authenticated with check (auth.uid() = user_id);
create policy versements_update_own on public.versements for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy versements_delete_own on public.versements for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.treasury_records to authenticated;
grant select, insert, update, delete on public.fiches to authenticated;
grant select, insert, update, delete on public.versements to authenticated;

notify pgrst, 'reload schema';
