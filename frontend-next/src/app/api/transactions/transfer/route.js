import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";

export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    
    // 1. Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, family_id")
      .eq("id", user.id)
      .single();
      
    if (!profile || profile.role !== "admin") {
       return NextResponse.json({ error: "Hanya admin yang dapat memindahkan dana" }, { status: 403 });
    }

    const body = await request.json();
    const { from_envelope_id, to_envelope_id, amount, description } = body;

    if (!to_envelope_id || !amount) {
      return NextResponse.json({ error: "Tujuan dan nominal harus diisi" }, { status: 400 });
    }

    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }

    // Use RPC for atomic transfer
    const { error: rpcError } = await supabase.rpc("transfer_funds", {
      p_family_id: profile.family_id,
      p_user_id: user.id,
      p_from_envelope_id: from_envelope_id || null, // null means from Kas Utama
      p_to_envelope_id: to_envelope_id,
      p_amount: numericAmount,
      p_description: description || "Realokasi Dana"
    });

    if (rpcError) {
      return NextResponse.json({ error: `Transfer gagal: ${rpcError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Dana berhasil dipindahkan" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
