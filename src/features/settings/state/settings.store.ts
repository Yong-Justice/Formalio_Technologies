import { create } from 'zustand';
import { getJson, setJson, storageKeys } from '@/services/storage/mmkv';
import type { Language } from '@/types/domain';

interface SettingsState {
  language: Language;
  isDarkMode: boolean;
  setLanguage: (language: Language) => void;
  setDarkMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: getJson<Language>(storageKeys.language, 'fr'),
  isDarkMode: false,
  setLanguage(language) {
    setJson(storageKeys.language, language);
    set({ language });
  },
  setDarkMode(enabled) {
    set({ isDarkMode: enabled });
  }
}));