import Image from "next/image";
import Link from "next/link";
import CaseDecrypt from '../components/case-decrypt';

export default function Home() {
  return (
    <div className="font-sans flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* Background gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_70%)]"></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-20 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      
      <main className="relative z-10 flex flex-col gap-12 items-center text-center max-w-5xl px-8 py-20 animate-fade-in">
        <div className="text-center space-y-6">
          <div className="animate-slide-up">
            <h1 className="text-6xl md:text-7xl font-bold gradient-text mb-6 tracking-tight">
              ForensiAI
            </h1>
            <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 mx-auto rounded-full mb-8 animate-glow"></div>
          </div>
          
          <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
            <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl mb-6 leading-relaxed max-w-3xl">
              Advanced forensic analysis powered by cutting-edge AI technology
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl">
              Streamline your investigations with intelligent case management, automated analysis, and real-time insights
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-center flex-col sm:flex-row animate-slide-up" style={{animationDelay: '0.4s'}}>
          <Link
            className="group relative rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold text-base h-14 px-8 flex items-center justify-center transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 min-w-[140px]"
            href="/login"
          >
            <span className="relative z-10">Sign In</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-700 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <Link
            className="group relative rounded-xl border-2 border-emerald-600 dark:border-emerald-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold text-base h-14 px-8 flex items-center justify-center transition-all duration-300 hover:scale-105 min-w-[140px] hover:border-emerald-700 dark:hover:border-emerald-300"
            href="/signup"
          >
            Create Account
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full animate-slide-up" style={{animationDelay: '0.6s'}}>
          <div className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 card-hover">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Advanced machine learning algorithms for faster and more accurate forensic analysis</p>
          </div>
          
          <div className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 card-hover">
            <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure Processing</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">End-to-end encryption ensures your sensitive data remains protected throughout the analysis</p>
          </div>
          
          <div className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 card-hover">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Insights</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Get instant results and interactive visualizations to accelerate your investigation workflow</p>
          </div>
        </div>

        <div className="mt-12 text-center animate-slide-up" style={{animationDelay: '0.8s'}}>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
            Explore Demo Features:
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
