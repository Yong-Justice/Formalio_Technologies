-- Mosika Score v4: long-term financial scoring, persistent score snapshots,
-- and richer AI/accounting context. All functions stay security-invoker and
-- rely on RLS/private membership checks so data remains company-scoped.

create table if not exists public.financial_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  model_version text not null default 'mosika-score-v4.0',
  mosika_score int not null check (mosika_score between 300 and 850),
  raw_mosika_score int not null check (raw_mosika_score between 300 and 850),
  financial_health numeric(5,2) not null check (financial_health between 0 and 100),
  loan_approval_probability numeric(5,2) not null check (loan_approval_probability between 0 and 100),
  risk_assessment_level text not null check (risk_assessment_level in ('insufficient_data', 'low', 'moderate', 'elevated', 'high')),
  score_confidence numeric(5,2) not null check (score_confidence between 0 and 100),
  score_weight numeric(12,8) not null check (score_weight between 0 and 1),
  score_factors jsonb not null default '{}'::jsonb,
  score_weights jsonb not null default '{}'::jsonb,
  financial_ratios jsonb not null default '{}'::jsonb,
  stability_metrics jsonb not null default '{}'::jsonb,
  risk_indicators jsonb not null default '{}'::jsonb,
  score_drivers jsonb not null default '{}'::jsonb,
  minimum_data_required jsonb not null default '[]'::jsonb,
  generated_by uuid references public.profiles(id) on delete set null default auth.uid(),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, period_start, period_end, model_version)
);

create index if not exists financial_score_snapshots_company_generated_idx
  on public.financial_score_snapshots(company_id, generated_at desc);

alter table public.financial_score_snapshots enable row level security;

drop policy if exists "financial_score_snapshots_member_select" on public.financial_score_snapshots;
drop policy if exists "financial_score_snapshots_member_insert" on public.financial_score_snapshots;
drop policy if exists "financial_score_snapshots_member_update" on public.financial_score_snapshots;
drop policy if exists "financial_score_snapshots_manager_delete" on public.financial_score_snapshots;

create policy "financial_score_snapshots_member_select"
  on public.financial_score_snapshots for select
  using (private.is_company_member(company_id));

create policy "financial_score_snapshots_member_insert"
  on public.financial_score_snapshots for insert
  with check (private.is_company_member(company_id));

create policy "financial_score_snapshots_member_update"
  on public.financial_score_snapshots for update
  using (private.is_company_member(company_id))
  with check (private.is_company_member(company_id));

create policy "financial_score_snapshots_manager_delete"
  on public.financial_score_snapshots for delete
  using (private.can_manage_company(company_id));

