'use client';

import { motion } from 'framer-motion';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-[var(--cream)] flex flex-col items-center justify-center font-sans px-4 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-64 h-64 bg-[var(--gold)]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

      <motion.span
        className="text-6xl mb-6 opacity-30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        ⚠️
      </motion.span>

      <motion.h1
        className="text-3xl font-black text-[var(--dark)] mb-4"
        style={{ fontFamily: 'var(--font-fredoka), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        حدث خطأ غير متوقع
      </motion.h1>

      <motion.p
        className="text-[var(--text-muted)] text-sm font-bold mb-8 text-center max-w-md"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {error.message || 'عذراً، حدث خطأ أثناء تحميل الصفحة.'}
      </motion.p>

      <motion.button
        onClick={reset}
        className="bg-[var(--dark)] text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-[var(--gold)] transition-all shadow-lg"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        إعادة المحاولة
      </motion.button>
    </main>
  );
}
