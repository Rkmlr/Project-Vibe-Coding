import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * DATABASE LAYER — Supabase Server Client untuk Server Components & Server Actions.
 *
 * Menggunakan cookie store dari Next.js untuk sesi SSR.
 *
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Bisa diabaikan jika dipanggil dari Server Component
            // (middleware akan me-refresh sesi).
          }
        },
      },
    }
  );
}
