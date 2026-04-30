'use client';

import { useEffect, useState } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

const MiniCandy = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 inline-block ${className}`} fill="none">
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <ellipse cx="12" cy="12" rx="5" ry="4" />
      <path d="M7 12 L3 8 M7 12 L3 16" />
      <path d="M17 12 L21 8 M17 12 L21 16" />
    </g>
  </svg>
);

export default function AnnouncementBar() {
  const { lang } = useLanguageStore();
  const pathname = usePathname();
  const [textAr, setTextAr] = useState('');
  const [textEn, setTextEn] = useState('');

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('announcement_text_ar, announcement_text_en')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setTextAr(data.announcement_text_ar || '');
          setTextEn(data.announcement_text_en || '');
        }
      });
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  // النص المناسب للغة الحالية — مع fallback للغة الأخرى
  const displayText = lang === 'ar'
    ? (textAr || textEn)
    : (textEn || textAr);

  // لو ما في نص → لا يظهر الشريط
  if (!displayText) return null;

  return (
    <motion.div
      className="bg-[var(--dark)] text-[var(--gold-light)] px-6 md:px-10 py-3 text-center text-sm md:text-base font-bold shadow-lg w-auto mx-auto my-4 z-10 relative rounded-full border border-[var(--gold)]/20 overflow-hidden"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* خلفية ذهبية متوهجة */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--gold)]/[0.05] to-transparent pointer-events-none"></div>

      <span className="flex items-center justify-center gap-2 relative">
        <motion.span
          className="inline-block"
          initial={{ opacity: 0, rotate: -20 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
        >
          <MiniCandy className="text-[var(--gold)]" />
        </motion.span>
        <span className="gold-shimmer">{displayText}</span>
        <motion.span
          className="inline-block"
          initial={{ opacity: 0, rotate: 20 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
        >
          <MiniCandy className="text-[var(--gold)] scale-x-[-1]" />
        </motion.span>
      </span>
    </motion.div>
  );
}
