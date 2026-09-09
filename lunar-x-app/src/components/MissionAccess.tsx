'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Lock, User, Satellite } from 'lucide-react';
import { useLunar } from '@/lib/lunarStore';

export default function MissionAccess() {
  const { hasEnteredMission, setHasEnteredMission } = useLunar();
  const [operatorId, setOperatorId] = useState('ISRO-CH2-EXP1');
  const [accessKey, setAccessKey] = useState('LUNAR-2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasEnteredMission) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId.trim() || !accessKey.trim()) {
      setError('Please provide Operator ID and Access Key');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    // Smooth transition delay
    setTimeout(() => {
      setHasEnteredMission(true);
    }, 450);
  };

  return (
    <AnimatePresence>
      {!hasEnteredMission && (
        <motion.div
          className="fixed inset-0 z-40 bg-black flex flex-col justify-between p-6 md:p-12 overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Mission Header */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-semibold">
                  ISRO / CHANDRAYAAN-2 MISSION OPERATIONS
                </span>
                <span className="text-[9px] font-mono text-neutral-600">
                  PAYLOAD DATA SYSTEM • ORBITER HIGH RESOLUTION CAMERA &amp; TMC-2
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-950/80 text-[10px] font-mono text-neutral-400">
              <Shield className="w-3 h-3 text-orange-400" />
              <span>SECURE ACCESS GATEWAY</span>
            </div>
          </motion.div>

          {/* Centered Identity & Login Card */}
          <div className="flex flex-col items-center justify-center my-auto w-full max-w-md mx-auto">
            {/* LUNAR-X Shared Brand Title */}
            <motion.div
              layoutId="lunar-x-brand"
              className="text-center mb-8"
              transition={{ type: 'spring', damping: 28, stiffness: 140, duration: 0.9 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono text-orange-400 mb-3">
                <Satellite className="w-3 h-3 text-orange-400" />
                <span>PLANETARY EXPLORATION SUITE</span>
              </div>

              <h1 className="text-6xl md:text-8xl font-black tracking-tighter select-none">
                <span className="text-white drop-shadow-sm">LUNAR</span>
                <span className="text-orange-500 drop-shadow-[0_0_25px_rgba(249,115,22,0.35)]">-X</span>
              </h1>

              <p className="mt-3 text-xs md:text-sm font-mono tracking-widest text-neutral-400 uppercase">
                Lunar Surface Visualization &amp; Analysis Platform
              </p>
            </motion.div>

            {/* Login Card */}
            <motion.div
              className="w-full bg-neutral-950/90 backdrop-blur-2xl border border-neutral-800/80 rounded-2xl p-6 shadow-2xl relative"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: isSubmitting ? 0 : 1, scale: isSubmitting ? 0.95 : 1, y: isSubmitting ? -10 : 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-800/80">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-semibold">
                  Mission Access Credentials
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  SYSTEM READY
                </span>
              </div>

              {error && (
                <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] font-mono text-red-400 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Operator Identifier
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={operatorId}
                      onChange={(e) => setOperatorId(e.target.value)}
                      placeholder="e.g. ISRO-CH2-EXP1"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-900/80 border border-neutral-700/60 rounded-lg text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Mission Access Key
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-900/80 border border-neutral-700/60 rounded-lg text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="text-[9px] font-mono text-neutral-500 bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-800/60 text-center">
                  <span className="text-orange-400 font-semibold">DEMO MODE:</span> Pre-configured credentials loaded. Press Enter to proceed.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    w-full py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider
                    bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-black
                    hover:from-orange-500 hover:to-amber-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]
                    active:scale-[0.98] transition-all duration-200 cursor-pointer
                    flex items-center justify-center gap-2 shadow-lg disabled:opacity-50
                  "
                >
                  <span>{isSubmitting ? 'INITIALIZING MISSION...' : 'ENTER MISSION'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>

          {/* Bottom Telemetry Footer */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono text-neutral-600 gap-2 border-t border-neutral-900/80 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span>SELENOGRAPHIC SPATIAL MAPPING • PDS4 CALIBRATED RASTERS</span>
            <span>CHANDRAYAAN-2 SCIENCE DATA ARCHIVE (ISSDC / PRADAN)</span>
            <span>SYSTEM VERSION 1.0.0</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
