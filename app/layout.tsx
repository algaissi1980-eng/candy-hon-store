import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${fredoka.variable} ${tajawal.variable} min-w-[320px] antialiased bg-[var(--cream)] text-[var(--text-primary)] flex flex-col min-h-screen font-[var(--font-tajawal)]`}
      >
        <Navbar />
        <main className="flex-grow w-full">
          {children}
        </main>
        <FloatingCart />
        <Footer />
        <Toaster
          position="top-center"
          richColors
          closeButton
          duration={3000}
          toastOptions={{
            style: { fontFamily: 'inherit', direction: 'rtl' },
          }}
        />
        <PageTracker />
        <RealtimeSync />
        <Analytics />
      </body>
    </html>
  );
}
