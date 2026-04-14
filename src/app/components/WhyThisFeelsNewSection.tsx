import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Fingerprint, BrainCircuit, Globe2 } from 'lucide-react';
import interactionImage from '../../assets/c44981d37b8b400632b02c54d9b603b6c41cf8be.png';
import charactersImage from '../../assets/02608a605cb5f66ed702b0e5d56baf9602cd0e2d.png';
import storiesImage from '../../assets/a911760b9fbec7c5395a98574e460d103840bb8e.png';

const CARDS = [
  {
    title: 'Interaction lives inside the story',
    description:
      'Narravo AI replaces menus with physical and vocal interactions, creating dynamic shifts in tension, pacing, and real-time outcomes.',
    icon: Fingerprint,
    image: interactionImage,
    color: 'text-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    borderGlow: 'from-white/20',
    accent: 'from-blue-500/10',
  },
  {
    title: 'Characters continue beyond the scene',
    description:
      'Powered by Naravo Engine, AI characters maintain persistent emotional memory and agency long after the core scene resolves.',
    icon: BrainCircuit,
    image: charactersImage,
    color: 'text-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    borderGlow: 'from-white/20',
    accent: 'from-purple-500/10',
  },
  {
    title: 'Stories become reusable worlds',
    description:
      'A scalable ecosystem. Branching narratives act as seeds that players can indefinitely replay, expand, and remix into parallel timelines.',
    icon: Globe2,
    image: storiesImage,
    color: 'text-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    borderGlow: 'from-white/20',
    accent: 'from-emerald-500/10',
  },
];

export function WhyThisFeelsNewSection() {
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [imageOpacity, setImageOpacity] = useState<Record<number, number>>({});
  const [imageMaskOpacity, setImageMaskOpacity] = useState<Record<number, number>>({});
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const viewportWidthRef = useRef(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const center = window.innerHeight / 2;
      const maxDist = center || 1;
      const next: Record<number, number> = {};
      const nextMask: Record<number, number> = {};

      cardRefs.current.forEach((el, idx) => {
        if (!el) {
          return;
        }
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - center);
        const t = Math.max(0, 1 - dist / maxDist);
        next[idx] = 0.35 + t * 0.63;
        nextMask[idx] = 0.55 - t * 0.5;
      });

      setImageOpacity((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        if (prevKeys.length !== nextKeys.length) {
          return next;
        }
        for (const key of nextKeys) {
          if (prev[Number(key)] !== next[Number(key)]) {
            return next;
          }
        }
        return prev;
      });

      setImageMaskOpacity((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextMask);
        if (prevKeys.length !== nextKeys.length) {
          return nextMask;
        }
        for (const key of nextKeys) {
          if (prev[Number(key)] !== nextMask[Number(key)]) {
            return nextMask;
          }
        }
        return prev;
      });
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      const width = window.innerWidth;
      if (Math.abs(width - viewportWidthRef.current) < 2) {
        return;
      }
      viewportWidthRef.current = width;
      onScroll();
    };

    viewportWidthRef.current = window.innerWidth;
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

  const handleImageLoaded = (index: number) => {
    setLoadedImages((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
  };

  const handleCardPress = (index: number) => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      return;
    }
    setActiveCardIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="py-24 md:py-32 bg-[#000000] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.02)_0%,transparent_50%)] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="mb-14 md:mb-20 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              Core Differentiation
            </h2>
            <h3
              className="text-[2rem] md:text-[2.6rem] lg:text-[3rem] font-bold tracking-tight text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Why this feels new
            </h3>
            <div className="h-px w-24 bg-gradient-to-r from-white/30 to-transparent rounded-full mt-6" />
          </div>
          <p className="text-[14px] md:text-[15px] text-white/35 leading-relaxed font-light max-w-[360px] md:text-right">
            A new category of entertainment that bridges the emotional depth of cinema with the agency of games.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 relative z-10">
          {CARDS.map((card, idx) => {
            const Icon = card.icon;
            const isActive = activeCardIndex === idx;
            return (
              <motion.div
                key={idx}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ delay: idx * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative overflow-hidden rounded-[24px] bg-[#050505] border border-white/5 hover:border-white/12 transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)] ${
                  isActive ? 'border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.7)]' : ''
                }`}
                role="button"
                tabIndex={0}
                onClick={() => handleCardPress(idx)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCardPress(idx);
                  }
                }}
              >
                {/* Top image strip */}
                <div className="relative h-48 md:h-44 lg:h-52 overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-white/8 via-white/3 to-transparent transition-opacity duration-500 ${
                      loadedImages[idx] ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <img
                    src={card.image}
                    alt={card.title}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => handleImageLoaded(idx)}
                    className={`w-full h-full object-cover scale-105 group-hover:scale-100 transition-all duration-700 ${
                      isActive ? 'scale-100' : ''
                    }`}
                    style={{
                      opacity: loadedImages[idx] ? Math.min((imageOpacity[idx] ?? 0.35) + (isActive ? 0.12 : 0), 0.98) : 0,
                    }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505]"
                    style={{
                      opacity: loadedImages[idx] ? Math.max((imageMaskOpacity[idx] ?? 0.55) - (isActive ? 0.12 : 0), 0) : 1,
                    }}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                    style={{ opacity: isActive ? 1 : undefined }}
                  />
                </div>

                {/* Content */}
                <div className="relative p-6 md:p-7 flex flex-col gap-5">
                  <div
                    className={`w-12 h-12 shrink-0 rounded-[14px] bg-white/[0.03] flex items-center justify-center border border-white/5 transition-all duration-500 ${card.color} ${
                      isActive ? 'shadow-[0_0_20px_rgba(255,255,255,0.2)]' : ''
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 text-white/50 group-hover:text-white transition-colors duration-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] ${
                        isActive ? 'text-white' : ''
                      }`}
                      strokeWidth={1.5}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <h4
                      className={`text-[17px] md:text-[18px] font-semibold text-white/90 leading-tight group-hover:text-white transition-colors ${
                        isActive ? 'text-white' : ''
                      }`}
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {card.title}
                    </h4>
                    <p
                      className={`text-[13px] md:text-[14px] text-white/40 leading-relaxed font-light group-hover:text-white/60 transition-colors ${
                        isActive ? 'text-white/60' : ''
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
