import { createServerClient } from '@supabase/ssr';
import { createClient as createJSClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * DATABASE LAYER — Omni-channel Supabase Client untuk API Routes.
 *
 * Mendeteksi tipe klien secara otomatis:
 * - Mobile App (header Authorization Bearer) → Supabase JS Client dengan Bearer token.
 * - Web App (tanpa Authorization header)     → Supabase SSR Client dengan HTTP-Only Cookies.
 *
 * @param {Request} request - Objek Next.js Request
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export async function createApiClient(request) {
  const authHeader = request.headers.get('authorization');

  // Mobile App: Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return createJSClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
  }

  // Web App: Cookie-based SSR Client
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
            // Ignored in API routes
          }
        },
      },
    }
  );
}
