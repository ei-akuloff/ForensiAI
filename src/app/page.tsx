import Image from "next/image";
import Link from "next/link";
import CaseDecrypt from '../components/case-decrypt';

export default function Home() {
  return (
    <div className="font-orbitron flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* Matrix Background */}
      <div className="absolute inset-0 bg-matrix-bg"></div>
      
      {/* Animated Matrix Grid */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'matrixPulse 20s linear infinite'
      }}></div>

      {/* Floating Matrix Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-matrix-cyan to-matrix-emerald rounded-lg opacity-30 animate-matrix-float matrix-glow-cyan"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-matrix-emerald to-matrix-cyan rounded-lg opacity-30 animate-matrix-float matrix-glow-green" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-matrix-cyan to-matrix-emerald rounded-lg opacity-30 animate-matrix-float" style={{animationDelay: '4s'}}></div>
      
      {/* Scan Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-matrix-cyan to-transparent animate-matrix-scan opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-matrix-emerald to-transparent animate-matrix-scan opacity-60" style={{animationDelay: '1.5s'}}></div>
      
      <main className="relative z-10 flex flex-col gap-12 items-center text-center max-w-5xl px-8 py-20 animate-fade-in">
        <div className="text-center space-y-6">
          <div className="animate-slide-up">
            <h1 className="text-6xl md:text-7xl font-bold gradient-text mb-6 tracking-tight font-orbitron">
              ForensiAI
            </h1>
            <div className="w-24 h-1.5 bg-gradient-to-r from-matrix-cyan via-matrix-emerald to-matrix-cyan mx-auto rounded-full mb-8 matrix-pulse"></div>
          </div>
          
          <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <p className="matrix-text-primary text-xl md:text-2xl mb-6 leading-relaxed max-w-3xl font-space-mono">
              Advanced forensic analysis powered by cutting-edge AI technology
            </p>
            <p className="matrix-text-muted text-base md:text-lg leading-relaxed max-w-2xl font-space-mono">
              Streamline your investigations with intelligent case management, automated analysis, and real-time insights
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-center flex-col sm:flex-row animate-slide-up" style={{animationDelay: '0.4s'}}>
          <Link
            className="matrix-button group relative rounded-xl bg-gradient-to-r from-matrix-cyan/20 to-matrix-emerald/20 hover:from-matrix-cyan/30 hover:to-matrix-emerald/30 text-matrix-cyan font-semibold text-base h-14 px-8 flex items-center justify-center transition-all duration-300 matrix-glow-cyan hover:matrix-glow-green min-w-[140px] border border-matrix-cyan/50 hover:border-matrix-emerald/50"
            href="/login"
          >
            <span className="relative z-10 font-space-mono uppercase tracking-wider">Sign In</span>
          </Link>
          <Link
            className="matrix-button group relative rounded-xl border-2 border-matrix-emerald/50 bg-matrix-surface/80 backdrop-blur-sm hover:bg-matrix-emerald/10 text-matrix-emerald font-semibold text-base h-14 px-8 flex items-center justify-center transition-all duration-300 hover:scale-105 min-w-[140px] hover:border-matrix-emerald matrix-hover"
            href="/signup"
          >
            <span className="font-space-mono uppercase tracking-wider">Create Account</span>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full animate-slide-up" style={{animationDelay: '0.6s'}}>
          <div className="group matrix-panel matrix-hover backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-matrix-cyan/20 to-matrix-emerald/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 matrix-glow-cyan">
              <svg className="w-6 h-6 text-matrix-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold matrix-text-primary mb-2 font-orbitron tracking-wide">AI-POWERED ANALYSIS</h3>
            <p className="text-sm matrix-text-muted font-space-mono">ADVANCED MACHINE LEARNING ALGORITHMS FOR FASTER AND MORE ACCURATE FORENSIC ANALYSIS</p>
          </div>
          
          <div className="group matrix-panel matrix-hover backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-matrix-emerald/20 to-matrix-cyan/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 matrix-glow-emerald">
              <svg className="w-6 h-6 text-matrix-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold matrix-text-primary mb-2 font-orbitron tracking-wide">SECURE PROCESSING</h3>
            <p className="text-sm matrix-text-muted font-space-mono">END-TO-END ENCRYPTION ENSURES YOUR SENSITIVE DATA REMAINS PROTECTED THROUGHOUT THE ANALYSIS</p>
          </div>
          
          <div className="group matrix-panel matrix-hover backdrop-blur-sm rounded-2xl p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-matrix-cyan/20 to-matrix-emerald/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 matrix-glow-cyan">
              <svg className="w-6 h-6 text-matrix-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold matrix-text-primary mb-2 font-orbitron tracking-wide">REAL-TIME INSIGHTS</h3>
            <p className="text-sm matrix-text-muted font-space-mono">GET INSTANT RESULTS AND INTERACTIVE VISUALIZATIONS TO ACCELERATE YOUR INVESTIGATION WORKFLOW</p>
          </div>
        </div>

        <div className="mt-12 text-center animate-slide-up" style={{animationDelay: '0.8s'}}>
          <p className="text-sm matrix-text-muted mb-6 font-medium font-space-mono uppercase tracking-wider">
            EXPLORE DEMO FEATURES
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link
              href="/login"
              className="group text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-all duration-300 hover:scale-105"
            >
              <span className="border-b border-transparent group-hover:border-current transition-colors duration-300">Login Experience</span>
            </Link>
            <Link
              href="/signup"
              className="group text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-all duration-300 hover:scale-105"
            >
              <span className="border-b border-transparent group-hover:border-current transition-colors duration-300">Registration Flow</span>
            </Link>
            <Link
              href="/dashboard"
              className="group text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium transition-all duration-300 hover:scale-105"
            >
              <span className="border-b border-transparent group-hover:border-current transition-colors duration-300">Interactive Dashboard</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 flex gap-8 flex-wrap items-center justify-center text-slate-600 dark:text-slate-400 mt-16 animate-fade-in" style={{animationDelay: '1s'}}>
        <a
          className="group flex items-center gap-3 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 hover:scale-105"
          href="https://nextjs.org/learn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="w-8 h-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors duration-300">
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
              className="dark:invert"
            />
          </div>
          <span className="font-medium">Learn More</span>
        </a>
        <a
          className="group flex items-center gap-3 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 hover:scale-105"
          href="https://vercel.com/templates?framework=next.js"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="w-8 h-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors duration-300">
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
              className="dark:invert"
            />
          </div>
          <span className="font-medium">Examples</span>
        </a>
        <a
          className="group flex items-center gap-3 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 hover:scale-105"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="w-8 h-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors duration-300">
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
              className="dark:invert"
            />
          </div>
          <span className="font-medium">Next.js →</span>
        </a>
      </footer>
    </div>
  );
}
