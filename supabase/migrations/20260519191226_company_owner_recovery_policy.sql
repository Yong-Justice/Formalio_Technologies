alter policy "companies_select_member" on public.companies
  using (
    private.is_company_member(id)
    or owner_user_id = (select auth.uid())
  );
