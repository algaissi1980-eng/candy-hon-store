'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { getDaysUntilRestock, getTodayISO } from '../../lib/preorderUtils';
import { toast } from 'sonner';
import Image from 'next/image';

interface AdminProductsTabProps {
  products: any[];
  categories: string[];
  lang: 'ar' | 'en';
  fetchProducts: () => void;
}

export default function AdminProductsTab({ products, categories, lang, fetchProducts }: AdminProductsTabProps) {
  const [productForm, setProductForm] = useState<{
    id: string;
    name_ar: string;
    name_en: string;
    description: string;
    price: string;
    original_price: string;
    image_url: string;
    is_available: boolean;
    category: string;
    stock: number;
    allow_preorder: boolean;
    restock_date: string;
  }>({
    id: '', name_ar: '', name_en: '', description: '', price: '',
    original_price: '', image_url: '', is_available: true,
    category: categories[0] || '', stock: 10,
    allow_preorder: false, restock_date: '',
  });

  const [imageEntries, setImageEntries] = useState<{ url: string; file?: File }[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const t = {
    addTitle: lang === 'ar' ? 'إضافة منتج' : 'Add Product',
    editTitle: lang === 'ar' ? 'تعديل منتج' : 'Edit Product',
    nameArPlace: 'الاسم بالعربي',
    nameEnPlace: 'Product Name (English)',
    pricePlace: lang === 'ar' ? 'السعر' : 'Price',
    stockLabel: lang === 'ar' ? 'المخزون:' : 'Stock:',
    stockPlace: lang === 'ar' ? 'المخزون' : 'Stock',
    availableLabel: lang === 'ar' ? 'متوفر للطلب' : 'Available for Order',
    descPlace: lang === 'ar' ? 'الوصف' : 'Description',
    listTitle: lang === 'ar' ? 'المنتجات' : 'Products',
    categoryLabel: lang === 'ar' ? 'التصنيف:' : 'Category:',
    stopBtn: lang === 'ar' ? 'إيقاف المنتج 🚫' : 'Stop Product 🚫',
    activateBtn: lang === 'ar' ? 'تفعيل المنتج ✅' : 'Activate Product ✅',
    editBtn: lang === 'ar' ? 'تعديل ✏️' : 'Edit ✏️',
    deleteBtn: lang === 'ar' ? 'حذف 🗑️' : 'Delete 🗑️',
    confirmDelete: lang === 'ar' ? 'حذف المنتج؟' : 'Delete Product?',
    successAdd: lang === 'ar' ? 'تمت الإضافة بنجاح!' : 'Added successfully!',
    successEdit: lang === 'ar' ? 'تم التعديل بنجاح!' : 'Edited successfully!',
    preorderLabel: lang === 'ar' ? 'السماح بالطلب المسبق عند نفاد المخزون' : 'Allow Pre-order when out of stock',
    restockDateLabel: lang === 'ar' ? 'تاريخ التوفر المتوقع:' : 'Expected restock date:',
    restockDateHint: lang === 'ar' ? 'سيُحسب عدد الأيام تلقائياً' : 'Days remaining will be calculated automatically',
  };

  const resetForm = () => {
    setProductForm({
      id: '', name_ar: '', name_en: '', description: '', price: '',
      original_price: '', image_url: '', is_available: true,
      category: categories[0] || '', stock: 10,
      allow_preorder: false, restock_date: '',
    });
    setImageEntries([]);
    setIsEditing(false);
  };

  const startEditing = (product: any) => {
    setProductForm({
      id: product.id,
      name_ar: product.name_ar || product.name || '',
      name_en: product.name_en || '',
      description: product.description,
      price: product.price.toString(),
      original_price: product.original_price ? product.original_price.toString() : '',
      image_url: product.image_url || '',
      is_available: product.is_available,
      category: product.category || categories[0],
      stock: product.stock !== undefined ? product.stock : 10,
      allow_preorder: product.allow_preorder ?? false,
      restock_date: product.restock_date ?? '',
    });
    // تحميل الصور الموجودة — نُعطي أولوية لمصفوفة images، ثم image_url كبديل
    const existingImages: { url: string; file?: File }[] =
      product.images && product.images.length > 0
        ? product.images.map((url: string) => ({ url }))
        : product.image_url
          ? [{ url: product.image_url }]
          : [];
    setImageEntries(existingImages);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // رفع الصور الجديدة (التي لها file) والإبقاء على الروابط الموجودة كما هي
    const uploadedUrls: string[] = [];
    for (const entry of imageEntries) {
      if (entry.file) {
        const fileExt = entry.file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, entry.file);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      } else {
        uploadedUrls.push(entry.url);
      }
    }

    const productData = {
      // name = الاسم العربي كـ primary (للتوافق مع الكود القديم)
      name: productForm.name_ar || productForm.name_en,
      name_ar: productForm.name_ar,
      name_en: productForm.name_en,
      description: productForm.description,
      price: parseFloat(productForm.price),
      original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
      image_url: uploadedUrls[0] || null,
      images: uploadedUrls,
      is_available: productForm.is_available,
      category: productForm.category || categories[0],
      stock: productForm.stock,
      allow_preorder: productForm.allow_preorder,
      restock_date: productForm.allow_preorder && productForm.restock_date
        ? productForm.restock_date
        : null,
    };

    if (isEditing) {
      const { error } = await supabase.from('products').update(productData).eq('id', productForm.id);
      if (error) {
        toast.error(`❌ فشل التعديل: ${error.message}`);
        setIsSaving(false);
        return;
      }
      toast.success(t.successEdit);
    } else {
      const { error } = await supabase.from('products').insert(productData);
      if (error) {
        toast.error(`❌ فشل الحفظ: ${error.message}`);
        setIsSaving(false);
        return;
      }
      toast.success(t.successAdd);
    }
    fetchProducts();
    resetForm();
    setIsSaving(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      const isForeignKeyError = error.message?.includes('foreign key') || error.message?.includes('order_items');
      if (isForeignKeyError) {
        toast.error(
          lang === 'ar'
            ? '❌ لا يمكن حذف المنتج — يوجد طلبات نشطة تشمله!\n\n💡 استخدم زر "إيقاف المنتج 🚫" بدلاً من الحذف.'
            : '❌ Cannot delete — active orders contain this product!\n\n💡 Use "Stop Product 🚫" instead.'
        );
      } else {
        toast.error(lang === 'ar' ? `فشل الحذف: ${error.message}` : `Delete failed: ${error.message}`);
      }
      return;
    }

    toast.success(lang === 'ar' ? 'تم حذف المنتج بنجاح ✓' : 'Product deleted ✓');
    fetchProducts();
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('products').update({ is_available: !currentStatus }).eq('id', id);
    if (!error) fetchProducts();
  };

  // دالة لعرض اسم المنتج حسب اللغة
  const getProductName = (product: any) => {
    if (lang === 'ar') return product.name_ar || product.name || '—';
    return product.name_en || product.name_ar || product.name || '—';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

      {/* فورم الإضافة / التعديل */}
      <div className="lg:col-span-1 bg-white p-8 border border-gray-200 h-fit shadow-sm">
        <h2 className="text-xl font-black text-black mb-6">{isEditing ? t.editTitle : t.addTitle}</h2>
        <form onSubmit={handleSaveProduct} className="space-y-4">

          {/* اسم المنتج بالعربي والإنجليزي */}
          <div className="space-y-3 bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">اسم المنتج / Product Name</p>
            <div className="relative">
              <span className="absolute right-2 top-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">عربي</span>
              <input
                type="text"
                required
                value={productForm.name_ar}
                onChange={e => setProductForm({...productForm, name_ar: e.target.value})}
                placeholder={t.nameArPlace}
                dir="rtl"
                className="w-full border-b border-gray-300 p-2 pt-7 outline-none focus:border-black text-right"
              />
            </div>
            <div className="relative">
              <span className="absolute left-2 top-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">EN</span>
              <input
                type="text"
                value={productForm.name_en}
                onChange={e => setProductForm({...productForm, name_en: e.target.value})}
                placeholder={t.nameEnPlace}
                dir="ltr"
                className="w-full border-b border-gray-300 p-2 pt-7 outline-none focus:border-black text-left"
              />
            </div>
          </div>

          {/* السعر والمخزون */}
          <div className="grid grid-cols-2 gap-4">
            <input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} placeholder="السعر الحالي" className="w-full border-b border-gray-300 p-2 outline-none focus:border-black" />
            <input type="number" step="0.01" value={productForm.original_price} onChange={e => setProductForm({...productForm, original_price: e.target.value})} placeholder="السعر القديم (عروض)" className="w-full border-b border-gray-300 p-2 outline-none focus:border-black" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="border-b border-gray-300 p-2 outline-none bg-white">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="flex gap-2 items-center">
              <label className="text-xs font-bold text-gray-400">{t.stockLabel}</label>
              <input type="number" min="0" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value)})} placeholder={t.stockPlace} className="border-b border-gray-300 p-2 outline-none focus:border-black w-full" />
            </div>
          </div>


          <div className="bg-gray-50 p-4 border border-gray-200 rounded mt-4 space-y-3">
            {/* متوفر للطلب */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={productForm.is_available} onChange={e => setProductForm({...productForm, is_available: e.target.checked})} className="w-4 h-4 accent-black" />
              <span className="font-bold text-sm">{t.availableLabel}</span>
            </label>

            {/* السماح بالطلب المسبق */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={productForm.allow_preorder}
                onChange={e => setProductForm({
                  ...productForm,
                  allow_preorder: e.target.checked,
                  restock_date: e.target.checked ? productForm.restock_date : '',
                })}
                className="w-4 h-4 accent-violet-600"
              />
              <span className="font-bold text-sm text-violet-700">{t.preorderLabel}</span>
            </label>

            {/* Date Picker لتاريخ التوفر — يظهر فقط إذا allow_preorder مفعّل */}
            {productForm.allow_preorder && (
              <div className="pt-2 border-t border-violet-100 space-y-1.5">
                <label className="text-xs font-bold text-violet-600 block">
                  {t.restockDateLabel}
                </label>
                <input
                  type="date"
                  min={getTodayISO()}
                  value={productForm.restock_date}
                  onChange={e => setProductForm({ ...productForm, restock_date: e.target.value })}
                  className="w-full border border-violet-200 rounded-lg p-2 text-sm outline-none focus:border-violet-500 bg-white font-bold text-violet-800 cursor-pointer"
                />
                {/* عرض حساب الأيام المتبقية فورياً */}
                {productForm.restock_date && (() => {
                  const days = getDaysUntilRestock(productForm.restock_date);
                  return days !== null && days > 0 ? (
                    <p className="text-[11px] text-violet-500 font-bold">
                      ✓ {lang === 'ar' ? `سيظهر للزبائن: يتوفر خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}` : `Customers will see: Ships in ~${days} day${days !== 1 ? 's' : ''}`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-500 font-bold">
                      ⚠ {lang === 'ar' ? 'التاريخ المحدد في الماضي أو اليوم' : 'Selected date is today or in the past'}
                    </p>
                  );
                })()}
                <p className="text-[10px] text-gray-400">{t.restockDateHint}</p>
              </div>
            )}
          </div>

          {/* مدير الصور المتعددة — حتى 5 صور */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider">
              📷 {lang === 'ar' ? 'صور المنتج (حتى 5 صور)' : 'Product Images (up to 5)'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {imageEntries.map((entry, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded overflow-hidden group border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.url} alt="" className="w-full h-full object-cover" />
                  {/* زر الحذف */}
                  <button
                    type="button"
                    onClick={() => setImageEntries(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                  >✕</button>
                  {/* شارة الصورة الرئيسية */}
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5 font-bold">
                      {lang === 'ar' ? 'رئيسية' : 'Main'}
                    </div>
                  )}
                </div>
              ))}
              {/* زر إضافة صورة جديدة */}
              {imageEntries.length < 5 && (
                <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-100 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setImageEntries(prev => [...prev, { url, file }]);
                      e.target.value = '';
                    }}
                  />
                  <span className="text-xl text-gray-400 leading-none">+</span>
                  <span className="text-[8px] text-gray-400 mt-0.5">{lang === 'ar' ? 'إضافة' : 'Add'}</span>
                </label>
              )}
            </div>
            {imageEntries.length > 1 && (
              <p className="text-[10px] text-gray-400">
                💡 {lang === 'ar' ? 'الصورة الأولى ستكون الصورة الرئيسية للمنتج' : 'First image will be the main product image'}
              </p>
            )}
          </div>
          <textarea required value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder={t.descPlace} className="w-full border-b border-gray-300 p-2 outline-none focus:border-black h-16 resize-none" />

          <button disabled={isSaving} className="w-full bg-black text-white font-bold py-4 mt-2 hover:bg-gray-800 disabled:bg-gray-400">
            {isSaving
              ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
              : isEditing
                ? (lang === 'ar' ? 'حفظ التعديلات ✏️' : 'Save Changes ✏️')
                : (lang === 'ar' ? 'إضافة منتج جديد ➕' : 'Add New Product ➕')
            }
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="w-full bg-white text-red-500 border border-red-200 font-bold py-3 mt-2 rounded hover:bg-red-50 transition-colors text-sm">
              {lang === 'ar' ? 'إلغاء التعديل ✕' : 'Cancel Edit ✕'}
            </button>
          )}
        </form>
      </div>

    {/* قائمة المنتجات */}
