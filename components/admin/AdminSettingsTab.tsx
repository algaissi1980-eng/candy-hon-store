'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';

export interface StoreSettings {
  announcement_text_ar: string;
  announcement_text_en: string;
}

interface AdminSettingsTabProps {
  settings: StoreSettings;
  categories: string[];
  products: any[];
  lang: 'ar' | 'en';
  setSettings: (s: StoreSettings) => void;
  setCategories: (c: string[]) => void;
}

export default function AdminSettingsTab({ settings, categories, products, lang, setSettings, setCategories }: AdminSettingsTabProps) {
  const [newCategory, setNewCategory] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const t = {
    catTitle: lang === 'ar' ? 'إدارة التصنيفات' : 'Manage Categories',
    catLabel: lang === 'ar' ? 'إضافة تصنيف جديد للمتجر' : 'Add New Category',
    catPlaceholder: lang === 'ar' ? 'مثال: حلويات 🍬' : 'e.g. Sweets 🍬',
    addBtn: lang === 'ar' ? 'إضافة' : 'Add',
    successSave: lang === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved successfully!',
    announcementTitle: lang === 'ar' ? 'شريط الإعلانات 📢' : 'Announcement Bar 📢',
    announcementDesc: lang === 'ar'
      ? 'النص الذي يظهر في الشريط الذهبي أسفل الـ Hero. اتركه فارغاً لإخفاء الشريط.'
      : 'Text shown in the golden bar below the Hero. Leave empty to hide the bar.',
    announcementArLabel: lang === 'ar' ? 'النص العربي 🇯🇴' : 'Arabic Text 🇯🇴',
    announcementEnLabel: lang === 'ar' ? 'النص الإنجليزي 🇬🇧' : 'English Text 🇬🇧',
    saveAnnouncement: lang === 'ar' ? 'حفظ الإعلان 📢' : 'Save Announcement 📢',
  };

  const handleAddCategory = () => {
    if (newCategory.trim() !== '' && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => setCategories(categories.filter(c => c !== cat));

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    const { error } = await supabase.from('store_settings').upsert({
      id: 1,
      announcement_text_ar: settings.announcement_text_ar,
      announcement_text_en: settings.announcement_text_en,
      categories,
    });
    if (!error) toast.success(t.successSave);
    else toast.error('Error: ' + error.message);
    setIsSavingAnnouncement(false);
  };

  const handleSaveCategories = async () => {
    setIsSavingSettings(true);
    const { error } = await supabase.from('store_settings').upsert({
      id: 1,
      categories,
    });
    if (!error) toast.success(t.successSave);
    else toast.error('Error: ' + error.message);
    setIsSavingSettings(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

      {/* ====== Categories ====== */}
      <div className="bg-white p-8 border border-gray-200 h-fit shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-black text-black mb-8">{t.catTitle}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">{t.catLabel}</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  placeholder={t.catPlaceholder}
                  className="w-full border border-gray-300 p-3 text-sm outline-none focus:border-black"
                />
                <button type="button" onClick={handleAddCategory} className="bg-black text-white px-8 py-3 font-bold text-sm">{t.addBtn}</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              {categories.map(cat => (
                <span key={cat} className="bg-[#f8f9fa] border border-gray-200 text-gray-800 px-4 py-2 text-sm font-bold flex items-center gap-3">
                  <button type="button" onClick={() => handleRemoveCategory(cat)} className="text-red-500 hover:text-red-700 font-bold text-lg leading-none">✕</button>
                  <span>{cat}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleSaveCategories}
            disabled={isSavingSettings}
            className="w-full bg-[var(--dark)] hover:bg-[var(--gold)] text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <span>💾</span> {isSavingSettings ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t.addBtn}
          </button>
        </div>
      </div>

      {/* ====== Announcement Bar ====== */}
      <div className="md:col-span-2 bg-white p-8 border border-gray-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-black mb-1">{t.announcementTitle}</h2>
          <p className="text-sm text-gray-400">{t.announcementDesc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* النص العربي */}
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2">{t.announcementArLabel}</label>
            <textarea
              value={settings.announcement_text_ar || ''}
              onChange={e => setSettings({ ...settings, announcement_text_ar: e.target.value })}
              placeholder="مثال: نرحب بكم في كاندي هون!"
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-black resize-none font-medium"
              dir="rtl"
            />
          </div>
          {/* النص الإنجليزي */}
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2">{t.announcementEnLabel}</label>
            <textarea
              value={settings.announcement_text_en || ''}
              onChange={e => setSettings({ ...settings, announcement_text_en: e.target.value })}
              placeholder="e.g. Welcome to Candy Hon!"
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-black resize-none font-medium"
              dir="ltr"
            />
          </div>
        </div>

        {/* معاينة */}
        {(settings.announcement_text_ar || settings.announcement_text_en) && (
          <div className="bg-[#1C1917] text-[#F0DFA0] px-6 py-3 rounded-full text-center text-sm font-bold mb-6 border border-[#D4AF37]/20">
            🍬 {lang === 'ar' ? (settings.announcement_text_ar || settings.announcement_text_en) : (settings.announcement_text_en || settings.announcement_text_ar)} 🍬
          </div>
        )}

        <button
          onClick={handleSaveAnnouncement}
          disabled={isSavingAnnouncement}
          className="w-full bg-[var(--dark)] hover:bg-[var(--gold)] text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-400"
        >
          <span>📢</span> {isSavingAnnouncement ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t.saveAnnouncement}
        </button>
      </div>

    </div>
  );
}
