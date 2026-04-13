import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";

type UsePlayerShellOptions = {
  isActive: boolean;
  getActiveVideo: () => HTMLVideoElement | null;
  bindingKey: string | number;
  canTogglePause: () => boolean;
  onInactivePauseAll?: () => void;
  resetUserPausedWhenInactive?: boolean;
  onBeforePause?: () => void;
  onAfterResume?: () => void;
};

export const usePlayerShell = ({
  isActive,
  getActiveVideo,
  bindingKey,
  canTogglePause,
  onInactivePauseAll,
  resetUserPausedWhenInactive = false,
  onBeforePause,
  onAfterResume
}: UsePlayerShellOptions) => {
  const LONG_PRESS_DELAY_MS = 220;
  const FAST_PLAYBACK_RATE = 2;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressActiveRef = useRef(false);
  const suppressClickAfterLongPressRef = useRef(false);

  useEffect(() => {
    if (isActive) return;
    const current = getActiveVideo();
    if (current) current.playbackRate = 1;
    onInactivePauseAll?.();
    const video = current;
    if (video) {
      video.pause();
    }
    if (resetUserPausedWhenInactive) {
      setIsPausedByUser(false);
      setIsVideoPaused(false);
    }
  }, [isActive, bindingKey, getActiveVideo, onInactivePauseAll, resetUserPausedWhenInactive]);

  useEffect(() => {
    const video = getActiveVideo();
    if (!video) return;
    video.playbackRate = 1;
  }, [bindingKey, getActiveVideo]);

  useEffect(() => {
    const video = getActiveVideo();
    if (!video) return;

    const handlePause = () => setIsVideoPaused(true);
    const handlePlay = () => {
      setIsVideoPaused(false);
      setIsPausedByUser(false);
    };

    video.addEventListener("pause", handlePause);
    video.addEventListener("play", handlePlay);
    return () => {
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("play", handlePlay);
    };
  }, [bindingKey, getActiveVideo]);

  const handleToggleFullscreen = () => {
    setIsFullscreen(previous => !previous);
  };

  const handleVideoSurfaceClick = (
    event: MouseEvent<HTMLElement>,
    {
      ignoreUiLayer = true
    }: {
      ignoreUiLayer?: boolean;
    } = {}
  ) => {
    if (suppressClickAfterLongPressRef.current) {
      suppressClickAfterLongPressRef.current = false;
      return;
    }
    if (!isActive) return;
    if (!canTogglePause()) return;

    const target = event.target as HTMLElement;
    if (ignoreUiLayer && target.closest('[data-ui-layer="true"]')) return;

    const video = getActiveVideo();
    if (!video || video.ended) return;

    if (video.paused) {
      video.muted = false;
      video.volume = 1;
      void video.play().catch(() => {
        video.muted = true;
        return video.play().catch(() => undefined);
      });
      onAfterResume?.();
      return;
    }

    onBeforePause?.();
    setIsPausedByUser(true);
    setIsVideoPaused(true);
    video.pause();
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current === null) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const handleVideoSurfacePointerDown = (
    event: ReactPointerEvent<HTMLElement>,
    {
      ignoreUiLayer = true,
    }: {
      ignoreUiLayer?: boolean;
    } = {}
  ) => {
    if (!isActive) return;
    if (!canTogglePause()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (ignoreUiLayer && target.closest('[data-ui-layer="true"]')) return;

    clearLongPressTimer();
    longPressActiveRef.current = false;

    longPressTimerRef.current = window.setTimeout(() => {
      const video = getActiveVideo();
      if (!video || video.ended || video.paused) return;
      video.playbackRate = FAST_PLAYBACK_RATE;
      longPressActiveRef.current = true;
    }, LONG_PRESS_DELAY_MS);
  };

  const handleVideoSurfacePointerEnd = () => {
    clearLongPressTimer();
    const video = getActiveVideo();
    if (video) {
      video.playbackRate = 1;
    }
    if (longPressActiveRef.current) {
      suppressClickAfterLongPressRef.current = true;
    }
    longPressActiveRef.current = false;
  };

  const handleResumePlayback = () => {
    const video = getActiveVideo();
    if (!video) return;
    setIsPausedByUser(false);
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => {
      video.muted = true;
      return video.play().catch(() => undefined);
    });
    onAfterResume?.();
  };

  const resetPauseUiState = () => {
    setIsPausedByUser(false);
    setIsVideoPaused(false);
  };

  return {
    isFullscreen,
    setIsFullscreen,
    isVideoPaused,
    setIsVideoPaused,
    isPausedByUser,
    setIsPausedByUser,
    handleToggleFullscreen,
    handleVideoSurfaceClick,
    handleVideoSurfacePointerDown,
    handleVideoSurfacePointerEnd,
    handleResumePlayback,
    resetPauseUiState
  };
};