<div className="lg:col-span-2">
  <h2 className="text-xl font-black text-black mb-6">{t.listTitle}</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {products.map(product => (
      <div key={product.id} className="bg-white border border-gray-200 p-4 flex flex-col gap-3 shadow-sm rounded">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-gray-100 flex-shrink-0 rounded overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name_ar || product.name || "صورة المنتج"}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl text-gray-400">📷</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {/* عرض الاسمين معاً في الأدمن */}
            <h3 className="font-black text-black text-sm leading-tight" dir="rtl">{product.name_ar || product.name}</h3>
            {product.name_en && (
              <p className="text-xs text-gray-400 font-medium mt-0.5" dir="ltr">{product.name_en}</p>
            )}
            <div className="flex items-center gap-2 mt-1" dir="ltr">
              <span className="text-sm font-black text-[var(--gold)]">{product.price} JOD</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-gray-400 line-through font-bold">{product.original_price} JOD</span>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-1 block">
              {t.categoryLabel} {product.category || 'منتج'} | {t.stockLabel} <b className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>{product.stock || 0}</b>
            </span>
            {product.allow_preorder && (
              <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-[9px] font-black px-2 py-0.5 rounded-md mt-1">
                ⏳ {lang === 'ar' ? 'طلب مسبق مفعّل' : 'Pre-order ON'}
                {(() => {
                  const days = getDaysUntilRestock(product.restock_date);
                  return days !== null && days > 0 ? ` · ${days}d` : null;
                })()}
              </span>
            )}
          </div>
        </div>

              <div className="flex gap-4 border-t border-gray-100 pt-3 mt-auto flex-wrap items-center">
                <button
                  onClick={() => handleToggleAvailability(product.id, product.is_available)}
                  className={`text-xs font-bold px-2 py-1 rounded transition-colors ${product.is_available ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                >
                  {product.is_available ? t.stopBtn : t.activateBtn}
                </button>
                <div className={`flex gap-4 ${lang === 'ar' ? 'mr-auto' : 'ml-auto'}`}>
                  <button onClick={() => startEditing(product)} className="text-xs font-bold text-gray-400 hover:text-black">{t.editBtn}</button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="text-xs font-bold text-gray-400 hover:text-red-600">{t.deleteBtn}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
