import { Play, RotateCcw } from 'lucide-react';

type PlayerShellCenterOverlayProps = {
  showResumeButton: boolean;
  onResume: () => void;
  showReplayButton: boolean;
  replayLabel: string;
  onReplay: () => void;
};

export function PlayerShellCenterOverlay({
  showResumeButton,
  onResume,
  showReplayButton,
  replayLabel,
  onReplay,
}: PlayerShellCenterOverlayProps) {
  return (
    <>
      {showReplayButton && (
        <div
          data-ui-layer="true"
          className="absolute inset-0 z-[95] flex items-center justify-center pointer-events-none px-6"
        >
          <button
            type="button"
            onClick={onReplay}
            className="pointer-events-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-xl text-white text-[11px] font-semibold tracking-[0.14em] uppercase border border-white/25 hover:bg-white/16 hover:border-white/35 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          >
            <RotateCcw className="w-4 h-4" />
            {replayLabel}
          </button>
        </div>
      )}

      {showResumeButton && !showReplayButton && (
        <div data-ui-layer="true" className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={onResume}
            className="pointer-events-auto w-16 h-16 rounded-full bg-black/55 border border-white/30 backdrop-blur-xl text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
            aria-label="Resume playback"
          >
            <Play className="w-7 h-7 ml-0.5 fill-current" />
          </button>
        </div>
      )}
    </>
  );
}
