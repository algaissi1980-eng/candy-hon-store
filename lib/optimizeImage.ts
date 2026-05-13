/**
 * 🖼️ وسيط تحسين الصور — يمرّر صور Supabase Storage عبر CDN مجاني
 * 
 * بدلاً من أن كل زائر يحمّل الصورة مباشرة من Supabase (ويستهلك الباندويث)،
 * نمرّرها عبر wsrv.nl (CDN مجاني) الذي:
 * 1. يحمّل الصورة من Supabase مرة واحدة فقط
 * 2. يحوّلها لـ WebP ويصغّر حجمها
 * 3. يخزّنها في الكاش ويوزّعها على كل الزوار مجاناً
 * 
 * يعمل أيضاً مع روابط cdn.vatrin.app 
 */

const PROXY_BASE = 'https://images.weserv.nl/';

/**
 * تحويل رابط الصورة لرابط محسّن عبر CDN
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  options?: {
    width?: number;
    quality?: number;
  }
): string {
  if (!url) return '';

  // نحسّن روابط Supabase Storage و vatrin CDN
  const isSupabase = url.includes('supabase.co/storage') || url.includes('supabase.in/storage');
  const isVatrin = url.includes('cdn.vatrin.app');
  
  if (!isSupabase && !isVatrin) return url;

  const w = options?.width ?? 800;
  const q = options?.quality ?? 80;

  return `${PROXY_BASE}?url=${encodeURIComponent(url)}&w=${w}&q=${q}&output=webp&default=placeholder`;
}

/** صور البطاقات — أصغر */
export function optimizeCardImage(url: string | null | undefined): string {
  return optimizeImageUrl(url, { width: 600, quality: 75 });
}

/** صورة المنتج الكاملة */
export function optimizeFullImage(url: string | null | undefined): string {
  return optimizeImageUrl(url, { width: 1200, quality: 82 });
}

/** صور مصغّرة — في السلة والطلبات */
export function optimizeThumbnail(url: string | null | undefined): string {
  return optimizeImageUrl(url, { width: 150, quality: 70 });
}
