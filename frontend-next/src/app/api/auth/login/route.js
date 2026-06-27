import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // createApiClient automatically sets cookies if it's a web request
    const supabase = await createApiClient(request);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const session = data.session;

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: data.user,
      tokens: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      } : null
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
