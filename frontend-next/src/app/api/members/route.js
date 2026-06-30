import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { getMembers, updateMemberRole, removeMember } from '@/services/memberService';

/**
 * GET /api/members
 * Mengambil semua anggota keluarga. Hanya admin.
 */
export async function GET(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getMembers(supabase, user.id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/members
 * Mengubah role anggota keluarga. Hanya admin.
 */
export async function PUT(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { member_id, role } = body;

    const result = await updateMemberRole(supabase, user.id, { memberId: member_id, role });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, message: result.message },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/members
 * Menghapus/mengeluarkan anggota dari keluarga. Hanya admin.
 */
export async function DELETE(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { member_id } = body;

    const result = await removeMember(supabase, user.id, { memberId: member_id });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, message: result.message },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
