"use client";

import { useState } from "react";

export default function MilestoneTracker() {
  const [milestones, setMilestones] = useState([
    {
      id: "M_1",
      name: "Dana Pendidikan Balita",
      target: 100000000,
      current: 45000000,
      targetDate: "Desember 2027",
      predictedDate: "Maret 2027",
      status: "faster", // faster, normal, slower
      statusText: "Lebih cepat 9 bulan dari target!",
    },
    {
      id: "M_2",
      name: "Dana Liburan Keluarga",
      target: 15000000,
      current: 7500000,
      targetDate: "Desember 2026",
      predictedDate: "Oktober 2026",
      status: "normal",
      statusText: "Sesuai rencana",
    },
    {
      id: "M_3",
      name: "Dana Darurat (6x Pengeluaran)",
      target: 30000000,
      current: 12000000,
      targetDate: "Juni 2027",
      predictedDate: "Agustus 2027",
      status: "slower",
      statusText: "Terlambat 2 bulan dari target",
    },
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden shadow-2xl">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-sage/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-lg font-display text-white">Milestone Finansial</h3>
          <p className="text-xs text-brand-muted mt-1">Prediksi pencapaian berdasarkan histori cash flow.</p>
        </div>
        <span className="text-[10px] bg-brand-sage/10 text-brand-sage border border-brand-sage/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
          Smart Predict
        </span>
      </div>

      <div className="space-y-6">
        {milestones.map((ms) => {
          const percentage = (ms.current / ms.target) * 100;
          let statusBadgeColor = "text-brand-sage bg-brand-sage/10 border-brand-sage/20";
          let progressColor = "bg-brand-sage";

          if (ms.status === "faster") {
            statusBadgeColor = "text-brand-gold bg-brand-gold/10 border-brand-gold/20";
            progressColor = "bg-brand-gold";
          } else if (ms.status === "slower") {
            statusBadgeColor = "text-red-400 bg-red-400/10 border-red-400/20";
            progressColor = "bg-red-400";
          }

          return (
            <div key={ms.id} className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-white">{ms.name}</h4>
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    Target: {ms.targetDate} • Prediksi: {ms.predictedDate}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${statusBadgeColor}`}>
                  {ms.statusText}
                </span>
              </div>

              {/* Progress Bar & Info */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-brand-midnight rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${progressColor} transition-all duration-1000`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs font-mono text-brand-muted">
                  <span>{formatCurrency(ms.current)}</span>
                  <span>{percentage.toFixed(0)}% / {formatCurrency(ms.target)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
