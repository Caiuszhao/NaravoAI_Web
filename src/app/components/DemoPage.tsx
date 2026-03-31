import React, { useState } from 'react';
import { DemoFeed, DEMOS, CUSTOM_LOGO_URL } from './DemoFeed';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Fingerprint, Crosshair, Play } from 'lucide-react';

export function DemoPage({ onBackHome }: { onBackHome: () => void }) {
  const [activeDemoIdx, setActiveDemoIdx] = useState(0);

  const activeDemo = DEMOS[activeDemoIdx];

  return (
    <div className="bg-[#020202] min-h-[100dvh] text-white font-sans selection:bg-white/30 w-full overflow-hidden flex flex-col">
      
      {/* ========================================================= */}
      {/* MOBILE EXPERIENCE (Full Screen Vertical Feed) */}
      {/* ========================================================= */}
      <div className="lg:hidden h-[100dvh] w-full relative">
        <DemoFeed onBackHome={onBackHome} />
      </div>

      {/* ========================================================= */}
      {/* DESKTOP EXPERIENCE (Premium Presentation) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex flex-col min-h-[100dvh] relative overflow-y-auto">
        
        {/* Header */}
        <header className="w-full px-12 py-8 z-50 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackHome}>
            <div className="relative flex items-center justify-center w-7 h-7">
              <img
                src={CUSTOM_LOGO_URL}
                alt="Naravo AI Logo"
                className="w-7 h-7 object-contain"
                style={{ filter: 'invert(1)', borderRadius: '4px' }}
              />
              <div className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-50" />
            </div>
            <span
              className="text-white font-bold tracking-[0.2em] text-[15px] uppercase drop-shadow-lg"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Naravo AI
            </span>
          </div>

          <button 
            onClick={onBackHome}
            className="flex items-center gap-2 text-[12px] text-white/50 hover:text-white transition-colors uppercase tracking-[0.15em] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Platform
          </button>
        </header>

        {/* Main Showcase Section */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-12 py-16 flex items-center justify-center gap-20 xl:gap-32">
          
          {/* Simulated Smartphone Device */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[340px] xl:w-[380px] shrink-0"
          >
            {/* Phone Glow */}
            <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full scale-110" />
            
            {/* Device Mockup */}
            <div className="relative w-full aspect-[9/19] rounded-[3rem] bg-[#0a0a0a] border-[10px] border-[#111] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10 flex flex-col">
              {/* Dynamic Island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-8 bg-black rounded-full z-50 flex items-center justify-between px-2.5 shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                 <div className="w-3 h-3 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center">
                   <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                 </div>
                 <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                   <div className="w-1 h-1 rounded-full bg-emerald-400" />
                 </div>
              </div>

              {/* Hardware buttons */}
              <div className="absolute top-32 -left-[14px] w-1 h-12 bg-[#222] rounded-l-md" />
              <div className="absolute top-48 -left-[14px] w-1 h-12 bg-[#222] rounded-l-md" />
              <div className="absolute top-40 -right-[14px] w-1 h-16 bg-[#222] rounded-r-md" />
              
              {/* Feed Content */}
              <div className="w-full h-full relative rounded-[2.2rem] overflow-hidden">
                <DemoFeed onIndexChange={setActiveDemoIdx} activeIndex={activeDemoIdx} onBackHome={onBackHome} />
              </div>
            </div>
            
          </motion.div>

          {/* Premium Content Panel */}
          <div className="flex flex-col max-w-[500px] xl:max-w-[580px]">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-2 text-white/50 mb-6">
                <Play className="w-4 h-4" />
                <span className="text-[11px] font-semibold tracking-[0.25em] uppercase">
                  Interactive Showcase
                </span>
              </div>

              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDemoIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    <h1 
                      className="text-[3rem] xl:text-[3.5rem] leading-[1.1] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 tracking-tight"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {activeDemo.title}
                    </h1>

                    <p className="text-[17px] text-white/60 leading-relaxed font-light">
                      {activeDemo.showcaseHook}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/[0.06]">
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70">
                          <Fingerprint className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Interaction</p>
                          <p className="text-white/90 text-sm font-medium">{activeDemo.interactionMethod}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70">
                          <Crosshair className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Objective</p>
                          <p className="text-white/90 text-sm font-medium">{activeDemo.objective}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Demo Switcher */}
              <div className="mt-12 flex items-center gap-6">
                {DEMOS.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDemoIdx(i)}
                    className={`flex items-center px-6 py-3 rounded-[1.5rem] transition-all duration-300 ${
                      i === activeDemoIdx 
                        ? 'bg-[#1a1a1a] border-[#333] text-white shadow-xl' 
                        : 'bg-transparent border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
                    } border`}
                  >
                    <span className="text-[13px] font-bold tracking-[0.2em] uppercase">
                      Demo 0{i + 1}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer Strip */}
        <footer className="w-full mt-auto pt-8 pb-8 px-12 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-6 h-6">
              <img
                src={CUSTOM_LOGO_URL}
                alt="Naravo AI Logo"
                className="w-6 h-6 object-contain"
                style={{ filter: 'invert(1)', borderRadius: '3px' }}
              />
            </div>
            <span
              className="text-white/50 font-bold tracking-[0.15em] text-[12px] uppercase"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Naravo AI
            </span>
          </div>
          <p className="text-[11px] text-white/20 text-center sm:text-right">
            © 2026 Naravo AI · Confidential Investor Demo · All rights reserved
          </p>
        </footer>
      </div>
    </div>
  );
}
