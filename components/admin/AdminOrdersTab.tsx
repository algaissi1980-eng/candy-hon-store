'use client';
import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';
import { getCityName } from '../../lib/deliveryAreas';
import BottomSheet from './BottomSheet';

interface AdminOrdersTabProps {
  orders: any[];
  products: any[];
  lang: 'ar' | 'en';
  fetchOrders: () => void;
}

const STATUS_ORDER = ['confirmed', 'processing', 'completed'] as const;
type OrderStatus = typeof STATUS_ORDER[number];

const STATUS_STYLE: Record<string, string> = {
  confirmed:  'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-700',
};

const STATUS_RING: Record<string, string> = {
  confirmed:  'ring-amber-300',
  processing: 'ring-blue-300',
  completed:  'ring-green-300',
};

// ─── بطاقة الطلب للموبايل مع سوايب ─────────────────────────────────
function MobileOrderCard({ order, lang, statuses, unspecified, onDeleteRequest, onStatusChange }: {
  order: any;
  lang: 'ar' | 'en';
  statuses: Record<string, string>;
  unspecified: string;
  onDeleteRequest: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const x = useMotionValue(0);
  const rightOpacity = useTransform(x, [0, 40, 120], [0, 0.6, 1]);
  const leftOpacity  = useTransform(x, [-120, -40, 0], [1, 0.6, 0]);

  const currentIdx = STATUS_ORDER.indexOf(order.status as OrderStatus);
  const canAdvance = currentIdx < STATUS_ORDER.length - 1;
  const canReverse = currentIdx > 0;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 80 && canAdvance) {
      onStatusChange(order.id, STATUS_ORDER[currentIdx + 1]);
    } else if (info.offset.x < -80 && canReverse) {
      onStatusChange(order.id, STATUS_ORDER[currentIdx - 1]);
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden select-none">

      {/* خلفية السوايب — يمين = تقدم */}
      <motion.div
        className="absolute inset-0 bg-green-100 rounded-3xl flex items-center justify-end px-6"
        style={{ opacity: rightOpacity }}
      >
        <span className="text-green-600 font-black text-sm">
          {canAdvance ? statuses[STATUS_ORDER[currentIdx + 1]] : ''} ✓
        </span>
      </motion.div>

      {/* خلفية السوايب — يسار = رجوع */}
      <motion.div
        className="absolute inset-0 bg-red-100 rounded-3xl flex items-center justify-start px-6"
        style={{ opacity: leftOpacity }}
      >
        <span className="text-red-500 font-black text-sm">
          {canReverse ? statuses[STATUS_ORDER[currentIdx - 1]] : ''}
        </span>
      </motion.div>

      {/* البطاقة الرئيسية */}
      <motion.div
        drag="x"
        dragSnapToOrigin
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-white rounded-3xl border border-gray-100 shadow-sm p-5 touch-pan-y"
      >
        {/* رأس البطاقة */}
        <div className="flex justify-between items-start mb-4">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {statuses[order.status] || order.status}
          </span>
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-mono">#{order.id.split('-')[0]}</div>
            <div className="font-black text-xl" dir="ltr">{order.total_amount} JOD</div>
          </div>
        </div>

        {/* معلومات الزبون */}
        <div className="bg-gray-50 rounded-2xl p-3 mb-4 space-y-0.5">
          <div className="font-bold text-gray-800 text-sm">{order.customer_name || unspecified}</div>
          <div className="text-gray-500 text-xs font-medium" dir="ltr">{order.customer_phone || ''}</div>
          {order.delivery_city && (
            <div className="text-gray-400 text-xs">
              {getCityName(order.delivery_city, lang)} · <span dir="ltr">{order.delivery_fee || 0} JOD</span>
            </div>
          )}
        </div>

        {/* المنتجات */}
        <div className="space-y-1.5 mb-4 border-b border-gray-100 pb-4">
          {order.order_items?.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 font-bold text-xs">{item.quantity}×</span>
              <span className="font-bold text-gray-700">{item.products?.name}</span>
              {item.is_preorder && (
                <span className="bg-violet-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none">⏳</span>
              )}
            </div>
          ))}
        </div>

        {/* أزرار الحالة */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              onClick={() => onStatusChange(order.id, s)}
              className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                order.status === s
                  ? `${STATUS_STYLE[s]} ring-2 ring-offset-1 ${STATUS_RING[s]}`
                  : 'bg-gray-100 text-gray-400 active:bg-gray-200'
              }`}
            >
              {statuses[s as keyof typeof statuses]}
            </button>
          ))}
        </div>

        {/* واتساب + حذف */}
        <div className="flex gap-3">
          <a
            href={`https://wa.me/962${order.customer_phone?.replace(/^0+/, '') || ''}?text=${encodeURIComponent(
              lang === 'ar'
                ? `مرحباً، نتواصل معك بخصوص طلبك #${order.id.split('-')[0]} من Candy Hon 🍬`
                : `Hello, regarding your order #${order.id.split('-')[0]} from Candy Hon 🍬`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#25D366] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm active:bg-[#1da851] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {lang === 'ar' ? 'واتساب' : 'WhatsApp'}
          </a>
          <button
            onClick={() => onDeleteRequest(order.id)}
            className="w-14 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center text-xl active:bg-red-100 transition-colors"
          >
            🗑️
          </button>
        </div>

        {/* تلميح السوايب — dir="ltr" ضروري لأن الـ drag يعمل بإحداثيات فيزيائية */}
        {(canAdvance || canReverse) && (
          <div className="flex justify-between items-center mt-3 px-1" dir="ltr">
            <div className="flex items-center gap-1">
              {canReverse && (
                <>
                  <span className="text-gray-300 text-base leading-none">←</span>
                  <span className="text-[10px] text-gray-300 font-bold">
                    {statuses[STATUS_ORDER[currentIdx - 1]]?.replace(/\s*[🆕👨‍🍳📦]\s*/g, '').trim()}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {canAdvance && (
                <>
                  <span className="text-[10px] text-gray-300 font-bold">
                    {statuses[STATUS_ORDER[currentIdx + 1]]?.replace(/\s*[🆕👨‍🍳📦]\s*/g, '').trim()}
                  </span>
                  <span className="text-gray-300 text-base leading-none">→</span>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────
export default function AdminOrdersTab({ orders, products, lang, fetchOrders }: AdminOrdersTabProps) {
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [deleteSheetId, setDeleteSheetId] = useState<string | null>(null);

  const t = {
    col1: lang === 'ar' ? 'الطلب / الزبون' : 'Order / Customer',
    col2: lang === 'ar' ? 'المنتجات' : 'Products',
    col3: lang === 'ar' ? 'الإجراءات' : 'Actions',
    name: lang === 'ar' ? 'الاسم:' : 'Name:',
    phone: lang === 'ar' ? 'الهاتف:' : 'Phone:',
    address: lang === 'ar' ? 'العنوان:' : 'Address:',
    city: lang === 'ar' ? 'المنطقة:' : 'Area:',
    deliveryFeeLabel: lang === 'ar' ? 'رسوم التوصيل:' : 'Delivery:',
    unspecified: lang === 'ar' ? 'غير محدد' : 'Unspecified',
    confirmDelete: lang === 'ar' ? 'حذف الطلب نهائياً؟' : 'Delete order permanently?',
    editBtn: lang === 'ar' ? 'تعديل ✏️' : 'Edit ✏️',
    saveOrderBtn: lang === 'ar' ? 'حفظ التعديلات 💾' : 'Save Changes 💾',
    cancelEditBtn: lang === 'ar' ? 'إلغاء' : 'Cancel',
    removeItem: lang === 'ar' ? 'حذف' : 'Remove',
    newTotal: lang === 'ar' ? 'المجموع الجديد:' : 'New Total:',
    savingOrder: lang === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    orderSaved: lang === 'ar' ? 'تم تحديث الطلب بنجاح! ✅' : 'Order updated successfully! ✅',
    minOneItem: lang === 'ar' ? 'لا يمكن حذف جميع المنتجات!' : 'Cannot remove all items!',
    addProduct: lang === 'ar' ? 'إضافة منتج ➕' : 'Add Product ➕',
    selectProduct: lang === 'ar' ? 'اختر منتج...' : 'Select product...',
    searchOrders: lang === 'ar' ? 'بحث برقم الطلب أو الاسم...' : 'Search by order # or name...',
    deleteConfirmTitle: lang === 'ar' ? 'حذف الطلب؟' : 'Delete Order?',
    deleteConfirmDesc: lang === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.',
    deleteConfirmBtn: lang === 'ar' ? '🗑️ نعم، احذف الطلب' : '🗑️ Yes, Delete',
    cancelBtn: lang === 'ar' ? 'إلغاء' : 'Cancel',
    newOrders: lang === 'ar' ? 'جديد' : 'New',
    totalOrders: lang === 'ar' ? 'إجمالي' : 'Total',
    revenue: lang === 'ar' ? 'إيرادات' : 'Revenue',
    statuses: {
      confirmed:  lang === 'ar' ? 'مؤكد 🆕' : 'Confirmed 🆕',
      processing: lang === 'ar' ? 'قيد التجهيز 👨‍🍳' : 'Processing 👨‍🍳',
      completed:  lang === 'ar' ? 'مكتمل 📦' : 'Completed 📦',
    }
  };

  const startEditingOrder = (order: any) => {
    setEditingOrderId(order.id);
    setEditingItems(order.order_items.map((item: any) => ({
      ...item,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      product_name: item.products?.name || '—',
      original_quantity: Number(item.quantity) || 1
    })));
  };

  const cancelEditingOrder = () => {
    setEditingOrderId(null);
    setEditingItems([]);
  };

  const updateEditingItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setEditingItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: newQty } : item));
  };

  const removeEditingItem = (index: number) => {
    if (editingItems.length <= 1) return toast.error(t.minOneItem);
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveEditedOrder = async () => {
    if (!editingOrderId) return;
    setIsSavingOrder(true);
    try {
      const newTotal = editingItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      await supabase.from('order_items').delete().eq('order_id', editingOrderId);
      const newItems = editingItems.map((item: any) => ({
        order_id: editingOrderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        note: item.note ?? null,
        is_preorder: item.is_preorder ?? false,
      }));
      const { error: insertErr } = await supabase.from('order_items').insert(newItems);
      if (insertErr) throw insertErr;
      const { error: updateErr } = await supabase.from('orders').update({ total_amount: newTotal }).eq('id', editingOrderId);
      if (updateErr) throw updateErr;

      const order = orders.find(o => o.id === editingOrderId);
      if (order) {
        for (const oldItem of order.order_items) {
          if (oldItem.is_preorder) continue;
          const newItem = editingItems.find((ni: any) => ni.product_id === oldItem.product_id);
          const diff = oldItem.quantity - (newItem ? newItem.quantity : 0);
          if (diff !== 0) {
            const { data: pData } = await supabase.from('products').select('stock').eq('id', oldItem.product_id).single();
            if (pData) await supabase.from('products').update({ stock: pData.stock + diff }).eq('id', oldItem.product_id);
          }
        }
      }

      toast.success(t.orderSaved);
      cancelEditingOrder();
      fetchOrders();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // للديسك توب — يستخدم window.confirm
  const handleDeleteOrderDesktop = async (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      await supabase.from('order_items').delete().eq('order_id', id);
      await supabase.from('orders').delete().eq('id', id);
      fetchOrders();
    }
  };

  // للموبايل — يستخدم BottomSheet
  const executeDelete = async () => {
    if (!deleteSheetId) return;
    await supabase.from('order_items').delete().eq('order_id', deleteSheetId);
    await supabase.from('orders').delete().eq('id', deleteSheetId);
    setDeleteSheetId(null);
    fetchOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders();
  };

  const filteredOrders = orders.filter(o =>
    !orderSearchQuery ||
    o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
    o.customer_phone?.includes(orderSearchQuery)
  );

  const newOrdersCount = orders.filter(o => o.status === 'confirmed').length;
  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

  return (
    <div className="pb-24 md:pb-0">

      {/* بانر الإحصائيات السريعة — موبايل فقط */}
      <div className="md:hidden grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
          <div className="text-2xl font-black text-black">{orders.length}</div>
          <div className="text-[10px] text-gray-400 font-bold mt-0.5">{t.totalOrders}</div>
        </div>
        <div className={`rounded-2xl p-3 text-center border ${newOrdersCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}>
          <div className={`text-2xl font-black ${newOrdersCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{newOrdersCount}</div>
          <div className={`text-[10px] font-bold mt-0.5 ${newOrdersCount > 0 ? 'text-amber-400' : 'text-gray-400'}`}>{t.newOrders} 🆕</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-3 text-center border border-green-100">
          <div className="text-lg font-black text-green-600" dir="ltr">{totalRevenue.toFixed(0)}</div>
          <div className="text-[10px] text-green-400 font-bold mt-0.5">{t.revenue} JD</div>
        </div>
      </div>

      {/* حقل البحث */}
      <div className="mb-4">
        <input
          type="text"
          value={orderSearchQuery}
          onChange={e => setOrderSearchQuery(e.target.value)}
          placeholder={t.searchOrders}
          className="w-full max-w-md border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:border-black transition-colors shadow-sm font-bold"
          dir="ltr"
        />
      </div>

      {/* ─── بطاقات الموبايل ─────────────────────────────────── */}
      <div className="md:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-bold">
            {lang === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
          </div>
        ) : filteredOrders.map(order => (
          <MobileOrderCard
            key={order.id}
            order={order}
            lang={lang}
            statuses={t.statuses}
            unspecified={t.unspecified}
            onDeleteRequest={setDeleteSheetId}
            onStatusChange={updateOrderStatus}
          />
        ))}
      </div>

      {/* ─── جدول الديسك توب ─────────────────────────────────── */}
      <div className="hidden md:block bg-white border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-right min-w-[800px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <thead className="bg-gray-50 border-b border-gray-200 text-black">
            <tr>
              <th className="p-5 font-bold">{t.col1}</th>
              <th className="p-5 font-bold">{t.col2}</th>
              <th className={`p-5 font-bold ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{t.col3}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${order.status === 'confirmed' ? 'bg-amber-50/40' : ''}`}>
                <td className="p-5 text-sm">
                  <span className="font-mono text-gray-500 block mb-1">#{order.id.split('-')[0]}</span>
                  <span className="font-black block text-lg mb-2" dir="ltr">{order.total_amount} JOD</span>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="font-bold text-gray-700">{t.name}</span> {order.customer_name || t.unspecified}</p>
                    <p><span className="font-bold text-gray-700">{t.phone}</span> <span dir="ltr">{order.customer_phone || t.unspecified}</span></p>
                    {order.delivery_city && (
                      <p><span className="font-bold text-gray-700">{t.city}</span> {getCityName(order.delivery_city, lang)} <span className="text-[var(--gold)] font-bold" dir="ltr">({order.delivery_fee || 0} JOD)</span></p>
                    )}
                    <p><span className="font-bold text-gray-700">{t.address}</span> {order.delivery_address || t.unspecified}</p>
                  </div>
                </td>
                <td className="p-5 text-sm text-gray-900">
                  {editingOrderId === order.id ? (
                    <div className="space-y-2">
                      {editingItems.map((item: any, i: number) => (
                        <div key={i} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-3">
                          <div className="flex-1">
                            <span className="block font-bold text-sm">{item.product_name}</span>
                            <span className="text-[10px] text-gray-400 block" dir="ltr">{item.price} JOD</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <button type="button" onClick={() => updateEditingItemQty(i, item.quantity - 1)} className="w-7 h-7 text-gray-400 hover:bg-gray-100 font-bold text-sm">−</button>
                            <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                            <button type="button" onClick={() => updateEditingItemQty(i, item.quantity + 1)} className="w-7 h-7 text-[var(--gold)] hover:bg-[var(--cream-dark)] font-bold text-sm">+</button>
                          </div>
                          <button type="button" onClick={() => removeEditingItem(i)} className="text-red-400 hover:text-red-600 text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">{t.removeItem}</button>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2 pt-2 border-t border-yellow-200">
                        <select id={`add-product-${order.id}`} className="flex-1 border border-gray-200 rounded-lg p-2 text-xs outline-none bg-white focus:border-black">
                          <option value="">{t.selectProduct}</option>
                          {products.filter(p => p.is_available && p.stock > 0).map(p => (
                            <option key={p.id} value={p.id}>{p.name} — {p.price} JOD</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const sel = document.getElementById(`add-product-${order.id}`) as HTMLSelectElement;
                            if (!sel.value) return;
                            const prod = products.find(p => p.id === sel.value);
                            if (!prod) return;
                            const exists = editingItems.find((ei: any) => ei.product_id === prod.id);
                            if (exists) {
                              setEditingItems(prev => prev.map(ei => ei.product_id === prod.id ? { ...ei, quantity: ei.quantity + 1 } : ei));
                            } else {
                              setEditingItems(prev => [...prev, { product_id: prod.id, product_name: prod.name, price: Number(prod.price), quantity: 1, original_quantity: 0, note: null }]);
                            }
                            sel.value = '';
                          }}
                          className="bg-black text-white font-bold px-3 py-2 rounded-lg text-xs hover:bg-gray-800 transition-colors whitespace-nowrap"
                        >
                          {t.addProduct}
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-yellow-200 mt-2">
                        <span className="text-xs font-bold text-gray-500">{t.newTotal}</span>
                        <span className="font-black text-[var(--gold)]" dir="ltr">{editingItems.reduce((s: number, it: any) => s + (Number(it.price) * Number(it.quantity)), 0)} JOD</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveEditedOrder} disabled={isSavingOrder} className="flex-1 bg-black text-white font-bold py-2 rounded-lg text-xs hover:bg-gray-800 disabled:bg-gray-400 transition-colors">
                          {isSavingOrder ? t.savingOrder : t.saveOrderBtn}
                        </button>
                        <button onClick={cancelEditingOrder} className="px-4 py-2 bg-white border border-gray-200 text-gray-500 font-bold rounded-lg text-xs hover:bg-gray-50 transition-colors">
                          {t.cancelEditBtn}
                        </button>
                      </div>
                    </div>
                  ) : (
                    order.order_items.map((item: any, i: number) => (
                      <div key={i} className="mb-2 bg-gray-50 p-2 border border-gray-100 rounded">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{item.products?.name} <span className="text-[var(--gold)]">({item.quantity}x)</span></span>
                          {item.is_preorder && (
                            <span className="bg-violet-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md leading-none whitespace-nowrap">⏳ {lang === 'ar' ? 'طلب مسبق' : 'Pre-order'}</span>
                          )}
                        </div>
                        {item.note && <span className="text-[10px] text-gray-400 block mt-0.5">📝 {item.note}</span>}
                      </div>
                    ))
                  )}
                </td>
                <td className={`p-5 flex ${lang === 'ar' ? 'justify-end' : 'justify-start'} gap-3 items-center flex-wrap`}>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className={`border p-2 font-bold outline-none cursor-pointer rounded transition-colors ${
                      order.status === 'confirmed'  ? 'border-blue-300 bg-blue-50 text-blue-800' :
                      order.status === 'processing' ? 'border-purple-300 bg-purple-50 text-purple-800' :
                      'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <option value="confirmed">{t.statuses.confirmed}</option>
                    <option value="processing">{t.statuses.processing}</option>
                    <option value="completed">{t.statuses.completed}</option>
                  </select>
                  <button
                    onClick={() => editingOrderId === order.id ? cancelEditingOrder() : startEditingOrder(order)}
                    className={`text-xs font-bold px-3 py-2 rounded-lg transition-all ${editingOrderId === order.id ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
                  >
                    {editingOrderId === order.id ? t.cancelEditBtn : t.editBtn}
                  </button>
                  <a
                    href={`https://wa.me/962${order.customer_phone?.replace(/^0+/, '') || ''}?text=${encodeURIComponent(lang === 'ar' ? `مرحباً، نتواصل معك بخصوص طلبك رقم #${order.id.split('-')[0]} من Candy Hon 🍬` : `Hello, we're contacting you regarding your order #${order.id.split('-')[0]} from Candy Hon 🍬`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center hover:scale-110 hover:shadow-md transition-all duration-200"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                  <button onClick={() => handleDeleteOrderDesktop(order.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── BottomSheet تأكيد الحذف (موبايل) ──────────────── */}
      <BottomSheet
        isOpen={!!deleteSheetId}
        onClose={() => setDeleteSheetId(null)}
        title={t.deleteConfirmTitle}
      >
        <p className="text-gray-400 text-sm text-center mb-6">{t.deleteConfirmDesc}</p>
        <button
          onClick={executeDelete}
          className="w-full bg-red-500 text-white font-black py-4 rounded-2xl text-base mb-3 active:bg-red-600 transition-colors"
        >
          {t.deleteConfirmBtn}
        </button>
        <button
          onClick={() => setDeleteSheetId(null)}
          className="w-full bg-gray-100 text-gray-500 font-bold py-3.5 rounded-2xl text-sm active:bg-gray-200 transition-colors"
        >
          {t.cancelBtn}
        </button>
      </BottomSheet>

    </div>
  );
}
