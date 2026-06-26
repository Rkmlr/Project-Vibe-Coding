import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardNavClient from "./DashboardNavClient";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/");
  }

  // Fetch real profile and family info
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, families(*)")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, redirect to root
  if (profileError || !profile) {
    redirect("/");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-brand-midnight text-brand-muted">
      {/* Elegant Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-gold/5 rounded-full blur-[150px] animate-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-sage/5 rounded-full blur-[120px] animate-glow" style={{ animationDelay: "3s" }}></div>
      </div>

      {/* Dashboard Navigation */}
      <DashboardNavClient profile={profile} />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-24">
        {children}
      </main>
    </div>
  );
}
