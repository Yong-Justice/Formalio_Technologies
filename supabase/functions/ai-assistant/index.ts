import { createRequestContext, errorResponse, handleOptions, jsonResponse, readJson, requireCompanyAccess, HttpError } from '../_shared/http.ts';

type ChatRequest = {
  companyId: string;
  conversationId?: string;
  message: string;
  language?: 'fr' | 'en' | 'pcm';
};

type AssistantReply = {
  content: string;
  quickActions: string[];
  model: string;
  confidence?: number;
};

function numberFrom(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
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

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text;
  return JSON.parse(candidate);
}

function safeQuickActions(actions: unknown, message: string, metrics: Record<string, unknown>) {
  const fromModel = Array.isArray(actions)
    ? actions.map((action) => String(action).trim()).filter(Boolean).slice(0, 5)
    : [];
  if (fromModel.length) return fromModel;

  const lower = message.toLowerCase();
  if (numberFrom(metrics.transactionCount) === 0) return ['Add first transaction', 'Complete profile', 'Explain Mosika Score'];
  if (lower.includes('loan') || lower.includes('credit') || lower.includes('pret') || lower.includes('score')) return ['Improve my score', 'Check loan readiness', 'Review risk factors'];
  if (lower.includes('report') || lower.includes('rapport') || lower.includes('download') || lower.includes('export')) return ['Generate monthly report', 'Explain TVA', 'Summarize cash flow'];
  if (lower.includes('expense') || lower.includes('depense') || lower.includes('dépense')) return ['Analyze expenses', 'Show top categories', 'Find anomalies'];
  return ['Analyze my business', 'Summarize this month', 'Explain my cash flow'];
}

function compactMetrics(metrics: Record<string, unknown>) {
  return {
    revenue: numberFrom(metrics.revenue),
    expenses: numberFrom(metrics.expenses),
    profit: numberFrom(metrics.profit),
    cashFlow: numberFrom(metrics.cashFlow),
    profitMargin: numberFrom(metrics.profitMargin),
    taxCollected: numberFrom(metrics.taxCollected),
    taxDeductible: numberFrom(metrics.taxDeductible),
    taxDue: numberFrom(metrics.taxDue),
    transactionCount: numberFrom(metrics.transactionCount),
    revenueCount: numberFrom(metrics.revenueCount),
    expenseCount: numberFrom(metrics.expenseCount),
    growthRate: numberFrom(metrics.growthRate),
    mosikaScore: numberFrom(metrics.mosikaScore),
    rawMosikaScore: numberFrom(metrics.rawMosikaScore),
    scoreConfidence: numberFrom(metrics.scoreConfidence),
    financialHealth: numberFrom(metrics.financialHealth),
    complianceScore: numberFrom(metrics.complianceScore),
    loanApprovalProbability: numberFrom(metrics.loanApprovalProbability),
    riskAssessmentLevel: metrics.riskAssessmentLevel,
    scoreBand: metrics.scoreBand,
    scoreFactors: metrics.scoreFactors ?? {},
    scoreWeights: metrics.scoreWeights ?? {},
    financialRatios: metrics.financialRatios ?? {},
    stabilityMetrics: metrics.stabilityMetrics ?? {},
    riskIndicators: metrics.riskIndicators ?? {},
    scoreDrivers: metrics.scoreDrivers ?? {},
    minimumDataRequired: metrics.minimumDataRequired ?? [],
    categoryBreakdown: metrics.categoryBreakdown ?? [],
    monthlyCashflow: metrics.monthlyCashflow ?? [],
    modelVersion: metrics.modelVersion,
  };
}

