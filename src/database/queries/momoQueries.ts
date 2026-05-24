import { repositories } from '@/database/repositories';
import { useAuthStore } from '@/store/authStore';

export async function getMomoSmsRecords(userId = useAuthStore.getState().user?.id) {
  if (!userId) return [];
  return repositories.momo_sms.getRecords(userId);
}

export const momoSmsRepository = repositories.momo_sms;
