import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth-failed&details=${encodeURIComponent(error.message)}`);
    }

    const { data: { user } } = await supabase.auth.getUser();

    const userEmail = user?.email;
    if (userEmail) {
      // 1. المالك الأساسي (Master Admin)
      const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'algaissi1980@gmail.com';

      // 2. فحص المدير عبر RPC (يتجاوز RLS)
      const { data: isAdmin } = await supabase.rpc('is_admin');

      // 3. الشرط: إذا كان هو المالك أو موجوداً في جدول المدراء
      if (userEmail === OWNER_EMAIL || isAdmin === true) {
        return NextResponse.redirect(`${origin}/admin`);
      }
    }

    // زبون عادي — يوجه لـ next (الرئيسية)
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=no-code-provided`);
}
