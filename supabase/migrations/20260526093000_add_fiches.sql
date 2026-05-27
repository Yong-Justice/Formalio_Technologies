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

create index if not exists fiches_user_id_idx on public.fiches(user_id);
create index if not exists fiches_company_id_idx on public.fiches(company_id);
create index if not exists fiches_updated_at_idx on public.fiches(updated_at);
create index if not exists fiches_sync_status_idx on public.fiches(sync_status);
create index if not exists fiches_deleted_at_idx on public.fiches(deleted_at);
create index if not exists fiches_date_debut_idx on public.fiches(date_debut);
create index if not exists fiches_status_idx on public.fiches(status);

grant select, insert, update, delete on public.fiches to authenticated;

do $$
begin
  perform private.formalio_apply_sync_indexes('fiches');
  perform private.formalio_apply_rls('fiches');

  execute 'drop trigger if exists formalio_set_updated_at on public.fiches';
  execute 'create trigger formalio_set_updated_at before update on public.fiches for each row execute function private.formalio_set_updated_at()';
end $$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.fiches;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;
