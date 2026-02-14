import { useRef } from 'react';
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
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    
    // Ship position on wave surface
    const waveY = getWaveHeight(0, 0, time, stormIntensity);
    
    // Tier-based sink offset (lower tiers sink into the water)
    const sinkOffset = tier === 1 ? -0.5 - Math.sin(time * 0.3) * 0.2 : 
                       tier === 2 ? -0.2 : 0;
    
    groupRef.current.position.y = waveY + sinkOffset;
    
    // Follow wave slope (tilt with the wave)
    const tiltFactor = tier === 5 ? 0.3 : tier === 4 ? 0.6 : tier === 3 ? 0.9 : tier === 2 ? 1.3 : 1.5;
    
    const dx = getWaveHeight(0.5, 0, time, stormIntensity) - getWaveHeight(-0.5, 0, time, stormIntensity);
    const dz = getWaveHeight(0, 0.5, time, stormIntensity) - getWaveHeight(0, -0.5, time, stormIntensity);
    
    groupRef.current.rotation.z = Math.atan2(dx, 1) * tiltFactor;
    groupRef.current.rotation.x = Math.atan2(dz, 1) * tiltFactor * 0.7;
    
    // Tier 2: list to one side (damaged)
    if (tier === 2) {
      groupRef.current.rotation.z += 0.15; // Constant list
    }
    
    // Tier 1: actively sinking
    if (tier === 1) {
      groupRef.current.rotation.z += Math.sin(time * 0.5) * 0.3;
    }
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
          {/* Main hull body — tapered shape */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[
              tier >= 3 ? 1.2 : 0.8,
              0.6,
              tier >= 4 ? 4 : tier >= 3 ? 3 : 2
            ]} />
            <meshStandardMaterial color={tier >= 3 ? HULL_BLACK : LIGHT_WOOD} />
          </mesh>
          
          {/* Hull deck */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[
              tier >= 3 ? 1.1 : 0.7,
              0.05,
              tier >= 4 ? 3.8 : tier >= 3 ? 2.8 : 1.8
            ]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          
          {/* Bow (front point) — angled */}
          <mesh position={[0, 0.4, tier >= 4 ? 2.3 : tier >= 3 ? 1.7 : 1.2]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={tier >= 3 ? HULL_BLACK : LIGHT_WOOD} />
          </mesh>
          
          {/* Keel line at bottom */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.15, 0.05, tier >= 4 ? 3.5 : tier >= 3 ? 2.5 : 1.8]} />
            <meshStandardMaterial color={DARK_WOOD} />
          </mesh>
          
          {/* Hull planking lines (detail) */}
          {tier >= 3 && (
            <>
              <mesh position={[0.55, 0.35, 0]}>
                <boxGeometry args={[0.02, 0.02, tier >= 4 ? 3.2 : 2.2]} />
                <meshStandardMaterial color={DARK_WOOD} />
              </mesh>
              <mesh position={[-0.55, 0.35, 0]}>
                <boxGeometry args={[0.02, 0.02, tier >= 4 ? 3.2 : 2.2]} />
                <meshStandardMaterial color={DARK_WOOD} />
              </mesh>
            </>
          )}
          
          {/* Stern cabin (tier 3+) */}
          {tier >= 3 && (
            <mesh position={[0, 0.9, tier >= 4 ? -1.5 : -1]}>
              <boxGeometry args={[0.9, 0.5, 0.8]} />
              <meshStandardMaterial color={DARK_WOOD} />
            </mesh>
          )}
          
          {/* Hull stripe (white line) */}
          {tier >= 3 && (
            <>
              <mesh position={[0.61, 0.4, 0]}>
                <boxGeometry args={[0.02, 0.08, tier >= 4 ? 3.5 : 2.5]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[-0.61, 0.4, 0]}>
                <boxGeometry args={[0.02, 0.08, tier >= 4 ? 3.5 : 2.5]} />
                <meshStandardMaterial color="white" />
              </mesh>
            </>
          )}
          
          {/* Railing (tier 3+, broken on tier 2) */}
          {tier >= 3 && (
            <>
              {/* Left railing */}
              <mesh position={[0.62, 0.75, 0.5]}>
                <boxGeometry args={[0.02, 0.15, 2.5]} />
                <meshStandardMaterial color={MED_WOOD} />
              </mesh>
              {/* Right railing */}
              <mesh position={[-0.62, 0.75, 0.5]}>
                <boxGeometry args={[0.02, 0.15, 2.5]} />
                <meshStandardMaterial color={MED_WOOD} />
              </mesh>
            </>
          )}
          {tier === 2 && (
            <>
              {/* Broken railing segments */}
              <mesh position={[0.62, 0.75, 0.8]}>
                <boxGeometry args={[0.02, 0.15, 1]} />
                <meshStandardMaterial color={MED_WOOD} />
              </mesh>
              <mesh position={[-0.62, 0.75, -0.3]}>
                <boxGeometry args={[0.02, 0.15, 0.8]} />
                <meshStandardMaterial color={MED_WOOD} />
              </mesh>
            </>
          )}
        </group>
      )}
      
      {/* ===== TIER 1: WRECKAGE ===== */}
      {tier === 1 && (
        <group>
          {/* Broken hull pieces at angles */}
          <mesh position={[0, 0.1, 0]} rotation={[0.1, 0.3, 0.2]}>
            <boxGeometry args={[0.4, 0.15, 1.8]} />
            <meshStandardMaterial color={LIGHT_WOOD} />
          </mesh>
          <mesh position={[0.6, 0.05, 0.4]} rotation={[0.2, -0.5, 0.3]}>
            <boxGeometry args={[0.3, 0.12, 1.2]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          <mesh position={[-0.5, 0.08, -0.3]} rotation={[0.15, 0.7, -0.2]}>
            <boxGeometry args={[0.25, 0.1, 1]} />
            <meshStandardMaterial color={LIGHT_WOOD} />
          </mesh>
          
          {/* Floating debris (small boxes) */}
          <mesh position={[0.8, 0.02, 0.6]}>
            <boxGeometry args={[0.15, 0.08, 0.4]} />
            <meshStandardMaterial color={DARK_WOOD} />
          </mesh>
          <mesh position={[-0.7, 0.03, -0.5]}>
            <boxGeometry args={[0.12, 0.06, 0.3]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          <mesh position={[0.3, 0.04, -0.8]}>
            <boxGeometry args={[0.18, 0.07, 0.35]} />
            <meshStandardMaterial color={LIGHT_WOOD} />
          </mesh>
          
          {/* Broken mast floating separately */}
          <mesh position={[0.4, 0.15, -0.6]} rotation={[0.3, 0.2, Math.PI / 4]}>
            <cylinderGeometry args={[0.04, 0.06, 1.5, 6]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          
          {/* Torn sail piece floating */}
          <mesh position={[-0.3, 0.12, 0.5]} rotation={[0.5, 0.3, 0.4]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshStandardMaterial color={SAIL_TORN} side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        </group>
      )}
      
      {/* ===== MASTS & SAILS ===== */}
      
      {/* Main mast (tier 2+, angled on tier 2) */}
      {tier >= 2 && (
        <group position={[0, 0.6, tier >= 4 ? 0.3 : 0]} rotation={tier === 2 ? [0, 0, 0.1] : [0, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.06, tier >= 3 ? 3.5 : 2, 8]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          
          {/* Main sail — curved (billowing) */}
          <mesh position={[0, tier >= 3 ? 0.8 : 0.5, 0.3]}>
            <planeGeometry args={[
              tier >= 3 ? 1.5 : 0.8,
              tier >= 3 ? 1.8 : 1,
              5,
              5
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
              <planeGeometry args={[1.2, 1, 4, 4]} />
              <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>
          )}
          
          {/* Yard arms (horizontal spars) */}
          <mesh position={[0, tier >= 3 ? -0.1 : 0, 0]} rotation={[0, 0, Math.PI / 2]}>
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
            <planeGeometry args={[1.3, 1.5, 4, 4]} />
            <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 1.7, 0.2]}>
            <planeGeometry args={[1, 0.9, 3, 3]} />
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
            <planeGeometry args={[1.1, 1.3, 3, 4]} />
            <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 1.5, 0.15]}>
            <planeGeometry args={[0.9, 0.8, 3, 3]} />
            <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.85} />
          </mesh>
        </group>
      )}
      
      {/* Bowsprit (tier 4+) */}
      {tier >= 4 && (
        <group position={[0, 0.7, 2.5]} rotation={[0.3, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.04, 1.5, 6]} />
            <meshStandardMaterial color={MED_WOOD} />
          </mesh>
          {/* Jib sail */}
          <mesh position={[0, -0.3, 0]} rotation={[0.5, 0, 0]}>
            <planeGeometry args={[0.8, 1.2, 3, 3]} />
            <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        </group>
      )}
      
      {/* Rigging supports (thin cylinders as rigging — tier 3+) */}
      {tier >= 3 && (
        <>
          {/* Diagonal rigging lines as thin cylinders */}
          <mesh position={[0.3, 1.6, 0.15]} rotation={[0, 0, -0.6]}>
            <cylinderGeometry args={[0.01, 0.01, 1.5, 4]} />
            <meshStandardMaterial color={DARK_WOOD} />
          </mesh>
          <mesh position={[-0.3, 1.6, 0.15]} rotation={[0, 0, 0.6]}>
            <cylinderGeometry args={[0.01, 0.01, 1.5, 4]} />
            <meshStandardMaterial color={DARK_WOOD} />
          </mesh>
        </>
      )}
      
      {/* ===== TIER 5 TECH ENHANCEMENTS ===== */}
      {tier === 5 && (
        <group>
          {/* Turtle figurehead at bow */}
          <group position={[0, 0.5, 2.6]}>
            {/* Head (sphere) */}
            <mesh position={[0, 0, 0.15]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshStandardMaterial color="#2d5016" />
            </mesh>
            {/* Shell cone behind */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.15, 0.25, 8]} />
              <meshStandardMaterial color="#3d6020" />
            </mesh>
          </group>
          
          {/* Glowing cyan circuit lines */}
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
          
          {/* Glowing lanterns */}
          <mesh position={[0.4, 0.85, 1.5]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={3} />
          </mesh>
          <mesh position={[-0.4, 0.85, 1.5]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.4, 0.85, -1]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[-0.4, 0.85, -1]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={2.5} />
          </mesh>
          
          {/* AI Navigation orb at mast top */}
          <mesh position={[0, 3, 0.3]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={CYAN_GLOW} emissive={CYAN_GLOW} emissiveIntensity={3} transparent opacity={0.9} />
          </mesh>
          
          {/* Shield shimmer dome */}
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[2.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={CYAN_GLOW} transparent opacity={0.04} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      
      {/* ===== TIER 4 TECH ===== */}
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
          
          {/* Radar dish */}
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
          
          {/* Cracked hull (gaps) */}
          <mesh position={[0.5, 0.25, -0.5]} rotation={[0, 0.3, 0.1]}>
            <boxGeometry args={[0.05, 0.3, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[-0.45, 0.3, 0.3]} rotation={[0, -0.2, 0.15]}>
            <boxGeometry args={[0.04, 0.25, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>
      )}
    </group>
  );
}
