'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { getRestockMessage } from '../lib/preorderUtils';
import { motion, AnimatePresence } from 'framer-motion';
import ImageCarousel, { getProductImages } from './ImageCarousel';

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
    back: lang === 'ar' ? 'رجوع' : 'Back',
    qty: lang === 'ar' ? 'الكمية:' : 'Quantity:',
    stock: lang === 'ar' ? 'المخزون:' : 'Stock:',
    addBtn: lang === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart',
    preorderBtn: lang === 'ar' ? 'طلب مسبق — أضف للسلة' : 'Pre-order — Add to Cart',
    outOfStock: lang === 'ar' ? 'نفذت الكمية' : 'Out of Stock',
    unavailable: lang === 'ar' ? 'غير متوفر حالياً' : 'Currently Unavailable',
    successMsg: lang === 'ar' ? 'تمت إضافة المنتجات بنجاح!' : 'Items added successfully!',
    noteLabel: lang === 'ar' ? 'ملاحظات إضافية (اختياري):' : 'Additional Notes (Optional):',
    notePlaceholder: lang === 'ar' ? 'مثال: أي حساسية؟' : 'ex: Any allergies?',
    addedMsg: lang === 'ar' ? 'تمت الإضافة!' : 'Added!',
    sale: lang === 'ar' ? 'عرض خاص' : 'SALE',
    preorderBadge: lang === 'ar' ? 'طلب مسبق' : 'PRE-ORDER',
    preorderNote: lang === 'ar' ? 'هذا المنتج غير متوفر حالياً — سيُجهّز ويُشحن عند توفّره.' : 'This item is currently out of stock — it will be prepared and shipped when available.',
  };

  // --- إعادة تعيين الحالة عند فتح Modal جديد ---
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

  const handleAddToCart = () => {
    addToCart({ ...product, note: note.trim() }, quantity);
    toast.success(t.successMsg);
    setAddedToCart(true);
    setTimeout(() => {
      handleClose();
    }, 700);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* الخلفية المعتمة */}
          <motion.div
            className="fixed inset-0 bg-black/65 z-[60] cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* المحتوى */}
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto relative"
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              onClick={(e) => e.stopPropagation()}
            >
              {/* زر الإغلاق */}
              <button
                onClick={handleClose}
                className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all font-bold text-lg"
              >
                ✕
              </button>

              <div className="flex flex-col md:flex-row">
                {/* قسم الصورة */}
                <div className="w-full md:w-1/2 aspect-square relative bg-[var(--cream)] overflow-hidden flex-shrink-0">
                  <ImageCarousel
                    images={getProductImages(product)}
                    alt={lang === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name)}
                    size="full"
                    isUnavailable={!isPurchasable}
                  />

                  {/* شارة العرض الخاص */}
                  {hasOffer && isPurchasable && (
                    <div className={`absolute top-4 ${lang === 'ar' ? 'right-4' : 'left-4'} bg-[var(--dark)] text-[var(--gold)] text-xs font-black px-5 py-2 z-[5] rounded-xl shadow-lg tracking-wide`}>
                      {t.sale}
                    </div>
                  )}

                  {isPreorderable && (
                    <div className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} z-10`}>
                      <span className="flex items-center gap-1.5 bg-violet-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg tracking-wide uppercase">
                        ⏳ {t.preorderBadge}
                      </span>
                    </div>
                  )}

                  {!isPurchasable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                      <span className="bg-[var(--dark)] text-white px-6 py-3 font-bold text-sm uppercase tracking-widest rounded-xl shadow-lg">
                        {!product.is_available ? t.unavailable : t.outOfStock}
                      </span>
                    </div>
                  )}
                </div>

                {/* قسم التفاصيل */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                  <h2
                    className="text-2xl md:text-3xl font-black text-[var(--dark)] mb-3 tracking-tight"
                    style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}
                  >
                    {lang === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name_ar || product.name)}
                  </h2>

                  <div className="flex items-center gap-3 mb-4" dir="ltr">
                    <span className="text-xl md:text-2xl font-black gold-shimmer">{currentPrice} JOD</span>
                    {hasOffer && (
                      <>
                        <span className="text-sm text-[var(--text-muted)] line-through font-bold">{oldPrice} JOD</span>
                        <span className="bg-[var(--dark)] text-[var(--gold)] text-[9px] font-black px-3 py-1 rounded-xl uppercase tracking-widest shadow-sm">
                          {t.sale}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 font-medium">
                    {product.description}
                  </p>

                  {/* رسالة Pre-order — موعد الشحن المتوقع (يُحسب تلقائياً يومياً) */}
                  {isPreorderable && (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-1.5">
                      <p className="text-violet-700 font-black text-sm flex items-center gap-2">
                        ⏳ {t.preorderBadge}
                      </p>
                      <p className="text-violet-600 text-xs leading-relaxed">{t.preorderNote}</p>
                      {getRestockMessage(product.restock_date, lang) && (
                        <p className="text-violet-700 font-bold text-xs">
                          {getRestockMessage(product.restock_date, lang)}
                        </p>
                      )}
                    </div>
                  )}

                  {isPurchasable && (
                    <div className="space-y-4">
                      {/* الملاحظات */}
                      <div className="bg-[var(--cream)] p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-2">{t.noteLabel}</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder={t.notePlaceholder}
                          className="w-full border border-[var(--cream-dark)] p-3 rounded-xl font-medium text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 bg-white resize-none min-h-[70px] transition-all"
                        />
                      </div>

                      {/* الكمية */}
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-[var(--text-muted)]">{t.qty}</span>
                        <div className="flex items-center bg-[var(--cream)] border border-[var(--cream-dark)] rounded-2xl h-11 overflow-hidden">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const maxQty = isPreorderable ? 20 : product.stock;
                              if (quantity < maxQty) setQuantity(q => q + 1);
                            }}
                            className="w-11 h-full text-[var(--gold-dark)] font-black text-lg hover:bg-white transition-colors"
                          >+</motion.button>
                          <div className="w-12 h-full flex items-center justify-center font-black text-[var(--dark)] bg-white">{quantity}</div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                            className="w-11 h-full text-[var(--text-muted)] font-black text-lg hover:bg-white transition-colors"
                          >-</motion.button>
                        </div>
                        {!isPreorderable && (
                          <span className={`text-xs font-bold text-[var(--text-muted)] ${lang === 'ar' ? 'mr-auto' : 'ml-auto'}`}>
                            ({t.stock} {product.stock})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* زر الإضافة */}
                  <motion.button
                    disabled={!isPurchasable}
                    onClick={handleAddToCart}
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all disabled:bg-[var(--cream-dark)] disabled:text-[var(--text-muted)] disabled:shadow-none mt-6 text-sm
                      ${addedToCart
                        ? 'bg-green-500 text-white'
                        : isPreorderable
                          ? 'bg-violet-500 hover:bg-violet-600 text-white'
                          : 'gold-shimmer-bg gold-glow text-white'
                      }`}
                    whileHover={isPurchasable ? { scale: 1.02 } : {}}
                    whileTap={isPurchasable ? { scale: 0.98 } : {}}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={addedToCart ? 'added' : 'add'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {addedToCart
                          ? t.addedMsg + ' ✓'
                          : !product.is_available
                            ? t.unavailable
                            : isPreorderable
                              ? t.preorderBtn
                              : t.addBtn}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
