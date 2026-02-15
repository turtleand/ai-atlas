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
  const rainRef = useRef<THREE.Points>(null);
  const brainRef = useRef<THREE.Mesh>(null);
  const dronesRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const pathRef = useRef<THREE.Mesh>(null);

  // ====== DIGITAL RAIN PARTICLES (tier 4-5) ======
  const rainGeometry = useMemo(() => {
    if (tier < 4) return null;
    const count = tier === 5 ? 150 : 40;
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

  // ====== ANIMATION LOOP ======
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    // Wave following (all tiers)
    const waveY = getWaveHeight(0, 0, time, stormIntensity);
    const sinkOffset = tier === 1 ? -0.5 - Math.sin(time * 0.3) * 0.2 :
                       tier === 2 ? -0.2 : 0;
    groupRef.current.position.y = waveY + sinkOffset;

    const tiltFactor = tier === 5 ? 0.15 : tier === 4 ? 0.35 : tier === 3 ? 0.9 : tier === 2 ? 1.3 : 1.5;
    const dx = getWaveHeight(0.5, 0, time, stormIntensity) - getWaveHeight(-0.5, 0, time, stormIntensity);
    const dz = getWaveHeight(0, 0.5, time, stormIntensity) - getWaveHeight(0, -0.5, time, stormIntensity);
    groupRef.current.rotation.z = Math.atan2(dx, 1) * tiltFactor;
    groupRef.current.rotation.x = Math.atan2(dz, 1) * tiltFactor * 0.7;
    if (tier === 2) groupRef.current.rotation.z += 0.15;
    if (tier === 1) groupRef.current.rotation.z += Math.sin(time * 0.5) * 0.3;

    // Digital rain (tier 4-5)
    if (rainRef.current && rainGeometry) {
      const positions = rainGeometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= delta * 2.5;
        if (positions[i * 3 + 1] < -0.3) {
          positions[i * 3 + 1] = 3.5 + Math.random() * 0.5;
          positions[i * 3] = (Math.random() - 0.5) * 2.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        }
      }
      rainGeometry.attributes.position.needsUpdate = true;
    }

    // Brain core pulse (tier 5)
    if (brainRef.current) {
      const mat = brainRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.5 + Math.sin(time * 2) * 1.2;
    }

    // Drone orbiting (tier 4-5)
    if (dronesRef.current) {
      dronesRef.current.children.forEach((drone, i) => {
        const count = dronesRef.current!.children.length;
        const angle = time * 0.35 + (i * Math.PI * 2) / count;
        const radius = 1.8 + i * 0.15;
        const height = 1.2 + Math.sin(time * 0.5 + i * 1.5) * 0.4;
        drone.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      });
    }

    // Halo rotation (tier 5)
    if (haloRef.current) {
      haloRef.current.rotation.y = time * 0.12;
      haloRef.current.rotation.z = Math.sin(time * 0.08) * 0.05;
    }

    // Predictive path pulse (tier 4-5)
    if (pathRef.current) {
      const mat = pathRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.12 + Math.sin(time * 1.5) * 0.05;
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
  const ENERGY_BLUE = '#2266ff';
  const SHIELD_CYAN = '#00eeff';
  const GOLD = '#ffd700';
  const GOLD_WARM = '#ffaa33';
  const PROPULSION_BLUE = '#4488ff';
  const BRAIN_WHITE = '#aaffff';

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
          {/* Hull stripes */}
          {[0.61, -0.61].map((x) => (
            <mesh key={`stripe-${x}`} position={[x, 0.4, 0]}>
              <boxGeometry args={[0.02, 0.08, 2.5]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))}
          {/* Railings */}
          {[0.62, -0.62].map((x) => (
            <mesh key={`rail-${x}`} position={[x, 0.75, 0.5]}>
              <boxGeometry args={[0.02, 0.15, 2.5]} />
              <meshStandardMaterial color={WOOD_MED} />
            </mesh>
          ))}
          {/* Stern cabin */}
          <mesh position={[0, 0.9, -1]}>
            <boxGeometry args={[0.9, 0.5, 0.8]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          {/* Main mast + sails */}
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
          {/* Rigging */}
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
          TIER 4: HYBRID CRUISER — wood + tech fusion
          ========================================= */}
      {tier === 4 && (
        <group>
          {/* === HULL: wood base + metal plates === */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.6, 4]} />
            <meshStandardMaterial color={HULL_BROWN} emissive="#0a0804" emissiveIntensity={0.3} />
          </mesh>
          {/* Chrome armor plates */}
          {[0.58, -0.58].map((x) => (
            <group key={`plates-${x}`}>
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
          {/* Metal deck */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.1, 0.05, 3.8]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Chrome bow */}
          <mesh position={[0, 0.4, 2.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Metal railings */}
          {[0.62, -0.62].map((x) => (
            <mesh key={`mrail-${x}`} position={[x, 0.75, 0.5]}>
              <boxGeometry args={[0.02, 0.18, 3.2]} />
              <meshStandardMaterial color={CHROME} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* Tech cabin */}
          <mesh position={[0, 0.95, -1.5]}>
            <boxGeometry args={[0.9, 0.6, 0.8]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.6} roughness={0.3} />
          </mesh>

          {/* === TRADITIONAL SAILS (still fabric) === */}
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

          {/* === TECH: circuit lines === */}
          {[0.62, -0.62].map((x) => (
            <mesh key={`circuit-${x}`} position={[x, 0.35, 0]}>
              <boxGeometry args={[0.01, 0.03, 2.8]} />
              <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1.0} />
            </mesh>
          ))}

          {/* === TECH: neural network nodes (4 nodes) === */}
          {[[-0.3, 2.2, 0.3], [0.3, 2.2, 0.3], [0, 1.8, 1.5], [0, 1.5, -0.5]].map(([x, y, z], i) => (
            <mesh key={`node-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={2} />
            </mesh>
          ))}
          {/* Neural connections (2 links) */}
          <mesh position={[0, 2.2, 0.3]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.6, 4]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1} />
          </mesh>
          <mesh position={[0.15, 2, 0.9]} rotation={[0.7, 0, 0.15]}>
            <cylinderGeometry args={[0.008, 0.008, 1.3, 4]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={0.8} />
          </mesh>

          {/* === TECH: radar + antenna === */}
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

          {/* === TECH: LED running lights === */}
          {[[0.5, 0.85, 1.5], [-0.5, 0.85, 1.5]].map(([x, y, z], i) => (
            <mesh key={`led-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={2} />
            </mesh>
          ))}
          <mesh position={[0, 1.3, -1.9]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={2} />
          </mesh>

          {/* === DIGITAL RAIN (sparse) === */}
          {rainGeometry && (
            <points ref={rainRef} geometry={rainGeometry} position={[0, 0.5, 0]}>
              <pointsMaterial color={CYAN_DIM} size={0.04} transparent opacity={0.5} sizeAttenuation />
            </points>
          )}

          {/* === 1 ORBITING DRONE === */}
          <group ref={dronesRef}>
            <mesh>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={2} />
            </mesh>
          </group>

          {/* === DIM PREDICTIVE PATH === */}
          <mesh ref={pathRef} position={[0, 0.05, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.6, 2]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={0.5} transparent opacity={0.08} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* =========================================
          TIER 5: QUANTUM ARK — THE GOD-SHIP
          ========================================= */}
      {tier === 5 && (
        <group>
          {/* ==============================
              1. CHROME HULL + PANEL SEAMS
              ============================== */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.3, 0.65, 4.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.85} roughness={0.12} emissive="#080810" emissiveIntensity={0.4} />
          </mesh>
          {/* Hull contour edges */}
          {[0.66, -0.66].map((x) => (
            <mesh key={`edge-${x}`} position={[x, 0.3, 0]}>
              <boxGeometry args={[0.04, 0.5, 4.2]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
          {/* Hull panel seams (suggest modular construction) */}
          {[-1.5, -0.5, 0.5, 1.5].map((z, i) => (
            <group key={`seam-${i}`}>
              <mesh position={[0.67, 0.3, z]}>
                <boxGeometry args={[0.01, 0.4, 0.015]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.8} />
              </mesh>
              <mesh position={[-0.67, 0.3, z]}>
                <boxGeometry args={[0.01, 0.4, 0.015]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.8} />
              </mesh>
            </group>
          ))}
          {/* Sharp chrome bow */}
          <mesh position={[0, 0.4, 2.6]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.35, 0.35, 0.6]} />
            <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Metal deck with glow seams */}
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[1.2, 0.05, 4.3]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Deck glow lines */}
          {[0.4, -0.4, 0].map((x, i) => (
            <mesh key={`deckglow-${i}`} position={[x, 0.68, 0]}>
              <boxGeometry args={[0.01, 0.01, 3.5]} />
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} />
            </mesh>
          ))}
          {/* Glowing keel */}
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.12, 0.04, 4]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} />
          </mesh>

          {/* ==============================
              2. CIRCUIT VEIN NETWORK
              ============================== */}
          {[0.67, -0.67].map((x, i) => (
            <group key={`veins-${i}`}>
              <mesh position={[x, 0.15, 0]}>
                <boxGeometry args={[0.012, 0.04, 3.8]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.5} />
              </mesh>
              <mesh position={[x, 0.35, 0]}>
                <boxGeometry args={[0.012, 0.03, 3.2]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} />
              </mesh>
              <mesh position={[x, 0.52, 0]}>
                <boxGeometry args={[0.012, 0.025, 2.5]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.8} />
              </mesh>
            </group>
          ))}
          {/* Cross-connects */}
          {[-1.5, -0.7, 0, 0.7, 1.5].map((z, i) => (
            <mesh key={`xconn-${i}`} position={[0, 0.02, z]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.01, 0.02, 1.3]} />
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} />
            </mesh>
          ))}

          {/* === SELF-REPAIR DOTS along circuit lines === */}
          {[
            [0.67, 0.15, -1.2], [-0.67, 0.35, 0.8], [0.67, 0.52, 0.3],
            [-0.67, 0.15, -0.5], [0.67, 0.35, 1.4], [-0.67, 0.52, -0.8],
            [0.67, 0.15, 0.9], [-0.67, 0.35, -1.5],
          ].map(([x, y, z], i) => (
            <mesh key={`repair-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.02, 6, 6]} />
              <meshStandardMaterial color="#ffffff" emissive={CYAN} emissiveIntensity={1.5 + (i % 3) * 0.8} />
            </mesh>
          ))}

          {/* ==============================
              3. NEURAL NETWORK RIGGING
              ============================== */}
          {/* Nodes (glowing gold-cyan spheres at mast junctions) */}
          {[
            [0, 2.8, 0.3], [0, 2, 0.3],        // Main mast
            [0.7, 1.5, 0.3], [-0.7, 1.5, 0.3],  // Side spread
            [0, 2.2, 1.8], [0, 1.4, 1.8],        // Fore mast
            [0, 2, -1.4], [0, 1.2, -1.4],        // Mizzen mast
            [0.5, 1, 0.8], [-0.5, 1, -0.5],      // Lower nodes
          ].map(([x, y, z], i) => (
            <mesh key={`nnode-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2.5} />
            </mesh>
          ))}
          {/* Neural connections (glowing lines between nodes) */}
          {[
            { from: [0, 2.8, 0.3], to: [0.7, 1.5, 0.3] },
            { from: [0, 2.8, 0.3], to: [-0.7, 1.5, 0.3] },
            { from: [0, 2.8, 0.3], to: [0, 2.2, 1.8] },
            { from: [0, 2.8, 0.3], to: [0, 2, -1.4] },
            { from: [0, 2, 0.3], to: [0.5, 1, 0.8] },
            { from: [0, 2, 0.3], to: [-0.5, 1, -0.5] },
            { from: [0, 2.2, 1.8], to: [0.7, 1.5, 0.3] },
            { from: [0, 2, -1.4], to: [-0.7, 1.5, 0.3] },
            { from: [0, 1.4, 1.8], to: [0.5, 1, 0.8] },
            { from: [0, 1.2, -1.4], to: [-0.5, 1, -0.5] },
          ].map((link, i) => {
            const [fx, fy, fz] = link.from;
            const [tx, ty, tz] = link.to;
            const mx = (fx + tx) / 2, my = (fy + ty) / 2, mz = (fz + tz) / 2;
            const dx = tx - fx, dy = ty - fy, dz = tz - fz;
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const dir = new THREE.Vector3(dx, dy, dz).normalize();
            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            return (
              <mesh key={`nlink-${i}`} position={[mx, my, mz]} quaternion={quat}>
                <cylinderGeometry args={[0.01, 0.01, len, 4]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} transparent opacity={0.7} />
              </mesh>
            );
          })}

          {/* ==============================
              4. HOLOGRAPHIC ENERGY SAILS
              ============================== */}
          {/* Main mast */}
          <group position={[0, 0.65, 0.3]}>
            <mesh>
              <cylinderGeometry args={[0.05, 0.07, 4, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Primary energy sail — layered glow */}
            <mesh position={[0, 0.8, 0.35]}>
              <planeGeometry args={[1.8, 2, 6, 6]} />
              <meshStandardMaterial color={CYAN} emissive={ENERGY_BLUE} emissiveIntensity={0.8} side={THREE.DoubleSide} transparent opacity={0.3} />
            </mesh>
            <mesh position={[0, 0.8, 0.4]}>
              <planeGeometry args={[1.6, 1.8, 4, 4]} />
              <meshStandardMaterial color={SHIELD_CYAN} emissive={CYAN} emissiveIntensity={1.2} side={THREE.DoubleSide} transparent opacity={0.12} />
            </mesh>
            {/* Upper sail */}
            <mesh position={[0, 2.2, 0.3]}>
              <planeGeometry args={[1.3, 1.2, 4, 4]} />
              <meshStandardMaterial color={CYAN} emissive={ENERGY_BLUE} emissiveIntensity={0.6} side={THREE.DoubleSide} transparent opacity={0.25} />
            </mesh>
            {/* Chrome yard beams */}
            <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 2, 6]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} />
            </mesh>
            <mesh position={[0, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} />
            </mesh>
          </group>
          {/* Fore mast */}
          <group position={[0, 0.65, 1.8]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.06, 3.2, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.6, 0.3]}>
              <planeGeometry args={[1.4, 1.6, 4, 4]} />
              <meshStandardMaterial color={CYAN} emissive={ENERGY_BLUE} emissiveIntensity={0.7} side={THREE.DoubleSide} transparent opacity={0.28} />
            </mesh>
          </group>
          {/* Mizzen mast */}
          <group position={[0, 0.65, -1.4]}>
            <mesh>
              <cylinderGeometry args={[0.035, 0.05, 2.8, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.5, 0.25]}>
              <planeGeometry args={[1.2, 1.4, 3, 4]} />
              <meshStandardMaterial color={CYAN} emissive={ENERGY_BLUE} emissiveIntensity={0.6} side={THREE.DoubleSide} transparent opacity={0.25} />
            </mesh>
          </group>

          {/* ==============================
              5. BRAIN CORE (visible through hull)
              ============================== */}
          {/* Transparent hull window */}
          <mesh position={[0.67, 0.3, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.5]} />
            <meshStandardMaterial color={CYAN} transparent opacity={0.1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.67, 0.3, 0]}>
            <boxGeometry args={[0.02, 0.3, 0.5]} />
            <meshStandardMaterial color={CYAN} transparent opacity={0.1} side={THREE.DoubleSide} />
          </mesh>
          {/* The Brain — pulsing sphere */}
          <mesh ref={brainRef} position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={BRAIN_WHITE} emissive={BRAIN_WHITE} emissiveIntensity={2.5} transparent opacity={0.85} />
          </mesh>
          {/* Brain halo ring */}
          <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.01, 8, 24]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} transparent opacity={0.6} />
          </mesh>

          {/* ==============================
              6. PREDICTIVE PATH GLOW
              ============================== */}
          <mesh ref={pathRef} position={[0, 0.05, 4.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.8, 3.5]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.6} transparent opacity={0.12} side={THREE.DoubleSide} />
          </mesh>
          {/* Path leading dots */}
          {[3.5, 4.5, 5.5, 6.3].map((z, i) => (
            <mesh key={`pdot-${i}`} position={[0, 0.06, z]}>
              <sphereGeometry args={[0.03 - i * 0.005, 6, 6]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2 - i * 0.3} transparent opacity={0.6 - i * 0.1} />
            </mesh>
          ))}

          {/* ==============================
              7. AUTONOMOUS DRONES (orbiting)
              ============================== */}
          <group ref={dronesRef}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={`drone-${i}`}>
                <sphereGeometry args={[0.07, 10, 10]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={3} />
              </mesh>
            ))}
          </group>

          {/* ==============================
              8. SENSOR CROWN (mast top)
              ============================== */}
          <mesh position={[0, 3.4, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.02, 8, 6]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2.5} />
          </mesh>
          {/* Sensor nodes on crown */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <mesh key={`sensor-${i}`} position={[Math.cos(angle) * 0.25, 3.4, 0.3 + Math.sin(angle) * 0.25]}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={3} />
              </mesh>
            );
          })}

          {/* ==============================
              9. WISDOM BEACON (bow) + DIVINE HALO
              ============================== */}
          {/* Wisdom Beacon — warm radiant sphere at bow */}
          <mesh position={[0, 0.7, 2.9]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={4} />
          </mesh>
          {/* Beacon glow aura */}
          <mesh position={[0, 0.7, 2.9]}>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial color={GOLD_WARM} emissive={GOLD_WARM} emissiveIntensity={1.5} transparent opacity={0.15} />
          </mesh>

          {/* Divine Halo — slowly rotating golden ring above ship */}
          <mesh ref={haloRef} position={[0, 3.8, 0.3]} rotation={[0.15, 0, 0.05]}>
            <torusGeometry args={[1.2, 0.03, 12, 48]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={3} />
          </mesh>
          {/* Halo inner glow */}
          <mesh position={[0, 3.8, 0.3]} rotation={[0.15, 0, 0.05]}>
            <torusGeometry args={[1.2, 0.15, 8, 48]} />
            <meshStandardMaterial color={GOLD_WARM} emissive={GOLD_WARM} emissiveIntensity={0.8} transparent opacity={0.06} />
          </mesh>

          {/* ==============================
              ENERGY SHIELD DOME
              ============================== */}
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[3.2, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={SHIELD_CYAN} transparent opacity={0.05} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.2, 0.02, 8, 48]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.8} transparent opacity={0.25} />
          </mesh>

          {/* ==============================
              COMMAND BRIDGE
              ============================== */}
          <mesh position={[0, 1.05, -1.8]}>
            <boxGeometry args={[1, 0.7, 1]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.8} roughness={0.15} />
          </mesh>
          <mesh position={[0, 1.15, -1.29]}>
            <boxGeometry args={[0.8, 0.2, 0.02]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} transparent opacity={0.7} />
          </mesh>

          {/* ==============================
              PROPULSION (blue-white, benevolent)
              ============================== */}
          {[0.3, -0.3].map((x) => (
            <mesh key={`prop-${x}`} position={[x, 0.3, -2.3]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color={PROPULSION_BLUE} emissive={PROPULSION_BLUE} emissiveIntensity={4} />
            </mesh>
          ))}
          <mesh position={[0, 0.3, -2.4]}>
            <sphereGeometry args={[0.25, 10, 10]} />
            <meshStandardMaterial color={PROPULSION_BLUE} emissive={PROPULSION_BLUE} emissiveIntensity={1.5} transparent opacity={0.2} />
          </mesh>

          {/* ==============================
              TURTLEAND FIGUREHEAD (glowing)
              ============================== */}
          <group position={[0, 0.5, 2.8]}>
            <mesh position={[0, 0, 0.15]}>
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshStandardMaterial color="#2d5016" emissive={GOLD} emissiveIntensity={0.8} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.17, 0.28, 8]} />
              <meshStandardMaterial color="#3d6020" emissive={CYAN} emissiveIntensity={0.5} />
            </mesh>
          </group>

          {/* ==============================
              DIGITAL RAIN (dense)
              ============================== */}
          {rainGeometry && (
            <points ref={rainRef} geometry={rainGeometry} position={[0, 0.5, 0]}>
              <pointsMaterial color={CYAN} size={0.05} transparent opacity={0.6} sizeAttenuation />
            </points>
          )}

          {/* ==============================
              ANTENNA ARRAYS
              ============================== */}
          {[0.4, -0.4].map((x) => (
            <group key={`antenna-${x}`}>
              <mesh position={[x, 1.5, -1.8]}>
                <cylinderGeometry args={[0.012, 0.012, 1, 4]} />
                <meshStandardMaterial color={CHROME} metalness={0.9} />
              </mesh>
              <mesh position={[x, 2, -1.8]}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}
