import Silk from '@/components/Silk'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-x-hidden relative">
      {/* Silk Background */}
      <div className="fixed inset-0 z-0">
        <Silk
          speed={7}
          scale={0.7}
          color="#412907"
          noiseIntensity={0}
          rotation={0}
        />
      </div>

      {/* Overlay to ensure content readability */}
      <div className="fixed inset-0 z-10 bg-[#0a0a1a]/60 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 px-6 lg:px-12 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <rect x="3" y="10" width="6" height="11" rx="1" fill="currentColor" opacity="0.7"/>
                <rect x="9" y="6" width="6" height="15" rx="1" fill="currentColor" opacity="0.85"/>
                <rect x="15" y="3" width="6" height="18" rx="1" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">Business Intelligence</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors text-sm">How It Works</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors text-sm">Pricing</a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <button className="px-5 py-2 text-sm text-white border border-gray-600 rounded-lg hover:border-gray-400 transition-colors">
              Sign In
            </button>
            <button className="px-5 py-2 text-sm text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg font-medium hover:from-yellow-300 hover:to-yellow-400 transition-all">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-12 pt-16 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Make Smart Decisions with
          </h1>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              AI-Powered Business Intelligence
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Get insights on market size, profitability, competition, and key feasibility using advanced AI analysis. Search 100+ industries and generate trends with real-time data.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Search any industry (e.g. IT, EV, Cloud Software...)"
                  className="w-full px-5 py-4 bg-[#151528] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Analyze
              </button>
            </div>
          </div>

          {/* Example Text */}
          <p className="text-gray-500 text-sm max-w-2xl mx-auto">
            <span className="text-gray-400">Example:</span> Search for <span className="text-gray-300">&apos;IT&apos;</span>, <span className="text-gray-300">&apos;ITMC&apos;</span> or <span className="text-gray-300">&apos;Self-Drive&apos;</span> or <span className="text-gray-300">&apos;IT&apos;</span>, <span className="text-gray-300">&apos;TCS&apos;</span> <span className="text-gray-300">&apos;Banking&apos;</span> and <span className="text-gray-300">&apos;HDFC&apos;</span>
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Not sure what to search for? <span className="text-gray-400">Here are some suggestions:</span> EV Vehicles self-drive, anla are anchens.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Market Size */}
            <div className="bg-[#151528]/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 mb-4 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="20" width="6" height="14" rx="1" fill="#4ade80" opacity="0.6"/>
                  <rect x="17" y="12" width="6" height="22" rx="1" fill="#4ade80" opacity="0.8"/>
                  <rect x="26" y="6" width="6" height="28" rx="1" fill="#4ade80"/>
                  <circle cx="11" cy="16" r="2" fill="#22d3ee"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Market Size</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get accurate market size and growth rate insights across multiple sectors
              </p>
            </div>

            {/* Profitability */}
            <div className="bg-[#151528]/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 mb-4 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M8 28L16 20L22 26L32 14" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="32" cy="14" r="3" fill="#fbbf24"/>
                  <path d="M8 32L14 26" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Profitability</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Analyze revenue, EBITDA & key profitability ratios from for data
              </p>
            </div>

            {/* Competition */}
            <div className="bg-[#151528]/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 mb-4 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="14" r="6" stroke="#f97316" strokeWidth="2" fill="none"/>
                  <circle cx="20" cy="14" r="2" fill="#f97316"/>
                  <circle cx="12" cy="26" r="4" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.6"/>
                  <circle cx="28" cy="26" r="4" stroke="#f97316" strokeWidth="2" fill="none" opacity="0.6"/>
                  <path d="M20 20V24" stroke="#f97316" strokeWidth="2"/>
                  <path d="M16 24L12 26" stroke="#f97316" strokeWidth="2" opacity="0.6"/>
                  <path d="M24 24L28 26" stroke="#f97316" strokeWidth="2" opacity="0.6"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Competition</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Understand competitive landase and barriers to entry
              </p>
            </div>

            {/* AI Powered */}
            <div className="bg-[#151528]/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 mb-4 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="8" width="24" height="24" rx="4" stroke="#a78bfa" strokeWidth="2" fill="none"/>
                  <circle cx="20" cy="20" r="4" fill="#a78bfa"/>
                  <circle cx="20" cy="12" r="2" fill="#a78bfa" opacity="0.6"/>
                  <circle cx="20" cy="28" r="2" fill="#a78bfa" opacity="0.6"/>
                  <circle cx="12" cy="20" r="2" fill="#a78bfa" opacity="0.6"/>
                  <circle cx="28" cy="20" r="2" fill="#a78bfa" opacity="0.6"/>
                  <line x1="8" y1="8" x2="14" y2="14" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4"/>
                  <line x1="32" y1="8" x2="26" y2="14" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4"/>
                  <line x1="8" y1="32" x2="14" y2="26" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4"/>
                  <line x1="32" y1="32" x2="26" y2="26" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Powered</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Get intelligent insights powered by cutting-edge AI Developed by Groqy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/30">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Enter Industry</h3>
              <p className="text-gray-400 text-sm">
                Type any industry you want to analysis.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/30">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Analysis</h3>
              <p className="text-gray-400 text-sm">
                Our advanced AI analyzes 100+ industries and over 200,000+ data points for accurate analysis.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-yellow-500/30">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Get Insights</h3>
              <p className="text-gray-400 text-sm">
                Receive detailed insights around market size, profitability, and competitiness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">Accurate Industry Analysis</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-6">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent mb-2">
                100+
              </div>
              <p className="text-gray-400 text-sm">Industries Covered</p>
            </div>

            <div className="text-center p-6">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent mb-2">
                200k+
              </div>
              <p className="text-gray-400 text-sm">Real Data Points</p>
            </div>

            <div className="text-center p-6">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent mb-2">
                90%+
              </div>
              <p className="text-gray-400 text-sm">Data Accuracy</p>
            </div>

            <div className="text-center p-6">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                $0
              </div>
              <p className="text-gray-400 text-sm">Cost Forever</p>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm">
            Market data from World Bank & IMF • Company data from NSE/BSE FY 2023 • 90%+ 100% U Reliable
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 lg:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Try It for Free <span className="text-gray-400">(no credit card required)</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-2xl mx-auto">
            Reliable data from World Bank, IMF • Real data from MCA • Company information from NSE/BSE FY 2023
          </p>
          <p className="text-gray-600 text-xs mt-2">
            - 2-3 000k Pagie ca Source--0 120cons, Pagie 00 Rials, Feemon & more scurces
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Contact</a>
            </div>

            <div className="text-gray-600 text-sm">
              © 2024 | <span className="text-gray-500">Groqy</span> | All rights reseined
            </div>

            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
