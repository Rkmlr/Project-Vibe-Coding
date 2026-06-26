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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white mb-2">Pusat Log Audit</h1>
          <p className="text-brand-muted">Seluruh rekaman mutasi saldo, limit pos anggaran, dan riwayat audit.</p>
        </div>
      </header>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input 
          type="text" 
          placeholder="Cari aktor, target tabel, atau aksi..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-brand-slate/50 border border-white/10 text-white p-3 rounded-lg outline-none focus:border-brand-gold/50 transition-colors font-mono text-xs placeholder-white/20"
        />

        <select 
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-brand-slate/50 border border-white/10 text-white p-3 rounded-lg outline-none focus:border-brand-gold/50 transition-colors font-mono text-xs appearance-none cursor-pointer"
        >
          <option value="ALL">Semua Aksi</option>
          <option value="CREATE_ENVELOPES">CREATE_ENVELOPES</option>
          <option value="UPDATE_ENVELOPES">UPDATE_ENVELOPES</option>
          <option value="DELETE_ENVELOPES">DELETE_ENVELOPES</option>
          <option value="UPDATE_FAMILIES">UPDATE_FAMILIES</option>
        </select>
      </div>

      {/* Logs Table */}
      <ActivityLogs logs={filteredLogs} />
    </div>
  );
}
