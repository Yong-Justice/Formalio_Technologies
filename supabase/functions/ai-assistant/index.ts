import { createRequestContext, errorResponse, handleOptions, jsonResponse, readJson, requireCompanyAccess } from '../_shared/http.ts';

type ChatRequest = {
  companyId: string;
  conversationId?: string;
  message: string;
  language?: 'fr' | 'en' | 'pcm';
};

function formatFCFA(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

function buildAssistantReply(message: string, metrics: Record<string, number | string | null>) {
  const lower = message.toLowerCase();
  const revenue = Number(metrics.revenue ?? 0);
  const expenses = Number(metrics.expenses ?? 0);
  const profit = Number(metrics.profit ?? 0);
  const healthScore = Number(metrics.healthScore ?? 0);

  if (lower.includes('loan') || lower.includes('credit') || lower.includes('pret') || lower.includes('eligib')) {
    return {
      content: `Votre activite montre un profit net de ${formatFCFA(profit)} et un score sante estime a ${healthScore}%. Pour ameliorer votre dossier de pret, gardez votre KYC a jour, documentez les revenus recurrents et maintenez les sorties stock sous controle.`,
      quickActions: ['Check loan eligibility', 'Open loan tracker', 'Improve my score'],
    };
  }

  if (lower.includes('expense') || lower.includes('depense')) {
    return {
      content: `Depenses de la periode: ${formatFCFA(expenses)}. Je recommande de surveiller les achats stock, le transport et les charges fixes, puis de creer une alerte si une categorie depasse son niveau habituel.`,
      quickActions: ['Show spending trend', 'Set expense alert', "Summarize today's transactions"],
    };
  }

  if (lower.includes('profit') || lower.includes('benef')) {
    return {
      content: `Profit net estime: ${formatFCFA(profit)}.\n\nRevenus: ${formatFCFA(revenue)}\nDepenses: ${formatFCFA(expenses)}\nMarge: ${revenue ? Math.round((profit / revenue) * 100) : 0}%`,
      quickActions: ['Analyze my business', 'Download monthly report', 'Show cash flow risk'],
    };
  }

  if (lower.includes('report') || lower.includes('rapport') || lower.includes('download')) {
    return {
      content: 'Je peux generer un bilan, un compte de resultat, un flux de tresorerie ou une declaration TVA a partir des transactions reelles de votre entreprise.',
      quickActions: ['Download monthly report', 'Generate TVA report', 'Summarize reports'],
    };
  }

  return {
    content: `Voici la lecture Mosika: revenus ${formatFCFA(revenue)}, depenses ${formatFCFA(expenses)}, profit ${formatFCFA(profit)}. Sante financiere estimee: ${healthScore}%. Voulez-vous que j'analyse les depenses, la tresorerie ou l'eligibilite au financement ?`,
    quickActions: ['Show my expenses', 'How much profit did I make?', 'Check loan eligibility'],
  };
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    if (req.method !== 'POST') throw new Error('POST is required.');
    const { user, userClient, adminClient } = await createRequestContext(req);
    const body = await readJson<ChatRequest>(req);

    if (!body.companyId || !body.message?.trim()) throw new Error('companyId and message are required.');
    await requireCompanyAccess(adminClient, user.id, body.companyId);

    let conversationId = body.conversationId;
    if (!conversationId) {
      const { data: conversation, error } = await userClient
        .from('ai_conversations')
        .insert({
          company_id: body.companyId,
          title: body.message.slice(0, 64),
          context: { language: body.language ?? 'fr' },
        })
        .select()
        .single();
      if (error) throw error;
      conversationId = conversation.id;
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const periodEnd = now.toISOString().slice(0, 10);
    const { data: metrics, error: metricsError } = await userClient.rpc('dashboard_metrics', {
      p_company_id: body.companyId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });
    if (metricsError) throw metricsError;

    const reply = buildAssistantReply(body.message, metrics ?? {});

    const { error: userMessageError } = await userClient.from('ai_messages').insert({
      conversation_id: conversationId,
      company_id: body.companyId,
      role: 'user',
      content: body.message,
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
        model: 'formalio-rules-v1',
        metadata: { metrics },
      })
      .select()
      .single();
    if (assistantMessageError) throw assistantMessageError;

    return jsonResponse({ conversationId, message: assistantMessage, reply: reply.content, quickActions: reply.quickActions });
  } catch (error) {
    return errorResponse(error);
  }
});
