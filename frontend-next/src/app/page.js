"use client";

import { useState } from "react";

export default function Home() {
  const [view, setView] = useState("user"); // 'user' or 'admin'

  return (
    <div className="min-h-screen relative overflow-hidden bg-brand-midnight text-brand-muted">
      {/* Elegant Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-gold/5 rounded-full blur-[150px] animate-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-sage/5 rounded-full blur-[120px] animate-glow" style={{ animationDelay: "3s" }}></div>
      </div>

      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-brand-slate border border-brand-gold/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">Fam<span className="text-brand-gold">Fi</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex p-1 rounded-full bg-brand-slate/50 border border-white/5">
              <button 
                onClick={() => setView("user")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${view === "user" ? "bg-brand-gold text-brand-midnight shadow-lg" : "text-brand-muted hover:text-white"}`}
              >
                Family Member
              </button>
              <button 
                onClick={() => setView("admin")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${view === "admin" ? "bg-brand-gold text-brand-midnight shadow-lg" : "text-brand-muted hover:text-white"}`}
              >
                Wealth Manager
              </button>
            </div>
            <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded text-sm font-medium transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
        {/* Dynamic Hero Section */}
        <section className="flex flex-col items-center text-center mt-8 animate-fade-in-up">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white max-w-4xl leading-tight">
            {view === "user" ? (
              <>Protect the family legacy. <br/><span className="text-gold-gradient italic">One envelope at a time.</span></>
            ) : (
              <>Command the ledger. <br/><span className="text-gold-gradient italic">Absolute financial truth.</span></>
            )}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed opacity-90">
            {view === "user" 
              ? "Allocate funds into digital envelopes, track shared expenses instantly, and view personalized insights that guide your household toward financial milestones."
              : "Orchestrate your family's cash flow with atomic precision. Connect physical IoT trackers, manage participant roles, and maintain an immutable audit trail."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 mb-24">
            <button className="bg-brand-gold hover:bg-brand-gold-muted text-brand-midnight px-8 py-3.5 rounded font-medium transition-all transform hover:-translate-y-1 shadow-[0_4px_20px_rgba(246,224,181,0.2)]">
              {view === "user" ? "Create Your Envelopes" : "Configure Family Access"}
            </button>
            <button className="glass-card px-8 py-3.5 rounded font-medium text-white hover:bg-white/5 transition-colors">
              {view === "user" ? "View Monthly Insights" : "Review Security Logs"}
            </button>
          </div>

          {/* Signature Aesthetic Element: The Ledger/Envelope Visualization */}
          <div className="w-full max-w-4xl h-80 glass-card rounded-xl p-8 relative flex flex-col justify-between overflow-hidden group">
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <h3 className="font-display text-2xl text-white">
                {view === "user" ? "Household Budget Allocations" : "Atomic Ledger Transactions"}
              </h3>
              <span className="font-mono text-xs text-brand-gold uppercase tracking-widest">Live Sync Active</span>
            </div>
            
            <div className="flex-1 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {view === "user" ? (
                <>
                  {[
                    { label: "Groceries", spent: 450, total: 600 },
                    { label: "Education", spent: 1200, total: 1200 },
                    { label: "Vacation Fund", spent: 150, total: 500 }
                  ].map((env, i) => (
                    <div key={i} className="bg-brand-slate/40 border border-white/5 rounded-lg p-5 flex flex-col justify-between transition-colors hover:border-brand-gold/30">
                      <div className="text-sm text-white mb-4">{env.label}</div>
                      <div>
                        <div className="font-mono text-2xl text-brand-gold mb-2">${env.spent} <span className="text-sm text-brand-muted">/ ${env.total}</span></div>
                        <div className="h-1 w-full bg-brand-midnight rounded overflow-hidden">
                          <div className={`h-full ${env.spent === env.total ? 'bg-brand-sage' : 'bg-brand-gold'}`} style={{ width: `${(env.spent/env.total)*100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="col-span-3 space-y-3 font-mono text-sm opacity-80">
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage">TX_7F9A2</span>
                      <span className="text-white">SELECT ... FOR UPDATE</span>
                      <span className="text-brand-gold">LOCKED</span>
                    </div>
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage">TX_7F9A2</span>
                      <span className="text-white">UPDATE envelopes SET balance = balance - 15</span>
                      <span className="text-brand-gold">SUCCESS</span>
                    </div>
                    <div className="flex justify-between items-center bg-brand-slate/30 p-3 rounded border border-white/5">
                      <span className="text-brand-sage">TX_7F9A2</span>
                      <span className="text-white">INSERT INTO activity_logs</span>
                      <span className="text-brand-gold">COMMITTED</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Tailored Features Section */}
        <section id="features" className="mt-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl text-white mb-6">
                {view === "user" ? "Orchestrate everyday spending." : "Infrastructure that assumes nothing."}
              </h2>
              <p className="text-lg leading-relaxed mb-8">
                {view === "user" 
                  ? "Distribute income into rigid digital envelopes. Receive subtle alerts before crossing limits, and reallocate surplus funds with a single tap to ensure the household balance remains flawless."
                  : "Built on ElysiaJS and Bun, the system enforces pessimistic locking to eradicate race conditions. Connect ESP8266 webhook buttons to log routine expenses instantly without opening a browser."}
              </p>
              
              <ul className="space-y-4">
                {[
                  view === "user" ? "Strict Enveloping System" : "Pessimistic Database Locking",
                  view === "user" ? "Real-Time Shared Tracking" : "Hardware IoT Webhook Integrations",
                  view === "user" ? "Monthly Story-Driven Insights" : "Immutable Activity Audit Trails"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold"></div>
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass-card p-10 rounded-xl relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-gold/10 rounded-full blur-2xl"></div>
              {view === "user" ? (
                <div className="space-y-6">
                  <div className="border-l-2 border-brand-gold pl-5 py-2">
                    <div className="text-xs text-brand-gold uppercase tracking-widest mb-2">Insight Generated</div>
                    <p className="text-white font-serif text-lg italic">"You maintained strict discipline with the Groceries envelope this month. We recommend shifting the $150 surplus toward the Vacation Fund."</p>
                  </div>
                  <button className="w-full bg-brand-slate hover:bg-brand-slate/80 text-white border border-white/10 py-3 rounded text-sm transition-colors">
                    Reallocate Funds
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-l-2 border-brand-sage pl-5 py-2">
                    <div className="text-xs text-brand-sage uppercase tracking-widest mb-2">Audit Log Entry</div>
                    <p className="text-white font-mono text-sm">Action: SOFT_DELETE<br/>Target: envelopes_table (ID: ENV_90X)<br/>Triggered By: Admin_User</p>
                  </div>
                  <button className="w-full bg-brand-slate hover:bg-brand-slate/80 text-white border border-white/10 py-3 rounded text-sm transition-colors">
                    Inspect Full Trail
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070A11] pt-16 pb-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl text-white mb-8">Secure your family's financial truth.</h2>
          <button className="bg-brand-gold text-brand-midnight px-8 py-3 rounded font-medium transition-transform hover:-translate-y-1">
            Initialize Workspace
          </button>
          
          <div className="mt-16 text-sm flex flex-col md:flex-row justify-between items-center opacity-60">
            <div>&copy; 2026 FamFi Architecture.</div>
            <div className="mt-4 md:mt-0 space-x-6">
              <a href="#" className="hover:text-white">Security</a>
              <a href="#" className="hover:text-white">API Reference</a>
              <a href="#" className="hover:text-white">Manifest</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
