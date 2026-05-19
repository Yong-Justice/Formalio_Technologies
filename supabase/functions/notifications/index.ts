import { createRequestContext, errorResponse, getSearchParam, handleOptions, jsonResponse, readJson, requireCompanyAccess } from '../_shared/http.ts';

type NotificationRequest = {
  companyId?: string;
  userId?: string;
  title?: string;
  body?: string;
  category?: string;
  payload?: Record<string, unknown>;
  notificationId?: string;
  status?: 'unread' | 'read' | 'archived';
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { user, userClient, adminClient } = await createRequestContext(req);

    if (req.method === 'GET') {
      const companyId = getSearchParam(req, 'companyId');
      if (companyId) await requireCompanyAccess(adminClient, user.id, companyId);

      let query = userClient.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
      if (companyId) query = query.eq('company_id', companyId);
      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data ?? []);
    }

    const body = await readJson<NotificationRequest>(req);

    if (req.method === 'PATCH') {
      if (!body.notificationId || !body.status) throw new Error('notificationId and status are required.');
      const { data, error } = await userClient
        .from('notifications')
        .update({ status: body.status, read_at: body.status === 'read' ? new Date().toISOString() : null })
        .eq('id', body.notificationId)
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(data);
    }

    if (req.method !== 'POST') throw new Error('Unsupported method.');
    if (!body.title) throw new Error('title is required.');
    if (body.companyId) await requireCompanyAccess(adminClient, user.id, body.companyId);

    const { data, error } = await userClient
      .from('notifications')
      .insert({
        company_id: body.companyId ?? null,
        user_id: body.userId ?? user.id,
        title: body.title,
        body: body.body ?? null,
        category: body.category ?? 'system',
        payload: body.payload ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return jsonResponse(data, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
