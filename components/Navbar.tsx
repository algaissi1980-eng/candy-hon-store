'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase/client';
import { useEffect, useState } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useCartStore } from '../store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// =============================================
// Navbar — الهوية الجديدة (1a "Airy boutique pastel")
// شريط أبيض ثابت بعرض كامل + فاصل scallop سفلي
// أهداف لمس ≥ 44px، بدون تحولات تمرير أو حركات دخول
// =============================================

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { lang, toggleLanguage, _hasHydrated: langHydrated } = useLanguageStore();
  const clearCart = useCartStore((state: any) => state.clearCart);
  const toggleCart = useCartStore((state: any) => state.toggleCart);
  const items = useCartStore((state: any) => state.items);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // دالة واحدة مشتركة تفحص صلاحية الأدمن عبر RPC (يتجاوز RLS)
    const syncAdmin = async (hasUser: boolean) => {
      if (!hasUser) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc('is_admin');
      setIsAdmin(data === true);
    };

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      syncAdmin(!!u);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      syncAdmin(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // إخفاء الـ Navbar في صفحة الإدارة — بعد كل الـ Hooks
  if (pathname?.startsWith('/admin')) return null;
  if (!mounted || !langHydrated) return null;

  const signOut = async () => {
    await supabase.auth.signOut();
    clearCart();
    window.location.href = '/';
  };

  const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const t = {
    welcome: lang === 'ar' ? 'مرحباً،' : 'Hello,',
    friend: lang === 'ar' ? 'يا صديقي' : 'Friend',
    admin: lang === 'ar' ? 'الإدارة' : 'Admin',
    orders: lang === 'ar' ? 'طلباتي' : 'My Orders',
    logout: lang === 'ar' ? 'خروج' : 'Logout',
    login: lang === 'ar' ? 'تسجيل الدخول' : 'Login',
    cart: lang === 'ar' ? 'السلة' : 'Cart',
  };

  return (
    <div className="fixed top-0 inset-x-0 z-50" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <nav className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-[72px] flex items-center justify-between gap-3">

          {/* الشعار + الاسم */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
            <span className="relative w-[42px] h-[42px] md:w-[52px] md:h-[52px] rounded-full bg-white border border-[var(--border)] p-0.5 shrink-0">
              <Image
                src="/logo.webp"
                alt="Candy Hon"
                fill
                priority
                className="object-contain rounded-full"
                sizes="52px"
              />
            </span>
            <span className="flex flex-col leading-none min-w-0">
              <span
                className="text-[15px] md:text-lg font-semibold text-[var(--ink-900)] tracking-tight truncate"
                style={{ fontFamily: 'var(--font-display-en)' }}
                dir="ltr"
              >
                Candy Hon
              </span>
              <span className="text-[11px] md:text-xs font-bold text-[var(--ink-500)] truncate">
                كاندي هون
              </span>
            </span>
          </Link>

          {/* أزرار — سطح المكتب */}
          <div className="hidden md:flex items-center gap-2.5">
            {user && (
              <span className="text-[var(--ink-700)] font-bold text-xs whitespace-nowrap">
                {t.welcome} {user.user_metadata?.full_name?.split(' ')[0] || t.friend}
              </span>
            )}

            {user && isAdmin && (
              <Link
                href="/admin"
                className="h-11 flex items-center text-xs font-bold text-white bg-[var(--ink-900)] hover:bg-[var(--pink-700)] px-4 rounded-full transition-colors duration-150"
              >
                {t.admin}
              </Link>
            )}

            {user ? (
              <>
                <Link
                  href="/orders"
                  className="h-11 flex items-center text-xs font-bold text-[var(--ink-700)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--pink-400)] hover:text-[var(--pink-600)] px-4 rounded-full transition-colors duration-150"
                >
                  {t.orders}
                </Link>
                <button
                  onClick={signOut}
                  className="h-11 text-xs text-[var(--error)] font-bold px-3.5 rounded-full hover:bg-[var(--error-bg)] transition-colors duration-150"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="h-11 flex items-center bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white px-5 rounded-full font-bold text-sm transition-colors duration-150"
              >
                {t.login}
              </Link>
            )}

            {/* تبديل اللغة — 44px */}
            <button
              onClick={toggleLanguage}
              aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              className="w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--pink-400)] text-[var(--ink-900)] font-bold text-xs transition-colors duration-150"
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            {/* السلة — 44px مع عداد */}
            <button
              onClick={toggleCart}
              aria-label={t.cart}
              className="relative w-11 h-11 rounded-full bg-[var(--pink-50)] border border-[var(--pink-200)] hover:border-[var(--pink-400)] flex items-center justify-center transition-colors duration-150"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--pink-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 bg-[var(--pink-600)] text-white text-[10px] font-black rounded-full flex items-center justify-center" dir="ltr">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* أزرار — الموبايل */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={toggleLanguage}
              aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              className="w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-900)] font-bold text-xs"
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            <button
              onClick={toggleCart}
              aria-label={t.cart}
              className="relative w-11 h-11 rounded-full bg-[var(--pink-50)] border border-[var(--pink-200)] flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--pink-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 bg-[var(--pink-600)] text-white text-[10px] font-black rounded-full flex items-center justify-center" dir="ltr">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              className="w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-900)] text-sm font-bold"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* القائمة المنسدلة للموبايل */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-full inset-x-3 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-hover)] p-4 flex flex-col gap-2.5 md:hidden"
            >
              {user ? (
                <>
                  <span className="text-[var(--ink-900)] font-bold text-sm text-center mb-1 pb-2 border-b border-[var(--border)]">
                    {t.welcome} {user.user_metadata?.full_name || t.friend}
                  </span>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="h-11 flex items-center justify-center text-sm font-black text-white bg-[var(--ink-900)] rounded-xl">
                      {t.admin}
                    </Link>
                  )}
                  <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)} className="h-11 flex items-center justify-center text-sm font-bold text-[var(--ink-700)] bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                    {t.orders}
                  </Link>
                  <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="h-11 text-sm text-[var(--error)] font-bold bg-[var(--error-bg)] rounded-xl">
                    {t.logout}
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="h-11 flex items-center justify-center bg-[var(--pink-600)] text-white rounded-xl font-bold">
                  {t.login}
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* فاصل الـ scallop — أصداف بيضاء بلون الشريط فوق محتوى الصفحة */}
      <div className="scallop-edge" style={{ '--scallop-color': 'var(--surface)' } as React.CSSProperties} />
    </div>
  );
}
