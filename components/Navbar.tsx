'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { useCartStore } from '../store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { lang, toggleLanguage, _hasHydrated: langHydrated } = useLanguageStore();
  const clearCart = useCartStore((state: any) => state.clearCart);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // تتبع التمرير لتغيير مظهر Navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // دالة واحدة مشتركة تفحص صلاحية الأدمن عبر RPC (يتجاوز RLS)
    const syncAdmin = async (hasUser: boolean) => {
      if (!hasUser) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc('is_admin');
      setIsAdmin(data === true);
    };

    // الفحص الأولي
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      syncAdmin(!!u);
    });

    // الاستماع لتغييرات Auth (بعد Google redirect مثلاً)
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

  const t = {
    welcome: lang === 'ar' ? 'مرحباً،' : 'Hello,',
    friend: lang === 'ar' ? 'يا صديقي' : 'Friend',
    admin: lang === 'ar' ? '👑 الطلبات' : '👑 Orders',
    orders: lang === 'ar' ? 'طلباتي' : 'My Orders',
    logout: lang === 'ar' ? 'خروج' : 'Logout',
    login: lang === 'ar' ? 'تسجيل الدخول' : 'Login'
  };

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-3 pt-3 md:px-4 md:pt-4 pointer-events-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`pointer-events-auto w-full max-w-6xl rounded-3xl transition-all duration-500 flex justify-between items-center relative ${
          scrolled
            ? 'bg-white/90 border border-white/70 shadow-lg px-4 md:px-6 py-2'
            : 'bg-white/60 border border-white/50 shadow-md px-4 md:px-8 py-3'
        }`}
      >

        {/* الشعار — اللوقو كبير ونظيف بدون حواف سوداء */}
        <Link href="/" className="hover:scale-[1.03] transition-transform flex items-center gap-3 shrink-0">
          <motion.img
            src="/logo.webp"
            alt="Candy Hon"
            loading="eager"
            fetchPriority="high"
            className={`object-contain rounded-full transition-all duration-500 ${
              scrolled ? 'h-10 md:h-12' : 'h-12 md:h-16'
            }`}
            style={{
              filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.15))',
              background: 'white',
              padding: '2px',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            whileHover={{ rotate: [0, -3, 3, 0], transition: { duration: 0.5 } }}
          />
          <div className={`flex flex-col transition-all duration-500 ${scrolled ? 'gap-0' : 'gap-0.5'}`}>
            <span className={`font-black text-[var(--dark)] leading-none transition-all duration-500 ${scrolled ? 'text-sm md:text-base' : 'text-base md:text-xl'}`} style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}>
              <span className="gold-shimmer">Candy</span> Hon
            </span>
            {!scrolled && (
              <span className="text-[9px] md:text-[10px] text-[var(--text-muted)] font-bold tracking-[0.15em] uppercase">كاندي هون</span>
            )}
          </div>
        </Link>

        {/* Desktop — أزرار الشاشات الكبيرة */}
        <div className="hidden md:flex items-center gap-4">
          <button onClick={toggleLanguage} className="flex items-center justify-center w-9 h-9 rounded-full bg-white/50 hover:bg-white text-[var(--dark)] font-bold shadow-sm transition-all text-xs border border-white/60">
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>

          <div className="w-px h-5 bg-[var(--gold-light)]/60"></div>

          {user ? (
            <div className="flex items-center gap-2.5">
              <span className="text-[var(--text-secondary)] font-bold text-xs">
                {t.welcome} {user.user_metadata?.full_name?.split(' ')[0] || t.friend}
              </span>
              {isAdmin && (
                <Link href="/admin" className="text-xs font-bold text-white bg-[var(--dark)] hover:bg-[var(--pink)] px-3.5 py-1.5 rounded-full shadow-sm transition-all duration-300">
                  {t.admin}
                </Link>
              )}
              <Link href="/orders" className="text-xs font-bold text-[var(--dark)] bg-[var(--cream-dark)] border border-[var(--gold-light)]/50 hover:border-[var(--gold)] px-3.5 py-1.5 rounded-xl transition-all">
                {t.orders}
              </Link>
              <button onClick={signOut} className="text-xs text-red-400 font-bold px-3 py-1.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
                {t.logout}
              </button>
            </div>
          ) : (
            <Link href="/login" className="glass-button px-6 py-2 font-bold shadow-sm text-sm">
              {t.login}
            </Link>
          )}
        </div>

        {/* Mobile — أزرار الهاتف */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleLanguage} className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--cream-dark)] text-[var(--dark)] font-black text-[10px]">
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm border border-[var(--gold-light)]/40 text-sm"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* القائمة المنسدلة للموبايل */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute top-[120%] left-2 right-2 bg-white/95 backdrop-blur-xl border border-[var(--gold-light)]/30 rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5 md:hidden"
            >
              {user ? (
                <>
                  <span className="text-[var(--dark)] font-bold text-sm text-center mb-1 pb-2 border-b border-[var(--cream-dark)]">
                    {t.welcome} {user.user_metadata?.full_name || t.friend}
                  </span>
                  {isAdmin && <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-center text-sm font-black text-white bg-[var(--dark)] py-2.5 rounded-xl">{t.admin}</Link>}
                  <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-center text-sm font-bold text-[var(--dark)] bg-[var(--cream)] border border-[var(--gold-light)]/50 py-2.5 rounded-xl">{t.orders}</Link>
                  <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="text-center text-sm text-red-500 font-bold py-2.5 bg-red-50 rounded-xl">{t.logout}</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center gold-shimmer-bg text-white py-2.5 rounded-xl font-bold shadow-md">
                  {t.login}
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </motion.nav>
    </div>
  );
}
