import { ArrowLeft, Heart, Maximize, MessageCircle, MoreHorizontal, Plus } from 'lucide-react';
import { CUSTOM_LOGO_URL } from './DemoFeed';

type LegacyDemo = {
  id: number;
  title: string;
  feedHook: string;
  commentCount: string;
  videoBg?: string;
};

export function LegacyDemoScreen({
  demo,
  onBackHome,
}: {
  demo: LegacyDemo;
  onBackHome?: () => void;
}) {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full px-5 pt-12 pb-5 z-[70] flex items-center justify-between pointer-events-none">
        <button
          onClick={onBackHome}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-all active:scale-95 relative z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition-all relative z-10">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute inset-0 z-0 bg-black">
        <video
          src={demo.videoBg}
          className="w-full h-full object-cover opacity-85"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end z-10">
        <div className="relative z-10 p-4 pb-12 w-full flex flex-col justify-end pointer-events-none">
          <div className="flex flex-col gap-4 w-full pointer-events-auto">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[15px] font-bold text-white drop-shadow-md leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {demo.title}
              </h2>
              <p className="text-white/80 text-[12px] font-light leading-snug max-w-[300px] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                {demo.feedHook}
              </p>
            </div>

            <div className="w-full mt-2">
              <div className="flex flex-row items-center justify-between w-full min-w-0">
                <div className="relative flex flex-col items-center shrink-0">
                  <div className="w-[30px] h-[30px] rounded-full border-2 border-white overflow-hidden bg-black/50 relative">
                    <img src={CUSTOM_LOGO_URL} alt="Avatar" className="w-full h-full object-cover animate-ping absolute inset-0" style={{ animationDuration: '3s' }} />
                    <img src={CUSTOM_LOGO_URL} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                  </div>
                  <button className="absolute -bottom-1.5 w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-white shadow-sm border border-white hover:bg-red-600 transition-colors z-20">
                    <Plus className="w-[8px] h-[8px]" strokeWidth={3} />
                  </button>
                </div>

                <div className="flex flex-row items-center gap-1 shrink-0">
                  <button className="flex items-center justify-center hover:scale-110 active:scale-90 transition-transform text-white">
                    <Heart className="w-6 h-6 fill-current drop-shadow-md" />
                  </button>
                  <span className="text-white font-semibold text-[12px] drop-shadow-md">136.1K</span>
                </div>

                <div className="flex flex-row items-center gap-1 shrink-0">
                  <button className="flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform">
                    <MessageCircle className="w-6 h-6 fill-current drop-shadow-md" style={{ transform: 'scaleX(-1)' }} />
                  </button>
                  <span className="text-white font-semibold text-[12px] drop-shadow-md">{demo.commentCount}</span>
                </div>

                <button
                  type="button"
                  className="h-7 px-1 rounded-full border border-white/15 bg-black/45 backdrop-blur-lg flex items-center hover:bg-black/60 transition-all z-50 shrink-0"
                  aria-label="Open cast list"
                >
                  <div className="flex items-center">
                    <div className="w-4.5 h-4.5 rounded-full border border-white/25 overflow-hidden ml-0 bg-white/10 flex items-center justify-center">
                      <span className="text-[8px] text-white/70 font-bold">C</span>
                    </div>
                    <div className="w-4.5 h-4.5 rounded-full border border-white/25 overflow-hidden -ml-1 bg-white/10 flex items-center justify-center">
                      <span className="text-[8px] text-white/70 font-bold">A</span>
                    </div>
                  </div>
                </button>

                <button
                  className="flex items-center justify-center text-white/25 hover:text-white hover:scale-110 active:scale-90 transition-all z-50 shrink-0"
                >
                  <Maximize className="w-[22px] h-[22px] drop-shadow-md" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
