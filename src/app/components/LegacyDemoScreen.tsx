import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, Maximize, MessageCircle, MoreHorizontal, Plus, X } from 'lucide-react';
import { CUSTOM_LOGO_URL } from './DemoFeed';
import { resolveCachedMediaUrl } from '../utils/mediaCache';
import { generateText } from '../utils/generateClient';

function extractEmotionType(payload: unknown): 1 | 2 | 3 | 4 | 5 | null {
  const asAny = payload as any;
  const direct = Number(asAny?.emotion_type);
  if (Number.isFinite(direct) && direct >= 1 && direct <= 5) return direct as 1 | 2 | 3 | 4 | 5;

  const raw = Number(asAny?.raw?.emotion_type);
  if (Number.isFinite(raw) && raw >= 1 && raw <= 5) return raw as 1 | 2 | 3 | 4 | 5;

  const outputText = asAny?.output_text;
  if (typeof outputText === 'string') {
    const trimmed = outputText.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const parsedEmotion = Number((parsed as any)?.emotion_type);
        if (Number.isFinite(parsedEmotion) && parsedEmotion >= 1 && parsedEmotion <= 5) {
          return parsedEmotion as 1 | 2 | 3 | 4 | 5;
        }
      } catch {
        // ignore
      }
    }
    const match = trimmed.match(/emotion_type\D*([1-5])/i);
    if (match) return Number(match[1]) as 1 | 2 | 3 | 4 | 5;
  }

  return null;
}

