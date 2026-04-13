import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

export type DemoCastCharacter = {
  id: number;
  name: string;
  role: string;
  summary: string;
  unlocked: boolean;
  avatar?: string;
};

type DemoCastDrawerProps = {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  characters: DemoCastCharacter[];
  onClose: () => void;
  onChatCharacter?: (character: DemoCastCharacter) => void;
};

export function DemoCastDrawer({
  isOpen,
  title,
  subtitle,
  characters,
  onClose,
  onChatCharacter,
}: DemoCastDrawerProps) {
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
              {characters.map((character) => (
                <div
                  key={character.id}
                  className={`rounded-2xl border p-3.5 ${
                    character.unlocked ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.015]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-full border flex items-center justify-center overflow-hidden ${
                        character.unlocked ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {character.unlocked && character.avatar ? (
                        <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white/70 text-[16px] font-bold">?</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[12px] font-semibold ${
                            character.unlocked ? 'text-white/90' : 'text-white/50'
                          }`}
                        >
                          {character.unlocked ? character.name : 'Locked Character'}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-[0.16em] ${
                            character.unlocked ? 'text-white/35' : 'text-white/25'
                          }`}
                        >
                          {character.role}
                        </span>
                      </div>
                      <p className={`text-[12px] leading-relaxed mt-1 ${character.unlocked ? 'text-white/70' : 'text-white/40'}`}>
                        {character.summary}
                      </p>
                      <button
                        type="button"
                        disabled={!character.unlocked}
                        onClick={() => {
                          if (!character.unlocked) return;
                          onChatCharacter?.(character);
                        }}
                        className={`mt-2.5 min-h-7 px-3 py-1 rounded-full border text-[10px] font-semibold tracking-[0.08em] uppercase leading-tight whitespace-normal text-center break-words transition-all ${
                          character.unlocked
                            ? 'border-white/20 bg-white/10 text-white/85 hover:bg-white/15'
                            : 'border-white/10 bg-white/[0.03] text-white/35 cursor-not-allowed'
                        }`}
                        aria-label={character.unlocked ? `Chat with ${character.name}` : 'Unlock character to chat'}
                      >
                        {character.unlocked ? `Chat with ${character.name}` : 'Unlock to chat'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
