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
      // Option A: Sweep all back to Cash Pool
      const { data: family } = await supabase
        .from("families")
        .select("cash_pool_balance")
        .eq("id", profile.family_id)
        .single();

      await supabase
        .from("families")
        .update({ cash_pool_balance: parseFloat(family.cash_pool_balance) + totalRemaining })
        .eq("id", profile.family_id);

      // Set all envelope balances to 0
      for (const env of envelopeUpdates) {
        await supabase.from("envelopes").update({ balance: 0 }).eq("id", env.id);
      }

      // Log transaction
      await supabase.from("transactions").insert({
        family_id: profile.family_id,
        amount: totalRemaining,
        type: "INCOME",
        description: "Tutup Buku Bulanan: Tarik semua sisa saldo amplop ke Kas Utama",
        source: "APP",
      });
    } else if (method === "savings") {
      // Option B: Move to savings envelope
      if (!savingsEnvelopeId) {
        return NextResponse.json({ error: "Harap pilih amplop tabungan tujuan." }, { status: 400 });
      }

      const { data: savingsEnv } = await supabase
        .from("envelopes")
        .select("balance, name")
        .eq("id", savingsEnvelopeId)
        .single();

      // Add to savings envelope
      await supabase
        .from("envelopes")
        .update({ balance: parseFloat(savingsEnv.balance) + totalRemaining })
        .eq("id", savingsEnvelopeId);

      // Set other envelope balances to 0
      for (const env of envelopeUpdates) {
        await supabase.from("envelopes").update({ balance: 0 }).eq("id", env.id);
        
        // Log transaction for each
        await supabase.from("transactions").insert({
          family_id: profile.family_id,
          envelope_id: savingsEnvelopeId,
          source_envelope_id: env.id,
          amount: parseFloat(env.balance),
          type: "TRANSFER",
          description: `Tutup Buku Bulanan: Pindahan sisa saldo dari '${env.name}' ke Tabungan '${savingsEnv.name}'`,
          source: "APP",
        });
      }
    } else if (method === "rollover") {
      // Option C: Accumulate (Do nothing to balance, just let it carry over)
      // Balance is kept, so we just log a system event in audit logs
      // No envelope updates are needed.
    }

    return NextResponse.json({ success: true, message: "Tutup buku berhasil" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
