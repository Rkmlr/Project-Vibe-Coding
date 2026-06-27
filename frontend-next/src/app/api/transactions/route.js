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

    // 3. Fetch transactions for the family
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("family_id", profile.family_id)
      .order("date", { ascending: false });

    if (txError) {
       return NextResponse.json({ error: txError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: transactions }, { status: 200 });

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
    
    // 2. Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, family_id, display_name")
      .eq("id", user.id)
      .single();
      
    if (!profile || !profile.family_id) {
       return NextResponse.json({ error: "No family associated" }, { status: 403 });
    }

    const body = await request.json();
    const { type, amount, description, source, envelope_id, date } = body;

    if (!type || !amount || !description || !source) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }

    // Validate rules based on role and type
    if (type === "INCOME") {
      if (profile.role !== "admin") {
        return NextResponse.json({ error: "Hanya pengelola yang dapat mencatat pemasukan" }, { status: 403 });
      }
    }

    // Call Supabase RPC for atomic transactions
    const { error: rpcError } = await supabase.rpc("add_transaction", {
      p_family_id: profile.family_id,
      p_user_id: user.id,
      p_type: type,
      p_amount: numericAmount,
      p_description: description,
      p_source: source,
      p_envelope_id: envelope_id || null,
      p_date: date || new Date().toISOString()
    });

    if (rpcError) {
      return NextResponse.json({ error: `Transaksi gagal: ${rpcError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Transaksi berhasil dicatat" }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
