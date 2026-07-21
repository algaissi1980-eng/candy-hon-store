'use client';

import { useRef, useCallback } from 'react';
import { useLanguageStore } from '../store/languageStore';
import ImageCarousel, { getProductImages } from './ImageCarousel';
import { optimizeFullImage } from '../lib/optimizeImage';

// =============================================
// ProductCard — الهوية الجديدة (1a)
// بطاقة بيضاء radius-lg بحالات مقروءة بلا قراءة:
// متاح (+) / SALE (شارة وردية) / طلب مسبق (أزرق) /
// نفذ (صورة باهتة جزئياً + حبة داكنة + أعلمني)
// =============================================

export default function ProductCard({ product, index = 0, onProductClick }: { product: any; index?: number; onProductClick?: (product: any) => void }) {
  const { lang } = useLanguageStore();
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetched = useRef(false);

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isPreorderable = product.allow_preorder === true && product.is_available !== false;
  const isUnavailable = !product.is_available || (isOutOfStock && !isPreorderable);

  const currentPrice = Number(product.price) || 0;
  const oldPrice = Number(product.original_price) || 0;
  const hasOffer = oldPrice > currentPrice;

  const nameAr = product.name_ar || product.name;
  const nameEn = product.name_en || '';
  const primaryName = lang === 'ar' ? nameAr : (nameEn || nameAr);
  const secondaryName = lang === 'ar' ? nameEn : (nameEn ? nameAr : '');

  const handleClick = () => {
    if (isUnavailable) return;
    if (onProductClick) onProductClick(product);
  };

  // "أعلمني" — رسالة واتساب جاهزة (نمط التواصل المعتمد في المتجر)
  const notifyHref = `https://wa.me/962791875758?text=${encodeURIComponent(
    lang === 'ar'
      ? `مرحباً! أعلموني عند توفر: ${nameAr}`
      : `Hi! Please notify me when available: ${nameEn || nameAr}`
  )}`;

  // ✅ Prefetch on hover — تحميل الصورة الكاملة بالخلفية بعد 200ms hover
  const handlePointerEnter = useCallback(() => {
    if (prefetched.current) return;
    prefetchTimer.current = setTimeout(() => {
      const images = getProductImages(product);
      if (images.length > 0) {
        const img = new window.Image();
        img.src = optimizeFullImage(images[0]);
        prefetched.current = true;
      }
    }, 200);
  }, [product]);

  const handlePointerLeave = useCallback(() => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
  }, []);

  // CSS entrance — stagger 40ms بسقف 120ms إجمالاً (ميزانية الحركة)
  const animDelay = `${Math.min(index * 0.04, 0.12)}s`;

  const t = {
    sale: lang === 'ar' ? 'عرض' : 'SALE',
    preorder: lang === 'ar' ? 'طلب مسبق' : 'Pre-order',
    preorderBtn: lang === 'ar' ? 'اطلب مسبقاً' : 'Pre-order',
    oos: lang === 'ar' ? 'نفذت الكمية' : 'OUT OF STOCK',
    notify: lang === 'ar' ? 'أعلمني' : 'Notify me',
    add: lang === 'ar' ? 'إضافة للسلة' : 'Add to cart',
  };

  return (
    <div
      className="relative group flex flex-col h-full bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden card-fade-in transition-[transform,box-shadow] duration-150 ease-out md:hover:-translate-y-0.5 md:hover:shadow-[var(--shadow-hover)] active:scale-[.98]"
      style={{ animationDelay: animDelay }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* ─── الصورة — مربعة ─── */}
      <div className="relative aspect-square overflow-hidden bg-white">
        <div className={isUnavailable ? '[filter:grayscale(30%)] opacity-55 h-full' : 'h-full'}>
          <ImageCarousel
            images={getProductImages(product)}
            alt={primaryName}
            size="card"
            onImageClick={handleClick}
            isUnavailable={false}
          />
        </div>

        {/* شارة SALE — بداية أعلى */}
        {hasOffer && !isUnavailable && (
          <span className="absolute top-2 start-2 z-30 bg-[var(--pink-600)] text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wide">
            {t.sale}
          </span>
        )}

        {/* شارة الطلب المسبق — أزرق مع أيقونة ساعة */}
        {isPreorderable && !isUnavailable && (
          <span className="absolute top-2 end-2 z-30 flex items-center gap-1 bg-[var(--blue-100)] text-[var(--blue-700)] text-[11px] font-black px-2.5 py-1 rounded-full">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            {t.preorder}
          </span>
        )}

        {/* نفذت الكمية — حبة plum داكنة وسط الصورة (بدون overlay أو grayscale كامل) */}
        {isUnavailable && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <span className="bg-[var(--ink-900)] text-white text-[11px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wide">
              {t.oos}
            </span>
          </div>
        )}
      </div>

      {/* ─── محتوى البطاقة ─── */}
      <div className="flex flex-col flex-grow p-3 md:p-4">
        <h3 className="text-[13px] md:text-[15px] font-bold text-[var(--ink-900)] leading-snug line-clamp-1">
          {primaryName}
        </h3>
        {secondaryName && (
          <p className="text-[10px] md:text-[11px] font-medium text-[var(--ink-500)] line-clamp-1 text-end mt-0.5" dir={lang === 'ar' ? 'ltr' : 'rtl'}>
            {secondaryName}
          </p>
        )}

        {/* السعر + الإجراء */}
        <div className="mt-auto pt-2.5 md:pt-3 flex items-end justify-between gap-2">
          <div className="flex flex-col leading-none" dir="ltr">
            {hasOffer && !isUnavailable && (
              <span className="text-[10px] text-[var(--ink-500)] line-through font-bold mb-0.5">
                {oldPrice} JOD
              </span>
            )}
            <span
              className={`text-lg md:text-xl font-bold leading-none ${isUnavailable ? 'text-[var(--ink-500)]' : 'text-[var(--pink-600)]'}`}
              style={{ fontFamily: 'var(--font-display-en)' }}
            >
              {currentPrice} <span className="text-[11px] font-semibold">JOD</span>
            </span>
          </div>

          {isUnavailable ? (
            /* أعلمني — زر محدد بحدود، يفتح واتساب برسالة جاهزة */
            <a
              href={notifyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 h-11 px-3.5 flex items-center justify-center border-[1.5px] border-[var(--ink-500)] text-[var(--ink-700)] hover:border-[var(--ink-900)] font-bold text-[11px] md:text-xs rounded-[var(--radius-md)] transition-colors duration-150"
            >
              {t.notify}
            </a>
          ) : isPreorderable ? (
            /* طلب مسبق — أزرق محدد */
            <button
              onClick={handleClick}
              className="shrink-0 h-11 px-3.5 flex items-center justify-center border-[1.5px] border-[var(--blue-700)] text-[var(--blue-700)] hover:bg-[var(--blue-100)] font-bold text-[11px] md:text-xs rounded-[var(--radius-md)] transition-colors duration-150 cursor-pointer"
            >
              {t.preorderBtn}
            </button>
          ) : (
            /* متاح — زر + دائري وردي 44px */
            <button
              onClick={handleClick}
              aria-label={t.add}
              className="shrink-0 w-11 h-11 flex items-center justify-center bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white rounded-full transition-colors duration-150 active:scale-95 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
