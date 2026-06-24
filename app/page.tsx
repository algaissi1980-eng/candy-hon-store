'use client';

import { Suspense, useEffect, useRef } from 'react';
import ProductGallery from '../components/ProductGallery';
import { useLanguageStore } from '../store/languageStore';
import { useProductStore } from '../store/productStore';
import AnnouncementBar from '../components/AnnouncementBar';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Image from 'next/image';

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
          Gradient BG + Minimal Floating Decorations
          (Optimized: reduced from 32 → ~10 animation layers)
          =============================================== */}
      <section className="relative w-full h-[100vh] flex items-center justify-center overflow-hidden">

        {/* ─── خلفية Gradient غزل البنات مع Parallax ─── */}
        <motion.div className="absolute inset-0 z-0 scale-110" style={{ y: heroImgY, willChange: 'transform' }}>
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
          <div className="absolute inset-0" style={{ background: 'rgba(255,251,254,0.15)' }} />
        </motion.div>

        {/* ─── فقاعات ملونة — مخفّضة لـ 2 فقط ─── */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          {[
            { size: 14, left: '15%', color: '#E91E90', delay: '0s',  dur: '14s' },
            { size: 18, left: '65%', color: '#4FC3F7', delay: '3s',  dur: '16s' },
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

        {/* ─── غيوم غزل بنات SVG — مخفّضة لـ 2 ─── */}
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
        </div>

        {/* ─── نجوم صغيرة — مخفّضة لـ 2 ─── */}
        <div className="absolute inset-0 z-[3] pointer-events-none">
          {[
            { x: '12%', y: '18%', s: 12, color: '#E91E90', d: '0s',   dur: '3s'   },
            { x: '75%', y: '22%', s: 10, color: '#F8BBD0', d: '1.5s', dur: '3.5s' },
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

        {/* ─── المحتوى الرئيسي مع Parallax + Fade ─── */}
        <motion.div className="relative z-10 max-w-5xl mx-auto px-4 w-full text-center" style={{ y: heroContentY, opacity: heroOpacity, willChange: 'transform, opacity' }}>

          {/* اللوقو الكبير */}
          <motion.div
            className="relative w-24 h-24 md:w-36 md:h-36 mx-auto mb-6 shadow-lg"
            style={{ background: 'white', padding: '4px', borderRadius: '9999px' }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <Image
              src="/logo.webp"
              alt="Candy Hon"
              fill
              priority
              className="object-contain rounded-full"
              sizes="(max-width: 768px) 96px, 144px"
            />
          </motion.div>

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
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.32,201.3,114.2,243.68,109.9,285.49,94.1,321.39,56.44Z" fill="rgba(255, 255, 255, 0.6)"></path>
          </svg>
        </div>

        {/* ─── سهم التمرير — CSS animation بدل Framer Motion infinite ─── */}
        <div
          className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-30"
          style={{ animation: 'hero-scroll-bounce 2s ease-in-out infinite' }}
        >
          <svg className="w-6 h-6 text-[var(--pink)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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