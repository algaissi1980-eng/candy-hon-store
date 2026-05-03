const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/vatrin_products_new.json', 'utf8'));

let sql = `-- =============================================\n`;
sql += `-- Candy Hon - Data Migration (Smart Merge)\n`;
sql += `-- =============================================\n\n`;
sql += `INSERT INTO products (name, name_ar, price, original_price, image_url, images, is_available, category, stock, allow_preorder)\n`;
sql += `SELECT t.* FROM (\n`;

const values = data.map(product => {
  // Replace single quotes with two single quotes for SQL escaping
  const nameRaw = product.name.replace(/'/g, "''");
  
  // Fix weird parsed prices like "450" when it should be "4.5"
  let price = product.price;
  if (nameRaw.includes("500مل") && price === 500) price = 5;
  if (nameRaw.includes("450مل") && price === 450) price = 4.5;
  
  // Clean names (remove "XX% OFF" if possible)
  let name = nameRaw;
  let originalPrice = "NULL";
  if (nameRaw.match(/^\d+% OFF$/)) {
     // If the name is literally just "11% OFF", we have an issue.
     // We will just keep it as is, the admin can fix the name later in the UI.
     name = nameRaw + " Product";
  }

  const image_url = product.image_url;
  
  // Category logic: Try to guess category based on name, otherwise default
  let category = 'عام';
  if (name.includes('كاندي') || name.includes('جيلي') || name.includes('مارشميلو') || name.includes('ميرانق')) category = 'حلويات قطنية 🍬';
  else if (name.includes('نودلز') || name.includes('هوت بوت') || name.includes('توفو') || name.includes('دكبوكي') || name.includes('توبوكي')) category = 'نكهات مختلفة 🌈';
  else if (name.includes('عصير') || name.includes('مشروب') || name.includes('قهوة') || name.includes('شاي') || name.includes('tea') || name.includes('soda')) category = 'مشروبات يابانية 🥤';
  else if (name.includes('شبس') || name.includes('سناك') || name.includes('مقرمشات') || name.includes('بسكويت') || name.includes('كيك') || name.includes('تارت')) category = 'سناكات 🍿';
  
  return `  SELECT '${name}'::text, '${name}'::text, ${price}::numeric, ${originalPrice}::numeric, '${image_url}'::text, ARRAY['${image_url}']::text[], true::boolean, '${category}'::text, 20::int, false::boolean`;
});

sql += values.join('\n  UNION ALL\n');
sql += `\n) AS t(name, name_ar, price, original_price, image_url, images, is_available, category, stock, allow_preorder)\n`;
sql += `WHERE NOT EXISTS (\n`;
sql += `  SELECT 1 FROM products p \n`;
sql += `  WHERE p.name_ar = t.name_ar \n`;
sql += `     OR p.name = t.name \n`;
sql += `);\n`;

fs.writeFileSync('scripts/import_missing_products.sql', sql);
console.log("Generated import_missing_products.sql successfully with " + data.length + " products!");
