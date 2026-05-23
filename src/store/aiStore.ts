import { create } from 'zustand';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface AIState {
  messages: AIMessage[];
  isStreaming: boolean;
  addMessage: (message: AIMessage) => void;
  setStreaming: (value: boolean) => void;
  clear: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message].slice(-20) })),
  setStreaming: (value) => set({ isStreaming: value }),
  clear: () => set({ messages: [] })
}));