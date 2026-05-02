import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import SiriWave from 'siriwave';
import { Heart, Mic, SendHorizontal, X } from 'lucide-react';
import { resolveCachedMediaUrl, warmupVideoUrl } from '../utils/mediaCache';
import { extractEmotionType } from '../utils/extractEmotionType';
import { mergeAbortSignals } from '../utils/mergeAbortSignals';
import { useFeedPrefetchAbortSignal } from '../context/FeedPrefetchAbortContext';
import { getDemo3PrefetchStaged } from '../utils/demo3Prefetch';
import { generateText } from '../utils/generateClient';
import { createMp3ObjectUrl, postPrompt, postPromptTts } from '../utils/promptTtsClient';
import { PROMPT_TTS_CLONE_MEDIA_TYPE, PROMPT_TTS_CLONE_VOICE_ID } from '../config/ttsCloneVoice';
import {
  buildDemo3GeneratePrompt,
  buildDemo3FinalTtsPrompt,
  type Demo3TurnRecord,
  DEMO3_FIXED_TEST_REPLY,
  DEMO3_INPUT_PLACEHOLDER,
} from '../config/prompt.config';
import { postAsrVoiceInputGenerate, extractAsrText, extractAsrAudioUrl } from '../utils/asrVoiceInputClient';
import { arrayBufferToBase64, concatFloat32, encodeWav16Mono, resampleMonoLinear } from '../utils/audioWav';
import { useDemoDebug } from '../context/DemoDebugContext';
import { useApiEnv } from '../context/ApiEnvContext';
import { CUSTOM_LOGO_URL } from '../interactive/scenarios/demoScenarios';
import { usePlayerShell } from '../interactive/core/usePlayerShell';
import { PlayerShellCenterOverlay } from '../interactive/core/PlayerShellCenterOverlay';
import { DemoCastDrawer } from '../interactive/engagement/DemoCastDrawer';
import { DemoCommentsDrawer } from '../interactive/engagement/DemoCommentsDrawer';
import { DemoEpisodesDrawer, type EpisodeInfo } from '../interactive/engagement/DemoEpisodesDrawer';
import { DemoEngagementPanel } from '../interactive/engagement/DemoEngagementPanel';
import { DemoTopBar } from '../interactive/engagement/DemoTopBar';
import type { DemoCharacterPreview } from '../interactive/types/demo';

const DEMO3_COVER_URL = new URL('../../assets/Demo3-cover.jpg', import.meta.url).href;
const ADRIAN_VALE_AVATAR_URL = new URL('../../assets/Adrian_Vale.jpg', import.meta.url).href;
const ELYSIA_AVATAR_URL = new URL('../../assets/Elysia.jpg', import.meta.url).href;
const DEMO3_PROMPT_COUNTDOWN_SECONDS = 20;
const DEMO3_PROMPT_TICK_MS = 100;

/** ~10s input clips: loop only while the 20s countdown still has time left (`countdownLeft > 0`). */
function isDemo3InputCountdownLoopClip(filename: string): boolean {
  return (
    filename === 'ep_2.mp4' ||
    filename === 'ep4_2.mp4' ||
    filename === 'ep_4_2.mp4' ||
    filename === 'ep_4_4.mp4' ||
    filename === 'ep_4_5.mp4'
  );
}

const DEMO_PROMPT_PLACEHOLDER_BY_ID: Record<number, string> = {
  2: 'Send override pattern...',
  3: DEMO3_INPUT_PLACEHOLDER,
};

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Branch chosen at ep_2 input — used for double-buffered transition (queue head = next clip while still on ep_2). */
function getEp2BranchPlan(emotionType: 1 | 2 | 3 | 4 | 5): { head: string; tail: string[] } {
  if (emotionType === 5) return { head: 'ep_4_1.mp4', tail: ['ep4_2.mp4'] };
  if (emotionType === 4) return { head: 'ep_4_3.mp4', tail: ['ep_4_4.mp4'] };
  if (emotionType === 1) return { head: 'ep_3_1.mp4', tail: ['ep_5.mp4', 'ep_last.mp4'] };
  if (emotionType === 2) return { head: 'ep_3_2.mp4', tail: ['ep_5.mp4', 'ep_last.mp4'] };
  return { head: 'ep_3_3.mp4', tail: ['ep_5.mp4', 'ep_last.mp4'] };
}

function waitUntilDemo3VideoHasCurrentData(video: HTMLVideoElement | null, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (!video) {
      resolve();
      return;
    }
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      resolve();
      return;
    }
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
}

type Demo3InputComposerProps = {
  value: string;
  inputPlaceholder: string;
  isVoiceInputActive: boolean;
  isSubmitting: boolean;
  onValueChange: (nextValue: string) => void;
  onSubmit: () => void;
  onVoiceInputStart: () => void;
  onVoiceInputEnd: () => void;
};

