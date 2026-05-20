-- Dynamic production MVP financial snapshot.
-- Centralizes zero-state KPIs, cash flow, category analytics, and Mosika score
-- so mobile UI, reports, and AI use the same scoped company data.

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
  with access_check as (
    select private.is_company_member(p_company_id) as allowed
  ),
  company_profile as (
    select
      c.id,
      c.kyc_status,
      p.email_verification_status,
      p.email_verified_at,
      c.created_at::date as company_created_at
    from public.companies c
    join public.profiles p on p.id = c.owner_user_id
    where c.id = p_company_id
  ),
  scoped_transactions as (
    select *
    from public.transactions t
    where t.company_id = p_company_id
      and t.deleted_at is null
      and t.status in ('completed', 'reconciled')
      and t.transaction_date between p_period_start and p_period_end
  ),
  all_transactions as (
    select *
    from public.transactions t
    where t.company_id = p_company_id
      and t.deleted_at is null
      and t.status in ('completed', 'reconciled')
  ),
  period_totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as revenue,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as expenses,
      coalesce(sum(tax_amount) filter (where type = 'income'), 0)::numeric as tax_collected,
      coalesce(sum(tax_amount) filter (where type = 'expense'), 0)::numeric as tax_deductible,
      count(*)::int as transaction_count,
      count(*) filter (where type = 'income')::int as revenue_count,
      count(*) filter (where type = 'expense')::int as expense_count
    from scoped_transactions
  ),
  lifetime_totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as lifetime_revenue,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as lifetime_expenses,
      count(*)::int as lifetime_transaction_count,
      count(distinct date_trunc('month', transaction_date))::int as active_months,
      coalesce(avg(amount) filter (where type = 'income'), 0)::numeric as avg_income_ticket,
      coalesce(stddev_pop(amount) filter (where type = 'income'), 0)::numeric as income_stddev
    from all_transactions
  ),
  previous_period as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as previous_revenue,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as previous_expenses
    from public.transactions t
    where t.company_id = p_company_id
      and t.deleted_at is null
      and t.status in ('completed', 'reconciled')
      and t.transaction_date >= (p_period_start - (p_period_end - p_period_start + 1))
      and t.transaction_date < p_period_start
  ),
  daily_cashflow as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', d.day,
      'label', to_char(d.day, 'DD Mon'),
      'income', coalesce(t.income, 0),
      'expense', coalesce(t.expense, 0),
      'net', coalesce(t.income, 0) - coalesce(t.expense, 0)
    ) order by d.day), '[]'::jsonb) as rows
    from generate_series(p_period_start, p_period_end, interval '1 day') d(day)
    left join (
      select
        transaction_date,
        coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as income,
        coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as expense
      from scoped_transactions
      group by transaction_date
    ) t on t.transaction_date = d.day::date
  ),
  category_breakdown as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', category_name,
      'type', type,
      'amount', amount,
      'share', case when total_amount = 0 then 0 else round((amount / total_amount) * 100, 2) end
    ) order by amount desc), '[]'::jsonb) as rows
    from (
      select
        coalesce(cat.name, st.metadata->>'category', 'Autres') as category_name,
        st.type,
        sum(st.amount)::numeric as amount,
        sum(sum(st.amount)) over (partition by st.type)::numeric as total_amount
      from scoped_transactions st
      left join public.categories cat on cat.id = st.category_id
      group by category_name, st.type
    ) grouped
  ),
  platform_counts as (
    select
      (select count(*)::int from public.reports r where r.company_id = p_company_id) as report_count,
      (select count(*)::int from public.documents d where d.company_id = p_company_id) as document_count,
      (select count(*)::int from public.kyc_verifications k where k.company_id = p_company_id) as kyc_submission_count
  ),
  factors as (
    select
      pt.*,
      lt.*,
      pp.previous_revenue,
      pp.previous_expenses,
      cp.kyc_status,
      cp.email_verification_status,
      cp.email_verified_at,
      cp.company_created_at,
      pc.report_count,
      pc.document_count,
      pc.kyc_submission_count,
      case when pt.revenue = 0 then 0 else (pt.revenue - pt.expenses) / pt.revenue end as period_margin,
      case when lt.lifetime_revenue = 0 then 0 else (lt.lifetime_revenue - lt.lifetime_expenses) / lt.lifetime_revenue end as lifetime_margin,
      case when pp.previous_revenue = 0 and pt.revenue > 0 then 1
           when pp.previous_revenue = 0 then 0
           else (pt.revenue - pp.previous_revenue) / pp.previous_revenue
      end as revenue_growth,
      case when lt.avg_income_ticket = 0 then 0 else greatest(0, 1 - least(1, lt.income_stddev / nullif(lt.avg_income_ticket, 0))) end as income_stability
    from period_totals pt
    cross join lifetime_totals lt
    cross join previous_period pp
    cross join company_profile cp
    cross join platform_counts pc
  ),
  scoring as (
    select
      *,
      least(1, lifetime_transaction_count / 30.0) as activity_factor,
      greatest(0, least(1, (lifetime_margin + 0.25) / 0.65)) as cashflow_factor,
      case when lifetime_revenue = 0 then 0 else greatest(0, least(1, 1 - (lifetime_expenses / nullif(lifetime_revenue, 0)))) end as expense_discipline_factor,
      greatest(0, least(1, income_stability)) as revenue_stability_factor,
      greatest(0, least(1, (revenue_growth + 0.2) / 0.6)) as growth_factor,
      least(1, active_months / 6.0) as account_history_factor,
      (
        case when kyc_status = 'approved' then 0.45 when kyc_status = 'under_review' then 0.25 else 0 end +
        case when email_verified_at is not null or email_verification_status = 'verified' then 0.25 else 0 end +
        least(0.30, document_count / 10.0 * 0.30)
      ) as compliance_factor,
      least(1, report_count / 4.0) as reporting_factor
    from factors
  )
  select jsonb_build_object(
    'companyId', p_company_id,
    'periodStart', p_period_start,
    'periodEnd', p_period_end,
    'revenue', coalesce(revenue, 0),
    'expenses', coalesce(expenses, 0),
    'profit', coalesce(revenue - expenses, 0),
    'balance', coalesce(revenue - expenses, 0),
    'profitMargin', case when revenue = 0 then 0 else round(((revenue - expenses) / revenue) * 100, 2) end,
    'taxCollected', coalesce(tax_collected, 0),
    'taxDeductible', coalesce(tax_deductible, 0),
    'taxDue', greatest(coalesce(tax_collected - tax_deductible, 0), 0),
    'transactionCount', coalesce(transaction_count, 0),
    'revenueCount', coalesce(revenue_count, 0),
    'expenseCount', coalesce(expense_count, 0),
    'cashFlow', coalesce(revenue - expenses, 0),
    'previousRevenue', coalesce(previous_revenue, 0),
    'previousExpenses', coalesce(previous_expenses, 0),
    'growthRate', round(coalesce(revenue_growth, 0) * 100, 2),
    'dailyCashflow', (select rows from daily_cashflow),
    'categoryBreakdown', (select rows from category_breakdown),
    'reportCount', coalesce(report_count, 0),
    'documentCount', coalesce(document_count, 0),
    'complianceScore', round(greatest(0, least(1, compliance_factor)) * 100),
    'financialHealth', case when lifetime_transaction_count = 0 then 50 else round((
      activity_factor * 0.18 +
      cashflow_factor * 0.24 +
      expense_discipline_factor * 0.18 +
      revenue_stability_factor * 0.12 +
      growth_factor * 0.12 +
      compliance_factor * 0.10 +
      reporting_factor * 0.06
    ) * 100) end,
    'mosikaScore', case when lifetime_transaction_count = 0 then 300 else round(300 + (
      activity_factor * 0.15 +
      cashflow_factor * 0.18 +
      expense_discipline_factor * 0.14 +
      revenue_stability_factor * 0.13 +
      growth_factor * 0.12 +
      account_history_factor * 0.08 +
      compliance_factor * 0.10 +
      reporting_factor * 0.10
    ) * 550) end,
    'scoreFactors', jsonb_build_object(
      'activity', round(activity_factor * 100),
      'cashflow', round(cashflow_factor * 100),
      'expenseDiscipline', round(expense_discipline_factor * 100),
      'revenueStability', round(revenue_stability_factor * 100),
      'growth', round(growth_factor * 100),
      'compliance', round(compliance_factor * 100),
      'reporting', round(reporting_factor * 100)
    ),
    'emptyState', lifetime_transaction_count = 0
  )
  from scoring
  where (select allowed from access_check);
$$;
