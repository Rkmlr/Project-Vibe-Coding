import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { getSettings, updateSettings } from '@/services/settingsService';

/**
 * GET /api/settings
 * Mengambil detail informasi keluarga. Hanya untuk admin.
 */
export async function GET(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getSettings(supabase, user.id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/settings
 * Memperbarui nama keluarga. Hanya untuk admin.
 */
export async function PUT(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    const result = await updateSettings(supabase, user.id, { name });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, data: result.data, message: 'Pengaturan berhasil disimpan' },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
