import type { Transaction } from '../demoData';

export type TransactionTimeFilter = 'all' | 'morning' | 'afternoon' | 'evening';

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function parseNumberInput(value: string) {
  const cleaned = value.replace(/\s/g, '').replace(/[^\d.,]/g, '');
  const normalized = /^\d{1,3}([,.]\d{3})+$/.test(cleaned)
    ? cleaned.replace(/[,.]/g, '')
    : cleaned.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getTransactionHour(transaction: Transaction) {
  const idSeed = typeof transaction.id === 'number'
    ? transaction.id
    : transaction.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (idSeed * 3 + 7) % 24;
}

export function getTransactionTime(transaction: Transaction) {
  return `${String(getTransactionHour(transaction)).padStart(2, '0')}:15`;
}

export function getTransactionTimeBucket(transaction: Transaction): TransactionTimeFilter {
  const hour = getTransactionHour(transaction);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
