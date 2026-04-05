import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MoreHorizontal, MousePointerClick, Heart, MessageCircle, Plus, Maximize, RotateCcw, Share2, Wand2, X, Play } from 'lucide-react';
import { STORY1_VIDEOS } from '../storyVideos';

const CUSTOM_LOGO_URL = new URL('../../assets/3bf85ad3821c19cb83ca7268914f3d9ba7a2eab8.png', import.meta.url).href;
const DEMO1_COVER_URL = new URL('../../assets/Demo1-cover.jpg', import.meta.url).href;

const STORY_INTRO_VIDEO = STORY1_VIDEOS.intro;
const STORY_LOOP_VIDEO = STORY1_VIDEOS.loop;
const STORY_TAP_VIDEO = STORY1_VIDEOS.branches.click;
const STORY_HOLD_VIDEO = STORY1_VIDEOS.branches.hold;
const STORY_RAPID_VIDEO = STORY1_VIDEOS.branches.rapid;

type StoryPhase = 'intro' | 'loop' | 'branch_click' | 'branch_hold' | 'branch_rapid';
type BranchType = 'click' | 'hold' | 'rapid';
type VideoAssetKey = 'intro' | 'loop' | 'click' | 'hold' | 'rapid';

export type StoryPlaybackSnapshot = {
  phase: StoryPhase;
  activeBranch: BranchType | null;
  statusLabel: string;
};

const STORY_CONFIG = {
  id: 1,
  title: 'Wasteland Run: Escape Partner',
  feedHook: 'You and your partner race to a jammed shelter gate. Break the lock in 5 seconds before the horde catches you.',
  showcaseHook: 'You and a dangerous ally are chased by a horde to a jammed shelter gate. Break the lock in 5 seconds, or get dragged in bleeding as the dead close in.',
  interactionMethod: 'Tap count in 5s window',
  objective: 'Guide the user into three distinct outcomes from a shared loop segment.',
  commentCount: '1,284',
  countdownLabel: 'Tension',
  countdownHint: 'Gate lock breach window',
  countdownDurationSeconds: 5,
  introVideo: STORY_INTRO_VIDEO,
  loopVideo: STORY_LOOP_VIDEO,
  branchVideos: {
    click: STORY_TAP_VIDEO,
    hold: STORY_HOLD_VIDEO,
    rapid: STORY_RAPID_VIDEO,
  },
  branchLabels: {
    click: 'Forced entry successful',
    hold: 'Victory despite injury',
    rapid: 'Forced entry failed',
  },
} as const;

const LEGACY_DEMO_2 = {
  id: 2,
  title: 'Machine Uprising: Core Lockdown',
  feedHook: 'Coming Soon. A rogue service robot seals the evacuation elevator. Trigger a timed override before the control core wipes your access keys.',
  showcaseHook: 'Coming Soon. Inside a collapsing arcology, a maintenance robot has turned hostile and locked the emergency lift. You must send the correct override pattern before the AI core purges civilian credentials.',
  interactionMethod: 'Sequence Tap Override',
  objective: 'Input the correct command pattern to unlock the elevator and contain the robot',
  commentCount: '3,778',
  mediaType: 'video' as const,
  videoBg: 'https://image-b2.civitai.com/file/civitai-media-cache/00f5df14-2645-4ca5-8d99-bde8b833c6f4/original',
};

const LEGACY_DEMO_3 = {
  id: 3,
  title: 'One Man Station',
  feedHook: 'Coming Soon. A lone astronaut gets one unstable relay burst. Your reply decides if he risks a final EVA repair or records a goodbye.',
  showcaseHook: 'Coming Soon. A lone astronaut drifting on a dying station restores one unstable relay burst. Your reply decides whether he risks one last EVA repair or records a final goodbye.',
  interactionMethod: 'Voice or Text Reply',
  objective: 'Send the message that shapes his final decision',
  commentCount: '2,154',
  mediaType: 'video' as const,
  videoBg: 'https://image-b2.civitai.com/file/civitai-media-cache/535584e2-0805-4b3b-96a8-fe0eb24a2205/original',
};

export const DEMOS = [STORY_CONFIG, LEGACY_DEMO_2, LEGACY_DEMO_3];
export { CUSTOM_LOGO_URL };

const MOCK_COMMENTS_BY_DEMO: Record<number, Array<{ id: number; name: string; handle: string; text: string; likes: string; time: string }>> = {
  1: [
    { id: 1, name: 'Ava', handle: '@ava.story', text: 'The loop-to-branch transition is clean. It feels like a real interactive story shell.', likes: '1.1K', time: '2h' },
    { id: 2, name: 'Noah', handle: '@noahplays', text: 'Using one hotspot for three gestures is a strong mobile-first choice.', likes: '824', time: '3h' },
    { id: 3, name: 'Luna', handle: '@lunaverse', text: 'The long-press feedback makes the interaction objective really obvious.', likes: '497', time: '5h' },
    { id: 4, name: 'Kai', handle: '@kai.ai', text: 'Rapid tap branch is short but satisfying. Nice contrast with the hold path.', likes: '301', time: '6h' },
    { id: 5, name: 'Mia', handle: '@miaonmobile', text: 'This setup looks reusable for a larger branching video platform.', likes: '189', time: '8h' },
  ],
};

const CHARACTERS_BY_DEMO: Record<number, Array<{
  id: number;
  name: string;
  role: string;
  summary: string;
  unlocked: boolean;
  avatar?: string;
}>> = {
  1: [
    {
      id: 1,
      name: 'Rhea',
      role: 'Combat Partner',
      summary: 'A hardened survivor who fights first and trusts later. She keeps moving even when the odds collapse.',
      unlocked: true,
      avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    },
    {
      id: 2,
      name: 'Unit-7',
      role: 'Recon Android',
      summary: 'A field robot built for breach routes and threat scanning. Its mission data may reveal why the shelter was sealed.',
      unlocked: true,
      avatar: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
    },
    {
      id: 3,
      name: 'Unknown Sector Alpha',
      role: 'Locked Character',
      summary: 'Keep watching to unlock this character and reveal their role in the shelter timeline.',
      unlocked: false,
    },
  ],
};

const LOOP_DECISION_WINDOW_MS = 10000;
const TAP_TO_EP2_MIN = 20;
const TAP_TO_EP3_MIN = 10; // 10-19 -> ep_3
const VIDEO_CACHE_NAME = 'naravo-story-video-v1';
const TAP_SPEED_WINDOW_MS = 1600;
const LOOP_BASE_PLAYBACK_RATE = 0.8;
const MIN_LOOP_PLAYBACK_RATE = 0.75;
const MAX_LOOP_PLAYBACK_RATE = 5;
const TAPS_PER_SECOND_FOR_MAX_SPEED = 5.4;
const TAP_BURST_RATE_BONUS = 0.18;
const PLAYBACK_SMOOTHING = 0.24;
const SPEED_GAIN_CURVE_EXPONENT = 2.25;
const VIDEO_DB_NAME = 'naravo-story-video-db';
const VIDEO_DB_STORE = 'video-blobs';

const VIDEO_ASSET_URLS: Record<VideoAssetKey, string> = {
  intro: STORY_CONFIG.introVideo,
  loop: STORY_CONFIG.loopVideo,
  click: STORY_CONFIG.branchVideos.click,
  hold: STORY_CONFIG.branchVideos.hold,
  rapid: STORY_CONFIG.branchVideos.rapid,
};

