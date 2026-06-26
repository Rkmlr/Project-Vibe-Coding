"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function MembersPage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, family_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setRole(profile.role);

    if (profile.family_id) {
      // Fetch family invite code
      const { data: family } = await supabase
        .from("families")
        .select("invite_code")
        .eq("id", profile.family_id)
        .single();
      if (family) {
        setInviteCode(family.invite_code);
      }

      // Fetch family profiles
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, display_name, email, role, created_at")
        .eq("family_id", profile.family_id)
        .order("role", { ascending: true })
        .order("display_name", { ascending: true });

      if (!pError && profiles) {
        setMembers(profiles);
      }
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchMembers().then(() => setIsLoading(false));
  }, [router]);

  const handleRemoveMember = async (id) => {
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ family_id: null })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-muted font-mono text-xs uppercase tracking-wider">Memuat Anggota Keluarga...</p>
      </div>
    );
  }

  const isAdmin = role === "admin";

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="font-display text-4xl text-white mb-2">Manajemen Anggota Keluarga</h1>
        <p className="text-brand-muted text-lg">Kelola akses, peran, dan undang anggota keluarga baru ke FamFi.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg font-mono leading-relaxed">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-display text-white">Anggota Aktif</h2>
            </div>
            
            <div className="divide-y divide-white/5">
              {members.map((m) => (
                <div key={m.id} className="p-6 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-slate border border-white/10 flex items-center justify-center font-display font-bold text-brand-gold text-lg uppercase">
                      {m.display_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        {m.display_name}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase tracking-wider ${
                          m.role === 'admin' ? 'text-brand-gold bg-brand-gold/10 border-brand-gold/20' : 'text-brand-sage bg-brand-sage/10 border-brand-sage/20'
                        }`}>
                          {m.role}
                        </span>
                      </div>
                      <div className="text-sm text-brand-muted mt-0.5">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs text-brand-sage bg-brand-sage/10 border border-brand-sage/10 px-2 py-1 rounded">
                      Aktif
                    </span>
                    {isAdmin && m.role !== "admin" && (
                      <button 
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 hover:border-red-500/30 px-3 py-1.5 rounded transition-all active:scale-95 cursor-pointer"
                      >
                        Hapus Akses
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="p-8 text-center text-brand-muted italic">
                  Belum ada anggota terdaftar.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invite Info Card */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-display text-white">Undang Anggota</h2>
            <p className="text-xs text-brand-muted mt-1">Bagikan kode undangan keluarga Anda di bawah ini.</p>
          </div>

          <div className="bg-brand-slate/40 border border-white/10 p-5 rounded-xl text-center space-y-3">
            <span className="text-[10px] text-brand-muted font-mono uppercase tracking-widest block">Kode Undangan Keluarga</span>
            <span className="font-mono text-3xl text-brand-gold font-bold select-all block tracking-wider">
              {inviteCode || "------"}
            </span>
          </div>

          <div className="text-xs text-brand-muted space-y-2 leading-relaxed">
            <p>💡 **Bagaimana cara anggota keluarga bergabung?**</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Minta anggota keluarga mendaftar akun baru di FamFi.</li>
              <li>Pada halaman onboarding pendaftaran, pilih **"Gabung Keluarga"**.</li>
              <li>Masukkan kode undangan di atas.</li>
              <li>Akun akan otomatis terhubung ke grup keuangan keluarga ini sebagai Member.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
