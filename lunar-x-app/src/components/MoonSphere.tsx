'use client';

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { LUNAR_RADIUS } from '@/lib/coordinates';

export default function MoonSphere({
  meshRef,
}: {
  meshRef: React.RefObject<THREE.Mesh | null>;
}) {
  // Load the authentic NASA LROC 2K global albedo and topographic bump maps from /public
  const [albedoMap, bumpMap] = useTexture([
    '/moon_2k_albedo.jpg',
    '/moon_2k_bump.jpg',
  ]);

  // Ensure proper color-space and high-detail texture filtering
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.ClampToEdgeWrapping;
  albedoMap.minFilter = THREE.LinearMipmapLinearFilter;
  albedoMap.magFilter = THREE.LinearFilter;
  albedoMap.generateMipmaps = true;
  albedoMap.anisotropy = 16;

  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
  bumpMap.magFilter = THREE.LinearFilter;
  bumpMap.generateMipmaps = true;
  bumpMap.anisotropy = 16;

  // Slow self-rotation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <mesh ref={meshRef} receiveShadow castShadow>
      <sphereGeometry args={[LUNAR_RADIUS, 128, 128]} />
      <meshStandardMaterial
        map={albedoMap}
        bumpMap={bumpMap}
        bumpScale={0.045}
        roughness={0.88}
        metalness={0.0}
        color="#f4f5f7"
      />
    </mesh>
  );
}
