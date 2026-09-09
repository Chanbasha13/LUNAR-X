'use client';

import { motion } from 'framer-motion';
import { Upload, FlaskConical } from 'lucide-react';
import { useLunar } from '@/lib/lunarStore';

export default function ControlPanel() {
  const { setIsModalOpen, hasEnteredMission } = useLunar();

  if (!hasEnteredMission) return null;

  return (
    <motion.div
      className="absolute bottom-6 left-6 z-20 pointer-events-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      <div className="bg-black/60 backdrop-blur-xl border border-neutral-800 rounded-xl p-3 shadow-2xl">
        <div className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 mb-2 px-1">
          Analysis Tools
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="
              flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-medium
              bg-gradient-to-r from-orange-600/20 to-orange-500/10
              border border-orange-500/30 text-orange-400
              hover:from-orange-600/30 hover:to-orange-500/20 hover:border-orange-500/50
              transition-all duration-200 cursor-pointer
              active:scale-[0.98]
            "
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Satellite Images
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="
              flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-medium
              bg-gradient-to-r from-sky-600/20 to-sky-500/10
              border border-sky-500/30 text-sky-400
              hover:from-sky-600/30 hover:to-sky-500/20 hover:border-sky-500/50
              transition-all duration-200 cursor-pointer
              active:scale-[0.98]
            "
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Verify Result
          </button>
        </div>
      </div>
    </motion.div>
  );
}

