import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const maxDuration = 300; // Allow long execution for 129 images (Vercel Pro/Hobby limits apply, but it's fine for local dev)

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'algaissi1980@gmail.com';
    if (user.email !== OWNER_EMAIL && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all products with vatrin CDN links
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .like('image_url', '%cdn.vatrin.app%');

    if (fetchError) {
      throw fetchError;
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ message: 'No products need migration!' });
    }

    let successCount = 0;
    let failCount = 0;
    const totalCount = products.length;

    // We process sequentially to avoid overwhelming memory or network
    for (const product of products) {
      try {
        const url = product.image_url;
        
        // Download image
        const imageRes = await fetch(url);
        if (!imageRes.ok) throw new Error(`Failed to fetch ${url}`);
        
        const blob = await imageRes.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Extract original extension or default to jpg
        let ext = 'jpg';
        if (url.includes('.png')) ext = 'png';
        else if (url.includes('.webp')) ext = 'webp';
        
        const fileName = `migrated-${product.id}-${Date.now()}.${ext}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, buffer, {
            contentType: blob.type || 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        const newUrl = publicUrlData.publicUrl;

        // Update product in database
        const { error: updateError } = await supabase
          .from('products')
          .update({
            image_url: newUrl,
            images: [newUrl] // Simple assumption for migration
          })
          .eq('id', product.id);

        if (updateError) throw updateError;
        
        successCount++;
        
      } catch (err) {
        console.error(`Error migrating product ${product.id}:`, err);
        failCount++;
      }
    }

    return NextResponse.json({
      message: `Migration complete! Successfully migrated ${successCount} images. Failed: ${failCount}.`,
      successCount,
      failCount,
      totalCount
    });

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
