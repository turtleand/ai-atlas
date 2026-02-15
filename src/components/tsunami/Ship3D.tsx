import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWaveHeight } from './Ocean3D';

interface Ship3DProps {
  tier: 1 | 2 | 3 | 4 | 5;
  score: number;
  wavePercent: number;
  stormIntensity: number;
}

export function Ship3D({ tier, stormIntensity }: Ship3DProps) {
  const groupRef = useRef<THREE.Group>(null);

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

  // ====== T3 RAIN PARTICLES ======
  const t3RainGeometry = useMemo(() => {
    if (tier !== 3) return null;
    const count = 40;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.5;
      positions[i * 3 + 1] = Math.random() * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [tier]);

  // ====== T4 ASCENDING DATA STREAM ======
  const t4AscendGeometry = useMemo(() => {
    if (tier !== 4) return null;
    const count = 250;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.7;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 7 - 2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [tier]);

  // ====== T5 ARCHITECT PARTICLE FIELD ======
  const archAscendGeometry = useMemo(() => {
    if (tier !== 5) return null;
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 10 - 3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [tier]);

  // ====== ANIMATION LOOP ======
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    // === TIERS 1-3: Wave following ===
    if (tier <= 3) {
      const waveY = getWaveHeight(0, 0, time, stormIntensity);
      const sinkOffset = tier === 1 ? -0.5 - Math.sin(time * 0.3) * 0.2 :
                         tier === 2 ? -0.2 : 0;
      groupRef.current.position.y = waveY + sinkOffset;

      const tiltFactor = tier === 3 ? 0.35 : tier === 2 ? 1.3 : 1.5;
      const dx = getWaveHeight(0.5, 0, time, stormIntensity) - getWaveHeight(-0.5, 0, time, stormIntensity);
      const dz = getWaveHeight(0, 0.5, time, stormIntensity) - getWaveHeight(0, -0.5, time, stormIntensity);
      groupRef.current.rotation.z = Math.atan2(dx, 1) * tiltFactor;
      groupRef.current.rotation.x = Math.atan2(dz, 1) * tiltFactor * 0.7;
      if (tier === 2) groupRef.current.rotation.z += 0.15;
      if (tier === 1) groupRef.current.rotation.z += Math.sin(time * 0.5) * 0.3;
    }

    // === TIER 4: Hover (The Singularity) ===
    if (tier === 4) {
      groupRef.current.position.y = 2.0 + Math.sin(time * 0.25) * 0.15;
      groupRef.current.rotation.z = 0;
      groupRef.current.rotation.x = 0;
    }

    // === TIER 5: Higher hover (The Architect) ===
    if (tier === 5) {
      groupRef.current.position.y = 3.5 + Math.sin(time * 0.15) * 0.1;
      groupRef.current.rotation.z = 0;
      groupRef.current.rotation.x = 0;
    }

    // === T3 animations (Hybrid Cruiser) ===
    if (tier === 3) {
      if (t3RainRef.current && t3RainGeometry) {
        const positions = t3RainGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] -= delta * 2.5;
          if (positions[i * 3 + 1] < -0.3) {
            positions[i * 3 + 1] = 3.5 + Math.random() * 0.5;
            positions[i * 3] = (Math.random() - 0.5) * 2.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
          }
        }
        t3RainGeometry.attributes.position.needsUpdate = true;
      }
      if (t3DronesRef.current) {
        t3DronesRef.current.children.forEach((drone, i) => {
          const angle = time * 0.35 + i * Math.PI * 2;
          drone.position.set(Math.cos(angle) * 1.8, 1.2 + Math.sin(time * 0.5) * 0.3, Math.sin(angle) * 1.8);
        });
      }
      if (t3PathRef.current) {
        const mat = t3PathRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.08 + Math.sin(time * 1.5) * 0.03;
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
        const positions = t4AscendGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] += delta * 1.8;
          if (positions[i * 3 + 1] > 5) {
            positions[i * 3 + 1] = -2;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.7;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
          }
        }
        t4AscendGeometry.attributes.position.needsUpdate = true;
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
        const positions = archAscendGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] += delta * 1.2;
          if (positions[i * 3 + 1] > 7) {
            positions[i * 3 + 1] = -3;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2.5;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
          }
        }
        archAscendGeometry.attributes.position.needsUpdate = true;
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
  const SAIL_WHITE = '#f0e8dc';
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

  // T5 Architect palette — divine gold & white
  const ARCH_WHITE = '#ffffff';
  const ARCH_GOLD = '#ffe066';
  const ARCH_DIVINE = '#fff5cc';
  const ARCH_CYAN = '#66ffee';

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.8, 1.8, 1.8]}>

      {/* =========================================
          TIER 1: WRECKAGE
          ========================================= */}
      {tier === 1 && (
        <group>
          <mesh position={[0, 0.1, 0]} rotation={[0.1, 0.3, 0.2]}>
            <boxGeometry args={[0.4, 0.15, 1.8]} />
            <meshStandardMaterial color={WOOD_LIGHT} />
          </mesh>
          <mesh position={[0.6, 0.05, 0.4]} rotation={[0.2, -0.5, 0.3]}>
            <boxGeometry args={[0.3, 0.12, 1.2]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[-0.5, 0.08, -0.3]} rotation={[0.15, 0.7, -0.2]}>
            <boxGeometry args={[0.25, 0.1, 1]} />
            <meshStandardMaterial color={WOOD_LIGHT} />
          </mesh>
          <mesh position={[0.8, 0.02, 0.6]}>
            <boxGeometry args={[0.15, 0.08, 0.4]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          <mesh position={[-0.7, 0.03, -0.5]}>
            <boxGeometry args={[0.12, 0.06, 0.3]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[0.4, 0.15, -0.6]} rotation={[0.3, 0.2, Math.PI / 4]}>
            <cylinderGeometry args={[0.04, 0.06, 1.5, 6]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[-0.3, 0.12, 0.5]} rotation={[0.5, 0.3, 0.4]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshStandardMaterial color={SAIL_TORN} side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 2: DAMAGED SLOOP
          ========================================= */}
      {tier === 2 && (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.8, 0.6, 2]} />
            <meshStandardMaterial color={WOOD_LIGHT} emissive="#1a0e05" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.7, 0.05, 1.8]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[0, 0.4, 1.2]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={WOOD_LIGHT} />
          </mesh>
          <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.04, 0.06, 2, 8]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[0, 1.1, 0.3]}>
            <planeGeometry args={[0.8, 1, 5, 5]} />
            <meshStandardMaterial color={SAIL_TORN} side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[0.42, 0.75, 0.5]}>
            <boxGeometry args={[0.02, 0.15, 0.8]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[0, 0.63, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 1.2]} />
            <meshStandardMaterial color="#1a3a5c" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.45, 0.25, -0.5]} rotation={[0, 0.3, 0.1]}>
            <boxGeometry args={[0.05, 0.3, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 3: HYBRID CRUISER — wood + tech
          (was T4)
          ========================================= */}
      {tier === 3 && (
        <group>
          {/* Hull — wood with chrome plating */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.6, 4]} />
            <meshStandardMaterial color={HULL_BROWN} emissive="#0a0804" emissiveIntensity={0.3} />
          </mesh>
          {/* Chrome side panels */}
          {[0.58, -0.58].map((x) => (
            <group key={`t3p-${x}`}>
              <mesh position={[x, 0.3, 0.5]}>
                <boxGeometry args={[0.06, 0.35, 1.5]} />
                <meshStandardMaterial color={CHROME_DARK} metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[x, 0.3, -0.8]}>
                <boxGeometry args={[0.06, 0.35, 1]} />
                <meshStandardMaterial color={CHROME_DARK} metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* Deck */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.1, 0.05, 3.8]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Bow */}
          <mesh position={[0, 0.4, 2.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Railing */}
          {[0.62, -0.62].map((x) => (
            <mesh key={`t3r-${x}`} position={[x, 0.75, 0.5]}>
              <boxGeometry args={[0.02, 0.18, 3.2]} />
              <meshStandardMaterial color={CHROME} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* Captain's cabin */}
          <mesh position={[0, 0.95, -1.5]}>
            <boxGeometry args={[0.9, 0.6, 0.8]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Main mast + sails */}
          <group position={[0, 0.6, 0.3]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.06, 3.5, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.8, 0.3]}>
              <planeGeometry args={[1.5, 1.8, 5, 5]} />
              <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, 2, 0.25]}>
              <planeGeometry args={[1.2, 1, 4, 4]} />
              <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.85} />
            </mesh>
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
            <mesh position={[0, 0.6, 0.25]}>
              <planeGeometry args={[1.3, 1.5, 4, 4]} />
              <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>
          </group>
          {/* Circuit lines */}
          {[0.62, -0.62].map((x) => (
            <mesh key={`t3c-${x}`} position={[x, 0.35, 0]}>
              <boxGeometry args={[0.01, 0.03, 2.8]} />
              <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1.0} />
            </mesh>
          ))}
          {/* Neural nodes on rigging */}
          {[[-0.3, 2.2, 0.3], [0.3, 2.2, 0.3], [0, 1.8, 1.5], [0, 1.5, -0.5]].map(([x, y, z], i) => (
            <mesh key={`t3n-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={2} />
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
            <mesh>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={2} />
            </mesh>
          </group>
          {/* Predictive path */}
          <mesh ref={t3PathRef} position={[0, 0.05, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.6, 2]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={0.5} transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 4: THE SINGULARITY
          Geometric intelligence hovering above the storm.
          (was T5)
          ========================================= */}
      {tier === 4 && (
        <group>
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
          TIER 5: THE ARCHITECT
          A cosmic intelligence that reshapes reality itself.
          Not just above the storm — it IS the storm's master.
          ========================================= */}
      {tier === 5 && (
        <group>

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
