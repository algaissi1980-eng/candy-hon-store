// =============================================
// أنواع البيانات المركزية — Candy Hon
// (Central Type Definitions)
// =============================================

// 🟢 المنتج (Product)
export interface Product {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  description: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  images?: string[];
  is_available: boolean;
  category: string;
  stock: number;
  allow_preorder: boolean;
  restock_date?: string | null;
  created_at: string;
}

// 🟢 الطلب (Order) — بدون نظام إيصالات أو عربون
export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city?: string | null;
  delivery_fee?: number | null;
  total_amount: number;
  status: OrderStatus;
  notes?: string | null;
  created_at: string;
  order_items: OrderItem[];
}

// 🟢 حالات الطلب (Order Status)
export type OrderStatus = 'confirmed' | 'processing' | 'completed';

// 🟢 عنصر في الطلب (Order Item)
export interface OrderItem {
  id?: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  note?: string | null;
  is_preorder?: boolean;
  products?: { name: string; image_url?: string };
}

// 🟢 عنصر في السلة (Cart Item)
export interface CartItem {
  id: string;
  cartItemId: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  stock?: number;
  note?: string;
  is_preorder?: boolean;
  restock_date?: string | null;
}

// 🟢 متجر السلة (Cart Store)
export interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  toggleCart: () => void;
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
}

// 🟢 متجر اللغة (Language Store)
export interface LanguageStore {
  lang: 'ar' | 'en';
  toggleLanguage: () => void;
}

// 🟢 المدير (Admin)
export interface Admin {
  id?: string;
  email: string;
  created_at?: string;
}

// 🟢 إعدادات المتجر (Store Settings)
export interface StoreSettings {
  id: number;
  categories: string[];
  announcement_text_ar?: string;
  announcement_text_en?: string;
}

// 🟢 عنصر تعديل الطلب (Editing Item)
export interface EditingOrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  original_quantity: number;
  note?: string | null;
}

// 🟢 نموذج إضافة/تعديل المنتج (Product Form)
export interface ProductFormData {
  id: string;
  name: string;
  description: string;
  price: string;
  original_price: string;
  image_url: string;
  images: string[];
  is_available: boolean;
  category: string;
  stock: number;
  allow_preorder: boolean;
  restock_date: string;
}
