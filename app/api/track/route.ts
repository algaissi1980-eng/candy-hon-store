import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '../../../lib/supabase/server';

// =============================================
// POST /api/track
// نظام تتبع الزوار الفريدين — طبقتان للدقة:
// 1. Cookie (ch_visited_today) — يمنع تكرار العد لنفس الزائر طوال اليوم
// 2. فحص المدير — يمنع احتساب المدراء كزوار
// =============================================

export async function POST() {
  try {
    const cookieStore = await cookies();

    // ── الطبقة الأولى: هل زار هذا المتصفح اليوم من قبل؟ ──
    const alreadyVisited = cookieStore.get('ch_visited_today');
    if (alreadyVisited) {
      return NextResponse.json({ ok: true, skipped: 'already_visited' });
    }

    // ── الطبقة الثانية: هل المستخدم مدير؟ ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;

    if (userEmail) {
      const { data: adminRow } = await supabase
        .from('admins')
        .select('email')
        .eq('email', userEmail)
        .maybeSingle();

      if (adminRow) {
        // مدير — لا نعد ولا نضع كوكي
        return NextResponse.json({ ok: true, skipped: 'admin' });
      }
    }

    // ── زائر حقيقي جديد — نزيد العداد ──
    const today = new Date().toISOString().split('T')[0];
    await supabase.rpc('increment_page_views', { view_date: today });

    // ── نحسب الوقت المتبقي حتى منتصف الليل (الـ Cookie ينتهي مع انتهاء اليوم) ──
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    const secondsUntilMidnight = Math.max(
      Math.floor((midnight.getTime() - now.getTime()) / 1000),
      1
    );

    // ── نضع الـ Cookie في الـ Response ──
    const response = NextResponse.json({ ok: true });
    response.cookies.set('ch_visited_today', '1', {
      httpOnly: true,                                    // لا يُقرأ من JavaScript
      secure: process.env.NODE_ENV === 'production',     // HTTPS فقط في الإنتاج
      sameSite: 'lax',                                   // حماية من CSRF
      maxAge: secondsUntilMidnight,                      // ينتهي عند منتصف الليل
      path: '/',                                         // ساري على كل الصفحات
    });

    return response;

  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
