'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  min_order_amount: number;
  created_at: string;
}

interface AdminPromoTabProps {
  lang: 'ar' | 'en';
}

export default function AdminPromoTab({ lang }: AdminPromoTabProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ code: '', discount_percentage: '', max_uses: '', min_order_amount: '' });

  const t = {
    title:          lang === 'ar' ? 'كودات الخصم' : 'Promo Codes',
    addTitle:       lang === 'ar' ? 'إضافة كود جديد' : 'Add New Code',
    codePlaceholder: lang === 'ar' ? 'الكود (مثال: SUMMER20)' : 'Code (e.g. SUMMER20)',
    discountLabel:  lang === 'ar' ? 'نسبة الخصم %' : 'Discount %',
    maxUsesLabel:   lang === 'ar' ? 'عدد الاستخدامات' : 'Max Uses',
    minOrderLabel:  lang === 'ar' ? 'حد أدنى للطلب (JOD)' : 'Min Order (JOD)',
    minOrderHint:   lang === 'ar' ? '0 = بدون حد أدنى' : '0 = no minimum',
    addBtn:         lang === 'ar' ? 'إضافة الكود ➕' : 'Add Code ➕',
    saving:         lang === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    noPromos:       lang === 'ar' ? 'لا توجد كودات بعد' : 'No promo codes yet',
    usedOf:         lang === 'ar' ? 'استخدام من' : 'used of',
    active:         lang === 'ar' ? 'فعّال' : 'Active',
    inactive:       lang === 'ar' ? 'موقوف' : 'Inactive',
    deleteBtn:      lang === 'ar' ? 'حذف' : 'Delete',
    confirmDelete:  lang === 'ar' ? 'حذف هذا الكود؟' : 'Delete this code?',
    successAdd:     lang === 'ar' ? 'تمت إضافة الكود ✓' : 'Code added ✓',
    successDelete:  lang === 'ar' ? 'تم حذف الكود ✓' : 'Code deleted ✓',
    errorEmpty:     lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
    errorPercent:   lang === 'ar' ? 'النسبة يجب أن تكون بين 1 و 100' : 'Percentage must be between 1 and 100',
    errorUses:      lang === 'ar' ? 'عدد الاستخدامات يجب أن يكون 1 على الأقل' : 'Max uses must be at least 1',
  };

  const fetchCodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPromoCodes(data);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discount_percentage || !form.max_uses) {
      return toast.error(t.errorEmpty);
    }
    const pct = parseInt(form.discount_percentage);
    const uses = parseInt(form.max_uses);
    if (pct < 1 || pct > 100) return toast.error(t.errorPercent);
    if (uses < 1) return toast.error(t.errorUses);

    setIsSaving(true);
    const minOrder = parseFloat(form.min_order_amount) || 0;
    const { error } = await supabase.from('promo_codes').insert({
      code: form.code.toUpperCase().trim(),
      discount_percentage: pct,
      max_uses: uses,
      min_order_amount: minOrder,
    });

    if (error) {
      toast.error(error.message.includes('unique') 
        ? (lang === 'ar' ? 'هذا الكود موجود مسبقاً' : 'This code already exists')
        : error.message
      );
    } else {
      toast.success(t.successAdd);
      setForm({ code: '', discount_percentage: '', max_uses: '', min_order_amount: '' });
      fetchCodes();
    }
    setIsSaving(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: !current })
      .eq('id', id);
    if (!error) fetchCodes();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (!error) { toast.success(t.successDelete); fetchCodes(); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

      {/* فورم الإضافة */}
      <div className="lg:col-span-1 bg-white p-8 border border-gray-200 h-fit shadow-sm">
        <h2 className="text-xl font-black text-black mb-6">{t.addTitle}</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <input
            type="text"
            required
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder={t.codePlaceholder}
            dir="ltr"
            className="w-full border-b border-gray-300 p-2 outline-none focus:border-black font-mono text-sm uppercase tracking-widest"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                {t.discountLabel}
              </label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={form.discount_percentage}
                onChange={e => setForm({ ...form, discount_percentage: e.target.value })}
                placeholder="10"
                dir="ltr"
                className="w-full border-b border-gray-300 p-2 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                {t.maxUsesLabel}
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.max_uses}
                onChange={e => setForm({ ...form, max_uses: e.target.value })}
                placeholder="50"
                dir="ltr"
                className="w-full border-b border-gray-300 p-2 outline-none focus:border-black"
              />
            </div>
          </div>

          {/* الحد الأدنى للطلب */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
              {t.minOrderLabel}
            </label>
            <input
              type="number"
              min={0}
              step="0.5"
              value={form.min_order_amount}
              onChange={e => setForm({ ...form, min_order_amount: e.target.value })}
              placeholder="0"
              dir="ltr"
              className="w-full border-b border-gray-300 p-2 outline-none focus:border-black"
            />
            <p className="text-[10px] text-gray-400 mt-1">{t.minOrderHint}</p>
          </div>

          <button
            disabled={isSaving}
            className="w-full bg-black text-white font-bold py-4 mt-2 hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {isSaving ? t.saving : t.addBtn}
          </button>
        </form>
      </div>

      {/* قائمة الكودات */}
      <div className="lg:col-span-2">
        <h2 className="text-xl font-black text-black mb-6">{t.title}</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center text-gray-400 font-bold py-20">{t.noPromos}</div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {promoCodes.map(promo => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white border border-gray-200 p-4 rounded shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  {/* الكود والنسبة */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-black text-lg tracking-widest text-black" dir="ltr">
                        {promo.code}
                      </span>
                      <span className="bg-[var(--gold)] text-white text-xs font-black px-2.5 py-1 rounded-full">
                        {promo.discount_percentage}% OFF
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        promo.is_active && promo.used_count < promo.max_uses
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {promo.is_active && promo.used_count < promo.max_uses ? t.active : t.inactive}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium" dir="ltr">
                      {promo.used_count} / {promo.max_uses} {t.usedOf}
                      {promo.min_order_amount > 0 && (
                        <span className="mr-3 text-amber-500">· {lang === 'ar' ? `حد أدنى: ${promo.min_order_amount} JOD` : `Min: ${promo.min_order_amount} JOD`}</span>
                      )}
                    </p>
                    {/* شريط الاستخدام */}
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-[var(--gold)] h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min((promo.used_count / promo.max_uses) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(promo.id, promo.is_active)}
                      className={`text-xs font-bold px-3 py-1.5 rounded border transition-all ${
                        promo.is_active
                          ? 'border-orange-200 text-orange-500 hover:bg-orange-50'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {promo.is_active ? '⏸ ' + (lang === 'ar' ? 'إيقاف' : 'Pause') : '▶ ' + (lang === 'ar' ? 'تفعيل' : 'Activate')}
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                    >
                      🗑 {t.deleteBtn}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
