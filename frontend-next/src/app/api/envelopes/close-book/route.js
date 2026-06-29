import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";

export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, family_id")
      .eq("id", user.id)
      .single();
      
    if (!profile || profile.role !== "admin") {
       return NextResponse.json({ error: "Only admins can close book" }, { status: 403 });
    }

    const body = await request.json();
    const { method, savingsEnvelopeId } = body;

    // 1. Fetch all envelopes in the family
    const { data: envelopes, error: fetchError } = await supabase
      .from("envelopes")
      .select("*")
      .eq("family_id", profile.family_id);

    if (fetchError) {
      return NextResponse.json({ error: "Gagal mengambil data amplop." }, { status: 400 });
    }

    let totalRemaining = 0;
    const envelopeUpdates = [];

    // Filter envelopes with balance > 0
    envelopes.forEach((env) => {
      if (parseFloat(env.balance) > 0) {
        // Skip the target savings envelope if moving to savings
        if (method === "savings" && env.id === savingsEnvelopeId) {
          return;
        }
        totalRemaining += parseFloat(env.balance);
        envelopeUpdates.push(env);
      }
    });

    if (totalRemaining <= 0) {
      return NextResponse.json({ success: true, message: "Semua amplop sudah kosong. Tidak ada saldo untuk dipindahkan." }, { status: 200 });
    }

    if (method === "sweep") {
      const { error: rpcError } = await supabase.rpc("close_book", {
        p_family_id: profile.family_id,
        p_user_id: user.id
      });

      if (rpcError) {
        return NextResponse.json({ error: `Gagal tutup buku: ${rpcError.message}` }, { status: 400 });
      }
    } else if (method === "savings") {
      if (!savingsEnvelopeId) {
        return NextResponse.json({ error: "Harap pilih amplop tabungan tujuan." }, { status: 400 });
      }

      const { error: rpcError } = await supabase.rpc("close_book_savings", {
        p_family_id: profile.family_id,
        p_user_id: user.id,
        p_savings_envelope_id: savingsEnvelopeId
      });

      if (rpcError) {
        return NextResponse.json({ error: `Gagal pindah ke tabungan: ${rpcError.message}` }, { status: 400 });
      }
    } else if (method === "rollover") {
      // Rollover: Accumulate (Do nothing to balance, just let it carry over)
      // No updates needed, but can log audit
    }

    return NextResponse.json({ success: true, message: "Tutup buku berhasil" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
