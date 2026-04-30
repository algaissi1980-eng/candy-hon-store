-- =============================================
-- Candy Hon — Supabase Database Schema
-- =============================================

-- 1. جدول المنتجات (Products)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'عام',
  stock INTEGER DEFAULT 0,
  allow_preorder BOOLEAN DEFAULT false,
  restock_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. جدول الطلبات (Orders)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'processing', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. جدول عناصر الطلب (Order Items)
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  note TEXT,
  is_preorder BOOLEAN DEFAULT false
);

-- 4. جدول المدراء (Admins)
CREATE TABLE admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. جدول إعدادات المتجر (Store Settings)
CREATE TABLE store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  categories TEXT[] DEFAULT ARRAY['حلويات قطنية 🍬', 'نكهات مختلفة 🌈', 'هدايا خاصة 🎁', 'مجموعات متنوعة 🎉'],
  announcement_text_ar TEXT DEFAULT '',
  announcement_text_en TEXT DEFAULT ''
);

-- 6. جدول عدد الزيارات (Page Views)
CREATE TABLE page_views (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0
);

-- =============================================
-- إدراج البيانات الأولية (Seed Data)
-- =============================================

-- إدراج إعدادات المتجر الافتراضية
INSERT INTO store_settings (id, categories)
VALUES (1, ARRAY['حلويات قطنية 🍬', 'نكهات مختلفة 🌈', 'هدايا خاصة 🎁', 'مجموعات متنوعة 🎉'])
ON CONFLICT (id) DO NOTHING;

-- إضافة المدير الأول
INSERT INTO admins (email) VALUES ('algaissi1980@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- RPC Functions
-- =============================================

-- دالة خصم المخزون عند الشراء
CREATE OR REPLACE FUNCTION handle_checkout_inventory(p_items JSONB)
RETURNS VOID AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE products
    SET stock = stock - (item->>'quantity')::int
    WHERE id = (item->>'product_id')::uuid
    AND stock >= (item->>'quantity')::int;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', item->>'product_id';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة زيادة عداد الزيارات
CREATE OR REPLACE FUNCTION increment_page_views(view_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO page_views (date, views) VALUES (view_date, 1)
  ON CONFLICT (date) DO UPDATE SET views = page_views.views + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة للتحقق إذا كان المستخدم مديراً (تتجاوز RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لجلب قائمة المدراء (تتجاوز RLS)
CREATE OR REPLACE FUNCTION get_admins_list()
RETURNS JSONB AS $$
BEGIN
  RETURN (SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]'::jsonb) FROM admins a);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- المنتجات: الكل يقدر يقرأ
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are manageable by admins" ON products FOR ALL USING ( is_admin() );

-- الطلبات: الزبون يشوف طلباته فقط
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING ( is_admin() );

-- عناصر الطلب
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert order items" ON order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING ( is_admin() );

-- المدراء: الكل يقرأ لمعرفة المدراء (يمنع الـ Infinite Recursion)، والمدراء فقط يديرون
CREATE POLICY "Admins are viewable by everyone" ON admins FOR SELECT USING (true);
CREATE POLICY "Admins can manage admins" ON admins FOR ALL USING ( is_admin() );

-- إعدادات المتجر: الكل يقرأ، المدراء يعدلون
CREATE POLICY "Settings are viewable by everyone" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Settings are manageable by admins" ON store_settings FOR ALL USING ( is_admin() );

-- عداد الزيارات: الكل يقدر يزيد
CREATE POLICY "Anyone can increment views" ON page_views FOR ALL USING (true);
