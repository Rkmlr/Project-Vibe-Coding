import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { createFamily, joinFamily } from '@/services/familyService';

/**
 * POST /api/family
 * Membuat keluarga baru.
 */
export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { familyName, inviteCode } = body;

    const result = await createFamily(supabase, user.id, { familyName, inviteCode });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, data: result.data, message: 'Keluarga berhasil dibuat' },
      { status: 201 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/family
 * Bergabung dengan keluarga menggunakan invite code.
 */
export async function PUT(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    const result = await joinFamily(supabase, user.id, { inviteCode });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, data: result.data, message: 'Berhasil bergabung dengan keluarga' },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