grant select, insert, update, delete on public.financial_score_snapshots to authenticated;

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
      c.created_at::date as company_created_at,
      p.email_verification_status,
      p.email_verified_at
    from public.companies c
    join public.profiles p on p.id = c.owner_user_id
    where c.id = p_company_id
      and (select allowed from access_check)
  ),
  scoped_transactions as (
    select t.*
    from public.transactions t
    where t.company_id = p_company_id
      and t.deleted_at is null
      and t.status in ('completed', 'reconciled')
      and t.transaction_date between p_period_start and p_period_end
  ),
  all_transactions as (
    select t.*
    from public.transactions t
    where t.company_id = p_company_id
      and t.deleted_at is null
      and t.status in ('completed', 'reconciled')
  ),
  months as (
    select generate_series(
      date_trunc('month', p_period_end)::date - interval '11 months',
      date_trunc('month', p_period_end)::date,
      interval '1 month'
    )::date as month_start
  ),
  monthly as (
    select
      m.month_start,
      coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric as revenue,
      coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric as expenses,
      coalesce(sum(t.signed_amount), 0)::numeric as net,
      count(t.id)::int as transaction_count,
      count(distinct t.transaction_date)::int as active_days
    from months m
    left join all_transactions t
      on date_trunc('month', t.transaction_date)::date = m.month_start
    group by m.month_start
  ),
  monthly_indexed as (
    select
      monthly.*,
      row_number() over (order by month_start)::numeric as month_index
    from monthly
  ),
  period_totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as revenue,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as expenses,
      coalesce(sum(tax_amount) filter (where type = 'income'), 0)::numeric as tax_collected,
      coalesce(sum(tax_amount) filter (where type = 'expense'), 0)::numeric as tax_deductible,
      count(*)::int as transaction_count,
      count(*) filter (where type = 'income')::int as revenue_count,
      count(*) filter (where type = 'expense')::int as expense_count,
      count(*) filter (where status = 'reconciled')::int as reconciled_count,
      count(*) filter (where category_id is not null or metadata ? 'category')::int as categorized_count,
      count(*) filter (where payment_method is not null and length(trim(payment_method)) > 0)::int as payment_method_count,
      count(*) filter (where reference_number is not null and length(trim(reference_number)) > 0)::int as referenced_count,
      count(*) filter (where document_id is not null or ocr_payload is not null)::int as evidenced_count
    from scoped_transactions
  ),
  lifetime_totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as lifetime_revenue,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as lifetime_expenses,
      coalesce(sum(signed_amount), 0)::numeric as lifetime_net_cashflow,
      count(*)::int as lifetime_transaction_count,
      count(*) filter (where type = 'income')::int as lifetime_income_count,
      count(*) filter (where type = 'expense')::int as lifetime_expense_count,
      count(distinct date_trunc('month', transaction_date))::int as active_months,
      count(distinct transaction_date)::int as active_days,
      greatest(1, coalesce(max(transaction_date) - min(transaction_date) + 1, 1))::int as observed_days,
      coalesce(avg(amount) filter (where type = 'income'), 0)::numeric as avg_income_ticket,
      coalesce(stddev_pop(amount) filter (where type = 'income'), 0)::numeric as income_stddev,
      coalesce(avg(amount), 0)::numeric as avg_ticket,
      coalesce(stddev_pop(amount), 0)::numeric as ticket_stddev,
      min(transaction_date) as first_transaction_date,
      max(transaction_date) as last_transaction_date
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
  invoice_stats as (
    select
      count(*)::int as invoice_count,
      count(*) filter (where status = 'paid')::int as paid_invoice_count,
      coalesce(sum(total - amount_paid) filter (where status in ('sent', 'overdue', 'partially_paid')), 0)::numeric as outstanding_receivables,
      coalesce(sum(total) filter (where status = 'paid'), 0)::numeric as paid_invoice_value,
      coalesce(sum(total) filter (where status = 'overdue'), 0)::numeric as overdue_invoice_value,
      count(*) filter (where status = 'overdue')::int as overdue_invoice_count
    from public.invoices
    where company_id = p_company_id
  ),
  debt_stats as (
    select
      coalesce(sum(amount) filter (where status in ('approved', 'disbursed', 'under_review', 'risk_assessment', 'pending_documents')), 0)::numeric as debt_exposure,
      count(*) filter (where status in ('submitted', 'under_review', 'risk_assessment', 'pending_documents'))::int as active_loan_requests
    from public.loan_requests
    where company_id = p_company_id
  ),
  document_stats as (
    select
      count(*)::int as document_count,
      count(*) filter (where checksum is not null and length(checksum) > 0)::int as checksum_document_count,
      count(*) filter (where kind in ('receipt', 'invoice', 'kyc_id_front', 'kyc_id_back', 'kyc_selfie', 'kyc_address_proof'))::int as financial_document_count
    from public.documents
    where company_id = p_company_id
  ),
  kyc_document_stats as (
    select
      count(*)::int as kyc_document_count,
      coalesce(avg(confidence), 0)::numeric as avg_kyc_document_confidence
    from public.kyc_documents
    where company_id = p_company_id
  ),
  platform_counts as (
    select
      (select count(*)::int from public.reports r where r.company_id = p_company_id and r.status = 'ready') as report_count,
      (select count(*)::int from public.kyc_verifications k where k.company_id = p_company_id) as kyc_submission_count
  ),
  recurring_revenue as (
    select
      coalesce(sum(total_amount) filter (where merchant_months >= 3), 0)::numeric as recurring_revenue_amount,
      count(*) filter (where merchant_months >= 3)::int as recurring_revenue_sources
    from (
      select
        coalesce(nullif(trim(merchant_name), ''), nullif(trim(metadata->>'customer'), ''), nullif(trim(description), ''), 'unknown') as source_key,
        count(distinct date_trunc('month', transaction_date))::int as merchant_months,
        sum(amount)::numeric as total_amount
      from all_transactions
      where type = 'income'
      group by source_key
    ) recurring
  ),
  monthly_stats as (
    select
      coalesce(avg(nullif(revenue, 0)), 0)::numeric as avg_positive_monthly_revenue,
      coalesce(stddev_pop(nullif(revenue, 0)), 0)::numeric as revenue_monthly_stddev,
      coalesce(avg(revenue), 0)::numeric as avg_monthly_revenue,
      coalesce(avg(expenses), 0)::numeric as avg_monthly_expenses,
      coalesce(avg(net), 0)::numeric as avg_monthly_net,
      coalesce(stddev_pop(net), 0)::numeric as net_monthly_stddev,
      count(*) filter (where revenue > 0)::int as revenue_months,
      count(*) filter (where net > 0)::int as positive_cashflow_months,
      count(*) filter (where net < 0)::int as negative_cashflow_months,
      coalesce(avg(transaction_count), 0)::numeric as avg_monthly_transaction_count,
      coalesce(regr_slope(revenue, month_index), 0)::numeric as revenue_slope,
      coalesce(regr_slope(net, month_index), 0)::numeric as net_slope,
      coalesce(avg(revenue) filter (where month_start >= date_trunc('month', p_period_end)::date - interval '2 months'), 0)::numeric as recent_3m_avg_revenue,
      coalesce(avg(revenue) filter (where month_start < date_trunc('month', p_period_end)::date - interval '2 months'), 0)::numeric as prior_9m_avg_revenue,
      coalesce(avg(net) filter (where month_start >= date_trunc('month', p_period_end)::date - interval '2 months'), 0)::numeric as recent_3m_avg_net
    from monthly_indexed
  ),
  anomaly_stats as (
    select
      count(*) filter (
        where lt.lifetime_transaction_count >= 12
          and lt.ticket_stddev > 0
          and abs(t.amount - lt.avg_ticket) > lt.ticket_stddev * 2.75
      )::int as amount_anomaly_count,
      count(*) filter (
        where t.reference_number is not null
          and exists (
            select 1
            from public.transactions t2
            where t2.company_id = t.company_id
              and t2.id <> t.id
              and t2.reference_number = t.reference_number
              and t2.deleted_at is null
          )
      )::int as duplicate_reference_count,
      count(*) filter (where t.tax_amount > t.amount * 0.35)::int as tax_anomaly_count
    from scoped_transactions t
    cross join lifetime_totals lt
  ),
  previous_snapshot as (
    select s.mosika_score, s.financial_health, s.loan_approval_probability
    from public.financial_score_snapshots s
    where s.company_id = p_company_id
      and s.period_end < p_period_end
      and private.is_company_member(s.company_id)
    order by s.period_end desc, s.generated_at desc
    limit 1
  ),
  daily_cashflow as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', d.day::date,
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
  monthly_cashflow as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'month', month_start,
      'label', to_char(month_start, 'Mon YYYY'),
      'revenue', revenue,
      'expenses', expenses,
      'net', net,
      'transactionCount', transaction_count
    ) order by month_start), '[]'::jsonb) as rows
    from monthly
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
  factors as (
    select
      pt.*,
      lt.*,
      pp.previous_revenue,
      pp.previous_expenses,
      inv.invoice_count,
      inv.paid_invoice_count,
      inv.outstanding_receivables,
      inv.paid_invoice_value,
      inv.overdue_invoice_value,
      inv.overdue_invoice_count,
      debt.debt_exposure,
      debt.active_loan_requests,
      docs.document_count,
      docs.checksum_document_count,
      docs.financial_document_count,
      kdocs.kyc_document_count,
      kdocs.avg_kyc_document_confidence,
      pc.report_count,
      pc.kyc_submission_count,
      rr.recurring_revenue_amount,
      rr.recurring_revenue_sources,
      ms.avg_positive_monthly_revenue,
      ms.revenue_monthly_stddev,
      ms.avg_monthly_revenue,
      ms.avg_monthly_expenses,
      ms.avg_monthly_net,
      ms.net_monthly_stddev,
      ms.revenue_months,
      ms.positive_cashflow_months,
      ms.negative_cashflow_months,
      ms.avg_monthly_transaction_count,
      ms.revenue_slope,
      ms.net_slope,
      ms.recent_3m_avg_revenue,
      ms.prior_9m_avg_revenue,
      ms.recent_3m_avg_net,
      an.amount_anomaly_count,
      an.duplicate_reference_count,
      an.tax_anomaly_count,
      cp.kyc_status,
      cp.email_verification_status,
      cp.email_verified_at,
      cp.company_created_at,
      ps.mosika_score as previous_mosika_score,
      greatest(1, current_date - cp.company_created_at) as account_age_days,
      case when pt.revenue = 0 then 0 else (pt.revenue - pt.expenses) / pt.revenue end as period_margin,
      case when lt.lifetime_revenue = 0 then 0 else (lt.lifetime_revenue - lt.lifetime_expenses) / lt.lifetime_revenue end as lifetime_margin,
      case when pp.previous_revenue = 0 and pt.revenue > 0 then 1
           when pp.previous_revenue = 0 then 0
           else (pt.revenue - pp.previous_revenue) / pp.previous_revenue
      end as revenue_growth,
      case
        when ms.avg_positive_monthly_revenue = 0 then 0
        else greatest(0, least(1, 1 - (ms.revenue_monthly_stddev / nullif(ms.avg_positive_monthly_revenue, 0))))
      end as revenue_consistency_raw,
      case when inv.invoice_count = 0 then 0.50 else inv.paid_invoice_count::numeric / nullif(inv.invoice_count, 0) end as payment_regularity_raw,
      case when lt.lifetime_revenue = 0 then 0 else rr.recurring_revenue_amount / nullif(lt.lifetime_revenue, 0) end as recurring_revenue_raw,
      case
        when (greatest(coalesce(tax_collected - tax_deductible, 0), 0) + debt.debt_exposure + inv.overdue_invoice_value) = 0 and lt.lifetime_net_cashflow > 0 then 2
        when (greatest(coalesce(tax_collected - tax_deductible, 0), 0) + debt.debt_exposure + inv.overdue_invoice_value) = 0 then 1
        else greatest(0, (greatest(lt.lifetime_net_cashflow, 0) + inv.outstanding_receivables) / nullif(greatest(coalesce(tax_collected - tax_deductible, 0), 0) + debt.debt_exposure + inv.overdue_invoice_value, 0))
      end as liquidity_ratio_raw,
      case
        when pt.transaction_count = 0 then 0
        else (
          (pt.categorized_count::numeric / nullif(pt.transaction_count, 0)) * 0.30 +
          (pt.payment_method_count::numeric / nullif(pt.transaction_count, 0)) * 0.20 +
          (pt.referenced_count::numeric / nullif(pt.transaction_count, 0)) * 0.20 +
          (pt.evidenced_count::numeric / nullif(pt.transaction_count, 0)) * 0.30
        )
      end as data_completeness_raw
    from period_totals pt
    cross join lifetime_totals lt
    cross join previous_period pp
    cross join invoice_stats inv
    cross join debt_stats debt
    cross join document_stats docs
    cross join kyc_document_stats kdocs
    cross join platform_counts pc
    cross join recurring_revenue rr
    cross join monthly_stats ms
    cross join anomaly_stats an
    cross join company_profile cp
    left join previous_snapshot ps on true
  ),
  scoring as (
    select
      *,
      least(1, ln(1 + lifetime_transaction_count)::numeric / ln(121)::numeric) as activity_factor,
      greatest(0, least(1, revenue_consistency_raw)) as revenue_consistency_factor,
      greatest(0, least(1, (lifetime_margin + 0.20) / 0.60)) as profitability_factor,
      case when active_months = 0 then 0 else greatest(0, least(1, positive_cashflow_months::numeric / nullif(active_months, 0))) end as cashflow_factor,
      case when lifetime_revenue = 0 then 0 else greatest(0, least(1, 1 - (lifetime_expenses / nullif(lifetime_revenue, 0)))) end as expense_ratio_factor,
      greatest(0, least(1, (revenue_growth + 0.20) / 0.70)) as growth_factor,
      greatest(0, least(1, (
        least(1, account_age_days / 540.0) * 0.45 +
        least(1, active_months / 12.0) * 0.35 +
        least(1, active_days::numeric / nullif(observed_days, 0)) * 0.20
      ))) as business_stability_factor,
      case when lifetime_revenue = 0 then 0.65 else greatest(0, least(1, 1 - (debt_exposure / nullif(lifetime_revenue, 0)))) end as debt_factor,
      greatest(0, least(1, payment_regularity_raw)) as payment_regularity_factor,
      greatest(0, least(1, recurring_revenue_raw)) as recurring_revenue_factor,
      greatest(0, least(1, liquidity_ratio_raw / 2.0)) as liquidity_factor,
      case when avg_positive_monthly_revenue = 0 then 0 else greatest(0, least(1, 1 - (revenue_monthly_stddev / nullif(avg_positive_monthly_revenue, 0)))) end as volatility_factor,
      case when transaction_count = 0 then 1 else greatest(0, least(1, 1 - ((amount_anomaly_count + duplicate_reference_count + tax_anomaly_count)::numeric / nullif(transaction_count, 0)))) end as anomaly_factor,
      case when transaction_count = 0 then 0 else greatest(0, least(1, reconciled_count::numeric / nullif(transaction_count, 0))) end as reconciliation_factor,
      greatest(0, least(1, (
        case when kyc_status = 'approved' then 0.32 when kyc_status = 'under_review' then 0.18 else 0 end +
        case when email_verified_at is not null or email_verification_status = 'verified' then 0.18 else 0 end +
        least(0.18, document_count / 10.0 * 0.18) +
        least(0.12, report_count / 4.0 * 0.12) +
        least(0.10, kyc_document_count / 4.0 * 0.10) +
        least(0.10, data_completeness_raw * 0.10)
      ))) as compliance_factor,
      greatest(0, least(1, (
        least(1, financial_document_count / 8.0) * 0.40 +
        case when document_count = 0 then 0 else least(1, checksum_document_count::numeric / nullif(document_count, 0)) * 0.25 end +
        least(1, avg_kyc_document_confidence / 100.0) * 0.20 +
        data_completeness_raw * 0.15
      ))) as document_reliability_factor,
      greatest(0, least(1, (
        least(1, ln(1 + lifetime_transaction_count)::numeric / ln(121)::numeric) * 0.55 +
        least(1, active_months / 12.0) * 0.30 +
        least(1, account_age_days / 365.0) * 0.15
      ))) as score_confidence_factor
    from factors
  ),
  weighted as (
    select
      *,
      (
        activity_factor * 0.06 +
        revenue_consistency_factor * 0.10 +
        profitability_factor * 0.10 +
        cashflow_factor * 0.10 +
        expense_ratio_factor * 0.08 +
        growth_factor * 0.07 +
        business_stability_factor * 0.07 +
        debt_factor * 0.08 +
        payment_regularity_factor * 0.07 +
        recurring_revenue_factor * 0.06 +
        liquidity_factor * 0.07 +
        volatility_factor * 0.05 +
        anomaly_factor * 0.04 +
        reconciliation_factor * 0.02 +
        compliance_factor * 0.03
      ) as score_weight,
      (300 + (
        (
          activity_factor * 0.06 +
          revenue_consistency_factor * 0.10 +
          profitability_factor * 0.10 +
          cashflow_factor * 0.10 +
          expense_ratio_factor * 0.08 +
          growth_factor * 0.07 +
          business_stability_factor * 0.07 +
          debt_factor * 0.08 +
          payment_regularity_factor * 0.07 +
          recurring_revenue_factor * 0.06 +
          liquidity_factor * 0.07 +
          volatility_factor * 0.05 +
          anomaly_factor * 0.04 +
          reconciliation_factor * 0.02 +
          compliance_factor * 0.03
        ) * 550
      ))::numeric as raw_score
    from scoring
  ),
  calibrated as (
    select
      *,
      case
        when lifetime_transaction_count = 0 then 300
        when previous_mosika_score is null then round(300 + ((raw_score - 300) * (0.72 + score_confidence_factor * 0.28)))
        else round((previous_mosika_score * 0.68) + ((300 + ((raw_score - 300) * (0.72 + score_confidence_factor * 0.28))) * 0.32))
      end::int as calibrated_mosika_score,
      round(greatest(0, least(100, score_confidence_factor * 100)), 2) as score_confidence
    from weighted
  )
  select jsonb_build_object(
    'companyId', p_company_id,
    'periodStart', p_period_start,
    'periodEnd', p_period_end,
    'modelVersion', 'mosika-score-v4.0',
    'revenue', coalesce(revenue, 0),
    'expenses', coalesce(expenses, 0),
    'profit', coalesce(revenue - expenses, 0),
    'balance', coalesce(revenue - expenses, 0),
    'cashFlow', coalesce(revenue - expenses, 0),
    'profitMargin', case when revenue = 0 then 0 else round(((revenue - expenses) / revenue) * 100, 2) end,
    'taxCollected', coalesce(tax_collected, 0),
    'taxDeductible', coalesce(tax_deductible, 0),
    'taxDue', greatest(coalesce(tax_collected - tax_deductible, 0), 0),
    'transactionCount', coalesce(transaction_count, 0),
    'revenueCount', coalesce(revenue_count, 0),
    'expenseCount', coalesce(expense_count, 0),
    'previousRevenue', coalesce(previous_revenue, 0),
    'previousExpenses', coalesce(previous_expenses, 0),
    'growthRate', round(coalesce(revenue_growth, 0) * 100, 2),
    'dailyCashflow', (select rows from daily_cashflow),
    'monthlyCashflow', (select rows from monthly_cashflow),
    'categoryBreakdown', (select rows from category_breakdown),
    'reportCount', coalesce(report_count, 0),
    'documentCount', coalesce(document_count, 0),
    'complianceScore', round(greatest(0, least(1, compliance_factor)) * 100),
    'financialHealth', case when lifetime_transaction_count = 0 then 50 else round(greatest(0, least(1, score_weight)) * 100) end,
    'mosikaScore', greatest(300, least(850, calibrated_mosika_score)),
    'rawMosikaScore', case when lifetime_transaction_count = 0 then 300 else greatest(300, least(850, round(raw_score)::int)) end,
    'scoreConfidence', score_confidence,
    'loanApprovalProbability', case
      when lifetime_transaction_count = 0 then 0
      else round(greatest(0, least(0.97,
        (1 / (1 + exp(-((calibrated_mosika_score - 635)::numeric / 72.0)))) * 0.76 +
        compliance_factor * 0.12 +
        debt_factor * 0.06 +
        anomaly_factor * 0.06 -
        (active_loan_requests * 0.025)
      )) * 100, 2)
    end,
    'riskAssessmentLevel', case
      when lifetime_transaction_count = 0 then 'insufficient_data'
      when calibrated_mosika_score >= 760 and anomaly_factor >= 0.90 and debt_factor >= 0.75 then 'low'
      when calibrated_mosika_score >= 650 and anomaly_factor >= 0.72 then 'moderate'
      when calibrated_mosika_score >= 540 then 'elevated'
      else 'high'
    end,
    'scoreBand', case
      when lifetime_transaction_count = 0 then 'baseline'
      when calibrated_mosika_score >= 760 then 'excellent'
      when calibrated_mosika_score >= 650 then 'strong'
      when calibrated_mosika_score >= 540 then 'watchlist'
      else 'high_risk'
    end,
    'financialRatios', jsonb_build_object(
      'expenseToRevenue', case when revenue = 0 then 0 else round((expenses / revenue) * 100, 2) end,
      'netMargin', case when revenue = 0 then 0 else round(((revenue - expenses) / revenue) * 100, 2) end,
      'lifetimeNetMargin', case when lifetime_revenue = 0 then 0 else round(((lifetime_revenue - lifetime_expenses) / lifetime_revenue) * 100, 2) end,
      'debtToRevenue', case when lifetime_revenue = 0 then 0 else round((debt_exposure / lifetime_revenue) * 100, 2) end,
      'reconciliationRate', case when transaction_count = 0 then 0 else round((reconciled_count::numeric / transaction_count) * 100, 2) end,
      'paymentRegularity', round(payment_regularity_factor * 100, 2),
      'revenueVolatility', case when avg_positive_monthly_revenue = 0 then 0 else round((revenue_monthly_stddev / avg_positive_monthly_revenue) * 100, 2) end,
      'liquidityRatio', round(liquidity_ratio_raw, 3),
      'recurringRevenueShare', round(recurring_revenue_factor * 100, 2),
      'dataCompleteness', round(data_completeness_raw * 100, 2),
      'transactionFrequency', round((active_days::numeric / nullif(observed_days, 0)) * 100, 2)
    ),
    'stabilityMetrics', jsonb_build_object(
      'activeMonths', active_months,
      'activeDays', active_days,
      'observedDays', observed_days,
      'accountAgeDays', account_age_days,
      'revenueSlope', round(revenue_slope, 4),
      'netCashflowSlope', round(net_slope, 4),
      'recent3mAverageRevenue', recent_3m_avg_revenue,
      'prior9mAverageRevenue', prior_9m_avg_revenue,
      'recent3mAverageNet', recent_3m_avg_net,
      'negativeCashflowMonths', negative_cashflow_months,
      'previousMosikaScore', previous_mosika_score
    ),
    'scoreFactors', jsonb_build_object(
      'activity', round(activity_factor * 100),
      'revenueConsistency', round(revenue_consistency_factor * 100),
      'profitability', round(profitability_factor * 100),
      'cashflow', round(cashflow_factor * 100),
      'expenseDiscipline', round(expense_ratio_factor * 100),
      'growth', round(growth_factor * 100),
      'stability', round(business_stability_factor * 100),
      'debtExposure', round(debt_factor * 100),
      'paymentRegularity', round(payment_regularity_factor * 100),
      'recurringRevenue', round(recurring_revenue_factor * 100),
      'liquidity', round(liquidity_factor * 100),
      'volatilityControl', round(volatility_factor * 100),
      'anomalyControl', round(anomaly_factor * 100),
      'reconciliation', round(reconciliation_factor * 100),
      'compliance', round(compliance_factor * 100),
      'documentReliability', round(document_reliability_factor * 100)
    ),
    'scoreWeights', jsonb_build_object(
      'activity', 0.06,
      'revenueConsistency', 0.10,
      'profitability', 0.10,
      'cashflow', 0.10,
      'expenseDiscipline', 0.08,
      'growth', 0.07,
      'stability', 0.07,
      'debtExposure', 0.08,
      'paymentRegularity', 0.07,
      'recurringRevenue', 0.06,
      'liquidity', 0.07,
      'volatilityControl', 0.05,
      'anomalyControl', 0.04,
      'reconciliation', 0.02,
      'compliance', 0.03
    ),
    'riskIndicators', jsonb_build_object(
      'amountAnomalies', coalesce(amount_anomaly_count, 0),
      'duplicateReferences', coalesce(duplicate_reference_count, 0),
      'taxAnomalies', coalesce(tax_anomaly_count, 0),
      'overdueInvoices', coalesce(overdue_invoice_count, 0),
      'overdueInvoiceValue', coalesce(overdue_invoice_value, 0),
      'activeLoanRequests', coalesce(active_loan_requests, 0),
      'outstandingReceivables', coalesce(outstanding_receivables, 0),
      'debtExposure', coalesce(debt_exposure, 0),
      'negativeCashflowMonths', coalesce(negative_cashflow_months, 0)
    ),
    'scoreDrivers', jsonb_build_object(
      'positive', jsonb_build_array(
        jsonb_build_object('key', 'cashflow', 'label', 'Positive cash-flow months', 'value', round(cashflow_factor * 100)),
        jsonb_build_object('key', 'profitability', 'label', 'Net profitability', 'value', round(profitability_factor * 100)),
        jsonb_build_object('key', 'recurringRevenue', 'label', 'Recurring revenue share', 'value', round(recurring_revenue_factor * 100)),
        jsonb_build_object('key', 'compliance', 'label', 'Verification and documentation', 'value', round(compliance_factor * 100))
      ),
      'negative', jsonb_build_array(
        jsonb_build_object('key', 'volatility', 'label', 'Revenue volatility', 'value', round((1 - volatility_factor) * 100)),
        jsonb_build_object('key', 'expenseRatio', 'label', 'Expense pressure', 'value', round((1 - expense_ratio_factor) * 100)),
        jsonb_build_object('key', 'debtExposure', 'label', 'Debt exposure', 'value', round((1 - debt_factor) * 100)),
        jsonb_build_object('key', 'anomalies', 'label', 'Financial anomalies', 'value', amount_anomaly_count + duplicate_reference_count + tax_anomaly_count)
      )
    ),
    'emptyState', lifetime_transaction_count = 0,
    'minimumDataRequired',
      (case when lifetime_transaction_count < 12 then jsonb_build_array('Add at least 12 completed transactions for a stable credit profile') else '[]'::jsonb end) ||
      (case when revenue_count = 0 then jsonb_build_array('Add at least one real revenue transaction') else '[]'::jsonb end) ||
      (case when expense_count = 0 then jsonb_build_array('Add at least one real expense transaction') else '[]'::jsonb end) ||
      (case when active_months < 3 then jsonb_build_array('Build at least 3 active months of financial history') else '[]'::jsonb end) ||
      (case when document_count = 0 then jsonb_build_array('Upload receipts, invoices, or KYC documents to improve document reliability') else '[]'::jsonb end)
  )
  from calibrated;
