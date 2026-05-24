import { getDatabase } from '@/database';
import { getSyncState, repositories, setSyncState } from '@/database/repositories';
import { getJson, queryStorage, storageKeys } from '@/services/storage/mmkv';
import type { Transaction } from '@/types/domain';
import type { StockItem } from '@/store/stockStore';

const STOCK_ITEMS_KEY = 'query.stockItems';

function parseTime(value?: string | null) {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function unitEstimate(item: StockItem) {
  if (item.priceType === 'fixed') return Number(item.unitPrice) || 0;
  return ((Number(item.minPrice) || 0) + (Number(item.maxPrice) || 0)) / 2;
}

async function localRecordExists(tableName: string, id: string, userId: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM ${tableName} WHERE id = ? AND user_id = ?`,
    id,
    userId,
  );
  return Boolean(row);
}

export async function importLegacyCaches(userId: string, companyId?: string | null) {
  const importKey = `legacyImport:${userId}`;
  if (await getSyncState(importKey)) return;

  const stockItems = getJson<StockItem[]>(queryStorage, STOCK_ITEMS_KEY, []);
  const transactions = getJson<Transaction[]>(queryStorage, storageKeys.query.transactions, []);

  for (const item of stockItems) {
    if (await localRecordExists('stock_items', item.id, userId)) continue;
    const createdAt = parseTime(item.createdAt);
    const updatedAt = parseTime(item.updatedAt);
    const price = unitEstimate(item);

    await repositories.stock_items.createRecord({
      id: item.id,
      user_id: userId,
      company_id: companyId ?? null,
      name: item.name,
      current_quantity: item.quantity,
      selling_price_per_unit: price,
      purchase_price_per_unit: price,
      total_stock_value: item.quantity * price,
      is_active: true,
      is_dead_stock: false,
      created_at: createdAt,
      updated_at: updatedAt,
    });
  }

  for (const transaction of transactions) {
    if (await localRecordExists('transactions', transaction.id, userId)) continue;
    const recordedAt = parseTime(transaction.date);
    const deletedAt = transaction.deletedAt ? parseTime(transaction.deletedAt) : null;

    await repositories.transactions.createRecord({
      id: transaction.id,
      user_id: userId,
      company_id: transaction.businessId || companyId || null,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description ?? null,
      payment_method: transaction.paymentMethod ?? null,
      entry_method: 'manual',
      recorded_at: recordedAt,
      is_deleted: Boolean(deletedAt),
      deleted_at: deletedAt,
      created_at: recordedAt,
      updated_at: recordedAt,
    });
  }

  await setSyncState(importKey, JSON.stringify({ stockItems: stockItems.length, transactions: transactions.length }));
  console.debug('[database] Legacy cache import completed', {
    userId,
    stockItems: stockItems.length,
    transactions: transactions.length,
  });
}
