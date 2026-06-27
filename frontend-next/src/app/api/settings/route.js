import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";

export async function GET(request) {
  try {
    const supabase = await createApiClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.family_id) {
      return NextResponse.json({ error: "No family associated" }, { status: 404 });
    }

    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id, name, invite_code, cash_pool_balance")
      .eq("id", profile.family_id)
      .single();

    if (familyError || !family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: family }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = await createApiClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!profile.family_id) {
      return NextResponse.json({ error: "No family associated" }, { status: 404 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Family name is required" }, { status: 400 });
    }

    // Fetch old family data for audit
    const { data: oldFamily } = await supabase
      .from("families")
      .select("name")
      .eq("id", profile.family_id)
      .single();

    const { data: updatedFamily, error: updateError } = await supabase
      .from("families")
      .update({ name: name.trim() })
      .eq("id", profile.family_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      family_id: profile.family_id,
      profile_id: user.id,
      action: "UPDATE_FAMILIES",
      target_table: "families",
      old_values: oldFamily,
      new_values: { name: updatedFamily.name, _description: `Mengubah nama keluarga menjadi: ${updatedFamily.name}` },
    });

    return NextResponse.json({ success: true, data: updatedFamily, message: "Pengaturan berhasil disimpan" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
