import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";
import crypto from "crypto";
import { rateLimit } from "@/utils/rate-limit";

export async function POST(request) {
  try {
    if (!rateLimit(request, 5, 60000)) {
      return NextResponse.json({ error: "Terlalu banyak permintaan, coba lagi nanti." }, { status: 429 });
    }

    const body = await request.json();
    const email = body.email;
    const password = body.password;
    const displayName = body.displayName || body.display_name;
    const mode = body.mode;
    const familyName = body.familyName || body.family_name;
    const inviteCode = body.inviteCode || body.invite_code;

    if (!email || !password || !displayName || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createApiClient(request);

    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Perform onboarding (Create or Join family)
    if (mode === "create") {
      if (!familyName) {
         return NextResponse.json({ error: "Family name is required for mode create" }, { status: 400 });
      }
      
      const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
      const generatedCode = `${familyName.replace(/\s+/g, "-").toUpperCase()}-${randomHex}`;

      const { error: rpcError } = await supabase.rpc("create_family_and_set_admin", {
        family_name: familyName,
        invite_code: generatedCode,
      });

      if (rpcError) {
        return NextResponse.json({ error: `Gagal membuat keluarga: ${rpcError.message}` }, { status: 400 });
      }
    } else if (mode === "join") {
      if (!inviteCode) {
        return NextResponse.json({ error: "Invite code is required for mode join" }, { status: 400 });
      }
      
      const { error: rpcError } = await supabase.rpc("join_family_by_code", {
        p_invite_code: inviteCode.trim(),
      });

      if (rpcError) {
        return NextResponse.json({ error: `Gagal bergabung: ${rpcError.message}` }, { status: 400 });
      }
    }

    // Respond differently if called from Mobile vs Web
    // If Web, the session is already captured via Cookies by createApiClient (because @supabase/ssr handles the set-cookie implicitly during signUp if autoConfirm is on).
    // Let's explicitly return tokens for mobile to consume.
    const session = authData.session;
    
    return NextResponse.json({
      success: true,
      message: "Registration successful",
      requiresEmailConfirmation: !session,
      tokens: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      } : null
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
