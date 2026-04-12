import { useEffect, useState, type MouseEvent } from "react";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  useEffect(() => {
    if (isActive) return;
    onInactivePauseAll?.();
    const video = getActiveVideo();
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
    handleResumePlayback,
    resetPauseUiState
  };
};
