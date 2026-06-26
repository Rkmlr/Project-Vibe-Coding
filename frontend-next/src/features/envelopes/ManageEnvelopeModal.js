"use client";

import { useState, useEffect } from "react";
import { createEnvelope, updateEnvelope, deleteEnvelope } from "./actions";

export default function ManageEnvelopeModal({
  isOpen,
  onClose,
  mode = "add", // "add", "edit", "delete"
  envelope = null,
  envelopes = [],
}) {
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [category, setCategory] = useState("NEEDS");
  const [reallocateToId, setReallocateToId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (envelope && (mode === "edit" || mode === "delete")) {
      setName(envelope.name);
      setLimit(envelope.limit_amount ? envelope.limit_amount.toString() : envelope.limit ? envelope.limit.toString() : "");
      setCategory(envelope.category || "NEEDS");
    } else {
      setName("");
      setLimit("");
      setCategory("NEEDS");
      setReallocateToId("");
    }
    setError("");
  }, [envelope, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let res;
      if (mode === "add") {
        res = await createEnvelope(name, limit, category);
      } else if (mode === "edit") {
        res = await updateEnvelope(envelope.id, name, limit, category);
      } else if (mode === "delete") {
        res = await deleteEnvelope(envelope.id, reallocateToId || null);
      }

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

  const currentBalance = envelope ? (envelope.balance || 0) : 0;

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
          <h3 className="text-xl font-display text-white">
            {mode === "add" && "Tambah Amplop Baru"}
            {mode === "edit" && "Edit Amplop"}
            {mode === "delete" && "Hapus Amplop"}
          </h3>
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

          {/* Add / Edit Form */}
          {(mode === "add" || mode === "edit") && (
            <>
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5 uppercase tracking-wider font-mono">Nama Pos Anggaran</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-brand-muted focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm"
                  placeholder="Contoh: Belanja Bulanan"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5 uppercase tracking-wider font-mono">Kategori Anggaran</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-brand-slate border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm cursor-pointer"
                  required
                >
                  <option value="NEEDS">Kebutuhan Pokok (NEEDS)</option>
                  <option value="WANTS">Keinginan (WANTS)</option>
                  <option value="SAVINGS">Tabungan (SAVINGS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5 uppercase tracking-wider font-mono">Batas Anggaran (Limit)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-sm">Rp</span>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-2.5 text-white placeholder-brand-muted focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm font-mono"
                    placeholder="5000000"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Delete (Reallocate) Form */}
          {mode === "delete" && envelope && (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm text-red-200">
                  Anda akan menghapus pos anggaran <strong className="text-white">{envelope.name}</strong>.
                </p>
                {currentBalance > 0 && (
                  <p className="text-sm text-red-200 mt-2">
                    Terdapat sisa saldo sebesar <strong className="text-white">{formatCurrency(currentBalance)}</strong>. Sisa saldo akan otomatis dikembalikan ke **Kas Utama** keluarga Anda jika Anda tidak memilih amplop pengalihan di bawah ini.
                  </p>
                )}
              </div>

              {currentBalance > 0 && (
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5 uppercase tracking-wider font-mono">Pilih Pos Pengalihan (Opsional)</label>
                  <select
                    value={reallocateToId}
                    onChange={(e) => setReallocateToId(e.target.value)}
                    className="w-full bg-brand-slate border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm cursor-pointer"
                  >
                    <option value="">Kembalikan ke Kas Utama (Default)</option>
                    {envelopes
                      .filter((env) => env.id !== envelope.id)
                      .map((env) => {
                        const envLimit = env.limit_amount || env.limit || 0;
                        const envBalance = env.balance || 0;
                        return (
                          <option key={env.id} value={env.id}>
                            {env.name} (Sisa limit: {formatCurrency(envLimit - envBalance)})
                          </option>
                        );
                      })}
                  </select>
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
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "delete"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight"
              }`}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  {mode === "add" && "Simpan Amplop"}
                  {mode === "edit" && "Perbarui Amplop"}
                  {mode === "delete" && (reallocateToId ? "Hapus & Realokasi" : "Hapus & Kembalikan ke Kas")}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
