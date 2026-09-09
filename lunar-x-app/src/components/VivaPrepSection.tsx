'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  Database,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  Award,
  Terminal,
  FileCode,
  Zap,
  Activity,
  HardDrive,
  Copy,
  Printer,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useLunar } from '@/lib/lunarStore';

/* =========================================================================
   DATA DEFINITIONS FOR VIVA / JUDGE PREPARATION
========================================================================= */

interface TechItem {
  name: string;
  category: string;
  what: string;
  why: string;
  where: string;
  icon: string;
}

const BACKEND_TECHNOLOGIES: TechItem[] = [
  {
    name: 'Python 3.13',
    category: 'Core Language',
    what: 'High-level programming language with extensive scientific computing ecosystem.',
    why: 'Provides native integration with PyTorch, OpenCV, NumPy, and planetary data parsing libraries.',
    where: 'The entire backend computation engine and API service.',
    icon: '🐍',
  },
  {
    name: 'FastAPI',
    category: 'Web Framework',
    what: 'Modern, high-performance asynchronous web framework for building APIs with Python.',
    why: 'Provides sub-millisecond request routing, automatic OpenAPI/Swagger documentation, and native Pydantic validation.',
    where: 'API routing in backend/app/api/routes.py for /health, /datasets, and /correspondence/match-images.',
    icon: '⚡',
  },
  {
    name: 'Uvicorn',
    category: 'ASGI Server',
    what: 'Lightning-fast ASGI (Asynchronous Server Gateway Interface) web server implementation.',
    why: 'Runs FastAPI in an asynchronous event loop, serving concurrent image matching requests without blocking.',
    where: 'Server entrypoint running at http://127.0.0.1:8000.',
    icon: '🚀',
  },
  {
    name: 'NumPy',
    category: 'Array Computing',
    what: 'Fundamental package for N-dimensional array mathematics and vectorized operations.',
    why: 'Performs ultra-fast array manipulations, matrix math, coordinate conversions, and contrast stretching in C.',
    where: 'Preprocessing, image normalization, homography transformations, and RMSE computation.',
    icon: '🔢',
  },
  {
    name: 'NumPy memmap',
    category: 'Large Data Handling',
    what: 'Memory-mapped file array reading data directly from disk without loading into RAM.',
    why: 'Chandrayaan-2 PDS4 rasters are 1.03 GB (91,971 lines). Loading them into RAM would crash standard servers.',
    where: 'backend/app/services/image_loader.py for non-destructive, memory-safe lunar chip extraction.',
    icon: '💾',
  },
  {
    name: 'OpenCV (cv2)',
    category: 'Computer Vision',
    what: 'Industry-standard open-source computer vision and image processing library.',
    why: 'Provides high-speed image decoding, SIFT feature extraction, BFMatcher/Flann, CLAHE, and RANSAC/MAGSAC estimators.',
    where: 'SIFT pipeline, image preprocessing transforms, and cv2.findHomography / cv2.USAC_MAGSAC.',
    icon: '👁️',
  },
  {
    name: 'PyTorch + Kornia',
    category: 'Deep Learning',
    what: 'Leading tensor computation and deep learning framework with differentiable computer vision (Kornia).',
    why: 'Executes the pre-trained LoFTR (Local Feature Transformer) attention network on raw tensor inputs.',
    where: 'backend/app/services/loftr_correspondence.py for dense cross-attention feature correlation.',
    icon: '🔥',
  },
  {
    name: 'Pydantic v2',
    category: 'Data Validation',
    what: 'Data parsing, schema enforcement, and type validation library using Python type hints.',
    why: 'Guarantees strict runtime validation of PDS4 metadata, chip coordinates, and correspondence responses.',
    where: 'backend/app/models/schemas.py defining all structured API responses.',
    icon: '🛡️',
  },
  {
    name: 'PDS4 / XML Processing',
    category: 'Planetary Ingestion',
    what: 'Standardized parsing of NASA/ISRO Planetary Data System (PDS4) XML product labels.',
    why: 'Extracts critical planetary parameters: corner coordinates, solar incidence/azimuth, orbit, and GSD resolution.',
    where: 'backend/app/services/pds4_reader.py parsing official Chandrayaan-2 labels.',
    icon: '📜',
  },
  {
    name: 'Apple MPS (Metal)',
    category: 'Hardware Acceleration',
    what: 'Metal Performance Shaders backend accelerating PyTorch tensors directly on Apple Silicon GPU.',
    why: 'Accelerates LoFTR transformer inference from ~8000ms on CPU down to ~1100ms on Apple MPS.',
    where: 'Hardware device selector in LoFTRCorrespondenceEngine (MPS -> CUDA -> CPU fallback).',
    icon: '⚙️',
  },
];

