import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";

// POST: Membuat Keluarga Baru
export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    
    // 1. Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { familyName, inviteCode } = body;

    if (!familyName || !inviteCode) {
      return NextResponse.json({ error: "Nama keluarga dan kode undangan wajib diisi" }, { status: 400 });
    }

    // Panggil RPC create_family_and_set_admin
    const { data: family, error: rpcError } = await supabase.rpc("create_family_and_set_admin", {
      family_name: familyName,
      invite_code: inviteCode
    });

    if (rpcError) {
      return NextResponse.json({ error: `Gagal membuat keluarga: ${rpcError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: family, message: "Keluarga berhasil dibuat" }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// PUT: Bergabung dengan Keluarga menggunakan Invite Code
export async function PUT(request) {
  try {
    const supabase = await createApiClient(request);
    
    // 1. Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json({ error: "Kode undangan wajib diisi" }, { status: 400 });
    }

    // Panggil RPC join_family_by_code
    const { data: family, error: rpcError } = await supabase.rpc("join_family_by_code", {
      p_invite_code: inviteCode
    });

    if (rpcError) {
      return NextResponse.json({ error: `Gagal bergabung dengan keluarga: ${rpcError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: family, message: "Berhasil bergabung dengan keluarga" }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
