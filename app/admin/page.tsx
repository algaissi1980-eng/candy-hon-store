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
import AdminPromoTab from '../../components/admin/AdminPromoTab';
import AdminOffersTab from '../../components/admin/AdminOffersTab';
import { Suspense } from 'react';

type TabType = 'orders' | 'products' | 'stats' | 'settings' | 'admins' | 'promo' | 'offers';

function AdminDashboardContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  // نقرأ الـ tab من الـ URL — لو ما في نرجع orders
  const tabFromUrl = (searchParams.get('tab') as TabType) || 'orders';
  const validTabs: TabType[] = ['orders', 'products', 'stats', 'settings', 'admins', 'promo', 'offers'];
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

    const productSubscription = supabase
      .channel('realtime-products-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      }).subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
      supabase.removeChannel(productSubscription);
    };
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
      .select('id, total_amount, status, created_at, customer_name, customer_phone, delivery_address, delivery_city, delivery_fee, order_items(product_id, quantity, price, note, is_preorder, products(name))')
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
      admins:   lang === 'ar' ? 'المدراء 👥' : 'Admins 👥',
      promo:    lang === 'ar' ? 'الكودات 🏷️' : 'Promo 🏷️',
      offers:   lang === 'ar' ? 'العروض 🎉' : 'Offers 🎉'
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
    <main className="p-6 pt-8 md:p-12 max-w-7xl mx-auto font-sans min-h-screen bg-[var(--cream)]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

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

        {/* تبويبات الديسك توب — مخفية على الموبايل */}
        <div className="hidden md:flex gap-6 sm:gap-8 text-sm font-bold text-gray-400 overflow-x-auto w-full sm:w-auto hide-scrollbar">
          {(['orders', 'products', 'stats', 'settings', 'admins', 'promo', 'offers'] as const).map(tab => (
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

      {/* المحتوى — مع padding سفلي للموبايل يحمي من Bottom Nav */}
      <div className="pb-24 md:pb-0">
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
        {activeTab === 'promo' && (
          <AdminPromoTab lang={lang} />
        )}
        {activeTab === 'offers' && (
          <AdminOffersTab lang={lang} />
        )}
        {activeTab === 'admins' && (
          <AdminAdminsTab adminsList={adminsList} currentUserEmail={currentUserEmail} lang={lang} fetchAdminsList={fetchAdminsList} />
        )}
      </div>

      {/* ─── Bottom Navigation Bar — موبايل فقط ──────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 md:hidden flex items-center justify-around py-2 shadow-lg">
        {([
          { tab: 'orders',   icon: '🧾', labelAr: 'الطلبات',    labelEn: 'Orders'   },
          { tab: 'products', icon: '🍬', labelAr: 'المنتجات',   labelEn: 'Products' },
          { tab: 'stats',    icon: '📊', labelAr: 'إحصائيات',   labelEn: 'Stats'    },
          { tab: 'settings', icon: '⚙️', labelAr: 'إعدادات',    labelEn: 'Settings' },
          { tab: 'admins',   icon: '👥', labelAr: 'المدراء',     labelEn: 'Admins'   },
          { tab: 'promo',    icon: '🏷️', labelAr: 'الكودات',    labelEn: 'Promo'    },
          { tab: 'offers',   icon: '🎉', labelAr: 'العروض',     labelEn: 'Offers'   },
        ] as const).map(({ tab, icon, labelAr, labelEn }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all relative"
            >
              {/* نقطة الإشعار للطلبات الجديدة */}
              {tab === 'orders' && orders.filter(o => o.status === 'confirmed').length > 0 && (
                <span className="absolute -top-0.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                  {orders.filter(o => o.status === 'confirmed').length}
                </span>
              )}
              <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100 opacity-50'}`}>
                {icon}
              </span>
              <span className={`text-[9px] font-black transition-colors ${isActive ? 'text-black' : 'text-gray-400'}`}>
                {lang === 'ar' ? labelAr : labelEn}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 bg-black rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </main>
  );
}

// Suspense مطلوب لأن useSearchParams يحتاجه Next.js
export default function AdminDashboard() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardContent />
    </Suspense>
  );
}
