"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Flame,
  Globe2,
  Lock,
  MessageSquare,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "../components/language-switcher";
import { useI18n } from "../dictionaries/i18n";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="bg-black min-h-screen text-gray-100 overflow-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/[0.05] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all duration-300">
              <Flame size={20} className="text-white fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">
              FIRE
            </span>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                {t.auth.signIn}
              </Link>
              <div className="w-px h-5 bg-white/10" />
              <LanguageSwitcher />
            </div>

            <Link
              href="/register"
              className="group relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all overflow-hidden flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-linear-to-r from-blue-600 via-indigo-500 to-purple-600 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-blue-600 blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 text-white group-hover:drop-shadow-md">
                {t.landing.startNow}
              </span>
              <ChevronRight size={16} className="relative z-10 text-white group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-52 md:pb-40 overflow-hidden flex flex-col items-center justify-center">
        {/* Deep Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[600px] pointer-events-none z-0 mix-blend-screen opacity-70">
          <div className="absolute top-0 left-[20%] w-[400px] h-[400px] bg-blue-600/30 blur-[130px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-0 right-[20%] w-[500px] h-[500px] bg-purple-700/20 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-indigo-500/20 blur-[100px] rounded-full mix-blend-screen" />
        </div>

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)] transform hover:scale-105 transition-transform cursor-default">
            <Sparkles size={14} className="text-indigo-400" />
            Next Gen Routing Engine
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
            <span className="bg-clip-text text-transparent bg-linear-to-b from-white via-gray-200 to-gray-500 block">
              {t.landing.heroTitle}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            {t.landing.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-md mx-auto sm:max-w-none">
            <Link
              href="/register"
              className="w-full sm:w-auto relative group px-10 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 overflow-hidden bg-white text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]"
            >
              <span className="relative z-10 text-lg">{t.landing.startNow}</span>
              <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto group px-10 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:scale-[1.02] active:scale-95 text-lg text-white"
            >
              {t.auth.signIn}
            </Link>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-28 md:mt-40 relative z-10">
          {/* Glass panel wrapper */}
          <div className="relative rounded-[2rem] bg-linear-to-b from-white/[0.08] to-transparent p-[1px] shadow-2xl backdrop-blur-xl group hover:shadow-[0_20px_80px_rgba(37,99,235,0.15)] transition-all duration-700">
            <div className="aspect-[16/10] md:aspect-video bg-black/60 rounded-[calc(2rem-1px)] overflow-hidden flex flex-col relative border border-white/5">
              
              {/* Subtle grid pattern background */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

              {/* Mock Dashboard Top */}
              <div className="h-12 border-b border-white/10 flex items-center px-6 gap-3 bg-white/[0.02]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="ml-6 flex items-center gap-2 h-6 w-48 bg-white/5 rounded-md px-3 border border-white/5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  <div className="h-2 w-16 bg-white/20 rounded-sm" />
                </div>
              </div>
              
              {/* Mock Content */}
              <div className="flex-1 flex p-6 gap-6 z-10">
                {/* Sidebar */}
                <div className="hidden sm:flex w-56 bg-white/[0.03] border border-white/5 rounded-xl flex-col p-4 gap-3">
                  <div className="h-4 w-24 bg-white/20 rounded-md mb-4" />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`skeleton-menu-${Math.random()}`}
                      className="h-8 w-full bg-white/5 rounded-lg flex items-center px-3 gap-3 border border-white/[0.02]"
                    >
                      <div className="w-4 h-4 rounded bg-white/10" />
                      <div className={`h-2.5 bg-white/10 rounded`} style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }} />
                    </div>
                  ))}
                </div>
                
                {/* Main Content Area */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Big Chart Card */}
                  <div className="col-span-1 md:col-span-2 bg-linear-to-br from-blue-600/10 to-indigo-900/10 border border-blue-500/20 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group/card text-left">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 blur-3xl" />
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 mb-4">
                          <BarChart3 className="text-blue-400" size={24} />
                        </div>
                        <div className="h-3 w-32 bg-blue-400/50 rounded-md mb-3" />
                        <div className="h-8 w-48 bg-white/90 rounded-md" />
                      </div>
                      <div className="flex gap-1.5 opacity-50">
                        {Array.from({length: 8}).map((_, i) => (
                           <div key={`bar-${Math.random()}`} className="w-2 bg-blue-500 rounded-t-sm" style={{height: `${Math.max(10, Math.random() * 60)}px`, marginTop: 'auto'}} />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Small stat card */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-center gap-4 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full" />
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Activity size={24} />
                    </div>
                    <div>
                      <div className="h-3 w-20 bg-white/40 rounded-md mb-3" />
                      <div className="h-6 w-3/4 bg-white/90 rounded-md" />
                    </div>
                  </div>
                  
                  {/* Large bottom card (Activity list) */}
                  <div className="col-span-1 md:col-span-3 h-40 bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                     <div className="h-3 w-32 bg-white/20 rounded-md mb-2" />
                     {Array.from({length: 2}).map((_, i) => (
                       <div key={`row-${Math.random()}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-green-500/20 to-emerald-500/20 flex items-center justify-center text-green-400 border border-green-500/20">
                              <Users size={18} />
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="h-2.5 w-32 bg-white/60 rounded" />
                              <div className="h-2 w-20 bg-white/30 rounded" />
                            </div>
                          </div>
                          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{width: `${Math.random() * 40 + 40}%`}} />
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Benefits / "How it Works" Section */}
      <section className="py-24 md:py-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-400">
                Why choose FIRE?
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Powerful tools designed to automate, scale, and secure your routing infrastructure seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Network size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Intelligent Routing</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Automatically distribute tickets to the right managers based on workload, segments, and language.</p>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Global Reach</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Multilingual support directly integrated, allowing cross-border support without translation bottlenecks.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 transition-transform">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Enterprise Security</h3>
              <p className="text-gray-400 text-sm leading-relaxed">End-to-end data encryption, strict RBAC, and SLA monitoring ensure your data is always safe.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Real-time Analytics</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Get granular insights into response times, manager efficiency, and ticket volumes with a custom dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Overview (Original translated text) */}
      <section className="py-24 md:py-32 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
        {/* Decorative light beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-blue-500/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-20 text-white">
            {t.landing.featuresTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-10 rounded-[2rem] bg-black/40 border border-white/10 hover:border-blue-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Zap size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {t.landing.feature1Title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-lg">
                  {t.landing.feature1Desc}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-10 rounded-[2rem] bg-black/40 border border-white/10 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-8 border border-purple-500/20 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {t.landing.feature2Title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-lg">
                  {t.landing.feature2Desc}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-10 rounded-[2rem] bg-black/40 border border-white/10 hover:border-green-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                 <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 mb-8 border border-green-500/20 group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {t.landing.feature3Title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-lg">
                  {t.landing.feature3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 md:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-3">
              <Flame size={24} className="text-blue-500" />
              <span className="text-2xl font-black tracking-tighter text-white">FIRE</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              © 2026 FIRE Intelligent Routing Engine. Designed for Hackathon Pro.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
