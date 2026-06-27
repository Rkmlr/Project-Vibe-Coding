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

    // 2. Fetch user's profile and check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Only admins can access audit logs." }, { status: 403 });
    }

    // 3. Fetch audit logs for the family
    const { data: auditLogsData, error: auditError } = await supabase
      .from("audit_logs")
      .select("*, profiles(display_name)")
      .eq("family_id", profile.family_id)
      .order("created_at", { ascending: false });

    if (auditError) {
       return NextResponse.json({ error: auditError.message }, { status: 400 });
    }
    
    // Format response to include user_name easily
    const formattedLogs = auditLogsData.map(log => ({
      ...log,
      user_name: log.profiles ? log.profiles.display_name : "System",
    }));

    return NextResponse.json({ success: true, data: formattedLogs }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
