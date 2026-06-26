"use client";

import { useState } from "react";
import { transferBalance } from "@/features/transactions/actions";

export default function TransferModal({
  isOpen,
  onClose,
  envelopes = [],
  onSuccess,
}) {
  const [sourceId, setSourceId] = useState(""); // "" means Kas Utama (Main Cash Pool)
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Harap masukkan jumlah transfer yang valid.");
      return;
    }

    if (!targetId) {
      setError("Harap pilih amplop target pengalihan.");
      return;
    }

    if (sourceId === targetId) {
      setError("Pos amplop sumber dan target tidak boleh sama.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await transferBalance({
        sourceEnvelopeId: sourceId || null,
        targetEnvelopeId: targetId,
        amount: parsedAmount,
        description: desc || "Transfer saldo anggaran keluarga",
      });

      if (res && res.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        // Reset Form
        setSourceId("");
        setTargetId("");
        setAmount("");
        setDesc("");
        if (onSuccess) onSuccess();
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
          <h3 className="text-xl font-display text-white">Transfer Anggaran</h3>
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

          {/* Source Select */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5 uppercase tracking-wider font-mono">Pilih Sumber Dana</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-brand-slate border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm cursor-pointer"
            >
              <option value="">Kas Utama Keluarga (Dompet)</option>
              {envelopes.map((env) => (
                <option key={env.id} value={env.id}>
                  Amplop: {env.name} (Saldo: {formatCurrency(env.balance || 0)})
                </option>
              ))}
            </select>
          </div>

          {/* Target Select */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5 uppercase tracking-wider font-mono">Pilih Amplop Target</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-brand-slate border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm cursor-pointer"
              required
            >
              <option value="" disabled>-- Pilih Amplop Target --</option>
              {envelopes
                .filter((env) => env.id !== sourceId)
                .map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} (Saldo: {formatCurrency(env.balance || 0)})
                  </option>
                ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5 uppercase tracking-wider font-mono">Jumlah Transfer</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-sm">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-2.5 text-white placeholder-brand-muted focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm font-mono"
                placeholder="150000"
                required
              />
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5 uppercase tracking-wider font-mono">Keterangan (Opsional)</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="cth: Tambahan uang bensin Kakak"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-brand-muted focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm"
            />
          </div>

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
              disabled={isLoading}
              className="px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Proses Transfer"
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
