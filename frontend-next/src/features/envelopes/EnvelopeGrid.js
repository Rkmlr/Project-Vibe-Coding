"use client";

import { useState } from "react";
import ManageEnvelopeModal from "./ManageEnvelopeModal";
import CloseBookModal from "./CloseBookModal";
import TransferModal from "./TransferModal";

export default function EnvelopeGrid({ envelopes = [], role = "member", members = [], onSuccess }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedEnvelope, setSelectedEnvelope] = useState(null);
  const [isCloseBookOpen, setIsCloseBookOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const openModal = (mode, envelope = null) => {
    setModalMode(mode);
    setSelectedEnvelope(envelope);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const isAdmin = role === "admin";

  // Group envelopes by category
  const categories = {
    NEEDS: { label: "Kebutuhan Pokok (NEEDS)", envelopes: envelopes.filter(e => e.category === "NEEDS"), color: "text-brand-gold" },
    WANTS: { label: "Keinginan (WANTS)", envelopes: envelopes.filter(e => e.category === "WANTS"), color: "text-brand-sage" },
    SAVINGS: { label: "Tabungan (SAVINGS)", envelopes: envelopes.filter(e => e.category === "SAVINGS"), color: "text-blue-400" },
  };

  return (
    <div className="space-y-10">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <h2 className="font-display text-2xl text-white text-balance">Alokasi Amplop Anggaran</h2>
        
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCloseBookOpen(true)}
              className="text-xs text-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              Tutup Buku Bulanan
            </button>
            <button 
              onClick={() => setIsTransferOpen(true)}
              className="text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Transfer Saldo
            </button>
            <button 
              onClick={() => openModal("add")}
              className="text-xs text-brand-midnight bg-brand-gold hover:bg-brand-gold-muted px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-midnight focus-visible:ring-brand-gold"
            >
              + Tambah Amplop
            </button>
          </div>
        )}
      </div>

      {/* Render Envelopes by Category */}
      <div className="space-y-8">
        {Object.entries(categories).map(([catKey, cat]) => {
          if (cat.envelopes.length === 0) return null;

          return (
            <div key={catKey} className="space-y-4">
              <h3 className={`font-display text-sm font-semibold tracking-wider uppercase ${cat.color} flex items-center gap-2`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {cat.label}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {cat.envelopes.map((env) => {
                  const balance = parseFloat(env.balance || 0);
                  const limit = parseFloat(env.limit_amount || env.limit || 0);
                  const percentage = limit > 0 ? (balance / limit) * 100 : 0;
                  
                  // Determine status dynamically
                  let status = "safe";
                  let barColor = "bg-brand-gold";
                  let borderColor = "border-white/5";
                  
                  if (balance === 0) {
                    status = "locked";
                    barColor = "bg-brand-sage";
                    borderColor = "border-brand-sage/20";
                  } else if (percentage <= 15) {
                    status = "warning";
                    barColor = "bg-red-400";
                    borderColor = "border-red-400/20";
                  }

                  return (
                    <div key={env.id} className={`glass-card bg-white/5 p-6 rounded-2xl flex flex-col justify-between group relative overflow-hidden transition-all duration-300 border ${borderColor}`}>
                      {/* Subtle Hover Glow */}
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start mb-6 z-10">
                        <div>
                          <h4 className="text-white font-medium text-lg">{env.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase ${
                              status === "warning"
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : status === "locked"
                                ? "bg-brand-sage/10 border-brand-sage/20 text-brand-sage"
                                : "bg-brand-gold/10 border-brand-gold/20 text-brand-gold"
                            }`}>
                              {status === "warning" ? "WARNING" : status === "locked" ? "EMPTY / SAVED" : "SAFE"}
                            </span>
                            {env.assigned_to && (
                              <span className="inline-block text-[9px] font-mono px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 uppercase">
                                Akses: {members.find(m => m.id === env.assigned_to)?.display_name || "Anggota"}
                              </span>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => openModal("edit", env)}
                            aria-label="Edit Amplop"
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                          >
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      <div className="z-10">
                        <div className="flex justify-between items-end mb-3">
                          <div className="font-mono text-2xl text-white font-semibold tabular-nums">{formatCurrency(balance)}</div>
                          <div className="text-xs text-brand-muted mb-1 tabular-nums">/ {formatCurrency(limit)}</div>
                        </div>
                        
                        <div className="h-1.5 w-full bg-brand-midnight rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                        </div>
                      </div>
                      
                      {/* Quick Action Overlay on Hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-brand-slate via-brand-slate/95 to-transparent flex justify-end gap-2 z-20">
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => openModal("edit", env)}
                              className="text-xs bg-brand-gold text-brand-midnight px-3 py-1.5 rounded-lg font-medium hover:bg-brand-gold-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-slate focus-visible:ring-brand-gold"
                            >
                              Kelola
                            </button>
                            <button 
                              onClick={() => openModal("delete", env)}
                              className="text-xs bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-slate focus-visible:ring-red-500"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Placeholder if empty */}
        {envelopes.length === 0 && (
          <div className="text-center py-16 glass-card bg-white/5 rounded-2xl border border-dashed border-white/10">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h4 className="text-white font-medium text-lg mb-1">Belum Ada Amplop Anggaran</h4>
            <p className="text-xs text-brand-muted max-w-sm mx-auto mb-6">
              {isAdmin 
                ? "Silakan buat amplop anggaran pertama keluarga Anda untuk mulai mendistribusikan kas utama." 
                : "Orang Tua belum membuat amplop anggaran didelegasikan untuk akun Anda."}
            </p>
            {isAdmin && (
              <button
                onClick={() => openModal("add")}
                className="text-xs text-brand-midnight bg-brand-gold hover:bg-brand-gold-muted px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              >
                + Buat Amplop Pertama
              </button>
            )}
          </div>
        )}
      </div>

      {/* Envelope Management Modal */}
      <ManageEnvelopeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        envelope={selectedEnvelope}
        envelopes={envelopes}
        members={members}
        onSuccess={onSuccess}
      />

      {/* Close Monthly Book Modal */}
      <CloseBookModal 
        isOpen={isCloseBookOpen}
        onClose={() => setIsCloseBookOpen(false)}
        envelopes={envelopes}
        onSuccess={onSuccess}
      />

      {/* Transfer Budget Modal */}
      <TransferModal 
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        envelopes={envelopes}
        onSuccess={onSuccess}
      />
    </div>
  );
}
