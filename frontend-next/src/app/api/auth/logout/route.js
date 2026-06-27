import { NextResponse } from "next/server";
import { createApiClient } from "@/utils/supabase/api";

export async function POST(request) {
  try {
    const supabase = await createApiClient(request);
    
    // This will clear the HTTP-Only cookies if accessed via Web, 
    // or invalidate the session if accessed via Mobile.
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
