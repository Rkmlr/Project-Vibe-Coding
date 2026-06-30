import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { getEnvelopes, createEnvelope } from '@/services/envelopeService';

/**
 * GET /api/envelopes
 * Mengambil semua amplop untuk keluarga pengguna yang login.
 */
export async function GET(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getEnvelopes(supabase, user.id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/envelopes
 * Membuat amplop baru. Hanya admin yang diperbolehkan.
 */
export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ekstrak data murni dari request, lalu lempar ke service
    const body = await request.json();
    const { name, category, limit_amount, initial_balance } = body;

    const result = await createEnvelope(supabase, user.id, {
      name,
      category,
      limitAmount: limit_amount,
      initialBalance: initial_balance,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, data: result.data, message: 'Amplop berhasil dibuat' },
      { status: 201 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
