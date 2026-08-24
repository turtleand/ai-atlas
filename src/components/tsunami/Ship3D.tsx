import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWaveHeight } from './Ocean3D';
import { createSeededRandom } from './scene-utils';

interface Ship3DProps {
  tier: 1 | 2 | 3 | 4 | 5;
  score: number;
  wavePercent: number;
  stormIntensity: number;
  captureTime?: number;
  reducedMotion: boolean;
}

function createHullGeometry(length: number, width: number, height: number) {
  const topY = height * 0.5;
  const bottomY = -height * 0.5;
  const halfLength = length * 0.5;
  const halfWidth = width * 0.5;
  const vertices = new Float32Array([
    0, topY, halfLength,
    halfWidth, topY, length * 0.08,
    halfWidth * 0.78, topY, -halfLength,
    -halfWidth * 0.78, topY, -halfLength,
    -halfWidth, topY, length * 0.08,
    0, bottomY, halfLength * 0.72,
    halfWidth * 0.52, bottomY, 0,
    halfWidth * 0.42, bottomY, -halfLength * 0.82,
    -halfWidth * 0.42, bottomY, -halfLength * 0.82,
    -halfWidth * 0.52, bottomY, 0,
  ]);
  const indices = [
    0, 1, 2, 0, 2, 3, 0, 3, 4,
    0, 5, 6, 0, 6, 1,
    1, 6, 7, 1, 7, 2,
    2, 7, 8, 2, 8, 3,
    3, 8, 9, 3, 9, 4,
    4, 9, 5, 4, 5, 0,
    5, 8, 7, 5, 9, 8,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createSloopHullGeometry() {
  const sections = [
    { z: 1.35, halfWidth: 0.03, sheerY: 0.34, keelY: -0.08 },
    { z: 0.65, halfWidth: 0.36, sheerY: 0.28, keelY: -0.24 },
    { z: -0.1, halfWidth: 0.43, sheerY: 0.26, keelY: -0.3 },
    { z: -0.85, halfWidth: 0.38, sheerY: 0.3, keelY: -0.22 },
    { z: -1.35, halfWidth: 0.28, sheerY: 0.36, keelY: -0.08 },
  ];
  const vertices: number[] = [];
  const indices: number[] = [];

  sections.forEach(({ z, halfWidth, sheerY, keelY }) => {
    const lowerHalfWidth = Math.max(0.02, halfWidth * 0.58);
    vertices.push(
      -halfWidth, sheerY, z,
      halfWidth, sheerY, z,
      -lowerHalfWidth, keelY, z,
      lowerHalfWidth, keelY, z,
    );
  });

  for (let section = 0; section < sections.length - 1; section++) {
    const current = section * 4;
    const next = current + 4;

    // Port side
    indices.push(
      current, next, next + 2,
      current, next + 2, current + 2,
    );
    // Starboard side
    indices.push(
      current + 1, current + 3, next + 3,
      current + 1, next + 3, next + 1,
    );
    // Keel
    indices.push(
      current + 2, next + 2, next + 3,
      current + 2, next + 3, current + 3,
    );
  }

  const stern = (sections.length - 1) * 4;
  indices.push(
    0, 2, 3,
    0, 3, 1,
    stern, stern + 3, stern + 2,
    stern, stern + 1, stern + 3,
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createHorizontalPanelGeometry(points: Array<[number, number]>) {
  const vertices = points.flatMap(([x, z]) => [x, 0, z]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

function createSloopMainSailShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.02);
  shape.lineTo(0, 1.08);
  shape.lineTo(-0.92, 0.16);
  shape.lineTo(-0.78, 0.04);
  shape.closePath();
  return shape;
}

function createSloopJibShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.05);
  shape.lineTo(0, 0.94);
  shape.lineTo(0.78, 0.12);
  shape.closePath();
  return shape;
}

function createSloopRiggingGeometry() {
  const mastTop = new THREE.Vector3(0, 2.08, 0.1);
  return new THREE.BufferGeometry().setFromPoints([
    mastTop,
    new THREE.Vector3(0, 0.39, 1.28),
    mastTop,
    new THREE.Vector3(-0.4, 0.31, -0.55),
    mastTop,
    new THREE.Vector3(0.4, 0.31, -0.55),
  ]);
}

function createTornSailShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.52, -0.55);
  shape.lineTo(-0.46, 0.56);
  shape.lineTo(0.5, 0.48);
  shape.lineTo(0.34, 0.05);
  shape.lineTo(0.5, -0.18);
  shape.lineTo(0.18, -0.52);
  shape.lineTo(-0.08, -0.34);
  shape.lineTo(-0.28, -0.55);
  shape.closePath();
  return shape;
}

function createCruiserSailShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.48, -0.5);
  shape.lineTo(-0.46, 0.5);
  shape.lineTo(0.5, 0.38);
  shape.lineTo(0.32, -0.34);
  shape.lineTo(0.04, -0.48);
  shape.closePath();
  return shape;
}

