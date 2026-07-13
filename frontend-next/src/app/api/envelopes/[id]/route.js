import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { getEnvelopeById, updateEnvelope, deleteEnvelope } from '@/services/envelopeService';

/**
 * GET /api/envelopes/[id]
 * Mengambil detail satu amplop berdasarkan ID.
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await getEnvelopeById(supabase, user.id, id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/envelopes/[id]
 * Memperbarui data amplop. Hanya admin yang diperbolehkan.
 */
export async function PUT(request, { params }) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Ekstrak data murni dari request, lalu lempar ke service
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body tidak valid atau kosong' }, { status: 400 });
    }
    const { name, category, limit_amount } = body;

    const result = await updateEnvelope(supabase, user.id, id, {
      name,
      category,
      limitAmount: limit_amount,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, data: result.data, message: 'Amplop berhasil diubah' },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/envelopes/[id]
 * Menghapus amplop. Hanya admin yang diperbolehkan.
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Ekstrak data murni dari request body (opsional)
    let reallocateToId = null;
    try {
      const body = await request.json();
      reallocateToId = body?.reallocateToId || null;
    } catch {
      // Abaikan jika body kosong atau tidak valid karena parameter opsional
    }

    const result = await deleteEnvelope(supabase, user.id, id, reallocateToId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({ success: true, message: 'Amplop berhasil dihapus' }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
