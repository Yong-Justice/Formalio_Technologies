import { createRequestContext, errorResponse, handleOptions, jsonResponse, readJson, requireCompanyAccess } from '../_shared/http.ts';

type ReportRequest = {
  companyId: string;
  type: 'bilan' | 'resultat' | 'cashflow' | 'tva' | 'loan_readiness' | 'dashboard_summary';
  periodStart: string;
  periodEnd: string;
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    if (req.method !== 'POST') throw new Error('POST is required.');
    const { user, userClient, adminClient } = await createRequestContext(req);
    const body = await readJson<ReportRequest>(req);

    if (!body.companyId || !body.type || !body.periodStart || !body.periodEnd) {
      throw new Error('companyId, type, periodStart, and periodEnd are required.');
    }

    await requireCompanyAccess(adminClient, user.id, body.companyId, ['owner', 'admin', 'accountant']);

    const { data, error } = await userClient.rpc('generate_report', {
      p_company_id: body.companyId,
      p_report_type: body.type,
      p_period_start: body.periodStart,
      p_period_end: body.periodEnd,
    });

    if (error) throw error;
    return jsonResponse(data, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
