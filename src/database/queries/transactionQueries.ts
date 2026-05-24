import { repositories } from '@/database/repositories';
import { useAuthStore } from '@/store/authStore';

export async function getTransactions(userId = useAuthStore.getState().user?.id) {
  if (!userId) return [];
  return repositories.transactions.getRecords(userId);
}

export const transactionRepository = repositories.transactions;
