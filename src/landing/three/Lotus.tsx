import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LotusProps {
  scrollProgress: number;
  reducedMotion: boolean;
}

const PETAL_COUNT = 8;

function createLotusPetalGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.26, 0.24, 0.36, 0.68, 0.18, 1.12);
  shape.bezierCurveTo(0.11, 1.26, 0.04, 1.35, 0, 1.42);
  shape.bezierCurveTo(-0.04, 1.35, -0.11, 1.26, -0.18, 1.12);
  shape.bezierCurveTo(-0.36, 0.68, -0.26, 0.24, 0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.014,
    bevelSegments: 1,
    curveSegments: 12,
  });

  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const saffron = new THREE.Color('#F4A21B');
  const marigold = new THREE.Color('#FF7A1A');
  const gold = new THREE.Color('#FFD166');
  const temp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const tY = THREE.MathUtils.clamp(y / 1.42, 0, 1);
    // Cup petal across width and curve gently inward toward tip
    const cuppedZ = z + x * x * 0.62 - Math.pow(tY, 1.9) * 0.24;
    pos.setZ(i, cuppedZ);

    if (tY < 0.45) {
      temp.copy(marigold).lerp(saffron, tY / 0.45);
    } else {
      temp.copy(saffron).lerp(gold, (tY - 0.45) / 0.55);
    }

    colors[i * 3] = temp.r;
    colors[i * 3 + 1] = temp.g;
    colors[i * 3 + 2] = temp.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function Lotus({ scrollProgress, reducedMotion }: LotusProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const petalRefs = useRef<Array<THREE.Group | null>>([]);
  const currentOpenRef = useRef(reducedMotion ? 0.48 : 0);

  const petalGeometry = useMemo(() => createLotusPetalGeometry(), []);

  const petalMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.34,
      roughness: 0.32,
      emissive: new THREE.Color('#FF7A1A'),
      emissiveIntensity: 0.22,
    });

    // Lightweight Fresnel rim glow for emissive petal edges with zero extra draw calls
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float fresnelEdge = pow(1.0 - clamp(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0), 2.3);
        totalEmissiveRadiance += vec3(1.0, 0.74, 0.22) * fresnelEdge * 0.75;`,
      );
    };
    mat.customProgramCacheKey = () => 'partha-lotus-fresnel-v1';
    return mat;
  }, []);

  const coreGeometry = useMemo(() => new THREE.SphereGeometry(0.22, 18, 12), []);
  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#D4AF37',
        metalness: 0.6,
        roughness: 0.28,
        emissive: '#F4A21B',
        emissiveIntensity: 0.35,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      petalGeometry.dispose();
      petalMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
    };
  }, [petalGeometry, petalMaterial, coreGeometry, coreMaterial]);

  useFrame((state, delta) => {
    const targetOpen = reducedMotion ? 0.48 : THREE.MathUtils.clamp(scrollProgress, 0, 1);

    currentOpenRef.current = reducedMotion
      ? targetOpen
      : THREE.MathUtils.damp(currentOpenRef.current, targetOpen, 6, delta);

    const open = currentOpenRef.current;

    for (let i = 0; i < PETAL_COUNT; i++) {
      const petal = petalRefs.current[i];
      if (!petal) continue;
      const isOuter = i % 2 === 0;
      const closedTilt = isOuter ? 0.16 : 0.08;
      const openTilt = isOuter ? 1.16 : 0.88;
      petal.rotation.x = THREE.MathUtils.lerp(closedTilt, openTilt, open);
    }

    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  const petals = useMemo(
    () =>
      Array.from({ length: PETAL_COUNT }, (_, idx) => {
        const angle = (idx / PETAL_COUNT) * Math.PI * 2;
        const isOuter = idx % 2 === 0;
        const radius = isOuter ? 0.22 : 0.17;
        return {
          idx,
          angle,
          x: Math.sin(angle) * radius,
          z: Math.cos(angle) * radius,
          scale: isOuter ? 1 : 0.9,
          initialTilt: isOuter ? 0.16 : 0.08,
        };
      }),
    [],
  );

  return (
    <group ref={groupRef} position={[0, -0.58, 0]}>
      <mesh
        geometry={coreGeometry}
        material={coreMaterial}
        position={[0, 0.12, 0]}
        scale={[1, 0.55, 1]}
      />
      {petals.map((petal) => (
        <group key={petal.idx} position={[petal.x, 0, petal.z]} rotation={[0, petal.angle, 0]}>
          <group
            ref={(node: THREE.Group | null) => {
              petalRefs.current[petal.idx] = node;
            }}
            rotation={[petal.initialTilt, 0, 0]}
            scale={petal.scale}
          >
            <mesh geometry={petalGeometry} material={petalMaterial} />
          </group>
        </group>
      ))}
    </group>
  );
}
