'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--cream)] flex flex-col items-center justify-center font-sans px-4 relative overflow-hidden">
      {/* خلفية ديكورية */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-[var(--gold)]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-[var(--gold)]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

      <motion.span
        className="text-8xl mb-6 opacity-20"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        🍬
      </motion.span>

      <motion.h1
        className="text-6xl md:text-8xl font-black text-[var(--dark)] mb-4"
        style={{ fontFamily: 'var(--font-fredoka), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="gold-shimmer">404</span>
      </motion.h1>

      <motion.p
        className="text-[var(--text-muted)] text-lg font-bold mb-8 text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        يبدو أن هذه الصفحة غير موجودة... ربما أكلها أحدهم!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Link
          href="/"
          className="gold-shimmer-bg gold-glow text-white font-bold px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-lg inline-block"
        >
          العودة للمتجر
        </Link>
      </motion.div>
    </main>
  );
}