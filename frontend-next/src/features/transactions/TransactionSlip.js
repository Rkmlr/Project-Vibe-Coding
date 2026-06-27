"use client";

import { useState, useEffect } from "react";
import { addTransaction } from "./actions";

export default function TransactionSlip({ envelopes = [], role = "member", onTransactionSuccess }) {
  const [txType, setTxType] = useState("EXPENSE"); // EXPENSE or INCOME
  const [amount, setAmount] = useState("");
  const [envelopeId, setEnvelopeId] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const categories = {
    EXPENSE: ["Makanan", "Transportasi", "Pendidikan", "Hiburan", "Tagihan", "Kesehatan", "Lainnya"],
    INCOME: ["Gaji", "Bonus", "Investasi", "Hadiah", "Lainnya"],
  };

  const isAdmin = role === "admin";

  useEffect(() => {
    // If not admin, always default to EXPENSE
    if (!isAdmin) {
      setTxType("EXPENSE");
      setCategory(categories.EXPENSE[0]);
    }
  }, [role]);

  useEffect(() => {
    // Auto select first envelope when list changes
    if (envelopes.length > 0 && !envelopeId) {
      setEnvelopeId(envelopes[0].id);
    }
  }, [envelopes]);

  const handleNumberClick = (num) => {
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Harap masukkan jumlah uang transaksi.");
      return;
    }
    
    setIsLoading(true);

    try {
      const res = await addTransaction({
        envelopeId: txType === "EXPENSE" ? envelopeId : null,
        amount: Number(amount),
        type: txType,
        description: desc || (txType === "EXPENSE" ? "Pengeluaran Harian" : "Pemasukan Keluarga"),
        category,
      });

      if (res && res.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        // Reset Form
        setAmount("");
        setDesc("");
        setError("");
        
        if (onTransactionSuccess) {
          onTransactionSuccess();
        }
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan koneksi.");
      setIsLoading(false);
    }
  };

  // Reset category when type changes
  const handleTypeChange = (type) => {
    setTxType(type);
    setCategory(categories[type][0]);
    setError("");
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-brand-slate relative shadow-2xl md:flex w-full">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-sage/5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Input Area */}
      <div className="p-8 md:w-[55%] flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 relative z-10">
        
        {/* Toggle Type - Only show for Admin (Orang Tua) */}
        {isAdmin ? (
          <div className="flex bg-white/5 rounded-lg p-1 mb-4 border border-white/5">
            <button
              type="button"
              onClick={() => handleTypeChange("EXPENSE")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                txType === "EXPENSE" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "text-brand-muted hover:text-white"
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("INCOME")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                txType === "INCOME" ? "bg-brand-sage/20 text-brand-sage border border-brand-sage/30" : "text-brand-muted hover:text-white"
              }`}
            >
              Pemasukan
            </button>
          </div>
        ) : (
          <div className="text-xs text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-3 py-1.5 rounded-lg font-mono mb-4 text-center">
            Pencatatan Pengeluaran Harian
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg font-mono mb-4 leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex flex-col mb-6">
          <label className="text-[10px] text-brand-muted mb-2 uppercase tracking-widest font-mono">Nominal Transaksi</label>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 shadow-inner">
            <span className="text-2xl text-brand-gold font-mono font-medium">Rp</span>
            <input 
              type="text" 
              readOnly
              value={amount ? Number(amount).toLocaleString('id-ID') : "0"}
              className="bg-transparent text-4xl md:text-5xl text-white font-mono font-semibold outline-none w-full placeholder-white/20 tabular-nums focus-visible:ring-2 focus-visible:ring-brand-gold rounded-md px-2 truncate"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-brand-muted mb-1.5 block uppercase tracking-wider font-mono">Pilih Amplop</label>
              {txType === "EXPENSE" ? (
                <select 
                  value={envelopeId}
                  onChange={(e) => setEnvelopeId(e.target.value)}
                  className="w-full bg-brand-slate border border-white/10 text-white p-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-gold transition-colors text-sm cursor-pointer truncate"
                >
                  {envelopes.length > 0 ? (
                    envelopes.map(env => (
                      <option key={env.id} value={env.id}>
                        {env.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>-- Belum ada amplop --</option>
                  )}
                </select>
              ) : (
                <input 
                  type="text" 
                  readOnly 
                  value="Kas Utama (Dompet)" 
                  className="w-full bg-brand-slate/40 border border-white/10 text-brand-muted p-3 rounded-lg outline-none text-sm font-medium truncate"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-brand-muted mb-1.5 block uppercase tracking-wider font-mono">Kategori</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-brand-slate border border-white/10 text-white p-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-gold transition-colors text-sm cursor-pointer truncate"
              >
                {categories[txType].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-[10px] text-brand-muted mb-1.5 block uppercase tracking-wider font-mono">Keterangan (Opsional)</label>
            <input 
              type="text" 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={txType === "EXPENSE" ? "Misal: Makan Siang" : "Misal: Gaji Bulanan Bapak"}
              className="w-full bg-brand-slate/50 border border-white/10 text-white p-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-gold transition-colors placeholder-white/20 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Numpad & Submit */}
      <div className="p-8 md:w-[45%] bg-black/20 relative z-10 flex flex-col justify-between">
        <div className="grid grid-cols-3 gap-3 flex-1 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "000", 0].map((num, i) => (
            <button 
              key={i} 
              type="button"
              onClick={() => handleNumberClick(num.toString())}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-4 text-2xl text-white font-mono font-medium transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              {num}
            </button>
          ))}
          <button 
            type="button"
            onClick={handleBackspace}
            aria-label="Hapus Angka"
            className="bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/10 rounded-lg py-4 flex items-center justify-center transition-colors active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight py-4 rounded-xl font-medium text-lg transition-all transform hover:-translate-y-1 shadow-[0_4px_20px_rgba(246,224,181,0.15)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-midnight focus-visible:ring-brand-gold"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></span>
          ) : (
            "Catat Transaksi"
          )}
        </button>
      </div>
    </div>
  );
}
