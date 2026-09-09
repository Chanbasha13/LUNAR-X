'use client';

import dynamic from 'next/dynamic';
import { LunarProvider } from '@/lib/lunarStore';
import HeroOverlay from '@/components/HeroOverlay';
import SunAngleSlider from '@/components/SunAngleSlider';
import ControlPanel from '@/components/ControlPanel';
import ScientificModal from '@/components/ScientificModal';
import MissionAccess from '@/components/MissionAccess';

// Dynamic import with SSR disabled — prevents WebGL/hydration errors
const MoonCanvas = dynamic(() => import('@/components/MoonCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-800" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-mono text-neutral-400">Initializing Lunar Simulation</p>
          <p className="text-[10px] font-mono text-neutral-600 mt-1">Loading 3D Engine...</p>
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <LunarProvider>
      <main className="relative w-screen h-screen bg-black overflow-hidden">
        {/* Full-screen 3D Canvas */}
        <MoonCanvas />

        {/* UI Overlays */}
        <HeroOverlay />
        <SunAngleSlider />
        <ControlPanel />
        <ScientificModal />

        {/* Mission Access Screen & Entry Transition */}
        <MissionAccess />
      </main>
    </LunarProvider>
  );
}
