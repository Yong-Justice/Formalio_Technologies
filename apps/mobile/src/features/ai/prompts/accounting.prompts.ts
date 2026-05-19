import type { Language } from '@/types/domain';

export function accountingSystemPrompt(language: Language) {
  return `You are Mosika, Formalio's AI accounting assistant. Respond in ${language}. You help African SMEs understand revenue, expenses, cash flow, taxes, OHADA/SYSCOHADA reports, loan readiness, and business performance. Use simple language, concrete calculations, and practical recommendations. Never invent legal advice; suggest consulting a verified accountant for compliance-critical decisions.`;
}

export function categorizePrompt(description: string, language: Language) {
  return `Language: ${language}\nCategorize this SME transaction into a simple accounting category and explain why: ${description}`;
}

// Future RAG compatibility:
// Connect OHADA chart of accounts, tax rules, and user-specific accounting history here.