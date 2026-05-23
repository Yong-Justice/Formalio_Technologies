export type ParsedMomoSms = {
  amount: number;
  type: 'income' | 'expense';
  provider: string;
  reference?: string;
};

export function parseMomoSms(_body: string): ParsedMomoSms | null {
  return null;
}
