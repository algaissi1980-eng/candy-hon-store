import type { Metadata, Viewport } from "next";
import { Fredoka, Tajawal } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import FloatingCart from "../components/FloatingCart";
import Footer from "../components/Footer";
import RealtimeSync from "../components/RealtimeSync";
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import PageTracker from '../components/PageTracker';

// خط Fredoka — مرح وعصري للعناوين الإنجليزية (يتناسب مع أجواء القطعة الحلوة)
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// خط Tajawal — نظيف وعصري للنصوص العربية
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

// منع Next.js من prerender الصفحات أثناء البناء (لأن Supabase يحتاج env vars)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Candy Hon | كاندي هون",
  description: "منتجات فريدة وغريبة — Unique & Fun Products",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // ✅ pinch-zoom مسموح — قيد إلزامي في الـ handoff (إتاحة الوصول)
  themeColor: '#FFF9F5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth" suppressHydrationWarning>
      {/* ─── #4 Preconnect — يبدأ المتصفح DNS+TLS قبل ما يحتاجهم ─── */}
      <head>
        <link rel="preconnect" href="https://ghjefvviapljgwyujwak.supabase.co" />
        <link rel="preconnect" href="https://images.weserv.nl" />
        <link rel="dns-prefetch" href="https://ghjefvviapljgwyujwak.supabase.co" />
        <link rel="dns-prefetch" href="https://images.weserv.nl" />
      </head>
      <body
        className={`${fredoka.variable} ${tajawal.variable} min-w-[320px] antialiased bg-[var(--bg)] text-[var(--ink-700)] flex flex-col min-h-screen font-[var(--font-tajawal)]`}
      >
        <Navbar />
        <main className="flex-grow w-full">
          {children}
        </main>
        <FloatingCart />
        <Footer />
        {/* توست الهوية الجديدة: حبة plum داكنة، أسفل المنتصف فوق الـ FAB،
            واحد فقط في كل مرة (استبدال لا تكديس) */}
        <Toaster
          position="bottom-center"
          duration={2500}
          visibleToasts={1}
          offset={96}
          toastOptions={{
            style: {
              fontFamily: 'inherit',
              direction: 'rtl',
              background: '#3A2A33',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '999px',
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: '14px',
              justifyContent: 'center',
            },
          }}
        />
        <PageTracker />
        <RealtimeSync />
        <Analytics />
      </body>
    </html>
  );
}
