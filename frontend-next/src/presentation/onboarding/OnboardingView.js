"use client";

import { useState } from "react";

function generateSimpleInviteCode(familyName) {
  const namePart = familyName.trim().replace(/\s+/g, "-").toUpperCase().substring(0, 8);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${namePart}-${randomPart}`;
}

export default function OnboardingView({ onComplete }) {
  const [activeTab, setActiveTab] = useState("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const generatedCode = generateSimpleInviteCode(familyName);
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName, inviteCode: generatedCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in-up">
      <div className="max-w-md w-full bg-brand-surface border border-brand-midnight rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold to-yellow-500"></div>
        <h2 className="text-3xl font-display text-white mb-2 text-center">Selamat Datang di FamFi</h2>
        <p className="text-brand-muted text-center mb-8">Silakan buat keluarga baru atau bergabung dengan undangan.</p>
        
        <div className="flex mb-6 border-b border-brand-midnight">
          <button 
            className={`flex-1 pb-3 font-medium transition-colors ${activeTab === 'create' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-muted hover:text-white'}`}
            onClick={() => setActiveTab('create')}
          >
            Buat Keluarga
          </button>
          <button 
            className={`flex-1 pb-3 font-medium transition-colors ${activeTab === 'join' ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-muted hover:text-white'}`}
            onClick={() => setActiveTab('join')}
          >
            Gabung
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Nama Keluarga</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full bg-brand-dark/50 border border-brand-midnight rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold transition-colors"
                placeholder="Misal: Keluarga Cemara"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !familyName}
              className="w-full bg-brand-gold text-brand-midnight font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Buat & Mulai"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Kode Undangan</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-brand-dark/50 border border-brand-midnight rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-gold transition-colors uppercase"
                placeholder="Misal: KELUARGA-1234"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inviteCode}
              className="w-full bg-brand-gold text-brand-midnight font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Bergabung"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