interface QAItem {
  id: string;
  category: string;
  q: string;
  a: string;
  keyPoints?: string[];
  isDifficult?: boolean;
}

const VIVA_QUESTIONS: QAItem[] = [
  // BASIC
  {
    id: 'b1',
    category: 'BASIC',
    q: 'What is LUNAR-X in simple terms?',
    a: 'LUNAR-X is an AI-assisted planetary image-analysis platform for cross-sensor lunar surface registration using authentic Chandrayaan-2 observations. It combines PDS4 metadata interpretation, large-raster processing, geographic overlap analysis, SIFT/LoFTR correspondence, RANSAC geometric validation, and quantitative scientific metrics.',
    keyPoints: ['Planetary remote sensing', 'Authentic Chandrayaan-2 data', 'Deep learning + geometric consensus'],
  },
  {
    id: 'b2',
    category: 'BASIC',
    q: 'Where does your data come from?',
    a: 'Authentic Chandrayaan-2 planetary observation products downloaded from the official ISRO ISSDC / PRADAN archive, specifically OHRC (Orbiter High Resolution Camera) and TMC-2 (Terrain Mapping Camera 2) for our demonstrated cross-sensor experiment.',
    keyPoints: ['ISRO ISSDC / PRADAN archive', 'Calibrated Level-1D / Level-2 products', 'Zero synthetic/fabricated imagery'],
  },
  {
    id: 'b3',
    category: 'BASIC',
    q: 'What is PDS4?',
    a: 'PDS4 is the Planetary Data System version 4 standard used worldwide by NASA, ISRO, and ESA to structure planetary science data, calibrated imagery, and associated observational metadata.',
    keyPoints: ['International planetary standard', 'XML label + Binary raster', 'Self-describing archival format'],
  },
  {
    id: 'b4',
    category: 'BASIC',
    q: 'What is the difference between XML and IMG files in PDS4?',
    a: 'The XML file contains structured product metadata (corner coordinates, solar angles, orbit numbers, raster dimensions, and byte offsets); the IMG file contains the raw uncompressed raster pixel data.',
    keyPoints: ['XML = Metadata description', 'IMG = Raw binary pixels', 'Coupled planetary product'],
  },

  // BACKEND & LARGE DATA
  {
    id: 'be1',
    category: 'BACKEND',
    q: 'What technologies did you use in the backend?',
    a: 'We use Python with FastAPI, NumPy, OpenCV, PyTorch, Pydantic, and PDS4/XML processing. Uvicorn runs the FastAPI application asynchronously, and Apple MPS provides GPU acceleration for PyTorch operations.',
    keyPoints: ['FastAPI asynchronous routing', 'PyTorch + MPS acceleration', 'OpenCV + NumPy scientific stack'],
  },
  {
    id: 'be2',
    category: 'BACKEND',
    q: 'Why do you use numpy.memmap?',
    a: 'Because scientific planetary rasters can be multi-gigabyte (our OHRC raster is 1.03 GB with 91,971 lines). Memory mapping (np.memmap) creates a pointer directly to the file on disk, letting us read only the required 3840×3840 footprint into RAM in milliseconds without loading the whole 1.03 GB file.',
    keyPoints: ['Disk-backed memory mapping', 'Zero RAM bloat', 'O(1) memory overhead'],
  },
  {
    id: 'be3',
    category: 'BACKEND',
    q: 'How do you prevent memory leaks when processing large rasters?',
    a: 'By memory-mapping the file in read-only copy-on-write mode (`r`), reading sliced byte slices, converting only the small extracted chip to an 8-bit array, and immediately releasing memory buffers after inference.',
  },

  // AI / COMPUTER VISION
  {
    id: 'ai1',
    category: 'AI / COMPUTER VISION',
    q: 'What is SIFT?',
    a: 'SIFT (Scale-Invariant Feature Transform) is a classical computer-vision algorithm that detects scale-space extrema (Difference-of-Gaussians) and computes 128-dimensional gradient orientation histograms for local keypoint matching.',
    keyPoints: ['Classical DoG detector', '128-D gradient histogram', 'Fails under severe 70° illumination shift'],
  },
  {
    id: 'ai2',
    category: 'AI / COMPUTER VISION',
    q: 'What is LoFTR?',
    a: 'LoFTR (Local Feature TRansformer) is a learned deep neural network that predicts dense pixel correspondences directly from image pairs using self- and cross-attention transformer layers, without requiring explicit keypoint detection.',
    keyPoints: ['Detector-free dense matching', 'Self & Cross attention', 'Coarse-to-fine sub-pixel regression'],
  },
  {
    id: 'ai3',
    category: 'AI / COMPUTER VISION',
    q: 'Did you invent or train LoFTR?',
    a: 'No. LoFTR is an established open-source transformer architecture from Sun et al. Our contribution is integrating, evaluating, and bounding its performance on authentic planetary observations within an auditable, reproducible remote-sensing pipeline.',
    keyPoints: ['Pre-trained architecture', 'Planetary domain adaptation & evaluation', 'Honest scientific attribution'],
  },
  {
    id: 'ai4',
    category: 'AI / COMPUTER VISION',
    q: 'Why does LoFTR outperform SIFT on lunar terrain?',
    a: 'SIFT relies on local pixel intensity gradients, which invert when the solar incidence angle changes by 70°. LoFTR uses deep self- and cross-attention with a global receptive field, allowing it to correlate macro-topographical crater shapes even when local shadows flip.',
    keyPoints: ['Global context vs local gradients', 'Attention across illumination gaps', 'Dense coverage on smooth maria'],
  },

  // MATHEMATICS & RANSAC
  {
    id: 'math1',
    category: 'MATHEMATICS',
    q: 'What is RANSAC and why is it necessary?',
    a: 'RANSAC (RANdom SAmple Consensus) is an iterative non-deterministic algorithm used to estimate mathematical model parameters from data containing a high fraction of outliers. It selects random minimal point sets, computes candidate homographies, and finds the consensus model with the most inliers within a threshold (5.0 px).',
    keyPoints: ['Outlier rejection', 'Homography estimation', 'Robust to >80% outlier contamination'],
  },
  {
    id: 'math2',
    category: 'MATHEMATICS',
    q: 'What is the RANSAC Inlier Ratio formula?',
    a: 'Inlier Ratio (%) = (Number of RANSAC Inliers / Total Candidate Correspondences) × 100. For our frozen Phase 8 experiment: (9 / 95) × 100 = 9.47%.',
    keyPoints: ['Inliers / Total Matches × 100', 'Measures geometric consensus', 'NOT overall system accuracy'],
  },
  {
    id: 'math3',
    category: 'MATHEMATICS',
    q: 'What is Reprojection RMSE and how is it calculated?',
    a: 'Root Mean Square Error (RMSE) measures the average Euclidean pixel distance between transformed source points (H * p_src) and actual destination points (p_dst) for all verified inliers: RMSE = sqrt((1/N) * sum(||H*p_i - q_i||^2)).',
    keyPoints: ['Sub-pixel geometric residual', 'Evaluated only on inliers', 'Expressed in pixels'],
  },
  {
    id: 'math4',
    category: 'MATHEMATICS',
    q: 'Why are the Phase 8 RMSE (2.0675 px) and Live Demo RMSE (0.9486 px) different?',
    a: 'They are measured in different coordinate domains: Phase 8 was evaluated in 640×640 normalized model space (where 1 pixel is smaller); the Live Demo is evaluated in native 200×200 TMC-2 pixel space. 0.9486 px native × (640 / 200) = 3.0355 px model space. They represent identical underlying geometry.',
    keyPoints: ['Different coordinate domains', '640×640 model vs 200×200 native', 'Never present as identical measurements'],
  },

  // SCIENTIFIC VALIDATION
  {
    id: 'sv1',
    category: 'SCIENTIFIC VALIDATION',
    q: 'What does 9.47% mean? Why is it so low?',
    a: '9.47% is the RANSAC inlier ratio for the frozen Phase 8 real OHRC–TMC-2 experiment (9 verified inliers from 95 candidate matches). It is NOT the accuracy of LUNAR-X. It reflects the extreme physical difficulty of registering images with a 19.20× spatial scale disparity and a 69.99° solar incidence shift.',
    keyPoints: ['Geometric inlier ratio', 'Physical difficulty reflection', 'Never label as "accuracy"'],
  },
  {
    id: 'sv2',
    category: 'SCIENTIFIC VALIDATION',
    q: 'Why is quantifying failure scientifically useful?',
    a: 'In planetary science and autonomous lunar landing, blindly trusting false correspondences can cause mission failure. Quantifying failure establishes the exact physical boundary where remote sensing algorithms break down, preventing dangerous over-reliance on AI.',
    keyPoints: ['Establishes operational boundaries', 'Prevents false mission confidence', 'Essential for trusted landing navigation'],
  },
  {
    id: 'sv3',
    category: 'SCIENTIFIC VALIDATION',
    q: 'Does 34/34 (or 37/37) tests passing mean 100% scientific accuracy?',
    a: 'No. Test pass rates verify software correctness (parsers, math functions, API routes, memory limits). Scientific accuracy is an empirical measurement of planetary terrain registration under physical observation conditions. Software reliability and scientific accuracy are distinct concepts.',
    keyPoints: ['Software correctness != Empirical accuracy', 'Unit test behavior vs Real physics', 'Transparent scientific posture'],
  },
  {
    id: 'sv4',
    category: 'SCIENTIFIC VALIDATION',
    q: 'Is IIRS (Imaging Infra-Red Spectrometer) implemented?',
    a: 'IIRS is represented as an "Architecture Ready · Future Extension" in LUNAR-X. The demonstrated, verified cross-sensor experiments specifically validate OHRC and TMC-2.',
    keyPoints: ['Architecture ready extension', 'Not claimed as completed match', 'Transparent roadmap'],
  },

  // DIFFICULT QUESTIONS
  {
    id: 'dq1',
    category: 'DIFFICULT QUESTIONS',
    isDifficult: true,
    q: 'Why should we trust your correspondences if the inlier ratio is only ~10%?',
    a: 'Because every validated inlier has survived RANSAC geometric consensus with an epipolar reprojection tolerance of 5.0 pixels, achieving a sub-pixel RMSE of 0.9486 px. We do not trust raw correspondences; we trust the verified geometric consensus.',
    keyPoints: ['RANSAC consensus filtering', 'Sub-pixel reprojection RMSE < 1.0 px', 'Strict mathematical verification'],
  },
  {
    id: 'dq2',
    category: 'DIFFICULT QUESTIONS',
    isDifficult: true,
    q: 'How do you know two images show the same terrain without ground truth GPS?',
    a: 'Through official ISRO PDS4 Ground Coordinate Grids (g_grd_d18.csv) and orbital ephemeris. We perform bi-directional forward/inverse bilinear interpolation to prove both sensors intersect over 7.4316° N, 301.2859° E (a 960m × 960m geographic footprint).',
    keyPoints: ['Official ISDA coordinate grid tie-points', 'Bilinear selenographic localization', 'Calculated 960m × 960m intersection'],
  },
  {
    id: 'dq3',
    category: 'DIFFICULT QUESTIONS',
    isDifficult: true,
    q: 'Why doesn’t LoFTR solve cross-sensor registration automatically?',
    a: 'LoFTR was trained primarily on terrestrial RGB images (MegaDepth/ScanNet) with moderate illumination and scale changes. When exposed to lunar extremes (19.20× scale jump and near-grazing 87.58° cast shadows), standard deep features degrade without scale normalization and photometric preconditioning.',
    keyPoints: ['Terrestrial training domain gap', 'Airless planetary photometric effects', 'Necessity of preconditioning'],
  },
  {
    id: 'dq4',
    category: 'DIFFICULT QUESTIONS',
    isDifficult: true,
    q: 'Why not simply use camera pose and orbital GPS for direct registration?',
    a: 'Orbital spacecraft ephemeris on the Moon has pointing uncertainties of tens to hundreds of meters. Optical cross-sensor co-registration is necessary to refine alignments down to sub-pixel precision for DEM generation and landing hazard mapping.',
    keyPoints: ['Orbital jitter & pointing error', 'Sub-pixel DEM refinement requirement', 'Hazard map alignment'],
  },
  {
    id: 'dq5',
    category: 'DIFFICULT QUESTIONS',
    isDifficult: true,
    q: 'How would you improve the registration results in future work?',
    a: '1. Ingest digital elevation models (DEM) for terrain ray-casting to simulate illumination conditions. 2. Fine-tune LoFTR on synthetic lunar regolith renders (e.g. LROC/Kaguya datasets). 3. Implement coarse-to-fine multi-scale pyramid warping with USAC_MAGSAC.',
    keyPoints: ['DEM-based illumination synthesis', 'Planetary synthetic fine-tuning', 'Multi-scale pyramid warping'],
  },
];

