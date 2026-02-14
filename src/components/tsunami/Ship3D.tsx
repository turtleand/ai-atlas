import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Ship3DProps {
  tier: 1 | 2 | 3 | 4 | 5;
  score: number;
  wavePercent: number;
}

export function Ship3D({ tier }: Ship3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Ship rocks based on tier — higher tier = smoother
  const rockIntensity = tier === 5 ? 0.02 : tier === 4 ? 0.04 : tier === 3 ? 0.08 : tier === 2 ? 0.15 : 0.25;
  const rockSpeed = tier === 5 ? 0.5 : tier === 4 ? 0.7 : tier === 3 ? 1.0 : tier === 2 ? 1.5 : 2.0;
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    // Bob up and down on the water
    groupRef.current.position.y = Math.sin(t * rockSpeed) * 0.15;
    
    // Rock side to side (roll)
    groupRef.current.rotation.z = Math.sin(t * rockSpeed * 0.7) * rockIntensity;
    
    // Pitch forward/back
    groupRef.current.rotation.x = Math.sin(t * rockSpeed * 0.5 + 1) * rockIntensity * 0.5;
  });
  
  // Color constants
  const DARK_WOOD = '#1a0e05';
  const MED_WOOD = '#3d2b1f';
  const LIGHT_WOOD = '#5c3a1e';
  const HULL_BLACK = '#0d0d0d';
  const SAIL_WHITE = '#e8e0d4';
  const SAIL_TORN = '#a09080';
  const CYAN_GLOW = '#00ffdd';
  const CHROME = '#a8a9ad';
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ===== ALL TIERS: HULL ===== */}
      {tier >= 2 && (
        <group>
          {/* Main hull body — a stretched, tapered box */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[
              tier >= 3 ? 1.2 : 0.8,  // width
              0.6,                      // height
              tier >= 4 ? 4 : tier >= 3 ? 3 : 2  // length
            ]} />
            <meshStandardMaterial color={tier >= 3 ? HULL_BLACK : LIGHT_WOOD} />
          </mesh>
          
          {/* Hull deck */}
          <mesh position={[0, 0.62, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[
              tier >= 3 ? 1.1 : 0.7,
              0.05,
              tier >= 4 ? 3.8 : tier >= 3 ? 2.8 : 1.8
            ]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          
          {/* Bow (front point) */}
          <mesh position={[0, 0.4, tier >= 4 ? 2.3 : tier >= 3 ? 1.7 : 1.2]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={tier >= 3 ? HULL_BLACK : LIGHT_WOOD} />
          </mesh>
          
          {/* Stern cabin (tier 3+) */}
          {tier >= 3 && (
            <mesh position={[0, 0.9, tier >= 4 ? -1.5 : -1]}>
              <boxGeometry args={[0.9, 0.5, 0.8]} />
              <meshStandardMaterial color={DARK_WOOD} />
            </mesh>
          )}
          
          {/* Hull stripe (white line on black hull, like reference image) */}
          {tier >= 3 && (
            <mesh position={[0.61, 0.4, 0]}>
              <boxGeometry args={[0.02, 0.08, tier >= 4 ? 3.5 : 2.5]} />
              <meshStandardMaterial color="white" />
            </mesh>
          )}
          {tier >= 3 && (
            <mesh position={[-0.61, 0.4, 0]}>
              <boxGeometry args={[0.02, 0.08, tier >= 4 ? 3.5 : 2.5]} />
              <meshStandardMaterial color="white" />
            </mesh>
          )}
        </group>
      )}
      
      {/* ===== TIER 1: WRECKAGE ===== */}
      {tier === 1 && (
        <group>
          {/* Scattered planks */}
          <mesh position={[0, 0.1, 0]} rotation={[0, 0.3, 0.1]}>
            <boxGeometry args={[0.3, 0.08, 1.5]} />
            <meshStandardMaterial color={LIGHT_WOOD} />
          </mesh>
          <mesh position={[0.5, 0.05, 0.3]} rotation={[0, -0.5, 0.2]}>
            <boxGeometry args={[0.25, 0.08, 1]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          <mesh position={[-0.4, 0.08, -0.2]} rotation={[0.1, 0.7, -0.15]}>
            <boxGeometry args={[0.2, 0.08, 0.8]} />
            <meshStandardMaterial color={LIGHT_WOOD} />
          </mesh>
          {/* Broken mast piece floating */}
          <mesh position={[0.3, 0.15, -0.5]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.04, 0.06, 1.2, 6]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
        </group>
      )}
      
      {/* ===== MASTS & SAILS ===== */}
      
      {/* Main mast (tier 2+) */}
      {tier >= 2 && (
        <group position={[0, 0.6, tier >= 4 ? 0.3 : 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.06, tier >= 3 ? 3.5 : 2, 8]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          
          {/* Main sail */}
          <mesh position={[0, tier >= 3 ? 0.8 : 0.5, 0.3]}>
            <planeGeometry args={[
              tier >= 3 ? 1.5 : 0.8,
              tier >= 3 ? 1.8 : 1
            ]} />
            <meshStandardMaterial
              color={tier >= 3 ? SAIL_WHITE : SAIL_TORN}
              side={THREE.DoubleSide}
              transparent
              opacity={tier === 2 ? 0.6 : 0.9}
            />
          </mesh>
          
          {/* Upper sail (tier 3+) */}
          {tier >= 3 && (
            <mesh position={[0, 2, 0.25]}>
              <planeGeometry args={[1.2, 1]} />
              <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>
          )}
          
          {/* Yard arms (horizontal spars) */}
          <mesh position={[0, tier >= 3 ? -0.1 : 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, tier >= 3 ? 1.8 : 1, 6]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          {tier >= 3 && (
            <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 1.5, 6]} />
              <meshStandardMaterial color={MED_WOOD} />
            </mesh>
          )}
        </group>
      )}
      
      {/* Foremast (tier 4+) */}
      {tier >= 4 && (
        <group position={[0, 0.6, 1.5]}>
          <mesh>
            <cylinderGeometry args={[0.035, 0.05, 3, 8]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          <mesh position={[0, 0.6, 0.25]}>
            <planeGeometry args={[1.3, 1.5]} />
            <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 1.7, 0.2]}>
            <planeGeometry args={[1, 0.9]} />
            <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.85} />
          </mesh>
          {/* Yard arms */}
          <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.5, 6]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
        </group>
      )}
      
      {/* Mizzenmast (tier 5 only) */}
      {tier === 5 && (
        <group position={[0, 0.6, -1.2]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.05, 2.8, 8]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          <mesh position={[0, 0.5, 0.2]}>
            <planeGeometry args={[1.1, 1.3]} />
            <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 1.5, 0.15]}>
            <planeGeometry args={[0.9, 0.8]} />
            <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.85} />
          </mesh>
        </group>
      )}
      
      {/* Bowsprit (tier 4+) — the forward-pointing spar */}
      {tier >= 4 && (
        <group position={[0, 0.7, tier >= 4 ? 2.5 : 1.8]} rotation={[0.3, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.04, 1.5, 6]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          {/* Jib sail */}
          {tier >= 4 && (
            <mesh position={[0, -0.3, 0]} rotation={[0.5, 0, 0]}>
              <planeGeometry args={[0.8, 1.2]} />
              <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.8} />
            </mesh>
          )}
        </group>
      )}
      
      {/* ===== TIER 5 TECH ENHANCEMENTS ===== */}
      {tier === 5 && (
        <group>
          {/* Glowing cyan circuit lines on hull (emissive) */}
          <mesh position={[0.62, 0.3, 0]}>
            <boxGeometry args={[0.01, 0.04, 3.2]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.62, 0.3, 0]}>
            <boxGeometry args={[0.01, 0.04, 3.2]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.62, 0.5, 0]}>
            <boxGeometry args={[0.01, 0.03, 2.5]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[-0.62, 0.5, 0]}>
            <boxGeometry args={[0.01, 0.03, 2.5]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={1.5} />
          </mesh>
          
          {/* AI Navigation orb at top of main mast */}
          <mesh position={[0, 3, 0.3]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={3} transparent opacity={0.9} />
          </mesh>
          
          {/* Shield shimmer (transparent dome) */}
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[2.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={CYAN_GLOW} transparent opacity={0.04} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      
      {/* ===== TIER 4 TECH (lighter) ===== */}
      {tier === 4 && (
        <group>
          {/* Dimmer circuit lines */}
          <mesh position={[0.62, 0.35, 0]}>
            <boxGeometry args={[0.01, 0.03, 2.5]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[-0.62, 0.35, 0]}>
            <boxGeometry args={[0.01, 0.03, 2.5]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={0.8} />
          </mesh>
          
          {/* Radar dish at top of main mast */}
          <mesh position={[0, 2.5, 0.3]} rotation={[0.3, 0, 0]}>
            <circleGeometry args={[0.15, 16, 0, Math.PI]} />
            <meshStandardMaterial color={CHROME} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      
      {/* ===== TIER 2 DAMAGE ===== */}
      {tier === 2 && (
        <group>
          {/* Water pooling on deck */}
          <mesh position={[0, 0.63, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.6, 1.5]} />
            <meshStandardMaterial color="#1a3a5c" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
