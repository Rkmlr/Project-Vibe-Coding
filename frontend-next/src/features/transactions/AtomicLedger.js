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
            <button className="text-[10px] text-brand-gold bg-brand-gold/10 hover:bg-brand-gold/25 border border-brand-gold/20 px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-mono uppercase tracking-wider font-semibold">
              Ekspor
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <button className="text-xs text-brand-muted hover:text-white transition-colors uppercase tracking-widest font-mono">
              Lihat Semua ({transactions.length})
            </button>
          )}
        </div>
      </div>
      
      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
        <div className="divide-y divide-white/5">
          {displayedTransactions.map((tx) => (
            <div key={tx.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${tx.type === 'EXPENSE' ? 'bg-red-400/10 text-red-400' : 'bg-brand-sage/10 text-brand-sage'}`}>
                  {tx.type === 'EXPENSE' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  )}
                </div>
                <div>
                  <div className="text-sm text-white font-medium flex items-center gap-2">
                    {tx.desc}
                    {tx.category && (
                      <span className="text-[10px] text-brand-gold/80 bg-brand-gold/5 px-1.5 py-0.5 rounded border border-brand-gold/10">
                        {tx.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-brand-muted font-mono uppercase px-1.5 py-0.5 bg-brand-midnight rounded">{tx.id}</span>
                    <span className="text-xs text-brand-muted">{tx.envelope}</span>
                    {tx.source === "IOT_WEBHOOK" && (
                      <span className="text-[10px] text-brand-gold border border-brand-gold/30 px-1 rounded-sm flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-brand-gold animate-pulse"></span> IoT
                      </span>
                    )}
                    {tx.tags && tx.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] text-white/40 font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className={`font-mono text-sm ${tx.type === 'EXPENSE' ? 'text-white' : 'text-brand-sage'}`}>
                  {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                </div>
                <div className="text-[10px] text-brand-muted mt-1 font-mono">
                  {new Date(tx.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {displayedTransactions.length === 0 && (
            <div className="p-8 text-center text-brand-muted text-sm italic">
              Belum ada transaksi tercatat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
