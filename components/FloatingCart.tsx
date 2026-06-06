'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { getDaysUntilRestock } from '../lib/preorderUtils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
    title: lang === 'ar' ? 'سلة التسوق' : 'Shopping Cart',
    empty: lang === 'ar' ? 'السلة فارغة حالياً!' : 'Cart is empty!',
    total: lang === 'ar' ? 'المجموع:' : 'Total:',
    checkout: lang === 'ar' ? 'إتمام الطلب' : 'Checkout',
    note: lang === 'ar' ? '📝' : '📝'
  };

  return (
    <>
      {/* زر السلة العائم — متوهج */}
      <motion.button
        onClick={toggleCart}
        className="fixed bottom-10 left-5 md:bottom-8 md:left-8 gold-shimmer-bg text-white p-4 rounded-2xl shadow-2xl z-50 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 1 }}
      >
        <span className="text-xl">🛒</span>
        {totalItems > 0 && (
          <motion.span
            className="absolute -top-2 -right-2 bg-[var(--dark)] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-lg shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            {totalItems}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={toggleCart} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-pointer" />
            <motion.div
              initial={{ x: lang === 'ar' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'ar' ? '-100%' : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`fixed top-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full max-w-sm h-full bg-white shadow-2xl z-50 flex flex-col`}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="p-5 border-b border-[var(--cream-dark)] flex justify-between items-center">
                <button onClick={toggleCart} className="text-[var(--text-muted)] hover:text-red-500 font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50">✕</button>
                <h2 className="text-xl font-black text-[var(--dark)]">{t.title}</h2>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {items.length === 0 ? <p className="text-center text-[var(--text-muted)] mt-20 text-sm">{t.empty}</p> : items.map((item, i) => (
                  <motion.div
                    key={item.cartItemId || item.id}
                    className="flex justify-between items-center bg-[var(--cream)] p-3.5 rounded-2xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button onClick={() => removeFromCart(item.cartItemId || item.id)} className="text-[var(--text-muted)] hover:text-red-500 font-bold transition-colors text-xs">✕</button>
                    <div className="text-right flex-1 mx-3">
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <h4 className="font-bold text-[var(--dark)] text-sm">{item.name}</h4>
                        {item.is_preorder && (
                          <span className="bg-violet-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none">
                            {lang === 'ar' ? 'مسبق' : 'PRE'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold" dir="ltr">{item.price} JOD</p>
                      {item.is_preorder && (() => {
                        const days = getDaysUntilRestock(item.restock_date);
                        return days !== null && days > 0 ? (
                          <p className="text-[9px] text-violet-500 font-bold mt-0.5">
                            {lang === 'ar' ? `يتوفر خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}` : `Ships in ~${days} day${days !== 1 ? 's' : ''}`}
                          </p>
                        ) : null;
                      })()}
                      {item.note && (
                        <p className="text-[9px] text-[var(--text-muted)] mt-1 line-clamp-1">{t.note} {item.note}</p>
                      )}
                      <div className="flex items-center justify-end mt-2">
                        <div className="flex items-center bg-white border border-[var(--cream-dark)] rounded-xl h-7">
                          <button onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)} disabled={!item.is_preorder && item.quantity >= (item.stock ?? 99)} className="w-7 text-[var(--gold)] font-black text-xs hover:bg-[var(--cream)] rounded-r-xl transition-colors">+</button>
                          <div className="w-7 text-center font-black text-[10px]">{item.quantity}</div>
                          <button onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-7 text-[var(--text-muted)] font-black text-xs hover:bg-[var(--cream)] rounded-l-xl transition-colors">-</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-5 border-t border-[var(--cream-dark)]">
                  <div className="flex justify-between items-center mb-5 text-lg font-bold">
                    <span className="gold-shimmer text-xl" dir="ltr">{totalPrice} JOD</span>
                    <span className="text-[var(--dark)]">{t.total}</span>
                  </div>
                  <Link href="/checkout" onClick={toggleCart} className="w-full gold-shimmer-bg gold-glow text-white py-3.5 rounded-2xl font-black text-center block transition-all text-sm">
                    {t.checkout}
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
