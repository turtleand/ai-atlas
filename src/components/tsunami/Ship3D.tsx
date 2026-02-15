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

  // === T4 refs ===
  const t4RainRef = useRef<THREE.Points>(null);
  const t4DronesRef = useRef<THREE.Group>(null);
  const t4PathRef = useRef<THREE.Mesh>(null);

  // === T5 refs (The Singularity) ===
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const fragmentsRef = useRef<THREE.Group>(null);
  const ascendRef = useRef<THREE.Points>(null);
  const ghostRef = useRef<THREE.Mesh>(null);
  const tendrilsRef = useRef<THREE.Group>(null);

  // ====== T4 RAIN PARTICLES ======
  const t4RainGeometry = useMemo(() => {
    if (tier !== 4) return null;
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

  // ====== T5 ASCENDING DATA STREAM ======
  const ascendGeometry = useMemo(() => {
    if (tier !== 5) return null;
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

  // ====== ANIMATION LOOP ======
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    // === TIERS 1-4: Wave following ===
    if (tier <= 4) {
      const waveY = getWaveHeight(0, 0, time, stormIntensity);
      const sinkOffset = tier === 1 ? -0.5 - Math.sin(time * 0.3) * 0.2 :
                         tier === 2 ? -0.2 : 0;
      groupRef.current.position.y = waveY + sinkOffset;

      const tiltFactor = tier === 4 ? 0.35 : tier === 3 ? 0.9 : tier === 2 ? 1.3 : 1.5;
      const dx = getWaveHeight(0.5, 0, time, stormIntensity) - getWaveHeight(-0.5, 0, time, stormIntensity);
      const dz = getWaveHeight(0, 0.5, time, stormIntensity) - getWaveHeight(0, -0.5, time, stormIntensity);
      groupRef.current.rotation.z = Math.atan2(dx, 1) * tiltFactor;
      groupRef.current.rotation.x = Math.atan2(dz, 1) * tiltFactor * 0.7;
      if (tier === 2) groupRef.current.rotation.z += 0.15;
      if (tier === 1) groupRef.current.rotation.z += Math.sin(time * 0.5) * 0.3;
    }

    // === TIER 5: HOVER above storm ===
    if (tier === 5) {
      groupRef.current.position.y = 2.0 + Math.sin(time * 0.25) * 0.15;
      groupRef.current.rotation.z = 0;
      groupRef.current.rotation.x = 0;
    }

    // === T4 animations ===
    if (tier === 4) {
      // T4 digital rain
      if (t4RainRef.current && t4RainGeometry) {
        const positions = t4RainGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] -= delta * 2.5;
          if (positions[i * 3 + 1] < -0.3) {
            positions[i * 3 + 1] = 3.5 + Math.random() * 0.5;
            positions[i * 3] = (Math.random() - 0.5) * 2.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
          }
        }
        t4RainGeometry.attributes.position.needsUpdate = true;
      }
      // T4 drone
      if (t4DronesRef.current) {
        t4DronesRef.current.children.forEach((drone, i) => {
          const angle = time * 0.35 + i * Math.PI * 2;
          drone.position.set(Math.cos(angle) * 1.8, 1.2 + Math.sin(time * 0.5) * 0.3, Math.sin(angle) * 1.8);
        });
      }
      // T4 predictive path pulse
      if (t4PathRef.current) {
        const mat = t4PathRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.08 + Math.sin(time * 1.5) * 0.03;
      }
    }

    // === T5 animations (The Singularity) ===
    if (tier === 5) {
      // Core rotation
      if (coreRef.current) {
        coreRef.current.rotation.y = time * 0.15;
        coreRef.current.rotation.x = time * 0.08;
        coreRef.current.rotation.z = time * 0.05;
      }

      // Gyroscopic rings — each on different axis at different speed
      if (ring1Ref.current) {
        ring1Ref.current.rotation.x = time * 0.25;
        ring1Ref.current.rotation.y = time * 0.1;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.y = time * 0.2;
        ring2Ref.current.rotation.z = time * 0.12;
      }
      if (ring3Ref.current) {
        ring3Ref.current.rotation.z = time * 0.3;
        ring3Ref.current.rotation.x = time * 0.08;
      }

      // Levitating fragments orbit
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

      // Ascending data stream
      if (ascendRef.current && ascendGeometry) {
        const positions = ascendGeometry.attributes.position.array as Float32Array;
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
        ascendGeometry.attributes.position.needsUpdate = true;
      }

      // Ghost layer — different rotation + breathing scale
      if (ghostRef.current) {
        ghostRef.current.rotation.y = time * 0.06;
        ghostRef.current.rotation.z = time * 0.04;
        const s = 1.7 + Math.sin(time * 0.4) * 0.08;
        ghostRef.current.scale.set(s, s, s);
      }

      // Energy tendrils pulse
      if (tendrilsRef.current) {
        tendrilsRef.current.children.forEach((tendril, i) => {
          const mat = (tendril as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat?.emissiveIntensity !== undefined) {
            mat.emissiveIntensity = 1.5 + Math.sin(time * 2 + i * 0.8) * 0.8;
          }
        });
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
  const CYAN = '#00ffdd';
  const CYAN_DIM = '#00aa99';

  // T5 — The Singularity palette
  const CORE_WHITE = '#eeffff';
  const GOLD = '#ffd700';
  const GOLD_WARM = '#ffaa33';
  const RING_CYAN = '#00ffee';
  const TENDRIL_WHITE = '#ccffff';
  const GHOST_BLUE = '#4488cc';

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
          TIER 3: BRIGANTINE — traditional ship
          ========================================= */}
      {tier === 3 && (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.6, 3]} />
            <meshStandardMaterial color={HULL_BROWN} emissive="#0a0804" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.1, 0.05, 2.8]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[0, 0.4, 1.7]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={HULL_BROWN} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.15, 0.05, 2.5]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          {[0.61, -0.61].map((x) => (
            <mesh key={`s3s-${x}`} position={[x, 0.4, 0]}>
              <boxGeometry args={[0.02, 0.08, 2.5]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))}
          {[0.62, -0.62].map((x) => (
            <mesh key={`s3r-${x}`} position={[x, 0.75, 0.5]}>
              <boxGeometry args={[0.02, 0.15, 2.5]} />
              <meshStandardMaterial color={WOOD_MED} />
            </mesh>
          ))}
          <mesh position={[0, 0.9, -1]}>
            <boxGeometry args={[0.9, 0.5, 0.8]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          <group position={[0, 0.6, 0]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.06, 3.5, 8]} />
              <meshStandardMaterial color={WOOD_MED} />
            </mesh>
            <mesh position={[0, 0.8, 0.3]}>
              <planeGeometry args={[1.5, 1.8, 5, 5]} />
              <meshStandardMaterial color={SAIL_WHITE} emissive="#302820" emissiveIntensity={0.3} side={THREE.DoubleSide} transparent opacity={0.95} />
            </mesh>
            <mesh position={[0, 2, 0.25]}>
              <planeGeometry args={[1.2, 1, 4, 4]} />
              <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 1.8, 6]} />
              <meshStandardMaterial color={WOOD_MED} />
            </mesh>
            <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 1.5, 6]} />
              <meshStandardMaterial color={WOOD_MED} />
            </mesh>
          </group>
          <mesh position={[0.3, 1.6, 0.15]} rotation={[0, 0, -0.6]}>
            <cylinderGeometry args={[0.01, 0.01, 1.5, 4]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          <mesh position={[-0.3, 1.6, 0.15]} rotation={[0, 0, 0.6]}>
            <cylinderGeometry args={[0.01, 0.01, 1.5, 4]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 4: HYBRID CRUISER — wood + tech
          ========================================= */}
      {tier === 4 && (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.6, 4]} />
            <meshStandardMaterial color={HULL_BROWN} emissive="#0a0804" emissiveIntensity={0.3} />
          </mesh>
          {[0.58, -0.58].map((x) => (
            <group key={`t4p-${x}`}>
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
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.1, 0.05, 3.8]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.4, 2.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.7} roughness={0.3} />
          </mesh>
          {[0.62, -0.62].map((x) => (
            <mesh key={`t4r-${x}`} position={[x, 0.75, 0.5]}>
              <boxGeometry args={[0.02, 0.18, 3.2]} />
              <meshStandardMaterial color={CHROME} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, 0.95, -1.5]}>
            <boxGeometry args={[0.9, 0.6, 0.8]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Sails */}
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
            <mesh key={`t4c-${x}`} position={[x, 0.35, 0]}>
              <boxGeometry args={[0.01, 0.03, 2.8]} />
              <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1.0} />
            </mesh>
          ))}
          {/* Neural nodes */}
          {[[-0.3, 2.2, 0.3], [0.3, 2.2, 0.3], [0, 1.8, 1.5], [0, 1.5, -0.5]].map(([x, y, z], i) => (
            <mesh key={`t4n-${i}`} position={[x, y, z]}>
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
            <mesh key={`t4l-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={2} />
            </mesh>
          ))}
          {/* Digital rain */}
          {t4RainGeometry && (
            <points ref={t4RainRef} geometry={t4RainGeometry} position={[0, 0.5, 0]}>
              <pointsMaterial color={CYAN_DIM} size={0.04} transparent opacity={0.5} sizeAttenuation />
            </points>
          )}
          {/* Drone */}
          <group ref={t4DronesRef}>
            <mesh>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={2} />
            </mesh>
          </group>
          {/* Predictive path */}
          <mesh ref={t4PathRef} position={[0, 0.05, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.6, 2]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={0.5} transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 5: THE SINGULARITY
          A geometric intelligence. Not a ship.
          ========================================= */}
      {tier === 5 && (
        <group>

          {/* ======================================
              1. GEOMETRIC CORE — The Mind
              Rotating icosahedron. Pure mathematical form.
              ====================================== */}
          <group ref={coreRef}>
            {/* Solid inner core — bright, warm */}
            <mesh>
              <icosahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial
                color={CORE_WHITE}
                emissive={CORE_WHITE}
                emissiveIntensity={3}
                transparent
                opacity={0.85}
              />
            </mesh>
            {/* Wireframe outer shell — larger, shows geometry */}
            <mesh>
              <icosahedronGeometry args={[0.75, 0]} />
              <meshStandardMaterial
                color={GOLD}
                emissive={GOLD}
                emissiveIntensity={1.5}
                wireframe
              />
            </mesh>
            {/* Inner glow sphere */}
            <mesh>
              <sphereGeometry args={[0.45, 16, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={5}
                transparent
                opacity={0.3}
              />
            </mesh>
          </group>

          {/* ======================================
              2. GYROSCOPIC RING SYSTEM — The Awareness
              3 torus rings, different axes, different speeds
              ====================================== */}
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

          {/* ======================================
              3. LEVITATING FRAGMENTS — Distributed Self
              Smaller polyhedra orbiting in formation
              ====================================== */}
          <group ref={fragmentsRef}>
            {/* Octahedrons */}
            <mesh>
              <octahedronGeometry args={[0.15, 0]} />
              <meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={2.5} />
            </mesh>
            <mesh>
              <octahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2.5} />
            </mesh>
            {/* Tetrahedrons */}
            <mesh>
              <tetrahedronGeometry args={[0.14, 0]} />
              <meshStandardMaterial color={CORE_WHITE} emissive={CORE_WHITE} emissiveIntensity={2} />
            </mesh>
            <mesh>
              <tetrahedronGeometry args={[0.11, 0]} />
              <meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={2} />
            </mesh>
            {/* Dodecahedrons */}
            <mesh>
              <dodecahedronGeometry args={[0.13, 0]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2} />
            </mesh>
            <mesh>
              <dodecahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial color={CORE_WHITE} emissive={CORE_WHITE} emissiveIntensity={2} />
            </mesh>
            {/* Extra icosahedrons */}
            <mesh>
              <icosahedronGeometry args={[0.09, 0]} />
              <meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={2.5} />
            </mesh>
            <mesh>
              <icosahedronGeometry args={[0.11, 0]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2} wireframe />
            </mesh>
          </group>

          {/* ======================================
              4. ENERGY TENDRILS — Environmental Control
              Lines of light reaching down to water and up to sky
              ====================================== */}
          <group ref={tendrilsRef}>
            {/* Downward tendrils — reaching into the water */}
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
            {/* Upward tendrils — reaching toward sky */}
            <mesh position={[0.2, 2.5, 0.1]}>
              <cylinderGeometry args={[0.005, 0.025, 3, 6]} />
              <meshStandardMaterial color={TENDRIL_WHITE} emissive={GOLD} emissiveIntensity={1.5} transparent opacity={0.5} />
            </mesh>
            <mesh position={[-0.15, 2.5, -0.2]}>
              <cylinderGeometry args={[0.005, 0.02, 3, 6]} />
              <meshStandardMaterial color={TENDRIL_WHITE} emissive={GOLD} emissiveIntensity={1.2} transparent opacity={0.4} />
            </mesh>
          </group>

          {/* ======================================
              5. ASCENDING DATA STREAM — Visible Processing
              Particles flowing UPWARD. Anti-gravity. Anti-nature.
              ====================================== */}
          {ascendGeometry && (
            <points ref={ascendRef} geometry={ascendGeometry}>
              <pointsMaterial
                color="#ffffff"
                size={0.04}
                transparent
                opacity={0.7}
                sizeAttenuation
              />
            </points>
          )}

          {/* ======================================
              6. CALM WATER ZONE — Reality Manipulation
              Glowing disc at water level. The entity controls its domain.
              (Actual wave dampening is in Ocean3D via calmRadius prop)
              ====================================== */}
          {/* Position compensates for group hover height (~-2.0) */}
          <mesh position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 48]} />
            <meshStandardMaterial
              color={RING_CYAN}
              emissive={RING_CYAN}
              emissiveIntensity={0.4}
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Inner bright circle */}
          <mesh position={[0, -1.88, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.5, 32]} />
            <meshStandardMaterial
              color={CORE_WHITE}
              emissive={CORE_WHITE}
              emissiveIntensity={0.6}
              transparent
              opacity={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Edge ring on water */}
          <mesh position={[0, -1.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3, 0.03, 8, 64]} />
            <meshStandardMaterial color={RING_CYAN} emissive={RING_CYAN} emissiveIntensity={1} transparent opacity={0.3} />
          </mesh>

          {/* ======================================
              7. PHASE-SHIFT GHOST LAYER — Multi-Dimensional
              Larger transparent duplicate. Different rotation.
              You're seeing its shadow from another dimension.
              ====================================== */}
          <mesh ref={ghostRef}>
            <icosahedronGeometry args={[0.75, 0]} />
            <meshStandardMaterial
              color={GHOST_BLUE}
              emissive={GHOST_BLUE}
              emissiveIntensity={0.5}
              transparent
              opacity={0.08}
              wireframe
            />
          </mesh>

          {/* ======================================
              AMBIENT GLOW — The entity radiates
              ====================================== */}
          <mesh>
            <sphereGeometry args={[2.2, 16, 16]} />
            <meshStandardMaterial
              color={GOLD_WARM}
              emissive={GOLD_WARM}
              emissiveIntensity={0.3}
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
