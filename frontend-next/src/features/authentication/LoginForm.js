"use client";

import { useState } from "react";
import { login, signup } from "./actions";

export default function LoginForm() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [familyMode, setFamilyMode] = useState("create"); // "create" or "join"
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("mode", familyMode);

    try {
      let res;
      if (isLoginMode) {
        res = await login(formData);
      } else {
        res = await signup(null, formData);
      }

      if (res && res.error) {
        setError(res.error);
        setIsLoading(false);
      } else if (res && res.success) {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan sistem.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 glass-card rounded-2xl border border-brand-gold/10 relative overflow-hidden shadow-2xl transition-all duration-300">
      {/* Glow Effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-8">
        <button
          type="button"
          onClick={() => {
            setIsLoginMode(true);
            setError("");
          }}
          className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
            isLoginMode ? "text-brand-gold font-semibold" : "text-brand-muted hover:text-white"
          }`}
        >
          Masuk
          {isLoginMode && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-gold animate-fade-in"></span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsLoginMode(false);
            setError("");
          }}
          className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
            !isLoginMode ? "text-brand-gold font-semibold" : "text-brand-muted hover:text-white"
          }`}
        >
          Daftar Baru
          {!isLoginMode && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-gold animate-fade-in"></span>
          )}
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-white mb-2">
          {isLoginMode ? "Selamat Datang di FamFi" : "Buat Akun Keluarga Baru"}
        </h2>
        <p className="text-brand-muted text-xs">
          {isLoginMode
            ? "Mulai memantau anggaran rumah tangga Anda"
            : "Daftar dan kelola uang belanja bersama keluarga"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg font-mono leading-relaxed">
            {error}
          </div>
        )}

        {/* Signup-only field: Display Name */}
        {!isLoginMode && (
          <div className="space-y-2">
            <label className="text-[10px] text-brand-muted uppercase tracking-wider font-mono block">
              Nama Anda (Panggilan di Keluarga)
            </label>
            <input
              type="text"
              name="displayName"
              placeholder="cth: Bapak, Ibu, Kakak, Sarah"
              required
              className="w-full bg-brand-midnight border border-white/10 text-white p-3 rounded-lg outline-none focus:border-brand-gold/50 transition-colors placeholder-white/20 font-sans text-sm"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] text-brand-muted uppercase tracking-wider font-mono block">
            Alamat Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="nama@email.com"
            required
            className="w-full bg-brand-midnight border border-white/10 text-white p-3 rounded-lg outline-none focus:border-brand-gold/50 transition-colors placeholder-white/20 font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-brand-muted uppercase tracking-wider font-mono block">
            Kata Sandi
          </label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full bg-brand-midnight border border-white/10 text-white p-3 rounded-lg outline-none focus:border-brand-gold/50 transition-colors placeholder-white/20 font-mono text-sm"
          />
        </div>

        {/* Signup-only options: Onboarding (Create vs Join family) */}
        {!isLoginMode && (
          <div className="space-y-4 pt-2 border-t border-white/5">
            <label className="text-[10px] text-brand-muted uppercase tracking-wider font-mono block">
              Pilihan Grup Keluarga
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFamilyMode("create")}
                className={`py-2 px-3 text-xs rounded-lg border font-medium transition-all ${
                  familyMode === "create"
                    ? "bg-brand-gold/10 border-brand-gold text-brand-gold"
                    : "bg-brand-midnight border-white/5 text-brand-muted hover:text-white"
                }`}
              >
                Buat Keluarga Baru
              </button>
              <button
                type="button"
                onClick={() => setFamilyMode("join")}
                className={`py-2 px-3 text-xs rounded-lg border font-medium transition-all ${
                  familyMode === "join"
                    ? "bg-brand-gold/10 border-brand-gold text-brand-gold"
                    : "bg-brand-midnight border-white/5 text-brand-muted hover:text-white"
                }`}
              >
                Gabung Keluarga
              </button>
            </div>

            {familyMode === "create" ? (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] text-brand-muted uppercase tracking-wider font-mono block">
                  Nama Keluarga Baru
                </label>
                <input
                  type="text"
                  name="familyName"
                  placeholder="cth: Keluarga Adhi"
                  required={familyMode === "create"}
                  className="w-full bg-brand-midnight border border-white/10 text-white p-3 rounded-lg outline-none focus:border-brand-gold/50 transition-colors placeholder-white/20 font-sans text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] text-brand-muted uppercase tracking-wider font-mono block">
                  Kode Undangan Keluarga
                </label>
                <input
                  type="text"
                  name="inviteCode"
                  placeholder="cth: ADHI-7798"
                  required={familyMode === "join"}
                  className="w-full bg-brand-midnight border border-white/10 text-white p-3 rounded-lg outline-none focus:border-brand-gold/50 transition-colors placeholder-white/20 font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight py-3 rounded-lg font-medium transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-[0_4px_20px_rgba(246,224,181,0.15)] flex items-center justify-center gap-2 mt-4 cursor-pointer"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-brand-midnight border-t-transparent rounded-full animate-spin"></span>
          ) : (
            isLoginMode ? "Akses Ruang Kerja" : "Daftar & Onboarding"
          )}
        </button>
      </form>
    </div>
  );
}