export function Ship3D({
  tier,
  score,
  wavePercent,
  stormIntensity,
  captureTime,
  reducedMotion,
}: Ship3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const revealProgress = useRef(1);
  const waterContactRef = useRef<THREE.Group>(null);
  const t2SailsRef = useRef<THREE.Group>(null);
  const t3RadarRef = useRef<THREE.Group>(null);

  // === T3 refs (Hybrid Cruiser) ===
  const t3RainRef = useRef<THREE.Points>(null);
  const t3DronesRef = useRef<THREE.Group>(null);
  const t3PathRef = useRef<THREE.Mesh>(null);

  // === T4 refs (The Singularity) ===
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const fragmentsRef = useRef<THREE.Group>(null);
  const t4AscendRef = useRef<THREE.Points>(null);
  const ghostRef = useRef<THREE.Mesh>(null);
  const tendrilsRef = useRef<THREE.Group>(null);

  // === T5 refs (The Architect) ===
  const archCoreRef = useRef<THREE.Group>(null);
  const archCage1Ref = useRef<THREE.Mesh>(null);
  const archCage2Ref = useRef<THREE.Mesh>(null);
  const archCage3Ref = useRef<THREE.Mesh>(null);
  const archCage4Ref = useRef<THREE.Mesh>(null);
  const archCage5Ref = useRef<THREE.Mesh>(null);
  const archNodesRef = useRef<THREE.Group>(null);
  const archPillarsRef = useRef<THREE.Group>(null);
  const archAscendRef = useRef<THREE.Points>(null);
  const archAuraRef = useRef<THREE.Mesh>(null);

  const sloopHullGeometry = useMemo(() => createSloopHullGeometry(), []);
  const sloopForedeckGeometry = useMemo(
    () => createHorizontalPanelGeometry([
      [-0.42, 0.08],
      [-0.04, 1.28],
      [0.04, 1.28],
      [0.42, 0.08],
    ]),
    [],
  );
  const sloopAftDeckGeometry = useMemo(
    () => createHorizontalPanelGeometry([
      [-0.28, -1.15],
      [-0.4, -0.72],
      [0.4, -0.72],
      [0.28, -1.15],
    ]),
    [],
  );
  const sloopCockpitGeometry = useMemo(
    () => createHorizontalPanelGeometry([
      [-0.34, -0.66],
      [-0.34, -0.02],
      [0.34, -0.02],
      [0.34, -0.66],
    ]),
    [],
  );
  const sloopRiggingGeometry = useMemo(() => createSloopRiggingGeometry(), []);
  const sloopMainSailShape = useMemo(() => createSloopMainSailShape(), []);
  const sloopJibShape = useMemo(() => createSloopJibShape(), []);
  const cruiserHullGeometry = useMemo(() => createHullGeometry(4.4, 1.5, 0.82), []);
  const tornSailShape = useMemo(() => createTornSailShape(), []);
  const cruiserSailShape = useMemo(() => createCruiserSailShape(), []);

  useEffect(() => {
    revealProgress.current = captureTime === undefined ? 0 : 1;
    if (tier === 2 && groupRef.current) {
      groupRef.current.rotation.set(0, 0.6, 0);
    }
  }, [captureTime, tier]);

  useEffect(
    () => () => {
      sloopHullGeometry.dispose();
      sloopForedeckGeometry.dispose();
      sloopAftDeckGeometry.dispose();
      sloopCockpitGeometry.dispose();
      sloopRiggingGeometry.dispose();
      cruiserHullGeometry.dispose();
    },
    [
      cruiserHullGeometry,
      sloopAftDeckGeometry,
      sloopCockpitGeometry,
      sloopForedeckGeometry,
      sloopHullGeometry,
      sloopRiggingGeometry,
    ],
  );

  // ====== T3 RAIN PARTICLES ======
  const t3RainGeometry = useMemo(() => {
    if (tier !== 3) return null;
    const random = createSeededRandom(0x73a1);
    const count = reducedMotion ? 16 : 40;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 2.5;
      positions[i * 3 + 1] = random() * 4;
      positions[i * 3 + 2] = (random() - 0.5) * 4;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [reducedMotion, tier]);

  // ====== T4 ASCENDING DATA STREAM ======
  const t4AscendGeometry = useMemo(() => {
    if (tier !== 4) return null;
    const random = createSeededRandom(0x44a1);
    const count = reducedMotion ? 90 : 250;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = random() * 0.7;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = random() * 7 - 2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [reducedMotion, tier]);

  // ====== T5 ARCHITECT PARTICLE FIELD ======
  const archAscendGeometry = useMemo(() => {
    if (tier !== 5) return null;
    const random = createSeededRandom(0xa5c3);
    const count = reducedMotion ? 180 : 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = random() * 2.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = random() * 10 - 3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [reducedMotion, tier]);

  // ====== ANIMATION LOOP ======
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = captureTime ?? clock.getElapsedTime() * (reducedMotion ? 0.3 : 1);
    revealProgress.current = Math.min(1, revealProgress.current + delta * 2.8);
    const reveal = 1 - Math.pow(1 - revealProgress.current, 3);
    const scale = 1.8 * (0.9 + reveal * 0.1);
    groupRef.current.scale.setScalar(scale);

    if (waterContactRef.current) {
      const pulseAmplitude = tier === 2 ? 0.025 : 0.08;
      const pulse = 1 + Math.sin(time * (tier === 1 ? 2.8 : 1.7)) * pulseAmplitude;
      waterContactRef.current.scale.setScalar(pulse);
      waterContactRef.current.children.forEach((child, index) => {
        const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (material?.opacity !== undefined) {
          const tierOpacity = tier === 1 ? 0.2 : tier === 2 ? 0.16 : 0.12;
          material.opacity = tierOpacity + Math.sin(time * 2 + index) * 0.06;
        }
      });
    }

    // === T1 and T3: Existing wave response ===
    if (tier === 1 || tier === 3) {
      const waveY = getWaveHeight(0, 0, time, stormIntensity);
      const sinkOffset = tier === 1 ? -0.14 - Math.sin(time * 0.3) * 0.12 : 0;
      groupRef.current.position.y = waveY + sinkOffset;

      const tiltFactor = tier === 3 ? 0.35 : 1.5;
      const dx = getWaveHeight(0.5, 0, time, stormIntensity) - getWaveHeight(-0.5, 0, time, stormIntensity);
      const dz = getWaveHeight(0, 0.5, time, stormIntensity) - getWaveHeight(0, -0.5, time, stormIntensity);
      groupRef.current.rotation.z = Math.atan2(dx, 1) * tiltFactor;
      groupRef.current.rotation.x = Math.atan2(dz, 1) * tiltFactor * 0.7;
      groupRef.current.rotation.y = tier === 3 ? -0.52 : -0.4;
      if (tier === 1) groupRef.current.rotation.z += Math.sin(time * 0.5) * 0.3;
    }

    // === T2: Upright, intact sloop following the local water plane ===
    if (tier === 2) {
      const centerWave = getWaveHeight(0, 0, time, stormIntensity);
      const bowWave = getWaveHeight(0, 1.15, time, stormIntensity);
      const sternWave = getWaveHeight(0, -1.15, time, stormIntensity);
      const portWave = getWaveHeight(-0.46, 0, time, stormIntensity);
      const starboardWave = getWaveHeight(0.46, 0, time, stormIntensity);
      const targetPitch = THREE.MathUtils.clamp(
        -Math.atan2(bowWave - sternWave, 2.3),
        -THREE.MathUtils.degToRad(8),
        THREE.MathUtils.degToRad(8),
      );
      const targetRoll = THREE.MathUtils.clamp(
        Math.atan2(starboardWave - portWave, 0.92),
        -THREE.MathUtils.degToRad(6),
        THREE.MathUtils.degToRad(6),
      );
      const damping = 1 - Math.exp(-delta * 4.5);

      groupRef.current.position.y = centerWave + 0.14;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetPitch,
        damping,
      );
      groupRef.current.rotation.y = 0.6;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        targetRoll,
        damping,
      );

      if (t2SailsRef.current) {
        t2SailsRef.current.rotation.y = Math.sin(time * 1.15) * 0.025;
        t2SailsRef.current.rotation.x = Math.sin(time * 0.8) * 0.012;
      }
    }

    // === TIER 4: Hover (AI Flagship) ===
    if (tier === 4) {
      groupRef.current.position.y = 2.0 + Math.sin(time * 0.25) * 0.15;
      groupRef.current.rotation.z = 0;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = 0;
    }

    // === TIER 5: Higher hover (The Singularity) ===
    if (tier === 5) {
      groupRef.current.position.y = 3.5 + Math.sin(time * 0.15) * 0.1;
      groupRef.current.rotation.z = 0;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = 0;
    }

    // === T3 animations (Hybrid Cruiser) ===
    if (tier === 3) {
      if (t3RainRef.current && t3RainGeometry) {
        t3RainRef.current.position.y = 0.5 - ((time * 0.9) % 1.2);
      }
      if (t3DronesRef.current) {
        t3DronesRef.current.children.forEach((drone, i) => {
          const angle = time * 0.35 + i * Math.PI * 2;
          drone.position.set(Math.cos(angle) * 1.8, 1.2 + Math.sin(time * 0.5) * 0.3, Math.sin(angle) * 1.8);
        });
      }
      if (t3PathRef.current) {
        const mat = t3PathRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.12 + Math.sin(time * 1.5) * 0.04;
      }
      if (t3RadarRef.current) {
        t3RadarRef.current.rotation.y = time * 1.1;
      }
    }

    // === T4 animations (The Singularity) ===
    if (tier === 4) {
      if (coreRef.current) {
        coreRef.current.rotation.y = time * 0.15;
        coreRef.current.rotation.x = time * 0.08;
        coreRef.current.rotation.z = time * 0.05;
      }
      if (ring1Ref.current) { ring1Ref.current.rotation.x = time * 0.25; ring1Ref.current.rotation.y = time * 0.1; }
      if (ring2Ref.current) { ring2Ref.current.rotation.y = time * 0.2; ring2Ref.current.rotation.z = time * 0.12; }
      if (ring3Ref.current) { ring3Ref.current.rotation.z = time * 0.3; ring3Ref.current.rotation.x = time * 0.08; }
      if (fragmentsRef.current) {
        fragmentsRef.current.children.forEach((frag, i) => {
          const count = fragmentsRef.current!.children.length;
          const speed = 0.18 + i * 0.025;
          const angle = time * speed + (i * Math.PI * 2) / count;
          const radius = 2.5 + (i % 3) * 0.4;
          const height = Math.sin(time * 0.35 + i * 1.2) * 0.9;
          frag.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
          frag.rotation.y = time * 0.5 + i;
          frag.rotation.x = time * 0.3 + i * 0.7;
        });
      }
      if (t4AscendRef.current && t4AscendGeometry) {
        t4AscendRef.current.rotation.y = time * 0.22;
        t4AscendRef.current.position.y = ((time * 0.42) % 0.9) - 0.45;
      }
      if (ghostRef.current) {
        ghostRef.current.rotation.y = time * 0.06;
        ghostRef.current.rotation.z = time * 0.04;
        const s = 1.7 + Math.sin(time * 0.4) * 0.08;
        ghostRef.current.scale.set(s, s, s);
      }
      if (tendrilsRef.current) {
        tendrilsRef.current.children.forEach((tendril, i) => {
          const mat = (tendril as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat?.emissiveIntensity !== undefined) {
            mat.emissiveIntensity = 1.5 + Math.sin(time * 2 + i * 0.8) * 0.8;
          }
        });
      }
    }

    // === T5 animations (The Architect) ===
    if (tier === 5) {
      // Core — slow majestic rotation
      if (archCoreRef.current) {
        archCoreRef.current.rotation.y = time * 0.08;
        archCoreRef.current.rotation.x = time * 0.04;
      }
      // 5 Dyson cage rings on different axes
      if (archCage1Ref.current) { archCage1Ref.current.rotation.x = time * 0.12; archCage1Ref.current.rotation.y = time * 0.05; }
      if (archCage2Ref.current) { archCage2Ref.current.rotation.y = time * 0.15; archCage2Ref.current.rotation.z = time * 0.07; }
      if (archCage3Ref.current) { archCage3Ref.current.rotation.z = time * 0.10; archCage3Ref.current.rotation.x = time * 0.06; }
      if (archCage4Ref.current) { archCage4Ref.current.rotation.x = time * 0.08; archCage4Ref.current.rotation.z = time * 0.13; }
      if (archCage5Ref.current) { archCage5Ref.current.rotation.y = time * 0.11; archCage5Ref.current.rotation.x = time * 0.09; }
      // Orbiting constellation
      if (archNodesRef.current) {
        archNodesRef.current.children.forEach((node, i) => {
          const count = archNodesRef.current!.children.length;
          const speed = 0.08 + i * 0.012;
          const angle = time * speed + (i * Math.PI * 2) / count;
          const radius = 4.0 + (i % 4) * 0.5;
          const height = Math.sin(time * 0.2 + i * 1.5) * 1.5;
          node.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
          node.rotation.y = time * 0.3 + i;
          node.rotation.x = time * 0.2 + i * 0.5;
        });
      }
      // Pillar pulsing
      if (archPillarsRef.current) {
        archPillarsRef.current.children.forEach((pillar, i) => {
          const mat = (pillar as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat?.emissiveIntensity !== undefined) {
            mat.emissiveIntensity = 1.0 + Math.sin(time * 1.2 + i * 1.05) * 0.5;
          }
          if (mat?.opacity !== undefined) {
            mat.opacity = 0.3 + Math.sin(time * 0.8 + i * 0.7) * 0.1;
          }
        });
      }
      // Ascending particle field
      if (archAscendRef.current && archAscendGeometry) {
        archAscendRef.current.rotation.y = time * 0.08;
        archAscendRef.current.position.y = ((time * 0.24) % 1.1) - 0.55;
      }
      // Aurora breathing
      if (archAuraRef.current) {
        const s = 1.0 + Math.sin(time * 0.2) * 0.05;
        archAuraRef.current.scale.set(s, s, s);
        const mat = archAuraRef.current.material as THREE.MeshStandardMaterial;
        if (mat?.opacity !== undefined) {
          mat.opacity = 0.04 + Math.sin(time * 0.3) * 0.015;
        }
      }
    }
  });

  // ====== COLOR PALETTES ======
  const WOOD_DARK = '#4a2a10';
  const WOOD_MED = '#6b4530';
  const WOOD_LIGHT = '#8b5e3c';
  const HULL_BROWN = '#2a1a0e';
  const SAIL_WHITE = '#7f9da0';
  const SAIL_TORN = '#b8a890';
  const CHROME = '#b8bcc4';
  const CHROME_DARK = '#6a6e78';
  const CYAN_DIM = '#00aa99';

  // T4 Singularity palette
  const CORE_WHITE = '#eeffff';
  const GOLD = '#ffd700';
  const GOLD_WARM = '#ffaa33';
  const RING_CYAN = '#00ffee';
  const TENDRIL_WHITE = '#ccffff';
  const GHOST_BLUE = '#4488cc';
  const SAIL_CANVAS = '#b9b29b';

  // T5 Architect palette — divine gold & white
  const ARCH_WHITE = '#ffffff';
  const ARCH_GOLD = '#ffe066';
  const ARCH_DIVINE = '#fff5cc';
  const ARCH_CYAN = '#66ffee';
  const adaptiveGlow = 0.9 + score / 100;
  const wakeStrength = 0.1 + (wavePercent / 100) * 0.12;
  const contactRadius = tier === 1 ? 0.9 : 1.6;
  const contactHeight = tier === 1 ? 0.34 : 0.04;

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.8, 1.8, 1.8]}>
      {(tier === 1 || tier === 3) && (
        <group ref={waterContactRef} position={[0, contactHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[contactRadius, 0.028, 7, 42, Math.PI * 1.35]} />
            <meshBasicMaterial
              color={tier === 3 ? '#71e7e1' : '#d7edf0'}
              transparent
              opacity={wakeStrength}
              depthWrite={false}
            />
          </mesh>
          <mesh scale={[1.22, 1.22, 1.22]} rotation={[0, 0, Math.PI * 0.54]}>
            <torusGeometry args={[contactRadius, 0.015, 7, 38, Math.PI * 1.05]} />
            <meshBasicMaterial
              color="#a8cbd2"
              transparent
              opacity={wakeStrength * 0.65}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
      {tier === 2 && (
        <group ref={waterContactRef} position={[0, -0.08, 1.15]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[-0.18, 0.28, 0]} rotation={[0, 0, -0.32]}>
            <planeGeometry args={[0.075, 0.9]} />
            <meshBasicMaterial
              color="#d7edf0"
              transparent
              opacity={wakeStrength * 0.7}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0.18, 0.28, 0]} rotation={[0, 0, 0.32]}>
            <planeGeometry args={[0.075, 0.9]} />
            <meshBasicMaterial
              color="#b8d8dd"
              transparent
              opacity={wakeStrength * 0.58}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 1: WRECKAGE
          ========================================= */}
      {tier === 1 && (
        <group scale={[1.12, 1.12, 1.12]}>
          <pointLight position={[0, 1.4, 2]} intensity={8} color="#b9d5e2" distance={8} />
          <mesh position={[0, 0.12, 0]} rotation={[0.12, 0.34, 0.22]}>
            <boxGeometry args={[0.48, 0.18, 2.1]} />
            <meshStandardMaterial color={WOOD_LIGHT} emissive="#2b1308" emissiveIntensity={0.28} roughness={0.76} metalness={0.05} />
          </mesh>
          <mesh position={[0.74, 0.02, 0.42]} rotation={[0.2, -0.58, 0.34]}>
            <boxGeometry args={[0.34, 0.14, 1.38]} />
            <meshStandardMaterial color={WOOD_MED} emissive="#210d05" emissiveIntensity={0.24} roughness={0.84} />
          </mesh>
          <mesh position={[-0.66, 0.04, -0.38]} rotation={[0.18, 0.82, -0.26]}>
            <boxGeometry args={[0.3, 0.13, 1.24]} />
            <meshStandardMaterial color="#a86d42" emissive="#251006" emissiveIntensity={0.24} roughness={0.8} />
          </mesh>
          <mesh position={[1.0, -0.02, 0.7]} rotation={[0.3, 0.2, -0.18]}>
            <boxGeometry args={[0.2, 0.1, 0.55]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
          </mesh>
          <mesh position={[-0.92, 0.02, -0.66]} rotation={[0.12, -0.34, 0.28]}>
            <boxGeometry args={[0.18, 0.09, 0.48]} />
            <meshStandardMaterial color={WOOD_MED} roughness={0.88} />
          </mesh>
          <mesh position={[0.44, 0.2, -0.72]} rotation={[0.32, 0.18, Math.PI / 4]}>
            <cylinderGeometry args={[0.045, 0.075, 1.8, 7]} />
            <meshStandardMaterial color={WOOD_MED} roughness={0.82} />
          </mesh>
          <mesh position={[-0.38, 0.25, 0.52]} rotation={[0.5, 0.3, 0.4]}>
            <shapeGeometry args={[tornSailShape]} />
            <meshStandardMaterial
              color={SAIL_TORN}
              side={THREE.DoubleSide}
              transparent
              opacity={0.78}
              roughness={0.92}
            />
          </mesh>
          {[[-0.82, 0.18, 0.44], [0.82, 0.12, -0.25], [-0.18, 0.3, -1.0]].map(([x, y, z], index) => (
            <mesh key={`wreck-rib-${index}`} position={[x, y, z]} rotation={[0.2, index * 0.9, 1.2]}>
              <cylinderGeometry args={[0.025, 0.035, 0.74, 6]} />
              <meshStandardMaterial color="#b07a4d" roughness={0.86} />
            </mesh>
          ))}
          <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.18, 32]} />
            <meshBasicMaterial color="#0c263a" transparent opacity={0.42} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 2: UNPROTECTED SLOOP
          ========================================= */}
      {tier === 2 && (
        <group scale={[0.68, 0.68, 0.68]}>
          <pointLight position={[0, 1.5, 1.8]} intensity={5.5} color="#bdd8e6" distance={9} />

          {/* Complete, lightweight hull with a low waterline */}
          <mesh geometry={sloopHullGeometry}>
            <meshStandardMaterial
              color="#86542f"
              emissive="#1a0e05"
              emissiveIntensity={0.12}
              roughness={0.74}
              metalness={0.02}
              flatShading
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Foredeck, open cockpit, and narrow stern deck */}
          <mesh geometry={sloopForedeckGeometry} position={[0, 0.3, 0]}>
            <meshStandardMaterial color={WOOD_LIGHT} roughness={0.76} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={sloopAftDeckGeometry} position={[0, 0.35, 0]}>
            <meshStandardMaterial color={WOOD_LIGHT} roughness={0.78} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={sloopCockpitGeometry} position={[0, 0.285, 0]}>
            <meshStandardMaterial color="#16100c" roughness={0.96} side={THREE.DoubleSide} />
          </mesh>
          {[-0.2, -0.52].map((z) => (
            <mesh key={`sloop-bench-${z}`} position={[0, 0.34, z]}>
              <boxGeometry args={[0.7, 0.035, 0.08]} />
              <meshStandardMaterial color={WOOD_MED} roughness={0.82} />
            </mesh>
          ))}

          {/* Continuous gunwales make the sheer line readable at thumbnail size */}
          {[-1, 1].map((side) => (
            <group key={`sloop-gunwale-${side}`}>
              <mesh position={[side * 0.405, 0.325, -0.27]}>
                <boxGeometry args={[0.035, 0.045, 1.56]} />
                <meshStandardMaterial color="#a36c40" roughness={0.72} />
              </mesh>
              <mesh
                position={[side * 0.21, 0.335, 0.83]}
                rotation={[0, -side * 0.33, 0]}
              >
                <boxGeometry args={[0.035, 0.045, 1.2]} />
                <meshStandardMaterial color="#a36c40" roughness={0.72} />
              </mesh>
              <mesh
                position={[side * 0.34, 0.355, -1.04]}
                rotation={[0, side * 0.23, 0]}
              >
                <boxGeometry args={[0.035, 0.045, 0.5]} />
                <meshStandardMaterial color="#9b653b" roughness={0.76} />
              </mesh>
            </group>
          ))}

          {/* Shallow keel and small exposed rudder */}
          <mesh position={[0, -0.29, -0.05]}>
            <boxGeometry args={[0.07, 0.22, 1.2]} />
            <meshStandardMaterial color={HULL_BROWN} roughness={0.88} />
          </mesh>
          <mesh position={[0, -0.08, -1.42]} rotation={[0.08, 0, 0]}>
            <boxGeometry args={[0.07, 0.34, 0.24]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.84} />
          </mesh>

          {/* Fore-and-aft sloop rig */}
          <mesh position={[0, 1.18, 0.1]}>
            <cylinderGeometry args={[0.026, 0.038, 1.78, 8]} />
            <meshStandardMaterial color={WOOD_MED} roughness={0.68} />
          </mesh>
          <mesh position={[0, 1.06, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.028, 1.05, 7]} />
            <meshStandardMaterial color={WOOD_MED} roughness={0.7} />
          </mesh>
          <group ref={t2SailsRef}>
            <mesh position={[0, 1.04, 0.08]} rotation={[0, -Math.PI / 2, 0]}>
              <shapeGeometry args={[sloopMainSailShape]} />
              <meshStandardMaterial
                color={SAIL_CANVAS}
                emissive="#17140e"
                emissiveIntensity={0.08}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
                roughness={0.9}
              />
            </mesh>
            <mesh position={[0, 0.92, 0.16]} rotation={[0, -Math.PI / 2, 0]}>
              <shapeGeometry args={[sloopJibShape]} />
              <meshStandardMaterial
                color="#c6c0aa"
                emissive="#17140e"
                emissiveIntensity={0.07}
                side={THREE.DoubleSide}
                transparent
                opacity={0.88}
                roughness={0.92}
              />
            </mesh>
          </group>
          <lineSegments geometry={sloopRiggingGeometry}>
            <lineBasicMaterial color="#8e8878" transparent opacity={0.66} />
          </lineSegments>

          {/* One modest lantern, useful but not protective */}
          <mesh position={[-0.28, 0.49, -0.72]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial
              color="#ffc878"
              emissive="#ff8e32"
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
          <pointLight position={[-0.28, 0.49, -0.72]} intensity={1.1} color="#ff9a4a" distance={3} />
        </group>
      )}

      {/* =========================================
          TIER 3: HYBRID CRUISER — wood + tech
          (was T4)
          ========================================= */}
      {tier === 3 && (
        <group>
          <pointLight position={[0, 2.2, 1.8]} intensity={5} color="#74e8e0" distance={12} />
          {/* Hull — wood with chrome plating */}
          <mesh geometry={cruiserHullGeometry} position={[0, 0.3, 0]}>
            <meshStandardMaterial
              color={HULL_BROWN}
              emissive="#071d1c"
              emissiveIntensity={0.24}
              roughness={0.48}
              metalness={0.18}
            />
          </mesh>
          {/* Chrome side panels */}
          {[0.58, -0.58].map((x) => (
            <group key={`t3p-${x}`}>
              <mesh position={[x, 0.3, 0.5]}>
                <boxGeometry args={[0.06, 0.35, 1.5]} />
                <meshStandardMaterial color={CHROME_DARK} metalness={0.88} roughness={0.14} />
              </mesh>
              <mesh position={[x, 0.3, -0.8]}>
                <boxGeometry args={[0.06, 0.35, 1]} />
                <meshStandardMaterial color={CHROME_DARK} metalness={0.88} roughness={0.14} />
              </mesh>
            </group>
          ))}
          {/* Deck */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.1, 0.05, 3.8]} />
            <meshStandardMaterial color="#333c49" metalness={0.72} roughness={0.22} />
          </mesh>
          {/* Bow */}
          <mesh position={[0, 0.4, 2.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.82} roughness={0.18} />
          </mesh>
          {/* Railing */}
          {[0.62, -0.62].map((x) => (
            <mesh key={`t3r-${x}`} position={[x, 0.75, 0.5]}>
              <boxGeometry args={[0.02, 0.18, 3.2]} />
              <meshStandardMaterial color={CHROME} metalness={0.82} roughness={0.17} />
            </mesh>
          ))}
          {/* Captain's cabin */}
          <mesh position={[0, 0.95, -1.5]}>
            <boxGeometry args={[0.9, 0.6, 0.8]} />
            <meshStandardMaterial color="#303946" metalness={0.76} roughness={0.2} />
          </mesh>
          {/* Main mast + sails */}
          <group position={[0, 0.6, 0.3]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.06, 3.5, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.82, 0.3]} scale={[1.45, 1.7, 1]}>
              <shapeGeometry args={[cruiserSailShape]} />
              <meshStandardMaterial
                color={SAIL_WHITE}
                emissive="#174d53"
                emissiveIntensity={0.1}
                side={THREE.DoubleSide}
                transparent
                opacity={0.8}
                roughness={0.58}
                metalness={0.06}
              />
            </mesh>
            <mesh position={[0, 2.04, 0.25]} scale={[1.14, 0.92, 1]}>
              <shapeGeometry args={[cruiserSailShape]} />
              <meshStandardMaterial
                color={SAIL_WHITE}
                emissive="#174d53"
                emissiveIntensity={0.09}
                side={THREE.DoubleSide}
                transparent
                opacity={0.76}
                roughness={0.58}
                metalness={0.06}
              />
            </mesh>
            {[-0.25, 0.26].map((x) => (
              <mesh key={`main-sail-trace-${x}`} position={[x, 0.82, 0.32]}>
                <boxGeometry args={[0.018, 1.35, 0.012]} />
                <meshBasicMaterial color={CYAN_DIM} transparent opacity={0.46} />
              </mesh>
            ))}
            <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 1.8, 6]} />
              <meshStandardMaterial color={CHROME} metalness={0.5} />
            </mesh>
          </group>
          {/* Fore mast */}
          <group position={[0, 0.6, 1.5]}>
            <mesh>
              <cylinderGeometry args={[0.035, 0.05, 3, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.64, 0.25]} scale={[1.18, 1.32, 1]}>
              <shapeGeometry args={[cruiserSailShape]} />
              <meshStandardMaterial
                color={SAIL_WHITE}
                emissive="#174d53"
                emissiveIntensity={0.09}
                side={THREE.DoubleSide}
                transparent
                opacity={0.78}
                roughness={0.58}
                metalness={0.06}
              />
            </mesh>
          </group>
          {/* Circuit lines */}
          {[0.62, -0.62].map((x) => (
            <mesh key={`t3c-${x}`} position={[x, 0.35, 0]}>
              <boxGeometry args={[0.01, 0.03, 2.8]} />
              <meshStandardMaterial
                color={CYAN_DIM}
                emissive={CYAN_DIM}
                emissiveIntensity={adaptiveGlow}
                toneMapped={false}
              />
            </mesh>
          ))}
          {/* Neural nodes on rigging */}
          {[[-0.3, 2.2, 0.3], [0.3, 2.2, 0.3], [0, 1.8, 1.5], [0, 1.5, -0.5]].map(([x, y, z], i) => (
            <mesh key={`t3n-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color={CYAN_DIM}
                emissive={CYAN_DIM}
                emissiveIntensity={adaptiveGlow * 1.7}
                toneMapped={false}
              />
            </mesh>
          ))}
          <mesh position={[0, 2.2, 0.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.6, 4]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1} />
          </mesh>
          {/* Radar + antenna */}
          <mesh position={[0, 1.4, -1.5]} rotation={[0.3, 0, 0]}>
            <circleGeometry args={[0.2, 16, 0, Math.PI]} />
            <meshStandardMaterial color={CHROME} side={THREE.DoubleSide} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.3, 1.8, -1.5]}>
            <cylinderGeometry args={[0.01, 0.01, 0.8, 4]} />
            <meshStandardMaterial color={CHROME} metalness={0.8} />
          </mesh>
          <mesh position={[0.3, 2.2, -1.5]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1.5} />
          </mesh>
          <group ref={t3RadarRef} position={[0, 1.36, -1.5]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.24, 0.28, 32]} />
              <meshBasicMaterial color="#72fff1" transparent opacity={0.52} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <planeGeometry args={[0.5, 0.025]} />
              <meshBasicMaterial color="#d4fff9" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          </group>
          {/* LEDs */}
          {[[0.5, 0.85, 1.5], [-0.5, 0.85, 1.5]].map(([x, y, z], i) => (
            <mesh key={`t3l-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={2} />
            </mesh>
          ))}
          {/* Digital rain */}
          {t3RainGeometry && (
            <points ref={t3RainRef} geometry={t3RainGeometry} position={[0, 0.5, 0]}>
              <pointsMaterial color={CYAN_DIM} size={0.04} transparent opacity={0.5} sizeAttenuation />
            </points>
          )}
          {/* Drone */}
          <group ref={t3DronesRef}>
            {[0, 1, 2].map((index) => (
              <group key={`drone-${index}`}>
                <mesh>
                  <octahedronGeometry args={[0.075, 0]} />
                  <meshStandardMaterial
                    color={index === 1 ? '#ffd36a' : CYAN_DIM}
                    emissive={index === 1 ? '#ffd36a' : CYAN_DIM}
                    emissiveIntensity={2.5}
                    toneMapped={false}
                  />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.12, 0.14, 16]} />
                  <meshBasicMaterial color={CYAN_DIM} transparent opacity={0.4} side={THREE.DoubleSide} />
                </mesh>
              </group>
            ))}
          </group>
          {/* Predictive path */}
          <mesh ref={t3PathRef} position={[0, 0.05, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.72, 2.3]} />
            <meshBasicMaterial color={CYAN_DIM} transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 4: AI FLAGSHIP
          Geometric command intelligence hovering above the storm.
          ========================================= */}
      {tier === 4 && (
        <group>
          <pointLight position={[0, 0.5, 1.2]} intensity={4.5} color={RING_CYAN} distance={15} />
          <pointLight position={[0, 1.8, -1]} intensity={2.3} color={GOLD} distance={12} />
          {/* Geometric Core */}
          <group ref={coreRef}>
            <mesh>
              <icosahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial color={CORE_WHITE} emissive={CORE_WHITE} emissiveIntensity={3} transparent opacity={0.85} />
            </mesh>
            <mesh>
              <icosahedronGeometry args={[0.75, 0]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={1.5} wireframe />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.45, 16, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} transparent opacity={0.3} />
            </mesh>
          </group>

          {/* Gyroscopic rings */}
          <mesh ref={ring1Ref}>
            <torusGeometry args={[1.3, 0.025, 12, 64]} />
            <meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={2} />
          </mesh>
          <mesh ref={ring2Ref}>
            <torusGeometry args={[1.6, 0.02, 12, 64]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2} />
          </mesh>
          <mesh ref={ring3Ref}>
            <torusGeometry args={[1.9, 0.015, 12, 64]} />
            <meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={1.5} transparent opacity={0.8} />
          </mesh>

          {/* Orbiting fragments */}
          <group ref={fragmentsRef}>
            <mesh><octahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={2.5} /></mesh>
            <mesh><octahedronGeometry args={[0.12, 0]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2.5} /></mesh>
            <mesh><tetrahedronGeometry args={[0.14, 0]} /><meshStandardMaterial color={CORE_WHITE} emissive={CORE_WHITE} emissiveIntensity={2} /></mesh>
            <mesh><tetrahedronGeometry args={[0.11, 0]} /><meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={2} /></mesh>
            <mesh><dodecahedronGeometry args={[0.13, 0]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2} /></mesh>
            <mesh><dodecahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color={CORE_WHITE} emissive={CORE_WHITE} emissiveIntensity={2} /></mesh>
            <mesh><icosahedronGeometry args={[0.09, 0]} /><meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={2.5} /></mesh>
            <mesh><icosahedronGeometry args={[0.11, 0]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2} wireframe /></mesh>
          </group>

          {/* Energy tendrils */}
          <group ref={tendrilsRef}>
            <mesh position={[0.3, -0.8, 0.3]} rotation={[0.1, 0, 0.05]}>
              <cylinderGeometry args={[0.02, 0.005, 2.5, 6]} />
              <meshStandardMaterial color={TENDRIL_WHITE} emissive={RING_CYAN} emissiveIntensity={1.5} transparent opacity={0.6} />
            </mesh>
            <mesh position={[-0.3, -0.8, -0.2]} rotation={[-0.08, 0, -0.06]}>
              <cylinderGeometry args={[0.02, 0.005, 2.5, 6]} />
              <meshStandardMaterial color={TENDRIL_WHITE} emissive={RING_CYAN} emissiveIntensity={1.5} transparent opacity={0.6} />
            </mesh>
            <mesh position={[0, -0.8, -0.4]} rotation={[0.12, 0.05, 0]}>
              <cylinderGeometry args={[0.015, 0.004, 2.2, 6]} />
              <meshStandardMaterial color={TENDRIL_WHITE} emissive={RING_CYAN} emissiveIntensity={1.2} transparent opacity={0.5} />
            </mesh>
            <mesh position={[0.2, 2.5, 0.1]}>
              <cylinderGeometry args={[0.005, 0.025, 3, 6]} />
              <meshStandardMaterial color={TENDRIL_WHITE} emissive={GOLD} emissiveIntensity={1.5} transparent opacity={0.5} />
            </mesh>
            <mesh position={[-0.15, 2.5, -0.2]}>
              <cylinderGeometry args={[0.005, 0.02, 3, 6]} />
              <meshStandardMaterial color={TENDRIL_WHITE} emissive={GOLD} emissiveIntensity={1.2} transparent opacity={0.4} />
            </mesh>
          </group>

          {/* Ascending data */}
          {t4AscendGeometry && (
            <points ref={t4AscendRef} geometry={t4AscendGeometry}>
              <pointsMaterial color="#ffffff" size={0.04} transparent opacity={0.7} sizeAttenuation />
            </points>
          )}

          {/* Calm water disc */}
          <mesh position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 48]} />
            <meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={0.4} transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -1.88, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.5, 32]} />
            <meshStandardMaterial color={CORE_WHITE} emissive={CORE_WHITE} emissiveIntensity={0.6} transparent opacity={0.1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -1.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3, 0.03, 8, 64]} />
            <meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={1} transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, -1.83, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.2, 2.28, 6]} />
            <meshBasicMaterial
              color={GOLD}
              transparent
              opacity={0.26}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Ghost layer */}
          <mesh ref={ghostRef}>
            <icosahedronGeometry args={[0.75, 0]} />
            <meshStandardMaterial color={GHOST_BLUE} emissive={GHOST_BLUE} emissiveIntensity={0.5} transparent opacity={0.08} wireframe />
          </mesh>

          {/* Ambient glow */}
          <mesh>
            <sphereGeometry args={[2.2, 16, 16]} />
            <meshStandardMaterial color={GOLD_WARM} emissive={GOLD_WARM} emissiveIntensity={0.3} transparent opacity={0.03} side={THREE.BackSide} />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 5: THE SINGULARITY
          A cosmic intelligence that reshapes reality itself.
          Not just above the storm — it IS the storm's master.
          ========================================= */}
      {tier === 5 && (
        <group>
          <pointLight position={[0, 0.5, 0]} intensity={7} color={ARCH_DIVINE} distance={22} />
          <pointLight position={[0, -2, 0]} intensity={3.2} color={ARCH_CYAN} distance={18} />

          {/* ======================================
              CENTRAL CONSCIOUSNESS — The Mind of God
              Multi-layered geometric core, divine gold + white
              ====================================== */}
          <group ref={archCoreRef}>
            {/* Innermost singularity point — intense white */}
            <mesh>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color={ARCH_WHITE} emissive={ARCH_WHITE} emissiveIntensity={8} transparent opacity={0.9} />
            </mesh>
            {/* Dodecahedron shell — divine gold, solid */}
            <mesh>
              <dodecahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial color={ARCH_DIVINE} emissive={ARCH_GOLD} emissiveIntensity={2.5} transparent opacity={0.6} />
            </mesh>
            {/* Icosahedron wireframe — larger, cyan accents */}
            <mesh>
              <icosahedronGeometry args={[0.9, 0]} />
              <meshStandardMaterial color={ARCH_CYAN} emissive={ARCH_CYAN} emissiveIntensity={1.5} wireframe />
            </mesh>
            {/* Outermost dodecahedron — faint gold wireframe */}
            <mesh>
              <dodecahedronGeometry args={[1.2, 0]} />
              <meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={1} wireframe transparent opacity={0.5} />
            </mesh>
          </group>

          {/* ======================================
              DYSON CAGE — 5 rings forming a sphere of influence
              Larger, more numerous than T4's 3 rings
              ====================================== */}
          <mesh ref={archCage1Ref}>
            <torusGeometry args={[2.0, 0.035, 16, 80]} />
            <meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={2.5} />
          </mesh>
          <mesh ref={archCage2Ref}>
            <torusGeometry args={[2.5, 0.03, 16, 80]} />
            <meshStandardMaterial color={ARCH_CYAN} emissive={ARCH_CYAN} emissiveIntensity={2} />
          </mesh>
          <mesh ref={archCage3Ref}>
            <torusGeometry args={[3.0, 0.035, 16, 80]} />
            <meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={2} />
          </mesh>
          <mesh ref={archCage4Ref}>
            <torusGeometry args={[3.5, 0.025, 16, 80]} />
            <meshStandardMaterial color={ARCH_CYAN} emissive={ARCH_CYAN} emissiveIntensity={1.8} transparent opacity={0.8} />
          </mesh>
          <mesh ref={archCage5Ref}>
            <torusGeometry args={[4.0, 0.02, 16, 80]} />
            <meshStandardMaterial color={ARCH_DIVINE} emissive={ARCH_DIVINE} emissiveIntensity={1.5} transparent opacity={0.6} />
          </mesh>

          {/* ======================================
              CONSTELLATION — 12 orbiting consciousness nodes
              ====================================== */}
          <group ref={archNodesRef}>
            {/* Octahedrons — gold */}
            <mesh><octahedronGeometry args={[0.2, 0]} /><meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={3} /></mesh>
            <mesh><octahedronGeometry args={[0.17, 0]} /><meshStandardMaterial color={ARCH_CYAN} emissive={ARCH_CYAN} emissiveIntensity={3} /></mesh>
            <mesh><octahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color={ARCH_WHITE} emissive={ARCH_WHITE} emissiveIntensity={2.5} /></mesh>
            {/* Tetrahedrons */}
            <mesh><tetrahedronGeometry args={[0.18, 0]} /><meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={2.5} /></mesh>
            <mesh><tetrahedronGeometry args={[0.16, 0]} /><meshStandardMaterial color={ARCH_DIVINE} emissive={ARCH_DIVINE} emissiveIntensity={2.5} /></mesh>
            <mesh><tetrahedronGeometry args={[0.14, 0]} /><meshStandardMaterial color={ARCH_CYAN} emissive={ARCH_CYAN} emissiveIntensity={2} /></mesh>
            {/* Dodecahedrons */}
            <mesh><dodecahedronGeometry args={[0.16, 0]} /><meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={2.5} /></mesh>
            <mesh><dodecahedronGeometry args={[0.13, 0]} /><meshStandardMaterial color={ARCH_WHITE} emissive={ARCH_WHITE} emissiveIntensity={2} /></mesh>
            <mesh><dodecahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color={ARCH_CYAN} emissive={ARCH_CYAN} emissiveIntensity={2} wireframe /></mesh>
            {/* Icosahedrons */}
            <mesh><icosahedronGeometry args={[0.14, 0]} /><meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={3} /></mesh>
            <mesh><icosahedronGeometry args={[0.12, 0]} /><meshStandardMaterial color={ARCH_DIVINE} emissive={ARCH_DIVINE} emissiveIntensity={2.5} wireframe /></mesh>
            <mesh><icosahedronGeometry args={[0.17, 0]} /><meshStandardMaterial color={ARCH_CYAN} emissive={ARCH_CYAN} emissiveIntensity={2} /></mesh>
          </group>

          {/* ======================================
              ENERGY PILLARS — 6 pillars connecting to ocean
              Hexagonal arrangement, divine light reaching down
              ====================================== */}
          <group ref={archPillarsRef}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * Math.PI * 2) / 6;
              const x = Math.cos(angle) * 1.5;
              const z = Math.sin(angle) * 1.5;
              return (
                <mesh key={`pillar-${i}`} position={[x, -1.2, z]}>
                  <cylinderGeometry args={[0.04, 0.01, 2.8, 6]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? ARCH_GOLD : ARCH_CYAN}
                    emissive={i % 2 === 0 ? ARCH_GOLD : ARCH_CYAN}
                    emissiveIntensity={1.0}
                    transparent
                    opacity={0.35}
                  />
                </mesh>
              );
            })}
          </group>

          {/* ======================================
              SKY BEAM — Column of light ascending to heaven
              The Architect commands both ocean and sky
              ====================================== */}
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.01, 0.15, 6, 8]} />
            <meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={2} transparent opacity={0.35} />
          </mesh>
          {/* Wider glow around beam */}
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.05, 0.4, 6, 8]} />
            <meshStandardMaterial color={ARCH_DIVINE} emissive={ARCH_DIVINE} emissiveIntensity={0.8} transparent opacity={0.08} />
          </mesh>

          {/* ======================================
              ASCENDING PARTICLE FIELD — Visible processing
              500 particles, wider column than T4
              ====================================== */}
          {archAscendGeometry && (
            <points ref={archAscendRef} geometry={archAscendGeometry}>
              <pointsMaterial color={ARCH_DIVINE} size={0.05} transparent opacity={0.6} sizeAttenuation />
            </points>
          )}

          {/* ======================================
              REALITY DISTORTION DISC — Water level control
              Larger than T4's disc
              ====================================== */}
          <mesh position={[0, -2.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[4.5, 64]} />
            <meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={0.5} transparent opacity={0.06} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -2.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2, 32]} />
            <meshStandardMaterial color={ARCH_WHITE} emissive={ARCH_WHITE} emissiveIntensity={0.8} transparent opacity={0.1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -2.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[4.5, 0.04, 8, 80]} />
            <meshStandardMaterial color={ARCH_GOLD} emissive={ARCH_GOLD} emissiveIntensity={1.5} transparent opacity={0.25} />
          </mesh>
          {/* Inner ring */}
          <mesh position={[0, -2.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2, 0.03, 8, 64]} />
            <meshStandardMaterial color={ARCH_CYAN} emissive={ARCH_CYAN} emissiveIntensity={1.2} transparent opacity={0.2} />
          </mesh>
          {[1.15, 2.8, 3.65].map((radius, index) => (
            <mesh
              key={`singularity-glyph-${radius}`}
              position={[0, -2.08 + index * 0.006, 0]}
              rotation={[Math.PI / 2, 0, index * 0.18]}
            >
              <ringGeometry args={[radius, radius + 0.035, index === 1 ? 6 : 12]} />
              <meshBasicMaterial
                color={index === 1 ? ARCH_GOLD : ARCH_CYAN}
                transparent
                opacity={0.18 - index * 0.025}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}

          {/* ======================================
              AURORA SHELL — Atmospheric influence
              The Architect reshapes reality around itself
              ====================================== */}
          <mesh ref={archAuraRef}>
            <sphereGeometry args={[6, 24, 24]} />
            <meshStandardMaterial
              color={ARCH_GOLD}
              emissive={ARCH_GOLD}
              emissiveIntensity={0.2}
              transparent
              opacity={0.04}
              side={THREE.BackSide}
            />
          </mesh>

          {/* Inner divine glow */}
          <mesh>
            <sphereGeometry args={[3, 20, 20]} />
            <meshStandardMaterial
              color={ARCH_WHITE}
              emissive={ARCH_WHITE}
              emissiveIntensity={0.4}
              transparent
              opacity={0.03}
              side={THREE.BackSide}
            />
          </mesh>

        </group>
      )}
    </group>
  );
}
