/**
 * 🗜️ سكريبت لمرة واحدة — يُعيد ضغط كل صور المنتجات الموجودة في Supabase Storage
 * 
 * الاستخدام:
 *   node scripts/recompress-images.mjs
 * 
 * ماذا يفعل:
 * 1. يجلب كل المنتجات التي لها صور في Supabase Storage
 * 2. يحمّل كل صورة → يضغطها بـ sharp → يرفعها كـ WebP
 * 3. يحدّث الرابط في قاعدة البيانات
 * 
 * ⚠️ تحتاج SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف .env.local
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// قراءة بيانات Supabase من .env.local
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const vars = {};
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      vars[key.trim()] = valueParts.join('=').trim();
    }
  }
  return vars;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('   Add SUPABASE_SERVICE_ROLE_KEY=your_key to .env.local');
  console.error('   (Find it in Supabase Dashboard → Settings → API → service_role key)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const BUCKET = 'product-images';

async function main() {
  console.log('📦 Fetching products with Supabase Storage images...\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name_ar, image_url, images');

  if (error) { console.error('❌ DB Error:', error.message); process.exit(1); }

  // فلترة المنتجات التي لها صور في Supabase Storage فقط
  const storageProducts = products.filter(p =>
    (p.image_url && p.image_url.includes('supabase.co/storage')) ||
    (p.images && p.images.some(url => url.includes('supabase.co/storage')))
  );

  console.log(`Found ${storageProducts.length} products with Supabase Storage images\n`);

  let compressed = 0;
  let skipped = 0;
  let totalSaved = 0;

  for (const product of storageProducts) {
    const allUrls = product.images?.length > 0 ? product.images : (product.image_url ? [product.image_url] : []);
    const newUrls = [];

    for (const url of allUrls) {
      // تخطي الصور التي ليست في Supabase Storage
      if (!url.includes('supabase.co/storage')) {
        newUrls.push(url);
        continue;
      }

      // تخطي الصور المضغوطة سابقاً (WebP)
      if (url.endsWith('.webp')) {
        newUrls.push(url);
        skipped++;
        continue;
      }

      try {
        // تحميل الصورة
        const response = await fetch(url);
        if (!response.ok) { newUrls.push(url); skipped++; continue; }

        const buffer = Buffer.from(await response.arrayBuffer());
        const originalSize = buffer.length;

        // ضغط بـ sharp → WebP
        const compressedBuffer = await sharp(buffer)
          .resize(1200, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const newSize = compressedBuffer.length;
        const saved = originalSize - newSize;
        totalSaved += saved;

        // رفع النسخة المضغوطة
        const newFileName = `compressed-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(newFileName, compressedBuffer, { contentType: 'image/webp' });

        if (uploadError) {
          console.log(`  ⚠️ Upload failed for ${product.name_ar}: ${uploadError.message}`);
          newUrls.push(url);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(newFileName);
        newUrls.push(publicUrlData.publicUrl);
        compressed++;

        console.log(`  ✅ ${product.name_ar}: ${(originalSize/1024).toFixed(0)}KB → ${(newSize/1024).toFixed(0)}KB (saved ${(saved/1024).toFixed(0)}KB)`);
      } catch (err) {
        console.log(`  ⚠️ Error processing image for ${product.name_ar}: ${err.message}`);
        newUrls.push(url);
      }
    }

    // تحديث قاعدة البيانات بالروابط الجديدة
    if (newUrls.some((url, i) => url !== allUrls[i])) {
      const updateData = {
        image_url: newUrls[0] || null,
        images: newUrls,
      };
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (updateError) {
        console.log(`  ⚠️ DB update failed for ${product.name_ar}: ${updateError.message}`);
      }
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🎉 Done!`);
  console.log(`   Compressed: ${compressed} images`);
  console.log(`   Skipped: ${skipped} images (already WebP or non-Supabase)`);
  console.log(`   Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
  console.log(`${'═'.repeat(50)}`);
}

main().catch(console.error);
