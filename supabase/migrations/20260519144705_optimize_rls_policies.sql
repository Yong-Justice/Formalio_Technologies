alter policy "profiles_select_self" on public.profiles
  using (id = (select auth.uid()));

alter policy "profiles_insert_self" on public.profiles
  with check (id = (select auth.uid()));

alter policy "profiles_update_self" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy "companies_insert_creator" on public.companies
  with check (owner_user_id = (select auth.uid()) and created_by = (select auth.uid()));

alter policy "memberships_select_company_member" on public.company_memberships
  using (private.is_company_member(company_id) or user_id = (select auth.uid()));

alter policy "user_settings_self" on public.user_settings
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "notifications_select_target" on public.notifications
  using ((user_id = (select auth.uid())) or (company_id is not null and private.is_company_member(company_id)));

alter policy "notifications_insert_member" on public.notifications
  with check ((user_id = (select auth.uid())) or (company_id is not null and private.is_company_member(company_id)));

alter policy "notifications_update_target" on public.notifications
  using ((user_id = (select auth.uid())) or (company_id is not null and private.is_company_member(company_id)))
  with check ((user_id = (select auth.uid())) or (company_id is not null and private.is_company_member(company_id)));

alter policy "device_tokens_self_all" on public.device_push_tokens
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "ai_conversations_member_all" on public.ai_conversations
  using (user_id = (select auth.uid()) and private.is_company_member(company_id))
  with check (user_id = (select auth.uid()) and private.is_company_member(company_id));

drop policy if exists "accounting_entries_accounting_write" on public.accounting_entries;
create policy "accounting_entries_accounting_insert" on public.accounting_entries
  for insert to authenticated
  with check (private.can_manage_accounting(company_id));
create policy "accounting_entries_accounting_update" on public.accounting_entries
  for update to authenticated
  using (private.can_manage_accounting(company_id))
  with check (private.can_manage_accounting(company_id));
create policy "accounting_entries_accounting_delete" on public.accounting_entries
  for delete to authenticated
  using (private.can_manage_accounting(company_id));

drop policy if exists "bank_accounts_manager_write" on public.bank_accounts;
create policy "bank_accounts_manager_insert" on public.bank_accounts
  for insert to authenticated
  with check (private.can_manage_company(company_id));
create policy "bank_accounts_manager_update" on public.bank_accounts
  for update to authenticated
  using (private.can_manage_company(company_id))
  with check (private.can_manage_company(company_id));
create policy "bank_accounts_manager_delete" on public.bank_accounts
  for delete to authenticated
  using (private.can_manage_company(company_id));

drop policy if exists "banking_connections_manager_write" on public.banking_connections;
create policy "banking_connections_manager_insert" on public.banking_connections
  for insert to authenticated
  with check (private.can_manage_company(company_id));
create policy "banking_connections_manager_update" on public.banking_connections
  for update to authenticated
  using (private.can_manage_company(company_id))
  with check (private.can_manage_company(company_id));
create policy "banking_connections_manager_delete" on public.banking_connections
  for delete to authenticated
  using (private.can_manage_company(company_id));

drop policy if exists "cashflow_accounting_write" on public.cash_flow_snapshots;
create policy "cashflow_accounting_insert" on public.cash_flow_snapshots
  for insert to authenticated
  with check (private.can_manage_accounting(company_id));
create policy "cashflow_accounting_update" on public.cash_flow_snapshots
  for update to authenticated
  using (private.can_manage_accounting(company_id))
  with check (private.can_manage_accounting(company_id));
create policy "cashflow_accounting_delete" on public.cash_flow_snapshots
  for delete to authenticated
  using (private.can_manage_accounting(company_id));

drop policy if exists "company_settings_write_manager" on public.company_settings;
create policy "company_settings_insert_manager" on public.company_settings
  for insert to authenticated
  with check (private.can_manage_company(company_id));
create policy "company_settings_update_manager" on public.company_settings
  for update to authenticated
  using (private.can_manage_company(company_id))
  with check (private.can_manage_company(company_id));
create policy "company_settings_delete_manager" on public.company_settings
  for delete to authenticated
  using (private.can_manage_company(company_id));

drop policy if exists "analytics_accounting_write" on public.financial_analytics;
create policy "analytics_accounting_insert" on public.financial_analytics
  for insert to authenticated
  with check (private.can_manage_accounting(company_id));
create policy "analytics_accounting_update" on public.financial_analytics
  for update to authenticated
  using (private.can_manage_accounting(company_id))
  with check (private.can_manage_accounting(company_id));
create policy "analytics_accounting_delete" on public.financial_analytics
  for delete to authenticated
  using (private.can_manage_accounting(company_id));

drop policy if exists "subscriptions_write_manager" on public.subscriptions;
create policy "subscriptions_insert_manager" on public.subscriptions
  for insert to authenticated
  with check (private.can_manage_company(company_id));
create policy "subscriptions_update_manager" on public.subscriptions
  for update to authenticated
  using (private.can_manage_company(company_id))
  with check (private.can_manage_company(company_id));
create policy "subscriptions_delete_manager" on public.subscriptions
  for delete to authenticated
  using (private.can_manage_company(company_id));
