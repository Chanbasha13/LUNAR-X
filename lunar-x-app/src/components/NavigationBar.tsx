'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  FileText,
  Database,
  Eye,
  GitMerge,
  Cpu,
  ShieldCheck,
  Award,
  Sparkles,
  FlaskConical,
  GraduationCap,
} from 'lucide-react';
import { useLunar } from '@/lib/lunarStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function NavigationBar() {
  const { activeSection, setActiveSection, setIsModalOpen, hasEnteredMission } = useLunar();

  if (!hasEnteredMission) return null;

  const navItems: NavItem[] = [
    { id: 'explorer', label: '3D Explorer', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'brief', label: 'Mission Brief', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'datasets', label: 'Datasets', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'context', label: 'Context', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'pipeline', label: 'Pipeline', icon: <GitMerge className="w-3.5 h-3.5" /> },
    { id: 'feature_lab', label: 'Feature Lab', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'robustness', label: 'Robustness', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'verification', label: 'Verification', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'impact', label: 'SIH Impact', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'viva_prep', label: 'Viva / Judge Prep', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  ];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-30 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/80 px-4 md:px-6 py-2.5 flex items-center justify-between pointer-events-auto"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left Logo / Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveSection('explorer')}
          className="flex items-center gap-2 text-left cursor-pointer group"
        >
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-orange-500 absolute inset-0" />
          </div>
          <div className="flex items-baseline">
            <span className="text-sm font-bold text-white tracking-wider font-mono group-hover:text-neutral-200">
              LUNAR
            </span>
            <span className="text-sm font-bold text-orange-500 font-mono">-X</span>
          </div>
        </button>
        <span className="hidden lg:inline text-[9px] font-mono text-neutral-500 border-l border-neutral-800 pl-3">
          CHANDRAYAAN-2 SCIENCE PLATFORM
        </span>
      </div>

      {/* Center Nav Items */}
      <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[65vw] px-2">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all duration-150 whitespace-nowrap cursor-pointer
                ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }
              `}
            >
              <span className={isActive ? 'text-orange-400' : 'text-neutral-500'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Quick Action Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider
            bg-gradient-to-r from-orange-600 to-amber-500 text-black
            hover:from-orange-500 hover:to-amber-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.35)]
            active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-md
          "
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Launch Scientific Analysis</span>
          <span className="sm:hidden">Analyze</span>
        </button>
      </div>
    </motion.header>
  );
}
