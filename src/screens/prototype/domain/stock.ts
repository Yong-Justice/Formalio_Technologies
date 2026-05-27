import type { ExpenseItem, FicheData, StockEntry } from '@/types/fiche.types';
import type { StockItem } from '@/store/stockStore';
import type { Transaction } from '../demoData';
import { formatFCFA } from './formatters';

export function formatStockPrice(item: StockItem) {
  if (item.priceType === 'fixed') return formatFCFA(item.unitPrice ?? 0);
  return `~${formatFCFA(item.minPrice ?? 0).replace(' FCFA', '')} - ${formatFCFA(item.maxPrice ?? 0)}`;
}

export function formatStockCompactValue(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${(value / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}M FCFA`;
  if (abs >= 1000) return `${Math.round(value / 1000)}k FCFA`;
  return formatFCFA(value);
}

export function stockUpdatedAtMs(item: StockItem) {
  const parsed = new Date(item.updatedAt).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortStockItems(items: StockItem[]) {
  return [...items].sort((a, b) => stockUpdatedAtMs(b) - stockUpdatedAtMs(a));
}

export function getStockMarketFlags(item: StockItem) {
  const flags: { label: string; tone: 'gold' | 'red' | 'blue' }[] = [];
  const quantity = Number(item.quantity) || 0;
  if (quantity <= 0) {
    flags.push({ label: 'Rupture', tone: 'red' });
  } else if (quantity <= 5) {
    flags.push({ label: 'Stock presque fini', tone: 'gold' });
  }

  const ageDays = Math.floor((Date.now() - stockUpdatedAtMs(item)) / (24 * 60 * 60 * 1000));
  if (ageDays >= 14) {
    flags.push({ label: `Immobile ${Math.floor(ageDays / 7)} sem.`, tone: 'blue' });
  }

  return flags;
}

export function getStockEntryQuantity(entry: StockEntry, mode: 'initial' | 'final') {
  const totalEntrees = (entry.entrees || []).reduce((sum, item) => sum + (Number(item.quantite) || 0), 0);
  if (mode === 'final' && entry.finalStockCounted) return Math.max(0, Number(entry.quantiteFermeture) || 0);
  return Math.max(0, (Number(entry.quantiteOuverture) || 0) + totalEntrees);
}

export function getFicheStockItems(data: Partial<FicheData>) {
  return data.stockItems || [];
}

export function mapFicheExpenseToTransaction(expense: ExpenseItem, fallbackIndex: number): Transaction {
  return {
    id: `fiche-expense-${expense.id || `${Date.now()}-${fallbackIndex}`}`,
    date: expense.date || new Date().toISOString().slice(0, 10),
    description: expense.description || 'Depense fiche',
    category: expense.category,
    type: 'expense',
    amount: Number(expense.montant) || 0,
    method: 'Fiche',
    status: 'completed',
  };
}
