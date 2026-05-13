'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useLanguageStore } from '../../store/languageStore';
import { getCityName } from '../../lib/deliveryAreas';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { optimizeThumbnail } from '../../lib/optimizeImage';

export default function OrdersPage() {
  const { lang } = useLanguageStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      fetchMyOrders(user.id);
    };
    fetchUserAndOrders();
  }, [router]);

  const fetchMyOrders = async (uid: string) => {
    const { data } = await supabase.from('orders')
      .select(`id, total_amount, status, created_at, delivery_city, delivery_fee, order_items ( quantity, price, products ( name, image_url ) )`)
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel('my-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, () => { fetchMyOrders(userId); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const t = {
    title: lang === 'ar' ? 'طلباتي السابقة' : 'My Previous Orders',
    back: lang === 'ar' ? 'العودة للمتجر' : 'Back to Shop',
    empty: lang === 'ar' ? 'لم تقم بأي طلبات بعد.' : 'You haven\'t placed any orders yet.',
    shopNow: lang === 'ar' ? 'ابدأ التسوق الآن' : 'Start Shopping Now',
    orderId: lang === 'ar' ? 'رقم الطلب' : 'Order ID',
    orderDate: lang === 'ar' ? 'تاريخ الطلب' : 'Order Date',
    total: lang === 'ar' ? 'المجموع الكلي' : 'Total Amount',
    cancel: lang === 'ar' ? 'إلغاء الطلب' : 'Cancel Order',
    payBtn: lang === 'ar' ? 'إتمام الدفع' : 'Pay Now',
    whatsappHelp: lang === 'ar' ? 'تواصل معنا' : 'Contact Us',
    items: lang === 'ar' ? 'محتويات الطلب:' : 'Order Content:',
    qty: lang === 'ar' ? 'الكمية:' : 'Qty:',
    delivery: lang === 'ar' ? 'التوصيل:' : 'Delivery:',
    loading: lang === 'ar' ? 'جاري تحميل الطلبات...' : 'Loading orders...',
    confirmCancel: lang === 'ar' ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?',
    statuses: {
      confirmed: lang === 'ar' ? 'مؤكد' : 'Confirmed',
      processing: lang === 'ar' ? 'قيد التجهيز' : 'Processing',
      completed: lang === 'ar' ? 'مكتمل' : 'Completed',
    }
  };

  const getStatusBadge = (status: string) => {
    const s = t.statuses[status as keyof typeof t.statuses] || status;
    const colors: any = {
      confirmed: 'bg-[var(--gold)]/10 text-[var(--gold-dark)] border-[var(--gold)]/30',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-green-50 text-green-700 border-green-200'
    };
    return <span className={`${colors[status] || 'bg-gray-50 border-gray-200'} px-4 py-1.5 rounded-xl text-xs font-bold border`}>{s}</span>;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm(t.confirmCancel)) return;
    try {
      const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
      if (error) throw error;
      toast.success(lang === 'ar' ? 'تم إلغاء الطلب بنجاح' : 'Order cancelled successfully');
      if (userId) fetchMyOrders(userId);
    } catch (error: any) { toast.error('Error: ' + error.message); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-bold font-sans bg-[var(--cream)] pt-36">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--gold-light)] border-t-[var(--gold)] rounded-full animate-spin"></div>
        <span className="text-[var(--text-muted)] font-bold text-sm">{t.loading}</span>
      </div>
    </div>
  );

  return (
    <main className="pt-36 pb-10 px-6 md:px-10 max-w-5xl mx-auto font-sans min-h-screen bg-[var(--cream)] relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* خلفية ديكورية */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-[var(--gold)]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        className="mb-10 relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/#menu" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--gold)] font-bold transition-all group">
          <span dir="ltr" className="inline-block transition-transform group-hover:translate-x-1">{lang === 'ar' ? '→' : '←'}</span> {t.back}
        </Link>
      </motion.div>

      <motion.h1
        className="text-4xl md:text-5xl font-black text-[var(--dark)] mb-12 relative"
        style={{ fontFamily: 'var(--font-fredoka), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {t.title}
      </motion.h1>

      {orders.length === 0 ? (
        <motion.div
          className="bg-white p-12 rounded-3xl shadow-sm border border-[var(--cream-dark)] text-center flex flex-col items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-6xl mb-6 opacity-20">🧁</span>
          <p className="text-xl text-[var(--text-muted)] mb-8 font-bold">{t.empty}</p>
          <Link href="/#menu" className="gold-shimmer-bg gold-glow text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg">{t.shopNow}</Link>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              className="bg-white rounded-3xl shadow-sm border border-[var(--cream-dark)] overflow-hidden hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="bg-[var(--cream)]/50 p-6 md:p-8 border-b border-[var(--cream-dark)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">{t.orderId}</p>
                  <p className="text-[var(--dark)] font-mono font-bold text-xs" dir="ltr">#{order.id.split('-')[0]}</p>
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                  {order.delivery_city && (
                    <div className="bg-white p-3 px-5 rounded-2xl shadow-sm border border-[var(--cream-dark)]">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-0.5 uppercase">{t.delivery}</span>
                      <span className="text-sm font-bold text-[var(--dark)]">{getCityName(order.delivery_city, lang)} <span className="text-[var(--gold-dark)]" dir="ltr">({order.delivery_fee || 0} JOD)</span></span>
                    </div>
                  )}
                  <div className="bg-white p-3 px-5 rounded-2xl shadow-sm border border-[var(--cream-dark)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-0.5 uppercase">{t.total}</span>
                    <span className="text-lg font-black gold-shimmer" dir="ltr">{order.total_amount} JOD</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(order.status)}

                    {order.status === 'confirmed' && (
                      <>
                        <button onClick={() => handleCancelOrder(order.id)} className="text-red-500 bg-red-50 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
                          {t.cancel}
                        </button>
                      </>
                    )}

                    <a
                      href={`https://wa.me/962791875758?text=${encodeURIComponent(lang === 'ar' ? `مرحباً، لدي استفسار بخصوص الطلب رقم #${order.id.split('-')[0]}` : `Hello, I have a question about order #${order.id.split('-')[0]}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {t.whatsappHelp}
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h3 className="font-bold text-[var(--dark)] mb-6 border-b border-[var(--cream-dark)] pb-2">{t.items}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.order_items.map((item: any, idx: number) => (
                    <motion.div
                      key={idx}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--cream-dark)] bg-[var(--cream)]/30 hover:shadow-sm transition-all"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                    >
                      <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-[var(--cream-dark)]">
  {item.products?.image_url ? (
    <Image
      src={optimizeThumbnail(item.products.image_url)}
      alt={item.products?.name || "صورة المنتج"}
      width={56}
      height={56}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-2xl">🍰</div>
  )}
</div>
<div className="flex-1">
  <h4 className="font-bold text-[var(--dark)] text-sm">{item.products?.name}</h4>
  <p className="text-xs text-[var(--text-muted)] font-bold mt-1">{t.qty} <span className="text-[var(--gold-dark)]">{item.quantity}</span></p>
</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
