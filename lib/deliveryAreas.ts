// =============================================
// Candy Hon — مناطق وأسعار التوصيل
// (Delivery Zones & Fees)
// =============================================

export interface DeliveryZone {
  id: string;
  name_ar: string;
  name_en: string;
  fee: number;
  cities: DeliveryCity[];
}

export interface DeliveryCity {
  id: string;
  name_ar: string;
  name_en: string;
}

// ====== المنطقة A — رسوم 3 دنانير ======
const ZONE_A_CITIES: DeliveryCity[] = [
  { id: 'amman', name_ar: 'عمّان', name_en: 'Amman' },
  { id: 'irbid', name_ar: 'إربد', name_en: 'Irbid' },
  { id: 'zarqa', name_ar: 'الزرقاء', name_en: 'Zarqa' },
  { id: 'jerash', name_ar: 'جرش', name_en: 'Jerash' },
];

// ====== المنطقة B — رسوم 5 دنانير ======
const ZONE_B_CITIES: DeliveryCity[] = [
  { id: 'aqaba', name_ar: 'العقبة', name_en: 'Aqaba' },
  { id: 'maan', name_ar: 'معان', name_en: "Ma'an" },
  { id: 'madaba', name_ar: 'مادبا', name_en: 'Madaba' },
  { id: 'mafraq', name_ar: 'المفرق', name_en: 'Mafraq' },
  { id: 'karak', name_ar: 'الكرك', name_en: 'Karak' },
];

// ====== المناطق الكاملة ======
export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone_a',
    name_ar: 'توصيل — 3 دنانير',
    name_en: 'Delivery — 3 JOD',
    fee: 3,
    cities: ZONE_A_CITIES,
  },
  {
    id: 'zone_b',
    name_ar: 'توصيل — 5 دنانير',
    name_en: 'Delivery — 5 JOD',
    fee: 5,
    cities: ZONE_B_CITIES,
  },
];

// ====== كل المدن بقائمة مسطّحة ======
export const ALL_CITIES: DeliveryCity[] = [
  ...ZONE_A_CITIES,
  ...ZONE_B_CITIES,
];

// ====== دالة حساب رسوم التوصيل حسب الـ city id ======
export function getDeliveryFee(cityId: string): number | null {
  for (const zone of DELIVERY_ZONES) {
    if (zone.cities.some(c => c.id === cityId)) {
      return zone.fee;
    }
  }
  return null; // المدينة غير مغطاة
}

// ====== دالة جلب اسم المدينة حسب الـ id واللغة ======
export function getCityName(cityId: string, lang: 'ar' | 'en'): string {
  const city = ALL_CITIES.find(c => c.id === cityId);
  if (!city) return cityId;
  return lang === 'ar' ? city.name_ar : city.name_en;
}

// ====== دالة حساب رسوم التوصيل الفعلية (بعد تطبيق عرض الـ 30 JOD) ======
// إذا كان مجموع المنتجات >= 30 JOD:
//   — المنطقة A (3 JOD) → مجاني (0 JOD)
//   — المنطقة B (5 JOD) → 1 JOD
export function getEffectiveDeliveryFee(cityId: string, subtotal: number): number | null {
  const baseFee = getDeliveryFee(cityId);
  if (baseFee === null) return null;
  if (subtotal >= 30) {
    if (baseFee === 3) return 0;
    if (baseFee === 5) return 1;
  }
  return baseFee;
}

// ====== هل يستحق الطلب خصم التوصيل؟ ======
export function hasDeliveryDiscount(cityId: string, subtotal: number): boolean {
  const baseFee = getDeliveryFee(cityId);
  if (baseFee === null || subtotal < 30) return false;
  return baseFee === 3 || baseFee === 5;
}
