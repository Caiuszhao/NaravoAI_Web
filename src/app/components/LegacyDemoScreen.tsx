import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, Maximize, MessageCircle, MoreHorizontal, Plus, X } from 'lucide-react';
import { CUSTOM_LOGO_URL } from './DemoFeed';

type LegacyDemo = {
  id: number;
  title: string;
  feedHook: string;
  commentCount: string;
  videoBg?: string;
};

type LegacyComment = {
  id: number;
  name: string;
  handle: string;
  text: string;
  likes: string;
  time: string;
};

type LegacyCharacter = {
  id: number;
  name: string;
  role: string;
  summary: string;
  unlocked: boolean;
  avatar?: string;
};

const MOCK_COMMENTS_BY_DEMO: Record<number, LegacyComment[]> = {
  2: [
    { id: 1, name: 'Ava', handle: '@ava.story', text: 'The robot lockdown timing feels intense in a good way.', likes: '1.2K', time: '2h' },
    { id: 2, name: 'Noah', handle: '@noahplays', text: 'Love the emergency elevator setting and pacing.', likes: '846', time: '3h' },
    { id: 3, name: 'Luna', handle: '@lunaverse', text: 'The override interaction is clear and easy to follow.', likes: '529', time: '5h' },
  ],
  3: [
    { id: 1, name: 'Ethan', handle: '@ethan.chat', text: 'The space station tension is really well directed.', likes: '938', time: '1h' },
    { id: 2, name: 'Sophia', handle: '@sophiaux', text: 'Would love multi-step reply branches in the next version.', likes: '711', time: '2h' },
    { id: 3, name: 'Mason', handle: '@masonbuilds', text: 'Strong narrative flow and emotional pacing.', likes: '503', time: '4h' },
  ],
};

const CHARACTERS_BY_DEMO: Record<number, LegacyCharacter[]> = {
  2: [
    {
      id: 1,
      name: 'Mira Kade',
      role: 'Systems Engineer',
      summary: 'Lead engineer who designed the evacuation control stack and knows the robot override pathways.',
      unlocked: true,
      avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    },
    {
      id: 2,
      name: 'R-17 Custodian',
      role: 'Rogue Service Robot',
      summary: 'A maintenance unit that has overridden safety constraints and sealed all vertical exits.',
      unlocked: true,
      avatar: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    },
    {
      id: 3,
      name: 'Core Sentinel',
      role: 'Locked Character',
      summary: 'Keep watching to unlock this character profile.',
      unlocked: false,
    },
  ],
  3: [
    {
      id: 1,
      name: 'Elias Ward',
      role: 'Lone Astronaut',
      summary: 'An isolated engineer on a failing station with one final repair window.',
      unlocked: true,
      avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    },
    {
      id: 2,
      name: 'Ghost Relay',
      role: 'Signal Trace',
      summary: 'Intermittent command-channel echoes that may or may not be authentic.',
      unlocked: true,
      avatar: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    },
    {
      id: 3,
      name: 'Orbit Passenger',
      role: 'Locked Character',
      summary: 'Keep watching to unlock this character profile.',
      unlocked: false,
    },
  ],
};

