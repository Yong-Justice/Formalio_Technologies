import { syncTable } from './databaseSync';

export async function syncStock(userId: string) {
  return syncTable('stock_items', userId);
}
