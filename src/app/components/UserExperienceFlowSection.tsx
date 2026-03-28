import React from 'react';
import { motion } from 'motion/react';
import { Eye, Mic, Zap, Unlock } from 'lucide-react';

const FLOW_STEPS = [
  {
    id: 1,
    title: 'Watch a story moment',
    icon: Eye,
    description: 'High-quality vertical cinematic storytelling pulls users into fully realized narrative worlds.',
    color: 'text-blue-400',
    glow: 'shadow-[0_0_20px_rgba(96,165,250,0.15)]',
    bg: 'from-blue-500/10',
  },
  {
    id: 2,
    title: 'Act / speak / respond',
    icon: Mic,
    description: 'Natural behavioral inputs — not menus. Users tap, hold, swipe, or speak inside the moment.',
    color: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
    bg: 'from-amber-500/10',
  },
  {
    id: 3,
    title: 'Trigger consequence',
    icon: Zap,
    description: 'Immediate feedback and an altered narrative path. Every action shifts the story in real time.',
    color: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(248,113,113,0.15)]',
    bg: 'from-red-500/10',
  },
  {
    id: 4,
    title: 'Unlock continuation',
    icon: Unlock,
    description: 'Explore branching worlds seamlessly. The narrative expands, remembers, and keeps adapting.',
    color: 'text-purple-400',
    glow: 'shadow-[0_0_20px_rgba(192,132,252,0.15)]',
    bg: 'from-purple-500/10',
  },
];

export function UserExperienceFlowSection() {
  return (
    <section className="py-24 md:py-32 bg-[#000000] relative">
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20 relative z-10">
          <h2 className="text-[10px] font-semibold tracking-[0.3em] text-white/40 uppercase mb-4">The Engine</h2>
          <h3
            className="text-[2rem] md:text-[2.6rem] lg:text-[3rem] font-bold mb-4 tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Experience Flow
          </h3>
          <p className="text-[14px] md:text-[15px] text-white/40 max-w-[400px] mx-auto leading-relaxed">
            An intuitive, productized journey designed to feel natural on any screen.
          </p>
        </div>

        {/* Mobile: vertical timeline. Desktop: 2×2 grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 relative z-10">
          {FLOW_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ delay: idx * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex flex-col gap-5 p-6 md:p-7 rounded-[24px] bg-[#050505] border border-white/[0.06] hover:border-white/12 transition-all duration-500 overflow-hidden"
              >
                {/* Accent bg */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.bg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

                {/* Step number badge */}
                <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold shadow-lg shrink-0">
                  {step.id}
                </div>

                <div className={`relative z-10 w-14 h-14 rounded-[18px] bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center group-hover:border-white/20 group-hover:${step.glow} transition-all duration-500`}>
                  <Icon className={`w-6 h-6 opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${step.color}`} strokeWidth={1.5} />
                </div>

                <div className="relative z-10 flex flex-col gap-2">
                  <h4
                    className="text-[16px] font-semibold text-white/90 leading-tight group-hover:text-white transition-colors"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[13px] text-white/40 leading-relaxed font-light group-hover:text-white/60 transition-colors">
                    {step.description}
                  </p>
                </div>

                {/* Connector arrow (except last) */}
                {idx < FLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-6 h-px bg-white/15" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: vertical list with connecting line */}
        <div className="md:hidden relative max-w-[400px] mx-auto">
          <div className="absolute left-[38px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-full" />

          <div className="flex flex-col gap-8">
            {FLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ delay: idx * 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex gap-6 group"
                >
                  <div className="w-20 h-20 shrink-0 rounded-[22px] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-105 group-hover:border-white/20">
                    <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold shadow-lg">
                      {step.id}
                    </div>
                    <Icon className={`w-8 h-8 opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${step.color}`} strokeWidth={1.5} />
                  </div>

                  <div className="flex flex-col justify-center py-2">
                    <h4
                      className="text-[17px] font-semibold text-white/90 leading-tight mb-2 group-hover:text-white transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[13px] text-white/40 leading-relaxed font-light group-hover:text-white/60 transition-colors">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