const SESSION_PRELOAD_PROMISES: Partial<Record<VideoAssetKey, Promise<string>>> = {};
const SESSION_RESOLVED_SOURCES: Record<VideoAssetKey, string> = { ...VIDEO_ASSET_URLS };
let SESSION_WARMUP_STARTED = false;
let SESSION_WARMUP_PROMISE: Promise<void> | null = null;
const LOOP_SPEED_DEBUG_ENABLED =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.localStorage.getItem('naravo:loop-speed-debug') === '1');

function logVideoWarmup(message: string, detail?: string) {
  const suffix = detail ? ` ${detail}` : '';
  console.info(`[story-video] ${message}${suffix}`);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getBranchAssetKey(branch: BranchType): VideoAssetKey {
  if (branch === 'click') return 'click';
  if (branch === 'hold') return 'hold';
  return 'rapid';
}

function getBranchPhase(branch: BranchType): StoryPhase {
  if (branch === 'click') return 'branch_click';
  if (branch === 'hold') return 'branch_hold';
  return 'branch_rapid';
}

function getAssetKeyForPhase(phase: StoryPhase): VideoAssetKey {
  if (phase === 'intro') return 'intro';
  if (phase === 'loop') return 'loop';
  if (phase === 'branch_click') return 'click';
  if (phase === 'branch_hold') return 'hold';
  return 'rapid';
}

function openVideoDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(VIDEO_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(VIDEO_DB_STORE)) {
        database.createObjectStore(VIDEO_DB_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function readIndexedDbVideo(url: string) {
  const database = await openVideoDatabase();

  return new Promise<Blob | null>((resolve, reject) => {
    const transaction = database.transaction(VIDEO_DB_STORE, 'readonly');
    const store = transaction.objectStore(VIDEO_DB_STORE);
    const request = store.get(url);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result instanceof Blob ? result : null);
    };
    request.onerror = () => reject(request.error ?? new Error('Failed to read IndexedDB video'));
    transaction.oncomplete = () => database.close();
  });
}

async function writeIndexedDbVideo(url: string, blob: Blob) {
  const database = await openVideoDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(VIDEO_DB_STORE, 'readwrite');
    const store = transaction.objectStore(VIDEO_DB_STORE);
    const request = store.put(blob, url);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Failed to write IndexedDB video'));
    transaction.oncomplete = () => database.close();
  });
}

function getPlaybackSnapshot(phase: StoryPhase): StoryPlaybackSnapshot {
  if (phase === 'intro') {
    return { phase, activeBranch: null, statusLabel: 'Intro Playing' };
  }

  if (phase === 'loop') {
    return { phase, activeBranch: null, statusLabel: 'Awaiting Interaction' };
  }

  if (phase === 'branch_click') {
    return { phase, activeBranch: 'click', statusLabel: 'Forced entry successful' };
  }

  if (phase === 'branch_hold') {
    return { phase, activeBranch: 'hold', statusLabel: 'Victory despite injury' };
  }

  return { phase, activeBranch: 'rapid', statusLabel: 'Forced entry failed' };
}