export function LegacyDemoScreen({
  demo,
  onBackHome,
  isActive = true,
}: {
  demo: LegacyDemo;
  onBackHome?: () => void;
  isActive?: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const comments = MOCK_COMMENTS_BY_DEMO[demo.id] ?? [];
  const characters = CHARACTERS_BY_DEMO[demo.id] ?? [];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {isMenuOpen && <div className="absolute inset-0 z-[60]" onClick={() => setIsMenuOpen(false)} />}

      <div className="absolute top-0 left-0 w-full px-5 pt-12 pb-5 z-[70] flex items-center justify-between pointer-events-none">
        <button
          onClick={onBackHome}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-all active:scale-95 relative z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsMenuOpen((previous) => !previous)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-all relative z-10"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute inset-0 z-0 bg-black">
        <video
          ref={videoRef}
          src={demo.videoBg}
          className="w-full h-full object-cover opacity-85"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end z-10">
        <div className="relative z-10 p-4 pb-12 w-full flex flex-col justify-end pointer-events-none">
          <div className="flex flex-col gap-4 w-full pointer-events-auto">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[15px] font-bold text-white drop-shadow-md leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {demo.title}
              </h2>
              <p className="text-white/80 text-[12px] font-light leading-snug max-w-[300px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                {demo.feedHook}
              </p>
            </div>

            <div className="w-full mt-2">
              <div className="flex flex-row items-center justify-between w-full min-w-0">
                <div className="relative flex flex-col items-center shrink-0">
                  <div className="w-[30px] h-[30px] rounded-full border-2 border-white overflow-hidden bg-black/50 relative">
                    <img src={CUSTOM_LOGO_URL} alt="Avatar" className="w-full h-full object-cover animate-ping absolute inset-0" style={{ animationDuration: '3s' }} />
                    <img src={CUSTOM_LOGO_URL} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                  </div>
                  <button className="absolute -bottom-1.5 w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm border border-white hover:bg-red-600 transition-colors z-20">
                    <Plus className="w-[8px] h-[8px]" strokeWidth={3} />
                  </button>
                </div>

                <div className="flex flex-row items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsLiked((previous) => !previous)}
                    className={`flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ${isLiked ? 'text-red-500' : 'text-white'}`}
                  >
                    <Heart className="w-6 h-6 fill-current drop-shadow-md" />
                  </button>
                  <span className="text-white font-semibold text-[12px] drop-shadow-md">136.1K</span>
                </div>

                <div className="flex flex-row items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setIsCharactersOpen(false);
                      setIsCommentsOpen(true);
                    }}
                    className="flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform"
                  >
                    <MessageCircle className="w-6 h-6 fill-current drop-shadow-md" style={{ transform: 'scaleX(-1)' }} />
                  </button>
                  <span className="text-white font-semibold text-[12px] drop-shadow-md">{demo.commentCount}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCommentsOpen(false);
                    setIsCharactersOpen(true);
                  }}
                  className="h-7 px-1 rounded-full border border-white/15 bg-black/45 backdrop-blur-lg flex items-center hover:bg-black/60 transition-all z-50 shrink-0"
                  aria-label="Open cast list"
                >
                  <div className="flex items-center">
                    {characters.slice(0, 2).map((character, index) => (
                      <div
                        key={character.id}
                        className={`w-4.5 h-4.5 rounded-full border border-white/25 overflow-hidden ${index === 0 ? 'ml-0' : '-ml-1'} ${character.unlocked ? 'bg-white/10' : 'bg-white/5'} flex items-center justify-center`}
                      >
                        {character.unlocked && character.avatar ? (
                          <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] text-white/70 font-bold">?</span>
                        )}
                      </div>
                    ))}
                  </div>
                </button>

                <button
                  className="flex items-center justify-center text-white/25 hover:text-white hover:scale-110 active:scale-90 transition-all z-50 shrink-0"
                >
                  <Maximize className="w-[22px] h-[22px] drop-shadow-md" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCharactersOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-[85] bg-black/60"
              onClick={() => setIsCharactersOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 inset-x-0 z-[90] mx-auto w-full max-w-[640px] rounded-t-[24px] bg-[#111214] border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,0.65)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 pt-2.5 pb-3 border-b border-white/10">
                <span className="text-[13px] font-semibold text-white">Characters</span>
                <button
                  type="button"
                  onClick={() => setIsCharactersOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[52vh] overflow-y-auto px-4 py-3 space-y-3">
                {characters.map((character) => (
                  <div key={character.id} className={`rounded-2xl border p-3.5 ${character.unlocked ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.015]'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-full border flex items-center justify-center overflow-hidden ${character.unlocked ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/5'}`}>
                        {character.unlocked && character.avatar ? (
                          <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white/70 text-[16px] font-bold">?</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[12px] font-semibold ${character.unlocked ? 'text-white/90' : 'text-white/50'}`}>{character.unlocked ? character.name : 'Locked Character'}</span>
                          <span className={`text-[10px] uppercase tracking-[0.16em] ${character.unlocked ? 'text-white/35' : 'text-white/25'}`}>{character.role}</span>
                        </div>
                        <p className={`text-[12px] leading-relaxed mt-1 ${character.unlocked ? 'text-white/70' : 'text-white/40'}`}>
                          {character.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCommentsOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-[85] bg-black/60"
              onClick={() => setIsCommentsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 inset-x-0 z-[90] mx-auto w-full max-w-[640px] rounded-t-[24px] bg-[#111214] border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,0.65)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 pt-2.5 pb-3 border-b border-white/10">
                <span className="text-[13px] font-semibold text-white">{demo.commentCount} comments</span>
                <button
                  type="button"
                  onClick={() => setIsCommentsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[52vh] overflow-y-auto px-4 py-3 space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white/85 flex items-center justify-center text-[11px] font-bold">
                      {comment.name.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-white/90 font-semibold">{comment.name}</span>
                        <span className="text-[10px] text-white/35">{comment.handle}</span>
                      </div>
                      <p className="text-[12px] text-white/75 leading-relaxed mt-0.5">{comment.text}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/35">
                        <span>{comment.time}</span>
                        <span>{comment.likes} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
