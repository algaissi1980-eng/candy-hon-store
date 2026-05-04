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

  const displayText = lang === 'ar'
    ? (textAr || textEn)
    : (textEn || textAr);

  return (
    <div className="flex flex-col items-center gap-3 my-4 z-10 relative">
      {/* شريط الإعلانات — يظهر فقط إذا في نص */}
      {displayText && (
        <motion.div
          className="bg-[var(--dark)] text-[var(--gold-light)] px-6 md:px-10 py-3 text-center text-sm md:text-base font-bold shadow-lg w-auto mx-auto rounded-full border border-[var(--gold)]/20 overflow-hidden relative"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
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
      )}

      {/* أيقونات التواصل الاجتماعي */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* WhatsApp */}
        <motion.a
          href="https://wa.me/962791875758"
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp"
          className="w-32 h-32 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/25 flex items-center justify-center hover:bg-[#25D366] hover:border-[#25D366] hover:shadow-lg hover:shadow-[#25D366]/30 transition-all duration-300 group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg viewBox="0 0 24 24" className="w-16 h-16 fill-[#25D366] group-hover:fill-white transition-colors duration-300">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </motion.a>

        {/* Instagram */}
        <motion.a
          href="https://www.instagram.com/cand.yhon"
          target="_blank"
          rel="noopener noreferrer"
          title="Instagram"
          className="w-32 h-32 rounded-2xl bg-[#DD2A7B]/10 border border-[#DD2A7B]/25 flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:border-transparent hover:shadow-lg hover:shadow-[#DD2A7B]/30 transition-all duration-300 group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg viewBox="0 0 24 24" className="w-16 h-16 fill-[#DD2A7B] group-hover:fill-white transition-colors duration-300">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </motion.a>
      </motion.div>
    </div>
  );
}
