'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguageStore } from '../../store/languageStore';
import AdminOrdersTab from '../../components/admin/AdminOrdersTab';
import AdminProductsTab from '../../components/admin/AdminProductsTab';
import AdminSettingsTab, { type StoreSettings } from '../../components/admin/AdminSettingsTab';
import AdminAdminsTab from '../../components/admin/AdminAdminsTab';
import AdminStatsTab from '../../components/admin/AdminStatsTab';
import { Suspense } from 'react';

type TabType = 'orders' | 'products' | 'stats' | 'settings' | 'admins';

function AdminDashboardContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  // نقرأ الـ tab من الـ URL — لو ما في نرجع orders
  const tabFromUrl = (searchParams.get('tab') as TabType) || 'orders';
  const validTabs: TabType[] = ['orders', 'products', 'stats', 'settings', 'admins'];
  const activeTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'orders';

  // عند تغيير الـ tab نحدث الـ URL مباشرة
  const setActiveTab = useCallback((tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['حلويات قطنية 🍬', 'نكهات مختلفة 🌈', 'هدايا خاصة 🎁', 'مجموعات متنوعة 🎉']);
  const [settings, setSettings] = useState<StoreSettings>({
    announcement_text_ar: '',
    announcement_text_en: '',
  });
  const [adminsList, setAdminsList] = useState<any[]>([]);

  const { lang, toggleLanguage } = useLanguageStore();

  useEffect(() => { checkAdminAccess(); }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const orderSubscription = supabase
      .channel('realtime-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      }).subscribe();
    return () => { supabase.removeChannel(orderSubscription); };
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) { router.push('/'); return; }
    // نستخدم RPC بدل query مباشر عشان نتجاوز RLS
    const { data: admin } = await supabase.rpc('is_admin');
    if (!admin) { router.push('/'); return; }
    setIsAdmin(true);
    setCurrentUserEmail(user.email);
    fetchOrders(); fetchProducts(); fetchSettings(); fetchAdminsList();
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, customer_name, customer_phone, delivery_address, delivery_city, delivery_fee, order_items(product_id, quantity, price, note, products(name))')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (data) {
      setSettings({
        announcement_text_ar: data.announcement_text_ar || '',
        announcement_text_en: data.announcement_text_en || '',
      });
      if (data.categories) setCategories(data.categories);
    }
  };

  const fetchAdminsList = async () => {
    // نستخدم RPC عشان نتجاوز RLS
    const { data } = await supabase.rpc('get_admins_list');
    if (data) {
      setAdminsList(data);
    } else {
      // fallback: لو الـ RPC مو موجودة، نضيف المالك يدوياً على الأقل
      const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'algaissi1980@gmail.com';
      setAdminsList([{ email: ownerEmail, created_at: new Date().toISOString() }]);
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const t = {
    loading: lang === 'ar' ? 'جاري التحميل...' : 'Loading...',
    title: lang === 'ar' ? 'لوحة الإدارة 👑' : 'Admin Dashboard 👑',
    tabs: {
      orders:   lang === 'ar' ? 'الطلبات' : 'Orders',
      products: lang === 'ar' ? 'المنتجات' : 'Products',
      stats:    lang === 'ar' ? 'الإحصائيات 📊' : 'Statistics 📊',
      settings: lang === 'ar' ? 'الإعدادات ⚙️' : 'Settings ⚙️',
      admins:   lang === 'ar' ? 'المدراء 👥' : 'Admins 👥'
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-bold bg-[var(--cream)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        <span>{t.loading}</span>
      </div>
    </div>
  );
  if (!isAdmin) return null;

  return (
    <main className="p-6 pt-32 md:p-12 max-w-7xl mx-auto font-sans min-h-screen bg-[var(--cream)]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="h-32 md:h-40 w-full shrink-0"></div>

      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-gray-200 pb-0 mb-10 gap-4">
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4 pb-4">
          <h1 className="text-3xl font-black text-black">{t.title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors border border-gray-200 flex items-center gap-2 shadow-sm"
            >
              <span>🌐</span> {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <button
              onClick={handleAdminLogout}
              className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors border border-red-100 flex items-center gap-2 shadow-sm"
            >
              <span>🚪</span> {lang === 'ar' ? 'خروج' : 'Logout'}
            </button>
          </div>
        </div>

        <div className="flex gap-6 sm:gap-8 text-sm font-bold text-gray-400 overflow-x-auto w-full sm:w-auto hide-scrollbar">
          {(['orders', 'products', 'stats', 'settings', 'admins'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-black text-black' : 'border-transparent hover:text-gray-700'}`}
            >
              {t.tabs[tab]}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'orders' && (
        <AdminOrdersTab orders={orders} products={products} lang={lang} fetchOrders={fetchOrders} />
      )}
      {activeTab === 'products' && (
        <AdminProductsTab products={products} categories={categories} lang={lang} fetchProducts={fetchProducts} />
      )}
      {activeTab === 'settings' && (
        <AdminSettingsTab settings={settings} categories={categories} products={products} lang={lang} setSettings={setSettings} setCategories={setCategories} />
      )}
      {activeTab === 'stats' && (
        <AdminStatsTab orders={orders} lang={lang} />
      )}
      {activeTab === 'admins' && (
        <AdminAdminsTab adminsList={adminsList} currentUserEmail={currentUserEmail} lang={lang} fetchAdminsList={fetchAdminsList} />
      )}
    </main>
  );
}

// Suspense مطلوب لأن useSearchParams يحتاجه Next.js
export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}