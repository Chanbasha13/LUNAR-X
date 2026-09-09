'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as THREE from 'three';

interface UploadedImages {
  ohrc: File | null;
  tmc2: File | null;
}

interface LunarState {
  sunAngle: number;
  setSunAngle: (angle: number) => void;
  cameraTarget: THREE.Vector3 | null;
  setCameraTarget: (target: THREE.Vector3 | null) => void;
  selectedPin: string | null;
  setSelectedPin: (id: string | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  uploadedImages: UploadedImages;
  setUploadedImages: (images: UploadedImages) => void;
  showAnalysis: boolean;
  setShowAnalysis: (show: boolean) => void;
  hasEnteredMission: boolean;
  setHasEnteredMission: (entered: boolean) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const LunarContext = createContext<LunarState | null>(null);

export function LunarProvider({ children }: { children: ReactNode }) {
  const [sunAngle, setSunAngle] = useState(45);
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImages>({
    ohrc: null,
    tmc2: null,
  });
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [hasEnteredMission, setHasEnteredMission] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('explorer');

  const value: LunarState = {
    sunAngle,
    setSunAngle: useCallback((a: number) => setSunAngle(a), []),
    cameraTarget,
    setCameraTarget: useCallback((t: THREE.Vector3 | null) => setCameraTarget(t), []),
    selectedPin,
    setSelectedPin: useCallback((id: string | null) => setSelectedPin(id), []),
    isModalOpen,
    setIsModalOpen: useCallback((o: boolean) => setIsModalOpen(o), []),
    uploadedImages,
    setUploadedImages: useCallback((imgs: UploadedImages) => setUploadedImages(imgs), []),
    showAnalysis,
    setShowAnalysis: useCallback((s: boolean) => setShowAnalysis(s), []),
    hasEnteredMission,
    setHasEnteredMission: useCallback((e: boolean) => setHasEnteredMission(e), []),
    activeSection,
    setActiveSection: useCallback((sec: string) => setActiveSection(sec), []),
  };

  return <LunarContext.Provider value={value}>{children}</LunarContext.Provider>;
}

export function useLunar(): LunarState {
  const ctx = useContext(LunarContext);
  if (!ctx) throw new Error('useLunar must be used within a LunarProvider');
  return ctx;
}
