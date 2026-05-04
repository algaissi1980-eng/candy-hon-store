'use client';

import { supabase } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/languageStore';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { lang } = useLanguageStore();

const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // التوجيه لـ Server Callback — يضمن كتابة Cookies صحيحة تدوم بعد إغلاق المتصفح
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    });
    
    if (error) {
      // خطأ في تسجيل الدخول — يتم التعامل معه عبر redirect
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--cream)] font-sans relative overflow-hidden"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* خلفية ذهبية ديكورية */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-[var(--gold)]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-[var(--gold)]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        className="w-full max-w-md p-8 md:p-10 space-y-7 bg-white rounded-3xl shadow-lg text-center border border-[var(--cream-dark)] relative"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.img
            src="/logo.png"
            alt="Candy Hon"
            className="w-20 h-20 object-contain rounded-full shadow-md"
            style={{ background: 'rgba(255,255,255,0.95)', padding: '3px' }}
            onError={(e: any) => { e.target.style.display = 'none'; }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
          />
          <h1 className="text-3xl font-black text-[var(--dark)]" style={{ fontFamily: 'var(--font-fredoka), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            <span className="gold-shimmer">Candy</span> Hon
          </h1>
          <span className="text-xs text-[var(--text-muted)] font-bold tracking-[0.15em]">كاندي هون</span>
        </motion.div>

        <motion.p
          className="text-[var(--text-muted)] font-medium leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {lang === 'ar'
            ? 'مرحباً بك في كاندي هون! قم بتسجيل الدخول لمتابعة طلباتك.'
            : 'Welcome to Candy Hon! Please log in to view your orders.'}
        </motion.p>

        <motion.button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 border border-[var(--cream-dark)] rounded-2xl shadow-sm bg-white text-[var(--dark)] hover:bg-[var(--cream)] hover:border-[var(--gold-light)] transition-all font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <img src="/google-icon.svg" className="w-5 h-5" alt="Google logo" />
          {lang === 'ar'
            ? 'المتابعة باستخدام حساب Google'
            : 'Continue with Google'}
        </motion.button>
      </motion.div>
    </div>
  );
}