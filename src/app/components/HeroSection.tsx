import { useState, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { Play, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';
import logoImg from '../../assets/3bf85ad3821c19cb83ca7268914f3d9ba7a2eab8.png';
import bgVideo from '../../assets/BGVideo_cut.mp4';

export function HeroSection({
  onTryLiveDemo,
  onLogoClick,
}: {
  onTryLiveDemo?: () => void;
  onLogoClick?: () => void;
}) {
  const [videoReady, setVideoReady] = useState(false);
  const scrollToSection = (sectionId: string) => {
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    targetSection.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const handleExploreVisionClick = () => {
    scrollToSection('naravo-engine-live-demo');
  };
  const handleGetInTouchClick = () => {
    scrollToSection('naravo-closing-cta');
  };
  const handleLogoClick = () => {
    onLogoClick?.();
  };
  const handleLogoKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onLogoClick?.();
  };

  return (
    <section className="relative h-[100svh] md:h-[100dvh] min-h-[600px] w-full flex flex-col overflow-hidden bg-black">
      {/* Brand Header */}
      <header className="absolute top-0 left-0 w-full px-6 md:px-10 lg:px-16 py-6 z-50 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex items-center gap-3 cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Toggle debug UI"
          onClick={handleLogoClick}
          onKeyDown={handleLogoKeyDown}
        >
          <div className="relative flex items-center justify-center w-7 h-7">
            <img
              src={logoImg}
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
        </motion.div>

        <div className="flex items-center gap-3">
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            type="button"
            onClick={handleGetInTouchClick}
            className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-colors text-[11px] font-semibold text-white/80 uppercase tracking-widest"
          >
            Get in Touch
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>
      </header>

      {/* Background Image & Immersive Overlays */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: 'easeOut' }}
          src="https://images.unsplash.com/photo-1750192524484-36450bbb1dd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2klMjBjaW5lbWF0aWMlMjBkYXJrJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0NTk5NDUxfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Naravo AI Cinematic Environment"
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            videoReady ? 'opacity-0' : 'opacity-50'
          }`}
        />
        <video
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            videoReady ? 'opacity-58' : 'opacity-0'
          }`}
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setVideoReady(true)}
        />
        {!videoReady && (
          <div className="absolute top-[22%] md:top-[18%] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="w-14 h-14 rounded-full border-2 border-white/30 border-t-white/60 animate-spin shadow-[0_0_24px_rgba(255,255,255,0.2)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/45 to-transparent h-1/2" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-50" />
        {/* Desktop: darken right side less so image breathes more */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
      </div>

      {/* Mobile layout: bottom-aligned content */}
      <div className="lg:hidden relative z-10 flex flex-col justify-end h-full px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4 mb-8"
        >
          <div className="flex items-center gap-2 text-white/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">
              The Next Era of Entertainment
            </span>
          </div>

          <div className="space-y-3">
            <h1
              className="text-[2.2rem] leading-[1.1] font-bold tracking-tight text-white drop-shadow-2xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="block mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Naravo AI
              </span>
              <span className="block text-[1.35rem] leading-[1.2] text-white/90 font-medium tracking-tight mb-2">
                A character-driven interactive narrative platform
              </span>
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-white/30 via-white/10 to-white/30 rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition duration-700" />
            <button
              type="button"
              onClick={onTryLiveDemo}
              className="relative flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-white text-black font-bold text-[15px] hover:bg-white/90 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-white/20"
            >
              <Play className="w-5 h-5 fill-black" />
              Try the Live Demo
            </button>
          </div>

          <button
            type="button"
            onClick={handleExploreVisionClick}
            className="text-center text-[11px] text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em] font-medium pt-2"
          >
            Explore the Vision
          </button>
        </motion.div>
      </div>

      {/* Desktop layout: split composition */}
      <div className="hidden lg:flex relative z-10 h-full items-center">
        <div className="w-full max-w-[1400px] mx-auto px-16 xl:px-24 flex items-center">
          {/* Left: headline + CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-8 max-w-[600px] xl:max-w-[680px]"
          >
            <div className="flex items-center gap-2 text-white/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold tracking-[0.25em] uppercase">
                The Next Era of Entertainment
              </span>
            </div>

            <div className="space-y-4">
              <h1
                className="font-bold tracking-tight text-white drop-shadow-2xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span className="block text-[4.5rem] xl:text-[5.5rem] leading-[1] mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
                  Naravo AI
                </span>
                <span className="block text-[1.7rem] xl:text-[2rem] leading-[1.2] text-white/90 font-medium tracking-tight mb-3">
                  A character-driven interactive<br />narrative platform
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/30 via-white/10 to-white/30 rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition duration-700" />
                <button
                  type="button"
                  onClick={onTryLiveDemo}
                  className="relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white text-black font-bold text-[15px] hover:bg-white/90 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-white/20 whitespace-nowrap"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Try the Live Demo
                </button>
              </div>

              <button
                type="button"
                onClick={handleExploreVisionClick}
                className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em] font-medium whitespace-nowrap"
              >
                Explore the Vision
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-8 mt-4 pt-8 border-t border-white/[0.06]">
              {[
                { label: 'Engagement Rate', value: '4.8×' },
                { label: 'Session Length', value: '23 min' },
                { label: 'Replay Rate', value: '71%' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span className="text-[1.6rem] font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {stat.value}
                  </span>
                  <span className="text-[11px] text-white/40 uppercase tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: decorative floating card / visual hint */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="ml-auto shrink-0 flex items-center justify-center"
          >
            <div className="relative w-[260px] xl:w-[300px]">
              {/* Glow */}
              <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150" />
              {/* Phone frame preview */}
              <div className="relative w-full aspect-[9/19] rounded-[2.5rem] bg-black border-[8px] border-[#111] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                <img
                  src="https://images.unsplash.com/photo-1685726343439-c2ade275f58c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2klMjBmaSUyMHdvbWFuJTIwY2luZW1hdGljJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0NTk5NTA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Naravo preview"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60" />
                {/* Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50" />
                {/* HUD */}
                <div className="absolute bottom-8 left-0 w-full px-5 flex flex-col items-center gap-3">
                  <div className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/60 bg-black/50 backdrop-blur-xl px-3 py-1 rounded-full border border-white/10">
                    Emotional Response
                  </div>
                  <p className="text-[16px] font-bold text-white text-center drop-shadow-lg leading-tight">
                    Say something to calm her down
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-white/70 rounded-full"
                        animate={{ height: [6, 18, 6] }}
                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute -bottom-4 -left-6 bg-[#0a0a0a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
                  <span className="text-[11px] text-white/80 font-semibold">AI adapting in real-time</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-40"
        animate={{ y: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-5 h-5 text-white" />
      </motion.div>
    </section>
  );
}
