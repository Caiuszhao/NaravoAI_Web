export type StrategyKey = 'tap-branch' | 'text-emotion-branch' | 'placeholder';

export type DemoUiOptions = {
  enableLike: boolean;
  enableComment: boolean;
  enableCast: boolean;
  enableFullscreen: boolean;
  hideNonInteractiveUiWhenFullscreen: boolean;
};

export type DemoEngagementMeta = {
  title: string;
  subtitle?: string;
  commentCountText?: string;
  likeCountText?: string;
  avatarUrl?: string;
};

export type DemoScenario = {
  id: number;
  title: string;
  feedHook: string;
  showcaseHook: string;
  interactionMethod: string;
  objective: string;
  commentCount: string;
  strategyKey: StrategyKey;
  ui: DemoUiOptions;
  mediaType?: 'video';
  videoBg?: string;
  videos?: readonly string[];
  startIndex?: number;
  bgmUrl?: string;
  playVideoAudio?: boolean;
};

export type DemoCharacterPreview = {
  id: number;
  name: string;
  unlocked: boolean;
  avatar?: string;
};
