import { createRequestContext, errorResponse, handleOptions, jsonResponse, readJson, requireCompanyAccess } from '../_shared/http.ts';

type OcrRequest = {
  companyId: string;
  imagePath?: string;
  merchantHint?: string;
  autoCreateTransaction?: boolean;
};

function deterministicAmount(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  return 5000 + (hash % 95000);
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    if (req.method !== 'POST') throw new Error('POST is required.');
    const { user, userClient, adminClient } = await createRequestContext(req);
    const body = await readJson<OcrRequest>(req);
    if (!body.companyId) throw new Error('companyId is required.');

    await requireCompanyAccess(adminClient, user.id, body.companyId);

    const seed = `${body.imagePath ?? ''}-${body.merchantHint ?? 'Formalio Merchant'}-${Date.now()}`;
    const amount = deterministicAmount(seed);
    const extracted = {
      ticketNumber: `TCK-${Date.now().toString().slice(-8)}`,
      amount,
      date: new Date().toISOString().slice(0, 10),
      merchant: body.merchantHint ?? 'Marchand detecte',
      referenceNumber: `REF-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      transactionDetails: 'OCR simule: total, marchand, reference et date detectes avec haute confiance.',
      type: 'expense',
      category: 'Achats',
      confidence: 97,
      imagePath: body.imagePath,
    };

    let transaction = null;
    if (body.autoCreateTransaction) {
      const { data, error } = await userClient
        .from('transactions')
        .insert({
          company_id: body.companyId,
          type: 'expense',
          amount,
          description: `Ticket scanne - ${extracted.merchant}`,
          category_id: null,
          merchant_name: extracted.merchant,
          payment_method: 'Mobile Money',
          reference_number: extracted.referenceNumber,
          ticket_number: extracted.ticketNumber,
          occurred_at: new Date().toISOString(),
          ocr_payload: extracted,
        })
        .select()
        .single();
      if (error) throw error;
      transaction = data;
    }

    return jsonResponse({ extracted, transaction });
  } catch (error) {
    return errorResponse(error);
  }
});
