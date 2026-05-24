import { repositories } from '@/database/repositories';
import { useAuthStore } from '@/store/authStore';

export async function getTreasuryRecords(userId = useAuthStore.getState().user?.id) {
  if (!userId) return [];
  return repositories.treasury_records.getRecords(userId);
}

export const treasuryRepository = repositories.treasury_records;
