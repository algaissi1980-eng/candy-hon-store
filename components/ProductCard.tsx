'use client';

import { useLanguageStore } from '../store/languageStore';
import { motion } from 'framer-motion';
import ImageCarousel, { getProductImages } from './ImageCarousel';

export default function ProductCard({ product, index = 0, onProductClick }: { product: any; index?: number; onProductClick?: (product: any) => void }) {
  const { lang } = useLanguageStore();

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isPreorderable = product.allow_preorder === true && product.is_available !== false;
  const isUnavailable = !product.is_available || (isOutOfStock && !isPreorderable);

  const currentPrice = Number(product.price) || 0;
  const oldPrice = Number(product.original_price) || 0;
  const hasOffer = oldPrice > currentPrice;

  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <motion.div
      className="relative group flex flex-col font-sans h-full glass-card glass-card-hover overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
    >

      {/* حاوية الصورة — مربعة على الموبايل، 4/5 على الشاشات الكبيرة */}
      <div className="relative aspect-square md:aspect-[4/5] overflow-hidden bg-[var(--cream)]">

        {/* شارة العرض */}
        {hasOffer && !isUnavailable && (
          <motion.div
            className={`absolute top-2 md:top-3 ${lang === 'ar' ? 'right-2 md:right-3' : 'left-2 md:left-3'} bg-red-500 text-white rounded-full text-[10px] md:text-xs font-black px-3 md:px-4 py-1 md:py-1.5 z-30 tracking-wide uppercase shadow-md`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
          >
            {lang === 'ar' ? 'عرض خاص' : 'SALE'}
          </motion.div>
        )}

        {/* الصورة — Carousel قابل للـ swipe والنقر لفتح الـ Modal */}
        <ImageCarousel
          images={getProductImages(product)}
          alt={lang === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name)}
          size="card"
          onImageClick={handleClick}
          isUnavailable={isUnavailable}
        />

        {isUnavailable ? (
          /* غير متاح نهائياً — overlay معتم */
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <span className="glass-badge px-3 md:px-5 py-1.5 md:py-2 font-bold text-[10px] md:text-sm uppercase tracking-widest text-center shadow-lg">
              {lang === 'ar' ? 'غير متاح' : 'Unavailable'}
            </span>
          </div>
        ) : isPreorderable ? (
          /* Pre-order — شارة بنفسجية بدون تعتيم */
          <motion.div
            className={`absolute top-2 md:top-3 ${lang === 'ar' ? 'left-2 md:left-3' : 'right-2 md:right-3'} z-30`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.25 }}
          >
            <span className="flex items-center gap-1 bg-violet-500 text-white text-[9px] md:text-[11px] font-black px-2.5 md:px-3 py-1 rounded-xl shadow-lg tracking-wide uppercase">
              <span>⏳</span>
              {lang === 'ar' ? 'طلب مسبق' : 'PRE-ORDER'}
            </span>
          </motion.div>
        ) : (
          /* متاح — زر التفاصيل عند hover */
          <motion.button
            onClick={handleClick}
            title={lang === 'ar' ? 'التفاصيل' : 'Details'}
            className="absolute bottom-3 md:bottom-4 left-3 md:left-4 glass-badge w-9 h-9 md:w-11 md:h-11 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white z-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* محتوى البطاقة — مصغّر على الموبايل */}
      <div className="flex flex-col flex-grow p-3 md:p-5">
        <div>
          <h3 className="text-sm md:text-lg font-bold text-[var(--dark)] mb-0.5 md:mb-1 line-clamp-1">
            {lang === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name_ar || product.name)}
          </h3>
          <p className="text-[var(--text-muted)] text-[10px] md:text-sm line-clamp-1 md:line-clamp-2 leading-relaxed">{product.description}</p>
        </div>

        {/* السعر + زر */}
        <div className="mt-auto pt-2 md:pt-4 flex items-center justify-between gap-2 md:gap-3 w-full">
          <div className="flex flex-col leading-none" dir="ltr">
            {hasOffer && (
              <span className="text-[8px] md:text-[10px] text-[var(--text-muted)] line-through font-bold mb-0.5 md:mb-1">
                {oldPrice} JOD
              </span>
            )}
            <span className="text-lg md:text-2xl font-black gold-shimmer leading-none mt-1">
              {currentPrice} JOD
            </span>
          </div>

          <button
            onClick={handleClick}
            disabled={isUnavailable}
            className={`flex-shrink-0 font-bold py-1.5 md:py-2 px-3 md:px-5 transition-all duration-300 text-[10px] md:text-xs
              ${isUnavailable
                ? 'bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed'
                : isPreorderable
                  ? 'bg-violet-500 hover:bg-violet-600 text-white rounded-xl shadow cursor-pointer'
                  : 'glass-button cursor-pointer'
              }`}
          >
            {isUnavailable
              ? (lang === 'ar' ? 'غير متاح' : 'Unavailable')
              : isPreorderable
                ? (lang === 'ar' ? 'طلب مسبق' : 'Pre-order')
                : (lang === 'ar' ? 'اطلب الآن' : 'Order Now')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
