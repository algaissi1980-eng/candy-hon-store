'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { getDaysUntilRestock } from '../lib/preorderUtils';
import { optimizeThumbnail } from '../lib/optimizeImage';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// =============================================
// FloatingCart — الهوية الجديدة (1a)
// FAB على شكل pill (أيقونة + عداد + شريحة سعر LTR)
// Drawer: صفوف 56px، stepper مضغوط، CTA بشريحة مجموع
// (بطاقة التوصيل المجاني حُذفت بقرار العميل — لا يوجد توصيل مجاني)
// =============================================

export default function FloatingCart() {
  const pathname = usePathname();
  const { items, isOpen, toggleCart, removeFromCart, updateQuantity, _hasHydrated: cartHydrated } = useCartStore();
  const { lang, _hasHydrated: langHydrated } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.startsWith('/admin')) return null;
  if (!mounted || !cartHydrated || !langHydrated) return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const t = {
    title: lang === 'ar' ? 'السلة' : 'Cart',
    empty: lang === 'ar' ? 'السلة فارغة حالياً' : 'Your cart is empty',
    checkout: lang === 'ar' ? 'إتمام الطلب' : 'Checkout',
    subtotal: lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
    deliveryNote: lang === 'ar' ? 'رسوم التوصيل تُحسب عند إتمام الطلب' : 'Delivery fee is calculated at checkout',
    note: lang === 'ar' ? 'ملاحظة:' : 'Note:',
    preorder: lang === 'ar' ? 'طلب مسبق' : 'Pre-order',
    remove: lang === 'ar' ? 'إزالة' : 'Remove',
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* ─── FAB pill — يظهر فقط عند وجود عناصر (زر السلة الدائم في الـ Navbar) ─── */}
      {totalItems > 0 && !isOpen && (
        <button
          onClick={toggleCart}
          className="fixed bottom-6 start-4 md:start-6 z-50 h-[52px] ps-4 pe-2 flex items-center gap-2.5 bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white rounded-full shadow-[var(--shadow-fab)] transition-[background-color,transform] duration-150 active:scale-[.97] fade-in"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="font-bold text-sm">
            {t.title} · <span dir="ltr">{totalItems}</span>
          </span>
          <span className="bg-white/20 rounded-full px-3 py-1.5 text-xs font-black" dir="ltr">
            {totalPrice.toFixed(2)} JOD
          </span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Scrim مسطح — بدون blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleCart}
              className="fixed inset-0 z-40 cursor-pointer"
              style={{ background: 'rgba(58,42,51,.4)' }}
            />
            <motion.div
              initial={{ x: lang === 'ar' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'ar' ? '-100%' : '100%' }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 start-0 w-full max-w-sm h-full bg-[var(--surface)] shadow-[var(--shadow-hover)] z-50 flex flex-col"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Header — العنوان + العداد + إغلاق 44px */}
              <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-center">
                <h2 className="text-lg font-extrabold text-[var(--ink-900)]">
                  {t.title} <span className="text-[var(--ink-500)] text-sm font-bold" dir="ltr">({totalItems})</span>
                </h2>
                <button
                  onClick={toggleCart}
                  aria-label="Close"
                  className="w-11 h-11 rounded-full border border-[var(--border)] text-[var(--ink-700)] hover:text-[var(--pink-600)] hover:border-[var(--pink-400)] font-bold transition-colors duration-150 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* العناصر */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {items.length === 0 ? (
                  <p className="text-center text-[var(--ink-500)] mt-20 text-sm font-bold">{t.empty}</p>
                ) : items.map((item) => (
                  <div
                    key={item.cartItemId || item.id}
                    className="flex items-start gap-3 bg-[var(--bg)] border border-[var(--border)] p-3 rounded-[var(--radius-lg)]"
                  >
                    {/* الصورة المصغرة — 56px */}
                    {item.image_url ? (
                      <Image
                        src={optimizeThumbnail(item.image_url)}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-[var(--radius-md)] object-cover shrink-0 bg-white border border-[var(--border)]"
                      />
                    ) : (
                      <span className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--pink-50)] shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-[var(--ink-900)] text-[13px] leading-snug line-clamp-1">{item.name}</h4>
                        {item.is_preorder && (
                          <span className="bg-[var(--blue-100)] text-[var(--blue-700)] text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                            {t.preorder}
                          </span>
                        )}
                      </div>

                      {item.is_preorder && (() => {
                        const days = getDaysUntilRestock(item.restock_date);
                        return days !== null && days > 0 ? (
                          <p className="text-[10px] text-[var(--blue-700)] font-bold mt-0.5">
                            {lang === 'ar' ? `يتوفر خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}` : `Ships in ~${days} day${days !== 1 ? 's' : ''}`}
                          </p>
                        ) : null;
                      })()}

                      {item.note && (
                        <p className="text-[10px] text-[var(--ink-500)] mt-0.5 line-clamp-1">{t.note} {item.note}</p>
                      )}

                      {/* Stepper مضغوط + مجموع السطر */}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] h-8 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)}
                            disabled={!item.is_preorder && item.quantity >= (item.stock ?? 99)}
                            aria-label="+"
                            className="w-8 h-full text-[var(--pink-600)] font-black text-sm hover:bg-[var(--pink-50)] disabled:opacity-30 transition-colors duration-150"
                          >+</button>
                          <span className="w-7 text-center font-black text-[11px] text-[var(--ink-900)]" dir="ltr">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="−"
                            className="w-8 h-full text-[var(--ink-500)] font-black text-sm hover:bg-[var(--pink-50)] disabled:opacity-30 transition-colors duration-150"
                          >−</button>
                        </div>
                        <span className="font-bold text-[13px] text-[var(--ink-900)]" dir="ltr" style={{ fontFamily: 'var(--font-display-en)' }}>
                          {(item.price * item.quantity).toFixed(2)} JOD
                        </span>
                      </div>
                    </div>

                    {/* إزالة — هادئ */}
                    <button
                      onClick={() => removeFromCart(item.cartItemId || item.id)}
                      aria-label={t.remove}
                      className="text-[var(--ink-300)] hover:text-[var(--error)] font-bold transition-colors duration-150 text-xs p-1 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="px-5 py-4 border-t border-[var(--border)] space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-[var(--ink-700)]">{t.subtotal}</span>
                    <span className="font-extrabold text-[var(--ink-900)]" dir="ltr" style={{ fontFamily: 'var(--font-display-en)' }}>
                      {totalPrice.toFixed(2)} JOD
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[var(--ink-500)]">{t.deliveryNote}</p>
                  <Link
                    href="/checkout"
                    onClick={toggleCart}
                    className="w-full h-[52px] flex items-center justify-center gap-2.5 bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white rounded-[var(--radius-md)] font-bold text-sm transition-colors duration-150 active:scale-[.97]"
                  >
                    {t.checkout}
                    <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-black" dir="ltr">
                      {totalPrice.toFixed(2)} JOD
                    </span>
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
