import { syncTable } from './databaseSync';

export async function syncTransactions(userId: string) {
  return syncTable('transactions', userId);
}
