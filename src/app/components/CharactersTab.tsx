import { motion } from 'motion/react';
import { CUSTOM_LOGO_URL } from '../interactive/scenarios/demoScenarios';

const RHEA_VOSS_AVATAR_URL = new URL('../../assets/Rhea_Voss.jpg', import.meta.url).href;
const ADRIAN_VALE_AVATAR_URL = new URL('../../assets/Adrian_Vale.jpg', import.meta.url).href;
const ELYSIA_AVATAR_URL = new URL('../../assets/Elysia.jpg', import.meta.url).href;
const LESLIY_AVATAR_VIDEO_URL = new URL('../../assets/Lesliy.mp4', import.meta.url).href;

const INTERACTIONS = [
  {
    id: 1,
    character: {
      name: 'Elysia',
      role: 'The Emotion Shifter',
      avatar: ELYSIA_AVATAR_URL,
    },
    series: { title: 'Kaleidoscope Heart', episode: 'Ep. 2' },
    relationship: { label: 'Trust Fracturing', level: 'low', color: 'text-rose-400', bg: 'bg-rose-400/10', dot: 'bg-rose-500' },
    lastMessage: "I don't know who I am anymore... please don't look at me.",
    time: '2m ago',
    unread: true,
  },
  {
    id: 2,
    character: {
      name: 'Rhea Voss',
      role: 'Breacher and Evac Escort',
      avatar: RHEA_VOSS_AVATAR_URL,
    },
    series: { title: 'Wasteland Run', episode: 'Ep. 4' },
    relationship: { label: 'Solidarity', level: 'high', color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-500' },
    lastMessage: "Move, now! I'm right behind you.",
    time: '1h ago',
    unread: false,
  },
  {
    id: 3,
    character: {
      name: 'Adrian Vale',
      role: 'Systems Maintenance',
      avatar: ADRIAN_VALE_AVATAR_URL,
    },
    series: { title: 'One Man Station', episode: 'Ep. 5' },
    relationship: { label: 'Deep Bond', level: 'high', color: 'text-blue-400', bg: 'bg-blue-400/10', dot: 'bg-blue-500' },
    lastMessage: "You... you actually stayed. I thought I was gone.",
    time: '3h ago',
    unread: false,
  },
  {
    id: 4,
    character: {
      name: 'Lesliy',
      role: 'Systems Engineer',
      avatar: LESLIY_AVATAR_VIDEO_URL,
      isVideo: true,
    },
    series: { title: 'Machine Uprising', episode: 'Ep. 1' },
    relationship: { label: 'Neutral', level: 'medium', color: 'text-white/60', bg: 'bg-white/5', dot: 'bg-white/40' },
    lastMessage: "Input the override sequence before it's too late.",
    time: '1d ago',
    unread: false,
  }
];

export function CharactersTab() {
  return (
    <div className="w-full h-full bg-[#020202] text-white pt-14 pb-28 overflow-y-auto hide-scrollbar">
      <div className="px-5 mb-6">
        <h1 className="text-[22px] font-bold tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Connections
        </h1>
        <p className="text-[11px] text-white/50 mt-1 uppercase tracking-wider font-medium">
          Recent interactions & relationship status
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 px-2 sm:gap-2.5 sm:px-3">
        {INTERACTIONS.map((item, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={item.id}
            className="relative flex flex-col rounded-[0.875rem] bg-white/[0.03] border border-white/5 overflow-hidden hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {/* Large Avatar Card Image */}
            <div className="relative w-full aspect-[4/5] bg-black/50 flex-none overflow-hidden">
              {item.character.isVideo ? (
                <video 
                  src={item.character.avatar} 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img src={item.character.avatar} alt={item.character.name} className="w-full h-full object-cover" />
              )}
              
              {/* Image Gradient Overlay for Tag Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30 pointer-events-none" />

              {/* Time indicator (moved from bottom text area) */}
              <div className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded backdrop-blur-md bg-black/40 border border-white/10 text-[8px] font-medium text-white/80 z-10">
                {item.time}
              </div>

              {/* Unread indicator */}
              {item.unread && (
                <div className="absolute top-2.5 right-2.5 w-3 h-3 bg-emerald-500 rounded-full border-[1.5px] border-[#1a1a1a] shadow-sm z-10" />
              )}

              {/* Relationship Status Floating Pill */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-md bg-black/50 border border-white/10 max-w-full`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-none ${item.relationship.dot} shadow-[0_0_5px_currentColor]`} />
                  <span className={`text-[8px] font-bold uppercase tracking-[0.1em] ${item.relationship.color} truncate`}>
                    {item.relationship.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-3.5 flex flex-col flex-1 min-w-0">
              <h3 className={`text-[14px] sm:text-[15px] font-bold truncate tracking-wide mb-1 ${item.unread ? 'text-white' : 'text-white/90'}`}>
                {item.character.name}
              </h3>
              
              <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-[0.1em] text-white/40 truncate mb-1.5">
                {item.series.title} <span className="mx-0.5 text-white/20">•</span> {item.series.episode}
              </span>

              <p className={`text-[10px] sm:text-[11px] leading-[1.35] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] ${item.unread ? 'text-white/80 font-medium' : 'text-white/50'}`}>
                {item.lastMessage}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}