'use client';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductGallery({ products, storeCategories }: {
  products: any[];
  storeCategories: string[];
}) {
  const { lang } = useLanguageStore();
  const searchParams = useSearchParams();
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
  const [visibleCount, setVisibleCount] = useState(24);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVisibleCount(24);
  }, [activeCategory, searchQuery]);

  // تصفية حسب التصنيف أولاً
  const categoryFiltered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  // ثم تصفية حسب البحث
  const filteredProducts = searchQuery.trim()
    ? categoryFiltered.filter(p => {
        const q = searchQuery.trim().toLowerCase();
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
    loadMore: lang === 'ar' ? 'عرض المزيد ⬇️' : 'Load More ⬇️',
    showing: lang === 'ar' ? 'عرض' : 'Showing',
    outOf: lang === 'ar' ? 'من أصل' : 'out of',
    searchPlaceholder: lang === 'ar' ? 'ابحث عن منتج...' : 'Search products...',
    resultsCount: lang === 'ar' ? 'نتيجة' : 'results',
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

  return (
    <div>
      {/* ─── شريط البحث ─── */}
      <div className="max-w-md mx-auto mb-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="relative group">
          {/* أيقونة البحث */}
          <div className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-4' : 'left-4'} pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--pink)] transition-colors`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full bg-white/80 backdrop-blur-sm border-2 border-[var(--cream-dark)] rounded-2xl ${lang === 'ar' ? 'pr-12 pl-12' : 'pl-12 pr-12'} py-3.5 text-sm font-medium text-[var(--dark)] placeholder:text-[var(--text-muted)]/60 outline-none focus:border-[var(--pink)] focus:ring-2 focus:ring-[var(--pink)]/15 transition-all shadow-sm hover:shadow-md`}
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
                className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'left-4' : 'right-4'} w-6 h-6 rounded-full bg-[var(--cream-dark)] hover:bg-[var(--pink)]/20 flex items-center justify-center transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-[var(--text-muted)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {/* عداد النتائج عند البحث */}
        <AnimatePresence>
          {searchQuery.trim() && (
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
        {filteredProducts.slice(0, visibleCount).map((product: any, i: number) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            onProductClick={(p) => setSelectedProduct(p)}
          />
        ))}
      </div>

      {filteredProducts.length > visibleCount && (
        <div className="flex flex-col items-center mt-12 gap-4">
          <p className="text-xs font-bold text-[var(--text-muted)]">
            {t.showing} {Math.min(visibleCount, filteredProducts.length)} {t.outOf} {filteredProducts.length}
          </p>
          <button
            onClick={() => setVisibleCount(prev => prev + 24)}
            className="bg-white border-2 border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-white px-8 py-3 rounded-full font-black shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          >
            {t.loadMore}
          </button>
        </div>
      )}

      {/* رسالة فارغة — تختلف بين البحث والتصنيف */}
      {filteredProducts.length === 0 && (
        <div className="text-center text-[var(--text-muted)] font-bold pt-36 pb-20 text-lg">
          {searchQuery.trim()
            ? `${t.noResults} "${searchQuery}" 🔍`
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
