import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DiyaProps {
  reducedMotion: boolean;
}

const BASE_LIGHT_INTENSITY = 2.8;

function flameNoise(t: number): number {
  return (
    0.52 * Math.sin(t * 7.3) +
    0.31 * Math.sin(t * 13.7 + 1.4) +
    0.17 * Math.sin(t * 23.1 + 2.8)
  );
}

function createFlameTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const outer = ctx.createRadialGradient(32, 76, 4, 32, 74, 46);
    outer.addColorStop(0, 'rgba(255, 246, 227, 1)');
    outer.addColorStop(0.28, 'rgba(244, 162, 27, 0.92)');
    outer.addColorStop(0.62, 'rgba(255, 122, 26, 0.42)');
    outer.addColorStop(1, 'rgba(255, 122, 26, 0)');
    ctx.fillStyle = outer;
    ctx.fillRect(0, 0, 64, 128);

    // Teardrop inner flame core
    ctx.beginPath();
    ctx.moveTo(32, 18);
    ctx.bezierCurveTo(46, 48, 46, 86, 32, 98);
    ctx.bezierCurveTo(18, 86, 18, 48, 32, 18);
    ctx.closePath();

    const inner = ctx.createLinearGradient(0, 20, 0, 98);
    inner.addColorStop(0, 'rgba(255, 246, 227, 0.98)');
    inner.addColorStop(0.55, 'rgba(244, 162, 27, 0.95)');
    inner.addColorStop(1, 'rgba(255, 122, 26, 0.2)');
    ctx.fillStyle = inner;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function Diya({ reducedMotion }: DiyaProps) {
  const lightRef = useRef<THREE.PointLight | null>(null);
  const spriteRef = useRef<THREE.Sprite | null>(null);

  const bowlGeometry = useMemo(() => {
    const profile = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.16, 0),
      new THREE.Vector2(0.18, 0.03),
      new THREE.Vector2(0.32, 0.08),
      new THREE.Vector2(0.42, 0.17),
      new THREE.Vector2(0.38, 0.19),
      new THREE.Vector2(0.28, 0.11),
      new THREE.Vector2(0.14, 0.07),
      new THREE.Vector2(0, 0.06),
    ];
    return new THREE.LatheGeometry(profile, 24);
  }, []);

  const bowlMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#9C6324',
        metalness: 0.72,
        roughness: 0.34,
        emissive: '#3D1D06',
        emissiveIntensity: 0.35,
      }),
    [],
  );

  const flameTexture = useMemo(() => createFlameTexture(), []);

  useEffect(() => {
    return () => {
      bowlGeometry.dispose();
      bowlMaterial.dispose();
      flameTexture.dispose();
    };
  }, [bowlGeometry, bowlMaterial, flameTexture]);

  useFrame((state) => {
    const noiseVal = reducedMotion ? 0 : flameNoise(state.clock.elapsedTime);

    if (lightRef.current) {
      // ±15% intensity flicker driven by noise (Section 6.1)
      lightRef.current.intensity = BASE_LIGHT_INTENSITY * (1 + 0.15 * noiseVal);
    }

    if (spriteRef.current) {
      spriteRef.current.scale.set(
        0.42 * (1 + 0.05 * noiseVal),
        0.68 * (1 + 0.08 * noiseVal),
        1,
      );
    }
  });

  return (
    <group position={[0, -1.12, 0.92]}>
      <mesh geometry={bowlGeometry} material={bowlMaterial} />
      <sprite ref={spriteRef} position={[0, 0.32, 0]} scale={[0.42, 0.68, 1]}>
        <spriteMaterial
          map={flameTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <pointLight
        ref={lightRef}
        position={[0, 0.4, 0.05]}
        color="#F4A21B"
        intensity={BASE_LIGHT_INTENSITY}
        distance={9}
        decay={2}
      />
    </group>
  );
}
