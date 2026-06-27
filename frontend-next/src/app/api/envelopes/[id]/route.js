import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";

export async function GET(request, { params }) {
  try {
    const supabase = await createApiClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.family_id) {
      return NextResponse.json({ error: "No family associated" }, { status: 404 });
    }

    const { id } = await params;

    const { data: envelope, error: fetchError } = await supabase
      .from("envelopes")
      .select("*")
      .eq("id", id)
      .eq("family_id", profile.family_id)
      .single();

    if (fetchError || !envelope) {
      return NextResponse.json({ error: "Envelope not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: envelope }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createApiClient(request);
    
    // 1. Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, family_id")
      .eq("id", user.id)
      .single();
      
    if (!profile || profile.role !== "admin") {
       return NextResponse.json({ error: "Only admins can edit envelopes" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, category, limit_amount } = body;

    // Fetch old data for audit
    const { data: oldEnvelope } = await supabase
      .from("envelopes")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldEnvelope || oldEnvelope.family_id !== profile.family_id) {
       return NextResponse.json({ error: "Envelope not found or unauthorized" }, { status: 404 });
    }

    // 2. Update envelope
    const { data: updatedEnvelope, error: updateError } = await supabase
      .from("envelopes")
      .update({
        name: name !== undefined ? name : oldEnvelope.name,
        category: category !== undefined ? category : oldEnvelope.category,
        limit_amount: limit_amount !== undefined ? limit_amount : oldEnvelope.limit_amount,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // 3. Log Audit
    await supabase.from("audit_logs").insert({
      family_id: profile.family_id,
      profile_id: user.id,
      action: "UPDATE_ENVELOPES",
      target_table: "envelopes",
      old_values: oldEnvelope,
      new_values: { ...updatedEnvelope, _description: `Mengubah data amplop: ${updatedEnvelope.name}` },
    });

    return NextResponse.json({ success: true, data: updatedEnvelope, message: "Amplop berhasil diubah" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createApiClient(request);
    
    // 1. Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, family_id")
      .eq("id", user.id)
      .single();
      
    if (!profile || profile.role !== "admin") {
       return NextResponse.json({ error: "Only admins can delete envelopes" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reallocateToId } = body;

    // Call RPC to handle complex deletion logic safely
    // Actually, we didn't create an RPC for delete envelope, so we will do it here.
    // 1. Get the envelope's current balance
    const { data: envelope, error: fetchError } = await supabase
      .from("envelopes")
      .select("balance, name")
      .eq("id", id)
      .single();

    if (fetchError || !envelope) {
       return NextResponse.json({ error: "Amplop tidak ditemukan." }, { status: 404 });
    }

    const balanceToMove = parseFloat(envelope.balance);

    if (balanceToMove > 0) {
      if (reallocateToId) {
        // Reallocate to another envelope
        const { data: targetEnv, error: targetError } = await supabase
          .from("envelopes")
          .select("balance, name")
          .eq("id", reallocateToId)
          .single();

        if (targetError) throw new Error("Amplop target realokasi tidak ditemukan.");

        // Update target envelope balance
        await supabase
          .from("envelopes")
          .update({ balance: parseFloat(targetEnv.balance) + balanceToMove })
          .eq("id", reallocateToId);

        // Record transfer transaction
        await supabase.from("transactions").insert({
          family_id: profile.family_id,
          envelope_id: reallocateToId,
          source_envelope_id: id,
          amount: balanceToMove,
          type: "TRANSFER",
          description: `Realokasi saldo dari penghapusan amplop '${envelope.name}'`,
          source: "APP",
        });
      } else {
        // Return to Cash Pool (Default)
        const { data: family, error: familyError } = await supabase
          .from("families")
          .select("cash_pool_balance")
          .eq("id", profile.family_id)
          .single();

        if (familyError) throw new Error("Grup keluarga tidak ditemukan.");

        // Add back to family cash pool
        await supabase
          .from("families")
          .update({ cash_pool_balance: parseFloat(family.cash_pool_balance) + balanceToMove })
          .eq("id", profile.family_id);

        // Record income transaction to Cash Pool
        await supabase.from("transactions").insert({
          family_id: profile.family_id,
          amount: balanceToMove,
          type: "INCOME",
          description: `Pengembalian sisa dana dari penghapusan amplop '${envelope.name}' ke Kas Utama`,
          source: "APP",
        });
      }
    }

    // 2. Delete the envelope
    const { error: deleteError } = await supabase
      .from("envelopes")
      .delete()
      .eq("id", id);

    if (deleteError) {
       return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // 3. Log Audit
    await supabase.from("audit_logs").insert({
      family_id: profile.family_id,
      profile_id: user.id,
      action: "DELETE_ENVELOPES",
      target_table: "envelopes",
      old_values: { ...envelope, _description: `Menghapus amplop: ${envelope.name}` },
      new_values: null,
    });

    return NextResponse.json({ success: true, message: "Amplop berhasil dihapus" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
