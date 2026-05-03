'use client';
// ─────────────────────────────────────────────────────────────
// RealtimeSync — مكوّن صامت يُفعّل Supabase Realtime
// يُركَّب مرة واحدة في layout.tsx ويعمل في الخلفية
// ليحافظ على تزامن بيانات المنتجات عبر كل الصفحات
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useProductStore } from '../store/productStore';

export default function RealtimeSync() {
  const subscribeRealtime = useProductStore((s) => s.subscribeRealtime);
  const unsubscribeRealtime = useProductStore((s) => s.unsubscribeRealtime);

  useEffect(() => {
    subscribeRealtime();
    return () => unsubscribeRealtime();
  }, [subscribeRealtime, unsubscribeRealtime]);

  // لا يُعرض أي شيء — مكوّن خلفي بحت
  return null;
}
