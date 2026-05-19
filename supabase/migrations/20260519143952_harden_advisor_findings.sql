-- Harden advisor findings after the initial production schema deployment.

create schema if not exists extensions;

do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'citext' and n.nspname = 'public'
  ) then
    alter extension citext set schema extensions;
  end if;

  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pg_trgm' and n.nspname = 'public'
  ) then
    alter extension pg_trgm set schema extensions;
  end if;
end $$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.set_transaction_date()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  new.transaction_date = new.occurred_at::date;
  return new;
end;
$$;

create or replace function public.loan_timeline(initial_status public.loan_status default 'submitted')
returns jsonb
language sql
immutable
set search_path = public
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

grant execute on function public.loan_timeline(public.loan_status) to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format(
      'alter policy %I on %I.%I to authenticated',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;

  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'storage_select_own_files',
        'storage_insert_own_files',
        'storage_update_own_files',
        'storage_delete_manager_files'
      )
  loop
    execute format(
      'alter policy %I on %I.%I to authenticated',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from anon, authenticated;
  end if;
end $$;
