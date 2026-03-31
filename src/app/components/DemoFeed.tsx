import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MoreHorizontal, Navigation, Hand, Heart, MessageCircle, Plus, Maximize, Share2, Wand2 } from 'lucide-react';
import CUSTOM_LOGO_URL from '../../assets/3bf85ad3821c19cb83ca7268914f3d9ba7a2eab8.png';

export const DEMOS = [
  {
    id: 1,
    title: "Breach the Mainframe",
    hook: "The core is failing. You must bypass the firewall before the drone arrives.",
    videoBg: "https://images.unsplash.com/photo-1643602810290-24bb5b22141a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2ktZmklMjBjeWJlcnB1bmslMjBjaGFyYWN0ZXIlMjBwb3J0cmFpdCUyMHZlcnRpY2FsfGVufDF8fHx8MTc3NDkzMDczNXww&ixlib=rb-4.1.0&q=80&w=1080",
    interactionMethod: "Rapid Tap",
    objective: "Break open the security gate",
    interactionHint: "TAP RAPIDLY TO OVERRIDE"
  },
  {
    id: 2,
    title: "De-escalation",
    hook: "She's losing trust. Choose your words carefully to calm the situation.",
    videoBg: "https://images.unsplash.com/photo-1677226234951-fc5363d2db6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBkYXJrJTIwdGVuc2UlMjBwb3J0cmFpdCUyMHZlcnRpY2FsfGVufDF8fHx8MTc3NDkzMDc0MXww&ixlib=rb-4.1.0&q=80&w=1080",
    interactionMethod: "Voice / Reply",
    objective: "Affect character's trust and emotion",
    interactionHint: "HOLD TO SPEAK"
  }
];

export { CUSTOM_LOGO_URL };

export function DemoFeed({
  onIndexChange,
  activeIndex,
  onBackHome,
}: {
  onIndexChange?: (index: number) => void;
  activeIndex?: number;
  onBackHome?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    if (isProgrammaticScroll.current) return;

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      const { scrollTop, clientHeight } = containerRef.current!;
      const index = Math.round(scrollTop / clientHeight);
      if (onIndexChange) onIndexChange(index);
    }, 150);
  };

  useEffect(() => {
    if (containerRef.current && activeIndex !== undefined) {
      const { scrollTop, clientHeight } = containerRef.current;
      const targetScrollTop = activeIndex * clientHeight;
      
      if (Math.abs(scrollTop - targetScrollTop) > 5) {
        isProgrammaticScroll.current = true;
        
        containerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
        
        // Reset flag after animation completes
        const timer = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIndex]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Full screen overlay to close menu */}
      {isMenuOpen && (
        <div 
          className="absolute inset-0 z-[60]" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Absolute top overlay UI (shared across the feed) */}
      <div className={`absolute top-0 left-0 w-full px-5 pt-12 pb-5 z-[70] flex items-center justify-between pointer-events-none transition-opacity duration-300 ${isFullscreen ? 'opacity-0' : 'opacity-100'}`}>
        <button 
          onClick={onBackHome}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-all active:scale-95 relative z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-3 pointer-events-auto relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all relative z-10"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 right-0 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden min-w-[140px] shadow-2xl z-20"
              >
                <div className="flex flex-col py-1.5">
                  <button className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 transition-colors w-full text-left">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Share</span>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 transition-colors w-full text-left">
                    <Wand2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Remix</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory bg-black hide-scrollbar"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {DEMOS.map((demo, idx) => (
        <div 
          key={demo.id} 
          className="w-full h-full snap-start relative flex flex-col justify-end overflow-hidden"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0 bg-black">
            <img 
              src={demo.videoBg} 
              alt={demo.title}
              className="w-full h-full object-cover opacity-80"
            />
            {/* Cinematic overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
          </div>

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="relative z-10 p-4 pb-12 w-full flex flex-col justify-end pointer-events-none">
              <div className="flex flex-col gap-4 w-full pointer-events-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ amount: 0.8 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className={`flex flex-col gap-1.5 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <h2 className="text-[15px] font-bold text-white drop-shadow-md leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {demo.title}
                    </h2>
                    <p className="text-white/80 text-[12px] font-light leading-snug max-w-[280px]">
                      {demo.hook}
                    </p>
                  </div>
                </motion.div>

                {/* Bottom interaction row */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ amount: 0.8 }}
                  className="flex flex-row items-center justify-between w-full mt-2 ml-1 pr-2"
                >
                  <div className={`flex flex-row items-center gap-5 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="relative flex flex-col items-center">
                      <div className="w-[30px] h-[30px] rounded-full border-2 border-white overflow-hidden bg-black/50 relative">
                        <img src={CUSTOM_LOGO_URL} alt="Avatar" className="w-full h-full object-cover animate-ping absolute inset-0" style={{ animationDuration: '3s' }} />
                        <img src={CUSTOM_LOGO_URL} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                      </div>
                      <button className="absolute -bottom-1.5 w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm border border-white hover:bg-red-600 transition-colors z-20">
                        <Plus className="w-[8px] h-[8px]" strokeWidth={3} />
                      </button>
                    </div>

                    <div className="flex flex-row items-center gap-1.5">
                      <button className="flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform">
                        <Heart className="w-6 h-6 fill-current drop-shadow-md" />
                      </button>
                      <span className="text-white font-semibold text-[12px] drop-shadow-md">136.1K</span>
                    </div>

                    <div className="flex flex-row items-center gap-1.5">
                      <button className="flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform">
                        <MessageCircle className="w-6 h-6 fill-current drop-shadow-md" style={{ transform: 'scaleX(-1)' }} />
                      </button>
                      <span className="text-white font-semibold text-[12px] drop-shadow-md">3778</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="flex items-center justify-center text-white/25 hover:text-white hover:scale-110 active:scale-90 transition-all z-50"
                  >
                    <Maximize className="w-[22px] h-[22px] drop-shadow-md" />
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Centered Interaction element */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none pb-44 sm:pb-36">
            <div className={`transition-transform duration-300 ${isFullscreen ? 'translate-y-16' : 'translate-y-0'}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ amount: 0.8 }}
                className="flex flex-col items-center justify-center gap-3 w-full pointer-events-auto"
              >
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 border border-white/30 rounded-full animate-ping opacity-60" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-2 border border-white/40 rounded-full animate-ping opacity-40" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                <button className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  <Hand className="w-6 h-6" />
                </button>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white drop-shadow-md">
                {demo.interactionHint}
              </span>
            </motion.div>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
