'use client';

import { useEffect, useState, useRef } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { supabase } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { optimizeThumbnail } from '../../lib/optimizeImage';
import { DELIVERY_ZONES, ALL_CITIES, getDeliveryFee, getCityName, getEffectiveDeliveryFee, hasDeliveryDiscount } from '../../lib/deliveryAreas';
import { getDaysUntilRestock } from '../../lib/preorderUtils';


export default function CheckoutPage() {
  const { lang } = useLanguageStore();
  const router = useRouter();
  const cartData = useCartStore((state: any) => state.items);
  const clearCartFn = useCartStore((state: any) => state.clearCart);

  const [mounted, setMounted] = useState(false);
  const hasHydrated = useCartStore((state: any) => state._hasHydrated);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', notes: '', deliveryCity: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promo Code states
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);   // نسبة الخصم %
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  // Active Offers
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  useEffect(() => {
    supabase.rpc('get_active_offers').then(({ data }) => {
      if (data) setActiveOffers(data);
    });
  }, []);

  // subtotalForFee — مجموع المنتجات قبل أي خصم (لحساب رسوم التوصيل)
  const subtotalForFee = cartData.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  // حساب رسوم التوصيل بناءً على المدينة المختارة (مع عرض الـ 30 JOD)
  const deliveryFee = formData.deliveryCity ? getEffectiveDeliveryFee(formData.deliveryCity, subtotalForFee) : null;
  const baseFee = formData.deliveryCity ? getDeliveryFee(formData.deliveryCity) : null;
  const isCityUncovered = formData.deliveryCity === '__other__';
  const deliveryDiscounted = formData.deliveryCity ? hasDeliveryDiscount(formData.deliveryCity, subtotalForFee) : false;

  const alertShown = useRef(false);

  useEffect(() => {
    const checkAuthAndPendingOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (!alertShown.current) {
          alertShown.current = true;
          toast.error(lang === 'ar' ? 'يرجى تسجيل الدخول لإتمام طلبك' : 'Please login to complete your order');
          router.push('/login?redirect=/checkout');
        }
        return;
      }

      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', session.user.id)
        .in('status', ['confirmed'])
        .limit(1);

      if (pendingOrders && pendingOrders.length > 0) {
        if (!alertShown.current) {
          alertShown.current = true;
          toast.error(lang === 'ar'
            ? 'لديك طلب قيد المعالجة! يرجى إلغاء الطلب السابق قبل إنشاء طلب جديد'
            : 'You have an active order! Please cancel it before creating a new one'
          );
          router.push(`/success?orderId=${pendingOrders[0].id}`);
        }
      }
    };

    checkAuthAndPendingOrders();
  }, [router, lang]);

  useEffect(() => { setMounted(true); }, []);

  const t = {
    title: lang === 'ar' ? 'إتمام الطلب' : 'Checkout',
    name: lang === 'ar' ? 'الاسم الكامل' : 'Full Name',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    address: lang === 'ar' ? 'تفاصيل العنوان' : 'Address Details',
    notes: lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)',
    confirmBtn: lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order',
    processingBtn: lang === 'ar' ? 'جاري تأكيد الطلب...' : 'Processing...',
    summary: lang === 'ar' ? 'ملخص الطلب' : 'Order Summary',
    subtotal: lang === 'ar' ? 'مجموع المنتجات' : 'Products Subtotal',
    total: lang === 'ar' ? 'المجموع الكلي' : 'Total Amount',
    promoPlaceholder: lang === 'ar' ? 'كود الخصم' : 'Promo Code',
    promoApplyBtn: lang === 'ar' ? 'تطبيق' : 'Apply',
    promoApplied: lang === 'ar' ? 'تم تطبيق الكود ✓' : 'Code applied ✓',
    promoDiscount: lang === 'ar' ? 'خصم الكود' : 'Promo Discount',
    deliveryOffer: lang === 'ar' ? 'خصم عرض التوصيل 🎉' : 'Delivery Offer 🎉',
    offerSale:     lang === 'ar' ? 'عرض خاص 🏷️' : 'Special Offer 🏷️',
    freeItem:      lang === 'ar' ? 'هدية مجانية 🎁' : 'Free Gift 🎁',
    minOrderMsg:   lang === 'ar' ? 'الحد الأدنى للطلب 5 JOD' : 'Minimum order 5 JOD',
    deliveryFreeMsg: lang === 'ar' ? 'مجاني' : 'Free',
    emptyCart: lang === 'ar' ? 'السلة فارغة' : 'Cart is Empty',
    backMenu: lang === 'ar' ? 'العودة للقائمة' : 'Back to Menu',
    deliveryCity: lang === 'ar' ? 'منطقة التوصيل' : 'Delivery Area',
    selectCity: lang === 'ar' ? 'اختر منطقتك...' : 'Select your area...',
    otherArea: lang === 'ar' ? 'منطقة أخرى' : 'Other Area',
    deliveryFee: lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee',
    uncoveredMsg: lang === 'ar'
      ? 'عذراً، التوصيل غير متاح لمنطقتك حالياً. تواصل معنا عبر واتساب لترتيب التوصيل.'
      : 'Sorry, delivery is not available for your area. Contact us on WhatsApp to arrange delivery.',
    whatsappLink: lang === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp',
    selectCityError: lang === 'ar' ? 'يرجى اختيار منطقة التوصيل' : 'Please select a delivery area',
  };

  // ننتظر حتى يكتمل mounted والـ Zustand hydration من localStorage
  if (!mounted || !hasHydrated) return null;

  if (cartData.length === 0) {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center bg-[var(--cream)] font-sans pt-36 px-4"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.span
          className="text-6xl mb-6 opacity-30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >🛒</motion.span>
        <h2 className="text-2xl md:text-3xl font-black text-[var(--dark)] mb-6 tracking-tight text-center" style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}>{t.emptyCart}</h2>
        <Link href="/#menu" className="gold-shimmer-bg gold-glow text-white font-bold px-8 py-3.5 rounded-2xl hover:scale-105 transition-all shadow-md text-sm md:text-base">{t.backMenu}</Link>
      </motion.div>
    );
  }

  const subtotal = subtotalForFee;
  const discountAmount = promoApplied ? Math.round(subtotal * promoDiscount) / 100 : 0;
  // خصم العروض التلقائية (sale_percent)
  const offerSaleDiscount = activeOffers
    .filter(o => o.type === 'sale_percent' && o.discount_percentage)
    .reduce((acc, o) => acc + Math.round(subtotal * o.discount_percentage) / 100, 0);
  // العناصر المجانية — تظهر فقط إذا الفاتورة بلغت الحد الأدنى الذي حدده المدير
  const freeItems = activeOffers.filter(o => o.type === 'free_item' && subtotal >= (o.min_order_amount || 0));
  // عروض free_item موجودة لكن لم يبلغ الزبون الحد الأدنى بعد
  const pendingFreeItems = activeOffers.filter(o => o.type === 'free_item' && subtotal < (o.min_order_amount || 0));
  const total = subtotal - discountAmount - offerSaleDiscount + (deliveryFee ?? 0);

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    const { data, error } = await supabase.rpc('validate_promo_code', { p_code: code, p_subtotal: subtotal });
    setPromoLoading(false);
    if (error || !data) {
      toast.error(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again');
      return;
    }
    if (!data.valid) {
      if (data.reason === 'min_order') {
        toast.error(lang === 'ar'
          ? `الحد الأدنى لاستخدام هذا الكود هو ${data.min} JOD`
          : `Minimum order of ${data.min} JOD required for this code`
        );
      } else {
        toast.error(lang === 'ar' ? 'الكود غير صالح أو انتهت صلاحيته' : 'Invalid or expired promo code');
      }
      return;
    }
    setPromoDiscount(data.discount);
    setPromoApplied(true);
    toast.success(lang === 'ar' ? `تم تطبيق خصم ${data.discount}% ✓` : `${data.discount}% discount applied ✓`);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // التحقق من الحد الأدنى للطلب (5 JOD بدون التوصيل)
    if (subtotal < 5) {
      return toast.error(lang === 'ar' ? 'الحد الأدنى للطلب هو 5 JOD (بدون رسوم التوصيل)' : 'Minimum order amount is 5 JOD (excluding delivery)');
    }

    // التحقق من اختيار منطقة التوصيل
    if (!formData.deliveryCity || isCityUncovered) {
      return toast.error(t.selectCityError);
    }

    const phoneRegex = /^0?(79|78|77)\d{7}$/;
    if (!phoneRegex.test(formData.phone)) {
      return toast.error(lang === 'ar' ? 'يرجى إدخال رقم هاتف أردني صحيح (مثال: 0791234567 أو 791234567)' : 'Please enter a valid Jordanian phone number (e.g., 0791234567 or 791234567)');
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Pre-order items لا تحتاج خصم من المخزون — نفصلها عن الباقي
      const regularItems = cartData.filter((item: any) => !item.is_preorder);
      if (regularItems.length > 0) {
        const inventoryItems = regularItems.map((item: any) => ({ product_id: item.id, quantity: item.quantity }));
        const { error: inventoryError } = await supabase.rpc('handle_checkout_inventory', { p_items: inventoryItems });
        if (inventoryError) throw new Error(inventoryError.message);
      }

      // استخدام الـ promo code (زيادة العداد)
      if (promoApplied && promoInput.trim()) {
        await supabase.rpc('use_promo_code', { p_code: promoInput.trim().toUpperCase() });
      }

      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        customer_name: formData.fullName,
        customer_phone: formData.phone,
        delivery_address: formData.address,
        delivery_city: formData.deliveryCity,
        delivery_fee: deliveryFee ?? 0,
        total_amount: total,
        user_id: user?.id,
        status: 'confirmed',
        notes: formData.notes || null,
        promo_code: promoApplied ? promoInput.trim().toUpperCase() : null,
        discount_amount: discountAmount,
      }).select().single();

      if (orderError) throw orderError;

      const items = cartData.map((item: any) => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        note: item.note ?? null,
        is_preorder: item.is_preorder ?? false,
      }));


      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      clearCartFn();
      router.push(`/success?orderId=${orderData.id}`);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full border border-[var(--cream-dark)] rounded-2xl p-3.5 md:p-4 text-sm md:text-base bg-[var(--cream)] outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition-all font-medium";

  return (
    <main className="min-h-screen bg-[var(--cream)] pt-32 pb-20 px-4 sm:px-6 md:px-8 relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* خلفية ديكورية */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-[var(--gold)]/[0.03] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--gold)]/[0.02] rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">

        {/* قسم الفورم */}
        <motion.div
          className="lg:col-span-7 order-2 lg:order-1"
          initial={{ opacity: 0, x: lang === 'ar' ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-3xl md:text-4xl font-black text-[var(--dark)] mb-8" style={{ fontFamily: 'var(--font-fredoka), sans-serif' }}>{t.title}</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[var(--cream-dark)] space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <input required placeholder={t.name} className={inputClasses} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              <input required placeholder={t.phone} className={inputClasses} dir="ltr" onChange={e => setFormData({ ...formData, phone: e.target.value })} />

              {/* قائمة منسدلة لمنطقة التوصيل */}
              <div>
                <select
                  required
                  value={formData.deliveryCity}
                  onChange={e => setFormData({ ...formData, deliveryCity: e.target.value })}
                  className={`${inputClasses} cursor-pointer ${!formData.deliveryCity ? 'text-gray-400' : 'text-[var(--dark)]'}`}
                >
                  <option value="" disabled>{t.selectCity}</option>
                  {DELIVERY_ZONES.map(zone => (
                    <optgroup key={zone.id} label={`${lang === 'ar' ? zone.name_ar : zone.name_en} — ${zone.fee} JOD`}>
                      {zone.cities.map(city => (
                        <option key={city.id} value={city.id}>
                          {lang === 'ar' ? city.name_ar : city.name_en}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__other__">{t.otherArea}</option>
                </select>
              </div>

              {/* رسالة المنطقة غير المغطاة */}
              <AnimatePresence>
                {isCityUncovered && (
                  <motion.div
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-amber-800 font-bold mb-3">{t.uncoveredMsg}</p>
                    <a
                      href="https://wa.me/962791875758"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-[#1da851] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      {t.whatsappLink}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea required placeholder={t.address} className={`${inputClasses} h-24 resize-none`} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              <textarea placeholder={t.notes} className={`${inputClasses} h-20 resize-none`} onChange={e => setFormData({ ...formData, notes: e.target.value })} />

              {/* حقل كود الخصم */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoApplied(false); setPromoDiscount(0); }}
                  placeholder={t.promoPlaceholder}
                  disabled={promoApplied}
                  dir="ltr"
                  className={`flex-1 border border-[var(--cream-dark)] rounded-2xl p-3.5 text-sm bg-[var(--cream)] outline-none font-mono tracking-widest transition-all uppercase ${promoApplied ? 'border-green-400 bg-green-50 text-green-700' : 'focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20'}`}
                />
                {promoApplied ? (
                  <div className="flex items-center px-4 text-green-600 font-black text-sm whitespace-nowrap">
                    ✓ {promoDiscount}% OFF
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="bg-black text-white font-bold px-5 rounded-2xl text-sm disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    {promoLoading ? '...' : t.promoApplyBtn}
                  </button>
                )}
              </div>
            </motion.div>

            {freeItems.length > 0 && (
              <motion.div
                className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center text-sm font-bold text-green-700"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              >
                🎁 {lang === 'ar'
                  ? `مبروك! طلبك يشمل ${freeItems.reduce((s: number, o: any) => s + (o.free_item_count || 1), 0)} قطعة مجانية — سنختارها لك بكل حب 💛`
                  : `Congrats! Your order includes ${freeItems.reduce((s: number, o: any) => s + (o.free_item_count || 1), 0)} free item(s) — we'll pick them for you with love 💛`
                }
              </motion.div>
            )}

            {pendingFreeItems.length > 0 && freeItems.length === 0 && (
              <motion.div
                className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center text-xs font-bold text-amber-700"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              >
                🎁 {lang === 'ar'
                  ? `أضف ${(pendingFreeItems[0].min_order_amount - subtotal).toFixed(2)} JOD أكثر وستحصل على ${pendingFreeItems[0].free_item_count || 1} قطعة مجانية! 🍬`
                  : `Add ${(pendingFreeItems[0].min_order_amount - subtotal).toFixed(2)} JOD more to get ${pendingFreeItems[0].free_item_count || 1} free item(s)! 🍬`
                }
              </motion.div>
            )}
            {subtotal < 5 && subtotal > 0 && (
              <motion.div
                className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center text-xs font-bold text-amber-700"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                ⚠️ {t.minOrderMsg}
              </motion.div>
            )}

            <motion.button
              disabled={isSubmitting || isCityUncovered || subtotal < 5}
              className="w-full gold-shimmer-bg gold-glow text-white font-bold py-4 md:py-5 rounded-2xl shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none text-sm md:text-base"
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {isSubmitting ? t.processingBtn : t.confirmBtn}
            </motion.button>
          </form>
        </motion.div>

        {/* قسم ملخص الطلب */}
        <motion.div
          className="lg:col-span-5 order-1 lg:order-2"
          initial={{ opacity: 0, x: lang === 'ar' ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-[var(--cream-dark)] lg:sticky lg:top-32">
            <h2 className="text-xl md:text-2xl font-black mb-6 text-[var(--dark)]">{t.summary}</h2>
            <div className="space-y-4 mb-6">
              <div className="max-h-48 overflow-y-auto pr-2 space-y-3 mb-6 border-b border-[var(--cream-dark)] pb-4">
                {cartData.map((item: any, i: number) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >

                    {item.image_url && (
                      <Image src={optimizeThumbnail(item.image_url)} alt="Product thumbnail" width={40} height={40} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                    )}
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[var(--dark)]">{item.name} <span className="text-[var(--gold-dark)]">x{item.quantity}</span></span>
                        {item.is_preorder && (
                          <span className="bg-violet-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
                            {lang === 'ar' ? 'طلب مسبق' : 'Pre-order'}
                          </span>
                        )}
                      </div>
                      {item.is_preorder && (() => {
                        const days = getDaysUntilRestock(item.restock_date);
                        return days !== null && days > 0 ? (
                          <span className="text-[9px] text-violet-500 font-bold block mt-0.5">
                            {lang === 'ar' ? `يتوفر خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}` : `Ships in ~${days} day${days !== 1 ? 's' : ''}`}
                          </span>
                        ) : null;
                      })()}
                      {item.note && <span className="text-[10px] text-[var(--text-muted)] block mt-1 line-clamp-1">{lang === 'ar' ? 'ملاحظة:' : 'Note:'} {item.note}</span>}
                    </div>
                    <span className="font-black text-[var(--dark)]" dir="ltr">{item.price * item.quantity} JOD</span>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between text-sm text-[var(--text-muted)]"><span>{t.subtotal}</span><span dir="ltr" className="font-bold">{subtotal} JOD</span></div>
              {deliveryFee !== null && (
                <div className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>{t.deliveryFee} ({getCityName(formData.deliveryCity, lang)})</span>
                  <div dir="ltr" className="flex items-center gap-2">
                    {deliveryDiscounted && baseFee !== deliveryFee && (
                      <span className="line-through text-gray-300 text-xs">{baseFee} JOD</span>
                    )}
                    <span className={`font-bold ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
                      {deliveryFee === 0 ? t.deliveryFreeMsg : `${deliveryFee} JOD`}
                    </span>
                  </div>
                </div>
              )}
              {deliveryDiscounted && (
                <div className="flex justify-between text-xs text-green-600 font-bold">
                  <span>🎉 {t.deliveryOffer}</span>
                  <span dir="ltr">- {(baseFee ?? 0) - (deliveryFee ?? 0)} JOD</span>
                </div>
              )}
              {promoApplied && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-bold">
                  <span>🏷 {t.promoDiscount} ({promoDiscount}%)</span>
                  <span dir="ltr">- {discountAmount.toFixed(2)} JOD</span>
                </div>
              )}
              {offerSaleDiscount > 0 && (
                <div className="flex justify-between text-sm text-amber-600 font-bold">
                  <span>{t.offerSale}</span>
                  <span dir="ltr">- {offerSaleDiscount.toFixed(2)} JOD</span>
                </div>
              )}
              {freeItems.map((offer: any) => (
                <div key={offer.id} className="flex justify-between text-sm text-green-600 font-bold">
                  <span>{t.freeItem} ×{offer.free_item_count || 1}</span>
                  <span dir="ltr">{lang === 'ar' ? 'مجاني 🎁' : 'Free 🎁'}</span>
                </div>
              ))}
              <div className="flex justify-between text-xl md:text-2xl font-black pt-4 border-t border-[var(--cream-dark)]"><span className="text-[var(--dark)]">{t.total}</span><span className="gold-shimmer" dir="ltr">{total.toFixed(2)} JOD</span></div>
            </div>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
