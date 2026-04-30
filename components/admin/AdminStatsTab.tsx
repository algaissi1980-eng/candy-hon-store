'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';

interface AdminStatsTabProps {
  orders: any[]; // الطلبات المحمّلة مسبقاً من لوحة الإدارة
  lang: 'ar' | 'en';
}

interface DailyStat {
  date: string;
  count: number;
  revenue: number;
}

interface TopProduct {
  name: string;
  total_qty: number;
  total_revenue: number;
}

interface PageViewRow {
  date: string;
  views: number;
}

export default function AdminStatsTab({ orders, lang }: AdminStatsTabProps) {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [pageViews, setPageViews] = useState<PageViewRow[]>([]);
  const [loadingViews, setLoadingViews] = useState(true);

  const t = {
    title: lang === 'ar' ? 'الإحصائيات 📊' : 'Statistics 📊',
    today: lang === 'ar' ? 'اليوم' : 'Today',
    thisMonth: lang === 'ar' ? 'هذا الشهر' : 'This Month',
    allTime: lang === 'ar' ? 'الإجمالي' : 'All Time',
    orders: lang === 'ar' ? 'طلبات' : 'Orders',
    revenue: lang === 'ar' ? 'إيراد (JOD)' : 'Revenue (JOD)',
    topProducts: lang === 'ar' ? 'أكثر المنتجات مبيعاً' : 'Top Selling Products',
    qty: lang === 'ar' ? 'الكمية' : 'Qty',
    statusBreakdown: lang === 'ar' ? 'توزيع الطلبات حسب الحالة' : 'Orders by Status',
    last30: lang === 'ar' ? 'المبيعات — آخر 30 يوم' : 'Sales — Last 30 Days',
    noData: lang === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet',
    jod: 'JOD',
    visitors: lang === 'ar' ? 'زيارة' : 'Visits',
    visitorsSection: lang === 'ar' ? 'الزوار — آخر 30 يوم' : 'Visitors — Last 30 Days',
    todayVisitors: lang === 'ar' ? 'زوار اليوم' : "Today's Visitors",
    monthVisitors: lang === 'ar' ? 'زوار الشهر' : 'Month Visitors',
    confirmed: lang === 'ar' ? 'مؤكد 🆕' : 'Confirmed 🆕',
    delivered: lang === 'ar' ? 'قيد المعالجة 👨‍🍳' : 'Processing 👨‍🍳',
    cancelled: lang === 'ar' ? 'مكتمل 📦' : 'Completed 📦',
  };

  // --- حساب إحصائيات من الطلبات المحمّلة ---
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const confirmedOrders = orders.filter(o => o.status !== 'cancelled');

  const todayOrders   = confirmedOrders.filter(o => o.created_at?.startsWith(todayStr));
  const monthOrders   = confirmedOrders.filter(o => o.created_at?.startsWith(monthStr));

  const sum = (arr: any[]) => arr.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  const stats = [
    {
      label: t.today,
      count: todayOrders.length,
      revenue: sum(todayOrders),
      color: 'from-amber-400 to-yellow-300',
      icon: '🌅',
    },
    {
      label: t.thisMonth,
      count: monthOrders.length,
      revenue: sum(monthOrders),
      color: 'from-[var(--gold)] to-amber-400',
      icon: '📅',
    },
    {
      label: t.allTime,
      count: confirmedOrders.length,
      revenue: sum(confirmedOrders),
      color: 'from-[var(--dark)] to-gray-700',
      icon: '📦',
    },
  ];

  // --- توزيع الحالات ---
  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-purple-100 text-purple-700 border-purple-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
  };
  const statusLabels: Record<string, string> = {
    confirmed: t.confirmed,
    processing: t.delivered,
    completed: t.cancelled,
  };
  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // --- آخر 30 يوم مبيعات (رسم بياني نصي) ---
  const last30: DailyStat[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayOrders = confirmedOrders.filter(o => o.created_at?.startsWith(ds));
    last30.push({ date: ds, count: dayOrders.length, revenue: sum(dayOrders) });
  }
  const maxRevenue = Math.max(...last30.map(d => d.revenue), 1);

  // --- إحصائيات الزوار ---
  const viewsMap: Record<string, number> = {};
  pageViews.forEach(r => { viewsMap[r.date] = r.views; });
  const todayViews = viewsMap[todayStr] || 0;
  const monthViews = pageViews
    .filter(r => r.date.startsWith(monthStr))
    .reduce((acc, r) => acc + r.views, 0);
  const maxViews = Math.max(...last30.map(d => viewsMap[d.date] || 0), 1);

  // --- جلب أكثر المنتجات مبيعاً من order_items ---
  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from('order_items')
        .select('quantity, price, products(name)');

      if (!data) { setLoadingProducts(false); return; }

      const map: Record<string, TopProduct> = {};
      data.forEach((item: any) => {
        const name = item.products?.name || 'Unknown';
        if (!map[name]) map[name] = { name, total_qty: 0, total_revenue: 0 };
        map[name].total_qty     += Number(item.quantity) || 0;
        map[name].total_revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
      });

      const sorted = Object.values(map)
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 5);

      setTopProducts(sorted);
      setLoadingProducts(false);
    };

    fetchTopProducts();
  }, []);

  // --- جلب بيانات الزوار ---
  useEffect(() => {
    const fetchPageViews = async () => {
      setLoadingViews(true);
      // آخر 30 يوم
      const from = new Date();
      from.setDate(from.getDate() - 29);
      const fromStr = from.toISOString().split('T')[0];

      const { data } = await supabase
        .from('page_views')
        .select('date, views')
        .gte('date', fromStr)
        .order('date', { ascending: true });

      if (data) setPageViews(data);
      setLoadingViews(false);
    };
    fetchPageViews();
  }, []);

  const formatDate = (ds: string) => {
    const [, m, d] = ds.split('-');
    return `${d}/${m}`;
  };

  return (
    <div className="space-y-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* ===== بطاقات الملخص ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div
            key={s.label}
            className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-md`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold opacity-80">{s.label}</span>
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="text-3xl font-black mb-1">{s.count} <span className="text-base font-bold opacity-80">{t.orders}</span></p>
            <p className="text-lg font-bold opacity-90">{s.revenue.toFixed(2)} <span className="text-sm">{t.jod}</span></p>
          </div>
        ))}
      </div>

      {/* ===== بطاقات الزوار ===== */}
      <div>
        <h2 className="text-base font-black text-[var(--dark)] mb-4">{t.visitorsSection}</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-[var(--text-muted)] mb-1">{t.todayVisitors}</p>
            <p className="text-3xl font-black text-[var(--dark)]">
              {loadingViews ? <span className="text-lg text-gray-300">...</span> : todayViews}
            </p>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-1">{t.visitors}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-[var(--text-muted)] mb-1">{t.monthVisitors}</p>
            <p className="text-3xl font-black text-[var(--dark)]">
              {loadingViews ? <span className="text-lg text-gray-300">...</span> : monthViews}
            </p>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-1">{t.visitors}</p>
          </div>
        </div>

        {/* رسم بياني للزوار */}
        {!loadingViews && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 overflow-x-auto">
            <div className="flex items-end gap-1 h-24 min-w-[600px]">
              {last30.map((d) => {
                const views = viewsMap[d.date] || 0;
                const heightPct = maxViews > 0 ? (views / maxViews) * 100 : 0;
                const isToday = d.date === todayStr;
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1 group relative">
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[var(--dark)] text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {formatDate(d.date)}: {views} {t.visitors}
                    </div>
                    <div className="w-full flex items-end justify-center h-20">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${isToday ? 'bg-emerald-500' : 'bg-emerald-400/30 group-hover:bg-emerald-400/70'}`}
                        style={{ height: `${Math.max(heightPct, views > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    {[0, 6, 13, 20, 27, 29].includes(last30.indexOf(d)) && (
                      <span className="text-[9px] text-[var(--text-muted)] font-bold">{formatDate(d.date)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== توزيع الحالات ===== */}
      <div>
        <h2 className="text-base font-black text-[var(--dark)] mb-4">{t.statusBreakdown}</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div
              key={key}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm ${statusColors[key] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
            >
              <span className="text-xl font-black">{statusCounts[key] || 0}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== رسم بياني — آخر 30 يوم ===== */}
      <div>
        <h2 className="text-base font-black text-[var(--dark)] mb-4">{t.last30}</h2>
        {confirmedOrders.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm font-bold">{t.noData}</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 overflow-x-auto">
            <div className="flex items-end gap-1 h-32 min-w-[600px]">
              {last30.map((d) => {
                const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                const isToday = d.date === todayStr;
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[var(--dark)] text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {formatDate(d.date)}: {d.revenue.toFixed(2)} JOD ({d.count})
                    </div>
                    {/* العمود */}
                    <div className="w-full flex items-end justify-center h-24">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${isToday ? 'bg-[var(--gold)]' : 'bg-[var(--gold)]/30 group-hover:bg-[var(--gold)]/70'}`}
                        style={{ height: `${Math.max(heightPct, d.revenue > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    {/* التاريخ */}
                    {[0, 6, 13, 20, 27, 29].includes(last30.indexOf(d)) && (
                      <span className="text-[9px] text-[var(--text-muted)] font-bold">{formatDate(d.date)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== أكثر المنتجات مبيعاً ===== */}
      <div>
        <h2 className="text-base font-black text-[var(--dark)] mb-4">{t.topProducts}</h2>
        {loadingProducts ? (
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm font-bold">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[var(--gold)] rounded-full animate-spin" />
            {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : topProducts.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm font-bold">{t.noData}</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {topProducts.map((p, i) => {
              const maxQty = topProducts[0]?.total_qty || 1;
              const barWidth = Math.round((p.total_qty / maxQty) * 100);
              return (
                <div
                  key={p.name}
                  className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-[var(--cream)] transition-colors"
                >
                  <span className="text-lg font-black text-[var(--text-muted)] w-5 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[var(--dark)] truncate">{p.name}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--gold)] to-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-black text-sm text-[var(--dark)]">{p.total_qty} <span className="font-bold text-[var(--text-muted)] text-xs">{t.qty}</span></p>
                    <p className="text-xs text-[var(--text-muted)] font-bold">{p.total_revenue.toFixed(2)} JOD</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
