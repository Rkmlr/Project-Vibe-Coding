"use client";

import { useState, useEffect } from "react";
import EnvelopeGrid from "@/features/envelopes/EnvelopeGrid";
import TransactionSlip from "@/features/transactions/TransactionSlip";
import AtomicLedger from "@/features/transactions/AtomicLedger";
import MonthlyInsights from "@/features/insights/MonthlyInsights";
import FinancialCharts from "@/features/insights/FinancialCharts";

import crypto from "crypto"; // only use in server, wait we can't use crypto in client component!
// Actually, we can just generate invite code on the server or a simple random string on client.
function generateSimpleInviteCode(familyName) {
  const namePart = familyName.trim().replace(/\s+/g, "-").toUpperCase().substring(0, 8);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${namePart}-${randomPart}`;
}

function OnboardingView({ onComplete }) {
  const [activeTab, setActiveTab] = useState("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const generatedCode = generateSimpleInviteCode(familyName);
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName, inviteCode: generatedCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in-up">
      <div className="max-w-md w-full bg-brand-surface border border-brand-midnight rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold to-yellow-500"></div>
        <h2 className="text-3xl font-display text-white mb-2 text-center">Selamat Datang di FamFi</h2>
        <p className="text-brand-muted text-center mb-8">Silakan buat keluarga baru atau bergabung dengan undangan.</p>
        
        <div className="flex mb-6 border-b border-brand-midnight">
          <button 
            className={`flex-1 pb-3 font-medium transition-colors ${activeTab === 'create' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-muted hover:text-white'}`}
            onClick={() => setActiveTab('create')}
          >
            Buat Keluarga
          </button>
          <button 
            className={`flex-1 pb-3 font-medium transition-colors ${activeTab === 'join' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-muted hover:text-white'}`}
            onClick={() => setActiveTab('join')}
          >
            Gabung
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Nama Keluarga</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full bg-brand-dark/50 border border-brand-midnight rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold transition-colors"
                placeholder="Misal: Keluarga Cemara"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !familyName}
              className="w-full bg-brand-gold text-brand-midnight font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Buat & Mulai"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Kode Undangan</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-brand-dark/50 border border-brand-midnight rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold transition-colors uppercase"
                placeholder="Misal: KELUARGA-1234"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inviteCode}
              className="w-full bg-brand-gold text-brand-midnight font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Bergabung"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [hasFamily, setHasFamily] = useState(null);
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
        setHasFamily(true);
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
      } else {
        setHasFamily(false);
      }
      
      // 3. Fetch envelopes only if has family
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

  if (isLoading || hasFamily === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-muted font-mono text-sm uppercase tracking-wider">Memuat Ledger Keluarga...</p>
      </div>
    );
  }

  if (hasFamily === false) {
    return <OnboardingView onComplete={fetchData} />;
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
