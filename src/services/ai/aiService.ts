import { request } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { Language } from '@/types/domain';

export const aiService = {
  categorize(payload: { description: string; amount?: number; userLanguage: Language }) {
    return request<{ category: string; confidence: number; explanation: string }>({
      method: 'POST',
      url: endpoints.ai.categorize,
      data: payload
    });
  },
  chat(payload: { messages: { role: 'user' | 'assistant'; content: string }[]; userLanguage: Language }) {
    // Backend should limit context to last 10 messages and call Claude or another provider.
    return request<{ reply: string }>({ method: 'POST', url: endpoints.ai.chat, data: payload });
  },
  generateDocument(payload: { businessId: string; type: string; period: string; userLanguage: Language }) {
    return request<{ documentId: string; fileUrl?: string; status: 'processing' | 'ready' }>({
      method: 'POST',
      url: endpoints.ai.document,
      data: payload
    });
  }
};