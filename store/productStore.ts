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
  error: string | null;
  lastFetchedAt: number | null;
  _channel: RealtimeChannel | null;

  fetchProducts: () => Promise<void>;
  invalidate: () => void;
  retry: () => Promise<void>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// مدة صلاحية الكاش: 5 دقائق (بالمللي ثانية) — أطول لتقليل استهلاك الباندويث
const CACHE_DURATION = 5 * 60 * 1000;

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  _channel: null,

  fetchProducts: async () => {
    const { lastFetchedAt, isLoading } = get();

    // إذا البيانات محملة وما زالت ضمن مدة الصلاحية — لا نطلب من جديد
    if (isLoading) return;
    if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_DURATION) return;

    set({ isLoading: true, error: null });

    try {
      const [productsResult, settingsResult] = await Promise.all([
        supabase.from('products').select(
          'id, name, name_ar, name_en, description, price, original_price, image_url, images, is_available, category, stock, allow_preorder, restock_date'
        ),
        supabase.from('store_settings').select('categories').eq('id', 1).single(),
      ]);

      // ✅ فحص أخطاء Supabase — بدلاً من تجاهلها
      if (productsResult.error) {
        throw new Error(productsResult.error.message || 'Failed to fetch products');
      }

      set({
        products: productsResult.data || [],
        categories: settingsResult.data?.categories || [],
        // ✅ نضع lastFetchedAt فقط عند النجاح — لا نكاش نتيجة فاشلة
        lastFetchedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('[ProductStore] Error fetching products:', err);
      set({
        error: err?.message || 'حدث خطأ في تحميل المنتجات',
        // ✅ لا نضع lastFetchedAt — حتى يعيد المحاولة عند التنقل التالي
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // إبطال الكاش — يُستخدم بعد تعديل المنتجات من لوحة الإدارة
  invalidate: () => set({ lastFetchedAt: null }),

  // ✅ إعادة المحاولة — يمسح الخطأ والكاش ويعيد الجلب
  retry: async () => {
    set({ lastFetchedAt: null, error: null });
    await get().fetchProducts();
  },

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

