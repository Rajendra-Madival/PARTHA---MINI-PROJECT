import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Lotus } from './Lotus';
import { Diya } from './Diya';

export interface HeroSceneProps {
  scrollProgress: number;
  reducedMotion: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isVisible: boolean;
  onReady?: () => void;
}

function createStarPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Deterministic golden-angle distribution so stars look organic without Math.random churn
    const t = (i + 0.5) / count;
    const angle = i * 2.39996323;
    const spreadX = Math.cos(angle) * (2.5 + 8.5 * Math.sqrt(t));
    const spreadY = ((i * 37) % 100) / 100 * 8.4 - 2.4;
    const depthZ = -2.2 - ((i * 53) % 100) / 100 * 6.5;

    positions[i * 3] = spreadX;
    positions[i * 3 + 1] = spreadY;
    positions[i * 3 + 2] = depthZ;
  }
  return positions;
}

function StarField({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const positions = useMemo(() => createStarPositions(count), [count]);

  useFrame((state, delta) => {
    if (reducedMotion || !pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.012;
    pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.08;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#FFF6E3"
        size={0.055}
        sizeAttenuation
        depthWrite={false}
        opacity={0.78}
      />
    </Points>
  );
}

function CameraRig({
  scrollProgress,
  reducedMotion,
  enableParallax,
  isVisible,
  onReady,
}: {
  scrollProgress: number;
  reducedMotion: boolean;
  enableParallax: boolean;
  isVisible: boolean;
  onReady?: () => void;
}) {
  const { camera, gl, invalidate } = useThree();
  const pointerRef = useRef({ x: 0, y: 0 });
  const lookTargetRef = useRef(new THREE.Vector3(0, -0.38, 0));
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (isVisible) {
      invalidate();
    }
  }, [isVisible, reducedMotion, scrollProgress, invalidate]);

  useEffect(() => {
    if (!enableParallax || reducedMotion || typeof window === 'undefined') {
      pointerRef.current = { x: 0, y: 0 };
      return;
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current.x = THREE.MathUtils.clamp(nx, -1, 1);
      pointerRef.current.y = THREE.MathUtils.clamp(ny, -1, 1);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [enableParallax, reducedMotion]);

  useFrame((_, delta) => {
    frameCountRef.current += 1;
    if (frameCountRef.current <= 3) {
      gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
    }
    if (frameCountRef.current === 1) {
      onReady?.();
    }

    if (reducedMotion) {
      camera.position.set(0, 0.45, 5.2);
      lookTargetRef.current.set(0, -0.38, 0);
      camera.lookAt(lookTargetRef.current);
      return;
    }

    const progress = THREE.MathUtils.clamp(scrollProgress, 0, 1);
    // Camera moves forward 2.5 units on Z (5.2 -> 2.7) with slight downward tilt
    const targetZ = 5.2 - progress * 2.5;
    const parallaxX = enableParallax ? pointerRef.current.x * 0.3 : 0;
    const parallaxY = enableParallax ? -pointerRef.current.y * 0.16 : 0;
    const targetY = 0.45 - progress * 0.22 + parallaxY;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, parallaxX, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 4, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5, delta);

    lookTargetRef.current.y = -0.38 - progress * 0.14;
    camera.lookAt(lookTargetRef.current);
    camera.rotation.z = THREE.MathUtils.damp(
      camera.rotation.z,
      progress * 0.028 - parallaxX * 0.04,
      4,
      delta,
    );
  });

  return null;
}

export function HeroScene({
  scrollProgress,
  reducedMotion,
  isMobile,
  isDesktop,
  isVisible,
  onReady,
}: HeroSceneProps) {
  const starCount = isMobile ? 150 : 500;
  const frameloop = !isVisible ? 'never' : reducedMotion ? 'demand' : 'always';

  return (
    <Canvas
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      frameloop={frameloop}
      camera={{ position: [0, 0.45, 5.2], fov: 42, near: 0.1, far: 40 }}
      gl={{ alpha: true, antialias: !isMobile, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      {/* Strictly one directional light and one point light (inside Diya) per Section 5.4 */}
      <directionalLight position={[4, 6, 4]} intensity={1.35} color="#FFF6E3" />
      <StarField count={starCount} reducedMotion={reducedMotion} />
      <Lotus scrollProgress={scrollProgress} reducedMotion={reducedMotion} />
      <Diya reducedMotion={reducedMotion} />
      <CameraRig
        scrollProgress={scrollProgress}
        reducedMotion={reducedMotion}
        enableParallax={isDesktop}
        isVisible={isVisible}
        onReady={onReady}
      />
    </Canvas>
  );
}

export default HeroScene;
