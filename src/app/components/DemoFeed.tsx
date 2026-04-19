import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointerClick, Heart } from 'lucide-react';
import { STORY1_VIDEOS } from '../storyVideos';
import { useDemoDebug } from '../context/DemoDebugContext';
import { useFeedPrefetchAbortSignal } from '../context/FeedPrefetchAbortContext';
import { mergeAbortSignals } from '../utils/mergeAbortSignals';
import { CUSTOM_LOGO_URL, DEMOS, STORY_CONFIG as STORY_SCENARIO } from '../interactive/scenarios/demoScenarios';
import { usePlayerShell } from '../interactive/core/usePlayerShell';
import { PlayerShellCenterOverlay } from '../interactive/core/PlayerShellCenterOverlay';
import { DemoEngagementPanel } from '../interactive/engagement/DemoEngagementPanel';
import { DemoCastDrawer } from '../interactive/engagement/DemoCastDrawer';
import { DemoCommentsDrawer } from '../interactive/engagement/DemoCommentsDrawer';
import { DemoEpisodesDrawer, type EpisodeInfo } from '../interactive/engagement/DemoEpisodesDrawer';
import { DemoTopBar } from '../interactive/engagement/DemoTopBar';
import type { DemoCharacterPreview } from '../interactive/types/demo';

const DEMO1_COVER_URL = new URL('../../assets/Demo1-cover.jpg', import.meta.url).href;
const RHEA_VOSS_AVATAR_URL = new URL('../../assets/Rhea_Voss.jpg', import.meta.url).href;
const HORRO_LATCHER_AVATAR_URL = new URL('../../assets/Horro_Latcher.jpg', import.meta.url).href;

const STORY_INTRO_VIDEO = STORY1_VIDEOS.intro;
const STORY_LOOP_VIDEO = STORY1_VIDEOS.loop;
const STORY_TAP_VIDEO = STORY1_VIDEOS.branches.click;
const STORY_HOLD_VIDEO = STORY1_VIDEOS.branches.hold;
const STORY_RAPID_VIDEO = STORY1_VIDEOS.branches.rapid;

type StoryPhase = 'intro' | 'loop' | 'branch_click' | 'branch_hold' | 'branch_rapid';
type BranchType = 'click' | 'hold' | 'rapid';
type VideoAssetKey = 'intro' | 'loop' | 'click' | 'hold' | 'rapid';

const DEMO1_PHASE_TO_FILE: Record<StoryPhase, string> = {
  intro: 'index_1.mp4',
  loop: 'index_2.mp4',
  branch_click: 'ep_2.mp4',
  branch_hold: 'ep_3.mp4',
  branch_rapid: 'ep_4.mp4',
};

export type StoryPlaybackSnapshot = {
  phase: StoryPhase;
  activeBranch: BranchType | null;
  statusLabel: string;
};

