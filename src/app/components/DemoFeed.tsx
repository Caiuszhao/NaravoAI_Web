import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MoreHorizontal, Navigation, Hand, Heart, MessageCircle, Plus, Maximize, Share2, Wand2, X } from 'lucide-react';
import CUSTOM_LOGO_URL from '../../assets/3bf85ad3821c19cb83ca7268914f3d9ba7a2eab8.png';

export const DEMOS = [
  {
    id: 1,
    title: "Wasteland Run: Escape Partner",
    feedHook: "You and your partner race to a jammed shelter gate. Break the lock in 5 seconds before the horde catches you.",
    showcaseHook: "You and a dangerous ally are chased by a horde to a jammed shelter gate. Break the lock in 5 seconds, or get dragged in bleeding as the dead close in.",
    videoBg: "https://image-b2.civitai.com/file/civitai-media-cache/00f5df14-2645-4ca5-8d99-bde8b833c6f4/original",
    mediaType: "video",
    interactionMethod: "Rapid Tap (5s)",
    objective: "Smash open the shelter lock before the horde reaches you",
    interactionHint: "TAP RAPIDLY TO OVERRIDE",
    commentCount: "3,778"
  },
  {
    id: 2,
    title: "One Man Station",
    feedHook: "A lone astronaut gets one unstable relay burst. Your reply decides if he risks a final EVA repair or records a goodbye.",
    showcaseHook: "A lone astronaut drifting on a dying station restores one unstable relay burst. Your reply decides whether he risks one last EVA repair or records a final goodbye.",
    videoBg: "https://image-b2.civitai.com/file/civitai-media-cache/535584e2-0805-4b3b-96a8-fe0eb24a2205/original",
    mediaType: "video",
    interactionMethod: "Voice or Text Reply",
    objective: "Send the message that shapes his final decision",
    interactionHint: "HOLD TO SPEAK",
    commentCount: "2,154"
  }
];

export { CUSTOM_LOGO_URL };

const MOCK_COMMENTS_BY_DEMO: Record<number, Array<{ id: number; name: string; handle: string; text: string; likes: string; time: string }>> = {
  1: [
    { id: 1, name: 'Ava', handle: '@ava.story', text: 'This sequence feels intense. The tap mechanic works really well.', likes: '1.2K', time: '2h' },
    { id: 2, name: 'Noah', handle: '@noahplays', text: 'Love the pressure buildup. Feels like a real mission moment.', likes: '846', time: '3h' },
    { id: 3, name: 'Luna', handle: '@lunaverse', text: 'The gate-break objective is super clear and easy to follow.', likes: '529', time: '5h' },
    { id: 4, name: 'Kai', handle: '@kai.ai', text: 'The haptic-style visual cues are very satisfying here.', likes: '302', time: '6h' },
    { id: 5, name: 'Mia', handle: '@miaonmobile', text: 'I replayed this one a few times. Great pacing.', likes: '211', time: '8h' },
  ],
  2: [
    { id: 1, name: 'Ethan', handle: '@ethan.chat', text: 'The tone shift in this scenario is excellent.', likes: '938', time: '1h' },
    { id: 2, name: 'Sophia', handle: '@sophiaux', text: 'Voice-first interaction makes this feel very human.', likes: '711', time: '2h' },
    { id: 3, name: 'Mason', handle: '@masonbuilds', text: 'Great example of emotion-driven narrative design.', likes: '503', time: '4h' },
    { id: 4, name: 'Isla', handle: '@isla.notes', text: 'This one has stronger character tension than most demos I have seen.', likes: '296', time: '7h' },
    { id: 5, name: 'Leo', handle: '@leo.mobile', text: 'Would love to see multiple reply options in the next version.', likes: '184', time: '9h' },
  ],
};

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
  const [likedByDemoId, setLikedByDemoId] = useState<Record<number, boolean>>({});
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeCommentsDemoId, setActiveCommentsDemoId] = useState<number | null>(null);

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

  const handleToggleLike = (demoId: number) => {
    setLikedByDemoId((previous) => ({
      ...previous,
      [demoId]: !previous[demoId],
    }));
  };
  const handleOpenComments = (demoId: number) => {
    setActiveCommentsDemoId(demoId);
    setIsCommentsOpen(true);
  };
  const handleCloseComments = () => {
    setIsCommentsOpen(false);
  };
  const activeCommentsDemo = DEMOS.find((demo) => demo.id === activeCommentsDemoId) ?? DEMOS[0];
  const activeComments = MOCK_COMMENTS_BY_DEMO[activeCommentsDemo.id] ?? [];

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
        {DEMOS.map((demo) => (
        <div 
          key={demo.id} 
          className="w-full h-full snap-start relative flex flex-col justify-end overflow-hidden"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0 bg-black">
            {demo.mediaType === 'video' ? (
              <video
                src={demo.videoBg}
                className="w-full h-full object-cover opacity-80"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={demo.videoBg}
                alt={demo.title}
                className="w-full h-full object-cover opacity-80"
              />
            )}
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
                    <p className="text-white/80 text-[12px] font-light leading-snug max-w-[280px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                      {demo.feedHook}
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
                      <button
                        onClick={() => handleToggleLike(demo.id)}
                        className={`flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ${likedByDemoId[demo.id] ? 'text-red-500' : 'text-white'}`}
                      >
                        <Heart className="w-6 h-6 fill-current drop-shadow-md" />
                      </button>
                      <span className="text-white font-semibold text-[12px] drop-shadow-md">136.1K</span>
                    </div>

                    <div className="flex flex-row items-center gap-1.5">
                      <button
                        onClick={() => handleOpenComments(demo.id)}
                        className="flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform"
                      >
                        <MessageCircle className="w-6 h-6 fill-current drop-shadow-md" style={{ transform: 'scaleX(-1)' }} />
                      </button>
                      <span className="text-white font-semibold text-[12px] drop-shadow-md">{demo.commentCount}</span>
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
          <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none pb-[11rem] sm:pb-[11.5rem] lg:pb-[12rem]">
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
              onClick={handleCloseComments}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 inset-x-0 z-[90] mx-auto w-full max-w-[640px] rounded-t-[24px] bg-[#111214] border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,0.65)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 pt-2.5 pb-3 border-b border-white/10">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-white">{activeCommentsDemo.commentCount} comments</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{activeCommentsDemo.title}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseComments}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[52vh] overflow-y-auto px-4 py-3 space-y-3">
                {activeComments.map((comment) => (
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
                        <button type="button" className="hover:text-white/70 transition-colors">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-white/10 bg-[#0d0e10]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white/85 flex items-center justify-center text-[11px] font-bold">
                    Y
                  </div>
                  <input
                    type="text"
                    value=""
                    readOnly
                    placeholder="Add comment..."
                    className="flex-1 h-9 px-3 rounded-full bg-white/6 border border-white/10 text-[12px] text-white/80 placeholder:text-white/35 outline-none"
                  />
                  <button
                    type="button"
                    className="h-9 px-3 rounded-full bg-white text-black text-[11px] font-semibold hover:bg-white/90 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
