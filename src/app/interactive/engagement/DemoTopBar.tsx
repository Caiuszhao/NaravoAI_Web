import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, MoreHorizontal, Share2, Wand2 } from 'lucide-react';

type DemoTopBarProps = {
  onBackHome: () => void;
  hideChrome?: boolean;
  closeOnInactive?: boolean;
};

export function DemoTopBar({ onBackHome, hideChrome = false, closeOnInactive = false }: DemoTopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!closeOnInactive) return;
    setIsMenuOpen(false);
  }, [closeOnInactive]);

  return (
    <>
      {isMenuOpen && (
        <div
          data-ui-layer="true"
          className="absolute inset-0 z-[60]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div
        data-ui-layer="true"
        className={`absolute top-0 left-0 w-full px-5 pt-12 pb-5 z-[70] flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
          hideChrome ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={onBackHome}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-all active:scale-95 relative z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-3 pointer-events-auto relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
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
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Share Story</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Remix Flow</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
