import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";

export async function GET(request) {
  try {
    const supabase = await createApiClient(request);
    
    // 1. Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch user's profile to get family_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.family_id) {
      return NextResponse.json({ error: "No family associated with this user" }, { status: 404 });
    }

    // 3. Fetch envelopes for the family
    const { data: envelopes, error: envError } = await supabase
      .from("envelopes")
      .select("*")
      .eq("family_id", profile.family_id)
      .order("name", { ascending: true });

    if (envError) {
       return NextResponse.json({ error: envError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: envelopes }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
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
       return NextResponse.json({ error: "Only admins can create envelopes" }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, limit_amount, initial_balance } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    // 2. Insert new envelope
    const { data: newEnvelope, error: insertError } = await supabase
      .from("envelopes")
      .insert({
        name,
        category,
        limit_amount: limit_amount || null,
        balance: initial_balance || 0,
        family_id: profile.family_id,
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // 3. Log Audit
    await supabase.from("audit_logs").insert({
      family_id: profile.family_id,
      profile_id: user.id,
      action: "CREATE_ENVELOPES",
      target_table: "envelopes",
      old_values: null,
      new_values: { ...newEnvelope, _description: `Membuat amplop anggaran baru: ${name}` },
    });

    return NextResponse.json({ success: true, data: newEnvelope, message: "Amplop berhasil dibuat" }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
