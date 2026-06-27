import { createServerClient } from '@supabase/ssr';
import { createClient as createJSClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Omni-channel Supabase Client for API Routes
 * 
 * Automatically detects the client type:
 * - If called from Mobile App (Authorization header present), uses standard Supabase JS Client with Bearer token.
 * - If called from Web App (No Authorization header), uses Supabase SSR Client with HTTP-Only Cookies.
 */
export async function createApiClient(request) {
  const authHeader = request.headers.get('authorization');
  
  // 1. Mobile App Fallback (Bearer Token)
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

  // 2. Web App Fallback (Cookies)
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
