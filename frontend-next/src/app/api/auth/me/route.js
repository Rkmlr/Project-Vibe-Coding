import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { getCurrentUser } from '@/services/authService';

/**
 * GET /api/auth/me
 * Mengambil detail profil user yang sedang login beserta data keluarganya.
 */
export async function GET(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getCurrentUser(supabase, user.id, user.email);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({
      success: true,
      user: result.data
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
