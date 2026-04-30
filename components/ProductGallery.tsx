'use client';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useState, useCallback } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ProductGallery({ products, storeCategories }: {
  products: any[];
  storeCategories: string[];
}) {
  const { lang } = useLanguageStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // قراءة الفلتر من URL أو الرجوع للـ "all" كافتراضي
  const activeCategory = searchParams.get('category') || 'all';

  // تحديث فلتر التصنيف في URL
  const setActiveCategory = useCallback((cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') params.delete('category');
    else params.set('category', cat);
    const newUrl = params.toString() ? `?${params.toString()}#menu` : '/#menu';
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // فلترة المنتجات حسب التصنيف
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const t = {
    all: lang === 'ar' ? 'الكل' : 'All',
    emptyMsg: lang === 'ar' ? 'لا توجد منتجات في هذا التصنيف حالياً ✨' : 'No products available in this category ✨',
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
      {/* أزرار التصنيفات */}
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

      {/* شبكة المنتجات — عمودين على الموبايل */}
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

      {filteredProducts.length === 0 && (
        <div className="text-center text-[var(--text-muted)] font-bold pt-36 pb-20 text-lg">
          {t.emptyMsg}
        </div>
      )}

      {/* Modal عرض تفاصيل المنتج */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
