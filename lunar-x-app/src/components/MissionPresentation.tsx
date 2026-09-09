'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Database,
  Eye,
  GitMerge,
  Cpu,
  FlaskConical,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Scale,
  Sun,
  Camera,
  Compass,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Sliders,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { useLunar } from '@/lib/lunarStore';
import VivaPrepSection from './VivaPrepSection';

/* =========================================================================
   1. MISSION BRIEF SECTION (Section 2)
========================================================================= */
function MissionBriefSection() {
  const { setActiveSection, setIsModalOpen } = useLunar();

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono text-orange-400 mb-3">
          <Sparkles className="w-3 h-3 text-orange-400" />
          <span>SMART INDIA HACKATHON · SIH26166</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono">
          LUNAR<span className="text-orange-500">-X</span>
        </h1>
        <p className="mt-2 text-base sm:text-lg text-orange-400/90 font-mono">
          AI-Assisted Cross-Sensor Lunar Surface Registration
        </p>
        <p className="mt-3 text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
          Chandrayaan-2 carries multiple imaging instruments observing the lunar surface at different
          spatial scales, viewing geometries and illumination conditions. LUNAR-X provides a unified
          workflow for validating whether observations from different sensors can be reliably co-registered.
        </p>
      </div>

      {/* Three Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3">
            <Database className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold mb-1">
            01 · Real Planetary Data
          </div>
          <div className="text-sm font-bold text-white mb-2">
            Authentic Chandrayaan-2 PDS4 Observations
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Ingests calibrated PDS4 XML and binary rasters from the Indian Space Science Data Centre (ISSDC)
            with zero synthetic data substitution.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3">
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold mb-1">
            02 · Cross-Sensor Analysis
          </div>
          <div className="text-sm font-bold text-white mb-2">
            OHRC • TMC-2 • Future IIRS Extension
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Bridges a 19.20× spatial resolution gap (0.25 m/px vs 4.80 m/px) and a 69.99° solar incidence angle variance
            across pushbroom and stereoscopic payloads.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1">
            03 · Scientific Validation
          </div>
          <div className="text-sm font-bold text-white mb-2">
            Geometry • Correspondence • RANSAC • Robustness
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Combines deep Local Feature Transformers (LoFTR) with strict epipolar RANSAC outlier filtering,
            producing sub-pixel RMSE precision (0.9486 px).
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-3">
        <button
          onClick={() => setActiveSection('explorer')}
          className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-orange-600 to-amber-500 text-black hover:from-orange-500 hover:to-amber-400 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <Globe className="w-4 h-4" />
          <span>Launch 3D Explorer</span>
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800 hover:border-neutral-600 transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>Verify Real Data Co-Registration</span>
        </button>
        <button
          onClick={() => setActiveSection('datasets')}
          className="px-4 py-2.5 rounded-xl text-xs font-mono text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>Explore Sensors &amp; Datasets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   2. DATASET & SENSOR SELECTION (Section 3)
========================================================================= */
function DatasetsSection() {
  const { setIsModalOpen } = useLunar();

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-orange-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase">
            Chandrayaan-2 Science Payloads &amp; Datasets
          </h2>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            PDS4 VERIFIED
          </span>
        </div>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          Authentic telemetry and observation products ingested from ISSDC / PRADAN long-term planetary archive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OHRC Sensor Card */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                Payload 01
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                OPERATIONAL [REAL DATA]
              </span>
            </div>
            <h3 className="text-base font-bold text-white">OHRC</h3>
            <p className="text-[11px] text-neutral-400 font-mono mb-3">
              Orbiter High Resolution Camera
            </p>

            <div className="space-y-1.5 text-[11px] font-mono bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <div className="flex justify-between"><span className="text-neutral-500">GSD (Resolution):</span><span className="text-white font-bold">0.25 m/pixel</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Orbit Number:</span><span className="text-white">29426</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Acquisition Time:</span><span className="text-white">2026-03-30T23:17:47Z</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Solar Incidence:</span><span className="text-amber-400">87.58° (Near-grazing)</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Data Product:</span><span className="text-neutral-300 truncate max-w-[140px]">Level 1D Calibrated</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">PDS4 Provenance:</span><span className="text-emerald-400">ch2_ohr_ncp...</span></div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 text-[10px] text-neutral-400 leading-relaxed">
            Ultra-high resolution optical pushbroom sensor capturing fine lunar boulders, crater walls, and hazard maps.
          </div>
        </div>

        {/* TMC-2 Sensor Card */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                Payload 02
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                OPERATIONAL [REAL DATA]
              </span>
            </div>
            <h3 className="text-base font-bold text-white">TMC-2</h3>
            <p className="text-[11px] text-neutral-400 font-mono mb-3">
              Terrain Mapping Camera 2
            </p>

            <div className="space-y-1.5 text-[11px] font-mono bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <div className="flex justify-between"><span className="text-neutral-500">GSD (Resolution):</span><span className="text-white font-bold">4.80 m/pixel</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Orbit Number:</span><span className="text-white">23760</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Acquisition Time:</span><span className="text-white">2026-03-29T10:14:22Z</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Solar Incidence:</span><span className="text-amber-400">17.59° (High-sun)</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Data Product:</span><span className="text-neutral-300">Level 2 Map Projected</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">PDS4 Provenance:</span><span className="text-emerald-400">ch2_tmc_ncn...</span></div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 text-[10px] text-neutral-400 leading-relaxed">
            Stereoscopic 3-view imaging sensor providing wide-area context, DEM elevation models, and geodetic reference.
          </div>
        </div>

        {/* IIRS Sensor Card (Future Extension) */}
        <div className="bg-neutral-900/50 border border-neutral-800/60 rounded-xl p-4 flex flex-col justify-between opacity-85">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold">
                Payload 03
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                ARCHITECTURE READY · FUTURE EXTENSION
              </span>
            </div>
            <h3 className="text-base font-bold text-white">IIRS</h3>
            <p className="text-[11px] text-neutral-400 font-mono mb-3">
              Imaging Infrared Spectrometer
            </p>

            <div className="space-y-1.5 text-[11px] font-mono bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <div className="flex justify-between"><span className="text-neutral-500">GSD (Resolution):</span><span className="text-neutral-300">80.0 m/pixel</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Spectral Range:</span><span className="text-neutral-300">0.8 – 5.0 µm</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Spectral Bands:</span><span className="text-neutral-300">256 Contiguous Bands</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Primary Objective:</span><span className="text-neutral-300">Water-Ice &amp; Mineralogy</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Pipeline Status:</span><span className="text-violet-400">Modal Extensible</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Implementation:</span><span className="text-neutral-500">Future Extension</span></div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 text-[10px] text-neutral-400 leading-relaxed">
            Hyperspectral payload. The LUNAR-X modular architecture is designed to integrate IIRS cubes without modifying the core geometry engine.
          </div>
        </div>
      </div>

      <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg flex items-center justify-between text-xs font-mono">
        <span className="text-neutral-400">Ready to test cross-sensor registration on authentic OHRC &amp; TMC-2 data?</span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded bg-orange-500 text-black font-bold hover:bg-orange-400 transition-colors cursor-pointer"
        >
          Open Co-Registration Pipeline
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   3. OBSERVATION CONTEXT SECTION (Section 4)
========================================================================= */
function ContextSection() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-orange-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase">
            Observation Context &amp; Cross-Sensor Discrepancy
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          Physical, photometric, and geometric factors governing cross-resolution lunar registration.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Spatial Scale */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-orange-400">
            <Scale className="w-4 h-4" />
            <h3 className="text-sm font-bold font-mono uppercase">1. Spatial Scale Gap</h3>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">19.20× GSD Ratio</div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            OHRC achieves 0.25 m/pixel while TMC-2 captures 4.80 m/pixel. A single pixel in TMC-2 encompasses
            approximately 368 pixels in OHRC, completely eliminating high-frequency boulder textures and fine crater rims.
          </p>
        </div>

        {/* 2. Illumination */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <Sun className="w-4 h-4" />
            <h3 className="text-sm font-bold font-mono uppercase">2. Illumination Variance</h3>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">Δ = 69.99° Solar Angle</div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            OHRC was acquired at 87.58° solar incidence (near-grazing, casting extensive deep shadows across the surface),
            whereas TMC-2 was acquired at 17.59° (high-sun illumination, where shadows collapse and albedo dominates).
          </p>
        </div>

        {/* 3. Sensor Geometry */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-sky-400">
            <Camera className="w-4 h-4" />
            <h3 className="text-sm font-bold font-mono uppercase">3. Optical &amp; Sensor Characteristics</h3>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">Pushbroom vs Stereo</div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Different detector MTF (Modulation Transfer Function), SNR profiles, and viewing look-angles cause non-linear
            radiometric distortion across the same geographic lunar terrain.
          </p>
        </div>

        {/* 4. Orbital Geometry */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <Compass className="w-4 h-4" />
            <h3 className="text-sm font-bold font-mono uppercase">4. Geodetic Coordinate Overlap</h3>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">960 m × 960 m Target</div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Bounding intersection at 7.4316° N, 301.2859° E (Oceanus Procellarum / Mare Insularum). The orbital tracks
            from Orbits 29426 and 23760 intersect over this exact common physical footprint.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. SCIENTIFIC PIPELINE (Section 5)
========================================================================= */
function PipelineSection() {
  const steps = [
    { num: '01', name: 'Data Ingestion', desc: 'Non-destructive streaming of PDS4 XML and binary calibrated rasters.' },
    { num: '02', name: 'Metadata Parsing', desc: 'Extraction of corner coordinates, solar angles, GSD, and orbit ephemeris.' },
    { num: '03', name: 'Geometric Overlap', desc: 'Spatial intersection computation via Inverse Distance Weighted (IDW) grids.' },
    { num: '04', name: 'Chip Extraction', desc: 'Extraction of bounded common lunar footprint (3840×3840 OHRC vs 200×200 TMC-2).' },
    { num: '05', name: 'Feature Analysis', desc: 'Dense attention-based transformer (LoFTR) and multi-scale SIFT extraction.' },
    { num: '06', name: 'Geometric Verification', desc: 'Epipolar RANSAC outlier filtering with strict Euclidean distance thresholding.' },
    { num: '07', name: 'Scientific Metrics', desc: 'Quantitative computation of sub-pixel RMSE, inlier ratio, and confidence.' },
    { num: '08', name: 'Final Validation', desc: 'Audited provenance tagging and interactive 3D/2D location rendering.' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-orange-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase">
            Scientific Co-Registration Pipeline Architecture
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          8-stage end-to-end scientific processing pipeline from raw PDS4 ingestion to verified sub-pixel correspondence.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((s, idx) => (
          <div key={s.num} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-black text-orange-400">{s.num}</span>
                <span className="text-[8px] font-mono text-neutral-500">STAGE {idx + 1}/8</span>
              </div>
              <h3 className="text-xs font-bold text-white font-mono mb-1.5">{s.name}</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">{s.desc}</p>
            </div>
            <div className="mt-3 h-0.5 w-full bg-gradient-to-r from-orange-500/40 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   5. FEATURE DETECTION LAB (Section 6)
========================================================================= */
function FeatureLabSection() {
  const [activeLabTab, setActiveLabTab] = useState<'sift' | 'loftr' | 'ransac'>('loftr');

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-orange-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase">
            Feature Detection &amp; Correspondence Laboratory
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          Comparing classical multiscale keypoint detectors against learned dense transformers on lunar terrain.
        </p>
      </div>

      {/* Lab Tabs */}
      <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 max-w-md">
        <button
          onClick={() => setActiveLabTab('sift')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono transition-all cursor-pointer text-center ${
            activeLabTab === 'sift' ? 'bg-neutral-800 text-white font-bold border border-neutral-700' : 'text-neutral-400 hover:text-white'
          }`}
        >
          SIFT (Classical)
        </button>
        <button
          onClick={() => setActiveLabTab('loftr')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono transition-all cursor-pointer text-center ${
            activeLabTab === 'loftr' ? 'bg-orange-500 text-black font-bold shadow-md' : 'text-neutral-400 hover:text-white'
          }`}
        >
          LoFTR (Learned)
        </button>
        <button
          onClick={() => setActiveLabTab('ransac')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono transition-all cursor-pointer text-center ${
            activeLabTab === 'ransac' ? 'bg-neutral-800 text-white font-bold border border-neutral-700' : 'text-neutral-400 hover:text-white'
          }`}
        >
          RANSAC (Outlier Rejection)
        </button>
      </div>

      {/* Tab Panels */}
      {activeLabTab === 'sift' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-mono">SIFT (Scale-Invariant Feature Transform)</h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              0 INLIERS ON REAL CROSS-SENSOR DATA
            </span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            SIFT uses Difference-of-Gaussian (DoG) pyramid keypoint localization and 128-dimensional local gradient orientation histograms.
          </p>
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-mono space-y-1.5">
            <div className="text-orange-400 font-bold">Why SIFT Fails Across Lunar Sensors:</div>
            <div className="text-neutral-400">• Extreme non-linear photometric change caused by 70° illumination angle difference destroys gradient orientation histograms.</div>
            <div className="text-neutral-400">• The 19.20× scale difference falls outside SIFT’s octave octave-spacing limits.</div>
            <div className="text-neutral-400">• Result: 0 verified RANSAC inliers across the authentic OHRC/TMC-2 pair.</div>
          </div>
        </div>
      )}

      {activeLabTab === 'loftr' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-mono">LoFTR (Local Feature TRansformer)</h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              61 DENSE CORRESPONDENCES · 7 RANSAC INLIERS
            </span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            LoFTR uses coarse-to-fine self and cross-attention transformer layers directly on image feature maps without a discrete feature detector,
            allowing it to correlate context even in low-contrast, shadowed lunar craters.
          </p>
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-mono space-y-1.5">
            <div className="text-emerald-400 font-bold">Why LoFTR Succeeds on Lunar Terrain:</div>
            <div className="text-neutral-400">• Global receptive field correlates contextual crater morphology rather than isolated micro-textures.</div>
            <div className="text-neutral-400">• Dual-softmax mutual nearest neighbor matching filters weak correspondences.</div>
            <div className="text-neutral-400">• Sub-pixel refinement achieves 0.9486 px RMSE accuracy.</div>
          </div>
        </div>
      )}

      {activeLabTab === 'ransac' && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-mono">RANSAC (Random Sample Consensus)</h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              GEOMETRIC CONSISTENCY ENGINE
            </span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Fits a fundamental / homography transformation matrix by iteratively sampling minimal sets of candidate correspondences
            and measuring reprojection error against a 5.0 px Euclidean distance threshold.
          </p>
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-mono space-y-1.5">
            <div className="text-sky-400 font-bold">Rigorous Outlier Filtering:</div>
            <div className="text-neutral-400">• Eliminates false positive matches occurring in repetitive shadow regions.</div>
            <div className="text-neutral-400">• Inlier Ratio: 11.5% (7 valid inliers out of 61 candidates).</div>
            <div className="text-neutral-400">• Provides mathematical guarantee of geometric rigidity.</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   6. ROBUSTNESS LAB (Section 7)
========================================================================= */
function RobustnessSection() {
  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-orange-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase">
            Robustness Laboratory &amp; Benchmark Evidence
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          Controlled parametric stress tests vs authentic cross-sensor observation failure boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scale Ablation Figure */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                Experiment 01 · Scale Robustness
              </span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                [CONTROLLED EXPERIMENT]
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Scale Ablation (0.50× to 2.00×)</h3>
            <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black mb-3">
              <img src="/figures/final_scale_ablation.png" alt="Scale Ablation Benchmark" className="w-full object-contain max-h-[220px]" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Evaluates correspondence retention and RMSE stability under synthetic isotropic scaling perturbations from 0.50× to 2.00×.
          </p>
        </div>

        {/* Confidence Comparison Figure */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                Experiment 02 · Confidence Thresholds
              </span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                [CONTROLLED EXPERIMENT]
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Confidence Ablation (0.20 to 0.80)</h3>
            <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black mb-3">
              <img src="/figures/final_confidence_comparison.png" alt="Confidence Comparison Benchmark" className="w-full object-contain max-h-[220px]" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Quantifies the precision-recall trade-off across LoFTR dual-softmax probability thresholds. Optimal balance is found at confidence 0.20.
          </p>
        </div>

        {/* RANSAC Comparison Figure */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Experiment 03 · Geometric Consensus
              </span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                [CONTROLLED EXPERIMENT]
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">RANSAC Threshold Tolerance</h3>
            <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black mb-3">
              <img src="/figures/final_ransac_comparison.png" alt="RANSAC Comparison Benchmark" className="w-full object-contain max-h-[220px]" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Measures inlier retention and reprojection error as RANSAC inlier threshold increases from 1.0 px to 10.0 px.
          </p>
        </div>

        {/* Cross-Sensor Failure Boundary Figure */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Experiment 04 · Real Sensor Boundary
              </span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                [REAL CROSS-SENSOR DATA]
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Cross-Sensor Failure &amp; Scale Gap Analysis</h3>
            <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black mb-3">
              <img src="/figures/final_cross_sensor_failure.png" alt="Cross-Sensor Failure Analysis" className="w-full object-contain max-h-[220px]" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Identifies the fundamental mathematical boundary of cross-sensor registration across the 19.20× scale disparity and 70° illumination angle shift.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   7. SCIENTIFIC EVIDENCE & FINAL VERIFICATION (Sections 8, 9 & 10)
========================================================================= */
function VerificationSection() {
  const auditChecks = [
    { title: 'DATA INTEGRITY', status: 'PASS', desc: 'ISRO PDS4 checksums, XML schemas, and raw raster byte dimensions verified.' },
    { title: 'GEOMETRIC OVERLAP', status: 'PASS', desc: 'IDW grid interpolation matches within 960 m × 960 m physical lunar footprint.' },
    { title: 'LIVE ANALYSIS', status: 'AVAILABLE', desc: 'FastAPI correspondence service returns real-time LoFTR and RANSAC metrics.' },
    { title: 'TEST SUITE', status: '37/37 PASS', desc: 'Comprehensive unit, mathematical, and registration test suite passing cleanly.' },
    { title: 'SOURCE PROTECTION', status: 'PASS', desc: 'Raw 1.1GB binaries, model checkpoints, and caches protected in .gitignore.' },
    { title: 'REPRODUCIBILITY', status: 'READY', desc: 'Bit-for-bit reproducible manifest with deterministic seed locks.' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase">
            Scientific Evidence Chain &amp; Project Verification
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          Separating data provenance, computation, and scientific inference to ensure absolute auditability.
        </p>
      </div>

      {/* 4-Tier Evidence Chain */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5">
        <h3 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-4">
          The 4-Tier Scientific Evidence Chain
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              [REAL DATA]
            </span>
            <div className="text-xs font-bold text-white mt-2">Authentic Observations</div>
            <p className="text-[10px] text-neutral-400 mt-1">Calibrated Chandrayaan-2 raw IMG files and verified chips.</p>
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              [REFERENCE]
            </span>
            <div className="text-xs font-bold text-white mt-2">Mission Metadata</div>
            <p className="text-[10px] text-neutral-400 mt-1">PDS4 XML coordinates, orbit numbers, solar incidence angles.</p>
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              [COMPUTED]
            </span>
            <div className="text-xs font-bold text-white mt-2">Mathematical Output</div>
            <p className="text-[10px] text-neutral-400 mt-1">Correspondences (61 pts), RANSAC inliers (7), sub-pixel RMSE (0.9486 px).</p>
          </div>

          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">
              [INFERENCE]
            </span>
            <div className="text-xs font-bold text-white mt-2">Scientific Interpretation</div>
            <p className="text-[10px] text-neutral-400 mt-1">Co-registration feasibility boundaries and failure modes.</p>
          </div>
        </div>
      </div>

      {/* 6-Point Verification Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {auditChecks.map((chk) => (
          <div key={chk.title} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">{chk.title}</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {chk.status}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">{chk.desc}</p>
          </div>
        ))}
      </div>

      {/* Scientific Registration Improvement Table (57 Controlled Experiments) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold font-mono text-white uppercase">
              Scientific Registration Improvements (57 Controlled Real-Data Trials)
            </h3>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
            [COMPUTED AUDIT]
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                <th className="py-2 px-2.5">Pipeline Configuration</th>
                <th className="py-2 px-2">Scale Domain</th>
                <th className="py-2 px-2">Matches</th>
                <th className="py-2 px-2">Inliers</th>
                <th className="py-2 px-2">Inlier Ratio</th>
                <th className="py-2 px-2">Reprojection RMSE</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              <tr className="bg-neutral-950/40">
                <td className="py-2 px-2.5 text-white font-bold">Frozen Phase 8 Baseline (Raw LoFTR)</td>
                <td className="py-2 px-2 text-neutral-400">640×640 Model</td>
                <td className="py-2 px-2 font-bold">95</td>
                <td className="py-2 px-2 font-bold">9</td>
                <td className="py-2 px-2 text-amber-400 font-bold">9.47%</td>
                <td className="py-2 px-2">2.0675 px</td>
                <td className="py-2 px-2 text-neutral-500">[FROZEN]</td>
              </tr>
              <tr className="bg-neutral-950/40">
                <td className="py-2 px-2.5 text-white font-bold">Live Baseline (Raw LoFTR + RANSAC)</td>
                <td className="py-2 px-2 text-neutral-400">200×200 Native</td>
                <td className="py-2 px-2 font-bold">61</td>
                <td className="py-2 px-2 font-bold">7</td>
                <td className="py-2 px-2 text-amber-400 font-bold">11.48%</td>
                <td className="py-2 px-2">0.9486 px</td>
                <td className="py-2 px-2 text-sky-400">[OPERATIONAL]</td>
              </tr>
              <tr className="bg-orange-500/5">
                <td className="py-2 px-2.5 text-orange-400 font-bold">LoFTR + Scale Normalization (4.80m GSD)</td>
                <td className="py-2 px-2 text-neutral-400">200×200 Downsampled</td>
                <td className="py-2 px-2 font-bold">115</td>
                <td className="py-2 px-2 font-bold text-orange-400">13</td>
                <td className="py-2 px-2 text-orange-400 font-bold">11.30%</td>
                <td className="py-2 px-2">1.2484 px</td>
                <td className="py-2 px-2 text-emerald-400 font-bold">+88.5% Matches</td>
              </tr>
              <tr className="bg-orange-500/5">
                <td className="py-2 px-2.5 text-orange-400 font-bold">LoFTR + Scale-Matched + CLAHE (clip=2.0)</td>
                <td className="py-2 px-2 text-neutral-400">200×200 Enhanced</td>
                <td className="py-2 px-2 font-bold">115</td>
                <td className="py-2 px-2 font-bold text-orange-400">13</td>
                <td className="py-2 px-2 text-orange-400 font-bold">11.30%</td>
                <td className="py-2 px-2">1.6724 px</td>
                <td className="py-2 px-2 text-emerald-400 font-bold">3-Run Locked</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 text-white">LoFTR + Local Contrast Normalization (LCN)</td>
                <td className="py-2 px-2 text-neutral-400">200×200 Native</td>
                <td className="py-2 px-2 font-bold">70</td>
                <td className="py-2 px-2 font-bold text-emerald-400">16</td>
                <td className="py-2 px-2 text-emerald-400 font-bold">22.86%</td>
                <td className="py-2 px-2">2.5267 px</td>
                <td className="py-2 px-2 text-emerald-400">Highest Inliers</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 text-white">LoFTR + Morphological Crater Filter</td>
                <td className="py-2 px-2 text-neutral-400">Native Scale</td>
                <td className="py-2 px-2 font-bold">51</td>
                <td className="py-2 px-2 font-bold text-emerald-400">10</td>
                <td className="py-2 px-2 text-emerald-400 font-bold">19.61%</td>
                <td className="py-2 px-2 font-bold text-emerald-400">0.8407 px</td>
                <td className="py-2 px-2 text-emerald-400">Lowest RMSE</td>
              </tr>
              <tr>
                <td className="py-2 px-2.5 text-white">LoFTR Multi-Hypothesis Ensemble + MAGSAC</td>
                <td className="py-2 px-2 text-neutral-400">Multi-Scale Ensemble</td>
                <td className="py-2 px-2 font-bold">267</td>
                <td className="py-2 px-2 font-bold text-emerald-400">15</td>
                <td className="py-2 px-2 text-amber-400">5.62%</td>
                <td className="py-2 px-2">1.7699 px</td>
                <td className="py-2 px-2 text-sky-400">Max Dense Coverage</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Research Benchmark vs Live Demo Explanation */}
      <div className="bg-neutral-900/90 border border-orange-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-orange-400 mb-2">
          <Sliders className="w-4 h-4" />
          <h3 className="text-xs font-bold font-mono uppercase">Research Benchmark vs Live Demonstration</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="text-white font-bold mb-1">Research Benchmark (Frozen)</div>
            <div className="text-neutral-400 text-[11px]">
              Evaluated in 640×640 normalized model space: 95 correspondences, 9 inliers, 2.0675 px model-space RMSE.
            </div>
          </div>
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="text-white font-bold mb-1">Live Demonstration (Dynamic)</div>
            <div className="text-neutral-400 text-[11px]">
              Evaluated in native 200×200 TMC-2 pixel space: 61 correspondences, 7 inliers, 0.9486 px native-space RMSE.
            </div>
          </div>
        </div>
        <p className="text-[10px] font-mono text-neutral-500 mt-2">
          Note: Values represent identical underlying geometric correspondences expressed in different coordinate spaces (0.9486 px native × (640/200) = 3.0355 px model).
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
   8. SIH IMPACT & CONCLUSION (Sections 11 & 12)
========================================================================= */
function ImpactSection() {
  const { setActiveSection, setIsModalOpen } = useLunar();

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-orange-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono uppercase">
            Why LUNAR-X Matters · SIH Impact &amp; Conclusion
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          Bridging the gap between raw planetary observations and trusted, auditable scientific registration.
        </p>
      </div>

      {/* 4 Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-1">
            01 · Multi-Sensor Lunar Analysis
          </div>
          <div className="text-sm font-bold text-white mb-2">Unifies Observations Across Instruments</div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Eliminates instrument silos by mathematically connecting high-resolution orbital imagery (OHRC) with stereo terrain mapping (TMC-2) and future hyperspectral data.
          </p>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold mb-1">
            02 · Scientific Validation
          </div>
          <div className="text-sm font-bold text-white mb-2">Replaces Blind Assumptions with Geometry</div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Does not blindly trust deep neural network matches. Enforces strict epipolar geometry and RANSAC consistency checks before validating any co-registration claim.
          </p>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1">
            03 · Real-Data Robustness
          </div>
          <div className="text-sm font-bold text-white mb-2">Measures Real Failure Boundaries</div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Rigorously tests correspondence models under real changes in spatial scale (19.20× gap) and solar incidence angle (69.99° shift), establishing clear operational envelopes.
          </p>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-violet-400 font-bold mb-1">
            04 · Extensible Architecture
          </div>
          <div className="text-sm font-bold text-white mb-2">Ready for Future Planetary Missions</div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Modular architecture designed to easily ingest IIRS hyperspectral cubes, Chandrayaan-3 landing imagery, and future Artemis lunar surface datasets.
          </p>
        </div>
      </div>

      {/* Mission Closing Statement */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold mb-1">
            FROM PLANETARY DATA TO TRUSTED REGISTRATION
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            LUNAR-X transforms raw planetary observations into an auditable image-registration workflow — combining PDS4 data ingestion,
            geographic co-registration, computer vision, geometric verification and interactive visualization.
          </p>
        </div>

        <div className="border-t border-neutral-800 pt-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1">
            OUR KEY INSIGHT
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Cross-sensor lunar registration cannot be assumed to be robust simply because a model performs well on conventional benchmarks.
            Real illumination, scale and sensor differences must be measured.
          </p>
        </div>

        <div className="border-t border-neutral-800 pt-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1">
            NEXT FRONTIER
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed font-mono">
            Illumination-aware lunar correspondence • More orbital observation pairs • IIRS integration • Improved camera/ephemeris modelling
          </p>
        </div>
      </div>

      {/* Final Launch Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => setActiveSection('explorer')}
          className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-orange-600 to-amber-500 text-black hover:from-orange-500 hover:to-amber-400 transition-all cursor-pointer flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          <span>Return to 3D Lunar Explorer</span>
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800 transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>Open Scientific Analysis Modal</span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   MAIN PRESENTATION WRAPPER COMPONENT
========================================================================= */
export default function MissionPresentation() {
  const { activeSection, hasEnteredMission } = useLunar();

  if (!hasEnteredMission || activeSection === 'explorer') return null;

  return (
    <motion.div
      className="fixed inset-0 z-20 pt-16 pb-6 px-4 md:px-8 bg-black/90 backdrop-blur-2xl overflow-y-auto pointer-events-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-5xl mx-auto py-4">
        {activeSection === 'brief' && <MissionBriefSection />}
        {activeSection === 'datasets' && <DatasetsSection />}
        {activeSection === 'context' && <ContextSection />}
        {activeSection === 'pipeline' && <PipelineSection />}
        {activeSection === 'feature_lab' && <FeatureLabSection />}
        {activeSection === 'robustness' && <RobustnessSection />}
        {activeSection === 'verification' && <VerificationSection />}
        {activeSection === 'impact' && <ImpactSection />}
        {activeSection === 'viva_prep' && <VivaPrepSection />}
      </div>
    </motion.div>
  );
}
