'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import { useLanguageStore } from '../../store/languageStore';
import { getCityName } from '../../lib/deliveryAreas';
import Link from 'next/link';
import { motion } from 'framer-motion';

function SuccessContent() {
  const { lang } = useLanguageStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [hasPreorderItems, setHasPreorderItems] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!orderId) { router.push('/'); return; }
    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase.channel(`order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (p) => {
        setOrder((prev: any) => ({ ...prev, status: p.new.status }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const fetchOrderDetails = async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (data) setOrder(data);

    // فحص وجود عناصر Pre-order في هذا الطلب
    const { data: items } = await supabase
      .from('order_items')
      .select('is_preorder')
      .eq('order_id', orderId);
    if (items) setHasPreorderItems(items.some((i: any) => i.is_preorder));

    setLoading(false);
  };



  const t = {
    confirmedTitle: lang === 'ar' ? 'شكراً لطلبك! 🍬' : 'Thank You for Your Order! 🍬',
    confirmedDesc: lang === 'ar' ? 'شكراً جزيلاً لثقتك بنا 💚 طلبك في طريقه إليك وسيصلك خلال 1-3 أيام عمل. بانتظارك!' : 'Thank you so much for your order! 💚 Your order is on its way and will arrive within 1-3 business days. We can\'t wait for you to enjoy it!',
    orderNum: lang === 'ar' ? 'رقم الطلب' : 'Order ID',
    totalAmount: lang === 'ar' ? 'المبلغ الكلي' : 'Total Amount',
    ordersBtn: lang === 'ar' ? 'متابعة طلباتي' : 'Track My Orders',
    whatsappBtn: lang === 'ar' ? 'تواصل عبر WhatsApp' : 'Contact on WhatsApp',
    loading: lang === 'ar' ? 'جاري تحميل الطلب...' : 'Loading order...',
    deliveryFee: lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee',
    deliveryArea: lang === 'ar' ? 'منطقة التوصيل' : 'Delivery Area',
    preorderTitle: lang === 'ar' ? 'تنبيه: طلبك يحتوي على منتجات مسبقة الطلب ⏳' : 'Notice: Your order contains pre-order items ⏳',
    preorderDesc: lang === 'ar'
      ? 'بعض المنتجات في طلبك غير متوفرة حالياً وستُشحن عند توفّرها. سنتواصل معك لتحديد موعد التسليم النهائي.'
      : 'Some items in your order are currently out of stock and will be shipped when available. We will contact you to confirm the final delivery date.',
  };

  if (loading || !order) return (
    <div className="min-h-screen flex items-center justify-center font-bold bg-[var(--cream)] pt-36">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--gold-light)] border-t-[var(--gold)] rounded-full animate-spin"></div>
        <span className="text-[var(--text-muted)] font-bold text-sm">{t.loading}</span>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[var(--cream)] flex flex-col items-center justify-center pt-32 pb-12 px-4 sm:px-6 font-sans relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* خلفية ديكورية */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-[var(--gold)]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-[var(--gold)]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        className="bg-white max-w-lg w-full p-6 md:p-10 rounded-3xl shadow-lg border border-[var(--cream-dark)] text-center relative overflow-hidden"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* أيقونة الحالة */}
        <motion.div
          className="text-6xl mb-6"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
        >
          ✅
        </motion.div>

        <motion.h1
          className="text-2xl md:text-3xl font-black mb-4 tracking-tight text-green-600"
          style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {t.confirmedTitle}
        </motion.h1>

        {/* الوصف */}
        <motion.p
          className="text-[var(--text-muted)] mb-6 leading-relaxed font-medium text-sm md:text-base"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {t.confirmedDesc}
        </motion.p>

        {/* تنبيه Pre-order — يظهر فقط إذا الطلب يحتوي على منتجات مسبقة */}
        {hasPreorderItems && (
          <motion.div
            className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-6 text-right"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <p className="text-violet-700 font-black text-sm mb-1">{t.preorderTitle}</p>
            <p className="text-violet-600 text-xs leading-relaxed">{t.preorderDesc}</p>
          </motion.div>
        )}

        <motion.div
          className="bg-[var(--cream)] border border-[var(--cream-dark)] rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-4 border-b border-[var(--cream-dark)] pb-4 text-xs md:text-sm">
            <span className="text-[var(--text-muted)] font-bold uppercase">{t.orderNum}</span>
            <span className="font-mono text-[var(--dark)] font-bold" dir="ltr">#{order.id.split('-')[0]}</span>
          </div>
          {order.delivery_city && (
            <div className="flex justify-between items-center mb-3 text-xs md:text-sm">
              <span className="text-[var(--text-muted)] font-bold uppercase">{t.deliveryArea}</span>
              <span className="font-bold text-[var(--dark)]">{getCityName(order.delivery_city, lang)}</span>
            </div>
          )}
          {order.delivery_fee > 0 && (
            <div className="flex justify-between items-center mb-3 text-xs md:text-sm">
              <span className="text-[var(--text-muted)] font-bold uppercase">{t.deliveryFee}</span>
              <span className="font-bold text-[var(--dark)]" dir="ltr">{order.delivery_fee} JOD</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm pt-3 border-t border-[var(--cream-dark)]">
            <span className="text-[var(--text-muted)] font-bold uppercase">{t.totalAmount}</span>
            <span className="font-black gold-shimmer text-lg md:text-xl" dir="ltr">{order.total_amount} JOD</span>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <a href="https://wa.me/962791875758" target="_blank" rel="noopener noreferrer" className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-600 transition-all uppercase tracking-widest text-sm text-center">{t.whatsappBtn}</a>
          <Link href="/orders" className="w-full bg-[var(--dark)] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-black transition-all uppercase tracking-widest text-sm text-center">{t.ordersBtn}</Link>
        </motion.div>
      </motion.div>
    </main>
  );
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--cream)]"><div className="w-12 h-12 border-4 border-[var(--gold-light)] border-t-[var(--gold)] rounded-full animate-spin"></div></div>}><SuccessContent /></Suspense>;
}
