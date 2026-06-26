"use client";

import { useState } from "react";
import { closeMonthlyBook } from "./actions";

export default function CloseBookModal({
  isOpen,
  onClose,
  envelopes = [],
}) {
  const [method, setMethod] = useState("sweep"); // "sweep", "rollover", "savings"
  const [savingsEnvelopeId, setSavingsEnvelopeId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (method === "savings" && !savingsEnvelopeId) {
      setError("Silakan pilih amplop tabungan tujuan pengalihan dana.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await closeMonthlyBook(method, savingsEnvelopeId || null);

      if (res && res.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan koneksi.");
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter envelopes that are categorized as SAVINGS
  const savingsEnvelopes = envelopes.filter(
    (env) => env.category === "SAVINGS"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl border border-white/10 animate-fade-in-up duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display text-white">Tutup Buku Bulanan</h3>
          <button 
            onClick={onClose}
            className="text-brand-muted hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg font-mono">
              {error}
            </div>
          )}

          <div className="bg-brand-slate/40 border border-brand-gold/20 rounded-lg p-4 text-xs text-brand-gold leading-relaxed">
            📢 **Informasi**: Aksi Tutup Buku Bulanan akan memproses sisa saldo berjalan di seluruh amplop sesuai pilihan metode di bawah ini. Pengeluaran log audit akan dicatat otomatis.
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-muted mb-2 uppercase tracking-wider font-mono">Pilih Metode Penyelesaian</label>
            <div className="flex flex-col gap-3">
              {/* Option 1: Sweep */}
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                method === "sweep" 
                  ? "bg-brand-gold/5 border-brand-gold text-white" 
                  : "bg-white/5 border-white/10 text-brand-muted hover:text-white"
              }`}>
                <input
                  type="radio"
                  name="method"
                  value="sweep"
                  checked={method === "sweep"}
                  onChange={() => setMethod("sweep")}
                  className="mt-1 accent-brand-gold cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium">Tarik ke Kas Utama (Default)</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Seluruh sisa saldo amplop akan dikembalikan ke saldo Dompet Kas Utama.</div>
                </div>
              </label>

              {/* Option 2: Rollover */}
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                method === "rollover" 
                  ? "bg-brand-gold/5 border-brand-gold text-white" 
                  : "bg-white/5 border-white/10 text-brand-muted hover:text-white"
              }`}>
                <input
                  type="radio"
                  name="method"
                  value="rollover"
                  checked={method === "rollover"}
                  onChange={() => setMethod("rollover")}
                  className="mt-1 accent-brand-gold cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium">Akumulasi (Rollover)</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Saldo amplop saat ini tetap utuh dan diakumulasikan ke limit bulan depan.</div>
                </div>
              </label>

              {/* Option 3: Savings */}
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                method === "savings" 
                  ? "bg-brand-gold/5 border-brand-gold text-white" 
                  : "bg-white/5 border-white/10 text-brand-muted hover:text-white"
              }`}>
                <input
                  type="radio"
                  name="method"
                  value="savings"
                  checked={method === "savings"}
                  onChange={() => setMethod("savings")}
                  className="mt-1 accent-brand-gold cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium">Pindahkan ke Tabungan (Savings)</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Semua sisa saldo amplop digabungkan dan dipindahkan ke amplop Tabungan khusus.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Dropdown for Savings */}
          {method === "savings" && (
            <div className="animate-fade-in space-y-2">
              <label className="block text-xs font-medium text-brand-muted uppercase tracking-wider font-mono">Pilih Amplop Tabungan Target</label>
              {savingsEnvelopes.length > 0 ? (
                <select
                  value={savingsEnvelopeId}
                  onChange={(e) => setSavingsEnvelopeId(e.target.value)}
                  className="w-full bg-brand-slate border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Pilih Amplop Tabungan --</option>
                  {savingsEnvelopes.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} (Saldo saat ini: {formatCurrency(env.balance || env.balance_amount || 0)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-red-400 font-medium p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                  ⚠️ Belum ada amplop dengan kategori **SAVINGS / TABUNGAN**. Silakan buat amplop kategori Tabungan terlebih dahulu untuk menggunakan metode ini.
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-brand-muted hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || (method === "savings" && savingsEnvelopes.length === 0)}
              className="px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Proses Tutup Buku"
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
