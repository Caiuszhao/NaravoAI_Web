import React, { useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { DemoPreviewSection } from './components/DemoPreviewSection';
import { WhyThisFeelsNewSection } from './components/WhyThisFeelsNewSection';
import { ProductThesisSection } from './components/ProductThesisSection';
import { UserExperienceFlowSection } from './components/UserExperienceFlowSection';
import { WhyItMattersSection } from './components/WhyItMattersSection';
import { ClosingCTASection } from './components/ClosingCTASection';
import { DemoPage } from './components/DemoPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'demo'>('home');

  if (currentPage === 'demo') {
    return <DemoPage onBackHome={() => setCurrentPage('home')} />;
  }

  return (
    <div className="bg-[#020202] min-h-[100dvh] text-white font-sans selection:bg-white/30 w-full overflow-x-hidden">
      <main className="w-full min-h-[100dvh] relative">
        <HeroSection onTryLiveDemo={() => setCurrentPage('demo')} />
        <DemoPreviewSection />
        <WhyThisFeelsNewSection />
        <ProductThesisSection />
        <UserExperienceFlowSection />
        <WhyItMattersSection />
        <ClosingCTASection />
      </main>
    </div>
  );
}
