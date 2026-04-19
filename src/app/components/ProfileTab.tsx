import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { ChevronRight, Flame, Mic, Settings, Sparkles, Star, Trophy, Waves, Zap, MessageSquarePlus } from 'lucide-react';
import { CUSTOM_LOGO_URL } from '../interactive/scenarios/demoScenarios';

const ELYSIA_AVATAR_URL = new URL('../../assets/Elysia.jpg', import.meta.url).href;
const ADRIAN_VALE_AVATAR_URL = new URL('../../assets/Adrian_Vale.jpg', import.meta.url).href;
const RHEA_VOSS_AVATAR_URL = new URL('../../assets/Rhea_Voss.jpg', import.meta.url).href;

const PROFILE_STATS = [
  { label: 'Episodes', value: '11' },
  { label: 'Day Streak', value: '9' },
  { label: 'Active Bonds', value: '4' },
  { label: 'Voice Sessions', value: '27' },
];

const CONTINUE_WATCHING = [
  {
    title: 'Kaleidoscope Heart',
    progressLabel: 'Episode 2 of 5',
    progress: 42,
    accent: 'from-rose-400/70 to-fuchsia-400/40',
    detail: 'Elysia opened up, but her trust is still unstable.',
  },
  {
    title: 'One Man Station',
    progressLabel: 'Episode 5 of 6',
    progress: 83,
    accent: 'from-sky-400/70 to-cyan-300/40',
    detail: 'Adrian now responds differently when you choose voice.',
  },
  {
    title: 'Wasteland Run',
    progressLabel: 'Episode 4 of 4',
    progress: 100,
    accent: 'from-emerald-400/70 to-lime-300/40',
    detail: 'You unlocked the strongest survival bond route.',
  },
];

const RELATIONSHIP_SNAPSHOT = [
  {
    name: 'Elysia',
    role: 'Emotion Shifter',
    avatar: ELYSIA_AVATAR_URL,
    status: 'Trust Fracturing',
    statusTone: 'text-rose-300',
    statusDot: 'bg-rose-400',
    note: 'Her appearance still changes sharply with your tone.',
  },
  {
    name: 'Adrian Vale',
    role: 'Deep Bond',
    avatar: ADRIAN_VALE_AVATAR_URL,
    status: 'Emotionally Open',
    statusTone: 'text-sky-300',
    statusDot: 'bg-sky-400',
    note: 'He now treats your replies as his anchor under pressure.',
  },
  {
    name: 'Rhea Voss',
    role: 'Survival Partner',
    avatar: RHEA_VOSS_AVATAR_URL,
    status: 'Combat Sync',
    statusTone: 'text-emerald-300',
    statusDot: 'bg-emerald-400',
    note: 'Fast decisions and decisive taps improved your route outcomes.',
  },
];

const INTERACTION_DNA = [
  { icon: Mic, label: 'Preferred Mode', value: 'Voice First' },
  { icon: Waves, label: 'Emotional Style', value: 'Reassuring & Patient' },
  { icon: Zap, label: 'Best Outcome', value: 'High-pressure rescue arcs' },
  { icon: Sparkles, label: 'Unlock Pattern', value: 'Slow trust-building choices' },
];

const RECENT_MILESTONES = [
  'Unlocked Elysia’s warmer response path in Kaleidoscope Heart.',
  'Reached Adrian’s high-trust relay sequence in One Man Station.',
  'Completed the strongest route ending in Wasteland Run.',
];

export function ProfileTab() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="w-full h-full bg-[#020202] text-white pt-10 pb-28 overflow-y-auto hide-scrollbar">
      {/* Top Header / Settings */}
      <div className="w-full flex justify-end px-5 mb-4">
        <button className="text-white/40 hover:text-white/80 transition-colors p-1">
          <Settings className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-3 sm:px-4 space-y-3.5">
        <motion.section
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[1.25rem] border border-white/8 bg-white/[0.03] overflow-hidden group"
        >
          {/* Dynamic mouse glow layer */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-300 z-0"
            style={{
              background: 'radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.08), transparent 40%)',
            }}
          />

          <div className="relative z-10 p-5 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent">
            {/* Subtle fixed gradient just for baseline depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_38%)] pointer-events-none" />
            
            <div className="relative flex flex-col gap-4">
              {/* Header: Avatar & Name */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-[3.5rem] h-[3.5rem] rounded-full bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
                      alt="User profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <h2 className="text-[16px] sm:text-[18px] font-bold tracking-wide text-white/95 truncate">Alex Chen</h2>
                    <p className="text-[11px] text-white/40 mt-0.5">@alex.story</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                {PROFILE_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center justify-center rounded-[0.875rem] border border-white/5 bg-white/[0.02] py-3"
                  >
                    <span className="text-[17px] font-bold tracking-wide text-white/90">{stat.value}</span>
                    <span className="text-[9px] text-white/40 uppercase tracking-[0.15em] mt-1 font-semibold text-center leading-tight">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold tracking-wide">Continue Watching</h3>
              <p className="text-[9.5px] text-white/40 uppercase tracking-[0.15em] mt-1 font-semibold">
                Your active story routes
              </p>
            </div>
            <button className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors shadow-sm">
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-3">
            {CONTINUE_WATCHING.slice(0, 2).map((item) => (
              <div
                key={item.title}
                className="rounded-[1rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-3.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-white/95 truncate tracking-wide">{item.title}</p>
                    <p className="text-[9px] uppercase tracking-[0.15em] font-semibold text-white/40 mt-1">
                      {item.progressLabel}
                    </p>
                  </div>
                  <div className="text-[11px] font-bold text-white/60 shrink-0">{item.progress}%</div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.accent}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold tracking-wide">Interaction DNA</h3>
              <p className="text-[9.5px] text-white/40 uppercase tracking-[0.15em] mt-1 font-semibold">
                How you play this world
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {INTERACTION_DNA.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-[1rem] border border-white/6 bg-black/20 p-3"
                >
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/70 mb-2">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[8.5px] uppercase tracking-[0.12em] text-white/38">{item.label}</p>
                  <p className="text-[11px] text-white/88 font-medium mt-1 leading-[1.35]">{item.value}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-3.5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[13px] font-bold tracking-wide">Recent Milestones</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.12em] mt-1">
                Progress that shapes future routes
              </p>
            </div>
            <Trophy className="w-4 h-4 text-white/25" />
          </div>

          <div className="space-y-2">
            {RECENT_MILESTONES.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-[0.9rem] border border-white/6 bg-black/20 px-3 py-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-white/6 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-white/70" />
                </div>
                <p className="text-[10px] text-white/62 leading-[1.45]">{item}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Feedback Section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-[1.15rem] border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-4 cursor-pointer hover:bg-white/[0.06] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquarePlus className="w-5 h-5 text-white/80" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold tracking-wide text-white/95">Give Feedback</h3>
              <p className="text-[10px] text-white/50 leading-[1.4] mt-1 pr-2">
                Help us shape the world. Report bugs, critique the storyline, or suggest new character arcs.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors shrink-0" />
          </div>
        </motion.section>
      </div>
    </div>
  );
}
