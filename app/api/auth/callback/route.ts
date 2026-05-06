import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // إنشاء Response مبدئي — سنضيف عليه الـ Cookies لاحقاً
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // قراءة الـ Cookies من الطلب الوارد
            const cookieHeader = request.headers.get('cookie') ?? '';
            return cookieHeader.split(';').map(c => {
              const [name, ...rest] = c.trim().split('=');
              return { name, value: rest.join('=') };
            }).filter(c => c.name);
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            // كتابة الـ Cookies مباشرة في الـ Response — هذا هو السحر
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      const userEmail = user?.email;
      if (userEmail) {
        // 1. المالك الأساسي (Master Admin)
        const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'algaissi1980@gmail.com';

        // 2. فحص المدير عبر RPC (يتجاوز RLS)
        const { data: isAdmin } = await supabase.rpc('is_admin');

        // 3. الشرط: إذا كان هو المالك أو موجوداً في جدول المدراء
        if (userEmail === OWNER_EMAIL || isAdmin === true) {
          // نعيد بناء الـ Redirect مع الحفاظ على الـ Cookies اللي تمت كتابتها
          const adminResponse = NextResponse.redirect(`${origin}/admin`);
          response.cookies.getAll().forEach(cookie => {
            adminResponse.cookies.set(cookie.name, cookie.value);
          });
          return adminResponse;
        }
      }

      // زبون عادي — الـ response الأصلي يوجه لـ next (الرئيسية)
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
