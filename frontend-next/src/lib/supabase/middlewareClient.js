import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * DATABASE LAYER — Supabase Client khusus untuk Next.js Middleware.
 *
 * Digunakan di `src/middleware.js` untuk me-refresh sesi pengguna
 * pada setiap request yang masuk.
 *
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh token sesi agar tidak expire
  await supabase.auth.getUser();

  return supabaseResponse;
}
