'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import MoonSphere from './MoonSphere';
import SurfacePins from './SurfacePins';
import CameraController from './CameraController';
import { useLunar } from '@/lib/lunarStore';
import { sunAngleToPosition } from '@/lib/coordinates';

function SceneLighting() {
  const { sunAngle } = useLunar();
  const sunPos = sunAngleToPosition(sunAngle, 30);

  return (
    <>
      {/* Primary Directional Sunlight — harsh, direct solar illumination in vacuum */}
      <directionalLight
        position={[sunPos.x, sunPos.y, sunPos.z]}
        intensity={3.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={5}
        shadow-camera-far={70}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0001}
      />

      {/* Earthshine / deep space secondary reflection — subtle limb definition */}
      <directionalLight
        position={[-sunPos.x * 0.5, -2, -sunPos.z * 0.5]}
        intensity={0.12}
        color="#b4c2ce"
      />

      {/* Minimal ambient light — keeps shadows naturally deep without total void clipping */}
      <ambientLight intensity={0.05} color="#ffffff" />
    </>
  );
}

function Scene() {
  const moonRef = useRef<THREE.Mesh>(null);
  const { isModalOpen, hasEnteredMission } = useLunar();

  return (
    <>
      <SceneLighting />

      <Stars
        radius={150}
        depth={60}
        count={6000}
        factor={5}
        saturation={0}
        fade
        speed={0.3}
      />

      <MoonSphere meshRef={moonRef} />
      <SurfacePins moonRef={moonRef} />
      <CameraController />

      <OrbitControls
        makeDefault
        enabled={!isModalOpen && hasEnteredMission}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        enablePan={false}
        minDistance={2.8}
        maxDistance={18}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        autoRotate={!isModalOpen}
        autoRotateSpeed={0.15}
      />
    </>
  );
}

export default function MoonCanvas() {
  const { isModalOpen, hasEnteredMission } = useLunar();

  return (
    <div
      className={`w-full h-full absolute inset-0 bg-black z-0 ${
        isModalOpen || !hasEnteredMission ? 'pointer-events-none' : ''
      }`}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{
          position: [0, 2, 7],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

