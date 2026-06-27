"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import EnvelopeGrid from "@/features/envelopes/EnvelopeGrid";
import TransactionSlip from "@/features/transactions/TransactionSlip";
import AtomicLedger from "@/features/transactions/AtomicLedger";
import MonthlyInsights from "@/features/insights/MonthlyInsights";
import FinancialCharts from "@/features/insights/FinancialCharts";

export default function DashboardPage() {
  const [role, setRole] = useState("member");
  const [userName, setUserName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [cashPoolBalance, setCashPoolBalance] = useState(0);
  const [envelopes, setEnvelopes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [insightAdvice, setInsightAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, family_id, role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) return;

      setRole(profile.role);
      setUserName(profile.display_name);

      if (profile.family_id) {
        // 2. Fetch family details
        const { data: family } = await supabase
          .from("families")
          .select("name, invite_code, cash_pool_balance")
          .eq("id", profile.family_id)
          .single();

        if (family) {
          setFamilyName(family.name);
          setInviteCode(family.invite_code);
          setCashPoolBalance(parseFloat(family.cash_pool_balance || 0));
        }

        // 3. Fetch envelopes
        const { data: envelopesData } = await supabase
          .from("envelopes")
          .select("*")
          .eq("family_id", profile.family_id)
          .order("name", { ascending: true });

        if (envelopesData) {
          setEnvelopes(envelopesData);
          
          // Generate insight advice if any envelopes are low
          const lowEnvelopes = envelopesData.filter(env => {
            const balance = parseFloat(env.balance || 0);
            const limit = parseFloat(env.limit_amount || 0);
            return limit > 0 && (balance / limit) <= 0.15 && balance > 0;
          });
          
          const savingsEnvelopes = envelopesData.filter(env => env.category === "SAVINGS" && parseFloat(env.balance) > 1000000);
          
          if (lowEnvelopes.length > 0) {
            let adviceStr = `Pengeluaran ${lowEnvelopes.map(e => e.name).join(", ")} Anda mendekati batas.`;
            if (savingsEnvelopes.length > 0) {
              adviceStr += ` Terdapat kelebihan dana di ${savingsEnvelopes.map(e => e.name).join(", ")} yang dapat dialokasikan.`;
            } else {
              adviceStr += ` Harap minta orang tua melakukan realokasi dana.`;
            }
            setInsightAdvice(adviceStr);
          } else {
            setInsightAdvice("Semua amplop anggaran berada dalam batas aman. Kerja bagus!");
          }
        }

        // 4. Fetch transactions
        const { data: transactionsData } = await supabase
          .from("transactions")
          .select("*")
          .eq("family_id", profile.family_id)
          .order("date", { ascending: false });

        if (transactionsData) {
          setTransactions(transactionsData);
        }

        // 5. Fetch family members list (only if admin)
        if (profile.role === "admin") {
          const { data: membersData } = await supabase
            .from("profiles")
            .select("id, display_name, role")
            .eq("family_id", profile.family_id);

          if (membersData) {
            setMembers(membersData);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData().then(() => setIsLoading(false));
  }, []);

  const handleReallocate = async () => {
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-muted font-mono text-sm uppercase tracking-wider">Memuat Ledger Keluarga...</p>
      </div>
    );
  }

  // Map transactions to the format AtomicLedger expects
  const mappedTransactions = transactions.map(tx => {
    const envName = tx.envelope_id ? (envelopes.find(e => e.id === tx.envelope_id)?.name || "Kas Utama") : "Kas Utama";
    return {
      id: tx.id.slice(0, 8).toUpperCase(),
      desc: tx.description,
      envelope: envName,
      amount: parseFloat(tx.amount),
      source: tx.source,
      date: tx.date,
      type: tx.type,
      category: tx.envelope_id ? (envelopes.find(e => e.id === tx.envelope_id)?.category || "") : ""
    };
  });



  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Header & Hero Section */}
      <header className="flex flex-col gap-8">
        <div>
          {role === "admin" ? (
            <>
              <h1 className="font-display text-4xl text-white mb-2 text-balance">Ledger {familyName || "Keluarga"}</h1>
              <p className="text-brand-muted text-sm font-mono uppercase tracking-wider">
                Kode Undangan: <span className="text-brand-gold font-bold select-all">{inviteCode}</span>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl text-white mb-2 text-balance">Selamat datang kembali, {userName}</h1>
              <p className="text-brand-muted text-lg">Kelola pengeluaran harian Anda.</p>
            </>
          )}
        </div>
        
        {/* Hero Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {role === "admin" && (
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/10 flex flex-col justify-center items-start relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-sage/10 rounded-full blur-3xl pointer-events-none"></div>
              <span className="text-sm text-brand-sage font-mono uppercase tracking-widest mb-2 relative z-10">
                Kas Utama Keluarga
              </span>
              <span className="font-mono text-4xl md:text-5xl text-brand-sage font-semibold tabular-nums relative z-10">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cashPoolBalance)}
              </span>
            </div>
          )}
          
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/10 flex flex-col justify-center items-start relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>
            <span className="text-sm text-brand-gold font-mono uppercase tracking-widest mb-2 relative z-10">
              {role === "admin" ? "Total Saldo Amplop" : "Sisa Saldo Jatah"}
            </span>
            <span className="font-mono text-4xl md:text-5xl text-white font-semibold tabular-nums relative z-10">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                envelopes.reduce((acc, curr) => acc + parseFloat(curr.balance || 0), 0)
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Admin Interface Layout */}
      {role === "admin" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            {/* Left Column: Core Financial State */}
            <div className="space-y-8">
              <EnvelopeGrid envelopes={envelopes} role={role} members={members} onSuccess={fetchData} />
            </div>
            
            {/* Right Column: Actions */}
            <div className="space-y-8">
              <TransactionSlip envelopes={envelopes} role={role} onTransactionSuccess={fetchData} />
            </div>
          </div>

          {/* Full Width: Financial Analysis */}
          <FinancialCharts envelopes={envelopes} transactions={transactions} />

          <div className="space-y-8">
            <MonthlyInsights advice={insightAdvice} onReallocate={handleReallocate} />
            <AtomicLedger transactions={mappedTransactions} title="Buku Kas Keluarga" limit={5} />
          </div>
        </div>
      )}

      {/* Member Interface Layout */}
      {role === "member" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            <TransactionSlip envelopes={envelopes} role={role} onTransactionSuccess={fetchData} />
            
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/10">
              <h2 className="font-display text-2xl text-white mb-6 text-balance">Amplop Saya</h2>
              <div className="flex flex-col gap-4">
                {envelopes.map(env => (
                  <div key={env.id} className="p-4 rounded-xl border border-white/5 bg-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                    <div>
                      <div className="text-white font-medium text-lg">{env.name}</div>
                      <div className="text-xs text-brand-muted font-mono mt-1 uppercase">{env.category}</div>
                    </div>
                    <div className="font-mono text-xl text-brand-gold font-semibold tabular-nums">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(env.balance)}
                    </div>
                  </div>
                ))}
                {envelopes.length === 0 && (
                  <div className="p-6 text-center text-brand-muted text-sm italic border border-white/5 bg-white/5 rounded-xl">
                    Belum ada amplop anggaran. Minta pengelola untuk menambahkan amplop.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <AtomicLedger transactions={mappedTransactions} title="Aktivitas Pribadi" limit={10} />
          </div>
        </div>
      )}
    </div>
  );
}
