const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/vatrin_products.json', 'utf8'));

let sql = `-- =============================================\n`;
sql += `-- Candy Hon - Data Migration from Vatrin\n`;
sql += `-- =============================================\n\n`;
sql += `INSERT INTO products (name, name_ar, price, image_url, images, is_available, category, stock, allow_preorder) VALUES\n`;

const values = data.map(product => {
  // Replace single quotes with two single quotes for SQL escaping
  const name = product.name.replace(/'/g, "''");
  const price = product.price;
  const image_url = product.image_url;
  
  // Category logic: Try to guess category based on name, otherwise default
  let category = 'منتجات منقولة';
  if (name.includes('كاندي') || name.includes('جيلي')) category = 'حلويات قطنية 🍬';
  else if (name.includes('نودلز') || name.includes('هوت بوت') || name.includes('توفو')) category = 'نكهات مختلفة 🌈';
  else if (name.includes('عصير') || name.includes('مشروب') || name.includes('قهوة')) category = 'مشروبات يابانية 🥤';
  else if (name.includes('شبس') || name.includes('سناك') || name.includes('مقرمشات') || name.includes('بسكويت') || name.includes('كيك')) category = 'سناكات 🍿';
  
  return `('${name}', '${name}', ${price}, '${image_url}', ARRAY['${image_url}'], true, '${category}', 20, false)`;
});

sql += values.join(',\n') + ';\n';

fs.writeFileSync('scripts/import_products.sql', sql);
console.log("Generated import_products.sql successfully with " + data.length + " products!");
