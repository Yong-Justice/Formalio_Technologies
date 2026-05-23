export type ClaudeMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function askClaude(_messages: ClaudeMessage[]) {
  return { reply: '' };
}
