import { createRequestContext, errorResponse, handleOptions, jsonResponse, readJson, requireCompanyAccess, HttpError } from '../_shared/http.ts';

type OcrRequest = {
  companyId: string;
  imageBase64?: string;
  imagePath?: string;
  mimeType?: string;
  fileName?: string;
  sourcePlatform?: string;
  source?: string;
  merchantHint?: string;
  autoCreateTransaction?: boolean;
};

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function numberFrom(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeMimeType(value?: string) {
  const normalized = String(value ?? 'image/jpeg').toLowerCase();
  return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
}

function estimateBase64Bytes(value: string) {
  const cleaned = value.replace(/^data:[^,]+,/, '').replace(/\s/g, '');
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
}

function validateOcrImage(body: OcrRequest) {
  if (!body.imageBase64) throw new HttpError(400, 'imageBase64 is required for OCR processing.');
  const mimeType = normalizeMimeType(body.mimeType);
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new HttpError(415, 'Unsupported OCR image format.', {
      supported: Array.from(SUPPORTED_IMAGE_TYPES),
      received: mimeType,
    });
  }
  const byteLength = estimateBase64Bytes(body.imageBase64);
  if (byteLength > MAX_IMAGE_BYTES) {
    throw new HttpError(413, 'OCR image is too large.', {
      maxBytes: MAX_IMAGE_BYTES,
      receivedBytes: byteLength,
    });
  }
  return { mimeType, imageBase64: body.imageBase64.replace(/^data:[^,]+,/, '').replace(/\s/g, '') };
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('OCR model did not return structured JSON.');
  return JSON.parse(match[0]);
}

function textFromOpenAI(data: any) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = Array.isArray(data?.output) ? data.output : [];
  return parts
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .map((content) => content?.text ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();
}

async function runOpenAIOcr(body: OcrRequest) {
  const { mimeType, imageBase64 } = validateOcrImage(body);
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new HttpError(503, 'OCR provider is not configured.', {
      requiredSecret: 'OPENAI_API_KEY',
      upgradePoint: 'Set OPENAI_API_KEY and optionally OPENAI_VISION_MODEL in Supabase Edge Function secrets.',
    });
  }

  const model = Deno.env.get('OPENAI_VISION_MODEL') ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.2';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'You are an enterprise OCR accounting extraction engine. Return only valid JSON. Extract receipt/invoice/accounting data. Never invent values; if uncertain use null and lower confidence.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Extract: ticketNumber, amount, date ISO yyyy-mm-dd, merchant, referenceNumber, transactionDetails, type income|expense, category, method, taxAmount, confidence 0-100. Use Central Africa fintech/accounting context.',
            },
            {
              type: 'input_image',
              image_url: `data:${mimeType};base64,${imageBase64}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, 'OCR provider failed.', await response.text());
  }

  const parsed = extractJson(textFromOpenAI(await response.json()));
  return {
    ticketNumber: String(parsed.ticketNumber ?? parsed.invoiceNumber ?? `DOC-${Date.now().toString().slice(-8)}`),
    amount: numberFrom(parsed.amount),
    date: String(parsed.date ?? new Date().toISOString().slice(0, 10)),
    merchant: String(parsed.merchant ?? body.merchantHint ?? 'Marchand detecte'),
    referenceNumber: String(parsed.referenceNumber ?? ''),
    transactionDetails: String(parsed.transactionDetails ?? parsed.details ?? ''),
    type: parsed.type === 'income' ? 'income' as const : 'expense' as const,
    category: String(parsed.category ?? 'Achats'),
    method: String(parsed.method ?? 'Mobile Money'),
    taxAmount: numberFrom(parsed.taxAmount),
    confidence: Math.max(0, Math.min(100, Math.round(numberFrom(parsed.confidence)))),
    provider: `openai:${model}`,
    imagePath: body.imagePath,
  };
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
    const extracted = await runOpenAIOcr(body);

    let transaction = null;
    if (body.autoCreateTransaction) {
      if (!extracted.amount || extracted.confidence < 60) {
        throw new HttpError(422, 'OCR confidence is too low to auto-create a transaction.', { confidence: extracted.confidence });
      }
      const { data, error } = await userClient
        .from('transactions')
        .insert({
          company_id: body.companyId,
          type: extracted.type,
          amount: extracted.amount,
          description: extracted.transactionDetails || `Document OCR - ${extracted.merchant}`,
          merchant_name: extracted.merchant,
          payment_method: extracted.method,
          reference_number: extracted.referenceNumber || null,
          ticket_number: extracted.ticketNumber,
          occurred_at: `${extracted.date}T00:00:00.000Z`,
          transaction_date: extracted.date,
          tax_amount: extracted.taxAmount ?? 0,
          ocr_payload: extracted,
          metadata: { category: extracted.category, source: 'ocr-ticket' },
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
