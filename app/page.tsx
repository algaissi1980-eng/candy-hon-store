'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import ProductGallery from '../components/ProductGallery';
import { useLanguageStore } from '../store/languageStore';
import { useProductStore } from '../store/productStore';
import AnnouncementBar from '../components/AnnouncementBar';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

export default function Home() {
  const { lang } = useLanguageStore();
  const { products, categories: dynamicCategories, fetchProducts } = useProductStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuInView = useInView(menuRef, { once: true, margin: '-100px' });

  // Parallax على الـ Hero
  const { scrollY } = useScroll();
  const heroImgY = useTransform(scrollY, [0, 600], [0, 150]);
  const heroContentY = useTransform(scrollY, [0, 400], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 350], [1, 0]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const t = {
    subtitle: lang === 'ar' ? 'منتجات فريدة' : 'Unique Products',
    desc: lang === 'ar'
      ? 'اكتشف عالم المرح والإبداع'
      : 'Discover the World of Fun & Creativity... Unique products that bring smiles',

    menuBtn: lang === 'ar' ? 'اكتشف تشكيلتنا' : 'Explore Collection',
    sectionSubtitle: lang === 'ar' ? 'اختر ما يشتهيه قلبك' : 'Choose your heart\'s desire',
    sectionTitle: lang === 'ar' ? 'تشكيلتنا المميزة' : 'Our Collection',
    sectionDesc: lang === 'ar'
      ? 'تصفح تشكيلتنا المميزة من المنتجات الفريدة. تجربة فريدة صُنعت بشغف خصيصاً لك.'
      : 'Browse our exclusive collection of unique products. A special experience crafted just for you.'

  };

  const premiumImages = [
    "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1603532648955-039310d9ed75?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?q=80&w=1000&auto=format&fit=crop"
  ];

  const formattedProducts = products.map((product, index) => ({
    ...product,
    image_url: product.image_url || premiumImages[index % premiumImages.length]
  }));

  return (
    <main className="font-sans min-h-screen bg-[var(--cream)]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ===============================================
          ✨ HERO SECTION — Playful Cotton Candy Vibes
          Gradient BG + Floating SVG Decorations
          =============================================== */}
      <section className="relative w-full h-[100vh] flex items-center justify-center overflow-hidden">

        {/* ─── خلفية Gradient غزل البنات مع Parallax ─── */}
        <motion.div className="absolute inset-0 z-0 scale-110" style={{ y: heroImgY }}>
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 30%, rgba(248,187,208,0.6) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 80% 20%, rgba(179,229,252,0.5) 0%, transparent 55%),
              radial-gradient(ellipse 60% 50% at 50% 80%, rgba(128,203,196,0.35) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 70% 70%, rgba(248,187,208,0.3) 0%, transparent 50%),
              linear-gradient(160deg, #FFF0F7 0%, #F8F0FF 25%, #EBF6FE 50%, #F0FBF9 75%, #FFFBFE 100%)
            `
          }} />
          {/* طبقة نعومة إضافية */}
          <div className="absolute inset-0 backdrop-blur-[0.5px]" style={{ background: 'rgba(255,251,254,0.15)' }} />
        </motion.div>

        {/* ─── فقاعات ملونة تطفو للأعلى ─── */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          {[
            { size: 14, left: '8%', color: '#E91E90', delay: '0s', dur: '12s' },
            { size: 10, left: '22%', color: '#4FC3F7', delay: '2s', dur: '14s' },
            { size: 18, left: '35%', color: '#F8BBD0', delay: '4s', dur: '16s' },
            { size: 8, left: '52%', color: '#80CBC4', delay: '1s', dur: '11s' },
            { size: 12, left: '68%', color: '#B3E5FC', delay: '3s', dur: '13s' },
            { size: 16, left: '82%', color: '#E91E90', delay: '5s', dur: '15s' },
            { size: 6, left: '92%', color: '#4FC3F7', delay: '0.5s', dur: '10s' },
            { size: 10, left: '45%', color: '#F8BBD0', delay: '6s', dur: '17s' },
          ].map((b, i) => (
            <div
              key={`bubble-${i}`}
              className="absolute rounded-full"
              style={{
                width: b.size, height: b.size,
                left: b.left, bottom: '-20px',
                background: `radial-gradient(circle at 35% 35%, ${b.color}80, ${b.color}30)`,
                boxShadow: `inset -2px -2px 4px ${b.color}20, 0 0 8px ${b.color}15`,
                animation: `hero-bubble-rise ${b.dur} ease-in infinite`,
                animationDelay: b.delay,
              }}
            />
          ))}
        </div>

        {/* ─── غيوم غزل بنات SVG ─── */}
        <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
          {/* غيمة يسار */}
          <svg className="absolute -left-10 top-[15%] w-48 md:w-64 opacity-25" viewBox="0 0 200 100" style={{ animation: 'hero-cloud-drift 10s ease-in-out infinite' }}>
            <ellipse cx="70" cy="60" rx="60" ry="30" fill="#F8BBD0" />
            <ellipse cx="110" cy="50" rx="45" ry="28" fill="#FCE4EC" />
            <ellipse cx="50" cy="50" rx="35" ry="22" fill="#F48FB1" />
            <ellipse cx="90" cy="65" rx="50" ry="25" fill="#F8BBD0" />
          </svg>
          {/* غيمة يمين */}
          <svg className="absolute -right-8 top-[10%] w-40 md:w-56 opacity-20" viewBox="0 0 200 100" style={{ animation: 'hero-cloud-drift 13s ease-in-out infinite', animationDelay: '3s' }}>
            <ellipse cx="80" cy="55" rx="55" ry="28" fill="#B3E5FC" />
            <ellipse cx="120" cy="48" rx="40" ry="25" fill="#E1F5FE" />
            <ellipse cx="60" cy="48" rx="30" ry="20" fill="#81D4FA" />
            <ellipse cx="100" cy="60" rx="48" ry="22" fill="#B3E5FC" />
          </svg>
          {/* غيمة وسط صغيرة */}
          <svg className="absolute left-[40%] top-[5%] w-28 md:w-36 opacity-15" viewBox="0 0 200 100" style={{ animation: 'hero-cloud-drift 15s ease-in-out infinite', animationDelay: '5s' }}>
            <ellipse cx="90" cy="55" rx="50" ry="25" fill="#B2DFDB" />
            <ellipse cx="120" cy="50" rx="35" ry="20" fill="#E0F2F1" />
            <ellipse cx="70" cy="52" rx="30" ry="18" fill="#80CBC4" />
          </svg>
        </div>

        {/* ─── نجوم صغيرة متلألئة ─── */}
        <div className="absolute inset-0 z-[3] pointer-events-none">
          {[
            { x: '12%', y: '18%', s: 12, color: '#E91E90', d: '0s', dur: '3s' },
            { x: '28%', y: '12%', s: 8, color: '#4FC3F7', d: '1s', dur: '4s' },
            { x: '75%', y: '22%', s: 10, color: '#F8BBD0', d: '0.5s', dur: '3.5s' },
            { x: '88%', y: '35%', s: 7, color: '#80CBC4', d: '2s', dur: '4.5s' },
            { x: '55%', y: '8%', s: 9, color: '#E91E90', d: '1.5s', dur: '3.2s' },
            { x: '40%', y: '30%', s: 6, color: '#4FC3F7', d: '0.8s', dur: '5s' },
            { x: '18%', y: '45%', s: 8, color: '#B3E5FC', d: '3s', dur: '4.2s' },
            { x: '65%', y: '40%', s: 7, color: '#F8BBD0', d: '2.5s', dur: '3.8s' },
          ].map((star, i) => (
            <svg
              key={`star-${i}`}
              className="absolute"
              width={star.s} height={star.s}
              viewBox="0 0 24 24"
              style={{
                left: star.x, top: star.y,
                animation: `hero-star-twinkle ${star.dur} ease-in-out infinite`,
                animationDelay: star.d,
              }}
            >
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" fill={star.color} opacity="0.6" />
            </svg>
          ))}
        </div>

        {/* ─── حلويات متطايرة SVG ─── */}
        <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
          {/* مصاصة (Lollipop) — يسار */}
          <svg className="absolute left-[5%] md:left-[10%] top-[55%] w-10 md:w-14 opacity-30" viewBox="0 0 40 60" style={{ animation: 'hero-candy-float 8s ease-in-out infinite' }}>
            <line x1="20" y1="28" x2="20" y2="58" stroke="#E91E90" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="16" r="14" fill="none" stroke="#E91E90" strokeWidth="2" />
            <path d="M20 2 A14 14 0 0 1 34 16" fill="none" stroke="#4FC3F7" strokeWidth="2" />
            <path d="M20 2 A14 14 0 0 0 6 16" fill="none" stroke="#F8BBD0" strokeWidth="2" />
            <circle cx="20" cy="16" r="5" fill="#E91E90" opacity="0.3" />
          </svg>

          {/* دونات (Donut) — يمين */}
          <svg className="absolute right-[6%] md:right-[12%] top-[60%] w-10 md:w-14 opacity-25" viewBox="0 0 48 48" style={{ animation: 'hero-candy-float 9s ease-in-out infinite', animationDelay: '2s' }}>
            <circle cx="24" cy="24" r="20" fill="#F8BBD0" />
            <circle cx="24" cy="24" r="8" fill="var(--cream)" />
            <path d="M8 18 Q16 14 24 18 Q32 22 40 16" fill="none" stroke="#4FC3F7" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="14" cy="16" r="1.5" fill="#80CBC4" />
            <circle cx="30" cy="14" r="1.5" fill="#E91E90" />
            <circle cx="22" cy="10" r="1" fill="#4FC3F7" />
            <circle cx="34" cy="20" r="1.2" fill="#80CBC4" />
          </svg>

          {/* حبة كاندي (Wrapped Candy) — يسار وسط */}
          <svg className="absolute left-[15%] md:left-[20%] top-[25%] w-8 md:w-12 opacity-25" viewBox="0 0 50 30" style={{ animation: 'hero-candy-float 7s ease-in-out infinite', animationDelay: '4s' }}>
            <ellipse cx="25" cy="15" rx="12" ry="10" fill="#4FC3F7" />
            <path d="M13 15 L2 8 M13 15 L2 22" stroke="#B3E5FC" strokeWidth="2" strokeLinecap="round" />
            <path d="M37 15 L48 8 M37 15 L48 22" stroke="#B3E5FC" strokeWidth="2" strokeLinecap="round" />
            <line x1="19" y1="9" x2="19" y2="21" stroke="#E1F5FE" strokeWidth="1.5" opacity="0.6" />
            <line x1="25" y1="7" x2="25" y2="23" stroke="#E1F5FE" strokeWidth="1.5" opacity="0.4" />
          </svg>

          {/* آيس كريم — يمين علوي */}
          <svg className="absolute right-[15%] md:right-[18%] top-[20%] w-8 md:w-12 opacity-20" viewBox="0 0 36 56" style={{ animation: 'hero-candy-float 10s ease-in-out infinite', animationDelay: '1s' }}>
            <polygon points="10,28 26,28 18,54" fill="#F8BBD0" />
            <line x1="12" y1="32" x2="17" y2="50" stroke="#E91E90" strokeWidth="0.5" opacity="0.4" />
            <line x1="24" y1="32" x2="19" y2="50" stroke="#E91E90" strokeWidth="0.5" opacity="0.4" />
            <circle cx="18" cy="22" r="10" fill="#80CBC4" />
            <circle cx="12" cy="16" r="8" fill="#F8BBD0" />
            <circle cx="24" cy="17" r="8" fill="#B3E5FC" />
            <circle cx="14" cy="14" r="1" fill="white" opacity="0.6" />
          </svg>

          {/* قطعة كب كيك — أسفل يمين */}
          <svg className="absolute right-[30%] bottom-[22%] w-9 md:w-12 opacity-20" viewBox="0 0 40 44" style={{ animation: 'hero-candy-float 11s ease-in-out infinite', animationDelay: '3s' }}>
            <path d="M8,26 L12,42 L28,42 L32,26 Z" fill="#F8BBD0" />
            <line x1="14" y1="28" x2="14" y2="40" stroke="#FCE4EC" strokeWidth="1" opacity="0.5" />
            <line x1="20" y1="28" x2="20" y2="40" stroke="#FCE4EC" strokeWidth="1" opacity="0.5" />
            <line x1="26" y1="28" x2="26" y2="40" stroke="#FCE4EC" strokeWidth="1" opacity="0.5" />
            <ellipse cx="20" cy="22" rx="14" ry="10" fill="#E91E90" opacity="0.7" />
            <ellipse cx="16" cy="18" rx="8" ry="7" fill="#4FC3F7" opacity="0.5" />
            <ellipse cx="25" cy="19" rx="7" ry="6" fill="#80CBC4" opacity="0.5" />
            <circle cx="20" cy="14" r="3" fill="#F8BBD0" />
          </svg>
        </div>

        {/* ─── حبيبات ملونة (Sprinkles) ─── */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          {[
            { x: '10%', color: '#E91E90', d: '0s', dur: '18s', rot: 45 },
            { x: '25%', color: '#4FC3F7', d: '3s', dur: '22s', rot: -30 },
            { x: '42%', color: '#80CBC4', d: '6s', dur: '20s', rot: 60 },
            { x: '58%', color: '#F8BBD0', d: '1s', dur: '24s', rot: -45 },
            { x: '73%', color: '#B3E5FC', d: '4s', dur: '19s', rot: 30 },
            { x: '90%', color: '#E91E90', d: '7s', dur: '21s', rot: -60 },
          ].map((s, i) => (
            <div
              key={`sprinkle-${i}`}
              className="absolute rounded-full"
              style={{
                width: 3, height: 10,
                left: s.x, top: '-15px',
                backgroundColor: s.color,
                opacity: 0,
                borderRadius: '3px',
                transform: `rotate(${s.rot}deg)`,
                animation: `hero-sprinkle-fall ${s.dur} linear infinite`,
                animationDelay: s.d,
              }}
            />
          ))}
        </div>

        {/* ─── المحتوى الرئيسي مع Parallax + Fade ─── */}
        <motion.div className="relative z-10 max-w-5xl mx-auto px-4 w-full text-center" style={{ y: heroContentY, opacity: heroOpacity }}>

          {/* اللوقو الكبير */}
          <motion.img
            src="/logo.webp"
            alt="Candy Hon"
            className="w-24 h-24 md:w-36 md:h-36 mx-auto mb-6 object-contain rounded-full shadow-lg"
            style={{ background: 'white', padding: '4px' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* العنوان الفرعي */}
          <motion.span
            className="uppercase tracking-[0.4em] text-[10px] md:text-xs font-bold text-[var(--pink)]/60 mb-5 block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            dir="ltr"
          >
            {t.subtitle}
          </motion.span>

          {/* الاسم الرئيسي — Pink Shimmer */}
          <motion.h1
            className="text-5xl md:text-8xl font-black mb-3 leading-tight gold-shimmer tracking-tight"
            style={{ fontFamily: 'var(--font-fredoka), sans-serif', filter: 'drop-shadow(0 4px 12px rgba(233,30,144,0.15))' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            dir="ltr"
          >
            Candy Hon
          </motion.h1>

          {/* الاسم العربي */}
          <motion.p
            className="text-lg md:text-2xl font-bold text-[var(--pink-dark)]/50 mb-6"
            style={{ fontFamily: 'var(--font-tajawal)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            كاندي هون
          </motion.p>

          {/* الوصف */}
          <motion.p
            className="text-sm md:text-lg text-[var(--text-primary)]/80 mb-10 font-medium leading-relaxed max-w-xl mx-auto glass-card px-6 py-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7 }}
          >
            {t.desc}
          </motion.p>

          {/* زر CTA — متوهج */}
          <motion.div
            className="flex justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            <a href="#menu" className="glass-button px-10 md:px-14 py-4 md:py-5 text-base md:text-lg font-bold shadow-lg">
              {t.menuBtn}
            </a>
          </motion.div>
        </motion.div>

        {/* ─── الموجة السفلية (زجاجية) ─── */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-[0] z-20">
          <svg className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[90px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.32,201.3,114.2,243.68,109.9,285.49,94.1,321.39,56.44Z" fill="rgba(255, 255, 255, 0.6)" backdrop-filter="blur(10px)"></path>
          </svg>
        </div>

        {/* ─── سهم التمرير المتحرك ─── */}
        <motion.div
          className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-30"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="w-6 h-6 text-[var(--pink)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* شريط الإعلانات */}
      <AnnouncementBar />

      {/* ===============================================
          🍫 قسم المنتجات — مع ظهور متحرك
          =============================================== */}
      <section id="menu" className="max-w-7xl mx-auto px-5 md:px-6 pt-32 pb-20 md:py-28 relative" ref={menuRef}>

        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={menuInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-[var(--pink-hover)] font-black tracking-[0.2em] text-xs md:text-sm mb-3 block uppercase">{t.sectionSubtitle}</span>
          <h2 className="text-4xl md:text-6xl font-black text-[var(--dark)] mb-6 tracking-tight" style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}>
            {t.sectionTitle}
          </h2>
          <div className="h-1 bg-[var(--pink)] mx-auto rounded-full mb-6 opacity-40 w-32"></div>
          <p className="text-[var(--text-muted)] text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed">{t.sectionDesc}</p>
        </motion.div>

        <Suspense fallback={<div className="text-center py-20 text-[var(--text-muted)] font-bold">...</div>}>
          <ProductGallery products={formattedProducts} storeCategories={dynamicCategories} />
        </Suspense>
      </section>
    </main>
  );
}