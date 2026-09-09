'use client';

import { motion } from 'framer-motion';
import { useLunar } from '@/lib/lunarStore';

export default function HeroOverlay() {
  const { hasEnteredMission } = useLunar();

  if (!hasEnteredMission) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-10">
      {/* Top section — title */}
      <motion.div
        layoutId="lunar-x-brand"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 140, duration: 0.9 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500">
            Active Mission
          </span>
        </div>

        <h1 className="mt-2 text-4xl md:text-6xl font-bold tracking-tight select-none">
          <span className="text-white">LUNAR</span>
          <span className="text-orange-500">-X</span>
        </h1>

        <motion.p
          className="mt-1.5 text-xs md:text-sm text-neutral-400 max-w-md leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Interactive Lunar Surface Visualization &amp; Analysis Platform
        </motion.p>

        <motion.div
          className="mt-3 flex items-center gap-4 text-[9px] font-mono text-neutral-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <span>◆ SELENOGRAPHIC MAPPING</span>
          <span>◆ OHRC / TMC-2 ANALYSIS</span>
          <span>◆ REAL-TIME ILLUMINATION</span>
        </motion.div>
      </motion.div>

      {/* Bottom section — instructions */}
      <motion.div
        className="flex items-center gap-6 text-[10px] font-mono text-neutral-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border border-neutral-700 rounded flex items-center justify-center text-neutral-500">
            ⟲
          </div>
          <span>DRAG TO ORBIT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border border-neutral-700 rounded flex items-center justify-center text-neutral-500">
            ⊕
          </div>
          <span>SCROLL TO ZOOM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border border-neutral-700 rounded flex items-center justify-center text-neutral-500">
            ◎
          </div>
          <span>CLICK PIN TO FLY</span>
        </div>
      </motion.div>
    </div>
  );
}

