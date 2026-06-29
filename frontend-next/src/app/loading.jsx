export default function Loading() {
  return (
    <div className="fixed inset-0 bg-brand-dark flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-brand-midnight border-t-brand-gold rounded-full animate-spin"></div>
      <p className="mt-6 text-brand-gold font-mono text-sm uppercase tracking-widest animate-pulse">
        Loading...
      </p>
    </div>
  );
}
