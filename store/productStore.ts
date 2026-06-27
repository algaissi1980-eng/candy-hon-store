import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================
// مخزن المنتجات (Product Store)
// يحفظ المنتجات والتصنيفات في الذاكرة لتجنب
// إعادة الطلب من Supabase عند كل تنقل
// ويدعم Realtime لتحديث المخزون فورياً
// =============================================

// حجم الصفحة — كم منتج نجلب من Supabase في كل طلب
const PAGE_SIZE = 24;

// مدة صلاحية الكاش: 5 دقائق (بالمللي ثانية)
const CACHE_DURATION = 5 * 60 * 1000;

interface ProductStore {
  products: any[];
  categories: string[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  hasMore: boolean;
  _channel: RealtimeChannel | null;

  fetchProducts: () => Promise<void>;
  fetchMore: () => Promise<void>;
  invalidate: () => void;
  retry: () => Promise<void>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetchedAt: null,
  hasMore: true,
  _channel: null,

  // ─── جلب الصفحة الأولى من المنتجات ───
  // ✅ Stale-While-Revalidate: إذا عندنا بيانات قديمة، نعرضها فوراً ونحدّث بالخلفية
  fetchProducts: async () => {
    const { lastFetchedAt, isLoading, products } = get();

    if (isLoading) return;

    // الكاش لسه صالح — لا نطلب
    if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_DURATION) return;

    // ✅ SWR: إذا عندنا منتجات قديمة، لا نعرض skeleton — نحدّث بصمت
    const isBackgroundRefresh = products.length > 0;
    if (!isBackgroundRefresh) {
      set({ isLoading: true, error: null });
    }

    try {
      // نجلب (حجم الصفحة + 1) عشان نعرف إذا فيه صفحة بعدها بدون الحاجة لـ count query
      const [productsResult, settingsResult] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, name, name_ar, name_en, description, price, original_price, image_url, images, is_available, category, stock, allow_preorder, restock_date'
          )
          .range(0, PAGE_SIZE), // نجلب 25 عنصر
        supabase.from('store_settings').select('categories').eq('id', 1).single(),
      ]);

      if (productsResult.error) {
        throw new Error(productsResult.error.message || 'Failed to fetch products');
      }

      let fetchedProducts = productsResult.data || [];
      const hasMoreData = fetchedProducts.length > PAGE_SIZE;

      // إذا رجع 25، نحذف الأخير لأننا بدنا نعرض بس 24
      if (hasMoreData) {
        fetchedProducts = fetchedProducts.slice(0, PAGE_SIZE);
      }

      set({
        products: fetchedProducts,
        categories: settingsResult.data?.categories || [],
        hasMore: hasMoreData,
        lastFetchedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('[ProductStore] Error fetching products:', err);
      set({
        error: err?.message || 'حدث خطأ في تحميل المنتجات',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── جلب المزيد من المنتجات (الصفحة التالية) ───
  fetchMore: async () => {
    const { isLoadingMore, isLoading, hasMore, products } = get();

    if (isLoadingMore || isLoading || !hasMore) return;

    set({ isLoadingMore: true });

    try {
      const from = products.length;
      const to = from + PAGE_SIZE; // نجلب 25 عنصر إضافي

      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, name_ar, name_en, description, price, original_price, image_url, images, is_available, category, stock, allow_preorder, restock_date'
        )
        .range(from, to);

      if (error) {
        throw new Error(error.message || 'Failed to fetch more products');
      }

      let newProducts = data || [];
      const hasMoreData = newProducts.length > PAGE_SIZE;

      if (hasMoreData) {
        newProducts = newProducts.slice(0, PAGE_SIZE);
      }

      set({
        products: [...products, ...newProducts],
        hasMore: hasMoreData,
      });
    } catch (err: any) {
      console.error('[ProductStore] Error fetching more products:', err);
    } finally {
      set({ isLoadingMore: false });
    }
  },

  // إبطال الكاش — يُستخدم بعد تعديل المنتجات من لوحة الإدارة
  invalidate: () => set({ lastFetchedAt: null, hasMore: true }),

  // ✅ إعادة المحاولة — يمسح الخطأ والكاش ويعيد الجلب
  retry: async () => {
    set({ lastFetchedAt: null, error: null, hasMore: true });
    await get().fetchProducts();
  },

  // ─── Realtime Subscription ───────────────────────────────────────────
  subscribeRealtime: () => {
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
            set({
              products: products.map((p) =>
                p.id === newRow.id ? { ...p, ...newRow } : p
              ),
            });
          } else if (eventType === 'INSERT') {
            set({
              products: [newRow, ...products],
            });
          } else if (eventType === 'DELETE') {
            set({
              products: products.filter((p) => p.id !== oldRow.id),
            });
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
