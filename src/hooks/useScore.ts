import { useScoreStore } from '@/store/scoreStore';

export function useScore() {
  return useScoreStore();
}
