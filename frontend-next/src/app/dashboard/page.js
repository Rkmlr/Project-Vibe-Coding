"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import EnvelopeGrid from "@/features/envelopes/EnvelopeGrid";
import TransactionSlip from "@/features/transactions/TransactionSlip";
import AtomicLedger from "@/features/transactions/AtomicLedger";
import MonthlyInsights from "@/features/insights/MonthlyInsights";
import MilestoneTracker from "@/features/insights/MilestoneTracker";
import ActivityLogs from "@/features/audit-logs/ActivityLogs";

// Mock Data
const initialEnvelopes = [
  { id: "ENV_1", name: "Kebutuhan Pokok", balance: 1500000, limit: 6000000, status: "safe" },
  { id: "ENV_2", name: "Pendidikan", balance: 1200000, limit: 1200000, status: "locked" },
  { id: "ENV_3", name: "Dana Liburan", balance: 3500000, limit: 5000000, status: "safe" },
  { id: "ENV_4", name: "Transportasi", balance: 150000, limit: 1000000, status: "warning" },
];

const initialTransactions = [
  { id: "TX_8F1B", envelope: "Kebutuhan Pokok", amount: -450000, desc: "Belanja Bulanan Supermarket", date: "2026-06-25T10:30:00Z", source: "APP", type: "EXPENSE" },
  { id: "TX_9A2C", envelope: "Transportasi", amount: -15000, desc: "Parkir IoT Trigger", date: "2026-06-25T08:15:00Z", source: "IOT_WEBHOOK", type: "EXPENSE" },
  { id: "TX_7E3D", envelope: "Dana Liburan", amount: 1500000, desc: "Reallocation dari Pokok", date: "2026-06-24T18:00:00Z", source: "APP", type: "INCOME" },
  { id: "TX_6B4E", envelope: "Kebutuhan Pokok", amount: -150000, desc: "Galon Air IoT", date: "2026-06-24T10:00:00Z", source: "IOT_WEBHOOK", type: "EXPENSE" },
];

const mockAuditLogs = [
  { id: "LOG_1", user_name: "Bapak (Admin)", action: "UPDATE_LIMIT", target_table: "envelopes", new_values: { envelope_id: "ENV_1", monthly_limit: 6000000 }, created_at: "2026-06-25T09:00:00Z" },
  { id: "LOG_2", user_name: "Sarah (Member)", action: "INSERT", target_table: "transactions", new_values: { amount: 15000, envelope_id: "ENV_4" }, created_at: "2026-06-25T08:15:00Z" },
  { id: "LOG_3", user_name: "Bapak (Admin)", action: "SOFT_DELETE", target_table: "envelopes", new_values: { envelope_id: "ENV_90X", comment: "Reallocated remainder to ENV_3" }, created_at: "2026-06-24T18:05:00Z" }
];

