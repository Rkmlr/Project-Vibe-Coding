import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/apiClient';
import { transferFunds } from '@/services/transactionService';

/**
 * POST /api/transactions/transfer
 * Memindahkan dana antar amplop (atau dari Kas Utama ke amplop).
 */
export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { from_envelope_id, to_envelope_id, amount, description } = body;

    const result = await transferFunds(supabase, user.id, {
      fromEnvelopeId: from_envelope_id,
      toEnvelopeId: to_envelope_id,
      amount,
      description,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(
      { success: true, message: result.message ?? 'Dana berhasil dipindahkan' },
      { status: 200 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
