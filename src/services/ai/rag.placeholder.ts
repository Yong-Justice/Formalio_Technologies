// Future RAG integration point.
// Recommended pipeline:
// 1. Index OHADA/SYSCOHADA rules, tax guides, user reports, and anonymized SME benchmarks.
// 2. Retrieve relevant snippets server-side.
// 3. Send snippets to Claude/OpenAI from backend only.
// 4. Return sanitized summaries to this mobile client.

export interface RetrievedContext {
  id: string;
  source: 'ohada' | 'tax' | 'user-report' | 'benchmark';
  title: string;
  content: string;
}