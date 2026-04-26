import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, Lock } from 'lucide-react';

export type EpisodeInfo = {
  id: number;
  title: string;
  duration?: string;
  status: 'playing' | 'unlocked' | 'locked';
  thumbnailUrl?: string;
};

type DemoEpisodesDrawerProps = {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  episodes: EpisodeInfo[];
  onClose: () => void;
  onSelectEpisode?: (id: number) => void;
};

export function DemoEpisodesDrawer({
  isOpen,
  title = 'Game Chapters',
  subtitle,
  episodes,
  onClose,
  onSelectEpisode,
}: DemoEpisodesDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-[101] max-h-[80vh] flex flex-col bg-[#111] rounded-t-[24px] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex-none p-4 flex items-center justify-between border-b border-white/5 bg-black/20">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[15px] font-bold text-white tracking-wide">{title}</h3>
                {subtitle && <span className="text-[11px] text-white/50">{subtitle}</span>}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 flex flex-col gap-3">
              {episodes.map((episode) => {
                const isPlaying = episode.status === 'playing';
                const isLocked = episode.status === 'locked';

                return (
                  <button
                    key={episode.id}
                    onClick={() => {
                      if (!isLocked && onSelectEpisode) {
                        onSelectEpisode(episode.id);
                      }
                    }}
                    disabled={isLocked}
                    className={`flex items-center gap-3 p-3 rounded-[16px] border text-left transition-all ${
                      isPlaying
                        ? 'bg-white/10 border-white/20 shadow-lg'
                        : isLocked
                        ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="relative w-20 h-14 rounded-[8px] bg-black/50 overflow-hidden flex-shrink-0 border border-white/10">
                      {episode.thumbnailUrl ? (
                        <img src={episode.thumbnailUrl} alt={episode.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <PlayCircle className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                      
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white/70" />
                        </div>
                      )}

                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="flex items-end gap-1 h-3">
                            <motion.div animate={{ height: ['4px', '12px', '4px'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: ['8px', '4px', '12px'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: ['12px', '8px', '4px'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`text-[13px] font-semibold truncate ${isPlaying ? 'text-white' : 'text-white/80'}`}>
                        {episode.id}. {episode.title}
                      </span>
                      {episode.duration && (
                        <span className="text-[10px] text-white/40 mt-1">
                          {episode.duration}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}