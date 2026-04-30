// =============================================
// preorderUtils — حساب الأيام المتبقية للتوفر
// تُستخدم في كل مكان يعرض رسالة "يتوفر خلال X يوم"
// =============================================

/**
 * يحسب عدد الأيام المتبقية من اليوم حتى restock_date.
 * - يعيد null إذا لم يُحدَّد تاريخ.
 * - يعيد 0 إذا كان التاريخ قد مرّ (المنتج جاهز أو تأخّر).
 */
export function getDaysUntilRestock(
  restockDate: string | null | undefined
): number | null {
  if (!restockDate) return null;

  // نحسب بداية اليوم الحالي بتوقيت المتصفح/السيرفر (منتصف الليل)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(restockDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * يولّد نص "يتوفر خلال X يوم" حسب اللغة.
 * يعيد null إذا لم يكن هناك تاريخ أو إذا كان العدد صفراً.
 */
export function getRestockMessage(
  restockDate: string | null | undefined,
  lang: 'ar' | 'en'
): string | null {
  const days = getDaysUntilRestock(restockDate);
  if (days === null || days === 0) return null;
  return lang === 'ar'
    ? `📦 يتوفر خلال ${days} ${days === 1 ? 'يوم' : 'أيام'} تقريباً`
    : `📦 Ships in ~${days} ${days === 1 ? 'day' : 'days'}`;
}

/**
 * يعيد اليوم الحالي بصيغة YYYY-MM-DD (للـ min في Date Picker).
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}
