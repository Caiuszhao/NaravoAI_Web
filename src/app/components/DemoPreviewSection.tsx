import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hand, Mic, MousePointerClick, ChevronRight, Activity, HeartPulse } from 'lucide-react';
import clsx from 'clsx';

const SCENES = [
  {
    id: 1,
    title: 'Escaping a dangerous world',
    instruction: 'Tap fast to break the gate',
    icon: MousePointerClick,
    image:
      'https://images.unsplash.com/photo-1705087057975-745ab6bf9086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2klMjBmaSUyMGdhdGUlMjBlc2NhcGluZyUyMGRhbmdlcnxlbnwxfHx8fDE3NzQ1OTk1MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-orange-600/60',
    progressType: 'tap',
    status: 'Tension',
    tagline: 'Physical action triggers immediate story consequences',
  },
  {
    id: 2,
    title: 'Saving someone under pressure',
    instruction: 'Hold to stabilize power',
    icon: Hand,
    image:
      'https://images.unsplash.com/photo-1760813360432-9b5d79eb9679?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2klMjBmaSUyMGdsb3dpbmclMjBjb3JlJTIwcmVhY3RvcnxlbnwxfHx8fDE3NzQ1OTk1MDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-blue-600/60',
    progressType: 'hold',
    status: 'Core Temp',
    tagline: 'Sustained gestures build tension and agency',
  },
  {
    id: 3,
    title: 'Emotionally responding',
    instruction: 'Say something to calm her down',
    icon: Mic,
    image:
      'https://images.unsplash.com/photo-1685726343439-c2ade275f58c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2klMjBmaSUyMHdvbWFuJTIwY2luZW1hdGljJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0NTk5NTA3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-purple-600/60',
    progressType: 'voice',
    status: 'Trust Level',
    tagline: 'Voice input reshapes character emotion in real time',
  },
  {
    id: 4,
    title: 'Changing the outcome',
    instruction: 'Swipe before time runs out',
    icon: ChevronRight,
    image:
      'https://images.unsplash.com/photo-1771794597356-0b5ba57e17e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2klMjBmaSUyMGZhc3QlMjBtb3Rpb24lMjBhY3Rpb258ZW58MXx8fHwxNzc0NTk5NTA3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    color: 'from-red-600/60',
    progressType: 'swipe',
    status: 'Danger',
    tagline: 'Swipe decisions branch the entire narrative arc',
  },
];

