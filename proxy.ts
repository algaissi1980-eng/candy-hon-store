import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// =============================================
// Proxy — تجديد جلسة Supabase Auth تلقائياً
// يعمل على كل request لضمان بقاء الـ session حية
// (Next.js 16: middleware → proxy)
// =============================================

// عمر الـ cookie — 400 يوم (أقصى حد يسمح به المتصفح)
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            // نضمن أن كل cookie يحصل على maxAge كافي عشان ما ينمسح عند إغلاق المتصفح
            response.cookies.set(name, value, {
              ...options,
              maxAge: options.maxAge ?? COOKIE_MAX_AGE,
            });
          });
        },
      },
    }
  );

  // تجديد الجلسة — هذا هو الهدف الأساسي
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
