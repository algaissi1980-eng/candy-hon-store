'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase/client';
import { useLanguageStore } from '../../store/languageStore';
import { useCartStore } from '../../store/cartStore';
import { getCityName } from '../../lib/deliveryAreas';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

function SuccessContent() {
  const { lang } = useLanguageStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);


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
    setLoading(false);
  };

  const handleCancelOrder = async () => {
    const confirmMsg = lang === 'ar' ? 'هل أنت متأكد من رغبتك في إلغاء الطلب والتعديل عليه؟' : 'Are you sure you want to cancel and edit this order?';
    if (!window.confirm(confirmMsg)) return;

    setIsCancelling(true);

    try {
      const { data: itemsToRestore } = await supabase.from('order_items')
        .select('product_id, quantity, price, note, is_preorder, products(name, image_url)')
        .eq('order_id', orderId);

      if (itemsToRestore && itemsToRestore.length > 0) {
        // Pre-order items لم يُخصم مخزونها أصلاً — لا نعيده لتجنب إضافة رصيد وهمي
        const regularItems = itemsToRestore.filter((item: any) => !item.is_preorder);
        for (const item of regularItems) {
          const { data: productData } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (productData !== null) {
            await supabase.from('products').update({ stock: (productData.stock ?? 0) + item.quantity }).eq('id', item.product_id);
          }
        }

        const restoredCart = itemsToRestore.map((item: any) => ({
          id: item.product_id,
          cartItemId: Math.random().toString(36).substring(2, 9),
          name: item.products?.name || 'منتج',
          price: item.price,
          quantity: item.quantity,
          image_url: item.products?.image_url || '',
          note: item.note,
          is_preorder: item.is_preorder ?? false,
        }));

        useCartStore.setState({ items: restoredCart });
      }

      await supabase.from('order_items').delete().eq('order_id', orderId);
      // نسمح بإلغاء الطلبات بحالة confirmed فقط (قبل المعالجة من الإدارة)
      const { error: deleteError } = await supabase.from('orders').delete().eq('id', orderId).eq('status', 'confirmed');

      if (deleteError) throw deleteError;

      toast.success(lang === 'ar' ? 'تم إلغاء الطلب وإرجاع المنتجات للسلة' : 'Order cancelled and items restored to cart');
      router.push('/#menu');

    } catch (error: any) {
      toast.error((lang === 'ar' ? 'حدث خطأ: ' : 'Error: ') + error.message);
      setIsCancelling(false);
    }
  };


  const t = {
    confirmedTitle: lang === 'ar' ? 'تم تأكيد طلبك! 🎉' : 'Order Confirmed! 🎉',
    confirmedDesc: lang === 'ar' ? 'شكراً لك على طلبك! سنتواصل معك قريباً لترتيب التوصيل. يمكنك التواصل معنا على WhatsApp للمزيد من التفاصيل.' : 'Thank you for your order! We will contact you soon to arrange delivery. You can reach us on WhatsApp for more details.',
    orderNum: lang === 'ar' ? 'رقم الطلب' : 'Order ID',
    totalAmount: lang === 'ar' ? 'المبلغ الكلي' : 'Total Amount',
    ordersBtn: lang === 'ar' ? 'متابعة طلباتي' : 'Track My Orders',
    whatsappBtn: lang === 'ar' ? 'تواصل عبر WhatsApp' : 'Contact on WhatsApp',
    cancelBtn: lang === 'ar' ? 'إلغاء الطلب وتعديل المنتجات' : 'Cancel & Edit Order',
    cancellingTxt: lang === 'ar' ? 'جاري الإلغاء والاستعادة...' : 'Restoring cart...',
    loading: lang === 'ar' ? 'جاري تحميل الطلب...' : 'Loading order...',
    deliveryFee: lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee',
    deliveryArea: lang === 'ar' ? 'منطقة التوصيل' : 'Delivery Area',
  };

  if (loading || !order) return (
    <div className="min-h-screen flex items-center justify-center font-bold bg-[var(--cream)] pt-36">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--gold-light)] border-t-[var(--gold)] rounded-full animate-spin"></div>
        <span className="text-[var(--text-muted)] font-bold text-sm">{t.loading}</span>
      </div>
    </div>
  );

  const isConfirmed = order.status === 'confirmed';

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
          className="text-[var(--text-muted)] mb-8 leading-relaxed font-medium text-sm md:text-base"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {t.confirmedDesc}
        </motion.p>

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

          {isConfirmed && (
            <motion.button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="w-full bg-white text-red-500 border border-red-100 font-bold py-4 rounded-2xl hover:bg-red-50 transition-all text-xs disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isCancelling ? t.cancellingTxt : t.cancelBtn}
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--cream)]"><div className="w-12 h-12 border-4 border-[var(--gold-light)] border-t-[var(--gold)] rounded-full animate-spin"></div></div>}><SuccessContent /></Suspense>;
}
