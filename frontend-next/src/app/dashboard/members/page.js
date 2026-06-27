"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    try {
      // Fetch members from API
      const res = await fetch("/api/members");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRole("admin"); // If we get here, we are admin (API enforces this)
      setMembers(data.data || []);

      // Fetch invite code from settings API
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setInviteCode(settingsData.data?.invite_code || "");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchMembers().then(() => setIsLoading(false));
  }, [router]);

  const handleRemoveMember = async (id) => {
    setError("");
    try {
      const res = await fetch("/api/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(members.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
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
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl text-white mb-2 text-balance">Manajemen Keluarga</h1>
          <p className="text-brand-muted text-lg">Kelola peran, akses, dan undang anggota keluarga baru ke ekosistem keuangan Anda.</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg font-mono leading-relaxed">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-black/20">
              <h2 className="text-xl font-display text-white">Daftar Anggota Aktif</h2>
            </div>
            
            <div className="divide-y divide-white/10">
              {members.map((m) => (
                <div key={m.id} className="p-6 hover:bg-white/[0.03] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-slate border border-white/10 flex items-center justify-center font-display font-bold text-brand-gold text-xl uppercase shadow-inner">
                      {m.display_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-medium text-lg flex items-center gap-3">
                        {m.display_name}
                        <span className={`text-[10px] px-3 py-1 rounded-full font-mono uppercase tracking-widest border ${
                          m.role === 'admin' ? 'text-brand-gold bg-brand-gold/10 border-brand-gold/20' : 'text-brand-sage bg-brand-sage/10 border-brand-sage/20'
                        }`}>
                          {m.role === 'admin' ? 'Orang Tua' : 'Anak'}
                        </span>
                      </div>
                      {m.email && <div className="text-sm text-brand-muted mt-1">{m.email}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs text-brand-sage bg-brand-sage/10 border border-brand-sage/30 px-3 py-1.5 rounded-md font-medium">
                      ✓ Aktif
                    </span>
                    {isAdmin && m.role !== "admin" && (
                      <button 
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 px-4 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer font-medium"
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
        <div className="glass-card bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <h2 className="text-xl font-display text-white">Undang Anggota</h2>
            <p className="text-sm text-brand-muted mt-2 leading-relaxed">Bagikan kode undangan rahasia ini agar anggota keluarga lain dapat bergabung.</p>
          </div>

          <div className="bg-black/30 border border-white/10 p-6 rounded-xl text-center space-y-3 relative shadow-inner group">
            <span className="text-[10px] text-brand-muted font-mono uppercase tracking-widest block">Kode Undangan</span>
            <span className="font-mono text-4xl text-brand-gold font-bold select-all block tracking-widest">
              {inviteCode || "------"}
            </span>
          </div>

          <div className="text-sm text-brand-muted space-y-3 leading-relaxed bg-brand-slate/30 p-5 rounded-xl border border-white/5">
            <p className="font-medium text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Cara Bergabung
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-white/70">
              <li>Daftar akun baru di platform FamFi.</li>
              <li>Pilih opsi <strong className="text-white font-medium">"Gabung Keluarga"</strong>.</li>
              <li>Masukkan kode unik di atas.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
