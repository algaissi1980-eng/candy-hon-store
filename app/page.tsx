import HomeClient from '../components/HomeClient';

// =============================================
// الصفحة الرئيسية — Server Component
//
// نجلب أول صفحة منتجات على السيرفر عبر PostgREST
// مع Data Cache (revalidate) فيصل الكتالوج مع الـ HTML:
// - أسرع First Paint على شبكات 4G البطيئة
// - المحتوى يظهر حتى لو فشل تنفيذ JS (WebView قديم
//   داخل Instagram/Facebook — سبب "الصفحة البيضاء/السوداء")
// - طلب واحد مخزّن للجميع بدل استعلام Supabase من كل زائر
//
// إذا فشل الجلب نمرر مصفوفة فارغة و HomeClient
// يجلب من المتصفح كالسابق (نفس السلوك القديم كـ fallback)
// =============================================

const PAGE_SIZE = 24;

const PRODUCT_SELECT =
  'id,name,name_ar,name_en,description,price,original_price,image_url,images,is_available,category,stock,allow_preorder,restock_date';

async function getInitialData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { products: [], categories: [], hasMore: true };
  }

  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

  try {
    const [productsRes, settingsRes] = await Promise.all([
      // نجلب PAGE_SIZE + 1 لنعرف إذا فيه صفحة تالية (نفس منطق productStore)
      fetch(
        `${url}/rest/v1/products?select=${PRODUCT_SELECT}&order=created_at.desc,id.asc&limit=${PAGE_SIZE + 1}`,
        { headers, next: { revalidate: 60 } }
      ),
      fetch(
        `${url}/rest/v1/store_settings?select=categories&id=eq.1`,
        { headers, next: { revalidate: 300 } }
      ),
    ]);

    if (!productsRes.ok) throw new Error(`products fetch failed: ${productsRes.status}`);

    let products: any[] = await productsRes.json();
    const hasMore = products.length > PAGE_SIZE;
    if (hasMore) products = products.slice(0, PAGE_SIZE);

    let categories: string[] = [];
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      categories = settings?.[0]?.categories || [];
    }

    return { products, categories, hasMore };
  } catch (err) {
    console.error('[Home SSR] Failed to fetch initial data:', err);
    return { products: [], categories: [], hasMore: true };
  }
}

export default async function Home() {
  const { products, categories, hasMore } = await getInitialData();

  return (
    <HomeClient
      initialProducts={products}
      initialCategories={categories}
      initialHasMore={hasMore}
    />
  );
}