/* =========================================================================
   COMPONENT: VIVA / JUDGE PREPARATION SECTION
========================================================================= */

export default function VivaPrepSection() {
  const { setActiveSection, setIsModalOpen } = useLunar();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedQa, setExpandedQa] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'30s' | 'flow' | 'tech' | 'data' | 'cv' | 'math' | 'results' | 'qa' | 'defense' | 'pitch'>('30s');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['ALL', 'BASIC', 'BACKEND', 'AI / COMPUTER VISION', 'PLANETARY DATA', 'MATHEMATICS', 'SCIENTIFIC VALIDATION', 'DIFFICULT QUESTIONS'];

  const filteredQuestions = useMemo(() => {
    return VIVA_QUESTIONS.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchQuery =
        searchQuery === '' ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.keyPoints && item.keyPoints.some((kp) => kp.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchCat && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono text-orange-400">
            <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
            <span>SIH26166 · VIVA &amp; JUDGE DEFENSE MODULE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-[10px] font-mono flex items-center gap-1.5 cursor-pointer hover:bg-neutral-800 transition-colors"
            >
              <Printer className="w-3 h-3 text-orange-400" />
              <span>Print / Save Study Guide</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight uppercase">
          Viva &amp; Technical Evaluation Master Guide
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          Everything the LUNAR-X team needs to explain, defend, and demonstrate the planetary co-registration platform.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 text-xs font-mono">
        {[
          { id: '30s', label: '30s Pitch', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'flow', label: 'System Flow', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'tech', label: 'Backend Stack', icon: <Terminal className="w-3.5 h-3.5" /> },
          { id: 'data', label: 'Data & Memmap', icon: <HardDrive className="w-3.5 h-3.5" /> },
          { id: 'cv', label: 'SIFT vs LoFTR', icon: <Cpu className="w-3.5 h-3.5" /> },
          { id: 'math', label: 'RANSAC & RMSE', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'results', label: 'Verified Numbers', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          { id: 'qa', label: 'Judge Q&A', icon: <HelpCircle className="w-3.5 h-3.5" /> },
          { id: 'defense', label: 'Defense Protocol', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { id: 'pitch', label: '2-Min Pitch', icon: <Award className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-orange-500 text-black font-bold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* =========================================================================
         TAB 1: 30-SECOND PITCH
      ========================================================================= */}
      {activeTab === '30s' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gradient-to-br from-orange-500/10 via-neutral-900/90 to-neutral-950 border border-orange-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-mono uppercase font-bold mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Official 30-Second Elevator Pitch</span>
            </div>

            <blockquote className="text-sm sm:text-base text-neutral-100 font-sans leading-relaxed border-l-2 border-orange-500 pl-4 py-1 italic mb-4">
              &quot;LUNAR-X is an AI-assisted planetary image-analysis platform for cross-sensor lunar surface registration using authentic Chandrayaan-2 observations. It combines PDS4 metadata interpretation, large-raster processing, geographic overlap analysis, SIFT/LoFTR correspondence, RANSAC geometric validation and quantitative scientific metrics.&quot;
            </blockquote>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800/80 text-xs font-mono">
              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800">
                <span className="text-orange-400 font-bold block mb-1">1. Real Planetary Data</span>
                <span className="text-neutral-400 text-[11px]">Calibrated ISRO PDS4 observations (0.25m OHRC &amp; 4.80m TMC-2).</span>
              </div>
              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800">
                <span className="text-sky-400 font-bold block mb-1">2. Learned Attention</span>
                <span className="text-neutral-400 text-[11px]">LoFTR transformers bridge the 70° solar incidence illumination gap.</span>
              </div>
              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800">
                <span className="text-emerald-400 font-bold block mb-1">3. Geometric Truth</span>
                <span className="text-neutral-400 text-[11px]">RANSAC consensus &amp; sub-pixel RMSE reject hallucinated matches.</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 2: COMPLETE SYSTEM FLOW
      ========================================================================= */}
      {activeTab === 'flow' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-2">
              End-to-End System Processing Pipeline
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Click any stage below to inspect its exact technical role and implementation file.
            </p>

            <div className="space-y-2">
              {[
                { stage: '01', title: 'Authentic Chandrayaan-2 Data', desc: 'Raw archives downloaded from ISRO ISSDC (Level-1D & Level-2 products).' },
                { stage: '02', title: 'PDS4 XML + IMG Separation', desc: 'XML holds metadata schema; IMG holds binary 8-bit/16-bit raster pixels.' },
                { stage: '03', title: 'Metadata Parsing (pds4_reader.py)', desc: 'Extracts solar angles (87.58° vs 17.59°), GSD (0.25m vs 4.80m), and orbit numbers.' },
                { stage: '04', title: 'Large Raster Access via np.memmap', desc: 'Opens 1.03 GB binary file without loading into RAM; reads memory-safe slices.' },
                { stage: '05', title: 'Ground Coordinate Mapping (geometry_mapper.py)', desc: 'Uses ISDA tie-point grids (g_grd_d18.csv) with forward/inverse bilinear interpolation.' },
                { stage: '06', title: 'Common Geographic Overlap Intersection', desc: 'Determines 960m × 960m intersection footprint at 7.4316° N, 301.2859° E.' },
                { stage: '07', title: 'Image Chip Extraction', desc: 'Extracts 3840×3840 OHRC chip and 200×200 TMC-2 chip.' },
                { stage: '08', title: 'SIFT / LoFTR Feature Analysis', desc: 'LoFTR runs coarse-to-fine self/cross-attention correlation on Apple MPS GPU.' },
                { stage: '09', title: 'Candidate Correspondences', desc: 'Outputs dense paired keypoints across the lunar surface.' },
                { stage: '10', title: 'RANSAC Geometric Outlier Filtering', desc: 'Estimates 8-DOF projective homography with 5.0 px epipolar threshold.' },
                { stage: '11', title: 'Inliers, RMSE & Confidence Computation', desc: 'Computes verified inliers (7 pts), inlier ratio (11.5%), and sub-pixel RMSE (0.9486 px).' },
                { stage: '12', title: 'FastAPI Structured JSON Response', desc: 'Encapsulates metrics in Pydantic schema with provenance tags ([COMPUTED], [REFERENCE]).' },
                { stage: '13', title: 'Next.js 16 / React 3D Interface', desc: 'Renders interactive 3D Moon, progressive selenographic zoom, and modal telemetry.' },
              ].map((step, idx) => (
                <div key={step.stage} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80 flex items-start gap-3">
                  <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {step.stage}
                  </span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white font-mono">{step.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{step.desc}</div>
                  </div>
                  {idx < 12 && <ArrowRight className="w-3.5 h-3.5 text-neutral-600 self-center hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 3: BACKEND TECHNOLOGIES
      ========================================================================= */}
      {activeTab === 'tech' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BACKEND_TECHNOLOGIES.map((tech) => (
              <div key={tech.name} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{tech.icon}</span>
                      <h4 className="text-sm font-bold text-white font-mono">{tech.name}</h4>
                    </div>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-orange-400 border border-orange-500/20">
                      {tech.category}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div>
                      <span className="text-neutral-500 text-[10px] uppercase block">What It Is:</span>
                      <span className="text-neutral-300 text-[11px]">{tech.what}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px] uppercase block">Why LUNAR-X Uses It:</span>
                      <span className="text-neutral-300 text-[11px]">{tech.why}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-400">
                  <span className="text-orange-400 font-bold">Pipeline Role: </span>
                  <span>{tech.where}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 4: DATA & MEMMAP
      ========================================================================= */}
      {activeTab === 'data' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDS4 Architecture */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-mono uppercase font-bold">
                <Database className="w-4 h-4" />
                <span>PDS4 Data Architecture</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-neutral-300">
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                  <div className="text-white font-bold mb-1">PDS4 XML Label File (.xml)</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Contains structured XML elements defining instrument type, exposure duration (178.14 ms), orbit (29426), solar incidence (87.58°), TDI stages (TDI64), and raster byte dimensions (91,971 lines × 12,000 samples).
                  </p>
                </div>
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                  <div className="text-white font-bold mb-1">Raw Binary Raster (.img)</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Contains the 1.03 GB uncompressed 8-bit calibrated radiometry stream representing photographic surface reflectance.
                  </p>
                </div>
              </div>
            </div>

            {/* np.memmap Explanation */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase font-bold">
                <HardDrive className="w-4 h-4" />
                <span>Large Raster Access: np.memmap</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                &quot;The source raster can be multi-gigabyte. Instead of loading the complete file into RAM, LUNAR-X accesses required regions through memory mapping.&quot;
              </p>
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800 font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-orange-400">
                  <span>1.03 GB Disk File</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                  <span>np.memmap(mmap_mode=&apos;r&apos;)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                  <span>3840×3840 Slice</span>
                </div>
                <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-800">
                  RAM consumed: ~14.7 MB (only the chip), NOT 1.03 GB.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 5: SIFT VS LOFTR
      ========================================================================= */}
      {activeTab === 'cv' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SIFT Card */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white font-mono">SIFT (Classical Feature Matcher)</h4>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  0 Inliers on Real Cross-Sensor
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-neutral-400 leading-relaxed">
                <div><strong className="text-neutral-200">Keypoint:</strong> Distinct local point (crater rim corner) found via Difference-of-Gaussians.</div>
                <div><strong className="text-neutral-200">Descriptor:</strong> 128-D vector describing gradient orientations around the keypoint.</div>
                <div><strong className="text-neutral-200">Lowe Ratio Test:</strong> Rejects match if closest distance is &ge; 0.75× second closest.</div>
                <div><strong className="text-neutral-200">Why It Fails:</strong> Severe 70° lighting shift inverts local pixel gradients, causing all 128-D descriptors to mismatch.</div>
              </div>
            </div>

            {/* LoFTR Card */}
            <div className="bg-neutral-900/80 border border-orange-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white font-mono">LoFTR (Deep Local Feature Transformer)</h4>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  61 Matches · 7 Inliers
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-neutral-400 leading-relaxed">
                <div><strong className="text-neutral-200">What It Is:</strong> Detector-free transformer predicting dense correspondence matrix directly.</div>
                <div><strong className="text-neutral-200">How It Works:</strong> Uses self-attention and cross-attention across full image context.</div>
                <div><strong className="text-neutral-200">Confidence:</strong> Dual-softmax probability score (0.0 to 1.0) for each matched point pair.</div>
                <div><strong className="text-neutral-200">Attribution:</strong> <em className="text-amber-400">Pre-trained model integrated and evaluated by LUNAR-X; not invented by LUNAR-X.</em></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 6: RANSAC & RMSE MATHEMATICS
      ========================================================================= */}
      {activeTab === 'math' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RANSAC Math */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-mono uppercase font-bold">
                <Activity className="w-4 h-4" />
                <span>RANSAC Geometric Validation</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-neutral-300">
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                  <div className="text-orange-400 font-bold mb-1">Inlier Ratio Formula</div>
                  <div className="text-base text-white font-mono my-1">
                    Inlier Ratio = (Inliers / Total Matches) × 100
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Phase 8: (9 inliers / 95 matches) × 100 = 9.47% RANSAC Inlier Ratio.
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  RANSAC iteratively samples 4 random point pairs, calculates a projective Homography H (3×3), and counts how many points fit within 5.0 pixels error.
                </p>
              </div>
            </div>

            {/* RMSE Math */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-mono uppercase font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Reprojection RMSE &amp; Coordinate Domains</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-neutral-300">
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                  <div className="text-sky-400 font-bold mb-1">Reprojection RMSE Formula</div>
                  <div className="text-sm text-white font-mono my-1">
                    RMSE = √[ (1/N) · Σ ||H · p_i - q_i||² ]
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                    <div className="text-white font-bold">Phase 8 Benchmark</div>
                    <div className="text-neutral-400">2.0675 px (640×640 model space)</div>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                    <div className="text-white font-bold">Live Demonstration</div>
                    <div className="text-neutral-400">0.9486 px (200×200 native TMC-2)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 7: REAL VERIFIED NUMBERS
      ========================================================================= */}
      {activeTab === 'results' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Verified Planetary Observation Metrics
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  ISRO Chandrayaan-2 Primary Lunar Observations
                </span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                [REAL DATA] [COMPUTED]
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">OHRC Resolution</span>
                <span className="text-white font-bold text-base">0.25 m/px</span>
                <span className="text-neutral-500 text-[9px] block mt-0.5">Orbit 29426 · Sol: 87.58°</span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">TMC-2 Resolution</span>
                <span className="text-white font-bold text-base">4.80 m/px</span>
                <span className="text-neutral-500 text-[9px] block mt-0.5">Orbit 23760 · Sol: 17.59°</span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">Scale Disparity</span>
                <span className="text-orange-400 font-bold text-base">19.20× Ratio</span>
                <span className="text-neutral-500 text-[9px] block mt-0.5">368 OHRC px / TMC px</span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">Sun-Angle Shift</span>
                <span className="text-amber-400 font-bold text-base">Δ = 69.99°</span>
                <span className="text-neutral-500 text-[9px] block mt-0.5">Extreme Grazing vs High Sun</span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">Phase 8 Inlier Ratio</span>
                <span className="text-white font-bold text-base">9.47%</span>
                <span className="text-neutral-500 text-[9px] block mt-0.5">9 inliers / 95 matches</span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">Live Demo Inlier Ratio</span>
                <span className="text-emerald-400 font-bold text-base">11.48%</span>
                <span className="text-neutral-500 text-[9px] block mt-0.5">7 inliers / 61 matches</span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">Live Reprojection RMSE</span>
                <span className="text-emerald-400 font-bold text-base">0.9486 px</span>
                <span className="text-neutral-500 text-[9px] block mt-0.5">Sub-pixel native accuracy</span>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">Software Test Suite</span>
                <span className="text-emerald-400 font-bold text-base">37/37 PASS</span>
                <span className="text-neutral-500 text-[9px] block mt-0.5">Zero failures across tests</span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-[11px] font-mono text-amber-300">
              <strong>CRITICAL PRESENTATION DIRECTIVE:</strong> Always label 9.47% as <span className="underline font-bold">&quot;RANSAC Inlier Ratio&quot;</span>. Never describe it as &quot;Project Accuracy&quot;. It reflects the severe physical constraint of 19.2× scale and 70° illumination shift.
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 8: SEARCHABLE JUDGE QUESTIONS
      ========================================================================= */}
      {activeTab === 'qa' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search any question, technical keyword, or concept (e.g. memmap, LoFTR, 9.47%, RMSE)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] font-mono">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-black font-bold'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-2.5">
            {filteredQuestions.map((qa) => {
              const isExpanded = expandedQa === qa.id;
              return (
                <div
                  key={qa.id}
                  className={`bg-neutral-900/80 border rounded-xl transition-all overflow-hidden ${
                    qa.isDifficult ? 'border-amber-500/30' : 'border-neutral-800'
                  }`}
                >
                  <button
                    onClick={() => setExpandedQa(isExpanded ? null : qa.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-neutral-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                        qa.isDifficult
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {qa.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white font-mono">
                        Q: {qa.q}
                      </h4>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-neutral-800/60 space-y-3">
                      <div className="text-xs font-mono text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                        <strong className="text-orange-400 block mb-1">Recommended Viva Answer:</strong>
                        {qa.a}
                      </div>

                      {qa.keyPoints && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-mono text-neutral-500 uppercase mr-1">Key Points to Mention:</span>
                          {qa.keyPoints.map((kp) => (
                            <span key={kp} className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                              ✓ {kp}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleCopy(qa.id, `Q: ${qa.q}\nA: ${qa.a}`)}
                          className="text-[9px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedId === qa.id ? 'Copied to Clipboard!' : 'Copy Q&A'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 9: DEFENSE PROTOCOL (IF THE JUDGE CHALLENGES YOU)
      ========================================================================= */}
      {activeTab === 'defense' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-400 text-xs font-mono uppercase font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Golden Rule: DO NOT GUESS OR SPECULATE</span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-mono">
              If a judge asks an extremely niche implementation detail, mathematical proof, or untested observation parameter, follow this protocol:
            </p>

            <div className="space-y-3">
              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 font-mono text-xs">
                <div className="text-orange-400 font-bold mb-1">Scenario 1: Code / Implementation Detail Unknown</div>
                <div className="text-neutral-200 italic">&quot;I don&apos;t want to speculate on that specific parameter. The exact behavior is implemented deterministically in our backend repository and can be verified from the codebase.&quot;</div>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 font-mono text-xs">
                <div className="text-orange-400 font-bold mb-1">Scenario 2: Challenged on Metric Origin</div>
                <div className="text-neutral-200 italic">&quot;That value is a computed metric from our algorithmic pipeline, not a reference mission parameter. We strictly maintain a 4-tier evidence chain separating real data, metadata, computation, and inference.&quot;</div>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 font-mono text-xs">
                <div className="text-orange-400 font-bold mb-1">Scenario 3: Asked About Unverified Features (e.g. IIRS)</div>
                <div className="text-neutral-200 italic">&quot;IIRS is an architecture-ready future extension in our schema, rather than the validated cross-sensor OHRC–TMC-2 experiment demonstrated today.&quot;</div>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 font-mono text-xs">
                <div className="text-orange-400 font-bold mb-1">Scenario 4: Challenged on Low Inlier Ratio (9.47%)</div>
                <div className="text-neutral-200 italic">&quot;We do not describe 9.47% as overall accuracy. It is the geometric inlier ratio across a 19.2× scale jump and 70° illumination angle shift. A scientifically honest 9.47% with verified sub-pixel RMSE is far more valuable than an inflated, unverified metric.&quot;</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
         TAB 10: 2-MINUTE PITCH
      ========================================================================= */}
      {activeTab === 'pitch' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-orange-400 font-bold uppercase">
                <Award className="w-4 h-4" />
                <span>Complete 2-Minute Technical Presentation Speech</span>
              </div>
              <span className="text-[9px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-400">SIH FINALS READY</span>
            </div>

            <div className="space-y-3 text-neutral-300 leading-relaxed">
              <p>
                <strong className="text-white block">1. The Problem:</strong>
                &quot;Good morning esteemed judges. Multi-sensor planetary observation on the Moon faces a fundamental obstacle: different cameras capture the surface at vastly different resolutions and solar illumination angles. For example, Chandrayaan-2 OHRC captures at 0.25 m/pixel under grazing 88° sunlight with long cast shadows, while TMC-2 captures at 4.80 m/pixel under overhead 18° sun. Classical algorithms like SIFT produce 0 inliers under these conditions.&quot;
              </p>

              <p>
                <strong className="text-white block">2. Our System &amp; Backend:</strong>
                &quot;LUNAR-X solves this by building an end-to-end planetary remote sensing platform. On the backend, we use Python, FastAPI, NumPy, PyTorch, and OpenCV. Because raw PDS4 rasters are over 1 GB, we access the data non-destructively using memory mapping (np.memmap), eliminating RAM bloat.&quot;
              </p>

              <p>
                <strong className="text-white block">3. AI + Geometric Verification:</strong>
                &quot;We compute the 960m × 960m geographic overlap using official ISDA ground-coordinate tie points. To match features across the 70° illumination gap, we utilize LoFTR deep transformers with self- and cross-attention, accelerated on GPU hardware. Crucially, we do not blindly trust neural network outputs — every match is verified through RANSAC homography estimation.&quot;
              </p>

              <p>
                <strong className="text-white block">4. Verified Results &amp; Impact:</strong>
                &quot;On authentic Chandrayaan-2 data, our pipeline achieves 61 correspondences and 7 verified inliers with a sub-pixel RMSE of 0.9486 pixels. Our entire software suite is verified by 37 passing unit tests. LUNAR-X replaces unverified assumptions with quantitative geometric truth, paving the way for autonomous precision landing and multi-sensor lunar science. Thank you.&quot;
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 text-black font-bold text-[10px] uppercase cursor-pointer"
              >
                Launch Live Analysis Demo for Judges
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
