import { createRequestContext, errorResponse, handleOptions, jsonResponse, readJson, requireCompanyAccess, HttpError } from '../_shared/http.ts';

type VoiceRequest = {
  companyId: string;
  audioBase64: string;
  mimeType?: string;
  fileName?: string;
  language?: string;
};

function numberFrom(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function base64ToBytes(value: string) {
  const clean = value.includes(',') ? value.split(',').pop() ?? '' : value;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
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

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Parser model did not return structured JSON.');
  return JSON.parse(match[0]);
}

async function transcribeAudio(body: VoiceRequest) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new HttpError(503, 'Speech-to-text provider is not configured.', {
      requiredSecret: 'OPENAI_API_KEY',
      upgradePoint: 'Set OPENAI_API_KEY and optionally OPENAI_TRANSCRIBE_MODEL in Supabase Edge Function secrets.',
    });
  }

  const model = Deno.env.get('OPENAI_TRANSCRIBE_MODEL') ?? 'gpt-4o-mini-transcribe';
  const mimeType = body.mimeType ?? 'audio/m4a';
  const fileName = body.fileName ?? (mimeType.includes('webm') ? 'voice.webm' : 'voice.m4a');
  const file = new File([base64ToBytes(body.audioBase64)], fileName, { type: mimeType });
  const form = new FormData();
  form.set('model', model);
  form.set('file', file);
  form.set('response_format', 'json');
  form.set('prompt', 'Formalio fintech/accounting transaction notes in French, English, or Cameroonian business context. Preserve amounts, merchants, dates, and payment methods.');
  if (body.language) form.set('language', body.language);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!response.ok) throw new HttpError(502, 'Speech-to-text provider failed.', await response.text());
  const data = await response.json();
  return { transcript: String(data.text ?? '').trim(), provider: `openai:${model}` };
}

async function parseTransaction(transcript: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.2';
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
            'You are a strict accounting transaction parser. Return only JSON. Do not invent values. If amount is unclear set amount to 0 and include a warning.',
        },
        {
          role: 'user',
          content: `Parse this voice transaction into JSON with fields: type income|expense, amount number, description, category, method, confidence 0-100, warnings string[]. Transcript: ${transcript}`,
        },
      ],
    }),
  });
  if (!response.ok) throw new HttpError(502, 'Transaction parser failed.', await response.text());
  const parsed = extractJson(textFromOpenAI(await response.json()));
  return {
    type: parsed.type === 'income' ? 'income' as const : 'expense' as const,
    amount: numberFrom(parsed.amount),
    description: String(parsed.description ?? transcript).slice(0, 180),
    category: String(parsed.category ?? (parsed.type === 'income' ? 'Ventes' : 'Autres')),
    method: String(parsed.method ?? 'Mobile Money'),
    confidence: Math.max(0, Math.min(100, Math.round(numberFrom(parsed.confidence)))),
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
  };
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    if (req.method !== 'POST') throw new Error('POST is required.');
    const { user, adminClient } = await createRequestContext(req);
    const body = await readJson<VoiceRequest>(req);
    if (!body.companyId || !body.audioBase64) throw new HttpError(400, 'companyId and audioBase64 are required.');
    await requireCompanyAccess(adminClient, user.id, body.companyId);

    const transcription = await transcribeAudio(body);
    if (!transcription.transcript) throw new HttpError(422, 'No speech was detected in the recording.');
    const parsed = await parseTransaction(transcription.transcript);

    return jsonResponse({
      transcript: transcription.transcript,
      confidence: parsed.confidence,
      parsed: {
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        method: parsed.method,
      },
      provider: transcription.provider,
      warnings: parsed.warnings,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
