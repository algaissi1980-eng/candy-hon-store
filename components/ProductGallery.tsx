'use client';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useState, useCallback, useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useSearchParams, useRouter } from 'next/navigation';

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

  useEffect(() => {
    setVisibleCount(24);
  }, [activeCategory]);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const t = {
    all: lang === 'ar' ? 'الكل' : 'All',
    emptyMsg: lang === 'ar' ? 'لا توجد منتجات في هذا التصنيف حالياً ✨' : 'No products available in this category ✨',
    loadMore: lang === 'ar' ? 'عرض المزيد ⬇️' : 'Load More ⬇️',
    showing: lang === 'ar' ? 'عرض' : 'Showing',
    outOf: lang === 'ar' ? 'من أصل' : 'out of',
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
            {t.showing} {visibleCount} {t.outOf} {filteredProducts.length}
          </p>
          <button
            onClick={() => setVisibleCount(prev => prev + 24)}
            className="bg-white border-2 border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-white px-8 py-3 rounded-full font-black shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          >
            {t.loadMore}
          </button>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center text-[var(--text-muted)] font-bold pt-36 pb-20 text-lg">
          {t.emptyMsg}
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
