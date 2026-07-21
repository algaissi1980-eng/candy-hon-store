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

// أقصى عدد نتائج للبحث/التصنيف — كافٍ لأي تصنيف حالي
const FILTER_LIMIT = 100;

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

  // ─── نتائج البحث/التصنيف من السيرفر ───
  // null = لا يوجد فلتر نشط (نعرض قائمة التصفح العادية)
  filteredResults: any[] | null;
  isFiltering: boolean;
  _filterKey: string | null;

  fetchProducts: () => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchFiltered: (query: string, category: string) => Promise<void>;
  clearFiltered: () => void;
  hydrateFromServer: (products: any[], categories: string[], hasMore: boolean) => void;
  invalidate: () => void;
  retry: () => Promise<void>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// تنظيف نص البحث من محارف PostgREST الخاصة لتجنب كسر الاستعلام
const sanitizeSearch = (q: string) => q.replace(/[%,()\\]/g, ' ').trim();

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetchedAt: null,
  hasMore: true,
  _channel: null,
  filteredResults: null,
  isFiltering: false,
  _filterKey: null,

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
          // ✅ ترتيب ثابت — بدونه Postgres لا يضمن نفس الترتيب بين الطلبات
          // فتتكرر منتجات وتختفي أخرى بين صفحات الـ infinite scroll
          .order('created_at', { ascending: false })
          .order('id', { ascending: true })
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
        // ✅ نفس ترتيب الصفحة الأولى — إلزامي لصحة الـ pagination
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
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

  // ─── البحث/التصنيف من السيرفر ──────────────────────────────────────
  // ✅ يستعلم كامل الكتالوج (230+ منتج) بدل الفلترة على الصفحات المحمّلة فقط
  fetchFiltered: async (query: string, category: string) => {
    const q = sanitizeSearch(query);
    const key = `${q.toLowerCase()}::${category}`;

    // لا فلتر نشط — نرجع لوضع التصفح العادي
    if (!q && category === 'all') {
      set({ filteredResults: null, isFiltering: false, _filterKey: null });
      return;
    }

    // نفس الفلتر السابق — لا نعيد الطلب
    if (get()._filterKey === key && get().filteredResults !== null) return;

    set({ isFiltering: true, _filterKey: key });

    try {
      let request = supabase
        .from('products')
        .select(
          'id, name, name_ar, name_en, description, price, original_price, image_url, images, is_available, category, stock, allow_preorder, restock_date'
        );

      if (category !== 'all') {
        request = request.eq('category', category);
      }
      if (q) {
        request = request.or(
          `name.ilike.%${q}%,name_ar.ilike.%${q}%,name_en.ilike.%${q}%,description.ilike.%${q}%`
        );
      }

      const { data, error } = await request
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .limit(FILTER_LIMIT);

      if (error) throw new Error(error.message);

      // نتجاهل النتيجة إذا تغيّر الفلتر أثناء انتظار الرد (race condition)
      if (get()._filterKey !== key) return;

      set({ filteredResults: data || [], isFiltering: false });
    } catch (err) {
      console.error('[ProductStore] Error fetching filtered products:', err);
      if (get()._filterKey === key) {
        // fallback: نعرض الفلترة المحلية على المنتجات المحمّلة بدل لا شيء
        set({ filteredResults: null, isFiltering: false, _filterKey: null });
      }
    }
  },

  clearFiltered: () => set({ filteredResults: null, isFiltering: false, _filterKey: null }),

  // ─── تهيئة المخزن ببيانات SSR ────────────────────────────────────────
  // تُستدعى من الصفحة الرئيسية عند وصول المنتجات مع الـ HTML
  hydrateFromServer: (products, categories, hasMore) => {
    if (get().products.length > 0) return; // عندنا بيانات أحدث — لا نستبدلها
    set({
      products,
      categories,
      hasMore,
      lastFetchedAt: Date.now(),
    });
  },

  // إبطال الكاش — يُستخدم بعد تعديل المنتجات من لوحة الإدارة
  invalidate: () => set({ lastFetchedAt: null, hasMore: true, filteredResults: null, _filterKey: null }),

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
