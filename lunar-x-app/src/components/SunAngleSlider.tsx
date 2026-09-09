'use client';

import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';
import { useLunar } from '@/lib/lunarStore';

export default function SunAngleSlider() {
  const { sunAngle, setSunAngle, hasEnteredMission } = useLunar();

  if (!hasEnteredMission) return null;

  return (
    <motion.div
      className="absolute top-6 right-6 z-20 pointer-events-auto"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <div className="bg-black/60 backdrop-blur-xl border border-neutral-800 rounded-xl px-4 py-3 w-56 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Sun Angle
            </span>
          </div>
          <span className="text-xs font-mono text-amber-400 tabular-nums">
            {sunAngle.toFixed(0)}°
          </span>
        </div>

        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={sunAngle}
            onChange={(e) => setSunAngle(Number(e.target.value))}
            className="
              w-full h-1.5 rounded-full appearance-none cursor-pointer
              bg-neutral-800
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-amber-400
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(251,191,36,0.5)]
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-amber-500
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-amber-400
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-amber-500
              [&::-moz-range-thumb]:cursor-pointer
            "
          />
          {/* Track fill indicator */}
          <div
            className="absolute top-0 left-0 h-1.5 rounded-full bg-gradient-to-r from-amber-600/60 to-amber-400/40 pointer-events-none"
            style={{ width: `${(sunAngle / 360) * 100}%` }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-1.5 text-[8px] font-mono text-neutral-600">
          <span>0° DAWN</span>
          <span>180° DUSK</span>
          <span>360°</span>
        </div>
      </div>
    </motion.div>
  );
}

