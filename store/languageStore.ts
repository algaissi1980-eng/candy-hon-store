import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LanguageStore } from '../types';

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      lang: 'ar',
      toggleLanguage: () => set((state) => ({
        lang: state.lang === 'ar' ? 'en' : 'ar'
      })),
    }),
    {
      name: 'candyhon-lang-storage',
    }
  )
);
