'use client';

import { useEffect, useState, useRef } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { supabase } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';
import { optimizeThumbnail } from '../../lib/optimizeImage';
import { DELIVERY_ZONES, getCityName, getEffectiveDeliveryFee } from '../../lib/deliveryAreas';
import { getDaysUntilRestock } from '../../lib/preorderUtils';

// =============================================
// Checkout — الهوية الجديدة (1a)
// صفحة واحدة قابلة للتمرير + شريط تأكيد لاصق (موبايل)
// سطح المكتب: عمودان 1fr/420px مع ملخص لاصق
// ⚠️ منطق الإرسال/الخصومات/التحقق كما هو — تغيير بصري فقط
// =============================================

export default function CheckoutPage() {
  const { lang } = useLanguageStore();
  const router = useRouter();
  const cartData = useCartStore((state: any) => state.items);
  const clearCartFn = useCartStore((state: any) => state.clearCart);

  const [mounted, setMounted] = useState(false);
  const hasHydrated = useCartStore((state: any) => state._hasHydrated);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', notes: '', deliveryCity: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'cliq'>('cod');
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Promo Code states
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  // Active Offers
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  useEffect(() => {
    supabase.rpc('get_active_offers').then(({ data }) => {
      if (data) setActiveOffers(data);
    });
  }, []);

  const subtotalForFee = cartData.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const deliveryFee = formData.deliveryCity ? getEffectiveDeliveryFee(formData.deliveryCity, subtotalForFee) : null;
  const isCityUncovered = formData.deliveryCity === '__other__';

  const alertShown = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!alertShown.current) {
          alertShown.current = true;
          toast.error(lang === 'ar' ? 'يرجى تسجيل الدخول لإتمام طلبك' : 'Please login to complete your order');
          router.push('/login?redirect=/checkout');
        }
        return;
      }
    };
    checkAuth();
  }, [router, lang]);

  useEffect(() => { setMounted(true); }, []);

  const t = {
    title: lang === 'ar' ? 'إتمام الطلب' : 'Checkout',
    back: lang === 'ar' ? 'رجوع' : 'Back',
    trustCod: lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on delivery',
    trustDelivery: lang === 'ar' ? 'توصيل 24–48 ساعة' : '24–48h delivery',
    name: lang === 'ar' ? 'الاسم الكامل' : 'Full Name',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    address: lang === 'ar' ? 'تفاصيل العنوان' : 'Address Details',
    notes: lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (Optional)',
    confirmBtn: lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order',
    processingBtn: lang === 'ar' ? 'جاري التأكيد...' : 'Processing...',
    summary: lang === 'ar' ? 'ملخص الطلب' : 'Order Summary',
    products: lang === 'ar' ? 'منتجات' : 'items',
    subtotal: lang === 'ar' ? 'مجموع المنتجات' : 'Subtotal',
    total: lang === 'ar' ? 'المجموع الكلي' : 'Total',
    promoPlaceholder: lang === 'ar' ? 'كود الخصم' : 'PROMO CODE',
    promoApplyBtn: lang === 'ar' ? 'تطبيق' : 'Apply',
    promoDiscount: lang === 'ar' ? 'خصم الكود' : 'Promo Discount',
    offerSale: lang === 'ar' ? 'عرض خاص 🏷️' : 'Special Offer 🏷️',
    freeItem: lang === 'ar' ? 'هدية مجانية 🎁' : 'Free Gift 🎁',
    minOrderMsg: lang === 'ar' ? 'الحد الأدنى للطلب 5 JOD' : 'Minimum order 5 JOD',
    emptyCart: lang === 'ar' ? 'السلة فارغة' : 'Cart is Empty',
    backMenu: lang === 'ar' ? 'العودة للقائمة' : 'Back to Menu',
    deliveryCity: lang === 'ar' ? 'منطقة التوصيل' : 'Delivery Area',
    selectCity: lang === 'ar' ? 'اختر منطقتك...' : 'Select your area...',
    otherArea: lang === 'ar' ? 'منطقة أخرى' : 'Other Area',
    deliveryFee: lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee',
    payment: lang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
    cod: lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery',
    codDesc: lang === 'ar' ? 'ادفع نقداً عند استلام طلبك' : 'Pay in cash when your order arrives',
    cliqDesc: lang === 'ar' ? 'حوالة فورية عبر تطبيق البنك' : 'Instant transfer via your bank app',
    cliqInfo: lang === 'ar' ? 'يرجى تحويل المبلغ إلى الرقم التالي عبر Cliq:' : 'Please transfer the amount to the following number via Cliq:',
    cliqConfirm: lang === 'ar' ? 'سيتم تأكيد طلبك فور استلام الحوالة.' : 'Your order will be confirmed upon receiving the transfer.',
    uncoveredMsg: lang === 'ar'
      ? 'عذراً، التوصيل غير متاح لمنطقتك حالياً. تواصل معنا عبر واتساب لترتيب التوصيل.'
      : 'Sorry, delivery is not available for your area. Contact us on WhatsApp to arrange delivery.',
    whatsappLink: lang === 'ar' ? 'تواصل عبر واتساب' : 'Contact on WhatsApp',
    selectCityError: lang === 'ar' ? 'يرجى اختيار منطقة التوصيل' : 'Please select a delivery area',
    microcopy: lang === 'ar' ? 'الحد الأدنى للطلب 5 JOD · بالضغط أنت توافق على شروط الاستخدام' : 'Minimum order 5 JOD · By confirming you agree to our terms',
    preorder: lang === 'ar' ? 'طلب مسبق' : 'Pre-order',
    noteWord: lang === 'ar' ? 'ملاحظة:' : 'Note:',
  };

  // ننتظر hydration — سبينر بدل شاشة فارغة
  if (!mounted || !hasHydrated) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--pink-600)] rounded-full animate-spin" />
      </main>
    );
  }

  if (cartData.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] pt-24 px-4 fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <span className="text-5xl mb-6 opacity-40">🛒</span>
        <h2 className="text-2xl font-extrabold text-[var(--ink-900)] mb-6 text-center">{t.emptyCart}</h2>
        <Link href="/#menu" className="h-12 px-8 flex items-center bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white font-bold rounded-[var(--radius-md)] transition-colors duration-150 text-sm">
          {t.backMenu}
        </Link>
      </main>
    );
  }

  const subtotal = subtotalForFee;
  const discountAmount = promoApplied ? Math.round(subtotal * promoDiscount) / 100 : 0;
  const offerSaleDiscount = activeOffers
    .filter(o => o.type === 'sale_percent' && o.discount_percentage)
    .reduce((acc, o) => acc + Math.round(subtotal * o.discount_percentage) / 100, 0);
  const freeItems = activeOffers.filter(o => o.type === 'free_item' && subtotal >= (o.min_order_amount || 0));
  const pendingFreeItems = activeOffers.filter(o => o.type === 'free_item' && subtotal < (o.min_order_amount || 0));
  const total = subtotal - discountAmount - offerSaleDiscount + (deliveryFee ?? 0);
  const totalItemsCount = cartData.reduce((s: number, i: any) => s + i.quantity, 0);

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

    if (subtotal < 5) {
      return toast.error(lang === 'ar' ? 'الحد الأدنى للطلب هو 5 JOD (بدون رسوم التوصيل)' : 'Minimum order amount is 5 JOD (excluding delivery)');
    }

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

      const regularItems = cartData.filter((item: any) => !item.is_preorder);
      if (regularItems.length > 0) {
        const inventoryItems = regularItems.map((item: any) => ({ product_id: item.id, quantity: item.quantity }));
        const { error: inventoryError } = await supabase.rpc('handle_checkout_inventory', { p_items: inventoryItems });
        if (inventoryError) throw new Error(inventoryError.message);
      }

      if (promoApplied && promoInput.trim()) {
        await supabase.rpc('use_promo_code', { p_code: promoInput.trim().toUpperCase() });
      }

      const paymentLabel = paymentMethod === 'cliq' ? 'Cliq' : (lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery');
      const finalNotes = formData.notes
        ? `[Payment: ${paymentLabel}] - ${formData.notes}`
        : `[Payment: ${paymentLabel}]`;

      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        customer_name: formData.fullName,
        customer_phone: formData.phone,
        delivery_address: formData.address,
        delivery_city: formData.deliveryCity,
        delivery_fee: deliveryFee ?? 0,
        total_amount: total,
        user_id: user?.id,
        status: 'confirmed',
        notes: finalNotes,
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

  const inputClasses = "w-full h-12 border border-[var(--border)] rounded-[var(--radius-md)] px-4 text-[15px] bg-[var(--bg)] text-[var(--ink-900)] outline-none focus:border-[var(--pink-400)] focus:ring-2 focus:ring-[var(--pink-100)] transition-[border-color,box-shadow] duration-150 font-medium placeholder:text-[var(--ink-500)]";
  const labelClasses = "block text-xs font-bold text-[var(--ink-700)] mb-1.5";
  const cardClasses = "bg-[var(--surface)] p-5 md:p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] border border-[var(--border)]";

  const canSubmit = !isSubmitting && !isCityUncovered && subtotal >= 5;

  // ─── سطر عنصر في الملخص ───
  const SummaryItems = () => (
    <div className="space-y-3">
      {cartData.map((item: any, i: number) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          {item.image_url && (
            <Image src={optimizeThumbnail(item.image_url)} alt={item.name} width={40} height={40} className="w-10 h-10 rounded-[var(--radius-sm)] object-cover shrink-0 bg-white border border-[var(--border)]" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[var(--ink-900)] text-[13px]">
                {item.name} <span className="text-[var(--pink-600)]" dir="ltr">×{item.quantity}</span>
              </span>
              {item.is_preorder && (
                <span className="bg-[var(--blue-100)] text-[var(--blue-700)] text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                  {t.preorder}
                </span>
              )}
            </div>
            {item.is_preorder && (() => {
              const days = getDaysUntilRestock(item.restock_date);
              return days !== null && days > 0 ? (
                <span className="text-[10px] text-[var(--blue-700)] font-bold block mt-0.5">
                  {lang === 'ar' ? `يتوفر خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}` : `Ships in ~${days} day${days !== 1 ? 's' : ''}`}
                </span>
              ) : null;
            })()}
            {item.note && <span className="text-[10px] text-[var(--ink-500)] block mt-0.5 line-clamp-1">{t.noteWord} {item.note}</span>}
          </div>
          <span className="font-bold text-[var(--ink-900)] text-[13px]" dir="ltr" style={{ fontFamily: 'var(--font-display-en)' }}>
            {(item.price * item.quantity).toFixed(2)} JOD
          </span>
        </div>
      ))}
    </div>
  );

  // ─── صفوف المجاميع ───
  const TotalsRows = () => (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm text-[var(--ink-700)]">
        <span className="font-medium">{t.subtotal}</span>
        <span dir="ltr" className="font-bold">{subtotal.toFixed(2)} JOD</span>
      </div>
      {deliveryFee !== null && (
        <div className="flex justify-between text-sm text-[var(--ink-700)]">
          <span className="font-medium">{t.deliveryFee} ({getCityName(formData.deliveryCity, lang)})</span>
          <span className="font-bold" dir="ltr">{deliveryFee.toFixed(2)} JOD</span>
        </div>
      )}
      {promoApplied && discountAmount > 0 && (
        <div className="flex justify-between text-sm text-[var(--success)] font-bold">
          <span>🏷 {t.promoDiscount} ({promoDiscount}%)</span>
          <span dir="ltr">− {discountAmount.toFixed(2)} JOD</span>
        </div>
      )}
      {offerSaleDiscount > 0 && (
        <div className="flex justify-between text-sm text-[var(--warning)] font-bold">
          <span>{t.offerSale}</span>
          <span dir="ltr">− {offerSaleDiscount.toFixed(2)} JOD</span>
        </div>
      )}
      {freeItems.map((offer: any) => (
        <div key={offer.id} className="flex justify-between text-sm text-[var(--success)] font-bold">
          <span>{t.freeItem} ×{offer.free_item_count || 1}</span>
          <span dir="ltr">{lang === 'ar' ? 'مجاني 🎁' : 'Free 🎁'}</span>
        </div>
      ))}
      <div className="flex justify-between items-baseline pt-3 border-t border-[var(--border)]">
        <span className="text-base font-extrabold text-[var(--ink-900)]">{t.total}</span>
        <span className="text-xl font-extrabold text-[var(--pink-600)]" dir="ltr" style={{ fontFamily: 'var(--font-display-en)' }}>
          {total.toFixed(2)} JOD
        </span>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[var(--bg)] pt-[90px] md:pt-[106px] pb-32 md:pb-16 px-4 md:px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">

        {/* رأس الصفحة — رجوع + عنوان */}
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/"
            aria-label={t.back}
            className="w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-700)] hover:text-[var(--pink-600)] hover:border-[var(--pink-400)] transition-colors duration-150"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${lang === 'ar' ? '' : 'rotate-180'}`}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
          <h1 className="text-2xl md:text-[28px] font-extrabold text-[var(--ink-900)]">{t.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-8 items-start">

          {/* ═══ العمود الرئيسي ═══ */}
          <div className="space-y-4">

            {/* شريط الثقة الأخضر */}
            <div className="bg-[var(--success-bg)] rounded-[var(--radius-lg)] px-4 py-3 flex items-center justify-center gap-5 flex-wrap">
              {[t.trustCod, t.trustDelivery].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--success)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>

            {/* الملخص المطوي — موبايل فقط */}
            <button
              type="button"
              onClick={() => setSummaryOpen(!summaryOpen)}
              className={`${cardClasses} w-full flex items-center gap-3 lg:hidden text-start`}
            >
              {/* الصور المكدسة */}
              <div className="flex -space-x-2 rtl:space-x-reverse shrink-0">
                {cartData.slice(0, 3).map((item: any, i: number) => (
                  item.image_url ? (
                    <Image key={i} src={optimizeThumbnail(item.image_url)} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover border-2 border-[var(--surface)] bg-white" />
                  ) : (
                    <span key={i} className="w-9 h-9 rounded-full bg-[var(--pink-50)] border-2 border-[var(--surface)]" />
                  )
                ))}
              </div>
              <span className="flex-1 font-bold text-sm text-[var(--ink-900)]">
                <span dir="ltr">{totalItemsCount}</span> {t.products} · <span dir="ltr" style={{ fontFamily: 'var(--font-display-en)' }}>{subtotal.toFixed(2)} JOD</span>
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 transition-transform duration-200 ${summaryOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {summaryOpen && (
              <div className={`${cardClasses} lg:hidden fade-in`}>
                <SummaryItems />
              </div>
            )}

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">

              {/* ─── بطاقة البيانات ─── */}
              <div className={`${cardClasses} space-y-4`}>
                <div>
                  <label className={labelClasses}>{t.name}</label>
                  <input required className={inputClasses} value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
                <div>
                  <label className={labelClasses}>{t.phone}</label>
                  <input required type="tel" inputMode="numeric" placeholder="07X XXX XXXX" className={inputClasses} dir="ltr" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>

                <div>
                  <label className={labelClasses}>{t.deliveryCity}</label>
                  <select
                    required
                    value={formData.deliveryCity}
                    onChange={e => setFormData({ ...formData, deliveryCity: e.target.value })}
                    className={`${inputClasses} cursor-pointer ${!formData.deliveryCity ? 'text-[var(--ink-500)]' : ''}`}
                  >
                    <option value="" disabled>{t.selectCity}</option>
                    {DELIVERY_ZONES.map(zone => (
                      <optgroup key={zone.id} label={lang === 'ar' ? zone.name_ar : zone.name_en}>
                        {zone.cities.map(city => (
                          <option key={city.id} value={city.id}>
                            {lang === 'ar' ? city.name_ar : city.name_en} — {zone.fee} JOD
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="__other__">{t.otherArea}</option>
                  </select>
                </div>

                {/* المنطقة غير المغطاة */}
                {isCityUncovered && (
                  <div className="bg-[var(--warning-bg)] rounded-[var(--radius-md)] p-4 text-sm fade-in">
                    <p className="text-[var(--warning)] font-bold mb-3">{t.uncoveredMsg}</p>
                    <a
                      href="https://wa.me/962791875758"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 h-11 rounded-[var(--radius-md)] text-sm hover:opacity-90 transition-opacity duration-150"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      {t.whatsappLink}
                    </a>
                  </div>
                )}

                <div>
                  <label className={labelClasses}>{t.address}</label>
                  <textarea required className={`${inputClasses} h-24 py-3 resize-none`} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div>
                  <label className={labelClasses}>{t.notes}</label>
                  <textarea className={`${inputClasses} h-20 py-3 resize-none`} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>

              {/* ─── بطاقة الدفع ─── */}
              <div className={`${cardClasses} space-y-3`}>
                <h3 className="font-extrabold text-[var(--ink-900)] text-base">{t.payment}</h3>

                {/* COD */}
                <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-[var(--radius-md)] transition-colors duration-150 ${
                  paymentMethod === 'cod'
                    ? 'border-2 border-[var(--pink-600)] bg-[var(--pink-50)]'
                    : 'border border-[var(--border)] hover:border-[var(--pink-300)]'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-5 h-5 accent-[var(--pink-600)] cursor-pointer shrink-0"
                  />
                  <span className="flex flex-col">
                    <span className="font-bold text-sm text-[var(--ink-900)]">{t.cod}</span>
                    <span className="text-xs text-[var(--ink-500)] font-medium">{t.codDesc}</span>
                  </span>
                </label>

                {/* Cliq */}
                <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-[var(--radius-md)] transition-colors duration-150 ${
                  paymentMethod === 'cliq'
                    ? 'border-2 border-[var(--pink-600)] bg-[var(--pink-50)]'
                    : 'border border-[var(--border)] hover:border-[var(--pink-300)]'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cliq"
                    checked={paymentMethod === 'cliq'}
                    onChange={() => setPaymentMethod('cliq')}
                    className="w-5 h-5 accent-[var(--pink-600)] cursor-pointer shrink-0"
                  />
                  <span className="flex items-center gap-2 flex-1">
                    <span className="flex flex-col flex-1">
                      <span className="font-bold text-sm text-[var(--ink-900)]">Cliq</span>
                      <span className="text-xs text-[var(--ink-500)] font-medium">{t.cliqDesc}</span>
                    </span>
                    <span className="bg-[var(--blue-700)] text-white text-[10px] font-black px-2.5 py-1 rounded-md tracking-wide" dir="ltr">CliQ</span>
                  </span>
                </label>

                {paymentMethod === 'cliq' && (
                  <div className="bg-[var(--blue-100)] rounded-[var(--radius-md)] p-4 text-sm fade-in">
                    <p className="text-[var(--blue-700)] font-bold mb-2">{t.cliqInfo}</p>
                    <p className="text-[var(--blue-700)] font-black text-lg tracking-wider bg-[var(--surface)] px-4 py-2 rounded-[var(--radius-sm)] inline-block" dir="ltr">
                      00962798127208
                    </p>
                    <p className="text-[var(--blue-700)] mt-2.5 text-xs font-medium">{t.cliqConfirm}</p>
                  </div>
                )}
              </div>

              {/* ─── كود الخصم ─── */}
              <div className={`${cardClasses}`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoApplied(false); setPromoDiscount(0); }}
                    placeholder={t.promoPlaceholder}
                    disabled={promoApplied}
                    dir="ltr"
                    style={{ letterSpacing: '.12em' }}
                    className={`flex-1 h-12 rounded-[var(--radius-md)] px-4 text-sm bg-[var(--bg)] outline-none font-mono uppercase transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--ink-500)] ${
                      promoApplied
                        ? 'border-2 border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]'
                        : 'border border-dashed border-[var(--pink-300)] focus:border-[var(--pink-400)] focus:ring-2 focus:ring-[var(--pink-100)] text-[var(--ink-900)]'
                    }`}
                  />
                  {promoApplied ? (
                    <span className="flex items-center px-4 text-[var(--success)] font-black text-sm whitespace-nowrap" dir="ltr">
                      ✓ {promoDiscount}% OFF
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="h-12 bg-[var(--ink-900)] text-white font-bold px-5 rounded-[var(--radius-md)] text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--pink-700)] transition-colors duration-150 whitespace-nowrap"
                    >
                      {promoLoading ? '...' : t.promoApplyBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* ─── تنبيهات العروض ─── */}
              {freeItems.length > 0 && (
                <div className="bg-[var(--success-bg)] rounded-[var(--radius-md)] p-3.5 text-center text-sm font-bold text-[var(--success)] fade-in">
                  🎁 {lang === 'ar'
                    ? `مبروك! طلبك يشمل ${freeItems.reduce((s: number, o: any) => s + (o.free_item_count || 1), 0)} قطعة مجانية — سنختارها لك بكل حب`
                    : `Congrats! Your order includes ${freeItems.reduce((s: number, o: any) => s + (o.free_item_count || 1), 0)} free item(s) — we'll pick them for you with love`
                  }
                </div>
              )}
              {pendingFreeItems.length > 0 && freeItems.length === 0 && (
                <div className="bg-[var(--warning-bg)] rounded-[var(--radius-md)] p-3.5 text-center text-xs font-bold text-[var(--warning)] fade-in">
                  🎁 {lang === 'ar'
                    ? `أضف ${(pendingFreeItems[0].min_order_amount - subtotal).toFixed(2)} JOD أكثر وستحصل على ${pendingFreeItems[0].free_item_count || 1} قطعة مجانية!`
                    : `Add ${(pendingFreeItems[0].min_order_amount - subtotal).toFixed(2)} JOD more to get ${pendingFreeItems[0].free_item_count || 1} free item(s)!`
                  }
                </div>
              )}
              {subtotal < 5 && subtotal > 0 && (
                <div className="bg-[var(--warning-bg)] rounded-[var(--radius-md)] p-3.5 text-center text-xs font-bold text-[var(--warning)] fade-in">
                  ⚠️ {t.minOrderMsg}
                </div>
              )}

              {/* ─── المجاميع — موبايل فقط (سطح المكتب في العمود الجانبي) ─── */}
              <div className={`${cardClasses} lg:hidden`}>
                <TotalsRows />
              </div>
            </form>
          </div>

          {/* ═══ الملخص الجانبي — سطح المكتب ═══ */}
          <aside className="hidden lg:block sticky top-[106px]">
            <div className={`${cardClasses} space-y-5`}>
              <h2 className="text-lg font-extrabold text-[var(--ink-900)]">{t.summary}</h2>
              <div className="max-h-56 overflow-y-auto pe-1 border-b border-[var(--border)] pb-4">
                <SummaryItems />
              </div>
              <TotalsRows />
              <button
                type="submit"
                form="checkout-form"
                disabled={!canSubmit}
                className="w-full h-[52px] flex items-center justify-center gap-2.5 bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white rounded-[var(--radius-md)] font-bold text-sm transition-colors duration-150 disabled:bg-[var(--border)] disabled:text-[var(--ink-500)] disabled:cursor-not-allowed active:scale-[.97]"
              >
                {isSubmitting ? t.processingBtn : t.confirmBtn}
                {!isSubmitting && (
                  <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-black" dir="ltr">
                    {total.toFixed(2)} JOD
                  </span>
                )}
              </button>
              <p className="text-[11px] font-medium text-[var(--ink-500)] text-center leading-relaxed">{t.microcopy}</p>
            </div>
          </aside>
        </div>
      </div>

      {/* ═══ شريط التأكيد اللاصق — موبايل فقط ═══ */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[var(--surface)] border-t border-[var(--border)] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="flex flex-col leading-tight shrink-0">
            <span className="text-[11px] font-bold text-[var(--ink-500)]">{t.total}</span>
            <span className="text-lg font-extrabold text-[var(--pink-600)]" dir="ltr" style={{ fontFamily: 'var(--font-display-en)' }}>
              {total.toFixed(2)} JOD
            </span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={!canSubmit}
            className="flex-1 h-[52px] bg-[var(--pink-600)] hover:bg-[var(--pink-700)] text-white rounded-[var(--radius-md)] font-bold text-sm transition-colors duration-150 disabled:bg-[var(--border)] disabled:text-[var(--ink-500)] disabled:cursor-not-allowed active:scale-[.97]"
          >
            {isSubmitting ? t.processingBtn : t.confirmBtn}
          </button>
        </div>
      </div>
    </main>
  );
}
