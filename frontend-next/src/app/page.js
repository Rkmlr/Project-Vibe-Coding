"use client";

import { useState } from "react";
import LoginForm from "@/features/authentication/LoginForm";

export default function Home() {
  const [view, setView] = useState("user"); // 'user' or 'admin'
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden bg-brand-midnight text-brand-muted">
      {/* Elegant Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-gold/5 rounded-full blur-[150px] animate-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-sage/5 rounded-full blur-[120px] animate-glow" style={{ animationDelay: "3s" }}></div>
      </div>

      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-brand-slate border border-brand-gold/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">Fam<span className="text-brand-gold">Fi</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex p-1 rounded-full bg-brand-slate/50 border border-white/5">
              <button 
                onClick={() => setView("user")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${view === "user" ? "bg-brand-gold text-brand-midnight shadow-lg" : "text-brand-muted hover:text-white"}`}
              >
                Anggota Keluarga
              </button>
              <button 
                onClick={() => setView("admin")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${view === "admin" ? "bg-brand-gold text-brand-midnight shadow-lg" : "text-brand-muted hover:text-white"}`}
              >
                Manajer Keuangan
              </button>
            </div>
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer"
            >
              Masuk
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
        {/* Dynamic Hero Section */}
        <section className="flex flex-col items-center text-center mt-8 animate-fade-in-up">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white max-w-4xl leading-tight">
            {view === "user" ? (
              <>Lindungi masa depan finansial keluarga. <br/><span className="text-gold-gradient italic">Satu amplop setiap waktu.</span></>
            ) : (
              <>Kendali penuh atas arus kas. <br/><span className="text-gold-gradient italic">Akurasi finansial mutlak.</span></>
            )}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed opacity-90">
            {view === "user" 
              ? "Alokasikan dana ke dalam amplop digital, lacak pengeluaran bersama secara instan, dan pantau wawasan personal yang memandu keluarga Anda mencapai target keuangan."
              : "Orkestrasikan arus kas keluarga dengan presisi tinggi. Hubungkan dengan webhook perangkat IoT fisik, kelola akses setiap anggota, dan jaga keamanan log aktivitas yang tidak bisa dimanipulasi."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 mb-24">
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight px-8 py-3.5 rounded font-medium transition-all transform hover:-translate-y-1 shadow-[0_4px_20px_rgba(246,224,181,0.2)] cursor-pointer"
            >
              {view === "user" ? "Buat Amplop Anda" : "Konfigurasi Akses Keluarga"}
            </button>
            <button className="glass-card px-8 py-3.5 rounded font-medium text-white hover:bg-white/5 transition-colors">
              {view === "user" ? "Lihat Wawasan Bulanan" : "Tinjau Log Keamanan"}
            </button>
          </div>

          {/* Signature Aesthetic Element: The Ledger/Envelope Visualization */}
          <div className="w-full max-w-4xl h-80 glass-card rounded-xl p-8 relative flex flex-col justify-between overflow-hidden group">
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <h3 className="font-display text-2xl text-white">
                {view === "user" ? "Alokasi Anggaran Rumah Tangga" : "Transaksi Ledger Atomik"}
              </h3>
              <span className="font-mono text-xs text-brand-gold uppercase tracking-widest">Sinkronisasi Aktif</span>
            </div>
            
            <div className="flex-1 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {view === "user" ? (
                <>
                  {[
                    { label: "Kebutuhan Pokok", spent: 4500000, total: 6000000 },
                    { label: "Pendidikan", spent: 1200000, total: 1200000 },
                    { label: "Dana Liburan", spent: 1500000, total: 5000000 }
                  ].map((env, i) => (
                    <div key={i} className="bg-brand-slate/40 border border-white/5 rounded-lg p-5 flex flex-col justify-between transition-colors hover:border-brand-gold/30">
                      <div className="text-sm text-white mb-4">{env.label}</div>
                      <div>
                        <div className="font-mono text-xl md:text-2xl text-brand-gold mb-2">{(env.spent / 1000000).toFixed(1)}jt <span className="text-sm text-brand-muted">/ {(env.total / 1000000).toFixed(1)}jt</span></div>
                        <div className="h-1 w-full bg-brand-midnight rounded overflow-hidden">
                          <div className={`h-full ${env.spent === env.total ? 'bg-brand-sage' : 'bg-brand-gold'}`} style={{ width: `${(env.spent/env.total)*100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="col-span-3 space-y-3 font-mono text-sm opacity-80">
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage">TX_7F9A2</span>
                      <span className="text-white">SELECT ... FOR UPDATE</span>
                      <span className="text-brand-gold">LOCKED</span>
                    </div>
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage">TX_7F9A2</span>
                      <span className="text-white">UPDATE envelopes SET balance = balance - 15</span>
                      <span className="text-brand-gold">SUCCESS</span>
                    </div>
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage">TX_7F9A2</span>
                      <span className="text-white">INSERT INTO activity_logs</span>
                      <span className="text-brand-gold">COMMITTED</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Tailored Features Section */}
        <section id="features" className="mt-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl text-white mb-6">
                {view === "user" ? "Orkestrasikan pengeluaran harian." : "Infrastruktur tanpa kompromi."}
              </h2>
              <p className="text-lg leading-relaxed mb-8">
                {view === "user" 
                  ? "Distribusikan pendapatan ke dalam amplop digital yang disiplin. Terima peringatan halus sebelum melewati batas anggaran, dan alokasikan sisa dana hanya dengan satu sentuhan untuk memastikan stabilitas neraca rumah tangga."
                  : "Dibangun menggunakan ElysiaJS dan Bun, sistem ini menerapkan penguncian pesimis untuk memberantas kondisi balapan (race condition). Hubungkan ke tombol webhook ESP8266 untuk mencatat pengeluaran rutin secara instan tanpa perlu membuka browser."}
              </p>
              
              <ul className="space-y-4">
                {[
                  view === "user" ? "Sistem Amplop Super Ketat" : "Penguncian Database Tingkat Lanjut",
                  view === "user" ? "Pelacakan Real-Time Bersama" : "Integrasi Perangkat Keras IoT Webhook",
                  view === "user" ? "Wawasan Bulanan yang Informatif" : "Jejak Audit Aktivitas yang Kekal"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold"></div>
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass-card p-10 rounded-xl relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-gold/10 rounded-full blur-2xl"></div>
              {view === "user" ? (
                <div className="space-y-6">
                  <div className="border-l-2 border-brand-gold pl-5 py-2">
                    <div className="text-xs text-brand-gold uppercase tracking-widest mb-2">Wawasan Finansial</div>
                    <p className="text-white font-serif text-lg italic">"Anda telah menjaga disiplin yang ketat di amplop Kebutuhan Pokok bulan ini. Kami merekomendasikan pemindahan sisa Rp1,5 Juta ini menuju Dana Liburan."</p>
                  </div>
                  <button className="w-full bg-brand-slate hover:bg-brand-slate/80 text-white border border-white/10 py-3 rounded text-sm transition-colors">
                    Realisasikan Pemindahan
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-l-2 border-brand-sage pl-5 py-2">
                    <div className="text-xs text-brand-sage uppercase tracking-widest mb-2">Entri Log Audit</div>
                    <p className="text-white font-mono text-sm">Aksi: SOFT_DELETE<br/>Target: envelopes_table (ID: ENV_90X)<br/>Aktor: Admin_Keluarga</p>
                  </div>
                  <button className="w-full bg-brand-slate hover:bg-brand-slate/80 text-white border border-white/10 py-3 rounded text-sm transition-colors">
                    Inspeksi Seluruh Jejak
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070A11] pt-16 pb-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl text-white mb-8">Amankan kebenaran finansial keluarga Anda.</h2>
          <button 
            onClick={() => setIsAuthOpen(true)}
            className="bg-brand-gold text-brand-midnight px-8 py-3 rounded font-medium transition-transform hover:-translate-y-1 cursor-pointer"
          >
            Inisialisasi Ruang Kerja
          </button>
          
          <div className="mt-16 text-sm flex flex-col md:flex-row justify-between items-center opacity-60">
            <div>&copy; 2026 Arsitektur FamFi.</div>
            <div className="mt-4 md:mt-0 space-x-6">
              <a href="#" className="hover:text-white">Keamanan</a>
              <a href="#" className="hover:text-white">Referensi API</a>
              <a href="#" className="hover:text-white">Dokumen Visi</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-midnight/85 backdrop-blur-md animate-fade-in animate-duration-200">
          <div className="relative w-full max-w-md mx-4 animate-fade-in-up">
            <button 
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white transition-colors z-10 text-lg font-bold font-mono cursor-pointer"
            >
              ✕
            </button>
            <LoginForm />
          </div>
        </div>
      )}
    </div>
  );
}