function Demo3InputComposer({
  value,
  inputPlaceholder,
  isVoiceInputActive,
  isSubmitting,
  onValueChange,
  onSubmit,
  onVoiceInputStart,
  onVoiceInputEnd,
}: Demo3InputComposerProps) {
  const hasTypedText = value.trim().length > 0;

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;
    event.preventDefault();
    if (isSubmitting) return;
    onSubmit();
  };

  const handleButtonClick = () => {
    if (isSubmitting || !hasTypedText) return;
    onSubmit();
  };

  const handleButtonPointerDown = () => {
    if (isSubmitting || hasTypedText) return;
    onVoiceInputStart();
  };

  const handleButtonPointerUp = () => {
    if (hasTypedText) return;
    onVoiceInputEnd();
  };

  const handleButtonPointerLeave = () => {
    if (hasTypedText) return;
    onVoiceInputEnd();
  };

  // SiriWave instance ref
  const siriWaveContainerRef = useRef<HTMLDivElement>(null);
  const siriWaveInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (isVoiceInputActive && !hasTypedText && siriWaveContainerRef.current) {
      // Clear previous instance if exists
      if (siriWaveInstanceRef.current) {
        siriWaveInstanceRef.current.dispose();
      }
      
      // Initialize SiriWave 9 effect
      const containerWidth = siriWaveContainerRef.current.offsetWidth || 300;
      siriWaveInstanceRef.current = new SiriWave({
        container: siriWaveContainerRef.current,
        width: containerWidth,
        height: 80, // 增加高度给大振幅留空间
        style: 'ios9',
        speed: 0.05,
        amplitude: 1.6, // 调大振幅
        autostart: true,
      });
    } else {
      if (siriWaveInstanceRef.current) {
        siriWaveInstanceRef.current.stop();
        siriWaveInstanceRef.current.dispose();
        siriWaveInstanceRef.current = null;
      }
    }

    return () => {
      if (siriWaveInstanceRef.current) {
        siriWaveInstanceRef.current.dispose();
        siriWaveInstanceRef.current = null;
      }
    };
  }, [isVoiceInputActive, hasTypedText]);

  return (
    <div className="mx-auto w-full max-w-[560px] relative">
      <input
        type="text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder={inputPlaceholder}
        className={`w-full h-11 pl-4 pr-14 rounded-full transition-all duration-300 text-[13px] outline-none ${
          isVoiceInputActive && !hasTypedText 
            ? 'bg-transparent backdrop-blur-none shadow-none text-transparent caret-white/75 border border-transparent placeholder:text-transparent' 
            : 'bg-black/55 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.35)] text-white/90 border border-white/25 placeholder:text-white/60'
        }`}
      />
      <AnimatePresence>
        {isVoiceInputActive && !hasTypedText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-none absolute left-4 right-14 top-1/2 -translate-y-1/2 h-12 flex items-center justify-center overflow-hidden mix-blend-screen [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          >
            <div ref={siriWaveContainerRef} className="w-full flex items-center justify-center translate-y-[2px]" />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={handleButtonClick}
        onPointerDown={handleButtonPointerDown}
        onPointerUp={handleButtonPointerUp}
        onPointerCancel={handleButtonPointerUp}
        onPointerLeave={handleButtonPointerLeave}
        disabled={isSubmitting}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-8.5 w-8.5 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center ${
          hasTypedText
            ? 'bg-white text-black hover:bg-white/90'
            : `text-white ${
                isVoiceInputActive
                  ? 'bg-white/20 hover:bg-white/25 border border-white/40'
                  : 'bg-white/10 hover:bg-white/15 border border-white/25'
              }`
        }`}
        aria-label={hasTypedText ? 'Submit text reply' : 'Hold for voice input demo'}
      >
        <Mic className={`w-4 h-4 ${hasTypedText ? 'hidden' : 'block'}`} />
        <SendHorizontal className={`w-4 h-4 ${hasTypedText ? 'block' : 'hidden'}`} />
      </button>
    </div>
  );
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
  4: [
    { id: 1, name: 'Liam', handle: '@liam.drifter', text: 'When she shifted from that icy, defensive look to the warm, glowing one after I comforted her... wow.', likes: '2.5K', time: '1h' },
    { id: 2, name: 'Chloe', handle: '@chloe.tech', text: 'It\'s so fascinating! Every time I made her laugh, her hair and eyes changed completely. It feels so personal.', likes: '1.1K', time: '3h' },
    { id: 3, name: 'Jax', handle: '@jax_hunter', text: 'I accidentally made her sad and her form turned so fragile and blue. I immediately apologized to make her smile again!', likes: '845', time: '4h' },
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
      name: 'Adrian Vale',
      role: 'Crewed Spacecraft Systems Maintenance Specialist, 34',
      summary:
        'Mature, restrained, and relentlessly reliable under extreme pressure. He fixes what breaks instead of performing emotion, stays fiercely loyal to the few people who matter, and remembers practical daily details over empty lines. When emotion spikes, his speech turns short with pauses, self-interruptions, and repeated words. His deepest fear is not death, but being seen by someone important at his most out-of-control and helpless.',
      unlocked: true,
      avatar: ADRIAN_VALE_AVATAR_URL,
    },
    {
      id: 2,
      name: 'Unknown Contact',
      role: 'Locked Character',
      summary: 'Classified profile. This cast slot will unlock as the story introduces new characters.',
      unlocked: false,
    },
  ],
  4: [
    {
      id: 1,
      name: 'Elysia',
      role: 'The Emotion Shifter',
      summary:
        'Elysia bears a beautiful but vulnerable gift: her physical appearance completely transforms to match her dominant emotion. When she is anxious, she takes on a guarded, cold form; when joyful, she radiates a warm, captivating presence. Because she cannot hide how she feels, she is deeply afraid of getting hurt. By talking to her and truly understanding her feelings, you can witness the breathtaking spectrum of her forms and eventually earn the appearance she only shows to someone she loves.',
      unlocked: true,
      avatar: ELYSIA_AVATAR_URL,
    },
    {
      id: 2,
      name: 'The Unguarded Self',
      role: 'Locked Form',
      summary: 'Keep building an emotional connection to unlock the form she hides from the rest of the world.',
      unlocked: false,
    },
  ],
};

const MOCK_EPISODES: EpisodeInfo[] = [
  { id: 1, title: 'Escaping a dangerous world', duration: '0:45', status: 'unlocked', thumbnailUrl: DEMO3_COVER_URL },
  { id: 2, title: 'Saving someone under pressure', duration: '1:12', status: 'playing' },
  { id: 3, title: 'Emotionally responding', duration: '2:05', status: 'locked' },
  { id: 4, title: 'The final confrontation', duration: '1:50', status: 'locked' },
  { id: 5, title: 'Aftermath', duration: '0:30', status: 'locked' },
];

export function LegacyDemoScreen({
  demo,
  onBackHome,
  isActive = true,
  shouldRestoreMountedMedia = false,
}: {
  demo: LegacyDemo;
  onBackHome?: () => void;
  isActive?: boolean;
  shouldRestoreMountedMedia?: boolean;
}) {
  const { push: pushDebug } = useDemoDebug();
  const { baseUrl: generateApiBaseUrl } = useApiEnv();
  const prevDemo3ClipRef = useRef<string | null>(null);
  const isDemo3 = demo.id === 3;
  const [isLiked, setIsLiked] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);
  const [isEpisodesOpen, setIsEpisodesOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const demo3Video0Ref = useRef<HTMLVideoElement>(null);
  const demo3Video1Ref = useRef<HTMLVideoElement>(null);
  const demo3PlaySigRef = useRef('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  const hasActivatedOnceRef = useRef(isActive || shouldRestoreMountedMedia);
  if (isActive) hasActivatedOnceRef.current = true;
  const feedPrefetchAbortSignal = useFeedPrefetchAbortSignal();

  const [activeVideoIndex, setActiveVideoIndex] = useState(() => {
    const start = demo.startIndex ?? 1;
    return Math.max(0, start - 1);
  });

  const playlist = demo.videos?.length ? demo.videos : demo.videoBg ? [demo.videoBg] : [];
  const [resolvedMediaMap, setResolvedMediaMap] = useState<Record<string, string>>({});
  const [isLegacyVideoReady, setIsLegacyVideoReady] = useState(false);

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
    demo3UrlByFilename[filename.replace('ep4_5.mp4', 'ep_4_5.mp4')] ??
    undefined;

  const [demo3CurrentFilename, setDemo3CurrentFilename] = useState('index_1.mp4');
  const [demo3Queue, setDemo3Queue] = useState<string[]>(['ep_2.mp4']);
  const [demo3CountdownLeft, setDemo3CountdownLeft] = useState(DEMO3_PROMPT_COUNTDOWN_SECONDS);
  const [demo3InputValue, setDemo3InputValue] = useState('');
  const [demo3VoiceInputActive, setDemo3VoiceInputActive] = useState(false);
  const [demo3VoiceInputSubmitting, setDemo3VoiceInputSubmitting] = useState(false);
  const [demo3VoicePermissionChecking, setDemo3VoicePermissionChecking] = useState(false);
  const demo3GenerateAbortRef = useRef<AbortController | null>(null);
  const [isDemo3Generating, setIsDemo3Generating] = useState(false);
  const [demo3PromptActive, setDemo3PromptActive] = useState(false);
  const [demo3CountdownActive, setDemo3CountdownActive] = useState(false);
  const [demo3HighEmotionHits, setDemo3HighEmotionHits] = useState(0); // count of emotion_type 4/5 hits (cap at 2)
  const [demo3ShowReplay, setDemo3ShowReplay] = useState(false);
  const [legacyShowReplay, setLegacyShowReplay] = useState(false);
  const legacyReplayPendingRef = useRef(false);
  const [demo3Lead, setDemo3Lead] = useState<0 | 1>(0);
  const demo3LeadRef = useRef(demo3Lead);
  useEffect(() => {
    demo3LeadRef.current = demo3Lead;
  }, [demo3Lead]);
  const [demo3SlotSrc, setDemo3SlotSrc] = useState<[string, string]>(['', '']);
  const [demo3IsLoading, setDemo3IsLoading] = useState(false);
  const demo3ReplayTokenRef = useRef(0);
  /** Abort index_1/ep_2 resolve+warmup started by replay-from-start when user leaves the demo. */
  const demo3ReplayLoadAbortRef = useRef<AbortController | null>(null);
  /** Demo3 graph prefetch: abort only when leaving the demo (not on every branch/queue change). */
  const demo3MediaPrefetchAbortRef = useRef<AbortController | null>(null);
  /** Bumped each time this Legacy screen becomes the active feed demo; stale prefetch waves ignore putResolved. */
  const demo3PrefetchSessionRef = useRef(0);
  const [demo3IsCoverVisible, setDemo3IsCoverVisible] = useState(true);
  const demo3LastUserReplyRef = useRef('');
  const demo3LastEmotionTypeRef = useRef<1 | 2 | 3 | 4 | 5>(5);
  const demo3TurnHistoryRef = useRef<Demo3TurnRecord[]>([]);
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
  const demo3InputValueRef = useRef(demo3InputValue);
  const demo3VoiceInputActiveRef = useRef(demo3VoiceInputActive);
  const demo3VoiceCaptureAbortRef = useRef<AbortController | null>(null);
  const demo3VoiceStreamRef = useRef<MediaStream | null>(null);
  const demo3VoiceAudioCtxRef = useRef<AudioContext | null>(null);
  const demo3VoiceProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const demo3VoiceChunksRef = useRef<Float32Array[]>([]);
  const demo3VoiceSampleRateRef = useRef<number>(48000);
  const demo3VoicePointerDownRef = useRef(false);
  const demo3CountdownLeftRef = useRef(demo3CountdownLeft);

  useEffect(() => {
    demo3ClipRef.current = demo3CurrentFilename;
  }, [demo3CurrentFilename]);
  useEffect(() => {
    demo3PromptActiveRef.current = demo3PromptActive;
  }, [demo3PromptActive]);
  useEffect(() => {
    demo3CountdownLeftRef.current = demo3CountdownLeft;
  }, [demo3CountdownLeft]);
  useEffect(() => {
    demo3InputValueRef.current = demo3InputValue;
  }, [demo3InputValue]);
  useEffect(() => {
    demo3VoiceInputActiveRef.current = demo3VoiceInputActive;
  }, [demo3VoiceInputActive]);

  const ensureMicPermission = useCallback(async () => {
    // If Permissions API exists and already granted, skip prompting.
    try {
      const perms: any = (navigator as any).permissions;
      if (perms?.query) {
        const status = await perms.query({ name: 'microphone' as any });
        if (status?.state === 'granted') return true;
      }
    } catch {
      // ignore
    }

    const navAny = navigator as any;
    const getUserMedia: undefined | ((c: MediaStreamConstraints) => Promise<MediaStream>) =
      navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ?? navAny.getUserMedia?.bind(navigator);

    if (!getUserMedia) {
      const secureHint =
        typeof window !== 'undefined' && window.location
          ? `Current origin: ${window.location.origin} (need https or http://localhost)`
          : 'Need https or http://localhost';
      throw new Error(`getUserMedia is unavailable. ${secureHint}`);
    }

    // Prompt permission by requesting audio once, then immediately stop.
    const s = await getUserMedia({ audio: true });
    for (const t of s.getTracks()) t.stop();
    return true;
  }, []);

  const stopDemo3VoiceCapture = useCallback(async () => {
    const proc = demo3VoiceProcessorRef.current;
    if (proc) {
      try {
        proc.disconnect();
      } catch {
        // ignore
      }
    }
    demo3VoiceProcessorRef.current = null;

    const ctx = demo3VoiceAudioCtxRef.current;
    demo3VoiceAudioCtxRef.current = null;
    if (ctx) {
      try {
        await ctx.close();
      } catch {
        // ignore
      }
    }

    const stream = demo3VoiceStreamRef.current;
    demo3VoiceStreamRef.current = null;
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      demo3VoiceCaptureAbortRef.current?.abort();
      demo3VoiceCaptureAbortRef.current = null;
      void stopDemo3VoiceCapture();
    };
  }, [stopDemo3VoiceCapture]);

  const activeDirectSrc = isDemo3
    ? getDemo3ClipUrl(demo3CurrentFilename)
    : playlist[activeVideoIndex] ?? playlist[0] ?? undefined;
  const activeSrc = activeDirectSrc ? (resolvedMediaMap[activeDirectSrc] ?? activeDirectSrc) : undefined;
  const shouldKeepMediaMounted = isActive || hasActivatedOnceRef.current;
  const demoPromptPlaceholder = DEMO_PROMPT_PLACEHOLDER_BY_ID[demo.id] ?? 'Type your reply...';
  const demo3CountdownProgress = Math.max(
    0,
    Math.min(1, demo3CountdownLeft / DEMO3_PROMPT_COUNTDOWN_SECONDS)
  );
  const demo3CountdownSecondsLeft = Math.max(0, Math.ceil(demo3CountdownLeft));
  const demo3CountdownHue = Math.max(0, Math.min(120, demo3CountdownProgress * 120));
  const demo3CountdownColor = `hsl(${demo3CountdownHue} 95% 55%)`;
  const demo3CountdownColorSoft = `hsla(${demo3CountdownHue} 95% 65% / 0.85)`;
  /** 仅在 20s 倒计时仍有剩余时间时循环；与 `onEnded` 中的守门逻辑一致，避免误切 queue。 */
  const demo3LoopInputClipDuringCountdown =
    demo3PromptActive &&
    demo3CountdownActive &&
    demo3CountdownLeft > 0 &&
    isDemo3InputCountdownLoopClip(demo3CurrentFilename);

  const comments = MOCK_COMMENTS_BY_DEMO[demo.id] ?? [];
  const characters = CHARACTERS_BY_DEMO[demo.id] ?? [];
  const pauseAllMedia = useCallback(() => {
    videoRef.current?.pause();
    demo3Video0Ref.current?.pause();
    demo3Video1Ref.current?.pause();
    audioRef.current?.pause();
    demo3NarrationAudioRef.current?.pause();
  }, []);

  const flushDemo3VoiceCapture = useCallback(async () => {
    demo3VoiceCaptureAbortRef.current?.abort();
    demo3VoiceCaptureAbortRef.current = null;
    demo3VoiceChunksRef.current = [];
    await stopDemo3VoiceCapture();
    setDemo3VoiceInputActive(false);
    setDemo3VoiceInputSubmitting(false);
  }, [stopDemo3VoiceCapture]);
  const resumeAuxiliaryAudio = useCallback(() => {
    if (!isActiveRef.current) return;
    if (isDemo3 && demo3CurrentFilename === 'ep_last.mp4') return;
    const bgm = audioRef.current;
    if (bgm && demo.bgmUrl) {
      bgm.muted = false;
      bgm.volume = 0.25;
      void bgm.play().catch(() => undefined);
    }
  }, [demo.bgmUrl, isDemo3, demo3CurrentFilename]);
  const getActiveVideo = () => {
    if (isDemo3) {
      return demo3Lead === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;
    }
    return videoRef.current;
  };
  const {
    isFullscreen,
    isVideoPaused,
    isPausedByUser,
    handleToggleFullscreen,
    handleVideoSurfaceClick,
    handleVideoSurfacePointerDown,
    handleVideoSurfacePointerEnd,
    handleResumePlayback,
    setIsPausedByUser,
  } = usePlayerShell({
    isActive,
    getActiveVideo,
    bindingKey: isDemo3
      ? `${demo3Lead}:${demo3CurrentFilename}:${demo3SlotSrc[0]}:${demo3SlotSrc[1]}`
      : `${activeVideoIndex}:${activeSrc ?? ''}`,
    canTogglePause: () =>
      !isCommentsOpen &&
      !isCharactersOpen &&
      !(isDemo3 && (demo3PromptActive || demo3ShowReplay || demo3CountdownActive || demo3CurrentFilename === 'ep_last.mp4')) &&
      !(!isDemo3 && legacyShowReplay),
    onInactivePauseAll: pauseAllMedia,
    resetUserPausedWhenInactive: true,
    onBeforePause: pauseAllMedia,
    onAfterResume: resumeAuxiliaryAudio,
  });
  const shouldHideNonInteractiveUi = isFullscreen || (isDemo3 && demo3PromptActive);

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
    const loadSignal = feedPrefetchAbortSignal
      ? mergeAbortSignals([controller.signal, feedPrefetchAbortSignal])
      : controller.signal;
    const putResolved = (direct: string, resolved: string) => {
      if (!direct || !resolved || direct === resolved) return;
      setResolvedMediaMap((prev) => (prev[direct] === resolved ? prev : { ...prev, [direct]: resolved }));
    };

    void (async () => {
      if (demo.bgmUrl) {
        const bgmResolved = await resolveCachedMediaUrl(demo.bgmUrl, {
          kind: 'audio',
          signal: loadSignal,
        });
        putResolved(demo.bgmUrl, bgmResolved);
      }
    })();

    return () => controller.abort();
  }, [isActive, isDemo3, demo.bgmUrl, playlist, feedPrefetchAbortSignal]); // playlist change reflects new URLs

  useEffect(() => {
    if (isDemo3) return;
    const video = videoRef.current;
    if (!video) return;
    if (isActive && !isPausedByUser && !legacyShowReplay && !legacyReplayPendingRef.current) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isActive, isDemo3, isPausedByUser, legacyShowReplay]);

  useEffect(() => {
    if (!isDemo3) return;
    const v0 = demo3Video0Ref.current;
    const v1 = demo3Video1Ref.current;
    if (!v0 || !v1) return;
    if (!isActive || demo3ShowReplay) {
      v0.pause();
      v1.pause();
      return;
    }
    if (isPausedByUser) return;
    const lead = demo3Lead;
    const active = lead === 0 ? v0 : v1;
    const other = lead === 0 ? v1 : v0;
    other.pause();
    const shouldMuteActiveVideo = !demo.playVideoAudio || demo3CurrentFilename === 'ep_last.mp4';
    active.muted = shouldMuteActiveVideo;
    active.volume = shouldMuteActiveVideo ? 0 : 1;
    const url = demo3SlotSrc[lead];
    if (!url) return;
    const sig = `${lead}|${demo3CurrentFilename}`;
    const jumped = demo3PlaySigRef.current !== sig;
    demo3PlaySigRef.current = sig;
    if (jumped) {
      try {
        const t = Number(active.currentTime);
        const rs = active.readyState;
        // Skip redundant seek-to-0 (causes one-frame black) when the slot was already warmed at t≈0 (ep_2 → branch flip).
        if (!Number.isFinite(t) || t > 0.25 || rs < HTMLMediaElement.HAVE_CURRENT_DATA) {
          active.currentTime = 0;
        }
      } catch {
        active.currentTime = 0;
      }
    }
    void active.play().catch(() => undefined);
  }, [isDemo3, isActive, isPausedByUser, demo3ShowReplay, demo3Lead, demo3CurrentFilename, demo3SlotSrc, demo.playVideoAudio]);

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

    if (isPausedByUser) {
      audio.pause();
      return;
    }

    // Demo3 ep_last: pause BGM so narration can be heard clearly.
    if (isDemo3 && demo3CurrentFilename === 'ep_last.mp4') {
      audio.pause();
      return;
    }

    let settled = false;
    let retryTimer: number | null = null;
    let retryCount = 0;
    const tryStart = () => {
      if (!isActiveRef.current) return;
      if (isPausedByUser) return;
      if (settled) return;
      audio.muted = false;
      audio.volume = 0.25;
      void audio
        .play()
        .then(() => {
          settled = true;
          if (retryTimer) {
            window.clearTimeout(retryTimer);
            retryTimer = null;
          }
        })
        .catch(() => {
          if (settled || retryCount >= 6) return;
          retryCount += 1;
          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            tryStart();
          }, 220);
        });
    };

    tryStart();

    const retry = () => tryStart();
    audio.addEventListener('canplay', retry);
    audio.addEventListener('loadeddata', retry);
    document.addEventListener('pointerdown', retry, { capture: true });
    document.addEventListener('keydown', retry, { capture: true });
    return () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      audio.removeEventListener('canplay', retry);
      audio.removeEventListener('loadeddata', retry);
      document.removeEventListener('pointerdown', retry, { capture: true } as any);
      document.removeEventListener('keydown', retry, { capture: true } as any);
    };
  }, [isActive, isPausedByUser, demo.bgmUrl, bgmPlayableSrc, isDemo3, demo3CurrentFilename]);

  useEffect(() => {
    if (isActive) return;
    setIsCommentsOpen(false);
    setIsCharactersOpen(false);
    void flushDemo3VoiceCapture();
  }, [isActive]);

  useEffect(() => {
    if (isActive || isDemo3) return;
    const v = videoRef.current;
    if (!v) return;
    v.pause();
  }, [isActive, isDemo3]);

  useEffect(() => {
    if (isDemo3) return;
    const video = videoRef.current;
    if (!video || !activeSrc || !shouldKeepMediaMounted) {
      setIsLegacyVideoReady(false);
      return;
    }

    const syncReadyState = () => {
      setIsLegacyVideoReady(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
    };

    syncReadyState();
    video.addEventListener('loadeddata', syncReadyState);
    video.addEventListener('canplay', syncReadyState);
    video.addEventListener('waiting', syncReadyState);
    video.addEventListener('emptied', syncReadyState);

    return () => {
      video.removeEventListener('loadeddata', syncReadyState);
      video.removeEventListener('canplay', syncReadyState);
      video.removeEventListener('waiting', syncReadyState);
      video.removeEventListener('emptied', syncReadyState);
    };
  }, [isDemo3, activeSrc, shouldKeepMediaMounted]);

  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive || !demo3PromptActive || !demo3CountdownActive) {
      setDemo3CountdownLeft(DEMO3_PROMPT_COUNTDOWN_SECONDS);
      return;
    }

    const timer = window.setInterval(() => {
      setDemo3CountdownLeft((previous) => {
        if (demo3InputValueRef.current.trim().length > 0 || demo3VoiceInputActiveRef.current) return previous;
        if (previous <= 0) {
          window.clearInterval(timer);
          return 0;
        }
        const next = Math.max(0, Number((previous - DEMO3_PROMPT_TICK_MS / 1000).toFixed(1)));
        if (next <= 0) {
          window.clearInterval(timer);
        }
        return next;
      });
    }, DEMO3_PROMPT_TICK_MS);

    return () => window.clearInterval(timer);
  }, [isDemo3, isActive, demo3PromptActive, demo3CountdownActive]);

  // If prompt is shown and user doesn't submit before countdown ends, auto-submit current input.
  useEffect(() => {
    if (!isDemo3) return;
    if (!isActive) return;
    if (demo3ShowReplay) return;
    if (!demo3PromptActive) return;
    if (isDemo3Generating) return;

    if (!demo3CountdownActive) return;
    if (demo3CountdownLeft > 0) return;
    void submitDemo3Input();
  }, [
    isDemo3,
    isActive,
    demo3PromptActive,
    demo3CountdownActive,
    demo3CountdownLeft,
    isDemo3Generating,
    demo3ShowReplay,
  ]);

  useEffect(() => {
    if (!isDemo3 || !isActive) {
      demo3MediaPrefetchAbortRef.current?.abort();
      demo3MediaPrefetchAbortRef.current = null;
      return;
    }
    demo3PrefetchSessionRef.current += 1;
    demo3MediaPrefetchAbortRef.current = new AbortController();
    return () => {
      demo3MediaPrefetchAbortRef.current?.abort();
      demo3MediaPrefetchAbortRef.current = null;
    };
  }, [isDemo3, isActive]);

  // Prefetch current + reachable branch heads (Demo3 only). Does NOT abort when only clip/queue changes,
  // so quick ep_2 → branch transitions keep in-flight downloads; a new wave starts in parallel.
  useEffect(() => {
    if (!isDemo3 || !isActive) return;
    if (playlist.length === 0) return;

    const prefetchSessionAtStart = demo3PrefetchSessionRef.current;

    const putResolved = (direct: string, resolved: string) => {
      if (!isActiveRef.current || demo3PrefetchSessionRef.current !== prefetchSessionAtStart) return;
      if (!direct || !resolved || direct === resolved) return;
      setResolvedMediaMap((prev) => (prev[direct] === resolved ? prev : { ...prev, [direct]: resolved }));
    };

    const { warmupFilenames, backgroundFilenames } = getDemo3PrefetchStaged(demo3CurrentFilename, demo3Queue);

    const filenamesToDirect = (filenames: string[]) =>
      filenames.map((fn) => getDemo3ClipUrl(fn)).filter((u): u is string => Boolean(u));

    const dedupeUrlsPreserveOrder = (urls: string[]) => {
      const seen = new Set<string>();
      return urls.filter((u) => {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      });
    };

    void (async () => {
      if (!isActiveRef.current) return;
      const controller = demo3MediaPrefetchAbortRef.current;
      if (!controller || controller.signal.aborted) return;
      if (demo3PrefetchSessionRef.current !== prefetchSessionAtStart) return;
      const { signal } = controller;
      const loadSignal = feedPrefetchAbortSignal
        ? mergeAbortSignals([signal, feedPrefetchAbortSignal])
        : signal;
      if (loadSignal.aborted) return;

      const processResolve = async (direct: string) => {
        const resolved = await resolveCachedMediaUrl(direct, { kind: 'video', signal: loadSignal });
        putResolved(direct, resolved);
        return resolved;
      };

      const processWarmupResolved = async (resolved: string) => {
        await warmupVideoUrl(resolved, { signal: loadSignal, timeoutMs: 12000 });
      };

      const processResolveAndWarmup = async (direct: string) => {
        const resolved = await processResolve(direct);
        if (!loadSignal.aborted) {
          await processWarmupResolved(resolved);
        }
        return resolved;
      };

      try {
        const warmupDirect = dedupeUrlsPreserveOrder(filenamesToDirect(warmupFilenames));
        const backgroundDirect = dedupeUrlsPreserveOrder(filenamesToDirect(backgroundFilenames));

        // index_1：先完成 index_1 拉取 + 解码预热以便开播；随后在同一轮 Promise.all 内并行：
        // - ep_2（最先 push，优先级最高）
        // - ep_4_1、ep_4_3、ep_3_1、ep_3_2、ep_3_3（彼此并行，不对它们做顺序 await）
        const isIndex1PrefetchWave =
          demo3CurrentFilename === 'index_1.mp4' &&
          warmupFilenames[0] === 'index_1.mp4' &&
          warmupFilenames.length === 1 &&
          warmupDirect.length >= 1;

        if (isIndex1PrefetchWave && !loadSignal.aborted) {
          const rIndex = await processResolve(warmupDirect[0]);
          if (loadSignal.aborted) return;
          await processWarmupResolved(rIndex);
          if (loadSignal.aborted) return;

          const ep2Direct = getDemo3ClipUrl('ep_2.mp4');
          const parallelWave = dedupeUrlsPreserveOrder([
            ...(ep2Direct ? [ep2Direct] : []),
            ...backgroundDirect.filter((u) => u !== ep2Direct),
          ]);

          await Promise.allSettled(
            parallelWave.map((direct) => processResolveAndWarmup(direct)),
          );
        } else if (warmupDirect.length >= 1 && !loadSignal.aborted) {
          // 与 index_1 同一套：只预热当前播放片，再并行 resolve + 解码预热 queue[0] 与所有可达分支头。
          const rCur = await processResolve(warmupDirect[0]);
          if (loadSignal.aborted) return;
          await processWarmupResolved(rCur);
          if (loadSignal.aborted) return;
          if (backgroundDirect.length > 0) {
            await Promise.allSettled(
              backgroundDirect.map((direct) => processResolveAndWarmup(direct)),
            );
          }
        } else if (!loadSignal.aborted && backgroundDirect.length > 0) {
          await Promise.allSettled(
            backgroundDirect.map((direct) => processResolveAndWarmup(direct)),
          );
        }
      } catch {
        // ignore
      }
    })();
  }, [isDemo3, isActive, demo3CurrentFilename, demo3Queue, playlist, feedPrefetchAbortSignal]);

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

  const demo3StartPrompt = () => {
    setDemo3InputValue('');
    setDemo3VoiceInputActive(false);
    setDemo3PromptActive(true);
    setDemo3CountdownActive(true);
    setDemo3CountdownLeft(DEMO3_PROMPT_COUNTDOWN_SECONDS);
  };

  const demo3StopPrompt = () => {
    setDemo3PromptActive(false);
    setDemo3CountdownActive(false);
    setDemo3CountdownLeft(DEMO3_PROMPT_COUNTDOWN_SECONDS);
    setDemo3VoiceInputActive(false);
  };

  const demo3GoTo = (filename: string, queue: string[]) => {
    setDemo3CurrentFilename(filename);
    setDemo3Queue(queue);
  };

  /** ep_2 → branch: preload branch on the hidden slot (queue=[branch,...]) while filename stays ep_2, then flip lead. */
  const runEp2BranchTransition = useCallback(async (emotionType: 1 | 2 | 3 | 4 | 5) => {
    if (!isActiveRef.current) return;
    const plan = getEp2BranchPlan(emotionType);
    setDemo3IsCoverVisible(true);
    flushSync(() => {
      setDemo3Queue([plan.head, ...plan.tail]);
    });
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const lead = demo3LeadRef.current;
    const inactiveIdx: 0 | 1 = lead === 0 ? 1 : 0;
    const inactiveEl = inactiveIdx === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;
    await waitUntilDemo3VideoHasCurrentData(inactiveEl, 5200);
    if (!isActiveRef.current) return;
    flushSync(() => {
      setDemo3Lead(inactiveIdx);
      setDemo3CurrentFilename(plan.head);
      setDemo3Queue(plan.tail);
    });
    const newActiveEl = inactiveIdx === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;
    if (newActiveEl && typeof newActiveEl.requestVideoFrameCallback === 'function') {
      await new Promise<void>((resolve) => {
        newActiveEl.requestVideoFrameCallback(() => resolve());
      });
    } else {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    }
  }, []);

  const applyEmotionBranch = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    const plan = getEp2BranchPlan(emotionType);
    demo3GoTo(plan.head, plan.tail);
  };

  const applyEmotionAfterEp44 = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    // Second input point (after first emotion_type=4 -> ep_4_3 -> ep_4_4).
    // - 1/2/3 => A/B/C lines (ep_3_x -> ep_5)
    // - 4 => D line: ep_3-4 (playback) then ep_4_5 (20s input gate)
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
      demo3GoTo('ep_3-4.mp4', ['ep_4_5.mp4']);
      return;
    }
    demo3GoTo('ep_3_6.mp4', []);
  };

  const applyEmotionAfterEp34 = (emotionType: 1 | 2 | 3 | 4 | 5) => {
    // Third input point on ep_4_5 (after ep_3-4 playback).
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
        demo3GoTo('ep_3-4.mp4', ['ep_4_5.mp4']);
        return;
      }
      demo3GoTo('ep_3_6.mp4', []);
      return;
    }
    if (clip === 'ep_4_5.mp4') {
      applyEmotionAfterEp34(emotionType);
      return;
    }
    if (clip === 'ep_2.mp4') {
      void runEp2BranchTransition(emotionType);
      return;
    }
    if (clip === 'ep_4_4.mp4') {
      applyEmotionAfterEp44(emotionType);
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

  useEffect(() => {
    if (isActive || !isDemo3) return;
    demo3ReplayLoadAbortRef.current?.abort();
    demo3ReplayLoadAbortRef.current = null;
    demo3GenerateAbortRef.current?.abort();
    demo3GenerateAbortRef.current = null;
    setIsDemo3Generating(false);
    demo3NarrationAbortRef.current?.abort();
    demo3NarrationAbortRef.current = null;
    flushDemo3NarrationAudioElement();
    const v0 = demo3Video0Ref.current;
    const v1 = demo3Video1Ref.current;
    if (v0) {
      v0.pause();
    }
    if (v1) {
      v1.pause();
    }
  }, [isActive, isDemo3, flushDemo3NarrationAudioElement]);

  useEffect(() => {
    if (!isDemo3 || !isActive) return;
    const activeVideo = demo3Lead === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;
    const activeSource = demo3SlotSrc[demo3Lead];
    if (!activeSource || !activeVideo) {
      setDemo3IsCoverVisible(true);
      return;
    }
    if (activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setDemo3IsCoverVisible(true);
    }
  }, [isDemo3, isActive, demo3Lead, demo3SlotSrc]);

  const handleDemo3ReplayFromStart = () => {
    demo3GenerateAbortRef.current?.abort();
    demo3GenerateAbortRef.current = null;
    setIsDemo3Generating(false);
    setDemo3ShowReplay(false);
    setDemo3PromptActive(false);
    setDemo3CountdownActive(false);
    setDemo3CountdownLeft(DEMO3_PROMPT_COUNTDOWN_SECONDS);
    setDemo3InputValue('');
    setDemo3VoiceInputActive(false);
    setDemo3HighEmotionHits(0);
    demo3LastUserReplyRef.current = '';
    demo3LastEmotionTypeRef.current = 5;
    demo3TurnHistoryRef.current = [];
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
    demo3ReplayLoadAbortRef.current?.abort();
    const controller = new AbortController();
    demo3ReplayLoadAbortRef.current = controller;
    const replayLoadSignal = feedPrefetchAbortSignal
      ? mergeAbortSignals([controller.signal, feedPrefetchAbortSignal])
      : controller.signal;

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

        const indexResolved = await resolveCachedMediaUrl(indexDirect, { kind: 'video', signal: replayLoadSignal });
        if (token !== demo3ReplayTokenRef.current) return;
        // Warm up decoder so first frame is ready ASAP.
        await warmupVideoUrl(indexResolved, { signal: replayLoadSignal, timeoutMs: 12000 });
        if (token !== demo3ReplayTokenRef.current) return;

        const ep2Resolved = ep2Direct
          ? await resolveCachedMediaUrl(ep2Direct, { kind: 'video', signal: replayLoadSignal })
          : '';
        if (token !== demo3ReplayTokenRef.current) return;
        if (ep2Resolved) await warmupVideoUrl(ep2Resolved, { signal: replayLoadSignal, timeoutMs: 12000 });
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
          const shouldMute = !demo.playVideoAudio || demo3CurrentFilename === 'ep_last.mp4';
          v0.muted = shouldMute;
          v0.volume = shouldMute ? 0 : 1;
          void v0.play().catch(() => undefined);
        }
      } catch {
        // ignore
      } finally {
        if (demo3ReplayLoadAbortRef.current === controller) {
          demo3ReplayLoadAbortRef.current = null;
        }
        if (token === demo3ReplayTokenRef.current) setDemo3IsLoading(false);
      }
    })();
  };

  /** 用 `/api/v1/generate` 得到 emotion_type 再走分支（文字提交与语音 ASR 转写后共用）。 */
  async function finalizeDemo3ReplyAndBranch(trimmed: string, inputMode: 'text' | 'voice') {
    let emotionType: 1 | 2 | 3 | 4 | 5 = 5;
    let resultSummary = '';
    demo3LastUserReplyRef.current = trimmed;
    const clipAtStart = demo3ClipRef.current;

    if (trimmed) {
      const generatePayload = buildDemo3GeneratePrompt(trimmed, clipAtStart);
      pushDebug({
        kind: 'api_request',
        title: 'POST /api/v1/generate (Demo3)',
        body: `${safeJson({ text: generatePayload, viewerReply: trimmed, clip: clipAtStart, inputMode })}`,
      });
      demo3GenerateAbortRef.current?.abort();
      const controller = new AbortController();
      demo3GenerateAbortRef.current = controller;
      setIsDemo3Generating(true);
      try {
        const result = await generateText(
          { text: generatePayload },
          { signal: controller.signal, baseUrl: generateApiBaseUrl }
        );
        emotionType = extractEmotionType(result) ?? 5;
        demo3LastEmotionTypeRef.current = emotionType;
        resultSummary = safeJson(result);
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
        body:
          inputMode === 'voice'
            ? 'Empty ASR — no HTTP call. emotion_type defaults to 5.'
            : 'Empty input — no HTTP call. emotion_type defaults to 5.',
      });
    }

    if (trimmed) {
      const history = demo3TurnHistoryRef.current;
      history.push({
        turn: history.length + 1,
        clip: clipAtStart,
        inputMode,
        userInput: trimmed,
        emotionType,
        resultSummary: resultSummary ? resultSummary.slice(0, 1400) : undefined,
      });
    }

    const isHighEmotion = emotionType === 4 || emotionType === 5;
    if (isHighEmotion) setDemo3HighEmotionHits((h) => h + 1);

    demo3StopPrompt();
    const clip = demo3ClipRef.current;
    if (clip === 'ep_2.mp4') {
      await runEp2BranchTransition(emotionType);
      return;
    }
    applyDemo3EmotionAtCurrentClip(clip, emotionType);
  }

  const submitDemo3Input = async () => {
    if (!demo3PromptActive) return;
    await finalizeDemo3ReplyAndBranch(demo3InputValue.trim(), 'text');
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
          body: '当前没有打开的输入框（需在 ep_2 / ep4_2 / ep_4_4 / ep_4_5 等输入点）。',
        });
        return;
      }
      const reply = typeof ce.detail?.fixedReply === 'string' ? ce.detail.fixedReply : DEMO3_FIXED_TEST_REPLY;
      demo3LastUserReplyRef.current = reply;
      setDemo3InputValue(reply);
      demo3LastEmotionTypeRef.current = emotionType;
      const history = demo3TurnHistoryRef.current;
      history.push({
        turn: history.length + 1,
        clip: demo3ClipRef.current,
        inputMode: 'debug',
        userInput: reply,
        emotionType,
        resultSummary: 'debug inject',
      });
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

    const sig = `${demo3ReplayTokenRef.current}|${demo3LastUserReplyRef.current}|${demo3LastEmotionTypeRef.current}`;
    if (demo3NarrationSigRef.current === sig) return;
    demo3NarrationSigRef.current = sig;

    demo3NarrationAbortRef.current?.abort();
    const controller = new AbortController();
    demo3NarrationAbortRef.current = controller;
    setDemo3NarrationLoading(true);
    setDemo3NarrationError(null);

    void (async () => {
      try {
        const prompt = buildDemo3FinalTtsPrompt({
          emotionType: demo3LastEmotionTypeRef.current,
          callbackPhrase: demo3LastUserReplyRef.current,
          history: demo3TurnHistoryRef.current,
        });
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
          body: `【旁白词】\n${text}`,
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
        const { blob } = await postPromptTts(cloneBody, {
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
          body: `audio/mpeg blob: ${blob.size} bytes\n\n【语音链接】（本页可播放的 blob）\n${url}\n\n【旁白词】\n${text}`,
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
      demo3StartPrompt();
      return;
    }

    if (demo3CurrentFilename === 'ep4_2.mp4') {
      demo3StartPrompt();
      return;
    }

    if (demo3CurrentFilename === 'ep_4_4.mp4') {
      demo3StartPrompt();
      return;
    }

    if (demo3CurrentFilename === 'ep_4_5.mp4') {
      demo3StartPrompt();
      return;
    }

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

  useEffect(() => {
    if (!isDemo3 || !isActive) return;
    const activeSlot = demo3Lead;
    const activeSource = demo3SlotSrc[activeSlot];
    if (!activeSource) return;

    const activeVideo = activeSlot === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;
    if (!activeVideo) return;

    let cancelled = false;
    const dismissCoverAfterPaint = () => {
      if (cancelled) return;
      if (activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const hide = () => {
        if (cancelled) return;
        setDemo3IsCoverVisible(false);
      };
      if (typeof activeVideo.requestVideoFrameCallback === 'function') {
        activeVideo.requestVideoFrameCallback(() => hide());
      } else {
        requestAnimationFrame(() => requestAnimationFrame(hide));
      }
    };

    // The clip may already be decodable when this Demo becomes active again,
    // so don't rely on a future loadeddata event only.
    dismissCoverAfterPaint();
    activeVideo.addEventListener('loadeddata', dismissCoverAfterPaint);
    activeVideo.addEventListener('canplay', dismissCoverAfterPaint);
    activeVideo.addEventListener('playing', dismissCoverAfterPaint);

    return () => {
      cancelled = true;
      activeVideo.removeEventListener('loadeddata', dismissCoverAfterPaint);
      activeVideo.removeEventListener('canplay', dismissCoverAfterPaint);
      activeVideo.removeEventListener('playing', dismissCoverAfterPaint);
    };
  }, [isDemo3, isActive, demo3Lead, demo3SlotSrc]);

  const handleDemo3VideoEnded = (e: SyntheticEvent<HTMLVideoElement>) => {
    const leadEl = demo3Lead === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;
    if (e.currentTarget !== leadEl) return;

    const clip = demo3CurrentFilename;
    if (
      isDemo3InputCountdownLoopClip(clip) &&
      demo3PromptActiveRef.current &&
      demo3CountdownLeftRef.current > 0
    ) {
      const v = e.currentTarget;
      try {
        v.currentTime = 0;
      } catch {
        // ignore
      }
      void v.play().catch(() => undefined);
      return;
    }

    const next = demo3Queue[0];
    if (next) {
      const inactiveIdx = demo3Lead === 0 ? 1 : 0;
      const getInactiveEl = () =>
        inactiveIdx === 0 ? demo3Video0Ref.current : demo3Video1Ref.current;

      const proceed = () => {
        setDemo3IsCoverVisible(true);
        setDemo3Lead((l) => (l === 0 ? 1 : 0));
        setDemo3CurrentFilename(next);
        setDemo3Queue((q) => q.slice(1));
      };

      const tryProceedWhenReady = (inactiveEl: HTMLVideoElement) => {
        if (inactiveEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
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
        const tid = window.setTimeout(finish, 3200);
        inactiveEl.addEventListener('canplay', finish);
        inactiveEl.addEventListener('loadeddata', finish);
        inactiveEl.addEventListener('error', finish);
      };

      setDemo3IsCoverVisible(true);
      const inactiveEl = getInactiveEl();
      if (inactiveEl) {
        tryProceedWhenReady(inactiveEl);
        return;
      }
      window.setTimeout(() => {
        const el = getInactiveEl();
        if (!el) {
          proceed();
          return;
        }
        tryProceedWhenReady(el);
      }, 48);
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

  const queueLegacyReplayFromStart = useCallback(() => {
    videoRef.current?.pause();
    legacyReplayPendingRef.current = true;
    setLegacyShowReplay(false);
    setActiveVideoIndex(0);
  }, []);

  const handleLegacyReplayFromStart = () => {
    queueLegacyReplayFromStart();
  };

  useEffect(() => {
    if (isActive || isDemo3) return;
    if (!legacyShowReplay) return;
    queueLegacyReplayFromStart();
  }, [isActive, isDemo3, legacyShowReplay, queueLegacyReplayFromStart]);

  useEffect(() => {
    if (isDemo3) return;
    if (!legacyReplayPendingRef.current) return;
    if (legacyShowReplay) return;
    const video = videoRef.current;
    if (!video) return;

    const restart = () => {
      legacyReplayPendingRef.current = false;
      video.pause();
      video.playbackRate = 1;
      video.currentTime = 0;
      if (!isActiveRef.current) return;
      void video.play().catch(() => undefined);
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      restart();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('loadedmetadata', finish);
      video.removeEventListener('loadeddata', finish);
      video.removeEventListener('error', finish);
      window.clearTimeout(timeoutId);
      restart();
    };
    const timeoutId = window.setTimeout(finish, 1500);
    video.addEventListener('loadedmetadata', finish);
    video.addEventListener('loadeddata', finish);
    video.addEventListener('error', finish);
    return () => {
      video.removeEventListener('loadedmetadata', finish);
      video.removeEventListener('loadeddata', finish);
      video.removeEventListener('error', finish);
      window.clearTimeout(timeoutId);
    };
  }, [isDemo3, legacyShowReplay, activeVideoIndex, activeSrc]);

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      onClick={handleVideoSurfaceClick}
      onPointerDown={handleVideoSurfacePointerDown}
      onPointerUp={handleVideoSurfacePointerEnd}
      onPointerCancel={handleVideoSurfacePointerEnd}
      onPointerLeave={handleVideoSurfacePointerEnd}
    >
      <DemoTopBar
        onBackHome={onBackHome ?? (() => undefined)}
        hideChrome={shouldHideNonInteractiveUi}
        closeOnInactive={!isActive}
      />

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
            src={isActive ? (demo3NarrationAudioUrl ?? undefined) : undefined}
            preload="auto"
          />
        )}
        {isDemo3 ? (
          <>
            <video
              ref={demo3Video0Ref}
              src={shouldKeepMediaMounted ? demo3SlotSrc[0] || undefined : undefined}
              className={`absolute inset-0 w-full h-full object-cover ${
                demo3Lead === 0 ? 'opacity-85 z-[2]' : 'opacity-0 z-[1]'
              }`}
              autoPlay={false}
              loop={demo3CurrentFilename === 'ep_last.mp4' || demo3LoopInputClipDuringCountdown}
              muted={!demo.playVideoAudio || demo3CurrentFilename === 'ep_last.mp4'}
              playsInline
              preload={isActive ? 'auto' : shouldKeepMediaMounted ? 'metadata' : 'none'}
              onEnded={handleDemo3VideoEnded}
            />
            <video
              ref={demo3Video1Ref}
              src={shouldKeepMediaMounted ? demo3SlotSrc[1] || undefined : undefined}
              className={`absolute inset-0 w-full h-full object-cover ${
                demo3Lead === 1 ? 'opacity-85 z-[2]' : 'opacity-0 z-[1]'
              }`}
              autoPlay={false}
              loop={demo3CurrentFilename === 'ep_last.mp4' || demo3LoopInputClipDuringCountdown}
              muted={!demo.playVideoAudio || demo3CurrentFilename === 'ep_last.mp4'}
              playsInline
              preload={isActive ? 'auto' : shouldKeepMediaMounted ? 'metadata' : 'none'}
              onEnded={handleDemo3VideoEnded}
            />
          </>
        ) : (
          <video
            ref={videoRef}
            src={shouldKeepMediaMounted ? activeSrc : undefined}
            className="w-full h-full object-cover opacity-85"
            autoPlay={isActive}
            loop={false}
            muted={!demo.playVideoAudio}
            playsInline
            preload={isActive ? 'auto' : shouldKeepMediaMounted ? 'metadata' : 'none'}
            onEnded={() => {
              if (playlist.length <= 1) {
                setLegacyShowReplay(true);
                return;
              }
              setActiveVideoIndex((previous) => {
                const next = previous + 1;
                if (next >= playlist.length) {
                  setLegacyShowReplay(true);
                  return previous;
                }
                return next;
              });
            }}
          />
        )}
        {!isDemo3 && isActive && !isLegacyVideoReady && (
          <div className="absolute inset-0 z-[5] pointer-events-none">
            <div className="w-full h-full bg-black/38" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border border-white/20 border-t-white/85 animate-spin" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-white/80">Loading Demo</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {isDemo3 && demo3CurrentFilename === 'ep_last.mp4' && !demo3IsLoading && !demo3ShowReplay && (
        <div className="absolute left-0 right-0 bottom-[6.75rem] z-[75] px-4 pointer-events-none">
          <div className="mx-auto max-w-[520px] rounded-2xl border border-white/15 bg-black/55 backdrop-blur-xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.42)] pointer-events-auto flex flex-col gap-2">
            <div className="flex justify-end w-full">
              <button
                onClick={() => setDemo3ShowReplay(true)}
                className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors -mr-1"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {demo3NarrationLoading && (
              <p className="text-[11px] tracking-[0.14em] uppercase text-white/70">Generating narration…</p>
            )}
            {demo3NarrationError && !demo3NarrationLoading && (
              <p className="text-[12px] text-red-200/90">{demo3NarrationError}</p>
            )}
            {demo3NarrationText && (
              <div className="flex flex-col gap-4 w-full pb-1">
                <p className="text-[14px] leading-relaxed text-white/92 whitespace-pre-wrap">{demo3NarrationText}</p>
                <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5 w-full mt-1">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-white/90">Continue the Story</span>
                    <span className="text-[11px] text-white/50 mt-0.5">Chat directly with Astronaut</span>
                  </div>
                  <button
                    onClick={() => setIsCharactersOpen(true)}
                    className="text-[12px] font-medium text-black bg-white hover:bg-white/90 transition-colors px-3.5 py-1.5 rounded-full shadow-sm whitespace-nowrap"
                  >
                    Chat Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isDemo3 && demo3IsCoverVisible && (
        <div className="absolute inset-0 z-[12] pointer-events-none bg-black">
          <img src={DEMO3_COVER_URL} alt="Demo 3 cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/38" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full border border-white/20 border-t-white/85 animate-spin" />
            <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-white/80">Loading Demo</p>
          </div>
        </div>
      )}

      {isDemo3 && demo3CountdownActive && (
        <>
          <div className="absolute top-[3.25rem] left-0 right-0 z-[69] px-4 sm:px-5 pointer-events-none">
            <div className="w-full min-w-0 px-10 sm:px-12 md:px-14">
              <div className="rounded-full border border-white/15 bg-black/45 backdrop-blur-xl px-3 py-2 flex items-center gap-2 min-w-0">
                <Heart className="w-3.5 h-3.5 shrink-0" style={{ color: demo3CountdownColorSoft }} />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.25em] text-white/75 shrink-0">
                  Reply
                </span>
                <div className="flex-1 min-w-0">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden w-full">
                    <div
                      className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.35)] transition-all duration-100"
                      style={{
                        width: `${Math.max(6, demo3CountdownProgress * 100)}%`,
                        background: `linear-gradient(90deg, ${demo3CountdownColor}, ${demo3CountdownColorSoft})`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-white/80 tabular-nums shrink-0">
                  {demo3CountdownSecondsLeft}s
                </span>
              </div>
              <p className="mt-1.5 text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.16em] uppercase text-white/45 text-center leading-tight break-words px-2">
                Countdown pauses when text is present
              </p>
            </div>
          </div>
        </>
      )}

      {isDemo3 && demo3IsLoading && (
        <div className="absolute inset-0 z-[81] flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border border-white/20 border-t-white/80 animate-spin" />
        </div>
      )}

      {isDemo3 && demo3PromptActive && (
        <>
          {/* Bottom text input overlay */}
          <div
            data-ui-layer="true"
            className="absolute left-0 right-0 bottom-0 z-[80] px-4 pb-[7.125rem] pointer-events-auto"
          >
            <Demo3InputComposer
              value={demo3InputValue}
              inputPlaceholder={demoPromptPlaceholder}
              isVoiceInputActive={demo3VoiceInputActive}
              isSubmitting={isDemo3Generating || demo3VoiceInputSubmitting}
              onValueChange={(nextValue) => {
                setDemo3InputValue(nextValue);
                if (nextValue.trim().length > 0 && demo3VoiceInputActive) {
                  setDemo3VoiceInputActive(false);
                }
              }}
              onSubmit={() => {
                void submitDemo3Input();
              }}
              onVoiceInputStart={() => {
                if (demo3InputValue.trim().length > 0) return;
                if (demo3VoiceInputSubmitting) return;
                demo3VoicePointerDownRef.current = true;
                setDemo3VoiceInputActive(true);
                demo3VoiceChunksRef.current = [];
                demo3VoiceCaptureAbortRef.current?.abort();
                const controller = new AbortController();
                demo3VoiceCaptureAbortRef.current = controller;

                void (async () => {
                  try {
                    setDemo3VoicePermissionChecking(true);
                    await ensureMicPermission();
                    if (!demo3VoicePointerDownRef.current) {
                      setDemo3VoicePermissionChecking(false);
                      setDemo3VoiceInputActive(false);
                      return;
                    }
                    setDemo3VoicePermissionChecking(false);

                    const navAny = navigator as any;
                    const getUserMedia: undefined | ((c: MediaStreamConstraints) => Promise<MediaStream>) =
                      navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ??
                      navAny.getUserMedia?.bind(navigator);
                    if (!getUserMedia) {
                      const secureHint =
                        typeof window !== 'undefined' && window.location
                          ? `Current origin: ${window.location.origin} (need https or http://localhost)`
                          : 'Need https or http://localhost';
                      throw new Error(`getUserMedia is unavailable. ${secureHint}`);
                    }

                    const stream = await getUserMedia({ audio: true });
                    if (controller.signal.aborted) {
                      for (const t of stream.getTracks()) t.stop();
                      return;
                    }
                    demo3VoiceStreamRef.current = stream;

                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    demo3VoiceAudioCtxRef.current = ctx;
                    demo3VoiceSampleRateRef.current = ctx.sampleRate;

                    const source = ctx.createMediaStreamSource(stream);
                    const proc = ctx.createScriptProcessor(4096, 1, 1);
                    demo3VoiceProcessorRef.current = proc;
                    proc.onaudioprocess = (event) => {
                      if (!demo3VoiceInputActiveRef.current) return;
                      const ch = event.inputBuffer.getChannelData(0);
                      demo3VoiceChunksRef.current.push(new Float32Array(ch));
                    };
                    source.connect(proc);
                    proc.connect(ctx.destination);
                  } catch (e) {
                    setDemo3VoicePermissionChecking(false);
                    setDemo3VoiceInputActive(false);
                    pushDebug({
                      kind: 'api_error',
                      title: 'Voice capture start failed (Demo3)',
                      body: e instanceof Error ? e.message : safeJson(e),
                    });
                    await flushDemo3VoiceCapture();
                  }
                })();
              }}
              onVoiceInputEnd={() => {
                demo3VoicePointerDownRef.current = false;
                if (!demo3VoiceInputActiveRef.current) return;
                setDemo3VoiceInputActive(false);
                setDemo3VoiceInputSubmitting(true);
                demo3VoiceCaptureAbortRef.current?.abort();
                demo3VoiceCaptureAbortRef.current = null;

                void (async () => {
                  try {
                    const chunks = demo3VoiceChunksRef.current;
                    const inputRate = demo3VoiceSampleRateRef.current || 48000;
                    await stopDemo3VoiceCapture();

                    const pcm = concatFloat32(chunks);
                    if (pcm.length < inputRate * 0.25) {
                      throw new Error('Voice input too short');
                    }

                    const pcm16k = resampleMonoLinear(pcm, inputRate, 16000);
                    const wav = encodeWav16Mono(pcm16k, 16000);
                    // Ensure we pass a real ArrayBuffer (not SharedArrayBuffer typing).
                    const speechB64 = await arrayBufferToBase64(wav.buffer.slice(0) as ArrayBuffer);

                    const body = {
                      format: 'wav',
                      rate: 16000,
                      channel: 1,
                      cuid: 'naravo_web',
                      dev_pid: 1737,
                      speech: speechB64,
                      len: wav.byteLength,
                    };

                    pushDebug({
                      kind: 'api_request',
                      title: 'POST /api/v1/asr/voice-input-generate (Demo3)',
                      body: safeJson({ ...body, speech: `base64(${speechB64.length} chars)` }),
                    });

                    const res = await postAsrVoiceInputGenerate(body, { baseUrl: generateApiBaseUrl });
                    const asrText = extractAsrText(res) ?? '';
                    const trimmed = asrText.trim();

                    if (trimmed) {
                      setDemo3InputValue(asrText);
                    }

                    const asrAudioUrl = extractAsrAudioUrl(res);
                    pushDebug({
                      kind: 'api_response',
                      title: 'ASR voice-input-generate OK (Demo3)',
                      body: `【识别词】\n${asrText || '(空)'}\n\n【语音链接】\n${
                        asrAudioUrl ?? '（接口未返回常见音频 URL 字段；仅麦克风转写）'
                      }\n\n--- raw (trim) ---\n${safeJson(res).slice(0, 1600)}`,
                    });

                    if (!demo3PromptActiveRef.current) {
                      return;
                    }

                    // 与文字提交一致：仅用转写文本调 generate 得 emotion_type，再走分支（不再用 ASR 里的 emotion_type）。
                    await finalizeDemo3ReplyAndBranch(trimmed, 'voice');
                  } catch (e) {
                    pushDebug({
                      kind: 'api_error',
                      title: 'ASR voice-input-generate failed (Demo3)',
                      body: e instanceof Error ? e.message : safeJson(e),
                    });
                  } finally {
                    demo3VoiceChunksRef.current = [];
                    setDemo3VoiceInputSubmitting(false);
                  }
                })();
              }}
            />
          </div>
        </>
      )}

      <PlayerShellCenterOverlay
        showResumeButton={isVideoPaused && isPausedByUser && !demo3ShowReplay && !demo3PromptActive && !legacyShowReplay}
        onResume={() => {
          setIsPausedByUser(false);
          handleResumePlayback();
        }}
        showReplayButton={isDemo3 ? demo3ShowReplay : legacyShowReplay}
        replayLabel={isDemo3 ? 'Retry' : 'Replay'}
        onReplay={isDemo3 ? handleDemo3ReplayFromStart : handleLegacyReplayFromStart}
      />

      <div className="absolute inset-0 flex flex-col justify-end z-10 pb-[72px]">
        <div className="relative z-[120] p-4 w-full flex flex-col justify-end pointer-events-none">
          <div className="flex flex-col gap-4 w-full pointer-events-auto">
            <div
              data-ui-layer="true"
              className={`flex flex-col gap-1.5 transition-opacity duration-300 ${
                shouldHideNonInteractiveUi ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <h2
                className="text-[15px] font-bold text-white drop-shadow-md leading-tight select-none [-webkit-touch-callout:none]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {demo.title}
              </h2>
              <p className="text-white/80 text-[12px] font-light leading-snug max-w-[300px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] select-none [-webkit-touch-callout:none]">
                {demo.feedHook}
              </p>
            </div>

            <DemoEngagementPanel
              avatarUrl={CUSTOM_LOGO_URL}
              isLiked={isLiked}
              likeCountText="136.1K"
              commentCountText={demo.commentCount}
              characters={characters.map((character) => ({
                id: character.id,
                name: character.name,
                unlocked: character.unlocked,
                avatar: character.avatar,
              })) as DemoCharacterPreview[]}
              onToggleLike={() => setIsLiked((previous) => !previous)}
              onOpenComments={() => {
                setIsCharactersOpen(false);
                setIsEpisodesOpen(false);
                setIsCommentsOpen(true);
              }}
              onOpenCharacters={() => {
                setIsCommentsOpen(false);
                setIsEpisodesOpen(false);
                setIsCharactersOpen(true);
              }}
              onOpenEpisodes={() => {
                setIsCommentsOpen(false);
                setIsCharactersOpen(false);
                setIsEpisodesOpen(true);
              }}
              onToggleFullscreen={handleToggleFullscreen}
              hideNonInteractiveUi={shouldHideNonInteractiveUi}
              enableFullscreen={true}
            />
          </div>
        </div>
      </div>

      <DemoCastDrawer
        isOpen={isCharactersOpen}
        title="Characters"
        subtitle={demo.title}
        characters={characters}
        onClose={() => setIsCharactersOpen(false)}
      />

      <DemoCommentsDrawer
        isOpen={isCommentsOpen}
        title={`${demo.commentCount} comments`}
        subtitle={demo.title}
        comments={comments}
        onClose={() => setIsCommentsOpen(false)}
      />

      <DemoEpisodesDrawer
        isOpen={isEpisodesOpen}
        episodes={MOCK_EPISODES}
        onClose={() => setIsEpisodesOpen(false)}
      />
    </div>
  );
}
