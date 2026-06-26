"use client";

import { useState } from "react";

export default function FinancialCharts({ envelopes = [], transactions = [] }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // 1. Process Donut Chart Data (Budget by Category)
  const categoryLimits = envelopes.reduce(
    (acc, env) => {
      const limit = parseFloat(env.limit_amount || env.limit || 0);
      if (env.category === "NEEDS") acc.NEEDS += limit;
      else if (env.category === "WANTS") acc.WANTS += limit;
      else if (env.category === "SAVINGS") acc.SAVINGS += limit;
      return acc;
    },
    { NEEDS: 0, WANTS: 0, SAVINGS: 0 }
  );

  const totalLimit = categoryLimits.NEEDS + categoryLimits.WANTS + categoryLimits.SAVINGS;

  const categoryConfigs = [
    { key: "NEEDS", label: "NEEDS (Pokok)", amount: categoryLimits.NEEDS, color: "#F6E0B5", ideal: 50 },
    { key: "WANTS", label: "WANTS (Keinginan)", amount: categoryLimits.WANTS, color: "#98FB98", ideal: 30 },
    { key: "SAVINGS", label: "SAVINGS (Tabungan)", amount: categoryLimits.SAVINGS, color: "#60A5FA", ideal: 20 },
  ];

  // Circle geometry for SVG Donut
  const r = 50;
  const cx = 75;
  const cy = 75;
  const circumference = 2 * Math.PI * r; // ~314.16

  let accumulatedPercentage = 0;
  const donutSlices = categoryConfigs
    .filter(cat => totalLimit > 0 && cat.amount > 0)
    .map(cat => {
      const percentage = (cat.amount / totalLimit) * 100;
      const strokeDashoffset = circumference - (percentage / 100) * circumference;
      const rotation = (accumulatedPercentage / 100) * 360;
      accumulatedPercentage += percentage;
      return {
        ...cat,
        percentage,
        strokeDashoffset,
        rotation,
      };
    });

  // 2. Process Bar Chart Data (Spent vs Limit per Envelope)
  const envelopeData = envelopes.map(env => {
    const limit = parseFloat(env.limit_amount || env.limit || 0);
    
    // Sum of all EXPENSE transactions for this envelope
    const envExpenses = transactions.filter(
      t => t.envelope_id === env.id && t.type === "EXPENSE"
    );
    const spent = envExpenses.reduce(
      (sum, t) => sum + Math.abs(parseFloat(t.amount || 0)),
      0
    );

    return {
      id: env.id,
      name: env.name,
      limit,
      spent,
      category: env.category,
      percentage: limit > 0 ? (spent / limit) * 100 : 0,
    };
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (cat) => {
    if (cat === "NEEDS") return "text-brand-gold bg-brand-gold/10 border-brand-gold/20";
    if (cat === "WANTS") return "text-brand-sage bg-brand-sage/10 border-brand-sage/20";
    return "text-blue-400 bg-blue-400/10 border-blue-400/20";
  };

  const activeSlice = hoveredSlice || (donutSlices.length > 0 ? donutSlices[0] : null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h2 className="font-display text-2xl text-white">Analisis Kesehatan Finansial</h2>
        <span className="text-xs text-brand-muted font-mono uppercase tracking-widest">Live Report</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Donut Chart: Budget Allocation */}
        <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="mb-4">
            <h3 className="text-white font-medium text-lg">Alokasi Anggaran Kategori</h3>
            <p className="text-xs text-brand-muted mt-1">Pembagian batas limit bulanan (Rasio Ideal: 50/30/20).</p>
          </div>

          {totalLimit > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
              {/* Donut SVG */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg width="150" height="150" viewBox="0 0 150 150" className="transform -rotate-90">
                  {/* Background Circle */}
                  <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#1f2937" strokeWidth="14" />
                  
                  {/* Slices */}
                  {donutSlices.map((slice, idx) => (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={hoveredSlice?.key === slice.key ? "18" : "14"}
                      strokeDasharray={circumference}
                      strokeDashoffset={slice.strokeDashoffset}
                      transform={`rotate(${slice.rotation} ${cx} ${cy})`}
                      className="transition-all duration-300 cursor-pointer origin-center"
                      onMouseEnter={() => setHoveredSlice(slice)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  ))}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
                  {activeSlice ? (
                    <>
                      <span className="text-[10px] text-brand-muted uppercase font-mono tracking-widest">{activeSlice.key}</span>
                      <span className="text-white font-semibold text-base mt-0.5">{activeSlice.percentage.toFixed(0)}%</span>
                      <span className="text-[9px] text-brand-gold font-mono mt-0.5">{formatCurrency(activeSlice.amount)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-brand-muted font-mono">No Data</span>
                  )}
                </div>
              </div>

              {/* Legends */}
              <div className="space-y-3 w-full max-w-[200px]">
                {categoryConfigs.map((cat) => {
                  const slice = donutSlices.find(s => s.key === cat.key);
                  const actualPct = slice ? slice.percentage : 0;
                  
                  return (
                    <div 
                      key={cat.key} 
                      className={`p-2 rounded-lg transition-all border ${
                        hoveredSlice?.key === cat.key 
                          ? "bg-white/5 border-white/20" 
                          : "border-transparent"
                      }`}
                      onMouseEnter={() => setHoveredSlice(slice || null)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                          <span className="text-white font-medium">{cat.key}</span>
                        </div>
                        <span className="font-mono text-brand-muted">{actualPct.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-brand-muted mt-1 px-4">
                        <span>Limit: {formatCurrency(cat.amount)}</span>
                        <span>Ideal: {cat.ideal}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-brand-muted italic">
              Belum ada limit amplop diatur.
            </div>
          )}
        </div>

        {/* Bar Chart: Spent vs Limit */}
        <div className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-sage/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="mb-4">
            <h3 className="text-white font-medium text-lg">Tren Pengeluaran vs Batas</h3>
            <p className="text-xs text-brand-muted mt-1">Perbandingan limit anggaran vs pengeluaran riil.</p>
          </div>

          <div className="space-y-4 max-h-[175px] overflow-y-auto pr-1">
            {envelopeData.map((env) => {
              const overspent = env.spent > env.limit;
              
              return (
                <div key={env.id} className="space-y-1.5">
                  <div className="flex justify-between items-end text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{env.name}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border uppercase ${getCategoryColor(env.category)}`}>
                        {env.category}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-right">
                      <span className={overspent ? "text-red-400 font-bold" : "text-brand-sage"}>
                        {formatCurrency(env.spent)}
                      </span>
                      <span className="text-brand-muted"> / {formatCurrency(env.limit)}</span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-2 w-full bg-brand-midnight rounded-full overflow-hidden relative">
                    {/* Limit marker or background */}
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        overspent 
                          ? "bg-red-500" 
                          : env.percentage >= 85 
                          ? "bg-brand-gold" 
                          : "bg-brand-sage"
                      }`}
                      style={{ width: `${Math.min(env.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {envelopeData.length === 0 && (
              <div className="py-12 text-center text-xs text-brand-muted italic">
                Belum ada data amplop.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
