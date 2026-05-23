import { create } from 'zustand';

type ScoreState = {
  score: number;
  setScore: (score: number) => void;
};

export const useScoreStore = create<ScoreState>((set) => ({
  score: 0,
  setScore: (score) => set({ score }),
}));
