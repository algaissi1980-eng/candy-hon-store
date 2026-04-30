import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // السماح بـ ngrok في development
  allowedDevOrigins: [
    'dash-identical-smoky.ngrok-free.dev',
    '127.0.0.1:3000',
    'localhost:3000',
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
  },
};

export default nextConfig;
