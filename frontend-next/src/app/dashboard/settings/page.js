"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("IDR");
  const [alertLimit, setAlertLimit] = useState(15);

  const [notifWarning, setNotifWarning] = useState(true);
  const [notifDaily, setNotifDaily] = useState(false);
  const [notifMonthly, setNotifMonthly] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setRole("admin"); // API enforces admin-only access
        setFamilyName(data.data?.name || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaved(false);
    setIsSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand-muted font-mono text-xs uppercase tracking-wider">Memuat Pengaturan...</p>
      </div>
    );
  }

  const isAdmin = role === "admin";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-4xl text-white mb-2 text-balance">Pengaturan Sistem</h1>
          <p className="text-brand-muted text-lg">Konfigurasi preferensi keluarga, batasan peringatan, dan pemberitahuan.</p>
        </div>
      </header>

      {isSaved && (
        <div className="bg-brand-sage/10 border border-brand-sage/30 text-brand-sage p-4 rounded-xl flex items-center justify-between transition-opacity animate-in fade-in duration-200">
          <span>Pengaturan berhasil disimpan!</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg font-mono leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Family Profile Configuration */}
        <div className="glass-card bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <h2 className="text-2xl font-display text-white border-b border-white/10 pb-4">Profil Keluarga</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-brand-muted mb-2 font-medium">Nama Grup Keluarga</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-brand-slate/50 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-brand-muted mb-2 font-medium">Mata Uang Utama</label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-brand-slate/50 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="IDR">IDR (Rupiah Indonesia)</option>
                <option value="USD">USD (Dolar Amerika)</option>
                <option value="SGD">SGD (Dolar Singapura)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Warning & Alerts Configuration */}
        <div className="glass-card bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl space-y-6">
          <h2 className="text-2xl font-display text-white border-b border-white/10 pb-4">Batasan & Peringatan Anggaran</h2>
          
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-brand-muted mb-4 font-medium flex justify-between">
              <span>Batas Persentase Warning: <span className="text-brand-gold text-sm">{alertLimit}%</span></span>
              <span className="text-white/40">Default: 15%</span>
            </label>
            <input
              type="range"
              min="5"
              max="35"
              step="5"
              value={alertLimit}
              onChange={(e) => setAlertLimit(Number(e.target.value))}
              disabled={!isAdmin}
              className="w-full h-2 bg-brand-midnight rounded-lg appearance-none cursor-pointer accent-brand-gold disabled:opacity-50"
            />
            <p className="text-sm text-brand-muted mt-4 bg-brand-slate/40 p-4 rounded-xl border border-white/5 leading-relaxed">
              Sistem akan memicu status <span className="text-brand-gold font-mono uppercase tracking-widest text-[10px] px-2 py-0.5 rounded border border-brand-gold/30 bg-brand-gold/10 mx-1">Warning</span> jika saldo tersisa di amplop bernilai kurang dari <strong className="text-white">{alertLimit}%</strong> dari batas limit bulanannya.
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl space-y-6">
          <h2 className="text-2xl font-display text-white border-b border-white/10 pb-4">Pengaturan Pemberitahuan</h2>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] rounded-xl transition-colors">
              <div>
                <h4 className="text-base font-medium text-white">Notifikasi Batas Amplop (Warning)</h4>
                <p className="text-sm text-brand-muted mt-1">Kirim peringatan ke seluruh anggota keluarga saat amplop menipis.</p>
              </div>
              <input
                type="checkbox"
                checked={notifWarning}
                onChange={(e) => setNotifWarning(e.target.checked)}
                disabled={!isAdmin}
                className="w-6 h-6 accent-brand-gold rounded border-white/10 bg-white/5 disabled:opacity-50 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] rounded-xl transition-colors">
              <div>
                <h4 className="text-base font-medium text-white">Laporan Ringkasan Harian</h4>
                <p className="text-sm text-brand-muted mt-1">Rekap seluruh transaksi harian yang dicatat pada hari tersebut.</p>
              </div>
              <input
                type="checkbox"
                checked={notifDaily}
                onChange={(e) => setNotifDaily(e.target.checked)}
                disabled={!isAdmin}
                className="w-6 h-6 accent-brand-gold rounded border-white/10 bg-white/5 disabled:opacity-50 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] rounded-xl transition-colors">
              <div>
                <h4 className="text-base font-medium text-white">Analisis Cash Flow Bulanan</h4>
                <p className="text-sm text-brand-muted mt-1">Dapatkan insight gaya belanja cerdas pada setiap awal bulan.</p>
              </div>
              <input
                type="checkbox"
                checked={notifMonthly}
                onChange={(e) => setNotifMonthly(e.target.checked)}
                disabled={!isAdmin}
                className="w-6 h-6 accent-brand-gold rounded border-white/10 bg-white/5 disabled:opacity-50 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save & Reset Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 pb-12">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3.5 text-sm font-medium text-brand-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            Batal & Kembali
          </button>
          {isAdmin && (
            <button
              type="submit"
              disabled={isSaving}
              className="bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight px-8 py-3.5 rounded-xl font-medium transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(246,224,181,0.15)] disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-5 h-5 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Simpan Konfigurasi"
              )}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
