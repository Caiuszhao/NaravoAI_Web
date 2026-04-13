import { useEffect, useRef, useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { DemoPreviewSection } from './components/DemoPreviewSection';
import { WhyThisFeelsNewSection } from './components/WhyThisFeelsNewSection';
import { ProductThesisSection } from './components/ProductThesisSection';
import { UserExperienceFlowSection } from './components/UserExperienceFlowSection';
import { WhyItMattersSection } from './components/WhyItMattersSection';
import { ClosingCTASection } from './components/ClosingCTASection';
import { DemoPage } from './components/DemoPage';
import { STORY1_VIDEOS } from './storyVideos';
import { preloadVideosWithCache } from './utils/videoPreload';
import { GenerateApiTestDialog } from './components/GenerateApiTestDialog';
import { DemoDebugPanel } from './components/DemoDebugPanel';
import { appRuntimeConfig } from './config/app.config';
import { DemoDebugProvider } from './context/DemoDebugContext';
import { ApiEnvProvider } from './context/ApiEnvContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'demo'>('home');
  const [isDebugUiVisible, setIsDebugUiVisible] = useState(false);
  const debugLogoTapCountRef = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (currentPage === 'home') {
      root.classList.add('hide-scrollbar');
      body.classList.add('hide-scrollbar');
    } else {
      root.classList.remove('hide-scrollbar');
      body.classList.remove('hide-scrollbar');
    }

    return () => {
      root.classList.remove('hide-scrollbar');
      body.classList.remove('hide-scrollbar');
    };
  }, [currentPage]);

  const handleLogoClick = () => {
    if (!appRuntimeConfig.enableDebugPanel) return;
    debugLogoTapCountRef.current += 1;
    if (debugLogoTapCountRef.current >= 5) {
      debugLogoTapCountRef.current = 0;
      setIsDebugUiVisible((previous) => !previous);
    }
  };

  useEffect(() => {
    if (currentPage !== 'home') return;
    return preloadVideosWithCache({
      // Priority: index1 > index2 > ep2 > ep3 > ep4
      priority: [
        STORY1_VIDEOS.intro,
        STORY1_VIDEOS.loop,
        STORY1_VIDEOS.branches.click,
        STORY1_VIDEOS.branches.hold,
        STORY1_VIDEOS.branches.rapid,
      ],
      background: [],
    });
  }, [currentPage]);

  return (
    <DemoDebugProvider>
      <ApiEnvProvider>
        {currentPage === 'demo' ? (
          <DemoPage onBackHome={() => setCurrentPage('home')} />
        ) : (
          <div className="bg-[#020202] min-h-[100dvh] text-white font-sans selection:bg-white/30 w-full overflow-x-hidden">
            <main className="w-full min-h-[100dvh] relative">
              <HeroSection onTryLiveDemo={() => setCurrentPage('demo')} onLogoClick={handleLogoClick} />
              <DemoPreviewSection />
              <WhyThisFeelsNewSection />
              <ProductThesisSection />
              <UserExperienceFlowSection />
              <WhyItMattersSection />
              <ClosingCTASection />
            </main>
            {appRuntimeConfig.enableDebugPanel && isDebugUiVisible && <GenerateApiTestDialog defaultOpen />}
          </div>
        )}
        {appRuntimeConfig.enableDebugPanel && isDebugUiVisible && <DemoDebugPanel />}
      </ApiEnvProvider>
    </DemoDebugProvider>
  );
}
