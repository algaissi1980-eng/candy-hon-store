import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        return fetch(url, { ...options, cache: 'no-store' });
      },
    },
  }
);