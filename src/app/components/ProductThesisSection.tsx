import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Film, Activity, Cpu, Repeat } from 'lucide-react';

const STACK = [
  {
    title: 'Immersive Storytelling',
    desc: 'Premium cinematic vertical video with professional production quality and emotional depth.',
    icon: Film,
    color: 'from-blue-500/10',
    iconColor: 'text-blue-400/70 group-hover:text-blue-300',
  },
  {
    title: 'Behavioral Input Engine',
    desc: 'Voice, touch, and sensor-driven actions replace menus and multiple choice interactions.',
    icon: Activity,
    color: 'from-amber-500/10',
    iconColor: 'text-amber-400/70 group-hover:text-amber-300',
  },
  {
    title: 'Sentient AI Characters',
    desc: 'Persistent emotional memory, agency, and response. Characters grow with every session.',
    icon: Cpu,
    color: 'from-purple-500/10',
    iconColor: 'text-purple-400/70 group-hover:text-purple-300',
  },
  {
    title: 'Scalable Narrative Worlds',
    desc: 'Replayable, expanding, user-remixable story ecosystems that grow with the community.',
    icon: Repeat,
    color: 'from-emerald-500/10',
    iconColor: 'text-emerald-400/70 group-hover:text-emerald-300',
  },
];

export function ProductThesisSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFocus, setMobileFocus] = useState<Record<number, number>>({});
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    let frame = 0;
    let width = window.innerWidth;

    const update = () => {
      frame = 0;
      const currentIsMobile = window.innerWidth < 768;
      setIsMobile(currentIsMobile);
      if (!currentIsMobile) {
        setMobileFocus({});
        return;
      }
      const center = window.innerHeight / 2;
      const maxDist = center || 1;
      const next: Record<number, number> = {};
      cardRefs.current.forEach((el, idx) => {
        if (!el) {
          return;
        }
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - center);
        next[idx] = Math.max(0, 1 - dist / maxDist);
      });
      setMobileFocus(next);
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      const nextWidth = window.innerWidth;
      if (Math.abs(nextWidth - width) < 2) {
        return;
      }
      width = nextWidth;
      onScroll();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section className="py-24 md:py-32 bg-[#020202] relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
        }}
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 xl:px-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <h2 className="text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase mb-4 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            Narravo AI Platform Vision
          </h2>
          <h3
            className="text-[1.9rem] md:text-[2.6rem] lg:text-[3rem] leading-[1.1] font-bold tracking-tight text-white mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            A scalable engine for interactive stories.
          </h3>
          <p className="text-[14px] md:text-[15px] text-white/35 leading-relaxed font-light max-w-[500px] mx-auto">
            Four interconnected layers form a platform no single product has combined before.
          </p>
        </div>

        {/* Desktop: 2x2 grid. Mobile: vertical stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {STACK.map((el, idx) => {
            const Icon = el.icon;
            const focus = mobileFocus[idx] ?? 0;
            return (
              <motion.div
                key={idx}
                ref={(node) => {
                  cardRefs.current[idx] = node;
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ delay: idx * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative flex flex-col gap-5 p-6 md:p-8 rounded-[24px] bg-[#060606] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-500 shadow-2xl overflow-hidden`}
                style={
                  isMobile
                    ? {
                        borderColor: `rgba(255,255,255,${0.06 + focus * 0.06})`,
                      }
                    : undefined
                }
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${el.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
                  style={isMobile ? { opacity: focus } : undefined}
                />

                {/* Step number */}
                <div className="absolute top-5 right-5 text-[10px] font-bold text-white/10 tracking-[0.2em] uppercase">
                  0{idx + 1}
                </div>

                <div className="relative z-10 flex items-start gap-4">
                  <div
                    className="relative w-12 h-12 shrink-0 rounded-[14px] bg-black border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.8)] group-hover:border-white/20 transition-all"
                    style={isMobile ? { borderColor: `rgba(255,255,255,${0.1 + focus * 0.1})` } : undefined}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-300 ${el.iconColor}`} strokeWidth={1.5} />
                    <div
                      className="absolute inset-0 rounded-[14px] bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={isMobile ? { opacity: focus } : undefined}
                    />
                  </div>

                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <span
                      className="text-[16px] md:text-[17px] font-semibold text-white/90 leading-tight group-hover:text-white transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {el.title}
                    </span>
                    <span
                      className="text-[13px] md:text-[14px] font-light text-white/35 leading-relaxed group-hover:text-white/55 transition-colors"
                      style={isMobile ? { color: `rgba(255,255,255,${0.35 + focus * 0.2})` } : undefined}
                    >
                      {el.desc}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 h-px bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full w-0 group-hover:w-full bg-gradient-to-r from-white/20 to-transparent transition-all duration-700 ease-out"
                    style={isMobile ? { width: `${focus * 100}%` } : undefined}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-10 md:mt-14 p-6 md:p-8 rounded-[24px] border border-white/[0.05] bg-gradient-to-r from-white/[0.02] to-transparent flex flex-col md:flex-row md:items-center gap-6 md:gap-10"
        >
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Platform Status</span>
          </div>
          <div className="h-px md:h-8 w-full md:w-px bg-white/5 shrink-0" />
          <p className="text-[14px] md:text-[15px] text-white/50 leading-relaxed font-light flex-1">
            The Naravo Engine is <span className="text-white/80 font-medium">live and demonstrable</span> — with interactive narrative, behavioral input parsing, and AI character systems operational in the current build.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
