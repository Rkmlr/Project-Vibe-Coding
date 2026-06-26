"use client";

export default function MonthlyInsights({ advice = "", onReallocate }) {
  if (!advice) return null;

  return (
    <div className="glass-card p-6 rounded-xl border border-brand-gold/10 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></div>
        <h2 className="font-display text-xl text-white">Wawasan Finansial</h2>
      </div>
      
      <div className="border-l-2 border-brand-gold pl-4 py-1 mb-6">
        <p className="text-white font-serif text-lg italic leading-relaxed">
          "{advice}"
        </p>
      </div>
      
      {onReallocate && (
        <button 
          onClick={onReallocate}
          className="w-full bg-white/5 hover:bg-white/10 border border-brand-gold/20 text-brand-gold py-2.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          Realisasikan Pemindahan
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      )}
    </div>
  );
}
