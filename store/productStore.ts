import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';

// =============================================
// مخزن المنتجات (Product Store)
// يحفظ المنتجات والتصنيفات في الذاكرة لتجنب
// إعادة الطلب من Supabase عند كل تنقل
// =============================================

interface ProductStore {
  products: any[];
  categories: string[];
  isLoading: boolean;
  lastFetchedAt: number | null;

  fetchProducts: () => Promise<void>;
  invalidate: () => void;
}

// مدة صلاحية الكاش: 2 دقيقة (بالمللي ثانية)
const CACHE_DURATION = 2 * 60 * 1000;

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  lastFetchedAt: null,

  fetchProducts: async () => {
    const { lastFetchedAt, isLoading } = get();

    // إذا البيانات محملة وما زالت ضمن مدة الصلاحية — لا نطلب من جديد
    if (isLoading) return;
    if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_DURATION) return;

    set({ isLoading: true });

    try {
      const [{ data: pData }, { data: sData }] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('store_settings').select('categories').eq('id', 1).single(),
      ]);

      set({
        products: pData || [],
        categories: sData?.categories || [],
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // إبطال الكاش — يُستخدم بعد تعديل المنتجات من لوحة الإدارة
  invalidate: () => set({ lastFetchedAt: null }),
}));
