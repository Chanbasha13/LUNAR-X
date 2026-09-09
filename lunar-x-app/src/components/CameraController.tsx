'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useLunar } from '@/lib/lunarStore';

export default function CameraController() {
  const { cameraTarget, setCameraTarget } = useLunar();
  const { camera } = useThree();

  const isAnimating = useRef(false);
  const targetCamPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const progress = useRef(0);

  useEffect(() => {
    if (cameraTarget) {
      // Compute camera position: offset along the surface normal, away from the pin
      const normal = cameraTarget.clone().normalize();
      const camPos = cameraTarget.clone().add(normal.multiplyScalar(2.5));

      targetCamPos.current.copy(camPos);
      targetLookAt.current.copy(cameraTarget);
      isAnimating.current = true;
      progress.current = 0;
    }
  }, [cameraTarget]);

  useFrame((_, delta) => {
    if (!isAnimating.current) return;

    progress.current += delta * 0.8; // Speed of fly-to
    const t = Math.min(progress.current, 1);
    // Smooth ease-in-out
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Lerp camera position
    camera.position.lerp(targetCamPos.current, eased * 0.06);
    // Lerp lookAt
    currentLookAt.current.lerp(targetLookAt.current, eased * 0.06);
    camera.lookAt(currentLookAt.current);

    // Check if close enough to target
    if (camera.position.distanceTo(targetCamPos.current) < 0.05) {
      isAnimating.current = false;
      setCameraTarget(null);
    }
  });

  return null;
}

