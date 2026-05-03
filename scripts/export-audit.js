const fs = require('fs');

async function exportAudit() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ghjefvviapljgwyujwak.supabase.co';
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RusBtve_7_EqSfK7Nh1YQQ_gw80wj0i'; // From the env file we saw

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name_ar, name_en, name, price, original_price, category, is_available')
    .order('category', { ascending: true })
    .order('name_ar', { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  // Create a CSV header
  // Note: Using Arabic characters, so adding BOM for Excel compatibility
  let csvContent = '\uFEFF'; 
  csvContent += "التصنيف (Category),اسم المنتج (Name),السعر (Price),متاح؟ (Available)\n";

  products.forEach(p => {
    // Escape quotes for CSV
    const name = (p.name_ar || p.name_en || p.name || 'بدون اسم').replace(/"/g, '""');
    const category = (p.category || 'عام').replace(/"/g, '""');
    const price = p.price || 0;
    const available = p.is_available ? 'نعم' : 'لا';
    
    csvContent += `"${category}","${name}",${price},"${available}"\n`;
  });

  fs.writeFileSync('products_audit.csv', csvContent, 'utf8');
  console.log(`Successfully exported ${products.length} products to products_audit.csv!`);
}

exportAudit();
