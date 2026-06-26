"use client";

import { useState } from "react";
import LoginForm from "@/features/authentication/LoginForm";

export default function Home() {
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
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">Fam<span className="text-brand-gold">Fi</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              id="btn-nav-login"
              onClick={() => setIsAuthOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded text-sm font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-gold outline-none"
            >
              Masuk
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
        {/* Dynamic Hero Section */}
        <section className="flex flex-col items-center text-center mt-8 animate-fade-in-up">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white max-w-4xl leading-tight text-balance">
            Keuangan keluarga yang lebih baik. <br/><span className="text-gold-gradient italic">Satu amplop digital setiap waktu.</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed opacity-90 text-balance text-brand-muted">
            FamFi membantu keluarga Anda mengelola uang dengan mudah. Tentukan anggaran belanja, lacak pengeluaran bersama secara real-time, dan capai tujuan finansial dengan aman.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 mb-24">
            <button 
              id="btn-hero-cta"
              onClick={() => setIsAuthOpen(true)}
              className="bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight px-8 py-3.5 rounded font-medium transition-all transform hover:-translate-y-1 shadow-[0_4px_20px_rgba(246,224,181,0.2)] cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 outline-none"
            >
              Buat Amplop Anda
            </button>
            <button className="glass-card px-8 py-3.5 rounded font-medium text-white hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold outline-none">
              Pelajari Lebih Lanjut
            </button>
          </div>

          {/* Signature Aesthetic Element: The Ledger/Envelope Visualization */}
          <div className="w-full max-w-4xl glass-card rounded-xl p-8 relative flex flex-col justify-between overflow-hidden group">
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <h2 className="font-display text-2xl text-white text-balance">
                Alokasi Anggaran & Log Aktivitas
              </h2>
              <span className="font-mono text-xs text-brand-gold uppercase tracking-widest">Sinkronisasi Aktif</span>
            </div>
            
            <div className="flex-1 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Envelope Visualization */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-brand-muted uppercase tracking-wider mb-2">Anggaran Bulan Ini</h3>
                {[
                  { label: "Kebutuhan Pokok", spent: 4500000, total: 6000000 },
                  { label: "Pendidikan", spent: 1200000, total: 1200000 },
                  { label: "Dana Liburan", spent: 1500000, total: 5000000 }
                ].map((env, i) => (
                  <div key={i} className="bg-brand-slate/40 border border-white/5 rounded-lg p-4 transition-colors hover:border-brand-gold/30">
                    <div className="text-sm text-white mb-3">{env.label}</div>
                    <div>
                      <div className="font-mono text-lg text-brand-gold mb-2">{(env.spent / 1000000).toFixed(1)}&nbsp;jt <span className="text-xs text-brand-muted">/ {(env.total / 1000000).toFixed(1)}&nbsp;jt</span></div>
                      <div className="h-1 w-full bg-brand-midnight rounded overflow-hidden">
                        <div className={`h-full ${env.spent === env.total ? 'bg-brand-sage' : 'bg-brand-gold'}`} style={{ width: `${(env.spent/env.total)*100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Audit Log Visualization */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-brand-muted uppercase tracking-wider mb-2">Proses Transaksi Aman</h3>
                <div className="space-y-3 font-mono text-xs opacity-90">
                  <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage shrink-0">1. VALIDASI</span>
                      <span className="text-white mx-3 flex-1 text-left font-sans">Mengunci amplop untuk cegah data ganda</span>
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0 text-right">LOCKED</span>
                    </div>
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage shrink-0">2. EKSEKUSI</span>
                      <span className="text-white mx-3 flex-1 text-left font-sans">Memperbarui saldo dengan akurasi tinggi</span>
                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full shrink-0 text-right">SUCCESS</span>
                    </div>
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage shrink-0">3. AUDIT</span>
                      <span className="text-white mx-3 flex-1 text-left font-sans">Menyimpan bukti riwayat secara permanen</span>
                      <span className="bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-2 py-0.5 rounded-full shrink-0 text-right">SECURED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tailored Features Section */}
        <section id="features" className="mt-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl text-white mb-6 text-balance">
                Disiplin finansial yang sederhana dan tepercaya.
              </h2>
              <p className="text-lg leading-relaxed mb-8 text-balance text-brand-muted">
                FamFi membagi pendapatan bulanan keluarga ke dalam kategori belanja khusus. Mencegah pengeluaran berlebih secara kolektif dengan catatan aktivitas yang transparan untuk semua anggota keluarga.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                {[
                  {
                    title: "Amplop Digital",
                    desc: "Alokasikan batas belanja per kategori secara disiplin agar keuangan tetap terkendali.",
                    icon: (
                      <svg aria-hidden="true" className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    )
                  },
                  {
                    title: "Sinkronisasi Instan",
                    desc: "Perubahan anggaran langsung diperbarui dan terlihat oleh seluruh anggota keluarga.",
                    icon: (
                      <svg aria-hidden="true" className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                      </svg>
                    )
                  },
                  {
                    title: "Catatan Keamanan",
                    desc: "Riwayat aktivitas transparan yang tidak dapat dimanipulasi untuk keterbukaan bersama.",
                    icon: (
                      <svg aria-hidden="true" className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )
                  },
                  {
                    title: "Delegasi Akses",
                    desc: "Beri tanggung jawab atas amplop belanja tertentu kepada anggota keluarga tertentu.",
                    icon: (
                      <svg aria-hidden="true" className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    )
                  }
                ].map((feat, idx) => (
                  <div key={idx} className="flex gap-3 text-left">
                    {feat.icon}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1 font-display">{feat.title}</h4>
                      <p className="text-xs text-brand-muted leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-8 rounded-xl relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-gold/10 rounded-full blur-2xl" aria-hidden="true"></div>
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
                  </span>
                  <span className="text-xs text-brand-gold uppercase tracking-widest font-mono">Wawasan Finansial</span>
                </div>
                <span className="bg-brand-gold/10 text-brand-gold text-[10px] font-mono px-2 py-0.5 rounded border border-brand-gold/20">Saran Optimasi</span>
              </div>
              
              <div className="bg-brand-midnight/40 border border-white/5 rounded-lg p-4 mb-4 space-y-3 font-mono text-xs text-left">
                <div className="flex justify-between items-center bg-brand-slate/20 p-2.5 rounded border border-white/5">
                  <span className="text-brand-muted font-sans">Sumber:</span>
                  <span className="text-white font-sans font-medium">Kebutuhan Pokok</span>
                  <span className="text-brand-sage font-mono">Sisa Rp1,5jt</span>
                </div>
                <div className="flex justify-center my-1 text-brand-gold">
                  <svg aria-hidden="true" className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex justify-between items-center bg-brand-slate/20 p-2.5 rounded border border-white/5">
                  <span className="text-brand-muted font-sans">Tujuan:</span>
                  <span className="text-white font-sans font-medium">Dana Liburan</span>
                  <span className="text-brand-gold font-mono">+Rp1,5jt</span>
                </div>
              </div>

              <p className="text-white font-serif text-[15px] leading-relaxed italic border-l-2 border-brand-gold pl-4 py-1 mb-6 text-left">
                “Anda telah menjaga disiplin yang ketat di amplop Kebutuhan Pokok bulan ini. Kami merekomendasikan pemindahan sisa Rp1,5 Juta ini menuju Dana Liburan.”
              </p>

              <button 
                id="btn-optimize-cta"
                onClick={() => setIsAuthOpen(true)}
                className="w-full bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight py-3 rounded font-medium text-sm transition-all transform hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(246,224,181,0.1)] cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
              >
                Optimalkan Anggaran
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070A11] pt-16 pb-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl text-white mb-8 text-balance">Amankan kebenaran finansial keluarga Anda.</h2>
          <button 
            id="btn-footer-cta"
            onClick={() => setIsAuthOpen(true)}
            className="bg-brand-gold text-brand-midnight px-8 py-3 rounded font-medium transition-transform hover:-translate-y-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-white outline-none"
          >
            Inisialisasi Ruang Kerja
          </button>
          
          <div className="mt-16 text-sm flex flex-col md:flex-row justify-between items-center opacity-60">
            <div>&copy; 2026 Arsitektur FamFi.</div>
            <div className="mt-4 md:mt-0 space-x-6">
              <a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-brand-gold outline-none rounded">Keamanan</a>
              <a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-brand-gold outline-none rounded">Referensi API</a>
              <a href="#" className="hover:text-white focus-visible:ring-2 focus-visible:ring-brand-gold outline-none rounded">Dokumen Visi</a>
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
              aria-label="Tutup"
              className="absolute top-4 right-4 text-brand-muted hover:text-white transition-colors z-10 text-lg font-bold font-mono cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-gold outline-none rounded"
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
