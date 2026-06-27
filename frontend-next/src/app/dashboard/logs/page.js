"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ActivityLogs from "@/features/audit-logs/ActivityLogs";

export default function LogsPage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
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
        // Fetch audit logs
        const { data: auditLogsData } = await supabase
          .from("audit_logs")
          .select("*, profiles(display_name)")
          .eq("family_id", profile.family_id)
          .order("created_at", { ascending: false });

        if (auditLogsData) {
          setLogs(auditLogsData.map(log => ({
            ...log,
            user_name: log.profiles ? log.profiles.display_name : "System",
          })));
        }
      }
      setIsLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-muted font-mono text-xs uppercase tracking-wider">Memuat Log Audit...</p>
      </div>
    );
  }

  // Filter logs based on search and action dropdown
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      (log.user_name || "").toLowerCase().includes(search.toLowerCase()) || 
      (log.target_table || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(search.toLowerCase());
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl text-white mb-2 text-balance">Pusat Log Aktivitas</h1>
          <p className="text-brand-muted text-lg">Pantau seluruh rekaman perubahan data dan riwayat audit keluarga Anda.</p>
        </div>
      </header>

      {/* Filters Toolbar */}
      <div className="glass-card bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Cari nama anggota, aksi, atau tabel target..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-slate/50 border border-white/10 text-white pl-12 pr-4 py-3 rounded-xl outline-none focus-visible:border-brand-gold/50 focus-visible:ring-1 focus-visible:ring-brand-gold/50 transition-all font-sans text-sm placeholder-white/20"
          />
        </div>

        <div className="w-full md:w-auto min-w-[200px] relative">
          <select 
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-brand-slate/50 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus-visible:border-brand-gold/50 focus-visible:ring-1 focus-visible:ring-brand-gold/50 transition-all font-sans text-sm appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Aktivitas</option>
            <option value="CREATE_ENVELOPES">Pembuatan Amplop Baru</option>
            <option value="UPDATE_ENVELOPES">Pembaruan Amplop</option>
            <option value="DELETE_ENVELOPES">Penghapusan Amplop</option>
            <option value="UPDATE_FAMILIES">Pengaturan Keluarga</option>
          </select>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Logs Table */}
      <ActivityLogs logs={filteredLogs} />
    </div>
  );
}
