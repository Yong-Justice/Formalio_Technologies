create or replace function public.create_company_with_owner(
  p_name text,
  p_category text default 'Commerce',
  p_country text default 'CM',
  p_currency text default 'XAF'
)
returns public.companies
language plpgsql
set search_path = public, auth
as $function$
declare
  created_company_id uuid := gen_random_uuid();
  created_company public.companies;
begin
  if auth.uid() is null then
    raise exception 'Authentication required to create company'
      using errcode = '28000';
  end if;

  insert into public.companies (
    id,
    owner_user_id,
    created_by,
    name,
    category,
    country,
    currency,
    status
  )
  values (
    created_company_id,
    auth.uid(),
    auth.uid(),
    coalesce(nullif(trim(p_name), ''), 'Mon entreprise'),
    coalesce(nullif(trim(p_category), ''), 'Commerce'),
    coalesce(nullif(trim(p_country), ''), 'CM'),
    coalesce(nullif(trim(p_currency), ''), 'XAF'),
    'active'
  );

  insert into public.company_memberships (company_id, user_id, role, status, accepted_at)
  values (created_company_id, auth.uid(), 'owner', 'active', now())
  on conflict (company_id, user_id) do update
    set role = 'owner',
        status = 'active',
        accepted_at = coalesce(public.company_memberships.accepted_at, now()),
        updated_at = now();

  insert into public.company_settings (company_id, updated_by)
  values (created_company_id, auth.uid())
  on conflict (company_id) do nothing;

  insert into public.subscriptions (company_id, tier, status, current_period_start, current_period_end)
  values (created_company_id, 'free', 'trialing', now(), now() + interval '14 days')
  on conflict (company_id) do nothing;

  select *
  into created_company
  from public.companies
  where id = created_company_id;

  return created_company;
end;
$function$;

grant execute on function public.create_company_with_owner(text, text, text, text) to authenticated;
