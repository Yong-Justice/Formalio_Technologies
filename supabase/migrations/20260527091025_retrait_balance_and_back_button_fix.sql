do $$
declare
  dashboard_metrics_sql text;
begin
  select pg_get_functiondef(p.oid)
  into dashboard_metrics_sql
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'dashboard_metrics'
    and pg_get_function_identity_arguments(p.oid) = 'p_company_id uuid, p_period_start date, p_period_end date';

  if dashboard_metrics_sql is null then
    raise exception 'public.dashboard_metrics(uuid,date,date) was not found';
  end if;

  execute 'drop function public.dashboard_metrics(uuid,date,date)';

  alter table public.transactions
    drop column if exists signed_amount;

  alter table public.transactions
    add column signed_amount numeric generated always as (
      case
        when type = 'income'::public.transaction_type then amount
        when type in ('expense'::public.transaction_type, 'retrait'::public.transaction_type) then -amount
        else 0::numeric
      end
    ) stored;

  dashboard_metrics_sql := replace(
    dashboard_metrics_sql,
    'filter (where t.type = ''expense'')',
    'filter (where t.type in (''expense'', ''retrait''))'
  );
  dashboard_metrics_sql := replace(
    dashboard_metrics_sql,
    'filter (where type = ''expense'')',
    'filter (where type in (''expense'', ''retrait''))'
  );
  dashboard_metrics_sql := replace(
    dashboard_metrics_sql,
    'st.type,
        sum(st.amount)::numeric as amount,',
    'case when st.type = ''retrait'' then ''expense''::public.transaction_type else st.type end as type,
        sum(st.amount)::numeric as amount,'
  );
  dashboard_metrics_sql := replace(
    dashboard_metrics_sql,
    'sum(sum(st.amount)) over (partition by st.type)::numeric as total_amount',
    'sum(sum(st.amount)) over (partition by case when st.type = ''retrait'' then ''expense''::public.transaction_type else st.type end)::numeric as total_amount'
  );
  dashboard_metrics_sql := replace(
    dashboard_metrics_sql,
    'group by category_name, st.type',
    'group by category_name, case when st.type = ''retrait'' then ''expense''::public.transaction_type else st.type end'
  );

  execute dashboard_metrics_sql;
end $$;

grant execute on function public.dashboard_metrics(uuid,date,date) to authenticated;
notify pgrst, 'reload schema';
