import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in-up">
      <div className="text-brand-gold font-display text-8xl md:text-9xl mb-4">404</div>
      <h2 className="text-2xl md:text-3xl text-white font-medium text-center mb-6">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-brand-muted text-center max-w-md mb-8">
        Maaf, halaman yang Anda cari mungkin telah dihapus, diubah namanya, atau tidak pernah ada.
      </p>
      <Link 
        href="/dashboard"
        className="bg-brand-gold text-brand-midnight px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
