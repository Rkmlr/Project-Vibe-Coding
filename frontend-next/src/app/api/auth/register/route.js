import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { registerUser } from '@/services/authService';
import { rateLimit } from '@/utils/rate-limit';

/**
 * POST /api/auth/register
 * Mendaftarkan user baru dan menghubungkannya dengan keluarga (create/join).
 */
export async function POST(request) {
  try {
    if (!rateLimit(request, 5, 60000)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan, coba lagi nanti.' }, { status: 429 });
    }

    const body = await request.json();
    const { email, password, displayName, mode, familyName, inviteCode } = body;

    const supabase = await createApiClient(request);
    const result = await registerUser(supabase, {
      email,
      password,
      displayName,
      mode,
      familyName,
      inviteCode,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
      tokens: result.session ? {
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      } : null
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
