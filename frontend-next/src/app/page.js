import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] animate-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/30 rounded-full blur-[150px] animate-glow" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">Fam<span className="text-emerald-400">Fi</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#tech" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="#insights" className="hover:text-white transition-colors">Insights</Link>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-full font-medium transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            Open App
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mt-10 md:mt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Powered by ElysiaJS & Next.js
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Zero Leaks. <br />
            <span className="text-gradient">Total Control.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
            The ultimate family finance tracker. Extreme performance, atomic accuracy, and a smart enveloping system to ensure your budget never bleeds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-8 py-3.5 rounded-full font-bold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              Get Started Free
            </button>
            <button className="glass px-8 py-3.5 rounded-full font-medium text-white hover:bg-white/10 transition-colors border border-white/10">
              View Architecture
            </button>
          </div>

          {/* Abstract Dashboard Mockup */}
          <div className="w-full max-w-4xl h-64 md:h-96 glass-card rounded-2xl p-6 relative animate-float overflow-hidden group">
            {/* Mockup Header */}
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="text-sm text-gray-400 font-mono">Monthly Budget Overview</div>
            </div>
            
            {/* Mockup Content */}
            <div className="grid grid-cols-3 gap-6 h-full">
              <div className="col-span-1 space-y-4">
                <div className="h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="h-2 w-12 bg-emerald-400/50 rounded mb-2"></div>
                  <div className="h-6 w-24 bg-emerald-400 rounded"></div>
                </div>
                <div className="h-20 bg-white/5 rounded-xl p-4">
                  <div className="h-2 w-16 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 w-20 bg-white/40 rounded mt-4"></div>
                </div>
              </div>
              <div className="col-span-2 relative">
                {/* Chart Mockup */}
                <div className="absolute bottom-16 left-0 right-0 h-32 flex items-end justify-between gap-2 px-4">
                  {[40, 70, 45, 90, 60, 100, 30].map((h, i) => (
                    <div key={i} className="w-full bg-emerald-500/20 rounded-t-sm relative group-hover:bg-emerald-500/40 transition-colors" style={{ height: `${h}%` }}>
                       <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Engineered for Families</h2>
            <p className="text-gray-400">Not just another expense tracker. Built to solve real household financial friction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Enveloping System</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Divide your funds into digital envelopes. Auto-alerts when limits are reached. One-click reallocation from surplus to deficit envelopes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">IoT Smart Webhooks</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connect physical smart buttons (ESP8266/Arduino) to log recurring expenses instantly without opening your phone.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Monthly Wrapped Insights</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Story-like interactive visualizations at the start of every month summarizing spending patterns with actionable AI-driven narratives.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Architecture Highlight */}
        <section id="tech" className="mt-32">
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl font-bold mb-6">Absolute Data Integrity</h2>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Pessimistic Locking</h4>
                      <p className="text-gray-400 text-sm">Prevents race conditions when two family members log transactions simultaneously. Zero floating-point errors.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Offline-First PWA</h4>
                      <p className="text-gray-400 text-sm">Log expenses even without internet via Service Workers and IndexedDB. Auto-syncs when online.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Immutable Audit Trails</h4>
                      <p className="text-gray-400 text-sm">Soft deletes and comprehensive activity logs ensure you never lose historical context.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/5 shadow-2xl font-mono text-sm text-gray-300">
                <div className="text-emerald-400 mb-4">{`// Atomic Transaction Example`}</div>
                <div className="space-y-2 opacity-80">
                  <p><span className="text-purple-400">await</span> db.<span className="text-blue-400">transaction</span>(<span className="text-purple-400">async</span> (tx) {`=>`} {'{'}</p>
                  <p className="pl-4"><span className="text-gray-500">{`/* Pessimistic Lock */`}</span></p>
                  <p className="pl-4"><span className="text-purple-400">const</span> env = <span className="text-purple-400">await</span> tx</p>
                  <p className="pl-8">.select().from(envelopes)</p>
                  <p className="pl-8">.where(eq(id, req.envelope_id))</p>
                  <p className="pl-8">.<span className="text-yellow-400">forUpdate</span>();</p>
                  <br/>
                  <p className="pl-4"><span className="text-purple-400">await</span> tx.update(envelopes)</p>
                  <p className="pl-8">.set({'{'} balance: env.balance - req.amount {'}'})</p>
                  <p className="pl-4">...<span className="text-gray-500">{`/* Insert Logs */`}</span></p>
                  <p>{'}'});</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer CTA */}
      <footer className="border-t border-white/10 bg-[#030712]/80 backdrop-blur-lg pt-20 pb-10 mt-20 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to align your family&apos;s finances?</h2>
          <p className="text-gray-400 mb-8">Deploy your own instance of the Family Finance Tracker today.</p>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-8 py-3.5 rounded-full font-bold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            Start the Demo
          </button>
          
          <div className="mt-20 flex justify-between items-center text-sm text-gray-600 border-t border-white/5 pt-8">
            <div className="font-bold">FamFi</div>
            <div>Built with Next.js, Bun & ElysiaJS</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
