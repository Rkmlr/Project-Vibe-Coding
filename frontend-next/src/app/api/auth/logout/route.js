import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { logoutUser } from '@/services/authService';

/**
 * POST /api/auth/logout
 * Melakukan sign out pengguna.
 */
export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    const result = await logoutUser(supabase);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
