import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DemoFeed } from './DemoFeed';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Fingerprint, Crosshair, Play } from 'lucide-react';
import { LegacyDemoScreen } from './LegacyDemoScreen';
import { DEMOS, CUSTOM_LOGO_URL } from '../interactive/scenarios/demoScenarios';
import { FeedPrefetchAbortProvider } from '../context/FeedPrefetchAbortContext';
import { DemoBottomNav, TabType } from './DemoBottomNav';
import { CharactersTab } from './CharactersTab';
import { ProfileTab } from './ProfileTab';

export function DemoPage({ onBackHome }: { onBackHome: () => void }) {
  const [activeDemoIdx, setActiveDemoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [feedPrefetchSession, setFeedPrefetchSession] = useState(() => ({
    controller: new AbortController(),
  }));

  useLayoutEffect(() => {
    setFeedPrefetchSession((prev) => {
      prev.controller.abort();
      return { controller: new AbortController() };
    });
  }, [activeDemoIdx]);
  // Entering the demo page should start Demo 1 playback immediately.
  const [hasActivatedDemoPlayback, setHasActivatedDemoPlayback] = useState(true);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  const activeDemo = DEMOS[activeDemoIdx];

  const handleSelectDemo = (nextIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(DEMOS.length - 1, nextIndex));
    setHasActivatedDemoPlayback(true);
    setActiveDemoIdx(clampedIndex);

    const container = feedContainerRef.current;
    if (!container) return;

    const targetScrollTop = clampedIndex * container.clientHeight;
    isProgrammaticScrollRef.current = true;
    container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 420);
  };

  const handleFeedScroll = () => {
    const container = feedContainerRef.current;
    if (!container || isProgrammaticScrollRef.current) return;

    const h = container.clientHeight;
    if (h <= 0) return;
    const nextIndex = Math.round(container.scrollTop / h);
    const clamped = Math.max(0, Math.min(DEMOS.length - 1, nextIndex));
    let becameDifferent = false;
    setActiveDemoIdx((prev) => {
      if (clamped !== prev) becameDifferent = true;
      return clamped;
    });
    if (becameDifferent) setHasActivatedDemoPlayback(true);
  };

  /**
   * Feed contract: exactly one demo has `isActive`; that screen owns playback + branch prefetch.
   * Others must stop media and prefetch (see DemoFeed / LegacyDemoScreen `isActive` handlers).
   */
  const renderDemoScreen = (index: number) => {
    if (index === 0) {
      return (
        <DemoFeed
          onBackHome={onBackHome}
          isActive={activeDemoIdx === index}
          shouldAutoStart={hasActivatedDemoPlayback}
        />
      );
    }
    return <LegacyDemoScreen demo={DEMOS[index]} onBackHome={onBackHome} isActive={activeDemoIdx === index} />;
  };

  const renderTabOverlay = () => {
    if (activeTab === 'characters') {
      return (
        <div className="absolute inset-0 z-40 bg-[#020202]">
          <CharactersTab />
        </div>
      );
    }

    if (activeTab === 'profile') {
      return (
        <div className="absolute inset-0 z-40 bg-[#020202]">
          <ProfileTab />
        </div>
      );
    }

    if (activeTab !== 'home') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/50 absolute inset-0 pb-20 z-40 bg-[#020202]">
          <p className="text-sm tracking-widest uppercase font-medium">{activeTab}</p>
          <p className="text-[10px] mt-2 opacity-50 uppercase tracking-wider">Coming soon</p>
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQueryList = window.matchMedia('(min-width: 1024px)');
    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsDesktopViewport(event.matches);
    };

    setIsDesktopViewport(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleViewportChange);
    return () => mediaQueryList.removeEventListener('change', handleViewportChange);
  }, []);

  return (
    <FeedPrefetchAbortProvider signal={feedPrefetchSession.controller.signal}>
    <div className="bg-[#020202] min-h-[100dvh] text-white font-sans selection:bg-white/30 w-full overflow-hidden flex flex-col">
      
      {/* ========================================================= */}
      {/* MOBILE EXPERIENCE (Full Screen Vertical Feed) */}
      {/* ========================================================= */}
      {!isDesktopViewport && (
        <div className="relative h-[100dvh] w-full bg-[#020202] overflow-hidden">
          <div
            ref={feedContainerRef}
            onScroll={handleFeedScroll}
            className={`h-full w-full relative overflow-y-scroll snap-y snap-mandatory hide-scrollbar ${activeTab === 'home' ? 'block' : 'hidden'}`}
          >
            {DEMOS.map((demo, index) => (
              <section key={demo.id} className="h-full w-full snap-start shrink-0">
                {renderDemoScreen(index)}
              </section>
            ))}
          </div>

          {renderTabOverlay()}
          
          <DemoBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}

      {/* ========================================================= */}
      {/* DESKTOP EXPERIENCE (Premium Presentation) */}
      {/* ========================================================= */}
      {isDesktopViewport && (
      <div className="flex flex-col min-h-[100dvh] relative overflow-y-auto">
        
        {/* Header */}
        <header className="w-full px-12 py-8 z-50 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackHome}>
            <div className="relative flex items-center justify-center w-7 h-7">
              <img
                src={CUSTOM_LOGO_URL}
                alt="Narravo AI Logo"
                className="w-7 h-7 object-contain"
                style={{ filter: 'invert(1)', borderRadius: '4px' }}
              />
              <div className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-50" />
            </div>
            <span
              className="text-white font-bold tracking-[0.2em] text-[15px] uppercase drop-shadow-lg"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Narravo AI
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
              <div className="w-full h-full relative rounded-[2.2rem] overflow-hidden bg-[#020202]">
                <div
                  ref={feedContainerRef}
                  onScroll={handleFeedScroll}
                  className={`w-full h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar ${activeTab === 'home' ? 'block' : 'hidden'}`}
                >
                  {DEMOS.map((demo, index) => (
                    <section key={demo.id} className="h-full w-full snap-start shrink-0">
                      {renderDemoScreen(index)}
                    </section>
                  ))}
                </div>

                {renderTabOverlay()}
                
                <DemoBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
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
                    onClick={() => handleSelectDemo(i)}
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
                alt="Narravo AI Logo"
                className="w-6 h-6 object-contain"
                style={{ filter: 'invert(1)', borderRadius: '3px' }}
              />
            </div>
            <span
              className="text-white/50 font-bold tracking-[0.15em] text-[12px] uppercase"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Narravo AI
            </span>
          </div>
          <p className="text-[11px] text-white/20 text-center sm:text-right">
            © 2026 Narravo AI · Confidential Investor Demo · All rights reserved
          </p>
        </footer>
      </div>
      )}
    </div>
    </FeedPrefetchAbortProvider>
  );
}
