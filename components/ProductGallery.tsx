'use client';
import ProductCard from './ProductCard';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useProductStore } from '../store/productStore';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// ✅ Dynamic import — ProductModal لا يتم تحميله إلا عند النقر على منتج
const ProductModal = dynamic(() => import('./ProductModal'), { ssr: false });

// ✅ Debounce hook — يأخر التنفيذ حتى يتوقف المستخدم عن الكتابة
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
  const { isLoading, isLoadingMore, error, retry, lastFetchedAt, hasMore, fetchMore, filteredResults, isFiltering, fetchFiltered } = useProductStore();
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

  const debouncedSearch = useDebounce(searchQuery, 300);

  // ✅ Infinite Scroll — Callback Ref
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

  // ✅ البحث والتصنيف يستعلمان السيرفر (كامل الكتالوج)
  const hasActiveFilter = !!debouncedSearch.trim() || activeCategory !== 'all';

  useEffect(() => {
    fetchFiltered(debouncedSearch.trim(), activeCategory);
  }, [debouncedSearch, activeCategory, fetchFiltered]);

  // فلترة محلية فورية — تُعرض كنتيجة مبدئية حتى يصل رد السيرفر
  const localFiltered = (() => {
    const categoryFiltered = activeCategory === 'all'
      ? products
      : products.filter(p => p.category === activeCategory);
    if (!debouncedSearch.trim()) return categoryFiltered;
    const q = debouncedSearch.trim().toLowerCase();
    return categoryFiltered.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.name_ar || '').toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  })();

  // نتائج السيرفر لها الأولوية عند وجود فلتر نشط
  const filteredProducts = hasActiveFilter && filteredResults !== null ? filteredResults : localFiltered;

  const t = {
    all: lang === 'ar' ? 'الكل' : 'All',
    emptyMsg: lang === 'ar' ? 'لا توجد منتجات في هذا التصنيف حالياً' : 'No products in this category yet',
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
    return cat;
  };

  const chipBase = 'shrink-0 h-10 md:h-11 px-5 rounded-full font-bold text-[13px] md:text-sm transition-colors duration-150 cursor-pointer';
  const chipActive = 'bg-[var(--pink-600)] text-white';
  const chipIdle = 'bg-[var(--surface)] text-[var(--ink-700)] border border-[var(--border)] hover:border-[var(--pink-400)]';

  // ─── حالة الخطأ ───
  if (error && products.length === 0) {
    return (
      <div className="text-center py-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <h3 className="text-xl font-extrabold text-[var(--ink-900)] mb-3">{t.errorTitle}</h3>
        <p className="text-sm text-[var(--ink-500)] mb-6 max-w-md mx-auto font-medium">{error}</p>
        <button
          onClick={retry}
          className="h-12 px-8 bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white font-bold rounded-[var(--radius-md)] transition-colors duration-150 text-sm"
        >
          {t.retryBtn}
        </button>
      </div>
    );
  }

  // ─── حالة التحميل — skeleton ───
  if (showLoading) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden animate-pulse">
              <div className="aspect-square bg-[var(--pink-50)]" />
              <div className="p-3 md:p-4 space-y-2.5">
                <div className="h-4 bg-[var(--pink-50)] rounded-lg w-3/4" />
                <div className="h-3 bg-[var(--pink-50)] rounded-lg w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-[var(--pink-50)] rounded-lg w-16" />
                  <div className="h-11 w-11 bg-[var(--pink-50)] rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-[var(--ink-500)] font-bold text-sm mt-8">{t.loadingMsg}</p>
      </div>
    );
  }

  return (
    <div>
      {/* ─── شريط البحث — 48px ─── */}
      <div className="max-w-xl mx-auto mb-5 md:mb-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="relative">
          <span className="absolute top-1/2 -translate-y-1/2 start-4 pointer-events-none text-[var(--ink-500)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full h-12 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] ps-12 pe-12 text-[15px] font-medium text-[var(--ink-900)] placeholder:text-[var(--ink-500)] outline-none focus:border-[var(--pink-400)] focus:ring-2 focus:ring-[var(--pink-100)] transition-[border-color,box-shadow] duration-150"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
              aria-label="Clear search"
              className="absolute top-1/2 -translate-y-1/2 end-2 w-9 h-9 rounded-full hover:bg-[var(--pink-50)] flex items-center justify-center transition-colors duration-150 fade-in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[var(--pink-600)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {debouncedSearch.trim() && (
          <p className="text-center text-xs font-bold text-[var(--ink-500)] mt-2 fade-in">
            {filteredProducts.length} {t.resultsCount}
          </p>
        )}
      </div>

      {/* ─── التصنيفات — pills بتمرير أفقي على الموبايل ─── */}
      <div
        className="flex md:flex-wrap md:justify-center gap-2 md:gap-3 mb-6 md:mb-10 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <button
          onClick={() => setActiveCategory('all')}
          className={`${chipBase} ${activeCategory === 'all' ? chipActive : chipIdle}`}
        >
          {t.all}
        </button>
        {storeCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`${chipBase} ${activeCategory === cat ? chipActive : chipIdle}`}
          >
            {translateCategory(cat)}
          </button>
        ))}
      </div>

      {/* ─── شبكة المنتجات ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5 w-full" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {filteredProducts.map((product: any, i: number) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            onProductClick={(p) => setSelectedProduct(p)}
          />
        ))}
      </div>

      {/* ✅ Infinite Scroll — sentinel + مؤشر تحميل */}
      {hasMore && !debouncedSearch.trim() && activeCategory === 'all' && (
        <div ref={sentinelRef} className="flex flex-col items-center mt-10 gap-4 h-20 justify-center">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-500)]">
              <span className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--pink-600)] rounded-full animate-spin" />
              {t.loadingMore}
            </div>
          ) : (
            <div className="text-xs font-bold text-[var(--ink-500)]">
              {t.showing} {products.length} ...
            </div>
          )}
        </div>
      )}

      {/* مؤشر انتظار نتائج السيرفر — يظهر فقط إذا الفلترة المحلية فارغة */}
      {isFiltering && filteredProducts.length === 0 && (
        <div className="flex justify-center pt-24 pb-16">
          <span className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--pink-600)] rounded-full animate-spin" />
        </div>
      )}

      {/* رسالة فارغة — تختلف بين البحث والتصنيف */}
      {filteredProducts.length === 0 && !showLoading && !error && !isFiltering && (
        <div className="text-center text-[var(--ink-500)] font-bold pt-28 pb-16 text-base">
          {debouncedSearch.trim()
            ? `${t.noResults} "${debouncedSearch}"`
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
