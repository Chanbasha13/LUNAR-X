'use client';

import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  PIN_LOCATIONS,
  LUNAR_RADIUS,
  selenographicToCartesian,
  getSurfaceOrientation,
  PinData,
} from '@/lib/coordinates';
import { useLunar } from '@/lib/lunarStore';

function Pin({
  pin,
  moonRef,
}: {
  pin: PinData;
  moonRef: React.RefObject<THREE.Mesh | null>;
}) {
  const [hovered, setHovered] = useState(false);
  const { setCameraTarget, setSelectedPin } = useLunar();

  const position = selenographicToCartesian(pin.lat, pin.lon, LUNAR_RADIUS, 0.03);
  const posArray: [number, number, number] = [position.x, position.y, position.z];

  // Pin visual: cone pointing outward from surface
  const orientation = getSurfaceOrientation(position);

  const handleClick = () => {
    setSelectedPin(pin.id);
    setCameraTarget(position.clone());
  };

  const categoryColors: Record<string, { base: string; emissive: string; glow: string }> = {
    crater: { base: '#f97316', emissive: '#ea580c', glow: 'border-orange-500/60' },
    mare: { base: '#38bdf8', emissive: '#0284c7', glow: 'border-sky-500/60' },
    landing: { base: '#4ade80', emissive: '#16a34a', glow: 'border-green-500/60' },
  };

  const colors = categoryColors[pin.category] || categoryColors.crater;

  return (
    <group position={posArray} quaternion={orientation}>
      {/* Pin spike */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
      >
        <coneGeometry args={[0.03, 0.12, 8]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : colors.base}
          emissive={colors.emissive}
          emissiveIntensity={hovered ? 3 : 1.5}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Glowing base ring */}
      <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.045, 16]} />
        <meshStandardMaterial
          color={colors.base}
          emissive={colors.emissive}
          emissiveIntensity={2}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating HTML Label */}
      <Html
        position={[0, 0.18, 0]}
        center
        distanceFactor={5}
        occlude={moonRef.current ? [moonRef as React.RefObject<THREE.Object3D>] : undefined}
        style={{
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          pointerEvents: 'auto',
        }}
      >
        <div
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="cursor-pointer select-none"
        >
          <div
            className={`
              bg-black/80 backdrop-blur-xl border rounded-lg shadow-2xl
              transition-all duration-300 ease-out
              ${hovered ? `scale-105 ${colors.glow} border-opacity-100 px-4 py-2.5` : 'border-neutral-700/50 px-3 py-1.5'}
            `}
          >
            <div className="font-semibold text-xs whitespace-nowrap" style={{ color: colors.base }}>
              {pin.name}
            </div>
            {hovered && (
              <div className="mt-1 space-y-0.5">
                <div className="text-[10px] text-neutral-400 font-mono">
                  {pin.lat.toFixed(1)}°{pin.lat >= 0 ? 'N' : 'S'}, {Math.abs(pin.lon).toFixed(1)}°{pin.lon >= 0 ? 'E' : 'W'}
                </div>
                <div className="text-[10px] text-neutral-500 max-w-[180px] leading-tight">
                  {pin.description}
                </div>
              </div>
            )}
          </div>
          {/* Arrow pointing down to pin */}
          <div className="flex justify-center -mt-0.5">
            <div
              className="w-2 h-2 rotate-45"
              style={{ backgroundColor: hovered ? colors.base : '#404040' }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function SurfacePins({
  moonRef,
}: {
  moonRef: React.RefObject<THREE.Mesh | null>;
}) {
  const { isModalOpen, hasEnteredMission } = useLunar();

  if (isModalOpen || !hasEnteredMission) return null;

  return (
    <group>
      {PIN_LOCATIONS.map((pin) => (
        <Pin key={pin.id} pin={pin} moonRef={moonRef} />
      ))}
    </group>
  );
}

