import { repositories } from '@/database/repositories';
import { useAuthStore } from '@/store/authStore';

export async function getScoreRecords(userId = useAuthStore.getState().user?.id) {
  if (!userId) return [];
  return repositories.mosika_scores.getRecords(userId);
}

export const scoreRepository = repositories.mosika_scores;
