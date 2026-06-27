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

    const { data: membersData, error } = await supabase
      .from("profiles")
      .select("id, display_name, role")
      .eq("family_id", profile.family_id);

    if (error) {
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: membersData }, { status: 200 });

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

    const body = await request.json();
    const { member_id, role } = body;

    if (!member_id || !role) {
      return NextResponse.json({ error: "member_id and role are required" }, { status: 400 });
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Role must be 'admin' or 'member'" }, { status: 400 });
    }

    // Prevent changing own role
    if (member_id === user.id) {
      return NextResponse.json({ error: "Tidak dapat mengubah role diri sendiri" }, { status: 400 });
    }

    // Verify member belongs to same family
    const { data: targetMember } = await supabase
      .from("profiles")
      .select("id, display_name, role, family_id")
      .eq("id", member_id)
      .single();

    if (!targetMember || targetMember.family_id !== profile.family_id) {
      return NextResponse.json({ error: "Anggota tidak ditemukan di keluarga ini" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", member_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      family_id: profile.family_id,
      profile_id: user.id,
      action: "UPDATE_PROFILES",
      target_table: "profiles",
      old_values: { role: targetMember.role },
      new_values: { role, member_id, _description: `Mengubah role ${targetMember.display_name} menjadi ${role}` },
    });

    return NextResponse.json({ success: true, message: `Role berhasil diubah menjadi ${role}` }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
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

    const body = await request.json();
    const { member_id } = body;

    if (!member_id) {
      return NextResponse.json({ error: "member_id is required" }, { status: 400 });
    }

    // Prevent removing self
    if (member_id === user.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus diri sendiri dari keluarga" }, { status: 400 });
    }

    // Verify member belongs to same family and is not admin
    const { data: targetMember } = await supabase
      .from("profiles")
      .select("id, display_name, role, family_id")
      .eq("id", member_id)
      .single();

    if (!targetMember || targetMember.family_id !== profile.family_id) {
      return NextResponse.json({ error: "Anggota tidak ditemukan di keluarga ini" }, { status: 404 });
    }

    if (targetMember.role === "admin") {
      return NextResponse.json({ error: "Tidak dapat menghapus admin dari keluarga" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ family_id: null })
      .eq("id", member_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      family_id: profile.family_id,
      profile_id: user.id,
      action: "DELETE_PROFILES",
      target_table: "profiles",
      old_values: { member_id, display_name: targetMember.display_name },
      new_values: { _description: `Menghapus akses ${targetMember.display_name} dari keluarga` },
    });

    return NextResponse.json({ success: true, message: "Anggota berhasil dihapus dari keluarga" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