$$;

grant execute on function public.dashboard_metrics(uuid, date, date) to authenticated;

create or replace function public.record_mosika_score_snapshot(
  p_company_id uuid,
  p_period_start date default date_trunc('month', now())::date,
  p_period_end date default current_date
)
returns public.financial_score_snapshots
language plpgsql
security invoker
set search_path = public
as $$
declare
  metrics jsonb;
  snapshot_row public.financial_score_snapshots;
begin
  if not private.is_company_member(p_company_id) then
    raise exception 'You do not have access to this company'
      using errcode = '42501';
  end if;

  metrics := public.dashboard_metrics(p_company_id, p_period_start, p_period_end);

  if metrics is null or metrics = 'null'::jsonb then
    raise exception 'Unable to calculate Mosika Score for this company'
      using errcode = '22023';
  end if;

  insert into public.financial_score_snapshots (
    company_id,
    period_start,
    period_end,
    model_version,
    mosika_score,
    raw_mosika_score,
    financial_health,
    loan_approval_probability,
    risk_assessment_level,
    score_confidence,
    score_weight,
    score_factors,
    score_weights,
    financial_ratios,
    stability_metrics,
    risk_indicators,
    score_drivers,
    minimum_data_required,
    generated_by,
    generated_at,
    updated_at
  )
  values (
    p_company_id,
    p_period_start,
    p_period_end,
    coalesce(metrics->>'modelVersion', 'mosika-score-v4.0'),
    coalesce((metrics->>'mosikaScore')::int, 300),
    coalesce((metrics->>'rawMosikaScore')::int, coalesce((metrics->>'mosikaScore')::int, 300)),
    coalesce((metrics->>'financialHealth')::numeric, 50),
    coalesce((metrics->>'loanApprovalProbability')::numeric, 0),
    coalesce(metrics->>'riskAssessmentLevel', 'insufficient_data'),
    coalesce((metrics->>'scoreConfidence')::numeric, 0),
    greatest(0, least(1, coalesce(((metrics->>'financialHealth')::numeric / 100.0), 0))),
    coalesce(metrics->'scoreFactors', '{}'::jsonb),
    coalesce(metrics->'scoreWeights', '{}'::jsonb),
    coalesce(metrics->'financialRatios', '{}'::jsonb),
    coalesce(metrics->'stabilityMetrics', '{}'::jsonb),
    coalesce(metrics->'riskIndicators', '{}'::jsonb),
    coalesce(metrics->'scoreDrivers', '{}'::jsonb),
    coalesce(metrics->'minimumDataRequired', '[]'::jsonb),
    auth.uid(),
    now(),
    now()
  )
  on conflict (company_id, period_start, period_end, model_version)
  do update set
    mosika_score = excluded.mosika_score,
    raw_mosika_score = excluded.raw_mosika_score,
    financial_health = excluded.financial_health,
    loan_approval_probability = excluded.loan_approval_probability,
    risk_assessment_level = excluded.risk_assessment_level,
    score_confidence = excluded.score_confidence,
    score_weight = excluded.score_weight,
    score_factors = excluded.score_factors,
    score_weights = excluded.score_weights,
    financial_ratios = excluded.financial_ratios,
    stability_metrics = excluded.stability_metrics,
    risk_indicators = excluded.risk_indicators,
    score_drivers = excluded.score_drivers,
    minimum_data_required = excluded.minimum_data_required,
    generated_by = excluded.generated_by,
    generated_at = excluded.generated_at,
    updated_at = now()
  returning * into snapshot_row;

  return snapshot_row;
