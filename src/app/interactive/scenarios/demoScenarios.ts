import { STORY1_VIDEOS, DEMO3_VIDEOS } from "../../storyVideos";
import type { DemoScenario } from "../types/demo";

export const CUSTOM_LOGO_URL = new URL("../../../assets/3bf85ad3821c19cb83ca7268914f3d9ba7a2eab8.png", import.meta.url).href;

export const STORY_CONFIG: DemoScenario = {
  id: 1,
  title: "Wasteland Run: Escape Partner",
  feedHook: "You and your partner race to a jammed shelter gate. Break the lock in 5 seconds before the horde catches you.",
  showcaseHook:
    "You and a dangerous ally are chased by a horde to a jammed shelter gate. Break the lock in 5 seconds, or get dragged in bleeding as the dead close in.",
  interactionMethod: "Tap count in 5s window",
  objective: "Guide the user into three distinct outcomes from a shared loop segment.",
  commentCount: "1,284",
  strategyKey: "tap-branch",
  ui: {
    enableLike: true,
    enableComment: true,
    enableCast: true,
    enableFullscreen: true,
    hideNonInteractiveUiWhenFullscreen: true
  }
};

export const LEGACY_DEMO_2: DemoScenario = {
  id: 2,
  title: "Machine Uprising: Core Lockdown",
  feedHook:
    "Coming Soon. A rogue service robot seals the evacuation elevator. Trigger a timed override before the control core wipes your access keys.",
  showcaseHook:
    "Coming Soon. Inside a collapsing arcology, a maintenance robot has turned hostile and locked the emergency lift. You must send the correct override pattern before the AI core purges civilian credentials.",
  interactionMethod: "Sequence Tap Override",
  objective: "Input the correct command pattern to unlock the elevator and contain the robot",
  commentCount: "3,778",
  strategyKey: "placeholder",
  ui: {
    enableLike: true,
    enableComment: true,
    enableCast: true,
    enableFullscreen: true,
    hideNonInteractiveUiWhenFullscreen: true
  },
  mediaType: "video",
  videoBg: "https://image-b2.civitai.com/file/civitai-media-cache/00f5df14-2645-4ca5-8d99-bde8b833c6f4/original"
};

export const LEGACY_DEMO_3: DemoScenario = {
  id: 3,
  title: "One Man Station",
  feedHook: "A lone astronaut gets one unstable relay burst. Your reply decides if he risks a final EVA repair or records a goodbye.",
  showcaseHook:
    "A lone astronaut drifting on a dying station restores one unstable relay burst. Your reply decides whether he risks one last EVA repair or records a final goodbye.",
  interactionMethod: "Voice or Text Reply",
  objective: "Send the message that shapes his final decision",
  commentCount: "2,154",
  strategyKey: "text-emotion-branch",
  ui: {
    enableLike: true,
    enableComment: true,
    enableCast: true,
    enableFullscreen: true,
    hideNonInteractiveUiWhenFullscreen: true
  },
  mediaType: "video",
  videoBg: DEMO3_VIDEOS[0],
  videos: DEMO3_VIDEOS,
  bgmUrl: "https://playable-1257281110.cos.ap-guangzhou.myqcloud.com/story_last_day/demo2/demo2_bgm.mp3",
  playVideoAudio: true
};

export const DEMOS: DemoScenario[] = [STORY_CONFIG, LEGACY_DEMO_3, LEGACY_DEMO_2];

export const STORY1_PHASE_VIDEO_FILES = {
  intro: STORY1_VIDEOS.intro,
  loop: STORY1_VIDEOS.loop,
  click: STORY1_VIDEOS.branches.click,
  hold: STORY1_VIDEOS.branches.hold,
  rapid: STORY1_VIDEOS.branches.rapid
} as const;
