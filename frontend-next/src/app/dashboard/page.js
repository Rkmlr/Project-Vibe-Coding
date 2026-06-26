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
      {/* Header Summary */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          {role === "admin" ? (
            <>
              <h1 className="font-display text-4xl text-white mb-2">Ledger {familyName || "Keluarga"}</h1>
              <p className="text-brand-muted text-sm font-mono uppercase tracking-wider">
                Kode Undangan: <span className="text-brand-gold font-bold select-all">{inviteCode}</span>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl text-white mb-2">Selamat datang kembali, {userName}</h1>
              <p className="text-brand-muted text-lg">Catat pengeluaran harian Anda dengan presisi.</p>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 md:gap-8 justify-end">
          {role === "admin" && (
            <div className="flex flex-col items-start md:items-end border-r border-white/10 pr-4 md:pr-8">
              <span className="text-xs text-brand-sage font-mono uppercase tracking-widest mb-1">
                Kas Utama Keluarga
              </span>
              <span className="font-mono text-2xl md:text-3xl text-brand-sage font-medium">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cashPoolBalance)}
              </span>
            </div>
          )}
          
          <div className="flex flex-col items-start md:items-end">
            <span className="text-xs text-brand-gold font-mono uppercase tracking-widest mb-1">
              {role === "admin" ? "Total Saldo Amplop" : "Sisa Saldo Jatah"}
            </span>
            <span className="font-mono text-2xl md:text-3xl text-white font-medium">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                envelopes.reduce((acc, curr) => acc + parseFloat(curr.balance || 0), 0)
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Admin Interface Layout */}
      {role === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Core Financial State */}
          <div className="lg:col-span-2 space-y-10">
            <EnvelopeGrid envelopes={envelopes} role={role} members={members} onSuccess={fetchData} />
            
            <div className="pt-6 border-t border-white/5">
              <FinancialCharts envelopes={envelopes} transactions={transactions} />
            </div>
          </div>
          
          {/* Right Column: Actions & Recent Activity */}
          <div className="space-y-8">
              <h2 className="font-display text-xl text-white mb-4">Catat Transaksi Baru</h2>
            </div>
            
            <MonthlyInsights advice={insightAdvice} onReallocate={handleReallocate} />
            <AtomicLedger transactions={mappedTransactions} limit={4} />
          </div>
        </div>
      )}

      {/* Member Interface Layout */}
      {role === "member" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-10">
            <TransactionSlip envelopes={envelopes} role={role} onTransactionSuccess={fetchData} />
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl text-white mb-4">Akses Amplop Saya</h2>
              <div className="flex flex-col gap-3">
                {envelopes.map(env => (
                  <div key={env.id} className="glass-card p-4 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{env.name}</div>
                      <div className="text-xs text-brand-muted font-mono mt-1 uppercase">{env.category}</div>
                    </div>
                    <div className="font-mono text-lg text-brand-gold">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(env.balance)}
                    </div>
                  </div>
                ))}
                {envelopes.length === 0 && (
                  <div className="p-6 text-center text-brand-muted text-xs italic glass-card border border-white/5 rounded-xl">
                    Belum ada amplop anggaran yang tersedia.
                  </div>
                )}
              </div>
            </div>

            <AtomicLedger transactions={mappedTransactions} title="Aktivitas Pribadi" limit={3} />
          </div>
        </div>
      )}
    </div>
  );
}
