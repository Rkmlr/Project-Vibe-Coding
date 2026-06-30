import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { closeMonthlyBook } from '@/services/envelopeService';

/**
 * POST /api/envelopes/close-book
 * Menutup buku bulanan. Hanya admin yang diperbolehkan.
 */
export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ekstrak data murni dari request body, lalu lempar ke service
    const body = await request.json();
    const { method, savingsEnvelopeId } = body;

    const result = await closeMonthlyBook(supabase, user.id, {
      method,
      savingsEnvelopeId,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, message: result.message ?? 'Tutup buku berhasil' },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