end;
$$;

grant execute on function public.record_mosika_score_snapshot(uuid, date, date) to authenticated;

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
  transaction_count int;
  revenue numeric;
  expenses numeric;
  profit numeric;
  tax_due numeric;
  payload jsonb;
begin
  if not private.is_company_member(p_company_id) then
    raise exception 'You do not have access to this company'
      using errcode = '42501';
  end if;

  metrics := public.dashboard_metrics(p_company_id, p_period_start, p_period_end);
  transaction_count := coalesce((metrics->>'transactionCount')::int, 0);

  if transaction_count = 0 then
    raise exception 'Insufficient financial data to generate this report'
      using errcode = '22023',
            detail = 'At least one completed transaction is required for a real accounting report.';
  end if;

  revenue := coalesce((metrics->>'revenue')::numeric, 0);
  expenses := coalesce((metrics->>'expenses')::numeric, 0);
  profit := coalesce((metrics->>'profit')::numeric, 0);
  tax_due := coalesce((metrics->>'taxDue')::numeric, 0);

  title := case p_report_type
    when 'bilan' then 'Bilan comptable'
    when 'resultat' then 'Compte de resultat'
    when 'cashflow' then 'Flux de tresorerie'
    when 'tva' then 'Declaration TVA'
    when 'loan_readiness' then 'Dossier eligibilite financement'
    else 'Synthese dashboard'
  end;

  payload := jsonb_build_object(
    'generatedAt', now(),
    'periodStart', p_period_start,
    'periodEnd', p_period_end,
    'type', p_report_type,
    'title', title,
    'metrics', metrics,
    'sections', case p_report_type
      when 'bilan' then jsonb_build_array(
        jsonb_build_object('name', 'Actif', 'lines', jsonb_build_array(
          jsonb_build_object('label', 'Tresorerie nette estimee', 'amount', greatest(profit, 0)),
          jsonb_build_object('label', 'Creances et actifs operationnels', 'amount', coalesce((metrics#>>'{riskIndicators,outstandingReceivables}')::numeric, 0))
        )),
        jsonb_build_object('name', 'Passif et capitaux propres', 'lines', jsonb_build_array(
          jsonb_build_object('label', 'Obligations fiscales estimees', 'amount', tax_due),
          jsonb_build_object('label', 'Dette et demandes en cours', 'amount', coalesce((metrics#>>'{riskIndicators,debtExposure}')::numeric, 0)),
          jsonb_build_object('label', 'Resultat net conserve', 'amount', profit)
        ))
      )
      when 'resultat' then jsonb_build_array(
        jsonb_build_object('name', 'Produits', 'lines', jsonb_build_array(jsonb_build_object('label', 'Revenus', 'amount', revenue))),
        jsonb_build_object('name', 'Charges', 'lines', jsonb_build_array(jsonb_build_object('label', 'Depenses', 'amount', expenses))),
        jsonb_build_object('name', 'Resultat', 'lines', jsonb_build_array(
          jsonb_build_object('label', 'Resultat net', 'amount', profit),
          jsonb_build_object('label', 'Marge nette (%)', 'amount', coalesce((metrics#>>'{financialRatios,netMargin}')::numeric, 0))
        ))
      )
      when 'cashflow' then jsonb_build_array(
        jsonb_build_object('name', 'Flux operationnels quotidiens', 'lines', metrics->'dailyCashflow'),
        jsonb_build_object('name', 'Tendance mensuelle', 'lines', metrics->'monthlyCashflow'),
        jsonb_build_object('name', 'Variation nette', 'lines', jsonb_build_array(jsonb_build_object('label', 'Cash flow net', 'amount', profit)))
      )
      when 'tva' then jsonb_build_array(
        jsonb_build_object('name', 'TVA', 'lines', jsonb_build_array(
          jsonb_build_object('label', 'TVA collectee', 'amount', coalesce((metrics->>'taxCollected')::numeric, 0)),
          jsonb_build_object('label', 'TVA deductible', 'amount', coalesce((metrics->>'taxDeductible')::numeric, 0)),
          jsonb_build_object('label', 'TVA a payer', 'amount', tax_due)
        ))
      )
      else jsonb_build_array(
        jsonb_build_object('name', 'Synthese scoring', 'lines', jsonb_build_array(
          jsonb_build_object('label', 'Score Mosika', 'amount', coalesce((metrics->>'mosikaScore')::numeric, 0)),
          jsonb_build_object('label', 'Score brut non lisse', 'amount', coalesce((metrics->>'rawMosikaScore')::numeric, 0)),
          jsonb_build_object('label', 'Confiance modele', 'amount', coalesce((metrics->>'scoreConfidence')::numeric, 0)),
          jsonb_build_object('label', 'Sante financiere', 'amount', coalesce((metrics->>'financialHealth')::numeric, 0)),
          jsonb_build_object('label', 'Probabilite approbation pret', 'amount', coalesce((metrics->>'loanApprovalProbability')::numeric, 0))
        )),
        jsonb_build_object('name', 'Facteurs du score', 'lines', metrics->'scoreFactors')
      )
    end,
    'requirements', metrics->'minimumDataRequired',
    'audit', jsonb_build_object(
      'source', 'database',
      'calculationEngine', 'formalio-financial-intelligence-v4',
      'scoreModel', metrics->>'modelVersion',
      'transactionCount', transaction_count
    )
  );

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
    payload,
    auth.uid(),
    now()
  )
  returning * into report_row;

  return report_row;
end;
$$;

grant execute on function public.generate_report(uuid, public.report_type, date, date) to authenticated;
