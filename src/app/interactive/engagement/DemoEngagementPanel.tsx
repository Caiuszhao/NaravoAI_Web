import { Heart, Maximize, MessageCircle, Plus } from 'lucide-react';
import type { DemoCharacterPreview } from '../types/demo';

type DemoEngagementPanelProps = {
  avatarUrl: string;
  isLiked: boolean;
  likeCountText: string;
  commentCountText: string;
  characters: DemoCharacterPreview[];
  onToggleLike: () => void;
  onOpenComments: () => void;
  onOpenCharacters: () => void;
  onToggleFullscreen?: () => void;
  hideNonInteractiveUi?: boolean;
  enableFullscreen?: boolean;
};

export function DemoEngagementPanel({
  avatarUrl,
  isLiked,
  likeCountText,
  commentCountText,
  characters,
  onToggleLike,
  onOpenComments,
  onOpenCharacters,
  onToggleFullscreen,
  hideNonInteractiveUi = false,
  enableFullscreen = true,
}: DemoEngagementPanelProps) {
  return (
    <div className="w-full mt-2">
      <div className="flex flex-row items-center justify-between w-full min-w-0">
        <div
          data-ui-layer="true"
          className={`relative flex flex-col items-center shrink-0 transition-opacity duration-300 ${
            hideNonInteractiveUi ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="w-[30px] h-[30px] rounded-full border-2 border-white overflow-hidden bg-black/50 relative">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover animate-ping absolute inset-0"
              style={{ animationDuration: '3s' }}
            />
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover relative z-10" />
          </div>
          <button className="absolute -bottom-1.5 w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm border border-white hover:bg-red-600 transition-colors z-20">
            <Plus className="w-[8px] h-[8px]" strokeWidth={3} />
          </button>
        </div>

        <div
          data-ui-layer="true"
          className={`flex flex-row items-center gap-1 shrink-0 transition-opacity duration-300 ${
            hideNonInteractiveUi ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={onToggleLike}
            className={`flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ${
              isLiked ? 'text-red-500' : 'text-white'
            }`}
          >
            <Heart className="w-6 h-6 fill-current drop-shadow-md" />
          </button>
          <span className="text-white font-semibold text-[12px] drop-shadow-md">{likeCountText}</span>
        </div>

        <div
          data-ui-layer="true"
          className={`flex flex-row items-center gap-1 shrink-0 transition-opacity duration-300 ${
            hideNonInteractiveUi ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <button
            type="button"
            onClick={onOpenComments}
            className="flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform"
          >
            <MessageCircle className="w-6 h-6 fill-current drop-shadow-md" style={{ transform: 'scaleX(-1)' }} />
          </button>
          <span className="text-white font-semibold text-[12px] drop-shadow-md">{commentCountText}</span>
        </div>

        <button
          type="button"
          data-ui-layer="true"
          onClick={onOpenCharacters}
          className={`h-7 px-1 rounded-full border border-white/15 bg-black/45 backdrop-blur-lg flex items-center hover:bg-black/60 transition-all z-50 shrink-0 ${
            hideNonInteractiveUi ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-label="Open cast list"
        >
          <div className="flex items-center">
            {characters.slice(0, 2).map((character, index) => (
              <div
                key={character.id}
                className={`w-4.5 h-4.5 rounded-full border border-white/25 overflow-hidden ${
                  index === 0 ? 'ml-0' : '-ml-1'
                } ${character.unlocked ? 'bg-white/10' : 'bg-white/5'} flex items-center justify-center`}
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

        {enableFullscreen && onToggleFullscreen && (
          <button
            type="button"
            data-ui-layer="true"
            onClick={onToggleFullscreen}
            className="flex items-center justify-center text-white/25 hover:text-white hover:scale-110 active:scale-90 transition-all z-50 shrink-0"
            aria-label="Toggle fullscreen"
          >
            <Maximize className="w-[22px] h-[22px] drop-shadow-md" />
          </button>
        )}
      </div>
    </div>
  );
}
