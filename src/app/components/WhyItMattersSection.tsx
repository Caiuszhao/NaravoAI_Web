import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShieldCheck, Target, Layers, TrendingUp } from 'lucide-react';

const POINTS = [
  {
    text: 'Stronger immersion than passive short video',
    subtext: 'Users stay 4.8× longer vs. TikTok-style scroll feeds.',
    icon: Target,
  },
  {
    text: 'Lower friction than traditional games',
    subtext: 'No onboarding, no controllers. Just natural physical instincts.',
    icon: ShieldCheck,
  },
  {
    text: 'Stronger emotional retention through AI characters',
    subtext: 'Characters users connect with become reasons to return daily.',
    icon: CheckCircle2,
  },
  {
    text: 'Better replayability and UGC potential',
    subtext: 'Branching and remix features create a self-sustaining content flywheel.',
    icon: Layers,
  },
];

const METRICS = [
  { label: 'TAM', value: '$180B', sub: 'Interactive entertainment' },
  { label: 'Retention', value: '71%', sub: 'D30 replay rate' },
  { label: 'Session', value: '23 min', sub: 'Avg. engagement' },
];

export function WhyItMattersSection() {
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
    <section className="py-24 md:py-32 bg-black relative border-t border-white/[0.04] overflow-hidden">
      {/* Decorative rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] border border-white/[0.02] rounded-[100%] rotate-12 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] border border-white/[0.03] rounded-[100%] -rotate-6 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none z-0" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 xl:px-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <h2 className="text-[10px] font-semibold tracking-[0.3em] text-white/40 uppercase mb-4 flex items-center justify-center gap-2">
            <TrendingUp className="w-3 h-3" />
            Market Potential
          </h2>
          <h3
            className="text-[2rem] md:text-[2.6rem] lg:text-[3rem] font-bold tracking-tight text-white/90"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Why it matters
          </h3>
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16 p-6 md:p-8 rounded-[24px] bg-white/[0.02] border border-white/[0.05]">
          {METRICS.map((m, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-1">
              <span
                className="text-[1.8rem] md:text-[2.4rem] lg:text-[3rem] font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {m.value}
              </span>
              <span className="text-[11px] md:text-[12px] text-white/30 uppercase tracking-widest">{m.label}</span>
              <span className="text-[11px] text-white/20 hidden md:block">{m.sub}</span>
            </div>
          ))}
        </div>

        {/* Points grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {POINTS.map((pt, idx) => {
            const Icon = pt.icon;
            const focus = mobileFocus[idx] ?? 0;
            return (
              <motion.div
                key={idx}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ delay: idx * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group flex items-start gap-5 p-5 md:p-6 rounded-[20px] bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500"
                style={
                  isMobile
                    ? {
                        backgroundColor: `rgba(255,255,255,${0.03 + focus * 0.02})`,
                        borderColor: `rgba(255,255,255,${0.05 + focus * 0.05})`,
                      }
                    : undefined
                }
              >
                <div
                  className="w-11 h-11 shrink-0 rounded-[14px] bg-white/[0.03] flex items-center justify-center text-white/40 border border-white/5 group-hover:text-white/80 group-hover:border-white/10 transition-all duration-300 mt-0.5"
                  style={
                    isMobile
                      ? {
                          color: `rgba(255,255,255,${0.4 + focus * 0.4})`,
                          borderColor: `rgba(255,255,255,${0.05 + focus * 0.05})`,
                        }
                      : undefined
                  }
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p
                    className="text-[14px] md:text-[15px] font-medium text-white/80 leading-snug tracking-wide group-hover:text-white transition-colors"
                    style={isMobile ? { color: `rgba(255,255,255,${0.8 + focus * 0.2})` } : undefined}
                  >
                    {pt.text}
                  </p>
                  <p
                    className="text-[12px] md:text-[13px] text-white/30 leading-relaxed font-light group-hover:text-white/50 transition-colors"
                    style={isMobile ? { color: `rgba(255,255,255,${0.3 + focus * 0.2})` } : undefined}
                  >
                    {pt.subtext}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
