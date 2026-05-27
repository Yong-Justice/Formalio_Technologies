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

create index if not exists versements_user_id_idx on public.versements(user_id);
create index if not exists versements_company_id_idx on public.versements(company_id);
create index if not exists versements_updated_at_idx on public.versements(updated_at);
create index if not exists versements_sync_status_idx on public.versements(sync_status);
create index if not exists versements_deleted_at_idx on public.versements(deleted_at);
create index if not exists versements_destination_idx on public.versements(destination);
create index if not exists versements_versement_date_idx on public.versements(versement_date);

grant select, insert, update, delete on public.versements to authenticated;

do $$
begin
  perform private.formalio_apply_sync_indexes('versements');
  perform private.formalio_apply_rls('versements');

  execute 'drop trigger if exists formalio_set_updated_at on public.versements';
  execute 'create trigger formalio_set_updated_at before update on public.versements for each row execute function private.formalio_set_updated_at()';
end $$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.versements;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;
