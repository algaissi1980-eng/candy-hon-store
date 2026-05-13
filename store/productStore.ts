import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================
// مخزن المنتجات (Product Store)
// يحفظ المنتجات والتصنيفات في الذاكرة لتجنب
// إعادة الطلب من Supabase عند كل تنقل
// ويدعم Realtime لتحديث المخزون فورياً
// =============================================

interface ProductStore {
  products: any[];
  categories: string[];
  isLoading: boolean;
  lastFetchedAt: number | null;
  _channel: RealtimeChannel | null;

  fetchProducts: () => Promise<void>;
  invalidate: () => void;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// مدة صلاحية الكاش: 5 دقائق (بالمللي ثانية) — أطول لتقليل استهلاك الباندويث
const CACHE_DURATION = 5 * 60 * 1000;

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  lastFetchedAt: null,
  _channel: null,

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
    } catch {
      // خطأ في جلب المنتجات — يعيد المحاولة عند التنقل التالي
    } finally {
      set({ isLoading: false });
    }
  },

  // إبطال الكاش — يُستخدم بعد تعديل المنتجات من لوحة الإدارة
  invalidate: () => set({ lastFetchedAt: null }),

  // ─── Realtime Subscription ───────────────────────────────────────────
  // يستمع لتغييرات جدول products مباشرة من Supabase
  // ويُحدّث المنتج المتغير في الذاكرة دون إعادة جلب الكل
  subscribeRealtime: () => {
    // لا تُنشئ subscription جديد إذا كان موجوداً
    if (get()._channel) return;

    const channel = supabase
      .channel('realtime-products-store')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          const { products } = get();

          if (eventType === 'UPDATE') {
            // استبدل المنتج المُحدَّث في المصفوفة مباشرة
            set({
              products: products.map((p) =>
                p.id === newRow.id ? { ...p, ...newRow } : p
              ),
            });
          } else if (eventType === 'INSERT') {
            // أضف المنتج الجديد في البداية (ترتيب أحدث أولاً)
            set({ products: [newRow, ...products] });
          } else if (eventType === 'DELETE') {
            // احذف المنتج من المصفوفة
            set({ products: products.filter((p) => p.id !== oldRow.id) });
          }
        }
      )
      .subscribe();

    set({ _channel: channel });
  },

  unsubscribeRealtime: () => {
    const { _channel } = get();
    if (_channel) {
      supabase.removeChannel(_channel);
      set({ _channel: null });
    }
  },
}));
