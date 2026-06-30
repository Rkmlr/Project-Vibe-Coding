import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { loginUser } from '@/services/authService';

/**
 * POST /api/auth/login
 * Melakukan sign in pengguna.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const supabase = await createApiClient(request);
    const result = await loginUser(supabase, { email, password });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 401 });
    }

    const session = result.session;

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
      tokens: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      } : null
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
