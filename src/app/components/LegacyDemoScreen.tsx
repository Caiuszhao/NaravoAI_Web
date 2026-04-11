import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, Maximize, MessageCircle, MoreHorizontal, Plus, RotateCcw, X } from 'lucide-react';
import { CUSTOM_LOGO_URL } from './DemoFeed';
import { resolveCachedMediaUrl, warmupVideoUrl } from '../utils/mediaCache';
import { getDemo3PrefetchFilenames } from '../utils/demo3Prefetch';
import { generateText } from '../utils/generateClient';
import { createMp3ObjectUrl, postPrompt, postPromptTts } from '../utils/promptTtsClient';
import { buildPromptTtsFullPrompt } from '../utils/demo3NarrationPrompt';
import { PROMPT_TTS_CLONE_MEDIA_TYPE, PROMPT_TTS_CLONE_VOICE_ID } from '../config/ttsCloneVoice';
import { DEMO3_FIXED_TEST_REPLY } from '../utils/demo3BranchTest';
import { useDemoDebug } from '../context/DemoDebugContext';
import { useApiEnv } from '../context/ApiEnvContext';

const DEMO3_COVER_URL = new URL('../../assets/Demo3-cover.jpg', import.meta.url).href;

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

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
  const { push: pushDebug } = useDemoDebug();
  const { baseUrl: generateApiBaseUrl } = useApiEnv();
  const prevDemo3ClipRef = useRef<string | null>(null);
  const isDemo3 = demo.id === 3;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const demo3Video0Ref = useRef<HTMLVideoElement>(null);
  const demo3Video1Ref = useRef<HTMLVideoElement>(null);
  const demo3PlaySigRef = useRef('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
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
  const [demo3ShowReplay, setDemo3ShowReplay] = useState(false);
  const [demo3Lead, setDemo3Lead] = useState<0 | 1>(0);
  const [demo3SlotSrc, setDemo3SlotSrc] = useState<[string, string]>(['', '']);
  const [demo3IsLoading, setDemo3IsLoading] = useState(false);
  const demo3ReplayTokenRef = useRef(0);
  const [demo3IsCoverVisible, setDemo3IsCoverVisible] = useState(true);
  const demo3LastUserReplyRef = useRef('');
  const demo3NarrationAbortRef = useRef<AbortController | null>(null);
  const demo3NarrationSigRef = useRef<string>('');
  const [demo3NarrationText, setDemo3NarrationText] = useState('');
  const [demo3NarrationAudioUrl, setDemo3NarrationAudioUrl] = useState<string | null>(null);
  const [demo3NarrationLoading, setDemo3NarrationLoading] = useState(false);
  const [demo3NarrationError, setDemo3NarrationError] = useState<string | null>(null);
  const demo3NarrationAudioRef = useRef<HTMLAudioElement>(null);
  const demo3NarrationUrlUnmountRef = useRef<string | null>(null);
  const demo3ClipRef = useRef(demo3CurrentFilename);
  const demo3PromptActiveRef = useRef(demo3PromptActive);

  useEffect(() => {
    demo3ClipRef.current = demo3CurrentFilename;
  }, [demo3CurrentFilename]);
  useEffect(() => {
    demo3PromptActiveRef.current = demo3PromptActive;
  }, [demo3PromptActive]);

  const activeDirectSrc = isDemo3
    ? getDemo3ClipUrl(demo3CurrentFilename)
    : playlist[activeVideoIndex] ?? playlist[0] ?? undefined;
  const activeSrc = activeDirectSrc ? (resolvedMediaMap[activeDirectSrc] ?? activeDirectSrc) : undefined;

  const comments = MOCK_COMMENTS_BY_DEMO[demo.id] ?? [];
  const characters = CHARACTERS_BY_DEMO[demo.id] ?? [];

  demo3NarrationUrlUnmountRef.current = demo3NarrationAudioUrl;
  useEffect(() => {
    return () => {
      const u = demo3NarrationUrlUnmountRef.current;
      if (u) URL.revokeObjectURL(u);
    };
  }, []);

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
      if (demo.bgmUrl) {
        const bgmResolved = await resolveCachedMediaUrl(demo.bgmUrl, {
          kind: 'audio',
          signal: controller.signal,
        });
        putResolved(demo.bgmUrl, bgmResolved);
      }
    })();

    return () => controller.abort();
  }, [isActive, isDemo3, demo.bgmUrl, playlist]); // playlist change reflects new URLs

  useEffect(() => {
    if (isDemo3) return;
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isActive, isDemo3]);

  useEffect(() => {
    if (!isDemo3) return;
    const v0 = demo3Video0Ref.current;
    const v1 = demo3Video1Ref.current;
    if (!v0 || !v1) return;
    if (!isActive) {
      v0.pause();
      v1.pause();
      return;
    }
    const lead = demo3Lead;
    const active = lead === 0 ? v0 : v1;
    const other = lead === 0 ? v1 : v0;
    other.pause();
    const url = demo3SlotSrc[lead];
    if (!url) return;
    const sig = `${lead}|${demo3CurrentFilename}`;
    const jumped = demo3PlaySigRef.current !== sig;
    demo3PlaySigRef.current = sig;
    if (jumped) active.currentTime = 0;
    void active.play().catch(() => undefined);
  }, [isDemo3, isActive, demo3Lead, demo3CurrentFilename, demo3SlotSrc]);

  const bgmPlayableSrc = demo.bgmUrl ? (resolvedMediaMap[demo.bgmUrl] ?? demo.bgmUrl) : '';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !demo.bgmUrl) return;

    if (!isActive) {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = true;
      audio.volume = 0;
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    // Demo3 ep_last: pause BGM so narration can be heard clearly.
    if (isDemo3 && demo3CurrentFilename === 'ep_last.mp4') {
      audio.pause();
      return;
    }

    const tryStart = () => {
      if (!isActiveRef.current) return;
      audio.muted = false;
      audio.volume = 0.25;
      void audio.play().catch(() => undefined);
    };

    tryStart();

    const retry = () => tryStart();
    document.addEventListener('pointerdown', retry, { capture: true });
    document.addEventListener('keydown', retry, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', retry, { capture: true } as any);
      document.removeEventListener('keydown', retry, { capture: true } as any);
    };
  }, [isActive, demo.bgmUrl, bgmPlayableSrc, isDemo3, demo3CurrentFilename]);

  useEffect(() => {
    if (!isActive) return;
    if (isDemo3) {
      demo3PlaySigRef.current = '';
      setDemo3Lead(0);
      setDemo3SlotSrc(['', '']);
      setDemo3CurrentFilename('index_1.mp4');
      setDemo3Queue(['ep_2.mp4']);
      setDemo3PromptActive(false);
      setDemo3CountdownActive(false);
      setDemo3CountdownLeft(10);
      setDemo3HighEmotionHits(0);
      setDemo3ShowReplay(false);
      setDemo3IsCoverVisible(true);
      demo3LastUserReplyRef.current = '';
      demo3NarrationAbortRef.current?.abort();
      demo3NarrationAbortRef.current = null;
      demo3NarrationSigRef.current = '';
      setDemo3NarrationText('');
      setDemo3NarrationError(null);
      setDemo3NarrationLoading(false);
      setDemo3NarrationAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      const narEl = demo3NarrationAudioRef.current;
      if (narEl) {
        narEl.pause();
        narEl.removeAttribute('src');
        void narEl.load();
      }
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
    if (demo3ShowReplay) return;
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
    demo3ShowReplay,
  ]);

  // Prefetch current + all reachable branch heads; warm decoders (Demo3 only).
  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive) return;
    if (playlist.length === 0) return;

    const controller = new AbortController();
    const putResolved = (direct: string, resolved: string) => {
      if (!direct || !resolved || direct === resolved) return;
      setResolvedMediaMap((prev) => (prev[direct] === resolved ? prev : { ...prev, [direct]: resolved }));
    };

    const filenameSet = new Set<string>([
      demo3CurrentFilename,
      ...getDemo3PrefetchFilenames(demo3CurrentFilename, demo3Queue),
    ]);
    const directUrls = [...filenameSet]
      .map((fn) => getDemo3ClipUrl(fn))
      .filter((u): u is string => Boolean(u));
    const uniqueDirect = [...new Set(directUrls)];

    const processOne = async (direct: string) => {
      const resolved = await resolveCachedMediaUrl(direct, { kind: 'video', signal: controller.signal });
      putResolved(direct, resolved);
      await warmupVideoUrl(resolved, { signal: controller.signal, timeoutMs: 12000 });
    };

    const runPool = async (items: string[], concurrency: number) => {
      const q = [...items];
      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          while (q.length > 0) {
            const item = q.shift();
            if (!item) break;
            try {
              await processOne(item);
            } catch {
              // ignore per-asset failures
            }
          }
        })
      );
    };

    void runPool(uniqueDirect, 2);
    return () => controller.abort();
  }, [isDemo3, isActive, demo3CurrentFilename, demo3Queue, playlist]);

  useEffect(() => {
    if (!isDemo3 || !isActive) return;
    const curD = getDemo3ClipUrl(demo3CurrentFilename);
    const curR = curD ? (resolvedMediaMap[curD] ?? curD) : '';
    const nextF = demo3Queue[0];
    const nextD = nextF ? getDemo3ClipUrl(nextF) : undefined;
    const nextR = nextD ? (resolvedMediaMap[nextD] ?? nextD) : '';
    const L = demo3Lead;
    setDemo3SlotSrc((prev) => {
      const next: [string, string] = [...prev];
      next[L] = curR;
      next[1 - L] = nextR || '';
      if (next[0] === prev[0] && next[1] === prev[1]) return prev;
      return next;
    });
  }, [isDemo3, isActive, demo3CurrentFilename, demo3Queue, demo3Lead, resolvedMediaMap]);

  const demo3StartPrompt = (withCountdown: boolean) => {
    setDemo3InputValue('');
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
      demo3GoTo('ep_3_1.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    if (emotionType === 2) {
      demo3GoTo('ep_3_2.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    demo3GoTo('ep_3_3.mp4', ['ep_5.mp4', 'ep_last.mp4']);
  };

  const applyEmotionAfterEp44 = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    // Second input point (after first emotion_type=4 -> ep_4_3 -> ep_4_4).
    // - 1/2/3 => A/B/C lines (ep_3_x -> ep_5)
    // - 4 => D line (ep_3-4 with another prompt)
    // - 5 => E line end (ep_3_6)
    if (emotionType === 1) {
      demo3GoTo('ep_3_1.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    if (emotionType === 2) {
      demo3GoTo('ep_3_2.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    if (emotionType === 3) {
      demo3GoTo('ep_3_3.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    if (emotionType === 4) {
      demo3GoTo('ep_3-4.mp4', []);
      return;
    }
    demo3GoTo('ep_3_6.mp4', []);
  };

  const applyEmotionAfterEp34 = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    // Third input point (after second emotion_type=4 -> ep_3-4).
    // - 1/2/3 => A/B/C lines (ep_3_x -> ep_5)
    // - 4 => play ep_3_5 then end at ep_5
    // - 5 => E line end (ep_3_6)
    if (emotionType === 1) {
      demo3GoTo('ep_3_1.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    if (emotionType === 2) {
      demo3GoTo('ep_3_2.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    if (emotionType === 3) {
      demo3GoTo('ep_3_3.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    if (emotionType === 4) {
      demo3GoTo('ep_3_5.mp4', ['ep_5.mp4', 'ep_last.mp4']);
      return;
    }
    demo3GoTo('ep_3_6.mp4', []);
  };

  const applyDemo3EmotionAtCurrentClip = (clip: string, emotionType: 1 | 2 | 3 | 4 | 5) => {
    if (clip === 'ep4_2.mp4') {
      if (emotionType === 1) {
        demo3GoTo('ep_3_1.mp4', ['ep_5.mp4', 'ep_last.mp4']);
        return;
      }
      if (emotionType === 2) {
        demo3GoTo('ep_3_2.mp4', ['ep_5.mp4', 'ep_last.mp4']);
        return;
      }
      if (emotionType === 3) {
        demo3GoTo('ep_3_3.mp4', ['ep_5.mp4', 'ep_last.mp4']);
        return;
      }
      if (emotionType === 4) {
        demo3GoTo('ep_3-4.mp4', []);
        return;
      }
      demo3GoTo('ep_3_6.mp4', []);
      return;
    }
    if (clip === 'ep_2.mp4') {
      applyEmotionBranch(emotionType);
      return;
    }
    if (clip === 'ep_4_4.mp4') {
      applyEmotionAfterEp44(emotionType);
      return;
    }
    if (clip === 'ep_3-4.mp4') {
      applyEmotionAfterEp34(emotionType);
      return;
    }
    applyEmotionBranch(emotionType);
  };

  const applyDemo3EmotionAtCurrentClipRef = useRef(applyDemo3EmotionAtCurrentClip);
  applyDemo3EmotionAtCurrentClipRef.current = applyDemo3EmotionAtCurrentClip;

  const flushDemo3NarrationAudioElement = useCallback(() => {
    const el = demo3NarrationAudioRef.current;
    if (!el) return;
    el.pause();
    el.removeAttribute('src');
    void el.load();
  }, []);

  const handleDemo3ReplayFromStart = () => {
    demo3GenerateAbortRef.current?.abort();
    demo3GenerateAbortRef.current = null;
    setIsDemo3Generating(false);
    setDemo3ShowReplay(false);
    setDemo3PromptActive(false);
    setDemo3CountdownActive(false);
    setDemo3CountdownLeft(10);
    setDemo3InputValue('');
    setDemo3HighEmotionHits(0);
    demo3LastUserReplyRef.current = '';
    demo3NarrationAbortRef.current?.abort();
    demo3NarrationAbortRef.current = null;
    demo3NarrationSigRef.current = '';
    setDemo3NarrationText('');
    setDemo3NarrationError(null);
    setDemo3NarrationLoading(false);
    setDemo3NarrationAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    flushDemo3NarrationAudioElement();
    setDemo3IsLoading(true);

    const token = ++demo3ReplayTokenRef.current;
    const controller = new AbortController();

    const waitForReady = (video: HTMLVideoElement, timeoutMs: number) =>
      new Promise<void>((resolve) => {
        if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return resolve();
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          video.removeEventListener('canplay', finish);
          video.removeEventListener('loadeddata', finish);
          video.removeEventListener('error', finish);
          window.clearTimeout(tid);
          resolve();
        };
        const tid = window.setTimeout(finish, timeoutMs);
        video.addEventListener('canplay', finish);
        video.addEventListener('loadeddata', finish);
        video.addEventListener('error', finish);
      });

    void (async () => {
      try {
        const indexDirect = getDemo3ClipUrl('index_1.mp4');
        const ep2Direct = getDemo3ClipUrl('ep_2.mp4');
        if (!indexDirect) return;

        const indexResolved = await resolveCachedMediaUrl(indexDirect, { kind: 'video', signal: controller.signal });
        if (token !== demo3ReplayTokenRef.current) return;
        // Warm up decoder so first frame is ready ASAP.
        await warmupVideoUrl(indexResolved, { signal: controller.signal, timeoutMs: 12000 });
        if (token !== demo3ReplayTokenRef.current) return;

        const ep2Resolved = ep2Direct
          ? await resolveCachedMediaUrl(ep2Direct, { kind: 'video', signal: controller.signal })
          : '';
        if (token !== demo3ReplayTokenRef.current) return;
        if (ep2Resolved) await warmupVideoUrl(ep2Resolved, { signal: controller.signal, timeoutMs: 12000 });
        if (token !== demo3ReplayTokenRef.current) return;

        // Reset playback state AFTER we have something ready to render.
        demo3PlaySigRef.current = '';
        setDemo3Lead(0);
        setDemo3CurrentFilename('index_1.mp4');
        setDemo3Queue(['ep_2.mp4']);
        setDemo3SlotSrc([indexResolved, ep2Resolved || '']);

        const v0 = demo3Video0Ref.current;
        if (v0) {
          v0.pause();
          v0.currentTime = 0;
          v0.load();
          await waitForReady(v0, 2500);
          if (token !== demo3ReplayTokenRef.current) return;
          void v0.play().catch(() => undefined);
        }
      } catch {
        // ignore
      } finally {
        controller.abort();
        if (token === demo3ReplayTokenRef.current) setDemo3IsLoading(false);
      }
    })();
  };

  const submitDemo3Input = async () => {
    if (!demo3PromptActive) return;

    const rawText = demo3InputValue;
    const trimmed = rawText.trim();
    demo3LastUserReplyRef.current = trimmed;
    let emotionType: 1 | 2 | 3 | 4 | 5 = 5;

    pushDebug({
      kind: 'api_request',
      title: 'POST /api/v1/generate (Demo3)',
      body: `${safeJson({ text: trimmed })}\ncontext: clip=${demo3CurrentFilename}`,
    });

    // Empty input => emotion_type=5 (retry).
    if (trimmed) {
      demo3GenerateAbortRef.current?.abort();
      const controller = new AbortController();
      demo3GenerateAbortRef.current = controller;
      setIsDemo3Generating(true);
      try {
        const result = await generateText(
          { text: trimmed },
          { signal: controller.signal, baseUrl: generateApiBaseUrl }
        );
        emotionType = extractEmotionType(result) ?? 5;
        pushDebug({
          kind: 'api_response',
          title: 'Generate OK (Demo3)',
          body: `${safeJson(result)}\nresolved emotion_type: ${emotionType}`,
        });
      } catch (error) {
        console.warn('[demo3] generate failed', error);
        emotionType = 5;
        pushDebug({
          kind: 'api_error',
          title: 'Generate failed (Demo3)',
          body: error instanceof Error ? error.message : safeJson(error),
        });
      } finally {
        if (demo3GenerateAbortRef.current === controller) {
          demo3GenerateAbortRef.current = null;
        }
        setIsDemo3Generating(false);
      }
    } else {
      pushDebug({
        kind: 'api_response',
        title: 'Generate skipped (Demo3)',
        body: 'Empty input — no HTTP call. emotion_type defaults to 5.',
      });
    }

    const isHighEmotion = emotionType === 4 || emotionType === 5;
    if (isHighEmotion) setDemo3HighEmotionHits((h) => h + 1);

    // Stop prompt UI before transitioning.
    demo3StopPrompt();
    applyDemo3EmotionAtCurrentClip(demo3CurrentFilename, emotionType);
  };

  useEffect(() => {
    if (!isDemo3) return;
    const onDebugEmotion = (e: Event) => {
      if (!isActiveRef.current) return;
      const ce = e as CustomEvent<{ emotionType?: number; fixedReply?: string }>;
      const raw = ce.detail?.emotionType;
      const et = Number(raw);
      if (!Number.isFinite(et) || et < 1 || et > 5) return;
      const emotionType = et as 1 | 2 | 3 | 4 | 5;
      if (!demo3PromptActiveRef.current) {
        pushDebug({
          kind: 'api_error',
          title: 'Demo3 · inject ignored',
          body: '当前没有打开的输入框（需在 ep_2 / ep4_2 / ep_4_4 / ep_3-4 等输入点）。',
        });
        return;
      }
      const reply = typeof ce.detail?.fixedReply === 'string' ? ce.detail.fixedReply : DEMO3_FIXED_TEST_REPLY;
      demo3LastUserReplyRef.current = reply;
      setDemo3InputValue(reply);
      const isHighEmotion = emotionType === 4 || emotionType === 5;
      if (isHighEmotion) setDemo3HighEmotionHits((h) => h + 1);
      demo3StopPrompt();
      const clip = demo3ClipRef.current;
      pushDebug({
        kind: 'video_branch',
        title: 'Demo3 · DEBUG inject',
        body: `clip=${clip}\nforced emotion_type=${emotionType}\nfixed reply: ${reply}`,
      });
      applyDemo3EmotionAtCurrentClipRef.current(clip, emotionType);
    };
    window.addEventListener('naravo:demo3-debug-emotion', onDebugEmotion);
    return () => window.removeEventListener('naravo:demo3-debug-emotion', onDebugEmotion);
  }, [isDemo3, pushDebug]);

  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive) {
      prevDemo3ClipRef.current = null;
      return;
    }
    if (prevDemo3ClipRef.current === demo3CurrentFilename) return;
    prevDemo3ClipRef.current = demo3CurrentFilename;
    const queueStr = demo3Queue.length ? demo3Queue.join(' → ') : '(empty)';
    pushDebug({
      kind: 'video_branch',
      title: 'Demo3 · branch clip',
      body: `playing: ${demo3CurrentFilename}\nqueue: ${queueStr}`,
    });
  }, [isDemo3, isActive, demo3CurrentFilename, demo3Queue, pushDebug]);

  // Demo3 A/B/C/D: while ep_5 is loading/playing (and ep_last is next), generate narration text + TTS audio.
  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive) return;
    if (demo3CurrentFilename !== 'ep_5.mp4') return;
    if (demo3Queue[0] !== 'ep_last.mp4') return;

    const sig = `${demo3ReplayTokenRef.current}|${demo3LastUserReplyRef.current}`;
    if (demo3NarrationSigRef.current === sig) return;
    demo3NarrationSigRef.current = sig;

    demo3NarrationAbortRef.current?.abort();
    const controller = new AbortController();
    demo3NarrationAbortRef.current = controller;
    setDemo3NarrationLoading(true);
    setDemo3NarrationError(null);

    void (async () => {
      try {
        const prompt = buildPromptTtsFullPrompt(demo3LastUserReplyRef.current);
        pushDebug({
          kind: 'api_request',
          title: 'POST /api/v1/prompt (Demo3 ep_5 narration)',
          body: safeJson({ prompt }),
        });
        const promptRes = await postPrompt({ prompt }, { baseUrl: generateApiBaseUrl, signal: controller.signal });
        const text = (promptRes.text ?? '').trim();
        if (!text) throw new Error('Prompt API returned empty text');
        setDemo3NarrationText(text);
        pushDebug({
          kind: 'api_response',
          title: 'Prompt OK (Demo3 ep_5 narration)',
          body: text,
        });

        const cloneBody = {
          prompt,
          voice_id: PROMPT_TTS_CLONE_VOICE_ID,
          media_type: PROMPT_TTS_CLONE_MEDIA_TYPE,
          per: 0,
          spd: 5,
          pit: 5,
          vol: 5,
        };
        pushDebug({
          kind: 'api_request',
          title: 'POST /api/v1/prompt-tts (Demo3 ep_5 narration · clone)',
          body: safeJson(cloneBody),
        });
        const blob = await postPromptTts(cloneBody, {
          baseUrl: generateApiBaseUrl,
          signal: controller.signal,
        });
        const url = createMp3ObjectUrl(blob);
        setDemo3NarrationAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        pushDebug({
          kind: 'api_response',
          title: 'prompt-tts OK (Demo3 ep_5 narration · clone)',
          body: `audio/mpeg blob: ${blob.size} bytes`,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : safeJson(e);
        setDemo3NarrationError(msg);
        pushDebug({
          kind: 'api_error',
          title: 'Narration prompt/tts failed (Demo3 ep_5)',
          body: msg,
        });
      } finally {
        if (demo3NarrationAbortRef.current === controller) demo3NarrationAbortRef.current = null;
        setDemo3NarrationLoading(false);
      }
    })();

    return () => controller.abort();
  }, [
    isDemo3,
    isActive,
    demo3CurrentFilename,
    demo3Queue,
    generateApiBaseUrl,
    pushDebug,
  ]);

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

  // Demo3 ep_last: play narration audio on top（Replay 遮罩 / 无 URL 不 play，避免 Retry 前后重播缓存 TTS）。
  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive) return;
    if (demo3ShowReplay) return;
    if (demo3CurrentFilename !== 'ep_last.mp4') return;
    if (!demo3NarrationAudioUrl) return;
    const a = demo3NarrationAudioRef.current;
    if (!a) return;
    a.currentTime = 0;
    void a.play().catch(() => undefined);
    return () => {
      a.pause();
    };
  }, [isDemo3, isActive, demo3ShowReplay, demo3CurrentFilename, demo3NarrationAudioUrl]);

  useEffect(() => {
    if (!isDemo3 || !demo3ShowReplay) return;
    demo3Video0Ref.current?.pause();
    demo3Video1Ref.current?.pause();
    demo3NarrationAudioRef.current?.pause();
  }, [isDemo3, demo3ShowReplay]);

  const handleDemo3VideoEnded = (e: SyntheticEvent<HTMLVideoElement>) => {
    const leadEl = demo3Lead === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;
    if (e.currentTarget !== leadEl) return;

    if (demo3CurrentFilename === 'ep4_2.mp4') {
      demo3StartPrompt(false);
      return;
    }
    const next = demo3Queue[0];
    if (next) {
      const inactiveIdx = demo3Lead === 0 ? 1 : 0;
      const inactiveEl = inactiveIdx === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;

      const proceed = () => {
        setDemo3Lead((l) => (l === 0 ? 1 : 0));
        setDemo3CurrentFilename(next);
        setDemo3Queue((q) => q.slice(1));
      };

      if (!inactiveEl || inactiveEl.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        proceed();
        return;
      }

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        inactiveEl.removeEventListener('canplay', finish);
        inactiveEl.removeEventListener('loadeddata', finish);
        inactiveEl.removeEventListener('error', finish);
        window.clearTimeout(tid);
        proceed();
      };
      const tid = window.setTimeout(finish, 2500);
      inactiveEl.addEventListener('canplay', finish);
      inactiveEl.addEventListener('loadeddata', finish);
      inactiveEl.addEventListener('error', finish);
      return;
    }
    if (
      demo3CurrentFilename === 'ep_last.mp4' ||
      demo3CurrentFilename === 'ep_3_6.mp4' ||
      (demo3CurrentFilename === 'ep_5.mp4' && !demo3Queue[0])
    ) {
      setDemo3ShowReplay(true);
    }
  };

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
            src={isActive ? bgmPlayableSrc : undefined}
            autoPlay={isActive}
            muted={!isActive}
            loop
            preload="auto"
          />
        )}
        {isDemo3 && (
          <audio
            ref={demo3NarrationAudioRef}
            src={demo3NarrationAudioUrl ?? undefined}
            preload="auto"
          />
        )}
        {isDemo3 ? (
          <>
            <video
              ref={demo3Video0Ref}
              src={demo3SlotSrc[0] || undefined}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                demo3Lead === 0 ? 'opacity-85 z-[2]' : 'opacity-0 z-[1]'
              }`}
              autoPlay={false}
              loop={false}
              muted={!demo.playVideoAudio || demo3CurrentFilename === 'ep_last.mp4'}
              playsInline
              preload="auto"
              onEnded={handleDemo3VideoEnded}
              onLoadedData={() => {
                if (demo3Lead === 0) setDemo3IsCoverVisible(false);
              }}
            />
            <video
              ref={demo3Video1Ref}
              src={demo3SlotSrc[1] || undefined}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                demo3Lead === 1 ? 'opacity-85 z-[2]' : 'opacity-0 z-[1]'
              }`}
              autoPlay={false}
              loop={false}
              muted={!demo.playVideoAudio || demo3CurrentFilename === 'ep_last.mp4'}
              playsInline
              preload="auto"
              onEnded={handleDemo3VideoEnded}
              onLoadedData={() => {
                if (demo3Lead === 1) setDemo3IsCoverVisible(false);
              }}
            />
          </>
        ) : (
          <video
            ref={videoRef}
            src={activeSrc}
            className="w-full h-full object-cover opacity-85"
            autoPlay={isActive}
            loop={playlist.length <= 1}
            muted={!demo.playVideoAudio}
            playsInline
            preload="auto"
            onEnded={() => {
              if (playlist.length <= 1) return;
              setActiveVideoIndex((previous) => {
                const next = previous + 1;
                return next >= playlist.length ? 0 : next;
              });
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {isDemo3 && demo3CurrentFilename === 'ep_last.mp4' && (
        <div className="absolute left-0 right-0 bottom-[5.75rem] z-[75] px-4 pointer-events-none">
          <div className="mx-auto max-w-[520px] rounded-2xl border border-white/15 bg-black/55 backdrop-blur-xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.42)]">
            {demo3NarrationLoading && (
              <p className="text-[11px] tracking-[0.14em] uppercase text-white/70">Generating narration…</p>
            )}
            {demo3NarrationError && !demo3NarrationLoading && (
              <p className="text-[12px] text-red-200/90">{demo3NarrationError}</p>
            )}
            {demo3NarrationText && (
              <p className="text-[14px] leading-relaxed text-white/92 whitespace-pre-wrap">{demo3NarrationText}</p>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isDemo3 && demo3IsCoverVisible && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0 z-[5] pointer-events-none"
          >
            <img src={DEMO3_COVER_URL} alt="Demo 3 cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/38" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border border-white/20 border-t-white/85 animate-spin" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-white/80">Loading Demo</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {isDemo3 && demo3ShowReplay && (
        <div className="absolute inset-0 z-[82] flex items-center justify-center pointer-events-auto px-6 bg-black/40 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={handleDemo3ReplayFromStart}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-xl text-white text-[11px] font-semibold tracking-[0.14em] uppercase border border-white/25 hover:bg-white/16 hover:border-white/35 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {isDemo3 && demo3IsLoading && (
        <div className="absolute inset-0 z-[81] flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border border-white/20 border-t-white/80 animate-spin" />
        </div>
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
