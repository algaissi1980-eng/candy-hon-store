'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// =============================================
// PageTracker — تتبع الزوار الفريدين
//
// طبقة Client (fast-path):
//   sessionStorage يمنع إرسال أي request إضافي
//   خلال نفس جلسة التاب (refresh / navigation)
//
// طبقة Server (source of truth):
//   /api/track يتحقق من Cookie + صلاحية المدير
//   ويحدد إذا كان العداد يُزاد فعلاً
// =============================================

export default function PageTracker() {
  const pathname = usePathname();
  const tracked = useRef(false);

  useEffect(() => {
    // لا نتتبع صفحات الإدارة
    if (pathname?.startsWith('/admin')) return;

    // fast-path: لو سجّلنا بهذا التاب اليوم — لا نرسل request أبداً
    if (tracked.current) return;
    try {
      const todayKey = `ch_tracked_${new Date().toISOString().split('T')[0]}`;
      if (sessionStorage.getItem(todayKey)) {
        tracked.current = true;
        return;
      }
      sessionStorage.setItem(todayKey, '1');
    } catch {
      // SSR أو Private Browsing — نكمل بدون sessionStorage
    }

    // تجاهل البوتات والـ Crawlers
    if (
      typeof navigator !== 'undefined' &&
      /bot|crawl|spider|slurp|lighthouse|prerender/i.test(navigator.userAgent)
    ) return;

    tracked.current = true;

    // إرسال الطلب — الـ Server هو من يقرر إذا يعد أم لا
    fetch('/api/track', {
      method: 'POST',
      // keepalive: يكمل الـ request حتى لو المستخدم غادر الصفحة
      keepalive: true,
    }).catch(() => {});

  }, [pathname]);

  return null;
}
