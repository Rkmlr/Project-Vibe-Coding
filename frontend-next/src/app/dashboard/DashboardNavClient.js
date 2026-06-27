"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/features/authentication/actions";

export default function DashboardNavClient({ profile }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const displayName = profile?.display_name || "User";
  const roleName = profile?.role === "admin" ? "Orang Tua / Pengelola" : "Anggota Keluarga / Anak";
  const familyName = profile?.families?.name || "Keluarga";
  const inviteCode = profile?.families?.invite_code || "";

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLogoutClick = async () => {
    await logout();
    window.location.href = "/";
  };

  const isAdmin = profile?.role === "admin";

  return (
    <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-lg">
            <div className="w-8 h-8 rounded bg-brand-slate border border-brand-gold/20 flex items-center justify-center transition-colors group-hover:border-brand-gold/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-brand-gold transition-colors">FamFi</span>
          </Link>

          {isOnline ? (
            <span className="flex items-center gap-1.5 text-[10px] text-brand-sage font-mono bg-brand-sage/10 border border-brand-sage/20 px-2.5 py-0.5 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sage animate-pulse"></span> Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full animate-pulse font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Offline
            </span>
          )}

          {inviteCode && (
            <span className="hidden sm:inline-block text-[10px] text-brand-gold/70 font-mono bg-brand-gold/5 border border-brand-gold/10 px-2.5 py-0.5 rounded-full">
              Kode Grup: {inviteCode}
            </span>
          )}
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link 
            href="/dashboard" 
            className={`${pathname === "/dashboard" ? "text-brand-gold border-b border-brand-gold" : "text-brand-muted hover:text-white"} pb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded`}
          >
            Ledger
          </Link>
          {isAdmin && (
            <>
              <Link 
                href="/dashboard/logs" 
                className={`${pathname === "/dashboard/logs" ? "text-brand-gold border-b border-brand-gold" : "text-brand-muted hover:text-white"} pb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded`}
              >
                Log Audit
              </Link>
              <Link 
                href="/dashboard/members" 
                className={`${pathname === "/dashboard/members" ? "text-brand-gold border-b border-brand-gold" : "text-brand-muted hover:text-white"} pb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded`}
              >
                Anggota
              </Link>
              <Link 
                href="/dashboard/settings" 
                className={`${pathname === "/dashboard/settings" ? "text-brand-gold border-b border-brand-gold" : "text-brand-muted hover:text-white"} pb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded`}
              >
                Pengaturan
              </Link>
            </>
          )}
          <button onClick={handleLogoutClick} className="text-brand-muted hover:text-red-400 transition-colors pb-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded">
            Keluar
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs text-brand-muted font-mono uppercase tracking-widest">{familyName}</span>
            <span className="text-sm text-white font-medium">{displayName} ({profile?.role === "admin" ? "Orang Tua" : "Anak"})</span>
          </div>
          <button aria-label="Profil Pengguna" className="w-9 h-9 rounded-full bg-brand-slate border border-white/10 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
            <span className="font-display font-bold text-sm text-brand-gold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </button>
          <button 
            className="md:hidden text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={isMobileMenuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass-card border-t border-white/5 py-4 px-6 flex flex-col gap-4">
          <Link href="/dashboard" className="text-brand-gold font-medium" onClick={() => setIsMobileMenuOpen(false)}>Ledger</Link>
          {isAdmin && (
            <>
              <Link href="/dashboard/logs" className="text-brand-muted hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Log Audit</Link>
              <Link href="/dashboard/members" className="text-brand-muted hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Anggota</Link>
              <Link href="/dashboard/settings" className="text-brand-muted hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Pengaturan</Link>
            </>
          )}
          {inviteCode && (
            <div className="text-[10px] text-brand-gold/70 font-mono bg-brand-gold/5 border border-brand-gold/10 px-3 py-1.5 rounded-lg">
              Kode Grup Keluarga: {inviteCode}
            </div>
          )}
          <button onClick={handleLogoutClick} className="text-left text-brand-muted hover:text-red-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded px-1">
            Keluar
          </button>
        </div>
      )}
    </nav>
  );
}