export function DemoPreviewSection() {
  const [activeScene, setActiveScene] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveScene((current) => (current + 1) % SCENES.length);
          return 0;
        }
        return prev + 1.2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const scene = SCENES[activeScene];
  const Icon = scene.icon;

  return (
    <section className="py-24 md:py-32 bg-[#000000] overflow-hidden relative">
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 xl:px-24">
        {/* Section header */}
        <div className="text-center mb-14 md:mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            Naravo Engine Live Demo
          </div>
          <h2
            className="text-[1.9rem] md:text-[2.6rem] lg:text-[3rem] leading-[1.1] font-bold mb-4 tracking-tight text-white/90"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Natural actions.
            <br />
            <span className="text-white drop-shadow-lg">Real consequences.</span>
          </h2>
          <p className="text-[14px] md:text-[15px] text-white/40 leading-relaxed font-light max-w-[500px] mx-auto">
            React to emotional tension and narrative urgency exactly like you would in a real situation. The AI adapts instantly.
          </p>
        </div>

        {/* Main content: phone + sidebar */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-16 xl:gap-20 justify-center">

          {/* Phone Mockup */}
          <div className="relative w-full max-w-[300px] md:max-w-[320px] shrink-0">
            {/* Glow behind phone */}
            <div className="absolute inset-0 -z-10 bg-white/5 blur-3xl rounded-full scale-150" />

            <div className="relative w-full aspect-[9/19.5] rounded-[3rem] bg-black border-[12px] border-[#0a0a0a] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group">
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-full z-50 flex items-center px-4 justify-between border-[1px] border-[#222]">
                <div className="w-2.5 h-2.5 rounded-full bg-white/5 shadow-inner" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,1)]" />
              </div>
              {/* Side buttons */}
              <div className="absolute top-24 -right-[13px] w-1 h-12 bg-[#222] rounded-l-md opacity-50" />
              <div className="absolute top-36 -right-[13px] w-1 h-20 bg-[#222] rounded-l-md opacity-50" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-black"
                >
                  <img src={scene.image} alt={scene.title} className="w-full h-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
                  <div className={clsx('absolute inset-0 bg-gradient-to-t to-transparent opacity-60 mix-blend-overlay', scene.color)} />
                  <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)]" />

                  {/* HUD */}
                  <div className="absolute top-[3.5rem] w-full px-5 flex flex-col gap-3 z-30">
                    <div className="flex gap-1">
                      {SCENES.map((s, idx) => (
                        <div key={s.id} className="h-[2px] rounded-full bg-white/10 overflow-hidden flex-1 backdrop-blur-sm">
                          {idx === activeScene && (
                            <motion.div
                              className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)]"
                              style={{ width: `${progress}%` }}
                            />
                          )}
                          {idx < activeScene && <div className="h-full w-full bg-white/80" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/10 w-fit shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                      <HeartPulse className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      <span className="text-[9px] font-bold tracking-[0.25em] text-white/70 uppercase">{scene.status}</span>
                      <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden ml-1">
                        <motion.div
                          className={clsx('h-full', progress > 70 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]' : 'bg-white/80')}
                          animate={{ width: `${Math.min(100, Math.max(10, 100 - progress + Math.random() * 10))}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lower action */}
                  <div className="absolute bottom-16 left-0 w-full px-6 z-30 flex flex-col items-center">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mb-8 flex flex-col items-center text-center w-full"
                    >
                      <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/60 mb-3 bg-black/50 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        {scene.title}
                      </div>
                      <h3 className="text-[24px] font-bold tracking-tight text-white drop-shadow-[0_4px_15px_rgba(0,0,0,1)] leading-tight">
                        {scene.instruction}
                      </h3>
                    </motion.div>

                    <div className="relative w-28 h-28 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <motion.div
                        className="absolute inset-0 rounded-full border-[1.5px] border-white/20 bg-white/5 backdrop-blur-2xl shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                        animate={{
                          scale: scene.progressType === 'tap' ? [1, 1.15, 1] : 1,
                          opacity: scene.progressType === 'tap' ? [0.6, 1, 0.6] : 1,
                          borderColor: scene.progressType === 'tap' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                        }}
                        transition={{ repeat: Infinity, duration: scene.progressType === 'tap' ? 0.3 : 2 }}
                      />
                      {scene.progressType === 'hold' && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
                          <circle cx="56" cy="56" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          <circle
                            cx="56" cy="56" r="54" fill="none" stroke="#fff" strokeWidth="3"
                            strokeDasharray={339}
                            strokeDashoffset={339 - (339 * progress) / 100}
                            className="transition-all duration-75"
                          />
                        </svg>
                      )}
                      {scene.progressType === 'voice' && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full bg-white/20 blur-xl"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                          />
                          <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-0 opacity-50 mix-blend-screen">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]"
                                animate={{ height: [8, 28, 8] }}
                                transition={{ repeat: Infinity, duration: 0.4 + i * 0.1 }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      {scene.progressType === 'swipe' && (
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <motion.div
                            className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12 blur-md"
                            animate={{ x: [-60, 140] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
                          />
                        </div>
                      )}
                      <div className="relative z-10 w-16 h-16 bg-black/60 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        <Icon className="w-7 h-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Side panel - visible on lg+ */}
          <div className="hidden lg:flex flex-col gap-5 max-w-[420px] xl:max-w-[480px] w-full pt-4">
            <div className="mb-4">
              <p className="text-[12px] font-semibold tracking-[0.2em] text-white/30 uppercase mb-3">Active Scenes</p>
              <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            {SCENES.map((s, idx) => {
              const SIcon = s.icon;
              const isActive = idx === activeScene;
              return (
                <motion.button
                  key={s.id}
                  onClick={() => { setActiveScene(idx); setProgress(0); }}
                  className={clsx(
                    'group w-full text-left p-5 rounded-[20px] border transition-all duration-500 relative overflow-hidden',
                    isActive
                      ? 'bg-white/[0.06] border-white/15 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  )}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  {isActive && (
                    <div className="absolute bottom-0 left-0 h-[2px] bg-white/40 rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
                  )}
                  <div className="flex items-start gap-4">
                    <div className={clsx(
                      'w-10 h-10 shrink-0 rounded-[12px] border flex items-center justify-center transition-all duration-300',
                      isActive ? 'bg-white/10 border-white/20' : 'bg-white/[0.03] border-white/5'
                    )}>
                      <SIcon className={clsx('w-4.5 h-4.5', isActive ? 'text-white' : 'text-white/40')} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={clsx(
                          'text-[13px] font-semibold leading-tight transition-colors',
                          isActive ? 'text-white' : 'text-white/50'
                        )} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {s.title}
                        </span>
                        <span className={clsx(
                          'shrink-0 text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border transition-all',
                          isActive ? 'text-white/70 border-white/20 bg-white/10' : 'text-white/20 border-white/5'
                        )}>
                          {s.status}
                        </span>
                      </div>
                      <p className={clsx(
                        'text-[12px] leading-relaxed font-light transition-colors',
                        isActive ? 'text-white/50' : 'text-white/25'
                      )}>
                        {s.tagline}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}

            {/* Engine callout */}
            <div className="mt-4 p-5 rounded-[20px] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Naravo Engine</span>
              </div>
              <p className="text-[13px] text-white/40 leading-relaxed font-light">
                Every input maps to a live emotional-state model. Characters remember, react, and diverge based on your exact decisions — not pre-scripted branches.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile scene tabs */}
        <div className="flex lg:hidden gap-2 justify-center mt-8 flex-wrap">
          {SCENES.map((s, idx) => {
            const SIcon = s.icon;
            const isActive = idx === activeScene;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveScene(idx); setProgress(0); }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-full border text-[11px] font-semibold transition-all',
                  isActive
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/[0.03] border-white/5 text-white/40'
                )}
              >
                <SIcon className="w-3 h-3" strokeWidth={1.5} />
                {s.status}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
