-- Enterprise-grade financial intelligence functions for Formalio.
-- These functions remain security-invoker and rely on existing RLS/private
-- company membership checks, so every score/report is scoped to the caller.

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
      date_trunc('month', p_period_end)::date - interval '5 months',
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
      count(t.id)::int as transaction_count
    from months m
    left join all_transactions t
      on date_trunc('month', t.transaction_date)::date = m.month_start
    group by m.month_start
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
      count(*) filter (where status = 'reconciled')::int as reconciled_count
    from scoped_transactions
  ),
  lifetime_totals as (
    select
      coalesce(sum(amount) filter (where type = 'income'), 0)::numeric as lifetime_revenue,
      coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric as lifetime_expenses,
      count(*)::int as lifetime_transaction_count,
      count(*) filter (where type = 'income')::int as lifetime_income_count,
      count(*) filter (where type = 'expense')::int as lifetime_expense_count,
      count(distinct date_trunc('month', transaction_date))::int as active_months,
      count(distinct transaction_date)::int as active_days,
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
  platform_counts as (
    select
      (select count(*)::int from public.reports r where r.company_id = p_company_id and r.status = 'ready') as report_count,
      (select count(*)::int from public.documents d where d.company_id = p_company_id) as document_count,
      (select count(*)::int from public.kyc_verifications k where k.company_id = p_company_id) as kyc_submission_count
  ),
  monthly_stats as (
    select
      coalesce(avg(nullif(revenue, 0)), 0)::numeric as avg_positive_monthly_revenue,
      coalesce(stddev_pop(nullif(revenue, 0)), 0)::numeric as revenue_monthly_stddev,
      count(*) filter (where revenue > 0)::int as revenue_months,
      count(*) filter (where net > 0)::int as positive_cashflow_months,
      coalesce(avg(transaction_count), 0)::numeric as avg_monthly_transaction_count
    from monthly
  ),
  anomaly_stats as (
    select
      count(*) filter (
        where lt.lifetime_transaction_count >= 8
          and lt.ticket_stddev > 0
          and abs(t.amount - lt.avg_ticket) > lt.ticket_stddev * 2.5
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
      )::int as duplicate_reference_count
    from scoped_transactions t
    cross join lifetime_totals lt
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
  factors as (
    select
      pt.*,
      lt.*,
      pp.previous_revenue,
      pp.previous_expenses,
      inv.invoice_count,
      inv.paid_invoice_count,
      inv.outstanding_receivables,
      inv.overdue_invoice_count,
      debt.debt_exposure,
      debt.active_loan_requests,
      pc.report_count,
      pc.document_count,
      pc.kyc_submission_count,
      ms.avg_positive_monthly_revenue,
      ms.revenue_monthly_stddev,
      ms.revenue_months,
      ms.positive_cashflow_months,
      ms.avg_monthly_transaction_count,
      an.amount_anomaly_count,
      an.duplicate_reference_count,
      cp.kyc_status,
      cp.email_verification_status,
      cp.email_verified_at,
      cp.company_created_at,
      greatest(1, current_date - cp.company_created_at) as account_age_days,
      case when pt.revenue = 0 then 0 else (pt.revenue - pt.expenses) / pt.revenue end as period_margin,
      case when lt.lifetime_revenue = 0 then 0 else (lt.lifetime_revenue - lt.lifetime_expenses) / lt.lifetime_revenue end as lifetime_margin,
      case when pp.previous_revenue = 0 and pt.revenue > 0 then 1
           when pp.previous_revenue = 0 then 0
           else (pt.revenue - pp.previous_revenue) / pp.previous_revenue
      end as revenue_growth,
      case
        when ms.avg_positive_monthly_revenue = 0 then 0
        else greatest(0, 1 - least(1, ms.revenue_monthly_stddev / nullif(ms.avg_positive_monthly_revenue, 0)))
      end as revenue_consistency_raw,
      case when inv.invoice_count = 0 then 0.50 else inv.paid_invoice_count::numeric / nullif(inv.invoice_count, 0) end as payment_regularity_raw
    from period_totals pt
    cross join lifetime_totals lt
    cross join previous_period pp
    cross join invoice_stats inv
    cross join debt_stats debt
    cross join platform_counts pc
    cross join monthly_stats ms
    cross join anomaly_stats an
    cross join company_profile cp
  ),
  scoring as (
    select
      *,
      least(1, ln(1 + lifetime_transaction_count)::numeric / ln(61)::numeric) as activity_factor,
      greatest(0, least(1, revenue_consistency_raw)) as revenue_consistency_factor,
      greatest(0, least(1, (lifetime_margin + 0.20) / 0.60)) as profitability_factor,
      case when active_months = 0 then 0 else greatest(0, least(1, positive_cashflow_months::numeric / nullif(active_months, 0))) end as cashflow_factor,
      case when lifetime_revenue = 0 then 0 else greatest(0, least(1, 1 - (lifetime_expenses / nullif(lifetime_revenue, 0)))) end as expense_ratio_factor,
      greatest(0, least(1, (revenue_growth + 0.20) / 0.70)) as growth_factor,
      least(1, account_age_days / 365.0) as stability_factor,
      case when lifetime_revenue = 0 then 0.65 else greatest(0, least(1, 1 - (debt_exposure / nullif(lifetime_revenue, 0)))) end as debt_factor,
      greatest(0, least(1, payment_regularity_raw)) as payment_regularity_factor,
      case when transaction_count = 0 then 1 else greatest(0, least(1, 1 - ((amount_anomaly_count + duplicate_reference_count)::numeric / nullif(transaction_count, 0)))) end as anomaly_factor,
      case when transaction_count = 0 then 0 else greatest(0, least(1, reconciled_count::numeric / nullif(transaction_count, 0))) end as reconciliation_factor,
      (
        case when kyc_status = 'approved' then 0.42 when kyc_status = 'under_review' then 0.24 else 0 end +
        case when email_verified_at is not null or email_verification_status = 'verified' then 0.23 else 0 end +
        least(0.25, document_count / 12.0 * 0.25) +
        least(0.10, report_count / 4.0 * 0.10)
      ) as compliance_factor,
      least(1, report_count / 4.0) as reporting_factor
    from factors
  ),
  weighted as (
    select
      *,
      (
        activity_factor * 0.10 +
        revenue_consistency_factor * 0.12 +
        profitability_factor * 0.13 +
        cashflow_factor * 0.11 +
        expense_ratio_factor * 0.10 +
        growth_factor * 0.08 +
        stability_factor * 0.08 +
        debt_factor * 0.08 +
        payment_regularity_factor * 0.07 +
        anomaly_factor * 0.06 +
        reconciliation_factor * 0.03 +
        compliance_factor * 0.04
      ) as score_weight
    from scoring
  )
  select jsonb_build_object(
    'companyId', p_company_id,
    'periodStart', p_period_start,
    'periodEnd', p_period_end,
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
    'categoryBreakdown', (select rows from category_breakdown),
    'reportCount', coalesce(report_count, 0),
    'documentCount', coalesce(document_count, 0),
    'complianceScore', round(greatest(0, least(1, compliance_factor)) * 100),
    'financialHealth', case when lifetime_transaction_count = 0 then 50 else round(score_weight * 100) end,
    'mosikaScore', case when lifetime_transaction_count = 0 then 300 else round(300 + score_weight * 550) end,
    'loanApprovalProbability', case when lifetime_transaction_count = 0 then 0 else round(greatest(0, least(0.97, 0.18 + score_weight * 0.76 - (1 - debt_factor) * 0.18 - ((amount_anomaly_count + duplicate_reference_count)::numeric * 0.015))) * 100) end,
    'riskAssessmentLevel', case
      when lifetime_transaction_count = 0 then 'insufficient_data'
      when score_weight >= 0.78 and anomaly_factor >= 0.85 then 'low'
      when score_weight >= 0.58 then 'moderate'
      when score_weight >= 0.40 then 'elevated'
      else 'high'
    end,
    'financialRatios', jsonb_build_object(
      'expenseToRevenue', case when revenue = 0 then 0 else round((expenses / revenue) * 100, 2) end,
      'netMargin', case when revenue = 0 then 0 else round(((revenue - expenses) / revenue) * 100, 2) end,
      'debtToRevenue', case when lifetime_revenue = 0 then 0 else round((debt_exposure / lifetime_revenue) * 100, 2) end,
      'reconciliationRate', case when transaction_count = 0 then 0 else round((reconciled_count::numeric / transaction_count) * 100, 2) end,
      'paymentRegularity', round(payment_regularity_factor * 100, 2),
      'revenueVolatility', case when avg_positive_monthly_revenue = 0 then 0 else round((revenue_monthly_stddev / avg_positive_monthly_revenue) * 100, 2) end
    ),
    'scoreFactors', jsonb_build_object(
      'activity', round(activity_factor * 100),
      'revenueConsistency', round(revenue_consistency_factor * 100),
      'profitability', round(profitability_factor * 100),
      'cashflow', round(cashflow_factor * 100),
      'expenseDiscipline', round(expense_ratio_factor * 100),
      'growth', round(growth_factor * 100),
      'stability', round(stability_factor * 100),
      'debtExposure', round(debt_factor * 100),
      'paymentRegularity', round(payment_regularity_factor * 100),
      'anomalyControl', round(anomaly_factor * 100),
      'reconciliation', round(reconciliation_factor * 100),
      'compliance', round(compliance_factor * 100),
      'reporting', round(reporting_factor * 100)
    ),
    'riskIndicators', jsonb_build_object(
      'amountAnomalies', coalesce(amount_anomaly_count, 0),
      'duplicateReferences', coalesce(duplicate_reference_count, 0),
      'overdueInvoices', coalesce(overdue_invoice_count, 0),
      'activeLoanRequests', coalesce(active_loan_requests, 0),
      'outstandingReceivables', coalesce(outstanding_receivables, 0)
    ),
    'emptyState', lifetime_transaction_count = 0,
    'minimumDataRequired', case when lifetime_transaction_count < 3 then jsonb_build_array('Add at least 3 real transactions', 'Add one revenue and one expense', 'Complete profile verification') else '[]'::jsonb end
  )
  from weighted;
$$;

grant execute on function public.dashboard_metrics(uuid, date, date) to authenticated;

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
          jsonb_build_object('label', 'Resultat net conserve', 'amount', profit)
        ))
      )
      when 'resultat' then jsonb_build_array(
        jsonb_build_object('name', 'Produits', 'lines', jsonb_build_array(jsonb_build_object('label', 'Revenus', 'amount', revenue))),
        jsonb_build_object('name', 'Charges', 'lines', jsonb_build_array(jsonb_build_object('label', 'Depenses', 'amount', expenses))),
        jsonb_build_object('name', 'Resultat', 'lines', jsonb_build_array(jsonb_build_object('label', 'Resultat net', 'amount', profit)))
      )
      when 'cashflow' then jsonb_build_array(
        jsonb_build_object('name', 'Flux operationnels', 'lines', metrics->'dailyCashflow'),
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
        jsonb_build_object('name', 'Synthese', 'lines', jsonb_build_array(
          jsonb_build_object('label', 'Score Mosika', 'amount', coalesce((metrics->>'mosikaScore')::numeric, 0)),
          jsonb_build_object('label', 'Sante financiere', 'amount', coalesce((metrics->>'financialHealth')::numeric, 0)),
          jsonb_build_object('label', 'Probabilite approbation pret', 'amount', coalesce((metrics->>'loanApprovalProbability')::numeric, 0))
        ))
      )
    end,
    'requirements', jsonb_build_array(),
    'audit', jsonb_build_object(
      'source', 'database',
      'calculationEngine', 'formalio-financial-intelligence-v3',
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
