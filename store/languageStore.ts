import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LanguageStore } from '../types';

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      lang: 'ar',
      _hasHydrated: false,
      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),
      toggleLanguage: () => set((state) => ({
        lang: state.lang === 'ar' ? 'en' : 'ar'
      })),
    }),
    {
      name: 'candyhon-lang-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

