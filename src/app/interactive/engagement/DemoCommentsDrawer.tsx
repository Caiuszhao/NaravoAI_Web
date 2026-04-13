import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

export type DemoCommentItem = {
  id: number;
  name: string;
  handle: string;
  text: string;
  likes: string;
  time: string;
};

type DemoCommentsDrawerProps = {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  comments: DemoCommentItem[];
  onClose: () => void;
  composerInitial?: string;
  composerPlaceholder?: string;
  composerSubmitLabel?: string;
};

export function DemoCommentsDrawer({
  isOpen,
  title,
  subtitle,
  comments,
  onClose,
  composerInitial = 'Y',
  composerPlaceholder = 'Add comment...',
  composerSubmitLabel = 'Post',
}: DemoCommentsDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[130] bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 inset-x-0 z-[135] mx-auto w-full max-w-[640px] rounded-t-[24px] bg-[#111214] border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,0.65)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 pt-2.5 pb-3 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-white">{title}</span>
                {subtitle ? (
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{subtitle}</span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[52vh] overflow-y-auto hide-scrollbar px-4 py-3 space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white/85 flex items-center justify-center text-[11px] font-bold">
                    {comment.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-white/90 font-semibold">{comment.name}</span>
                      <span className="text-[10px] text-white/35">{comment.handle}</span>
                    </div>
                    <p className="text-[12px] text-white/75 leading-relaxed mt-0.5">{comment.text}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/35">
                      <span>{comment.time}</span>
                      <span>{comment.likes} likes</span>
                      <button type="button" className="text-[9px] leading-none hover:text-white/70 transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/10 bg-[#0d0e10]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 text-white/85 flex items-center justify-center text-[11px] font-bold">
                  {composerInitial}
                </div>
                <input
                  type="text"
                  value=""
                  readOnly
                  placeholder={composerPlaceholder}
                  className="flex-1 h-9 px-3 rounded-full bg-white/6 border border-white/10 text-[12px] text-white/80 placeholder:text-white/35 outline-none"
                />
                <button
                  type="button"
                  className="h-9 px-3 rounded-full bg-white text-black text-[11px] font-semibold hover:bg-white/90 transition-colors"
                >
                  {composerSubmitLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
