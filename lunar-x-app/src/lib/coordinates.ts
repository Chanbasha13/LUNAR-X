import * as THREE from 'three';

export interface PinData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  category: 'crater' | 'mare' | 'landing';
}

export const LUNAR_RADIUS = 2.0;

export const PIN_LOCATIONS: PinData[] = [
  {
    id: 'shackleton',
    name: 'Shackleton Crater',
    lat: -89.9,
    lon: 0.0,
    description: 'Permanently shadowed crater near the South Pole. Prime candidate for water-ice deposits.',
    category: 'crater',
  },
  {
    id: 'tranquillitatis',
    name: 'Mare Tranquillitatis',
    lat: 8.5,
    lon: 31.4,
    description: 'Sea of Tranquility. Apollo 11 landing site — humanity\'s first steps on the Moon.',
    category: 'mare',
  },
  {
    id: 'aristarchus',
    name: 'Aristarchus Crater',
    lat: 23.7,
    lon: -47.4,
    description: 'Brightest large formation on the lunar surface. Volcanic plateau with sinuous rilles.',
    category: 'crater',
  },
  {
    id: 'tycho',
    name: 'Tycho Crater',
    lat: -43.4,
    lon: -11.2,
    description: 'Prominent impact crater with extensive ray system. ~108 million years old.',
    category: 'crater',
  },
  {
    id: 'imbrium',
    name: 'Mare Imbrium',
    lat: 32.8,
    lon: -15.6,
    description: 'Sea of Showers. One of the largest maria, formed by a giant impact ~3.8 billion years ago.',
    category: 'mare',
  },
];

/**
 * Converts selenographic lat/lon (degrees) to a Cartesian Vector3
 * on a sphere of the given radius.
 *
 * Three.js convention: Y is up.
 *   phi   = polar angle from +Y axis  = (90 - lat) * PI/180
 *   theta = azimuthal angle around Y  = (lon + 180) * PI/180
 */
export function selenographicToCartesian(
  lat: number,
  lon: number,
  radius: number,
  altitude: number = 0
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = radius + altitude;
  return new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
}

/**
 * Returns a Quaternion that orients an object's +Y axis along
 * the surface normal at the given position on a sphere.
 */
export function getSurfaceOrientation(position: THREE.Vector3): THREE.Quaternion {
  const normal = position.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  return new THREE.Quaternion().setFromUnitVectors(up, normal);
}

/**
 * Computes the directional-light position from a sun angle (degrees).
 * The light orbits the scene in the XZ plane at a fixed elevation.
 */
export function sunAngleToPosition(angleDeg: number, distance: number = 30): THREE.Vector3 {
  const rad = angleDeg * (Math.PI / 180);
  return new THREE.Vector3(
    Math.cos(rad) * distance,
    8,
    Math.sin(rad) * distance
  );
}