const STORY_CONFIG = {
  ...STORY_SCENARIO,
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
      name: 'Rhea Voss',
      role: 'Breacher and Evac Escort',
      summary:
        'A wasteland breacher and evacuation escort. She speaks short, hard, and rarely explains. She does not comfort, she gives orders. Trust is earned through performance, never assumed. She hates hesitation, dropped execution, and "wait a little longer." Doorways, countdowns, missed grabs, and turn-back rescues trigger the old sealed-door trauma and make her harsher. Her words cut, but in real danger she always moves to save people first. Once she recognizes you, you stop being dead weight and become someone she will turn back for.',
      unlocked: true,
      avatar: RHEA_VOSS_AVATAR_URL,
    },
    {
      id: 2,
      name: 'Horro Latcher',
      role: 'Gate Interceptor Infected',
      summary:
        'An infected variant that retains a doorway interception instinct. It specializes in lunging for an arm at the final second before survivors enter a safe zone, often causing a bite. It is not the most violent unit in the horde, but often the most lethal one, because it turns "almost made it" into "injured, or dead."',
      unlocked: true,
      avatar: HORRO_LATCHER_AVATAR_URL,
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
const MAX_LOOP_PLAYBACK_RATE = 4;
const TAPS_PER_SECOND_FOR_MAX_SPEED = 5.4;
const TAP_BURST_RATE_BONUS = 0.18;
const PLAYBACK_SMOOTHING = 0.24;
const SPEED_GAIN_CURVE_EXPONENT = 2.5;
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
type SessionWarmupState = 'idle' | 'running' | 'done';
let SESSION_WARMUP_STATE: SessionWarmupState = 'idle';
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

const MOCK_EPISODES: EpisodeInfo[] = [
  { id: 1, title: 'Escaping a dangerous world', duration: '0:45', status: 'playing', thumbnailUrl: DEMO1_COVER_URL },
  { id: 2, title: 'Saving someone under pressure', duration: '1:12', status: 'unlocked' },
  { id: 3, title: 'Emotionally responding', duration: '2:05', status: 'locked' },
  { id: 4, title: 'The final confrontation', duration: '1:50', status: 'locked' },
  { id: 5, title: 'Aftermath', duration: '0:30', status: 'locked' },
];

export function DemoFeed({
  onBackHome,
  onStoryStateChange,
  isActive = true,
  shouldAutoStart = true,
}: {
  onIndexChange?: (index: number) => void;
  activeIndex?: number;
  onBackHome?: () => void;
  onStoryStateChange?: (snapshot: StoryPlaybackSnapshot) => void;
  isActive?: boolean;
  shouldAutoStart?: boolean;
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
  /** Aborts hidden branch previews started from the loop phase (not user-entered branches). */
  const branchLoopPreloadAbortRef = useRef<AbortController | null>(null);
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

  const [likedByDemoId, setLikedByDemoId] = useState<Record<number, boolean>>({});
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeCommentsDemoId, setActiveCommentsDemoId] = useState<number | null>(STORY_CONFIG.id);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);
  const [activeCharactersDemoId, setActiveCharactersDemoId] = useState<number | null>(STORY_CONFIG.id);
  const [isEpisodesOpen, setIsEpisodesOpen] = useState(false);
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('intro');
  const [loopWindowProgress, setLoopWindowProgress] = useState(0);
  const storyPhaseRef = useRef<StoryPhase>(storyPhase);
  const [resolvedVideoSources, setResolvedVideoSources] = useState<Record<VideoAssetKey, string>>(SESSION_RESOLVED_SOURCES);
  // Skip "Loading Intro" if this SPA session already resolved intro to a blob: URL (e.g. left demo and came back).
  const [isIntroReady, setIsIntroReady] = useState(
    () => SESSION_RESOLVED_SOURCES.intro !== VIDEO_ASSET_URLS.intro
  );
  const [showBranchReplay, setShowBranchReplay] = useState(false);
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
  const allowPlayback = isActive && shouldAutoStart;
  const feedPrefetchAbortSignal = useFeedPrefetchAbortSignal();
  /** Keep in sync during render so async prefetch cannot run one frame past tab deactivation. */
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  /** Cancels intro/loop fetch() and any merged preload as soon as Demo1 is not the visible feed. */
  const demo1InactiveAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!isActive) {
      demo1InactiveAbortRef.current?.abort();
      demo1InactiveAbortRef.current = null;
      return;
    }
    demo1InactiveAbortRef.current = new AbortController();
    return () => {
      demo1InactiveAbortRef.current?.abort();
      demo1InactiveAbortRef.current = null;
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) return;
    branchLoopPreloadAbortRef.current?.abort();
    branchLoopPreloadAbortRef.current = null;
    branchPreloadPromiseRef.current = {};
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (videoA) {
      videoA.pause();
      videoA.removeAttribute('src');
      videoA.load();
    }
    if (videoB) {
      videoB.pause();
      videoB.removeAttribute('src');
      videoB.load();
    }
  }, [isActive]);

  const { push: pushDebug } = useDemoDebug();
  const prevStoryPhaseDebugRef = useRef<StoryPhase | null>(null);
  useEffect(() => {
    if (!isActive) {
      prevStoryPhaseDebugRef.current = null;
      return;
    }
    if (prevStoryPhaseDebugRef.current === storyPhase) return;
    prevStoryPhaseDebugRef.current = storyPhase;
    pushDebug({
      kind: 'video_branch',
      title: 'Demo1 · branch clip',
      body: `phase: ${storyPhase}\nlogical file: ${DEMO1_PHASE_TO_FILE[storyPhase]}`,
    });
  }, [isActive, storyPhase, pushDebug]);

  const getVideoBySlot = (slot: 0 | 1) => (slot === 0 ? videoARef.current : videoBRef.current);
  const getActiveVideo = () => getVideoBySlot(activeVideoSlot);
  const getInactiveSlot = (): 0 | 1 => (activeVideoSlot === 0 ? 1 : 0);
  const shouldLoopSlot = (slot: 0 | 1) =>
    storyPhase === 'loop' &&
    activeVideoSlot === slot &&
    slotSources[slot] === resolvedVideoSources.loop;

  const {
    isFullscreen,
    setIsFullscreen,
    isVideoPaused,
    setIsVideoPaused,
    isPausedByUser,
    setIsPausedByUser,
    handleVideoSurfaceClick,
    handleVideoSurfacePointerDown,
    handleVideoSurfacePointerEnd,
    handleResumePlayback,
    resetPauseUiState,
  } = usePlayerShell({
    isActive: allowPlayback,
    getActiveVideo,
    bindingKey: `${activeVideoSlot}:${currentVideoSrc}`,
    canTogglePause: () =>
      storyPhaseRef.current !== 'loop' && !isCommentsOpen && !isCharactersOpen && !showBranchReplay,
    onAfterResume: () => {
      hasUserInteractedRef.current = true;
    },
  });

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

    if (!allowPlayback) {
      video.pause();
      return;
    }

    video.muted = !hasUserInteractedRef.current;
    video.volume = 1;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }, [allowPlayback, activeVideoSlot, slotSources, isIntroReady, currentVideoSrc]);

  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) return;

    if (!allowPlayback) {
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
  }, [allowPlayback, isPausedByUser, showBranchReplay, isIntroReady, activeVideoSlot, slotSources, currentVideoSrc]);

  useEffect(() => {
    if (isActive) return;
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (videoA) {
      videoA.pause();
      videoA.muted = true;
    }
    if (videoB) {
      videoB.pause();
      videoB.muted = true;
    }
  }, [isActive]);

  useEffect(() => {
    const inactiveVideo = getVideoBySlot(getInactiveSlot());
    if (!inactiveVideo) return;
    inactiveVideo.pause();
    inactiveVideo.muted = true;
    inactiveVideo.volume = 0;
  }, [activeVideoSlot, slotSources]);

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
    if (!isActiveRef.current) return;
    if (window.navigator.userActivation?.hasBeenActive) {
      hasUserInteractedRef.current = true;
      const video = getActiveVideo();
      if (video) {
        video.muted = false;
        video.volume = 1;
      }
    }

    const handleUserInteraction = () => {
      if (!isActiveRef.current) return;
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
  }, [activeVideoSlot, isActive]);

  useEffect(() => {
    // Combo-1 optimization:
    // - Demo1 warmup is *critical* only when Demo1 is active (preemptable)
    // - When user switches to another demo, abort warmup immediately to free bandwidth/decoder
    if (!isActive || !shouldAutoStart) return;

    let isCancelled = false;
    const controller = new AbortController();

    const withWarmupTimeout = async (assetKey: VideoAssetKey, timeoutMs: number) => {
      const directSource = VIDEO_ASSET_URLS[assetKey];
      const timeoutPromise = new Promise<string>((resolve) => {
        window.setTimeout(() => resolve(directSource), timeoutMs);
      });
      return Promise.race([resolveCachedVideo(assetKey, controller.signal), timeoutPromise]);
    };

    const ensureSessionWarmup = () => {
      if (SESSION_WARMUP_STATE === 'done') {
        logVideoWarmup('session warmup reuse', '(done)');
        return SESSION_WARMUP_PROMISE ?? Promise.resolve();
      }
      if (SESSION_WARMUP_STATE === 'running') {
        logVideoWarmup('session warmup reuse', '(running)');
        return SESSION_WARMUP_PROMISE ?? Promise.resolve();
      }

      SESSION_WARMUP_STATE = 'running';
      logVideoWarmup('session warmup start');
      SESSION_WARMUP_PROMISE = (async () => {
        try {
          logVideoWarmup('intro warmup queued');
          await resolveCachedVideo('intro', controller.signal);
          logVideoWarmup('intro warmup done');
          logVideoWarmup('loop warmup queued');
          await resolveCachedVideo('loop', controller.signal);
          logVideoWarmup('loop warmup done');
          logVideoWarmup('branch warmup queued');
          await Promise.all([
            resolveCachedVideo('click', controller.signal),
            resolveCachedVideo('hold', controller.signal),
            resolveCachedVideo('rapid', controller.signal),
          ]);
          logVideoWarmup('branch warmup done');
          SESSION_WARMUP_STATE = 'done';
        } catch (e) {
          // Abort or transient failure: allow restarting next time.
          if ((e as any)?.name === 'AbortError' || controller.signal.aborted) {
            logVideoWarmup('session warmup aborted');
          } else {
            logVideoWarmup('session warmup failed', e instanceof Error ? e.message : '(unknown error)');
          }
          SESSION_WARMUP_STATE = 'idle';
          throw e;
        }
      })();
      return SESSION_WARMUP_PROMISE;
    };

    void (async () => {
      try {
        // Critical stage: index_1 then index_2 (fast path for immediate playback).
        const introSource = await withWarmupTimeout('intro', 12000);
        if (isCancelled || !isActiveRef.current) return;
        setResolvedVideoSources((previous) => ({ ...previous, intro: introSource }));
        setIsIntroReady(true);

        const loopSource = await withWarmupTimeout('loop', 10000);
        if (isCancelled || !isActiveRef.current) return;
        setResolvedVideoSources((previous) => ({ ...previous, loop: loopSource }));

        // Background stage: branches + cache fill; still abortable via controller.
        await ensureSessionWarmup().catch(() => undefined);
        if (isCancelled || !isActiveRef.current) return;
        if (SESSION_WARMUP_STATE === 'done') setResolvedVideoSources({ ...SESSION_RESOLVED_SOURCES });
      } catch {
        // best-effort; playback can still proceed with direct URLs
      }
    })();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [isActive, shouldAutoStart, feedPrefetchAbortSignal]);

  useEffect(() => {
    return () => {
      if (loopDecisionTimeoutRef.current) clearTimeout(loopDecisionTimeoutRef.current);
      if (loopProgressTimerRef.current) clearInterval(loopProgressTimerRef.current);
      stopPlaybackRateAnimation();
    };
  }, []);

  const resolveCachedVideo = async (assetKey: VideoAssetKey, signal?: AbortSignal) => {
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

    if (!isActiveRef.current) {
      return directSource;
    }

    const gateSignal = demo1InactiveAbortRef.current?.signal;
    const mergedParts = [signal, gateSignal, feedPrefetchAbortSignal].filter((s): s is AbortSignal => Boolean(s));
    const effectiveSignal =
      mergedParts.length === 0 ? undefined : mergedParts.length === 1 ? mergedParts[0] : mergeAbortSignals(mergedParts);

    if (effectiveSignal?.aborted) {
      return directSource;
    }

    if (SESSION_PRELOAD_PROMISES[assetKey]) {
      logVideoWarmup(`${assetKey} promise reuse`);
      return SESSION_PRELOAD_PROMISES[assetKey]!;
    }

    const preloadPromise = (async () => {
      if (typeof window === 'undefined') {
        return directSource;
      }
      if (effectiveSignal?.aborted) {
        return directSource;
      }

      try {
        let videoBlob: Blob | null = null;

        const requestInit: RequestInit = {
          mode: 'cors',
          credentials: 'omit',
          ...(effectiveSignal ? { signal: effectiveSignal } : {}),
        };

        if ('caches' in window && window.isSecureContext) {
          const cache = await window.caches.open(VIDEO_CACHE_NAME);
          const cachedResponse = await cache.match(directSource);

          if (!isActiveRef.current) {
            return directSource;
          }

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
              if (!isActiveRef.current) {
                return directSource;
              }
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
            if (!isActiveRef.current) {
              return directSource;
            }
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

        if (!isActiveRef.current) {
          return directSource;
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
        const isAbort =
          (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') ||
          (error instanceof Error && error.name === 'AbortError');
        logVideoWarmup(
          `${assetKey} ${isAbort ? 'warmup aborted' : 'warmup failed'}`,
          isAbort ? '(demo inactive or preempted)' : error instanceof Error ? error.message : '(unknown error)'
        );
        return directSource;
      } finally {
        delete SESSION_PRELOAD_PROMISES[assetKey];
      }
    })();

    SESSION_PRELOAD_PROMISES[assetKey] = preloadPromise;
    return preloadPromise;
  };

  const waitForLoadedData = (src: string, signal?: AbortSignal) =>
    new Promise<void>((resolve) => {
      if (!isActiveRef.current) {
        resolve();
        return;
      }
      if (signal?.aborted) {
        resolve();
        return;
      }
      const previewVideo = document.createElement('video');
      previewVideo.preload = 'auto';
      previewVideo.muted = true;
      previewVideo.playsInline = true;

      let didResolve = false;
      let timeoutId: ReturnType<typeof window.setTimeout> | null = null;
      const cleanup = () => {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        timeoutId = null;
        signal?.removeEventListener('abort', onAbort);
        previewVideo.removeEventListener('loadeddata', onReady);
        previewVideo.removeEventListener('canplaythrough', onReady);
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
      const onAbort = () => finalize();
      signal?.addEventListener('abort', onAbort);
      const onReady = () => finalize();
      const handleError = () => finalize();

      previewVideo.addEventListener('loadeddata', onReady);
      previewVideo.addEventListener('canplaythrough', onReady);
      previewVideo.addEventListener('error', handleError);
      previewVideo.src = src;
      previewVideo.load();

      // Avoid infinite loading UI on bad networks.
      timeoutId = window.setTimeout(finalize, 15000);
    });

  const ensureBranchPlayable = async (branch: BranchType, backgroundSignal?: AbortSignal) => {
    if (branchReadyRef.current[branch]) return;

    if (branchPreloadPromiseRef.current[branch]) {
      await branchPreloadPromiseRef.current[branch];
      if (branchReadyRef.current[branch]) return;
    }

    const preloadPromise = (async () => {
      if (!isActiveRef.current) return;
      const assetKey = getBranchAssetKey(branch);
      const source = await resolveCachedVideo(assetKey);
      if (!isActiveRef.current || backgroundSignal?.aborted) return;
      await waitForLoadedData(source, backgroundSignal);
      if (backgroundSignal?.aborted) return;
      branchReadyRef.current[branch] = true;
    })();

    branchPreloadPromiseRef.current[branch] = preloadPromise;
    return preloadPromise.finally(() => {
      delete branchPreloadPromiseRef.current[branch];
    });
  };

  const preloadAllBranchesForLoop = () => {
    branchLoopPreloadAbortRef.current?.abort();
    const controller = new AbortController();
    branchLoopPreloadAbortRef.current = controller;
    const { signal } = controller;
    void Promise.allSettled([
      ensureBranchPlayable('click', signal),
      ensureBranchPlayable('hold', signal),
      ensureBranchPlayable('rapid', signal),
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
    if (!isActiveRef.current) return;
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
    if (!isActiveRef.current) return;
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
    resetPauseUiState();
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
    if (!isActiveRef.current) {
      incomingVideo.pause();
      return;
    }

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
      if (!isActiveRef.current) return;
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
    if (!isActive) return;
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
      branchLoopPreloadAbortRef.current?.abort();
      branchLoopPreloadAbortRef.current = null;
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
  }, [storyPhase, isActive]);

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
    setIsEpisodesOpen(false);
    setIsCharactersOpen(true);
  };

  const handleCloseCharacters = () => {
    setIsCharactersOpen(false);
  };

  const handleOpenEpisodes = () => {
    setIsCommentsOpen(false);
    setIsCharactersOpen(false);
    setIsEpisodesOpen(true);
  };

  const handleCloseEpisodes = () => {
    setIsEpisodesOpen(false);
  };

  const handleToggleFullscreen = () => {
    if (storyPhaseRef.current === 'loop') {
      didManualMaximizeToggleInLoopRef.current = true;
    }
    setIsFullscreen((previous) => !previous);
  };

  const handlePointerDown = () => {
    if (!isActive) return;
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
      <DemoTopBar onBackHome={onBackHome ?? (() => undefined)} hideChrome={isFullscreen} />

      <div
        className="w-full h-full relative bg-black overflow-hidden"
        onClick={handleVideoSurfaceClick}
        onPointerDown={handleVideoSurfacePointerDown}
        onPointerUp={handleVideoSurfacePointerEnd}
        onPointerCancel={handleVideoSurfacePointerEnd}
        onPointerLeave={handleVideoSurfacePointerEnd}
      >
        <div className="absolute inset-0 z-0 bg-black">
          {isIntroReady ? (
            <>
              <video
                ref={videoARef}
                src={isActive ? (slotSources[0] ?? undefined) : undefined}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-180 pointer-events-none"
                style={{ opacity: activeVideoSlot === 0 ? 0.85 : 0 }}
                autoPlay={allowPlayback}
                loop={shouldLoopSlot(0)}
                playsInline
                preload={isActive ? 'auto' : 'none'}
                onEnded={() => {
                  if (activeVideoSlot === 0) handleVideoEnded();
                }}
                onLoadedData={() => handleSlotLoadedData(0)}
                onLoadedMetadata={() => handleSlotLoadedMetadata(0)}
                onError={() => handleVideoSlotError(0)}
              />
              <video
                ref={videoBRef}
                src={isActive ? (slotSources[1] ?? undefined) : undefined}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-180 pointer-events-none"
                style={{ opacity: activeVideoSlot === 1 ? 0.85 : 0 }}
                autoPlay={allowPlayback}
                loop={shouldLoopSlot(1)}
                playsInline
                preload={isActive ? 'auto' : 'none'}
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
            <div className="w-full min-w-0 px-10 sm:px-12 md:px-14">
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

        <div className="absolute inset-0 flex flex-col justify-between z-10 pb-[72px]">
          <div className="flex-1 flex items-end">
            <div data-ui-layer="true" className="relative z-[120] p-4 w-full flex flex-col justify-end pointer-events-none">
              <div className="flex flex-col gap-4 w-full pointer-events-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                  <div className={`flex flex-col gap-1.5 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <h2
                      className="text-[15px] font-bold text-white drop-shadow-md leading-tight select-none [-webkit-touch-callout:none]"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {STORY_CONFIG.title}
                    </h2>
                    <p className="text-white/80 text-[12px] font-light leading-snug max-w-[300px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] select-none [-webkit-touch-callout:none]">
                      {STORY_CONFIG.feedHook}
                    </p>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-2">
                  <DemoEngagementPanel
                    avatarUrl={CUSTOM_LOGO_URL}
                    isLiked={Boolean(likedByDemoId[STORY_CONFIG.id])}
                    likeCountText="136.1K"
                    commentCountText={STORY_CONFIG.commentCount}
                    characters={(CHARACTERS_BY_DEMO[STORY_CONFIG.id] ?? []).map((character) => ({
                      id: character.id,
                      name: character.name,
                      unlocked: character.unlocked,
                      avatar: character.avatar,
                    })) as DemoCharacterPreview[]}
                    onToggleLike={() => handleToggleLike(STORY_CONFIG.id)}
                    onOpenComments={() => handleOpenComments(STORY_CONFIG.id)}
                    onOpenCharacters={() => handleOpenCharacters(STORY_CONFIG.id)}
                    onOpenEpisodes={handleOpenEpisodes}
                    onToggleFullscreen={handleToggleFullscreen}
                    hideNonInteractiveUi={isFullscreen}
                    enableFullscreen={STORY_CONFIG.ui.enableFullscreen}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <div data-ui-layer="true" className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none pb-[12rem] sm:pb-[12.5rem] lg:pb-[13rem] z-20">
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
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <PlayerShellCenterOverlay
          showResumeButton={
            isVideoPaused &&
            isPausedByUser &&
            storyPhase !== 'loop' &&
            !showBranchReplay &&
            !isBranchTransitionLoading
          }
          onResume={handleResumePlayback}
          showReplayButton={isBranchPhase && showBranchReplay}
          replayLabel="Replay"
          onReplay={handleReplayFromStart}
        />

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

      <DemoCastDrawer
        isOpen={isCharactersOpen}
        title="Characters"
        subtitle={activeCharactersDemo.title}
        characters={activeCharacters}
        onClose={handleCloseCharacters}
      />
      <DemoCommentsDrawer
        isOpen={isCommentsOpen}
        title={`${activeCommentsDemo.commentCount} comments`}
        subtitle={activeCommentsDemo.title}
        comments={activeComments}
        onClose={handleCloseComments}
      />
      <DemoEpisodesDrawer
        isOpen={isEpisodesOpen}
        episodes={MOCK_EPISODES}
        onClose={handleCloseEpisodes}
      />
    </div>
  );
}