async function buildOpenAIReply(message: string, language: string, context: Record<string, unknown>, history: { role: string; content: string }[]) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new HttpError(503, 'Mosika AI is not configured yet.', {
      requiredSecret: 'OPENAI_API_KEY',
      upgradePoint: 'Set OPENAI_API_KEY in Supabase Edge Function secrets to enable real contextual AI replies.',
    });
  }

  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.5';
  const systemPrompt = [
    'You are Mosika, the secure AI financial controller inside Formalio.',
    'You are not a FAQ bot. Produce a contextual accounting/fintech answer from the provided company data and conversation history.',
    'Use only the supplied company context. Never invent transactions, balances, invoices, reports, eligibility, rates, or tax values.',
    'Apply accounting discipline: distinguish revenue, expenses, profit, cash flow, tax/TVA, receivables, liabilities, anomalies, liquidity, volatility, and score confidence.',
    'When data is insufficient, explain exactly what is missing and what the user should record next.',
    'For Mosika Score explanations, refer to score factors, score weights, score confidence, risk indicators, and minimum data requirements.',
    'Keep the answer concise, practical, and appropriate for a small business owner. Use the requested language.',
    'Return only valid JSON with keys: reply string, quickActions string[], confidence number 0-100.',
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-12).map((entry) => ({
          role: entry.role === 'assistant' ? 'assistant' : 'user',
          content: entry.content,
        })),
        {
          role: 'user',
          content: JSON.stringify({
            language,
            userQuestion: message,
            companyContext: context,
            responseContract: {
              reply: 'string',
              quickActions: ['short action label'],
              confidence: '0-100 numeric confidence in the analysis based on available data',
            },
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, 'Mosika AI provider failed.', await response.text());
  }

  const text = textFromOpenAI(await response.json());
  if (!text) throw new HttpError(502, 'Mosika AI returned an empty response.');

  let parsed: any;
  try {
    parsed = extractJsonObject(text);
  } catch {
    parsed = { reply: text, quickActions: [], confidence: 65 };
  }

  return {
    content: String(parsed.reply ?? parsed.content ?? text).trim(),
    quickActions: safeQuickActions(parsed.quickActions, message, (context.metrics ?? {}) as Record<string, unknown>),
    confidence: Math.max(0, Math.min(100, Math.round(numberFrom(parsed.confidence) || 65))),
    model,
  };
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const startedAt = Date.now();

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'POST is required.');
    const { user, userClient, adminClient } = await createRequestContext(req);
    const body = await readJson<ChatRequest>(req);

    if (!body.companyId || !body.message?.trim()) throw new HttpError(400, 'companyId and message are required.');
    await requireCompanyAccess(adminClient, user.id, body.companyId);

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const periodEnd = now.toISOString().slice(0, 10);

    let conversationId = body.conversationId;
    if (!conversationId) {
      const { data: conversation, error } = await userClient
        .from('ai_conversations')
        .insert({
          company_id: body.companyId,
          title: body.message.slice(0, 64),
          context: { language: body.language ?? 'fr', aiMode: 'contextual-financial-assistant' },
        })
        .select()
        .single();
      if (error) throw error;
      conversationId = conversation.id;
    }

    const [
      metricsResult,
      snapshotResult,
      transactionsResult,
      invoicesResult,
      loanRequestsResult,
      reportsResult,
      analyticsResult,
      scoreHistoryResult,
      previousMessagesResult,
    ] = await Promise.all([
      userClient.rpc('dashboard_metrics', {
        p_company_id: body.companyId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      }),
      userClient.rpc('record_mosika_score_snapshot', {
        p_company_id: body.companyId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      }),
      userClient
        .from('transactions')
        .select('id,type,amount,description,payment_method,transaction_date,reference_number,metadata,categories(name)')
        .eq('company_id', body.companyId)
        .is('deleted_at', null)
        .in('status', ['completed', 'reconciled'])
        .order('transaction_date', { ascending: false })
        .limit(30),
      userClient
        .from('invoices')
        .select('id,invoice_number,status,total,amount_paid,due_date,issue_date,customer_name')
        .eq('company_id', body.companyId)
        .order('issue_date', { ascending: false })
        .limit(20),
      userClient
        .from('loan_requests')
        .select('id,amount,duration_months,status,approval_probability,borrowing_strength_index,submitted_at,expected_review_duration')
        .eq('company_id', body.companyId)
        .order('submitted_at', { ascending: false })
        .limit(10),
      userClient
        .from('reports')
        .select('id,type,title,status,period_start,period_end,generated_at')
        .eq('company_id', body.companyId)
        .order('generated_at', { ascending: false, nullsFirst: false })
        .limit(8),
      userClient
        .from('financial_analytics')
        .select('metric_key,metric_label,metric_value,trend,confidence,payload,period_start,period_end')
        .eq('company_id', body.companyId)
        .order('generated_at', { ascending: false })
        .limit(12),
      userClient
        .from('financial_score_snapshots')
        .select('period_start,period_end,mosika_score,raw_mosika_score,financial_health,loan_approval_probability,risk_assessment_level,score_confidence,score_factors,financial_ratios,risk_indicators,generated_at')
        .eq('company_id', body.companyId)
        .order('period_end', { ascending: false })
        .limit(6),
      userClient
        .from('ai_messages')
        .select('role,content,created_at')
        .eq('conversation_id', conversationId)
        .eq('company_id', body.companyId)
        .order('created_at', { ascending: true })
        .limit(16),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (snapshotResult.error) throw snapshotResult.error;
    if (transactionsResult.error) throw transactionsResult.error;
    if (invoicesResult.error) throw invoicesResult.error;
    if (loanRequestsResult.error) throw loanRequestsResult.error;
    if (reportsResult.error) throw reportsResult.error;
    if (analyticsResult.error) throw analyticsResult.error;
    if (scoreHistoryResult.error) throw scoreHistoryResult.error;
    if (previousMessagesResult.error) throw previousMessagesResult.error;

    const metrics = (metricsResult.data ?? {}) as Record<string, unknown>;
    const context = {
      periodStart,
      periodEnd,
      currency: 'XAF',
      privacyScope: {
        companyId: body.companyId,
        authenticatedUserId: user.id,
        isolation: 'RLS scoped to authenticated company membership',
      },
      metrics: compactMetrics(metrics),
      currentScoreSnapshot: snapshotResult.data,
      scoreHistory: scoreHistoryResult.data ?? [],
      recentTransactions: (transactionsResult.data ?? []).map((transaction: any) => ({
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount ?? 0),
        description: transaction.description,
        category: transaction.categories?.name ?? transaction.metadata?.category ?? 'Autres',
        date: transaction.transaction_date,
        method: transaction.payment_method,
        hasReference: Boolean(transaction.reference_number),
      })),
      invoices: invoicesResult.data ?? [],
      loanRequests: loanRequestsResult.data ?? [],
      reports: reportsResult.data ?? [],
      analytics: analyticsResult.data ?? [],
    };

    const openAIReply = await buildOpenAIReply(
      body.message.trim(),
      body.language ?? 'fr',
      context,
      (previousMessagesResult.data ?? []).map((entry: any) => ({ role: entry.role, content: entry.content })),
    );

    const reply: AssistantReply = {
      content: openAIReply.content,
      quickActions: openAIReply.quickActions,
      model: `openai:${openAIReply.model}`,
      confidence: openAIReply.confidence,
    };

    const { error: userMessageError } = await userClient.from('ai_messages').insert({
      conversation_id: conversationId,
      company_id: body.companyId,
      role: 'user',
      content: body.message.trim(),
    });
    if (userMessageError) throw userMessageError;

    const { data: assistantMessage, error: assistantMessageError } = await userClient
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        company_id: body.companyId,
        role: 'assistant',
        content: reply.content,
        quick_actions: reply.quickActions,
        model: reply.model,
        latency_ms: Date.now() - startedAt,
        metadata: {
          periodStart,
          periodEnd,
          usedOpenAI: true,
          confidence: reply.confidence,
          scoreModel: metrics.modelVersion,
          scoreConfidence: metrics.scoreConfidence,
          contextTables: ['transactions', 'invoices', 'loan_requests', 'reports', 'financial_analytics', 'financial_score_snapshots'],
        },
      })
      .select()
      .single();
    if (assistantMessageError) throw assistantMessageError;

    return jsonResponse({
      conversationId,
      message: assistantMessage,
      reply: reply.content,
      quickActions: reply.quickActions,
      model: reply.model,
      confidence: reply.confidence,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
