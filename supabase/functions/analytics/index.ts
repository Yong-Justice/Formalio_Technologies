import { createRequestContext, errorResponse, getSearchParam, handleOptions, jsonResponse, readJson, requireCompanyAccess } from '../_shared/http.ts';

type AnalyticsRequest = {
  companyId?: string;
  periodStart?: string;
  periodEnd?: string;
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { user, userClient, adminClient } = await createRequestContext(req);
    const body = req.method === 'GET' ? {} : await readJson<AnalyticsRequest>(req);
    const companyId = body.companyId ?? getSearchParam(req, 'companyId');
    const periodStart = body.periodStart ?? getSearchParam(req, 'periodStart') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const periodEnd = body.periodEnd ?? getSearchParam(req, 'periodEnd') ?? new Date().toISOString().slice(0, 10);

    if (!companyId) throw new Error('companyId is required.');
    await requireCompanyAccess(adminClient, user.id, companyId);

    const { data, error } = await userClient.rpc('dashboard_metrics', {
      p_company_id: companyId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error) throw error;
    return jsonResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
});
