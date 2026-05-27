create or replace function private.formalio_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.formalio_ensure_sync_columns(p_table_name text)
returns void
language plpgsql
set search_path = pg_catalog, public, auth
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
set search_path = pg_catalog, public
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
set search_path = pg_catalog, public, private
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
