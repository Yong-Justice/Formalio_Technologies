create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  quantity numeric not null default 0 check (quantity >= 0),
  price_type text not null check (price_type in ('fixed', 'range')),
  unit_price numeric check (unit_price is null or unit_price > 0),
  min_price numeric check (min_price is null or min_price > 0),
  max_price numeric check (max_price is null or max_price > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint stock_items_price_shape check (
    (
      price_type = 'fixed'
      and unit_price is not null
      and min_price is null
      and max_price is null
    )
    or
    (
      price_type = 'range'
      and unit_price is null
      and min_price is not null
      and max_price is not null
      and max_price >= min_price
    )
  )
);

create index if not exists stock_items_company_id_idx
  on public.stock_items(company_id)
  where deleted_at is null;

create index if not exists stock_items_company_name_idx
  on public.stock_items(company_id, lower(name))
  where deleted_at is null;

drop trigger if exists set_stock_items_updated_at on public.stock_items;
create trigger set_stock_items_updated_at
  before update on public.stock_items
  for each row execute function private.set_updated_at();

alter table public.stock_items enable row level security;

drop policy if exists stock_items_member_select on public.stock_items;
create policy stock_items_member_select
  on public.stock_items
  for select
  to authenticated
  using (private.is_company_member(company_id));

drop policy if exists stock_items_member_insert on public.stock_items;
create policy stock_items_member_insert
  on public.stock_items
  for insert
  to authenticated
  with check (private.is_company_member(company_id));

drop policy if exists stock_items_member_update on public.stock_items;
create policy stock_items_member_update
  on public.stock_items
  for update
  to authenticated
  using (private.is_company_member(company_id))
  with check (private.is_company_member(company_id));

drop policy if exists stock_items_manager_delete on public.stock_items;
create policy stock_items_manager_delete
  on public.stock_items
  for delete
  to authenticated
  using (private.can_manage_accounting(company_id));

grant select, insert, update, delete on public.stock_items to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'stock_items'
     ) then
    alter publication supabase_realtime add table public.stock_items;
  end if;
end $$;
