'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Offer {
  id: string;
  type: 'sale_percent' | 'free_item';
  discount_percentage: number | null;
  product_id: string | null;
  product_name: string | null;
  product_image: string | null;
  free_item_count: number | null;
  duration_days: number;
  starts_at: string;
  ends_at: string;
}

interface AdminOffersTabProps {
  lang: 'ar' | 'en';
}

export default function AdminOffersTab({ lang }: AdminOffersTabProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'sale_percent' as 'sale_percent' | 'free_item',
    discount_percentage: '',
    free_item_count: '1',
    duration_days: '',
  });

  const t = {
    title:           lang === 'ar' ? 'العروض الفعّالة' : 'Active Offers',
    addTitle:        lang === 'ar' ? 'إضافة عرض جديد' : 'Add New Offer',
    typeLabel:       lang === 'ar' ? 'نوع العرض' : 'Offer Type',
    typeSale:        lang === 'ar' ? 'خصم % على الفاتورة' : 'Sale % on Invoice',
    typeFreeItem:    lang === 'ar' ? 'منتج مجاني' : 'Free Item',
    discountLabel:   lang === 'ar' ? 'نسبة الخصم %' : 'Discount %',
    freeCountLabel:  lang === 'ar' ? 'عدد القطع المجانية' : 'Number of Free Items',
    daysLabel:       lang === 'ar' ? 'مدة العرض (أيام)' : 'Duration (days)',
    addBtn:          lang === 'ar' ? 'تفعيل العرض 🎉' : 'Activate Offer 🎉',
    saving:          lang === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    noOffers:        lang === 'ar' ? 'لا توجد عروض فعّالة حالياً' : 'No active offers right now',
    stopBtn:         lang === 'ar' ? 'إيقاف' : 'Stop',
    endsIn:          lang === 'ar' ? 'ينتهي خلال' : 'Ends in',
    days:            lang === 'ar' ? 'أيام' : 'days',
    day:             lang === 'ar' ? 'يوم' : 'day',
    hours:           lang === 'ar' ? 'ساعات' : 'hrs',
    saleLabel:       lang === 'ar' ? 'خصم' : 'Sale',
    freeLabel:       lang === 'ar' ? 'مجاني' : 'Free',
    confirmStop:     lang === 'ar' ? 'إيقاف هذا العرض؟' : 'Stop this offer?',
    successAdd:      lang === 'ar' ? 'تم تفعيل العرض ✓' : 'Offer activated ✓',
    successStop:     lang === 'ar' ? 'تم إيقاف العرض ✓' : 'Offer stopped ✓',
    errorFill:       lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
  };

  const fetchOffers = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_active_offers');
    if (data) setOffers(data);
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, []);

  const getTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return lang === 'ar' ? 'منتهي' : 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} ${days === 1 ? t.day : t.days}`;
    return `${hours} ${t.hours}`;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.duration_days) return toast.error(t.errorFill);
    if (form.type === 'sale_percent' && !form.discount_percentage) return toast.error(t.errorFill);
    if (form.type === 'free_item' && !form.free_item_count) return toast.error(t.errorFill);

    setIsSaving(true);
    const { error } = await supabase.from('offers').insert({
      type: form.type,
      discount_percentage: form.type === 'sale_percent' ? parseInt(form.discount_percentage) : null,
      product_id: null,
      free_item_count: form.type === 'free_item' ? parseInt(form.free_item_count) : null,
      duration_days: parseInt(form.duration_days),
      starts_at: new Date().toISOString(),
      is_active: true,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.successAdd);
      setForm({ type: 'sale_percent', discount_percentage: '', free_item_count: '1', duration_days: '' });
      fetchOffers();
    }
    setIsSaving(false);
  };

  const handleStop = async (id: string) => {
    if (!window.confirm(t.confirmStop)) return;
    const { error } = await supabase.from('offers').update({ is_active: false }).eq('id', id);
    if (!error) { toast.success(t.successStop); fetchOffers(); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

      {/* فورم الإضافة */}
      <div className="lg:col-span-1 bg-white p-8 border border-gray-200 h-fit shadow-sm">
        <h2 className="text-xl font-black text-black mb-6">{t.addTitle}</h2>
        <form onSubmit={handleAdd} className="space-y-4">

          {/* نوع العرض */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">{t.typeLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['sale_percent', 'free_item'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, type, discount_percentage: '', free_item_count: '1' })}
                  className={`py-2.5 px-3 rounded-lg text-xs font-black border transition-all ${
                    form.type === type
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {type === 'sale_percent' ? '🏷️ ' + t.typeSale : '🎁 ' + t.typeFreeItem}
                </button>
              ))}
            </div>
          </div>

          {/* حقل الخصم أو المنتج */}
          {form.type === 'sale_percent' ? (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">{t.discountLabel}</label>
              <input
                type="number" min={1} max={100} required
                value={form.discount_percentage}
                onChange={e => setForm({ ...form, discount_percentage: e.target.value })}
                placeholder="10"
                dir="ltr"
                className="w-full border-b border-gray-300 p-2 outline-none focus:border-black"
              />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">{t.freeCountLabel}</label>
              <input
                type="number" min={1} required
                value={form.free_item_count}
                onChange={e => setForm({ ...form, free_item_count: e.target.value })}
                placeholder="1"
                dir="ltr"
                className="w-full border-b border-gray-300 p-2 outline-none focus:border-black"
              />
            </div>
          )}

          {/* مدة العرض */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">{t.daysLabel}</label>
            <input
              type="number" min={1} required
              value={form.duration_days}
              onChange={e => setForm({ ...form, duration_days: e.target.value })}
              placeholder="3"
              dir="ltr"
              className="w-full border-b border-gray-300 p-2 outline-none focus:border-black"
            />
          </div>

          <button
            disabled={isSaving}
            className="w-full bg-black text-white font-bold py-4 mt-2 hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {isSaving ? t.saving : t.addBtn}
          </button>
        </form>
      </div>

      {/* قائمة العروض */}
      <div className="lg:col-span-2">
        <h2 className="text-xl font-black text-black mb-6">{t.title}</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center text-gray-400 font-bold py-20 text-sm">{t.noOffers}</div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {offers.map(offer => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white border border-gray-200 p-4 rounded shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* أيقونة + معلومات */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 bg-amber-50">
                      {offer.type === 'sale_percent' ? '🏷️' : '🎁'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {offer.type === 'sale_percent' ? (
                          <span className="bg-amber-100 text-amber-700 text-xs font-black px-2.5 py-1 rounded-full">
                            🏷️ {t.saleLabel} {offer.discount_percentage}%
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 text-xs font-black px-2.5 py-1 rounded-full">
                            🎁 {t.freeLabel} ×{offer.free_item_count || 1}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-medium">
                        ⏳ {t.endsIn} {getTimeRemaining(offer.ends_at)}
                      </p>
                    </div>
                  </div>

                  {/* زر الإيقاف */}
                  <button
                    onClick={() => handleStop(offer.id)}
                    className="text-xs font-bold px-4 py-2 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                  >
                    ⏹ {t.stopBtn}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
