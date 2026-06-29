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
    const { error: rpcError } = await supabase.rpc("delete_envelope_and_reallocate", {
      p_family_id: profile.family_id,
      p_user_id: user.id,
      p_envelope_id: id,
      p_reallocate_to_id: reallocateToId || null
    });

    if (rpcError) {
       return NextResponse.json({ error: `Gagal menghapus amplop: ${rpcError.message}` }, { status: 400 });
    }

    // 3. Log Audit
    await supabase.from("audit_logs").insert({
      family_id: profile.family_id,
      profile_id: user.id,
      action: "DELETE_ENVELOPES",
      target_table: "envelopes",
      old_values: { id, _description: `Menghapus amplop dengan ID ${id}` },
      new_values: null,
    });

    return NextResponse.json({ success: true, message: "Amplop berhasil dihapus" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
