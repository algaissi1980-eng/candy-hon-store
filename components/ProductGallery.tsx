'use client';
import ProductCard from './ProductCard';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useProductStore } from '../store/productStore';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// ✅ Dynamic import — ProductModal لا يتم تحميله إلا عند النقر على منتج
const ProductModal = dynamic(() => import('./ProductModal'), { ssr: false });

// ✅ #2 Debounce hook — يأخر التنفيذ حتى يتوقف المستخدم عن الكتابة
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductGallery({ products, storeCategories }: {
  products: any[];
  storeCategories: string[];
}) {
  const { lang } = useLanguageStore();
  const { isLoading, isLoadingMore, error, retry, lastFetchedAt, hasMore, fetchMore, totalCount } = useProductStore();
  const searchParams = useSearchParams();

  const isInitialLoad = products.length === 0 && lastFetchedAt === null && !error;
  const showLoading = (isLoading && products.length === 0) || isInitialLoad;
  const router = useRouter();

  const activeCategory = searchParams.get('category') || 'all';

  const setActiveCategory = useCallback((cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') params.delete('category');
    else params.set('category', cat);
    const newUrl = params.toString() ? `?${params.toString()}#menu` : '/#menu';
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ✅ #2 Debounce — ينتظر 300ms بعد ما يوقف المستخدم كتابة
  const debouncedSearch = useDebounce(searchQuery, 300);

  // ✅ #5 Infinite Scroll — Callback Ref (أكثر موثوقية من useEffect)
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();

    if (node) {
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore && !debouncedSearch.trim() && activeCategory === 'all') {
          fetchMore();
        }
      }, { rootMargin: '400px' });
      observer.current.observe(node);
    }
  }, [isLoadingMore, hasMore, debouncedSearch, activeCategory, fetchMore]);

  // تصفية حسب التصنيف أولاً
  const categoryFiltered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  // ✅ تصفية حسب البحث — يستخدم القيمة المُؤجلة (debounced)
  const filteredProducts = debouncedSearch.trim()
    ? categoryFiltered.filter(p => {
        const q = debouncedSearch.trim().toLowerCase();
        const name = (p.name || '').toLowerCase();
        const nameAr = (p.name_ar || '').toLowerCase();
        const nameEn = (p.name_en || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(q) || nameAr.includes(q) || nameEn.includes(q) || desc.includes(q);
      })
    : categoryFiltered;

  const t = {
    all: lang === 'ar' ? 'الكل' : 'All',
    emptyMsg: lang === 'ar' ? 'لا توجد منتجات في هذا التصنيف حالياً ✨' : 'No products available in this category ✨',
    noResults: lang === 'ar' ? 'لا توجد نتائج لـ' : 'No results for',
    loadingMore: lang === 'ar' ? 'جاري التحميل...' : 'Loading...',
    showing: lang === 'ar' ? 'عرض' : 'Showing',
    searchPlaceholder: lang === 'ar' ? 'ابحث عن منتج...' : 'Search products...',
    resultsCount: lang === 'ar' ? 'نتيجة' : 'results',
    errorTitle: lang === 'ar' ? 'حدث خطأ في تحميل المنتجات' : 'Failed to load products',
    retryBtn: lang === 'ar' ? 'إعادة المحاولة' : 'Retry',
    loadingMsg: lang === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...',
  };

  const translateCategory = (cat: string) => {
    if (cat.includes(' / ')) {
      const parts = cat.split(' / ');
      return lang === 'ar' ? parts[0].trim() : parts[1].trim();
    }
    if (lang === 'ar') return cat;
    if (cat.includes('كيك')) return 'Cakes 🍰';
    if (cat.includes('تارت')) return 'Tarts 🥧';
    if (cat.includes('ماكارون')) return 'Macarons 🍪';
    if (cat.includes('مشروبات')) return 'Drinks ☕';
    if (cat.includes('الكل')) return 'All';
    return cat;
  };

  // ─── حالة الخطأ — عرض رسالة مع زر إعادة محاولة ───
  if (error && products.length === 0) {
    return (
      <div className="text-center py-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-5xl mb-6 opacity-40">⚠️</div>
        <h3 className="text-xl font-black text-[var(--dark)] mb-3">{t.errorTitle}</h3>
        <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md mx-auto font-medium">{error}</p>
        <button
          onClick={retry}
          className="bg-[var(--dark)] text-white font-bold px-8 py-3 rounded-2xl hover:bg-[var(--pink)] transition-all shadow-lg text-sm"
        >
          {t.retryBtn}
        </button>
      </div>
    );
  }

  // ─── حالة التحميل — عرض skeleton ───
  if (showLoading) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="aspect-square md:aspect-[4/5] bg-[var(--cream-dark)]" />
              <div className="p-3 md:p-5 space-y-3">
                <div className="h-4 bg-[var(--cream-dark)] rounded-lg w-3/4" />
                <div className="h-3 bg-[var(--cream-dark)] rounded-lg w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-[var(--cream-dark)] rounded-lg w-20" />
                  <div className="h-8 bg-[var(--cream-dark)] rounded-xl w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-[var(--text-muted)] font-bold text-sm mt-8">{t.loadingMsg}</p>
      </div>
    );
  }

  return (
    <div>
      {/* ─── شريط البحث ─── */}
      <div className="max-w-xl mx-auto mb-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="relative group">
          {/* أيقونة البحث */}
          <div className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-5' : 'left-5'} pointer-events-none text-[var(--pink)]/60 group-focus-within:text-[var(--pink)] transition-colors`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full bg-white border-2 border-[var(--pink)]/25 rounded-2xl ${lang === 'ar' ? 'pr-14 pl-14' : 'pl-14 pr-14'} py-4 md:py-5 text-base font-bold text-[var(--dark)] placeholder:text-[var(--text-muted)]/50 placeholder:font-medium outline-none focus:border-[var(--pink)] focus:ring-4 focus:ring-[var(--pink)]/10 transition-all shadow-md hover:shadow-lg hover:border-[var(--pink)]/40`}
          />
          {/* زر المسح — يظهر فقط عند وجود نص */}
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'left-5' : 'right-5'} w-8 h-8 rounded-full bg-[var(--pink)]/10 hover:bg-[var(--pink)]/20 flex items-center justify-center transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[var(--pink)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {/* عداد النتائج عند البحث */}
        <AnimatePresence>
          {debouncedSearch.trim() && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-center text-xs font-bold text-[var(--text-muted)] mt-2"
            >
              {filteredProducts.length} {t.resultsCount}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ─── أزرار التصنيفات ─── */}
      <div className="flex flex-wrap justify-center gap-3 mb-12" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${activeCategory === 'all' ? 'bg-[var(--gold)] text-white shadow-md' : 'bg-white text-[var(--text-muted)] border border-[var(--gold-light)] hover:border-[var(--gold)] hover:text-[var(--gold)]'}`}
        >
          {t.all}
        </button>
        {storeCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${activeCategory === cat ? 'bg-[var(--gold)] text-white shadow-md' : 'bg-white text-[var(--text-muted)] border border-[var(--gold-light)] hover:border-[var(--gold)] hover:text-[var(--gold)]'}`}
          >
            {translateCategory(cat)}
          </button>
        ))}
      </div>

      {/* ─── شبكة المنتجات ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8 w-full" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {filteredProducts.map((product: any, i: number) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            onProductClick={(p) => setSelectedProduct(p)}
          />
        ))}
      </div>

      {/* ✅ #5 Infinite Scroll — sentinel + loading indicator */}
      {hasMore && !debouncedSearch.trim() && activeCategory === 'all' && (
        <div ref={sentinelRef} className="flex flex-col items-center mt-12 gap-4 h-20 justify-center">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)]">
              <span className="w-5 h-5 border-2 border-[var(--cream-dark)] border-t-[var(--pink)] rounded-full animate-spin" />
              {t.loadingMore}
            </div>
          ) : (
             <div className="text-xs font-bold text-[var(--text-muted)] opacity-50">
               {t.showing} {products.length} ...
             </div>
          )}
        </div>
      )}

      {/* رسالة فارغة — تختلف بين البحث والتصنيف */}
      {filteredProducts.length === 0 && !showLoading && !error && (
        <div className="text-center text-[var(--text-muted)] font-bold pt-36 pb-20 text-lg">
          {debouncedSearch.trim()
            ? `${t.noResults} "${debouncedSearch}" 🔍`
            : t.emptyMsg
          }
        </div>
      )}

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