export function DemoFeed({
  onBackHome,
  onStoryStateChange,
  isActive = true,
}: {
  onIndexChange?: (index: number) => void;
  activeIndex?: number;
  onBackHome?: () => void;
  onStoryStateChange?: (snapshot: StoryPlaybackSnapshot) => void;
  isActive?: boolean;
}) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const pendingSwitchSlotRef = useRef<0 | 1 | null>(null);
  const loopDecisionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopClickCountRef = useRef(0);
  const tapTimestampsRef = useRef<number[]>([]);
  const playbackRateTargetRef = useRef(1);
  const playbackRateAnimationRef = useRef<number | null>(null);
  const interactionLockedRef = useRef(false);
  const previousStoryPhaseRef = useRef<StoryPhase>('intro');
  const shouldExitFullscreenAfterLoopRef = useRef(false);
  const didManualMaximizeToggleInLoopRef = useRef(false);
  const branchReadyRef = useRef<Record<BranchType, boolean>>({
    click: false,
    hold: false,
    rapid: false,
  });
  const branchPreloadPromiseRef = useRef<Partial<Record<BranchType, Promise<void>>>>({});
  const branchTransitionRequestIdRef = useRef(0);
  const videoTransitionMaskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUserInteractedRef = useRef(
    typeof window !== 'undefined' && Boolean(window.navigator.userActivation?.hasBeenActive)
  );
  const objectUrlsRef = useRef<string[]>([]);
  const resolvedVideoSourcesRef = useRef<Record<VideoAssetKey, string>>(SESSION_RESOLVED_SOURCES);
  const loopDurationSecondsRef = useRef<number | null>(null);
  const loopEffectiveRateProbeRef = useRef<{
    wallMs: number;
    mediaSeconds: number;
    lastLogMs: number;
  } | null>(null);
  const loopSpeedSessionRef = useRef<{
    startedAtMs: number;
    rateArea: number;
    sampleCount: number;
    tapCount: number;
    lastSampleAtMs: number;
  } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [likedByDemoId, setLikedByDemoId] = useState<Record<number, boolean>>({});
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeCommentsDemoId, setActiveCommentsDemoId] = useState<number | null>(STORY_CONFIG.id);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);
  const [activeCharactersDemoId, setActiveCharactersDemoId] = useState<number | null>(STORY_CONFIG.id);
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('intro');
  const [loopWindowProgress, setLoopWindowProgress] = useState(0);
  const storyPhaseRef = useRef<StoryPhase>(storyPhase);
  const [resolvedVideoSources, setResolvedVideoSources] = useState<Record<VideoAssetKey, string>>(SESSION_RESOLVED_SOURCES);
  // Skip "Loading Intro" if this SPA session already resolved intro to a blob: URL (e.g. left demo and came back).
  const [isIntroReady, setIsIntroReady] = useState(
    () => SESSION_RESOLVED_SOURCES.intro !== VIDEO_ASSET_URLS.intro
  );
  const [showBranchReplay, setShowBranchReplay] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isBranchTransitionLoading, setIsBranchTransitionLoading] = useState(false);
  const [isInteractionButtonPressed, setIsInteractionButtonPressed] = useState(false);
  const [interactionRippleIds, setInteractionRippleIds] = useState<number[]>([]);
  const [isVideoTransitionMaskVisible, setIsVideoTransitionMaskVisible] = useState(false);
  const [activeVideoSlot, setActiveVideoSlot] = useState<0 | 1>(0);
  const [slotSources, setSlotSources] = useState<[string | null, string | null]>([null, null]);
  const [isInitialFrameReady, setIsInitialFrameReady] = useState(false);

  const playbackSnapshot = useMemo(() => getPlaybackSnapshot(storyPhase), [storyPhase]);
  const activeCommentsDemo = DEMOS.find((demo) => demo.id === activeCommentsDemoId) ?? DEMOS[0];
  const activeComments = MOCK_COMMENTS_BY_DEMO[activeCommentsDemo.id] ?? [];
  const activeCharactersDemo = DEMOS.find((demo) => demo.id === activeCharactersDemoId) ?? DEMOS[0];
  const activeCharacters = CHARACTERS_BY_DEMO[activeCharactersDemo.id] ?? [];
  const countdownDurationMs = LOOP_DECISION_WINDOW_MS;
  const isCountdownEnabled = storyPhase === 'loop';
  const countdownProgress = isCountdownEnabled ? Math.max(0, 1 - loopWindowProgress) : 0;
  const countdownSecondsLeft = Math.max(
    0,
    Math.ceil((countdownDurationMs * countdownProgress) / 1000)
  );
  const countdownHue = Math.max(0, Math.min(120, countdownProgress * 120));
  const countdownColor = `hsl(${countdownHue} 95% 55%)`;
  const countdownColorSoft = `hsla(${countdownHue} 95% 65% / 0.85)`;
  const currentVideoSrc =
    storyPhase === 'intro'
      ? resolvedVideoSources.intro
      : storyPhase === 'loop'
        ? resolvedVideoSources.loop
        : storyPhase === 'branch_click'
          ? resolvedVideoSources.click
          : storyPhase === 'branch_hold'
            ? resolvedVideoSources.hold
            : resolvedVideoSources.rapid;

  const getVideoBySlot = (slot: 0 | 1) => (slot === 0 ? videoARef.current : videoBRef.current);
  const getActiveVideo = () => getVideoBySlot(activeVideoSlot);
  const getInactiveSlot = (): 0 | 1 => (activeVideoSlot === 0 ? 1 : 0);
  const shouldLoopSlot = (slot: 0 | 1) =>
    storyPhase === 'loop' &&
    activeVideoSlot === slot &&
    slotSources[slot] === resolvedVideoSources.loop;

  useEffect(() => {
    onStoryStateChange?.(playbackSnapshot);
  }, [onStoryStateChange, playbackSnapshot]);

  useEffect(() => {
    resolvedVideoSourcesRef.current = resolvedVideoSources;
  }, [resolvedVideoSources]);

  useEffect(() => {
    const video = getActiveVideo();
    if (!video || !isIntroReady) return;
    const activeSource = slotSources[activeVideoSlot];

    // Never restart the outgoing clip while waiting for the next slot to become ready.
    if (!activeSource || activeSource !== currentVideoSrc || pendingSwitchSlotRef.current !== null) {
      return;
    }

    if (window.navigator.userActivation?.hasBeenActive) {
      hasUserInteractedRef.current = true;
    }

    video.muted = !hasUserInteractedRef.current;
    video.volume = 1;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }, [activeVideoSlot, slotSources, isIntroReady, currentVideoSrc]);

  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) return;

    if (!isActive) {
      videoA.pause();
      videoB.pause();
      return;
    }

    if (isPausedByUser || showBranchReplay || !isIntroReady) return;

    const activeSource = slotSources[activeVideoSlot];
    if (!activeSource || activeSource !== currentVideoSrc || pendingSwitchSlotRef.current !== null) return;

    const activeVideo = getActiveVideo();
    if (!activeVideo) return;
    void activeVideo.play().catch(() => undefined);
  }, [isActive, isPausedByUser, showBranchReplay, isIntroReady, activeVideoSlot, slotSources, currentVideoSrc]);

  useEffect(() => {
    const inactiveVideo = getVideoBySlot(getInactiveSlot());
    if (!inactiveVideo) return;
    inactiveVideo.pause();
    inactiveVideo.muted = true;
    inactiveVideo.volume = 0;
  }, [activeVideoSlot, slotSources]);

  useEffect(() => {
    const video = getActiveVideo();
    if (!video) return;

    const handlePause = () => setIsVideoPaused(true);
    const handlePlay = () => {
      setIsVideoPaused(false);
      setIsPausedByUser(false);
    };

    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
    };
  }, [activeVideoSlot, isIntroReady]);

  useEffect(() => {
    // Prevent pause overlay flash during source/phase transitions.
    setIsVideoPaused(false);
    setIsPausedByUser(false);
  }, [currentVideoSrc, storyPhase]);

  useEffect(() => {
    if (!isIntroReady) return;

    const inactiveSlot = getInactiveSlot();
    const activeSource = slotSources[activeVideoSlot];

    if (!activeSource) {
      setSlotSources((previous) => {
        if (previous[activeVideoSlot] === currentVideoSrc) return previous;
        const next = [...previous] as [string | null, string | null];
        next[activeVideoSlot] = currentVideoSrc;
        return next;
      });
      return;
    }

    if (activeSource === currentVideoSrc) return;
    if (pendingSwitchSlotRef.current === inactiveSlot && slotSources[inactiveSlot] === currentVideoSrc) return;

    pendingSwitchSlotRef.current = inactiveSlot;
    const outgoingVideo = getVideoBySlot(activeVideoSlot);
    if (outgoingVideo && !outgoingVideo.paused) {
      // Prevent previous clip from briefly restarting while waiting for next slot readiness.
      outgoingVideo.pause();
    }
    setIsVideoTransitionMaskVisible(true);
    if (videoTransitionMaskTimerRef.current) {
      clearTimeout(videoTransitionMaskTimerRef.current);
    }
    videoTransitionMaskTimerRef.current = setTimeout(() => {
      setIsVideoTransitionMaskVisible(false);
      videoTransitionMaskTimerRef.current = null;
    }, 900);
    setSlotSources((previous) => {
      if (previous[inactiveSlot] === currentVideoSrc) return previous;
      const next = [...previous] as [string | null, string | null];
      next[inactiveSlot] = currentVideoSrc;
      return next;
    });
  }, [currentVideoSrc, isIntroReady, activeVideoSlot, slotSources]);

  useEffect(() => {
    return () => {
      if (videoTransitionMaskTimerRef.current) {
        clearTimeout(videoTransitionMaskTimerRef.current);
      }
    };
  }, []);

  // Keep a persistent gesture listener so any later branch can recover audio from muted fallback.
  useEffect(() => {
    if (window.navigator.userActivation?.hasBeenActive) {
      hasUserInteractedRef.current = true;
      const video = getActiveVideo();
      if (video) {
        video.muted = false;
        video.volume = 1;
      }
    }

    const handleUserInteraction = () => {
      hasUserInteractedRef.current = true;
      const v = getActiveVideo();
      if (!v) return;
      if (v.muted) v.muted = false;
      v.volume = 1;

      // Never force resume when user has intentionally paused playback.
      if (!v.paused && !v.ended) {
        void v.play().catch(() => undefined);
      }
    };

    document.addEventListener('pointerdown', handleUserInteraction, { capture: true });
    document.addEventListener('keydown', handleUserInteraction, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handleUserInteraction, { capture: true });
      document.removeEventListener('keydown', handleUserInteraction, { capture: true });
    };
  }, [activeVideoSlot]);

  useEffect(() => {
    let isCancelled = false;
    const withWarmupTimeout = async (assetKey: VideoAssetKey, timeoutMs: number) => {
      const directSource = VIDEO_ASSET_URLS[assetKey];
      const timeoutPromise = new Promise<string>((resolve) => {
        window.setTimeout(() => resolve(directSource), timeoutMs);
      });
      return Promise.race([resolveCachedVideo(assetKey), timeoutPromise]);
    };

    const syncWarmupState = async () => {
      if (!SESSION_WARMUP_STARTED) {
        SESSION_WARMUP_STARTED = true;
        logVideoWarmup('session warmup start');
        SESSION_WARMUP_PROMISE = (async () => {
          logVideoWarmup('intro warmup queued');
          await resolveCachedVideo('intro');
          logVideoWarmup('intro warmup done');
          logVideoWarmup('loop warmup queued');
          await resolveCachedVideo('loop');
          logVideoWarmup('loop warmup done');
          logVideoWarmup('branch warmup queued');
          await Promise.all([
            resolveCachedVideo('click'),
            resolveCachedVideo('hold'),
            resolveCachedVideo('rapid'),
          ]);
          logVideoWarmup('branch warmup done');
        })();
      } else {
        logVideoWarmup('session warmup reuse');
      }

      const introSource = await withWarmupTimeout('intro', 12000);
      if (isCancelled) return;

      setResolvedVideoSources((previous) => ({ ...previous, intro: introSource }));
      setIsIntroReady(true);

      const loopSource = await withWarmupTimeout('loop', 10000);
      if (isCancelled) return;

      setResolvedVideoSources((previous) => ({ ...previous, loop: loopSource }));

      await SESSION_WARMUP_PROMISE;
      if (isCancelled) return;

      setResolvedVideoSources({ ...SESSION_RESOLVED_SOURCES });
    };

    void syncWarmupState();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (loopDecisionTimeoutRef.current) clearTimeout(loopDecisionTimeoutRef.current);
      if (loopProgressTimerRef.current) clearInterval(loopProgressTimerRef.current);
      stopPlaybackRateAnimation();
    };
  }, []);

  const resolveCachedVideo = async (assetKey: VideoAssetKey) => {
    const directSource = VIDEO_ASSET_URLS[assetKey];

    // Branch clips may be blocked by CORS for JS fetch in some environments.
    // Let <video> stream them directly to avoid fetch-preflight failures.
    if (assetKey === 'click' || assetKey === 'hold' || assetKey === 'rapid') {
      return directSource;
    }

    if (resolvedVideoSourcesRef.current[assetKey] !== directSource) {
      logVideoWarmup(`${assetKey} source reuse`, '(session object URL)');
      return resolvedVideoSourcesRef.current[assetKey];
    }

    if (SESSION_PRELOAD_PROMISES[assetKey]) {
      logVideoWarmup(`${assetKey} promise reuse`);
      return SESSION_PRELOAD_PROMISES[assetKey]!;
    }

    const preloadPromise = (async () => {
      if (typeof window === 'undefined') {
        return directSource;
      }

      try {
        let videoBlob: Blob | null = null;

        const requestInit: RequestInit = {
          mode: 'cors',
          credentials: 'omit',
        };

        if ('caches' in window && window.isSecureContext) {
          const cache = await window.caches.open(VIDEO_CACHE_NAME);
          const cachedResponse = await cache.match(directSource);

          if (cachedResponse) {
            const isPartial =
              cachedResponse.status === 206 ||
              Boolean(cachedResponse.headers.get('content-range'));
            if (isPartial) {
              logVideoWarmup(`${assetKey} cache stale partial`, '(delete + refetch)');
              await cache.delete(directSource);
            } else {
              logVideoWarmup(`${assetKey} cache hit`, '(Cache Storage)');
              videoBlob = await cachedResponse.blob();
              void writeIndexedDbVideo(directSource, videoBlob).catch(() => undefined);
            }
          } else {
            const indexedDbBlob = await readIndexedDbVideo(directSource).catch(() => null);
            if (indexedDbBlob) {
              logVideoWarmup(`${assetKey} cache hit`, '(IndexedDB)');
              videoBlob = indexedDbBlob;
            } else {
              logVideoWarmup(`${assetKey} network fetch start`);
              const networkResponse = await fetch(directSource, requestInit);
              if (!networkResponse.ok) {
                throw new Error(`Failed to fetch ${assetKey}`);
              }
              await cache.put(directSource, networkResponse.clone());
              logVideoWarmup(`${assetKey} network fetch done`, '(stored in Cache Storage)');
              videoBlob = await networkResponse.blob();
              await writeIndexedDbVideo(directSource, videoBlob).catch(() => undefined);
            }
          }
        } else {
          const indexedDbBlob = await readIndexedDbVideo(directSource).catch(() => null);

          if (indexedDbBlob) {
            logVideoWarmup(`${assetKey} cache hit`, '(IndexedDB)');
            videoBlob = indexedDbBlob;
          } else {
            logVideoWarmup(`${assetKey} network fetch start`, '(IndexedDB fallback)');
            const networkResponse = await fetch(directSource, requestInit);
            if (!networkResponse.ok) {
              throw new Error(`Failed to fetch ${assetKey}`);
            }
            videoBlob = await networkResponse.blob();
            await writeIndexedDbVideo(directSource, videoBlob).catch(() => undefined);
            logVideoWarmup(`${assetKey} network fetch done`, '(stored in IndexedDB)');
          }
        }

        if (!videoBlob) {
          throw new Error(`Missing blob for ${assetKey}`);
        }

        const objectUrl = URL.createObjectURL(videoBlob);
        objectUrlsRef.current.push(objectUrl);
        SESSION_RESOLVED_SOURCES[assetKey] = objectUrl;
        logVideoWarmup(`${assetKey} object URL ready`);

        setResolvedVideoSources((previous) => ({
          ...previous,
          [assetKey]: objectUrl,
        }));

        return objectUrl;
      } catch (error) {
        logVideoWarmup(`${assetKey} warmup failed`, error instanceof Error ? error.message : '(unknown error)');
        return directSource;
      } finally {
        delete SESSION_PRELOAD_PROMISES[assetKey];
      }
    })();

    SESSION_PRELOAD_PROMISES[assetKey] = preloadPromise;
    return preloadPromise;
  };

  const waitForLoadedData = (src: string) => new Promise<void>((resolve) => {
    const previewVideo = document.createElement('video');
    previewVideo.preload = 'auto';
    previewVideo.muted = true;
    previewVideo.playsInline = true;

    let didResolve = false;
    const cleanup = () => {
      previewVideo.removeEventListener('loadeddata', handleLoadedData);
      previewVideo.removeEventListener('error', handleError);
      previewVideo.removeAttribute('src');
      previewVideo.load();
    };
    const finalize = () => {
      if (didResolve) return;
      didResolve = true;
      cleanup();
      resolve();
    };
    const handleLoadedData = () => finalize();
    const handleError = () => finalize();

    previewVideo.addEventListener('loadeddata', handleLoadedData);
    previewVideo.addEventListener('error', handleError);
    previewVideo.src = src;
    previewVideo.load();

    // Avoid infinite loading UI on bad networks.
    window.setTimeout(finalize, 15000);
  });

  const ensureBranchPlayable = async (branch: BranchType) => {
    if (branchReadyRef.current[branch]) return;
    if (branchPreloadPromiseRef.current[branch]) return branchPreloadPromiseRef.current[branch]!;

    const preloadPromise = (async () => {
      const assetKey = getBranchAssetKey(branch);
      const source = await resolveCachedVideo(assetKey);
      await waitForLoadedData(source);
      branchReadyRef.current[branch] = true;
    })();

    branchPreloadPromiseRef.current[branch] = preloadPromise;
    return preloadPromise.finally(() => {
      delete branchPreloadPromiseRef.current[branch];
    });
  };

  const preloadAllBranchesForLoop = () => {
    void Promise.allSettled([
      ensureBranchPlayable('click'),
      ensureBranchPlayable('hold'),
      ensureBranchPlayable('rapid'),
    ]);
  };

  const stopLoopDecision = () => {
    if (loopDecisionTimeoutRef.current) clearTimeout(loopDecisionTimeoutRef.current);
    if (loopProgressTimerRef.current) clearInterval(loopProgressTimerRef.current);
    loopDecisionTimeoutRef.current = null;
    loopProgressTimerRef.current = null;
  };

  const stopPlaybackRateAnimation = () => {
    if (playbackRateAnimationRef.current !== null) {
      cancelAnimationFrame(playbackRateAnimationRef.current);
      playbackRateAnimationRef.current = null;
    }
  };

  const applyPlaybackRateToSlots = (rate: number) => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (videoA) videoA.playbackRate = rate;
    if (videoB) videoB.playbackRate = rate;
  };

  const finalizeLoopSpeedSession = (reason: 'branch-selected' | 'video-ended' | 'loop-cleanup') => {
    const session = loopSpeedSessionRef.current;
    if (!session) return;

    const nowMs = performance.now();
    const activeVideo = getActiveVideo();
    if (activeVideo) {
      const deltaSeconds = Math.max(0, (nowMs - session.lastSampleAtMs) / 1000);
      session.rateArea += activeVideo.playbackRate * deltaSeconds;
    }

    const elapsedSeconds = Math.max(0.001, (nowMs - session.startedAtMs) / 1000);
    const averageRate = session.rateArea > 0 ? session.rateArea / elapsedSeconds : 0;
    const loopDurationAt1x = loopDurationSecondsRef.current;
    const expectedAtAverageRate =
      loopDurationAt1x && averageRate > 0 ? loopDurationAt1x / averageRate : null;

    if (LOOP_SPEED_DEBUG_ENABLED) {
      console.info('[loop-speed] summary', {
        reason,
        tapCount: session.tapCount,
        elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
        averageRate: Number(averageRate.toFixed(3)),
        loopDurationAt1x: loopDurationAt1x ? Number(loopDurationAt1x.toFixed(2)) : null,
        expectedAtAverageRate: expectedAtAverageRate ? Number(expectedAtAverageRate.toFixed(2)) : null,
        accelerationObserved: averageRate > 1.01,
      });
    }

    loopSpeedSessionRef.current = null;
  };

  const startPlaybackRateAnimation = () => {
    stopPlaybackRateAnimation();

    const tick = () => {
      const video = getActiveVideo();
      if (!video) return;

      const currentRate = video.playbackRate || 1;
      const nextRate = currentRate + (playbackRateTargetRef.current - currentRate) * PLAYBACK_SMOOTHING;
      const snappedRate = Math.abs(nextRate - playbackRateTargetRef.current) < 0.01 ? playbackRateTargetRef.current : nextRate;

      // Keep both slots in sync to avoid "hidden slot speeds up, visible slot stays normal".
      applyPlaybackRateToSlots(snappedRate);
      if (Math.abs(snappedRate - playbackRateTargetRef.current) >= 0.01 || storyPhaseRef.current === 'loop') {
        playbackRateAnimationRef.current = requestAnimationFrame(tick);
      } else {
        playbackRateAnimationRef.current = null;
      }
    };

    playbackRateAnimationRef.current = requestAnimationFrame(tick);
  };

  const updateLoopPlaybackRateTarget = () => {
    const now = Date.now();
    tapTimestampsRef.current = tapTimestampsRef.current.filter((timestamp) => now - timestamp <= TAP_SPEED_WINDOW_MS);

    const tapsPerSecond = tapTimestampsRef.current.length / (TAP_SPEED_WINDOW_MS / 1000);
    const normalizedSpeed = clamp(tapsPerSecond / TAPS_PER_SECOND_FOR_MAX_SPEED, 0, 1);
    const curvedSpeed = Math.pow(normalizedSpeed, SPEED_GAIN_CURVE_EXPONENT);
    const baseRate = LOOP_BASE_PLAYBACK_RATE + (MAX_LOOP_PLAYBACK_RATE - LOOP_BASE_PLAYBACK_RATE) * curvedSpeed;
    const burstBoost = tapTimestampsRef.current.length > 0 ? TAP_BURST_RATE_BONUS : 0;
    playbackRateTargetRef.current = clamp(
      Math.max(MIN_LOOP_PLAYBACK_RATE, baseRate + burstBoost),
      MIN_LOOP_PLAYBACK_RATE,
      MAX_LOOP_PLAYBACK_RATE
    );
  };

  const enterBranch = async (branch: BranchType) => {
    if (storyPhase !== 'loop' || interactionLockedRef.current) return;

    finalizeLoopSpeedSession('branch-selected');
    const requestId = ++branchTransitionRequestIdRef.current;
    setShowBranchReplay(false);
    interactionLockedRef.current = true;
    stopLoopDecision();
    setIsBranchTransitionLoading(true);

    try {
      await ensureBranchPlayable(branch);
      if (requestId !== branchTransitionRequestIdRef.current) return;
      setStoryPhase(getBranchPhase(branch));
    } finally {
      if (requestId === branchTransitionRequestIdRef.current) {
        setIsBranchTransitionLoading(false);
      }
    }
  };

  const handleVideoEnded = () => {
    const phase = storyPhaseRef.current;
    if (phase === 'loop') {
      finalizeLoopSpeedSession('video-ended');
    }
    if (phase === 'intro') {
      interactionLockedRef.current = false;
      setStoryPhase('loop');
      return;
    }
    if (phase === 'branch_click' || phase === 'branch_hold' || phase === 'branch_rapid') {
      setShowBranchReplay(true);
    }
  };

  const handleReplayFromStart = () => {
    branchTransitionRequestIdRef.current += 1;
    pendingSwitchSlotRef.current = null;
    setShowBranchReplay(false);
    interactionLockedRef.current = false;
    setIsBranchTransitionLoading(false);
    setIsPausedByUser(false);
    setIsVideoPaused(false);
    setIsInteractionButtonPressed(false);
    setInteractionRippleIds([]);
    setLoopWindowProgress(0);
    stopLoopDecision();
    stopPlaybackRateAnimation();
    loopClickCountRef.current = 0;
    tapTimestampsRef.current = [];
    playbackRateTargetRef.current = 1;

    const introSource = resolvedVideoSourcesRef.current.intro ?? VIDEO_ASSET_URLS.intro;
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (videoA) {
      videoA.pause();
      videoA.currentTime = 0;
      videoA.playbackRate = 1;
      videoA.muted = !hasUserInteractedRef.current;
      videoA.volume = 1;
    }
    if (videoB) {
      videoB.pause();
      videoB.currentTime = 0;
      videoB.playbackRate = 1;
      videoB.muted = true;
      videoB.volume = 0;
    }

    setActiveVideoSlot(0);
    setSlotSources([introSource, null]);
    setIsVideoTransitionMaskVisible(false);
    setStoryPhase('intro');
  };

  const handleVideoSlotError = (slot: 0 | 1) => {
    const phase = storyPhaseRef.current;
    const assetKey = getAssetKeyForPhase(phase);
    const directSource = VIDEO_ASSET_URLS[assetKey];
    const currentResolvedSource = resolvedVideoSourcesRef.current[assetKey];
    if (currentResolvedSource === directSource) return;

    // If a blob/object URL playback fails (e.g. bad range cache), force direct URL fallback.
    SESSION_RESOLVED_SOURCES[assetKey] = directSource;
    setResolvedVideoSources((previous) => ({
      ...previous,
      [assetKey]: directSource,
    }));
    setSlotSources((previous) => {
      const next = [...previous] as [string | null, string | null];
      next[slot] = directSource;
      return next;
    });
  };

  const handleActivateIncomingSlot = (slot: 0 | 1) => {
    const incomingVideo = getVideoBySlot(slot);
    const outgoingVideo = getVideoBySlot(slot === 0 ? 1 : 0);
    if (!incomingVideo) return;

    if (window.navigator.userActivation?.hasBeenActive) {
      hasUserInteractedRef.current = true;
    }
    incomingVideo.muted = !hasUserInteractedRef.current;
    incomingVideo.volume = 1;
    incomingVideo.playbackRate = playbackRateTargetRef.current || 1;
    void incomingVideo.play().catch(() => undefined);

    if (outgoingVideo) {
      outgoingVideo.pause();
      outgoingVideo.muted = true;
    }

    setActiveVideoSlot(slot);
    pendingSwitchSlotRef.current = null;
    if (videoTransitionMaskTimerRef.current) {
      clearTimeout(videoTransitionMaskTimerRef.current);
      videoTransitionMaskTimerRef.current = null;
    }
    window.setTimeout(() => {
      setIsVideoTransitionMaskVisible(false);
    }, 120);
  };

  const handleSlotLoadedData = (slot: 0 | 1) => {
    // If we are preparing another slot, ignore loadeddata from non-target slots.
    if (pendingSwitchSlotRef.current !== null && pendingSwitchSlotRef.current !== slot) {
      return;
    }

    // Initial slot load (no pending switch): ensure audio state is applied immediately.
    if (pendingSwitchSlotRef.current !== slot) {
      if (slot !== activeVideoSlot) return;
      const activeVideo = getVideoBySlot(slot);
      if (!activeVideo) return;
      if (window.navigator.userActivation?.hasBeenActive) {
        hasUserInteractedRef.current = true;
      }
      activeVideo.muted = !hasUserInteractedRef.current;
      activeVideo.volume = 1;
      void activeVideo.play().catch(() => undefined);
      setIsInitialFrameReady(true);
      return;
    }

    handleActivateIncomingSlot(slot);
  };

  useEffect(() => {
    const pendingSlot = pendingSwitchSlotRef.current;
    if (pendingSlot === null) return;

    const incomingVideo = getVideoBySlot(pendingSlot);
    if (!incomingVideo) return;

    let cancelled = false;
    const tryActivatePendingSlot = () => {
      if (cancelled) return;
      if (pendingSwitchSlotRef.current !== pendingSlot) return;
      if (incomingVideo.readyState >= 2) {
        handleActivateIncomingSlot(pendingSlot);
      }
    };

    const handleIncomingReady = () => {
      tryActivatePendingSlot();
    };

    incomingVideo.addEventListener('loadeddata', handleIncomingReady);
    incomingVideo.addEventListener('canplay', handleIncomingReady);
    incomingVideo.addEventListener('canplaythrough', handleIncomingReady);

    const pollTimer = window.setInterval(tryActivatePendingSlot, 200);
    const timeoutTimer = window.setTimeout(() => {
      tryActivatePendingSlot();
      // Hard stop polling after fallback window.
      window.clearInterval(pollTimer);
    }, 10000);

    // First immediate check for already-ready cases.
    tryActivatePendingSlot();

    return () => {
      cancelled = true;
      incomingVideo.removeEventListener('loadeddata', handleIncomingReady);
      incomingVideo.removeEventListener('canplay', handleIncomingReady);
      incomingVideo.removeEventListener('canplaythrough', handleIncomingReady);
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [currentVideoSrc, activeVideoSlot, slotSources]);

  useEffect(() => {
    if (isInitialFrameReady || !isIntroReady) return;
    const activeVideo = getActiveVideo();
    if (!activeVideo) return;

    const handleFrameReady = () => {
      if (activeVideo.readyState >= 2) {
        setIsInitialFrameReady(true);
      }
    };

    handleFrameReady();
    activeVideo.addEventListener('loadeddata', handleFrameReady);
    activeVideo.addEventListener('canplay', handleFrameReady);

    const fallbackTimer = window.setTimeout(handleFrameReady, 2500);
    return () => {
      activeVideo.removeEventListener('loadeddata', handleFrameReady);
      activeVideo.removeEventListener('canplay', handleFrameReady);
      window.clearTimeout(fallbackTimer);
    };
  }, [isInitialFrameReady, isIntroReady, activeVideoSlot, slotSources, currentVideoSrc]);

  useEffect(() => {
    storyPhaseRef.current = storyPhase;
  }, [storyPhase]);

  useEffect(() => {
    if (storyPhase !== 'loop') return;

    preloadAllBranchesForLoop();
    interactionLockedRef.current = false;
    stopLoopDecision();
    stopPlaybackRateAnimation();

    loopClickCountRef.current = 0;
    tapTimestampsRef.current = [];
    setLoopWindowProgress(0);
    playbackRateTargetRef.current = LOOP_BASE_PLAYBACK_RATE;

    const video = getActiveVideo();
    if (video) {
      applyPlaybackRateToSlots(LOOP_BASE_PLAYBACK_RATE);
    }

    startPlaybackRateAnimation();
    loopSpeedSessionRef.current = {
      startedAtMs: performance.now(),
      rateArea: 0,
      sampleCount: 0,
      tapCount: 0,
      lastSampleAtMs: performance.now(),
    };
    if (LOOP_SPEED_DEBUG_ENABLED) {
      console.info('[loop-speed] session started', {
        loopDurationAt1x: loopDurationSecondsRef.current ? Number(loopDurationSecondsRef.current.toFixed(2)) : null,
        baseTargetRate: playbackRateTargetRef.current,
      });
    }

    const startedAt = Date.now();

    loopProgressTimerRef.current = setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / LOOP_DECISION_WINDOW_MS, 1);
      setLoopWindowProgress(progress);
      updateLoopPlaybackRateTarget();
      const session = loopSpeedSessionRef.current;
      const activeVideo = getActiveVideo();
      if (session && activeVideo) {
        const nowMs = performance.now();
        const deltaSeconds = Math.max(0, (nowMs - session.lastSampleAtMs) / 1000);
        session.rateArea += activeVideo.playbackRate * deltaSeconds;
        session.sampleCount += 1;
        session.lastSampleAtMs = nowMs;

        // Effective rate based on actual media time progression.
        const probe = loopEffectiveRateProbeRef.current;
        if (!probe) {
          loopEffectiveRateProbeRef.current = {
            wallMs: nowMs,
            mediaSeconds: activeVideo.currentTime,
            lastLogMs: nowMs,
          };
        } else {
          const wallDelta = (nowMs - probe.wallMs) / 1000;
          const mediaDelta = activeVideo.currentTime - probe.mediaSeconds;
          if (wallDelta > 0.001) {
            const effectiveRate = mediaDelta / wallDelta;
            if (LOOP_SPEED_DEBUG_ENABLED && nowMs - probe.lastLogMs >= 650) {
              console.info('[loop-speed] effective', {
                effectiveRate: Number(effectiveRate.toFixed(3)),
                visibleSlot: activeVideoSlot,
                currentRate: Number(activeVideo.playbackRate.toFixed(3)),
                currentTime: Number(activeVideo.currentTime.toFixed(3)),
              });
              probe.lastLogMs = nowMs;
            }
          }
          probe.wallMs = nowMs;
          probe.mediaSeconds = activeVideo.currentTime;
        }
      }
    }, 50);

    loopDecisionTimeoutRef.current = setTimeout(() => {
      if (storyPhaseRef.current !== 'loop' || interactionLockedRef.current) return;

      const taps = loopClickCountRef.current;
      if (taps >= TAP_TO_EP2_MIN) {
        void enterBranch('click');
      } else if (taps >= TAP_TO_EP3_MIN) {
        void enterBranch('hold');
      } else {
        void enterBranch('rapid');
      }
    }, LOOP_DECISION_WINDOW_MS);

    return () => {
      stopLoopDecision();
      playbackRateTargetRef.current = 1;
      const activeVideo = getActiveVideo();
      if (activeVideo) {
        applyPlaybackRateToSlots(1);
      }
      stopPlaybackRateAnimation();
      finalizeLoopSpeedSession('loop-cleanup');
      loopEffectiveRateProbeRef.current = null;
    };
  }, [storyPhase]);

  const handleToggleLike = (demoId: number) => {
    setLikedByDemoId((previous) => ({
      ...previous,
      [demoId]: !previous[demoId],
    }));
  };

  const handleOpenComments = (demoId: number) => {
    setActiveCommentsDemoId(demoId);
    setIsCharactersOpen(false);
    setIsCommentsOpen(true);
  };

  const handleCloseComments = () => {
    setIsCommentsOpen(false);
  };

  const handleOpenCharacters = (demoId: number) => {
    setActiveCharactersDemoId(demoId);
    setIsCommentsOpen(false);
    setIsCharactersOpen(true);
  };

  const handleCloseCharacters = () => {
    setIsCharactersOpen(false);
  };

  const handleToggleFullscreen = () => {
    if (storyPhaseRef.current === 'loop') {
      didManualMaximizeToggleInLoopRef.current = true;
    }
    setIsFullscreen((previous) => !previous);
  };

  const handlePointerDown = () => {
    if (storyPhase !== 'loop' || interactionLockedRef.current) return;
    const rippleId = Date.now() + Math.floor(Math.random() * 1000);
    setInteractionRippleIds((previous) => [...previous, rippleId].slice(-3));
    setIsInteractionButtonPressed(true);
    hasUserInteractedRef.current = true;
    loopClickCountRef.current += 1;
    if (loopSpeedSessionRef.current) {
      loopSpeedSessionRef.current.tapCount += 1;
    }
    tapTimestampsRef.current.push(Date.now());
    updateLoopPlaybackRateTarget();
    if (LOOP_SPEED_DEBUG_ENABLED) {
      const activeVideo = getActiveVideo();
      console.info('[loop-speed] tap', {
        tapCount: loopClickCountRef.current,
        targetRate: Number(playbackRateTargetRef.current.toFixed(3)),
        currentRate: activeVideo ? Number(activeVideo.playbackRate.toFixed(3)) : null,
      });
    }
  };

  const handleSlotLoadedMetadata = (slot: 0 | 1) => {
    const video = getVideoBySlot(slot);
    if (!video) return;
    if (Math.abs(video.duration) > 0 && Number.isFinite(video.duration) && video.src === resolvedVideoSourcesRef.current.loop) {
      loopDurationSecondsRef.current = video.duration;
      if (LOOP_SPEED_DEBUG_ENABLED) {
        console.info('[loop-speed] loop metadata', { duration: Number(video.duration.toFixed(2)) });
      }
    }
  };

  const handlePointerUp = () => {
    setIsInteractionButtonPressed(false);
  };

  const handlePointerLeave = () => {
    setIsInteractionButtonPressed(false);
  };

  const handleResumePlayback = () => {
    const video = getActiveVideo();
    if (!video) return;
    hasUserInteractedRef.current = true;
    setIsPausedByUser(false);
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => undefined);
  };

  const handleVideoSurfaceClick = (event: MouseEvent<HTMLDivElement>) => {
    if (storyPhaseRef.current === 'loop') return;
    if (isCommentsOpen || isCharactersOpen) return;

    const target = event.target as HTMLElement;
    if (target.closest('[data-ui-layer="true"]')) return;

    const video = getActiveVideo();
    if (!video || video.ended) return;

    if (video.paused) {
      hasUserInteractedRef.current = true;
      video.muted = false;
      video.volume = 1;
      void video.play().catch(() => undefined);
      return;
    }

    setIsPausedByUser(true);
    video.pause();
    setIsVideoPaused(true);
  };

  const isBranchPhase =
    storyPhase === 'branch_click' || storyPhase === 'branch_hold' || storyPhase === 'branch_rapid';

  useEffect(() => {
    const previousPhase = previousStoryPhaseRef.current;

    if (storyPhase === 'loop' && previousPhase !== 'loop') {
      didManualMaximizeToggleInLoopRef.current = false;
      if (!isFullscreen) {
        shouldExitFullscreenAfterLoopRef.current = true;
        setIsFullscreen(true);
      } else {
        shouldExitFullscreenAfterLoopRef.current = false;
      }
    }

    if (previousPhase === 'loop' && storyPhase !== 'loop') {
      if (shouldExitFullscreenAfterLoopRef.current && !didManualMaximizeToggleInLoopRef.current) {
        setIsFullscreen(false);
      }
      shouldExitFullscreenAfterLoopRef.current = false;
      didManualMaximizeToggleInLoopRef.current = false;
    }

    previousStoryPhaseRef.current = storyPhase;
  }, [storyPhase, isFullscreen]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {isMenuOpen && <div className="absolute inset-0 z-[60]" onClick={() => setIsMenuOpen(false)} />}

      <div data-ui-layer="true" className={`absolute top-0 left-0 w-full px-5 pt-12 pb-5 z-[70] flex items-center justify-between pointer-events-none transition-opacity duration-300 ${isFullscreen ? 'opacity-0' : 'opacity-100'}`}>
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
                className="absolute top-12 right-0 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden min-w-[160px] shadow-2xl z-20"
              >
                <div className="flex flex-col py-1.5">
                  <button className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 transition-colors w-full text-left">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Share Story</span>
                  </button>
                  <button className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 transition-colors w-full text-left">
                    <Wand2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Remix Flow</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full h-full relative bg-black overflow-hidden" onClick={handleVideoSurfaceClick}>
        <div className="absolute inset-0 z-0 bg-black">
          {isIntroReady ? (
            <>
              <video
                ref={videoARef}
                src={slotSources[0] ?? undefined}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-180 pointer-events-none"
                style={{ opacity: activeVideoSlot === 0 ? 0.85 : 0 }}
                autoPlay
                loop={shouldLoopSlot(0)}
                playsInline
                preload="auto"
                onEnded={() => {
                  if (activeVideoSlot === 0) handleVideoEnded();
                }}
                onLoadedData={() => handleSlotLoadedData(0)}
                onLoadedMetadata={() => handleSlotLoadedMetadata(0)}
                onError={() => handleVideoSlotError(0)}
              />
              <video
                ref={videoBRef}
                src={slotSources[1] ?? undefined}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-180 pointer-events-none"
                style={{ opacity: activeVideoSlot === 1 ? 0.85 : 0 }}
                autoPlay
                loop={shouldLoopSlot(1)}
                playsInline
                preload="auto"
                onEnded={() => {
                  if (activeVideoSlot === 1) handleVideoEnded();
                }}
                onLoadedData={() => handleSlotLoadedData(1)}
                onLoadedMetadata={() => handleSlotLoadedMetadata(1)}
                onError={() => handleVideoSlotError(1)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),#020202]">
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <div className="w-14 h-14 rounded-full border border-white/15 border-t-white/70 animate-spin" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Loading Intro</p>
                  <p className="text-[12px] text-white/70 mt-1">Caching `index_1` before playback starts.</p>
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.55)_100%)]" />
        </div>

        <AnimatePresence>
          {!isInitialFrameReady && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="absolute inset-0 z-[5] pointer-events-none"
            >
              <img
                src={DEMO1_COVER_URL}
                alt="Demo 1 cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/38" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full border border-white/20 border-t-white/85 animate-spin" />
                <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-white/80">Loading Demo</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isCountdownEnabled && (
          <div data-ui-layer="true" className="absolute top-[3.25rem] left-0 right-0 z-[68] px-4 sm:px-5 pointer-events-none">
            <div className="w-full min-w-0 px-14 sm:px-16 md:px-[4.25rem]">
              <div className="rounded-full border border-white/15 bg-black/45 backdrop-blur-xl px-3 py-2 flex items-center gap-2 min-w-0">
                <Heart className="w-3.5 h-3.5 shrink-0" style={{ color: countdownColorSoft }} />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.25em] text-white/75 shrink-0">
                  Smash!
                </span>
                <div className="flex-1 min-w-0">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden w-full">
                    <div
                      className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.35)] transition-all duration-100"
                      style={{
                        width: `${Math.max(6, countdownProgress * 100)}%`,
                        background: `linear-gradient(90deg, ${countdownColor}, ${countdownColorSoft})`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-white/80 tabular-nums shrink-0">
                  {countdownSecondsLeft}s
                </span>
              </div>
              <p className="mt-1.5 text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.16em] uppercase text-white/45 text-center leading-tight break-words px-2">
                Smash the jammed gate before the horde reaches you
              </p>
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-between z-10">
          <div className="flex-1 flex items-end">
            <div data-ui-layer="true" className="relative z-10 p-4 pb-12 w-full flex flex-col justify-end pointer-events-none">
              <div className="flex flex-col gap-4 w-full pointer-events-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                  <div className={`flex flex-col gap-1.5 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <h2 className="text-[15px] font-bold text-white drop-shadow-md leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {STORY_CONFIG.title}
                    </h2>
                    <p className="text-white/80 text-[12px] font-light leading-snug max-w-[300px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                      {STORY_CONFIG.feedHook}
                    </p>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-2">
                  <div className="flex flex-row items-center justify-between w-full min-w-0">
                    <div className={`relative flex flex-col items-center shrink-0 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                      <div className="w-[30px] h-[30px] rounded-full border-2 border-white overflow-hidden bg-black/50 relative">
                        <img src={CUSTOM_LOGO_URL} alt="Avatar" className="w-full h-full object-cover animate-ping absolute inset-0" style={{ animationDuration: '3s' }} />
                        <img src={CUSTOM_LOGO_URL} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                      </div>
                      <button className="absolute -bottom-1.5 w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm border border-white hover:bg-red-600 transition-colors z-20">
                        <Plus className="w-[8px] h-[8px]" strokeWidth={3} />
                      </button>
                    </div>

                    <div className={`flex flex-row items-center gap-1 shrink-0 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                      <button
                        onClick={() => handleToggleLike(STORY_CONFIG.id)}
                        className={`flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ${likedByDemoId[STORY_CONFIG.id] ? 'text-red-500' : 'text-white'}`}
                      >
                        <Heart className="w-6 h-6 fill-current drop-shadow-md" />
                      </button>
                      <span className="text-white font-semibold text-[12px] drop-shadow-md">136.1K</span>
                    </div>

                    <div className={`flex flex-row items-center gap-1 shrink-0 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                      <button
                        onClick={() => handleOpenComments(STORY_CONFIG.id)}
                        className="flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform"
                      >
                        <MessageCircle className="w-6 h-6 fill-current drop-shadow-md" style={{ transform: 'scaleX(-1)' }} />
                      </button>
                      <span className="text-white font-semibold text-[12px] drop-shadow-md">{STORY_CONFIG.commentCount}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCharacters(STORY_CONFIG.id)}
                      className={`h-7 px-1 rounded-full border border-white/15 bg-black/45 backdrop-blur-lg flex items-center hover:bg-black/60 transition-all z-50 shrink-0 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      aria-label="Open cast list"
                    >
                      <div className="flex items-center">
                        {(CHARACTERS_BY_DEMO[STORY_CONFIG.id] ?? []).slice(0, 2).map((character, index) => (
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
                      onClick={handleToggleFullscreen}
                      className="flex items-center justify-center text-white/25 hover:text-white hover:scale-110 active:scale-90 transition-all z-50 shrink-0"
                    >
                      <Maximize className="w-[22px] h-[22px] drop-shadow-md" />
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <div data-ui-layer="true" className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none pb-[11rem] sm:pb-[11.5rem] lg:pb-[12rem] z-20">
          <div className={`transition-transform duration-300 ${isFullscreen ? 'translate-y-16' : 'translate-y-0'}`}>
            <AnimatePresence mode="wait">
              {storyPhase === 'loop' ? (
                <motion.div
                  key="loop-interaction"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center gap-3 pointer-events-auto"
                >
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <p className="absolute -top-8 text-[15px] font-semibold tracking-[0.08em] text-white/92">
                      Click fast!
                    </p>
                    <div
                      className="absolute inset-0 rounded-full transition-all duration-75"
                      style={{
                        background: `conic-gradient(from 0deg, transparent 0deg ${loopWindowProgress * 360}deg, rgba(255,255,255,0.9) ${loopWindowProgress * 360}deg 360deg)`,
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
                      }}
                    />
                    {interactionRippleIds.map((rippleId) => (
                      <motion.span
                        key={rippleId}
                        initial={{ scale: 0.55, opacity: 0.6 }}
                        animate={{ scale: 1.7, opacity: 0 }}
                        transition={{ duration: 0.42, ease: 'easeOut' }}
                        onAnimationComplete={() => {
                          setInteractionRippleIds((previous) => previous.filter((id) => id !== rippleId));
                        }}
                        className="absolute w-16 h-16 rounded-full border border-white/45"
                      />
                    ))}
                    <motion.button
                      onPointerDown={handlePointerDown}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerLeave}
                      onPointerCancel={handlePointerLeave}
                      className={`w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/35 rounded-full flex items-center justify-center text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.24)] ${isInteractionButtonPressed ? 'scale-[0.8] bg-white/18 border-white/60' : 'scale-100'}`}
                    >
                      <MousePointerClick className={`w-6 h-6 transition-transform duration-100 ${isInteractionButtonPressed ? 'scale-90' : 'scale-100'}`} />
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="passive-state"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-3 pointer-events-auto"
                >
                  {isBranchPhase && showBranchReplay && (
                    <button
                      type="button"
                      onClick={handleReplayFromStart}
                      className="mt-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-xl text-white text-[11px] font-semibold tracking-[0.14em] uppercase border border-white/25 hover:bg-white/16 hover:border-white/35 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Replay
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {isVideoPaused && isPausedByUser && storyPhase !== 'loop' && !showBranchReplay && !isBranchTransitionLoading && (
          <div data-ui-layer="true" className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={handleResumePlayback}
              className="pointer-events-auto w-16 h-16 rounded-full bg-black/55 border border-white/30 backdrop-blur-xl text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
              aria-label="Resume playback"
            >
              <Play className="w-7 h-7 ml-0.5 fill-current" />
            </button>
          </div>
        )}

        {isBranchTransitionLoading && (
          <div data-ui-layer="true" className="absolute inset-0 z-30 flex items-center justify-center bg-black/28 backdrop-blur-[2px] pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-white/20 border-t-white/75 animate-spin" />
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">
                Loading Branch
              </p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isVideoTransitionMaskVisible && !isBranchTransitionLoading && (
            <motion.div
              initial={{ opacity: 0.24 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute inset-0 z-[26] bg-black pointer-events-none"
            />
          )}
        </AnimatePresence>
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
              onClick={handleCloseCharacters}
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
                  <span className="text-[13px] font-semibold text-white">Characters</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{activeCharactersDemo.title}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCharacters}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[52vh] overflow-y-auto px-4 py-3 space-y-3">
                {activeCharacters.map((character) => (
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
                        <button
                          type="button"
                          disabled={!character.unlocked}
                          className={`mt-2.5 min-h-7 px-3 py-1 rounded-full border text-[10px] font-semibold tracking-[0.08em] uppercase leading-tight whitespace-normal text-center break-words transition-all ${
                            character.unlocked
                              ? 'border-white/20 bg-white/10 text-white/85 hover:bg-white/15'
                              : 'border-white/10 bg-white/[0.03] text-white/35 cursor-not-allowed'
                          }`}
                          aria-label={character.unlocked ? `Chat with ${character.name}` : 'Unlock character to chat'}
                        >
                          {character.unlocked ? `Chat with ${character.name}` : 'Unlock to chat'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
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
