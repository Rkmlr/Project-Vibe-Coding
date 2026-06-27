"use client";

import { useState, useEffect } from "react";
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
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch Auth Profile
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) return;
      const { user } = await authRes.json();

      setRole(user.role);
      setUserName(user.display_name);

      if (user.family) {
        setFamilyName(user.family.name);
        setInviteCode(user.family.invite_code);
        setCashPoolBalance(parseFloat(user.family.cash_pool_balance || 0));
        
        if (user.role === 'admin') {
          const membersRes = await fetch('/api/members');
          if (membersRes.ok) {
            const { data } = await membersRes.json();
            setMembers(data);
          }
        }
      }
      
      // 3. Fetch envelopes
      const envRes = await fetch('/api/envelopes');
      if (envRes.ok) {
        const { data: envelopesData } = await envRes.json();
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
      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const { data: transactionsData } = await txRes.json();
        setTransactions(transactionsData);
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
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
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
          
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg hover:shadow-brand-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-midnight"
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Catat Transaksi
          </button>
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
          <div className="space-y-8">
            <EnvelopeGrid envelopes={envelopes} role={role} members={members} onSuccess={fetchData} />
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

      {/* Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-24 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-brand-midnight/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsTxModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-3xl animate-in zoom-in-95 duration-200 z-10 mb-8">
            <button 
              onClick={() => setIsTxModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <TransactionSlip 
              envelopes={envelopes} 
              role={role} 
              onTransactionSuccess={() => { 
                fetchData(); 
                setIsTxModalOpen(false); 
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
