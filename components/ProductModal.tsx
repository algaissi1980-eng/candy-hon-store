'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { getRestockMessage } from '../lib/preorderUtils';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCarousel, { getProductImages } from './ImageCarousel';

// =============================================
// ProductModal — الهوية الجديدة (1a)
// موبايل: bottom sheet بمقبض سحب وscrim مسطح (بلا blur)
// سطح المكتب: dialog وسطي 880px بعمود صورة
// =============================================

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { lang } = useLanguageStore();
  const addToCart = useCartStore((state: any) => state.addToCart);

  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);

  const t = {
    qty: lang === 'ar' ? 'الكمية' : 'Quantity',
    stock: lang === 'ar' ? 'المخزون:' : 'Stock:',
    addBtn: lang === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart',
    preorderBtn: lang === 'ar' ? 'اطلب مسبقاً' : 'Pre-order',
    outOfStock: lang === 'ar' ? 'نفذت الكمية' : 'Out of Stock',
    unavailable: lang === 'ar' ? 'غير متوفر حالياً' : 'Currently Unavailable',
    successMsg: lang === 'ar' ? 'تمت الإضافة إلى السلة ✓' : 'Added to cart ✓',
    noteLabel: lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional notes (optional)',
    notePlaceholder: lang === 'ar' ? 'مثال: أي حساسية؟' : 'ex: Any allergies?',
    addedMsg: lang === 'ar' ? 'تمت الإضافة' : 'Added',
    sale: lang === 'ar' ? 'عرض' : 'SALE',
    preorderBadge: lang === 'ar' ? 'طلب مسبق' : 'Pre-order',
    preorderNote: lang === 'ar' ? 'هذا المنتج غير متوفر حالياً — سيُجهّز ويُشحن عند توفّره.' : 'This item is currently out of stock — it will be prepared and shipped when available.',
  };

  const resetState = () => {
    setQuantity(1);
    setNote('');
    setAddedToCart(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!product) return null;

  const isPreorderable =
    product.is_available !== false &&
    product.allow_preorder === true;
  const isPurchasable = (product.is_available && product.stock > 0) || isPreorderable;

  const currentPrice = Number(product.price) || 0;
  const oldPrice = Number(product.original_price) || 0;
  const hasOffer = oldPrice > currentPrice;
  const lineTotal = (currentPrice * quantity).toFixed(2);

  const nameAr = product.name_ar || product.name;
  const nameEn = product.name_en || '';
  const primaryName = lang === 'ar' ? nameAr : (nameEn || nameAr);
  const secondaryName = lang === 'ar' ? nameEn : (nameEn ? nameAr : '');

  const handleAddToCart = () => {
    addToCart({ ...product, note: note.trim() }, quantity);
    toast.success(t.successMsg);
    setAddedToCart(true);
    // ✓ لمدة 800ms ثم الإغلاق (مواصفة التفاعل)
    setTimeout(() => {
      handleClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim مسطح — بدون blur */}
          <motion.div
            className="fixed inset-0 z-[60] cursor-pointer"
            style={{ background: 'rgba(58,42,51,.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />

          {/* الحاوية: sheet سفلي على الموبايل / dialog وسطي على الشاشات الكبيرة */}
          <div className="fixed inset-0 z-[61] flex items-end md:items-center justify-center md:p-6 pointer-events-none">
            <motion.div
              className="bg-[var(--surface)] w-full md:max-w-[880px] max-h-[92vh] md:max-h-[86vh] overflow-y-auto pointer-events-auto relative rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)] shadow-[var(--shadow-sheet)]"
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 48 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              onClick={(e) => e.stopPropagation()}
            >
              {/* مقبض السحب — موبايل فقط */}
              <div className="md:hidden sticky top-0 z-20 flex justify-center pt-2.5 pb-1 bg-[var(--surface)]">
                <span className="w-10 h-1 rounded-full bg-[var(--ink-300)]" />
              </div>

              {/* زر الإغلاق — 44px */}
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute top-3 end-3 z-30 w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex items-center justify-center text-[var(--ink-700)] hover:text-[var(--pink-600)] hover:border-[var(--pink-400)] transition-colors duration-150 font-bold"
              >
                ✕
              </button>

              <div className="flex flex-col md:flex-row">
                {/* ─── الصورة ─── */}
                <div className="w-full md:w-[400px] aspect-square relative bg-white overflow-hidden shrink-0 md:rounded-s-[var(--radius-xl)]">
                  <ImageCarousel
                    images={getProductImages(product)}
                    alt={primaryName}
                    size="full"
                    isUnavailable={false}
                  />

                  {/* شارة الخصم */}
                  {hasOffer && isPurchasable && (
                    <span className="absolute top-3 start-3 z-10 bg-[var(--pink-600)] text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wide">
                      {t.sale}
                    </span>
                  )}

                  {isPreorderable && (
                    <span className="absolute top-3 start-3 z-10 flex items-center gap-1.5 bg-[var(--blue-100)] text-[var(--blue-700)] text-xs font-black px-3 py-1.5 rounded-full">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                      </svg>
                      {t.preorderBadge}
                    </span>
                  )}

                  {!isPurchasable && (
                    <>
                      <div className="absolute inset-0 bg-white/40 pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-[var(--ink-900)] text-white px-5 py-2 font-black text-sm uppercase tracking-wide rounded-full">
                          {!product.is_available ? t.unavailable : t.outOfStock}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* ─── التفاصيل ─── */}
                <div className="w-full md:flex-1 p-5 md:p-8 flex flex-col">
                  {/* الاسم — عربي h3 + إنجليزي subtitle */}
                  <h2 className="text-[17px] md:text-xl font-bold text-[var(--ink-900)] leading-snug pe-10">
                    {primaryName}
                  </h2>
                  {secondaryName && (
                    <p className="text-xs md:text-sm font-medium text-[var(--ink-500)] mt-0.5" dir={lang === 'ar' ? 'ltr' : 'rtl'}>
                      {secondaryName}
                    </p>
                  )}

                  {/* السعر */}
                  <div className="flex items-baseline gap-2.5 mt-3 mb-3" dir="ltr">
                    <span
                      className="text-2xl md:text-[28px] font-bold text-[var(--pink-600)] leading-none"
                      style={{ fontFamily: 'var(--font-display-en)' }}
                    >
                      {currentPrice} <span className="text-sm font-semibold">JOD</span>
                    </span>
                    {hasOffer && (
                      <span className="text-sm text-[var(--ink-500)] line-through font-bold">{oldPrice} JOD</span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-[13px] text-[var(--ink-700)] leading-relaxed mb-4 font-medium">
                      {product.description}
                    </p>
                  )}

                  {/* رسالة الطلب المسبق */}
                  {isPreorderable && (
                    <div className="bg-[var(--blue-100)] rounded-[var(--radius-md)] p-4 space-y-1 mb-4">
                      <p className="text-[var(--blue-700)] font-black text-sm">⏱ {t.preorderBadge}</p>
                      <p className="text-[var(--blue-700)] text-xs leading-relaxed">{t.preorderNote}</p>
                      {getRestockMessage(product.restock_date, lang) && (
                        <p className="text-[var(--blue-700)] font-bold text-xs">
                          {getRestockMessage(product.restock_date, lang)}
                        </p>
                      )}
                    </div>
                  )}

                  {isPurchasable && (
                    <div className="space-y-4 mt-auto">
                      {/* الكمية — stepper بارتفاع 48px */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-[var(--ink-700)]">{t.qty}</span>
                        <div className="flex items-center border border-[var(--border)] rounded-[var(--radius-md)] h-12 overflow-hidden bg-[var(--bg)]">
                          <button
                            onClick={() => {
                              const maxQty = isPreorderable ? 20 : product.stock;
                              if (quantity < maxQty) setQuantity(q => q + 1);
                            }}
                            aria-label="+"
                            className="w-[46px] h-full text-[var(--pink-600)] font-black text-lg hover:bg-[var(--pink-50)] active:scale-95 transition-[background-color,transform] duration-150"
                          >+</button>
                          <div className="w-12 h-full flex items-center justify-center font-black text-[var(--ink-900)] bg-[var(--surface)]" dir="ltr">{quantity}</div>
                          <button
                            onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                            aria-label="−"
                            className="w-[46px] h-full text-[var(--ink-500)] font-black text-lg hover:bg-[var(--pink-50)] active:scale-95 transition-[background-color,transform] duration-150"
                          >−</button>
                        </div>
                        {!isPreorderable && (
                          <span className="text-xs font-bold text-[var(--ink-500)] ms-auto">
                            ({t.stock} {product.stock})
                          </span>
                        )}
                      </div>

                      {/* الملاحظات */}
                      <div>
                        <label className="block text-xs font-bold text-[var(--ink-700)] mb-1.5">{t.noteLabel}</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={t.notePlaceholder}
                          className="w-full border border-[var(--border)] p-3 rounded-[var(--radius-md)] font-medium text-sm outline-none focus:border-[var(--pink-400)] focus:ring-2 focus:ring-[var(--pink-100)] bg-[var(--bg)] resize-none min-h-[64px] transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--ink-500)]"
                        />
                      </div>
                    </div>
                  )}

                  {/* زر الإضافة — 52px مع شريحة السعر داخله */}
                  <button
                    disabled={!isPurchasable}
                    onClick={handleAddToCart}
                    className={`w-full h-[52px] flex items-center justify-center gap-2.5 font-bold rounded-[var(--radius-md)] transition-colors duration-150 mt-5 text-sm active:scale-[.97]
                      ${!isPurchasable
                        ? 'bg-[var(--border)] text-[var(--ink-500)] cursor-not-allowed'
                        : 'bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white cursor-pointer'
                      }`}
                  >
                    {isPurchasable ? (
                      <>
                        <span className="w-5 h-5 flex items-center justify-center">
                          {addedToCart ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 fade-in">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          )}
                        </span>
                        <span>{addedToCart ? t.addedMsg : (isPreorderable ? t.preorderBtn : t.addBtn)}</span>
                        <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-black" dir="ltr">
                          {lineTotal} JOD
                        </span>
                      </>
                    ) : (
                      <span>{!product.is_available ? t.unavailable : t.outOfStock}</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
