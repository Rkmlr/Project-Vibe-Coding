"use client";

export default function AtomicLedger({ transactions = [], title = "Transaksi Atomik", limit = null }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = (format) => {
    let dataStr = "";
    let filename = `transaksi-keluarga.${format}`;
    let mimeType = "";

    if (format === "csv") {
      mimeType = "text/csv;charset=utf-8;";
      const headers = ["ID", "Deskripsi", "Amplop", "Jumlah", "Kategori", "Sumber", "Tanggal", "Tipe"];
      const rows = transactions.map(tx => [
        tx.id,
        tx.desc,
        tx.envelope,
        tx.amount,
        tx.category || "",
        tx.source,
        tx.date,
        tx.type
      ]);
      dataStr = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    } else {
      mimeType = "application/json;charset=utf-8;";
      dataStr = JSON.stringify(transactions, null, 2);
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-white">{title}</h2>
        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative group">
            <button className="text-[10px] text-brand-gold bg-brand-gold/10 hover:bg-brand-gold/25 border border-brand-gold/20 px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-mono uppercase tracking-wider font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
              Ekspor
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-brand-slate border border-white/10 rounded-lg shadow-2xl py-1 z-30 min-w-[90px] animate-in fade-in slide-in-from-top-1 duration-150">
              <button 
                onClick={() => handleExport("csv")} 
                className="w-full text-left px-3 py-1.5 text-xs text-brand-muted hover:text-white hover:bg-white/5 font-mono"
              >
                CSV
              </button>
              <button 
                onClick={() => handleExport("json")} 
                className="w-full text-left px-3 py-1.5 text-xs text-brand-muted hover:text-white hover:bg-white/5 font-mono"
              >
                JSON
              </button>
            </div>
          </div>

          {limit && transactions.length > limit && (
            <button className="text-xs text-brand-muted hover:text-white transition-colors uppercase tracking-widest font-mono focus-visible:outline-none focus-visible:underline">
              Lihat Semua ({transactions.length})
            </button>
          )}
        </div>
      </div>
      
      <div className="glass-card bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <div className="divide-y divide-white/10">
          {displayedTransactions.map((tx) => (
            <div key={tx.id} className="p-5 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4 group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${tx.type === 'EXPENSE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-brand-sage/10 text-brand-sage border border-brand-sage/20'}`}>
                  {tx.type === 'EXPENSE' ? (
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                  ) : (
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  )}
                </div>
                <div>
                  <div className="text-base text-white font-medium flex items-center gap-2 tracking-wide">
                    {tx.desc}
                    {tx.category && (
                      <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full border border-brand-gold/20 uppercase font-mono">
                        {tx.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-brand-muted font-mono uppercase px-2 py-0.5 bg-black/20 rounded-md border border-white/5">{tx.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-muted"></span>
                      <span className="text-xs text-brand-muted/80">{tx.envelope}</span>
                    </div>
                    {tx.source === "IOT_WEBHOOK" && (
                      <span className="text-[10px] text-brand-gold border border-brand-gold/30 px-1.5 py-0.5 rounded-full flex items-center gap-1.5 bg-brand-gold/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span> Koin Otomatis
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right shrink-0 flex flex-col justify-center">
                <div className={`font-mono text-lg font-semibold tabular-nums ${tx.type === 'EXPENSE' ? 'text-white' : 'text-brand-sage'}`}>
                  {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                </div>
                <div className="text-xs text-brand-muted/70 mt-1 font-mono tabular-nums">
                  {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} • {new Date(tx.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {displayedTransactions.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-brand-muted text-sm font-medium">Keluarga belum memiliki catatan transaksi.</p>
              <p className="text-brand-muted/50 text-xs mt-1">Transaksi yang dicatat akan muncul di buku kas ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
