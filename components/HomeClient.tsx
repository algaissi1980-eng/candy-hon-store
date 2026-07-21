'use client';

import { Suspense, useEffect } from 'react';
import ProductGallery from './ProductGallery';
import { useLanguageStore } from '../store/languageStore';
import { useProductStore } from '../store/productStore';
import AnnouncementBar, { SocialLinks } from './AnnouncementBar';
import Image from 'next/image';

// =============================================
// HomeClient — الهوية الجديدة (1a)
// Hero مضغوط يُعرض فورياً بلا أي حركة:
// المنتجات مرئية ضمن أول شاشة موبايل.
// يستقبل المنتجات الأولية من الـ Server Component
// =============================================

interface HomeClientProps {
  initialProducts: any[];
  initialCategories: string[];
  initialHasMore: boolean;
}

export default function HomeClient({ initialProducts, initialCategories, initialHasMore }: HomeClientProps) {
  const { lang } = useLanguageStore();
  const { products, categories: storeCategories, fetchProducts, hydrateFromServer } = useProductStore();

  useEffect(() => {
    // نغذّي المخزن ببيانات SSR (لا يستبدل بيانات موجودة أحدث)
    if (initialProducts.length > 0) {
      hydrateFromServer(initialProducts, initialCategories, initialHasMore);
    }
    // إذا الـ SSR فشل أو الكاش انتهى — يجلب من المتصفح كالسابق
    fetchProducts();
  }, [fetchProducts, hydrateFromServer, initialProducts, initialCategories, initialHasMore]);

  // المخزن هو المصدر بعد الـ hydration؛ قبله نعرض بيانات الـ SSR مباشرة
  const displayProducts = products.length > 0 ? products : initialProducts;
  const dynamicCategories = storeCategories.length > 0 ? storeCategories : initialCategories;

  const t = {
    promise: lang === 'ar'
      ? 'منتجات فريدة ومرحة، توصلك لباب البيت'
      : 'Unique & fun finds, delivered to your door',
    subline: lang === 'ar'
      ? 'تشكيلة مختارة بحب — توصيل لجميع محافظات الأردن'
      : 'A hand-picked collection — delivery across all of Jordan',
    shopNow: lang === 'ar' ? 'تسوّق الآن' : 'Shop Now',
    offers: lang === 'ar' ? 'العروض' : 'Offers',
  };

  const premiumImages = [
    "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1603532648955-039310d9ed75?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?q=80&w=1000&auto=format&fit=crop"
  ];

  const formattedProducts = displayProducts.map((product, index) => ({
    ...product,
    image_url: product.image_url || premiumImages[index % premiumImages.length]
  }));

  return (
    <main
      className="min-h-screen bg-[var(--bg)] pt-[74px] md:pt-[82px]"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* شريط الإعلان — أعلى الصفحة تحت الـ Navbar مباشرة */}
      <AnnouncementBar />

      {/* ===============================================
          Hero مضغوط — يُعرض فورياً، لا صورة على الموبايل،
          لا حركة إطلاقاً. سطح المكتب: band وردي بحافة scallop
          =============================================== */}
      <section className="md:bg-[var(--pink-50)]">
        <div className="max-w-7xl mx-auto px-5 md:px-9 pt-6 pb-2 md:py-9 flex items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-[38px] font-extrabold text-[var(--ink-900)] leading-snug md:leading-tight mb-2 md:mb-3">
              {t.promise}
            </h1>
            <p className="text-[13px] md:text-base font-medium text-[var(--ink-500)] md:text-[var(--ink-700)] leading-relaxed">
              {t.subline}
            </p>

            {/* أزرار سطح المكتب فقط — الموبايل ينتقل مباشرة للبحث والمنتجات */}
            <div className="hidden md:flex items-center gap-3 mt-6">
              <a
                href="#menu"
                className="h-[52px] px-8 flex items-center bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white font-bold rounded-[var(--radius-md)] transition-colors duration-150"
              >
                {t.shopNow}
              </a>
              <a
                href="#menu"
                className="h-[52px] px-8 flex items-center bg-transparent border-[1.5px] border-[var(--pink-600)] text-[var(--pink-600)] hover:bg-[var(--pink-100)] font-bold rounded-[var(--radius-md)] transition-colors duration-150"
              >
                {t.offers}
              </a>
            </div>
          </div>

          {/* اللوقو — سطح المكتب فقط (دائرة بيضاء لأن الـ webp خلفيته داكنة) */}
          <div className="hidden lg:block relative w-[170px] h-[170px] shrink-0 rounded-full bg-white border border-[var(--pink-200)] shadow-[var(--shadow-card)] p-1 overflow-hidden">
            <Image
              src="/logo.webp"
              alt="Candy Hon"
              fill
              priority
              className="object-contain rounded-full"
              sizes="170px"
            />
          </div>
        </div>
      </section>

      {/* حافة scallop أسفل الـ band (سطح المكتب) */}
      <div
        className="scallop-edge hidden md:block"
        style={{ '--scallop-color': 'var(--pink-50)' } as React.CSSProperties}
      />

      {/* ===============================================
          المنتجات — البحث + التصنيفات + الشبكة
          =============================================== */}
      <section id="menu" className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-10 pb-16 scroll-mt-24">
        <Suspense fallback={<div className="text-center py-20 text-[var(--ink-500)] font-bold">...</div>}>
          <ProductGallery products={formattedProducts} storeCategories={dynamicCategories} />
        </Suspense>
      </section>

      <SocialLinks />
    </main>
  );
}