export default function DashboardPage() {
  const [role, setRole] = useState("admin");
  const [envelopes, setEnvelopes] = useState(initialEnvelopes);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);
  const [insightAdvice, setInsightAdvice] = useState(
    "Pengeluaran Transportasi Anda mendekati batas. Terdapat kelebihan Rp3,5 Juta di Dana Liburan yang dapat dialokasikan."
  );

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) {
          setRole(profile.role);
        }
      }
    };
    fetchUserRole();
  }, []);

  // Handle transaction logging (Optimistic update simulate)
  const handleAddTransaction = (newTx) => {
    // Add transaction to history
    setTransactions((prev) => [newTx, ...prev]);

    // Update envelope balance
    setEnvelopes((prevEnvelopes) => 
      prevEnvelopes.map((env) => {
        // Match name or mock id
        if (env.name === newTx.envelope) {
          const newBalance = env.balance + newTx.amount;
          return {
            ...env,
            balance: newBalance,
            status: newBalance <= env.limit * 0.15 ? "warning" : "safe"
          };
        }
        return env;
      })
    );

    // Create activity log
    const newLog = {
      id: `LOG_${Math.random().toString(36).substring(3, 7).toUpperCase()}`,
      user_name: role === "admin" ? "Bapak (Admin)" : "Sarah (Member)",
      action: "INSERT",
      target_table: "transactions",
      new_values: { amount: Math.abs(newTx.amount), envelope: newTx.envelope, desc: newTx.desc },
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handle one-click reallocation simulation
  const handleReallocate = () => {
    setEnvelopes((prev) => 
      prev.map((env) => {
        if (env.id === "ENV_3") {
          return { ...env, balance: env.balance - 1000000 }; // Reduce Liburan
        }
        if (env.id === "ENV_4") {
          return { ...env, balance: env.balance + 1000000, status: "safe" }; // Add Transport
        }
        return env;
      })
    );

    const reallog = {
      id: `LOG_${Math.random().toString(36).substring(3, 7).toUpperCase()}`,
      user_name: "Bapak (Admin)",
      action: "REALLOCATION",
      target_table: "envelopes",
      new_values: { from: "ENV_3", to: "ENV_4", amount: 1000000 },
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [reallog, ...prev]);
    setInsightAdvice(""); // Clear insight after application
  };

  // Filter envelopes member can access (e.g. Pokok and Transport)
  const memberEnvelopes = envelopes.filter(e => e.id === "ENV_1" || e.id === "ENV_4");
  const memberTransactions = transactions.filter(t => t.envelope === "Kebutuhan Pokok" || t.envelope === "Transportasi");

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Header Summary */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          {role === "admin" ? (
            <>
              <h1 className="font-display text-4xl text-white mb-2">Ledger Keluarga</h1>
              <p className="text-brand-muted text-lg">Periode Juni 2026. Sinkronisasi aktif.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl text-white mb-2">Selamat datang kembali, Sarah</h1>
              <p className="text-brand-muted text-lg">Catat pengeluaran harian Anda dengan presisi.</p>
            </>
          )}
        </div>
        
        <div className="flex flex-col items-start md:items-end">
          <span className="text-xs text-brand-gold font-mono uppercase tracking-widest mb-1">
            {role === "admin" ? "Total Dana Tersedia" : "Sisa Saldo Jatah"}
          </span>
          <span className="font-mono text-3xl md:text-4xl text-white font-medium">
            {role === "admin" 
              ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(envelopes.reduce((acc, curr) => acc + curr.balance, 0))
              : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(memberEnvelopes.reduce((acc, curr) => acc + curr.balance, 0))
            }
          </span>
        </div>
      </header>

      {/* Admin Interface Layout */}
      {role === "admin" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <EnvelopeGrid envelopes={envelopes} role={role} />
            </div>
            
            <div className="space-y-8">
              <MonthlyInsights advice={insightAdvice} onReallocate={handleReallocate} />
              <MilestoneTracker />
              <AtomicLedger transactions={transactions} limit={4} />
            </div>
          </div>

          {/* Full Activity logs for Admin */}
          <div className="pt-8 border-t border-white/5">
            <ActivityLogs logs={auditLogs} />
          </div>
        </>
      )}

      {/* Member Interface Layout */}
      {role === "member" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <TransactionSlip envelopes={memberEnvelopes} onAddTransaction={handleAddTransaction} />
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl text-white mb-4">Akses Amplop Saya</h2>
              <div className="flex flex-col gap-3">
                {memberEnvelopes.map(env => (
                  <div key={env.id} className="glass-card p-4 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{env.name}</div>
                      <div className="text-xs text-brand-muted font-mono mt-1">{env.id}</div>
                    </div>
                    <div className="font-mono text-lg text-brand-gold">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(env.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <AtomicLedger transactions={memberTransactions} title="Aktivitas Pribadi" limit={3} />
          </div>
        </div>
      )}
    </div>
  );
}
