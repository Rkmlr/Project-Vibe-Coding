"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [familyId, setFamilyId] = useState(null);
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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, family_id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/dashboard");
        return;
      }

      setRole(profile.role);
      setFamilyId(profile.family_id);

      if (profile.family_id) {
        const { data: family } = await supabase
          .from("families")
          .select("name")
          .eq("id", profile.family_id)
          .single();

        if (family) {
          setFamilyName(family.name);
        }
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [router]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaved(false);
    setIsSaving(true);

    try {
      const supabase = createClient();

      if (role !== "admin") {
        setError("Hanya admin (Orang Tua) yang dapat memperbarui pengaturan keluarga.");
        setIsSaving(false);
        return;
      }

      if (familyId) {
        const { error: updateError } = await supabase
          .from("families")
          .update({ name: familyName })
          .eq("id", familyId);

        if (updateError) {
          throw new Error(updateError.message);
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
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
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="font-display text-4xl text-white mb-2">Pengaturan Sistem</h1>
        <p className="text-brand-muted text-lg">Konfigurasi preferensi keluarga, batasan peringatan, dan pemberitahuan.</p>
      </div>

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

      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* Family Profile Configuration */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl space-y-5">
          <h2 className="text-xl font-display text-white border-b border-white/5 pb-3">Profil Keluarga</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-brand-muted mb-1.5 font-medium">Nama Grup Keluarga</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-brand-muted focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs text-brand-muted mb-1.5 font-medium">Mata Uang Utama</label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-brand-slate border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all text-sm appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="IDR">IDR (Rupiah Indonesia)</option>
                <option value="USD">USD (Dolar Amerika)</option>
                <option value="SGD">SGD (Dolar Singapura)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Warning & Alerts Configuration */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl space-y-5">
          <h2 className="text-xl font-display text-white border-b border-white/5 pb-3">Batasan & Peringatan Anggaran</h2>
          
          <div>
            <label className="block text-xs text-brand-muted mb-1.5 font-medium flex justify-between">
              <span>Batas Persentase Warning: {alertLimit}%</span>
              <span>Default: 15%</span>
            </label>
            <input
              type="range"
              min="5"
              max="35"
              step="5"
              value={alertLimit}
              onChange={(e) => setAlertLimit(Number(e.target.value))}
              disabled={!isAdmin}
              className="w-full h-1.5 bg-brand-midnight rounded-lg appearance-none cursor-pointer accent-brand-gold disabled:opacity-50"
            />
            <p className="text-[11px] text-brand-muted mt-2">
              Sistem akan memicu status <span className="text-red-400 font-mono">Warning</span> jika saldo tersisa di amplop bernilai kurang dari {alertLimit}% dari batas limit bulanannya.
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 shadow-2xl space-y-5">
          <h2 className="text-xl font-display text-white border-b border-white/5 pb-3">Pengaturan Pemberitahuan</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Notifikasi Batas Amplop (Warning)</h4>
                <p className="text-xs text-brand-muted mt-0.5">Kirim email/dorong notifikasi saat amplop menipis.</p>
              </div>
              <input
                type="checkbox"
                checked={notifWarning}
                onChange={(e) => setNotifWarning(e.target.checked)}
                disabled={!isAdmin}
                className="w-5 h-5 accent-brand-gold rounded border-white/10 bg-white/5 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Laporan Ringkasan Harian</h4>
                <p className="text-xs text-brand-muted mt-0.5">Ringkasan transaksi yang dicatat anggota setiap sore hari.</p>
              </div>
              <input
                type="checkbox"
                checked={notifDaily}
                onChange={(e) => setNotifDaily(e.target.checked)}
                disabled={!isAdmin}
                className="w-5 h-5 accent-brand-gold rounded border-white/10 bg-white/5 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Analisis Cash Flow Bulanan</h4>
                <p className="text-xs text-brand-muted mt-0.5">Kirim tips & rekomendasi realokasi saldo cerdas setiap awal bulan.</p>
              </div>
              <input
                type="checkbox"
                checked={notifMonthly}
                onChange={(e) => setNotifMonthly(e.target.checked)}
                disabled={!isAdmin}
                className="w-5 h-5 accent-brand-gold rounded border-white/10 bg-white/5 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Save & Reset Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-5 py-3 text-sm font-medium text-brand-muted hover:text-white transition-colors cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
          {isAdmin && (
            <button
              type="submit"
              disabled={isSaving}
              className="bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight px-6 py-3 rounded-lg font-medium text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></span>
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