type LegacyDemo = {
  id: number;
  title: string;
  feedHook: string;
  commentCount: string;
  videoBg?: string;
  videos?: readonly string[];
  startIndex?: number; // 1-based, defaults to 1
  bgmUrl?: string;
  playVideoAudio?: boolean;
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
  const isDemo3 = demo.id === 3;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(() => {
    const start = demo.startIndex ?? 1;
    return Math.max(0, start - 1);
  });

  const playlist = demo.videos?.length ? demo.videos : demo.videoBg ? [demo.videoBg] : [];
  const [resolvedMediaMap, setResolvedMediaMap] = useState<Record<string, string>>({});

  const demo3UrlByFilename: Record<string, string> = {};
  if (isDemo3) {
    for (const url of playlist) {
      const filename = url.split('/').pop();
      if (filename) demo3UrlByFilename[filename] = url;
    }
  }
  const getDemo3ClipUrl = (filename: string) =>
    demo3UrlByFilename[filename] ??
    // Allow underscore variant for ep_4_2 (actual file is `ep4_2.mp4`)
    demo3UrlByFilename[filename.replace('ep_4_2.mp4', 'ep4_2.mp4')] ??
    demo3UrlByFilename[filename.replace('ep4_2.mp4', 'ep_4_2.mp4')] ??
    undefined;

  const [demo3CurrentFilename, setDemo3CurrentFilename] = useState('index_1.mp4');
  const [demo3Queue, setDemo3Queue] = useState<string[]>(['ep_2.mp4']);
  const [demo3CountdownLeft, setDemo3CountdownLeft] = useState(10);
  const [demo3InputValue, setDemo3InputValue] = useState('');
  const demo3GenerateAbortRef = useRef<AbortController | null>(null);
  const [isDemo3Generating, setIsDemo3Generating] = useState(false);
  const [demo3PromptActive, setDemo3PromptActive] = useState(false);
  const [demo3CountdownActive, setDemo3CountdownActive] = useState(false);
  const [demo3HighEmotionHits, setDemo3HighEmotionHits] = useState(0); // count of emotion_type 4/5 hits (cap at 2)

  const activeDirectSrc = isDemo3
    ? getDemo3ClipUrl(demo3CurrentFilename)
    : playlist[activeVideoIndex] ?? playlist[0] ?? undefined;
  const activeSrc = activeDirectSrc ? (resolvedMediaMap[activeDirectSrc] ?? activeDirectSrc) : undefined;

  const comments = MOCK_COMMENTS_BY_DEMO[demo.id] ?? [];
  const characters = CHARACTERS_BY_DEMO[demo.id] ?? [];

  useEffect(() => {
    if (!isActive) return;
    if (!isDemo3) return;
    if (playlist.length === 0) return;

    const controller = new AbortController();
    const putResolved = (direct: string, resolved: string) => {
      if (!direct || !resolved || direct === resolved) return;
      setResolvedMediaMap((prev) => (prev[direct] === resolved ? prev : { ...prev, [direct]: resolved }));
    };

    void (async () => {
      // Warm up BGM and next clip early so index_1 -> ep_2 is smooth.
      if (demo.bgmUrl) {
        const bgmResolved = await resolveCachedMediaUrl(demo.bgmUrl, {
          kind: 'audio',
          signal: controller.signal,
        });
        putResolved(demo.bgmUrl, bgmResolved);
      }

      const nextUrl = getDemo3ClipUrl('ep_2.mp4');
      if (nextUrl) {
        const nextResolved = await resolveCachedMediaUrl(nextUrl, {
          kind: 'video',
          signal: controller.signal,
        });
        putResolved(nextUrl, nextResolved);
      }
    })();

    return () => controller.abort();
  }, [isActive, isDemo3, demo.bgmUrl, playlist]); // playlist change reflects new URLs

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isActive]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tryStart = () => {
      if (!isActive) return;
      // Keep BGM under the video's voice by default.
      audio.volume = 0.25;
      void audio.play().catch(() => undefined);
    };

    if (isActive) {
      tryStart();
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    // Retry on first user interaction if autoplay is blocked.
    const retry = () => tryStart();
    document.addEventListener('pointerdown', retry, { capture: true });
    document.addEventListener('keydown', retry, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', retry, { capture: true } as any);
      document.removeEventListener('keydown', retry, { capture: true } as any);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (isDemo3) {
      setDemo3CurrentFilename('index_1.mp4');
      setDemo3Queue(['ep_2.mp4']);
      setDemo3PromptActive(false);
      setDemo3CountdownActive(false);
      setDemo3CountdownLeft(10);
      setDemo3HighEmotionHits(0);
      return;
    }
    if (activeVideoIndex === 0) return;
    setActiveVideoIndex(0);
  }, [isActive]);

  useEffect(() => {
    if (!isDemo3) return;
    if (!demo3CountdownActive) {
      setDemo3CountdownLeft(10);
      return;
    }
    setDemo3CountdownLeft(10);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, 10 - elapsed);
      setDemo3CountdownLeft(left);
      if (left <= 0) {
        window.clearInterval(timer);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [isDemo3, demo3CountdownActive]);

  // If prompt is shown and user doesn't input, treat as emotion_type=5.
  // - With countdown: auto-submit when countdown reaches 0.
  // - Without countdown: silently auto-submit after 10s if input remains empty.
  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive) return;
    if (!demo3PromptActive) return;
    if (isDemo3Generating) return;

    if (demo3CountdownActive) {
      if (demo3CountdownLeft > 0) return;
      // Countdown ended => auto-submit (empty => emotion_type=5).
      void submitDemo3Input();
      return;
    }

    if (demo3InputValue.trim().length > 0) return;
    const timer = window.setTimeout(() => {
      void submitDemo3Input();
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [
    isDemo3,
    isActive,
    demo3PromptActive,
    demo3CountdownActive,
    demo3CountdownLeft,
    demo3InputValue,
    isDemo3Generating,
  ]);

  // Prefetch next clip when current changes (Demo3 only).
  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive) return;
    const nextFilename = demo3Queue[0];
    if (!nextFilename) return;
    const nextUrl = getDemo3ClipUrl(nextFilename);
    if (!nextUrl) return;
    const controller = new AbortController();
    const putResolved = (direct: string, resolved: string) => {
      if (!direct || !resolved || direct === resolved) return;
      setResolvedMediaMap((prev) => (prev[direct] === resolved ? prev : { ...prev, [direct]: resolved }));
    };
    void (async () => {
      const resolved = await resolveCachedMediaUrl(nextUrl, { kind: 'video', signal: controller.signal });
      putResolved(nextUrl, resolved);
    })();
    return () => controller.abort();
  }, [isDemo3, isActive, demo3CurrentFilename, demo3Queue]);

  const demo3StartPrompt = (withCountdown: boolean) => {
    setDemo3PromptActive(true);
    setDemo3CountdownActive(withCountdown);
    if (withCountdown) {
      setDemo3CountdownLeft(10);
    }
  };

  const demo3StopPrompt = () => {
    setDemo3PromptActive(false);
    setDemo3CountdownActive(false);
    setDemo3CountdownLeft(10);
  };

  const demo3GoTo = (filename: string, queue: string[]) => {
    setDemo3CurrentFilename(filename);
    setDemo3Queue(queue);
  };

  const applyEmotionBranch = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    // Branching model as described by user.
    if (emotionType === 5) {
      // Retry mechanism: ep_4_1 -> ep_4_2(ep4_2) then prompt again.
      demo3GoTo('ep_4_1.mp4', ['ep4_2.mp4']);
      return;
    }

    if (emotionType === 4) {
      // ep_4_3 -> ep_4_4 (prompt during ep_4_4)
      demo3GoTo('ep_4_3.mp4', ['ep_4_4.mp4']);
      return;
    }

    if (emotionType === 1) {
      demo3GoTo('ep_3_1.mp4', ['ep_5.mp4']);
      return;
    }
    if (emotionType === 2) {
      demo3GoTo('ep_3_2.mp4', ['ep_5.mp4']);
      return;
    }
    demo3GoTo('ep_3_3.mp4', ['ep_5.mp4']);
  };

  const applyEmotionAfterEp44 = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    if (emotionType === 5) {
      // Directly to ep_3_6
      demo3GoTo('ep_3_6.mp4', ['ep_5.mp4']);
      return;
    }
    if (emotionType === 4) {
      // ep_3-4 then prompt again
      demo3GoTo('ep_3-4.mp4', []);
      return;
    }
    // Fallback: treat as end.
    demo3GoTo('ep_5.mp4', []);
  };

  const applyEmotionAfterEp34 = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    if (emotionType === 4) {
      demo3GoTo('ep_3_5.mp4', ['ep_5.mp4']);
      return;
    }
    if (emotionType === 5) {
      demo3GoTo('ep_3_6.mp4', ['ep_5.mp4']);
      return;
    }
    demo3GoTo('ep_5.mp4', []);
  };

  const submitDemo3Input = async () => {
    if (!demo3PromptActive) return;

    const rawText = demo3InputValue;
    const trimmed = rawText.trim();
    let emotionType: 1 | 2 | 3 | 4 | 5 = 5;

    // Empty input => emotion_type=5 (retry).
    if (trimmed) {
      demo3GenerateAbortRef.current?.abort();
      const controller = new AbortController();
      demo3GenerateAbortRef.current = controller;
      setIsDemo3Generating(true);
      try {
        const result = await generateText({ text: trimmed }, { signal: controller.signal });
        emotionType = extractEmotionType(result) ?? 5;
      } catch (error) {
        console.warn('[demo3] generate failed', error);
        emotionType = 5;
      } finally {
        if (demo3GenerateAbortRef.current === controller) {
          demo3GenerateAbortRef.current = null;
        }
        setIsDemo3Generating(false);
      }
    }

    const isHighEmotion = emotionType === 4 || emotionType === 5;
    const nextHighHits = demo3HighEmotionHits + (isHighEmotion ? 1 : 0);
    if (isHighEmotion) {
      setDemo3HighEmotionHits(nextHighHits);
      // If emotion_type is 4/5 (or combination) hits cap, go straight to result video.
      if (nextHighHits >= 2) {
        demo3StopPrompt();
        demo3GoTo('ep_5.mp4', []);
        return;
      }
    }

    // Stop prompt UI before transitioning.
    demo3StopPrompt();

    // Decide which decision point we are at based on current clip.
    if (demo3CurrentFilename === 'ep_2.mp4') {
      applyEmotionBranch(emotionType);
      return;
    }
    if (demo3CurrentFilename === 'ep_4_4.mp4') {
      applyEmotionAfterEp44(emotionType);
      return;
    }
    if (demo3CurrentFilename === 'ep_3-4.mp4') {
      applyEmotionAfterEp34(emotionType);
      return;
    }

    // If prompt came from post-ep4_2 retry point, treat as initial decision.
    applyEmotionBranch(emotionType);
  };

  // When Demo3 enters specific clips, activate prompts/countdown as required.
  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive) return;

    if (demo3CurrentFilename === 'ep_2.mp4') {
      demo3StartPrompt(true);
      return;
    }

    if (demo3CurrentFilename === 'ep_4_4.mp4') {
      demo3StartPrompt(false);
      return;
    }

    if (demo3CurrentFilename === 'ep_3-4.mp4') {
      demo3StartPrompt(false);
      return;
    }

    // Otherwise no prompt unless explicitly triggered (e.g. after ep4_2 ends).
    demo3StopPrompt();
  }, [isDemo3, isActive, demo3CurrentFilename]);

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
        {demo.bgmUrl && (
          <audio
            ref={audioRef}
            src={resolvedMediaMap[demo.bgmUrl] ?? demo.bgmUrl}
            autoPlay={isActive}
            loop
            preload="auto"
          />
        )}
        <video
          ref={videoRef}
          src={activeSrc}
          className="w-full h-full object-cover opacity-85"
          autoPlay={isActive}
          loop={!isDemo3 && playlist.length <= 1}
          muted={!demo.playVideoAudio}
          playsInline
          preload="auto"
          onEnded={() => {
            if (isDemo3) {
              // Demo3 is driven by a queue/state machine.
              if (demo3CurrentFilename === 'ep4_2.mp4') {
                // After ep_4_2 playback, prompt again (retry input point).
                demo3StartPrompt(false);
                return;
              }

              const next = demo3Queue[0];
              if (next) {
                setDemo3CurrentFilename(next);
                setDemo3Queue((prev) => prev.slice(1));
                return;
              }
              return;
            }

            if (playlist.length <= 1) return;
            setActiveVideoIndex((previous) => {
              const next = previous + 1;
              return next >= playlist.length ? 0 : next;
            });
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {isDemo3 && demo3CountdownActive && (
        <>
          {/* Top 10s countdown overlay (Demo 3, ep_2 only) */}
          <div className="absolute top-[3.25rem] left-0 right-0 z-[69] px-4 pointer-events-none">
            <div className="mx-auto w-fit rounded-full border border-white/15 bg-black/45 backdrop-blur-xl px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80 tabular-nums">
                {demo3CountdownLeft}s
              </span>
            </div>
          </div>
        </>
      )}

      {isDemo3 && demo3PromptActive && (
        <>
          {/* Bottom text input overlay */}
          <div className="absolute left-0 right-0 bottom-0 z-[80] px-4 pb-5 pointer-events-auto">
            <div className="mx-auto w-full max-w-[560px] rounded-[18px] border border-white/10 bg-black/55 backdrop-blur-xl p-3 shadow-[0_-20px_45px_rgba(0,0,0,0.45)]">
              <input
                type="text"
                value={demo3InputValue}
                onChange={(e) => setDemo3InputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  if (e.shiftKey) return;
                  e.preventDefault();
                  if (!isDemo3Generating) void submitDemo3Input();
                }}
                placeholder="Type your reply..."
                className="w-full h-11 px-4 rounded-[14px] bg-white/6 border border-white/10 text-[13px] text-white/85 placeholder:text-white/35 outline-none"
              />
            </div>
          </div>
        </>
      )}

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
