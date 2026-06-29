"use client"; // Error components must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Global Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in-up">
      <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-2xl max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl text-white font-semibold mb-4">Terjadi Kesalahan!</h2>
        <p className="text-brand-muted mb-8">
          Sistem mendeteksi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => reset()}
            className="bg-brand-gold text-brand-midnight px-6 py-2.5 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
          >
            Coba Lagi
          </button>
          <Link
            href="/dashboard"
            className="bg-transparent border border-brand-midnight text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-midnight transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
