import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'candy-hon-auth',
    },
    global: {
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        return fetch(url, { ...options, cache: 'no-store' });
      },
    },
  }
);