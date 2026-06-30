import { createBrowserClient } from '@supabase/ssr';

/**
 * DATABASE LAYER — Supabase Browser Client untuk Client Components.
 *
 * Digunakan di sisi klien (browser) dengan `'use client'` directive.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
