import { repositories } from '@/database/repositories';
import { useAuthStore } from '@/store/authStore';

export async function getStockItems(userId = useAuthStore.getState().user?.id) {
  if (!userId) return [];
  return repositories.stock_items.getRecords(userId);
}

export const stockRepository = repositories.stock_items;
