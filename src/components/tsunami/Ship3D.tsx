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
    
    // Tier-based sink offset
    const sinkOffset = tier === 1 ? -0.5 - Math.sin(time * 0.3) * 0.2 : 
                       tier === 2 ? -0.2 : 0;
    
    groupRef.current.position.y = waveY + sinkOffset;
    
    // Follow wave slope
    const tiltFactor = tier === 5 ? 0.2 : tier === 4 ? 0.4 : tier === 3 ? 0.9 : tier === 2 ? 1.3 : 1.5;
    
    const dx = getWaveHeight(0.5, 0, time, stormIntensity) - getWaveHeight(-0.5, 0, time, stormIntensity);
    const dz = getWaveHeight(0, 0.5, time, stormIntensity) - getWaveHeight(0, -0.5, time, stormIntensity);
    
    groupRef.current.rotation.z = Math.atan2(dx, 1) * tiltFactor;
    groupRef.current.rotation.x = Math.atan2(dz, 1) * tiltFactor * 0.7;
    
    // Tier 2: list to one side
    if (tier === 2) groupRef.current.rotation.z += 0.15;
    // Tier 1: actively sinking
    if (tier === 1) groupRef.current.rotation.z += Math.sin(time * 0.5) * 0.3;
  });
  
  // ====== COLOR PALETTES PER TIER ======
  const WOOD_DARK = '#4a2a10';
  const WOOD_MED = '#6b4530';
  const WOOD_LIGHT = '#8b5e3c';
  const HULL_BROWN = '#2a1a0e';
  const SAIL_WHITE = '#f0e8dc';
  const SAIL_TORN = '#b8a890';
  
  // Tech colors (tier 4-5)
  const CHROME = '#b8bcc4';
  const CHROME_DARK = '#6a6e78';
  const CYAN = '#00ffdd';
  const CYAN_DIM = '#00aa99';
  const ENERGY_BLUE = '#2266ff';
  const SHIELD_CYAN = '#00eeff';
  const ENGINE_ORANGE = '#ff6600';
  
  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.8, 1.8, 1.8]}>
      
      {/* =========================================
          TIER 1: WRECKAGE — floating debris
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
          {/* Floating debris */}
          <mesh position={[0.8, 0.02, 0.6]}>
            <boxGeometry args={[0.15, 0.08, 0.4]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          <mesh position={[-0.7, 0.03, -0.5]}>
            <boxGeometry args={[0.12, 0.06, 0.3]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          {/* Broken mast */}
          <mesh position={[0.4, 0.15, -0.6]} rotation={[0.3, 0.2, Math.PI / 4]}>
            <cylinderGeometry args={[0.04, 0.06, 1.5, 6]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          {/* Torn sail piece */}
          <mesh position={[-0.3, 0.12, 0.5]} rotation={[0.5, 0.3, 0.4]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshStandardMaterial color={SAIL_TORN} side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        </group>
      )}
      
      {/* =========================================
          TIER 2: DAMAGED SLOOP — barely floating
          ========================================= */}
      {tier === 2 && (
        <group>
          {/* Small hull */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.8, 0.6, 2]} />
            <meshStandardMaterial color={WOOD_LIGHT} emissive="#1a0e05" emissiveIntensity={0.2} />
          </mesh>
          {/* Deck */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.7, 0.05, 1.8]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          {/* Bow */}
          <mesh position={[0, 0.4, 1.2]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={WOOD_LIGHT} />
          </mesh>
          {/* Angled broken mast */}
          <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.04, 0.06, 2, 8]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          {/* Torn sail */}
          <mesh position={[0, 0.5 + 0.5, 0.3]}>
            <planeGeometry args={[0.8, 1, 5, 5]} />
            <meshStandardMaterial color={SAIL_TORN} side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
          {/* Yard arm */}
          <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          {/* Broken railing segments */}
          <mesh position={[0.42, 0.75, 0.5]}>
            <boxGeometry args={[0.02, 0.15, 0.8]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          {/* Water pooling on deck */}
          <mesh position={[0, 0.63, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 1.2]} />
            <meshStandardMaterial color="#1a3a5c" transparent opacity={0.6} />
          </mesh>
          {/* Hull cracks */}
          <mesh position={[0.45, 0.25, -0.5]} rotation={[0, 0.3, 0.1]}>
            <boxGeometry args={[0.05, 0.3, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>
      )}
      
      {/* =========================================
          TIER 3: BRIGANTINE — solid traditional ship
          ========================================= */}
      {tier === 3 && (
        <group>
          {/* Hull */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.6, 3]} />
            <meshStandardMaterial color={HULL_BROWN} emissive="#0a0804" emissiveIntensity={0.3} />
          </mesh>
          {/* Deck */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.1, 0.05, 2.8]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          {/* Bow */}
          <mesh position={[0, 0.4, 1.7]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={HULL_BROWN} />
          </mesh>
          {/* Keel */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.15, 0.05, 2.5]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          {/* Hull stripes */}
          <mesh position={[0.61, 0.4, 0]}>
            <boxGeometry args={[0.02, 0.08, 2.5]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.61, 0.4, 0]}>
            <boxGeometry args={[0.02, 0.08, 2.5]} />
            <meshStandardMaterial color="white" />
          </mesh>
          {/* Railings */}
          <mesh position={[0.62, 0.75, 0.5]}>
            <boxGeometry args={[0.02, 0.15, 2.5]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          <mesh position={[-0.62, 0.75, 0.5]}>
            <boxGeometry args={[0.02, 0.15, 2.5]} />
            <meshStandardMaterial color={WOOD_MED} />
          </mesh>
          {/* Stern cabin */}
          <mesh position={[0, 0.9, -1]}>
            <boxGeometry args={[0.9, 0.5, 0.8]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          {/* Main mast */}
          <group position={[0, 0.6, 0]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.06, 3.5, 8]} />
              <meshStandardMaterial color={WOOD_MED} />
            </mesh>
            {/* Main sail */}
            <mesh position={[0, 0.8, 0.3]}>
              <planeGeometry args={[1.5, 1.8, 5, 5]} />
              <meshStandardMaterial color={SAIL_WHITE} emissive="#302820" emissiveIntensity={0.3} side={THREE.DoubleSide} transparent opacity={0.95} />
            </mesh>
            {/* Upper sail */}
            <mesh position={[0, 2, 0.25]}>
              <planeGeometry args={[1.2, 1, 4, 4]} />
              <meshStandardMaterial color={SAIL_WHITE} side={THREE.DoubleSide} transparent opacity={0.9} />
            </mesh>
            {/* Yard arms */}
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
          {/* Hull — wood base with metal reinforcement */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.6, 4]} />
            <meshStandardMaterial color={HULL_BROWN} emissive="#0a0804" emissiveIntensity={0.3} />
          </mesh>
          {/* Metal plating on hull (chrome patches) */}
          <mesh position={[0.58, 0.3, 0.5]}>
            <boxGeometry args={[0.06, 0.35, 1.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.58, 0.3, 0.5]}>
            <boxGeometry args={[0.06, 0.35, 1.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.58, 0.3, -0.8]}>
            <boxGeometry args={[0.06, 0.35, 1]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.58, 0.3, -0.8]}>
            <boxGeometry args={[0.06, 0.35, 1]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Deck — metal */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.1, 0.05, 3.8]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Bow — reinforced */}
          <mesh position={[0, 0.4, 2.3]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Metal railings */}
          <mesh position={[0.62, 0.75, 0.5]}>
            <boxGeometry args={[0.02, 0.18, 3.2]} />
            <meshStandardMaterial color={CHROME} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[-0.62, 0.75, 0.5]}>
            <boxGeometry args={[0.02, 0.18, 3.2]} />
            <meshStandardMaterial color={CHROME} metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Stern cabin — tech-enhanced */}
          <mesh position={[0, 0.95, -1.5]}>
            <boxGeometry args={[0.9, 0.6, 0.8]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.6} roughness={0.3} />
          </mesh>
          
          {/* === MASTS WITH TRADITIONAL SAILS === */}
          {/* Main mast */}
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
          {/* Foremast */}
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
          
          {/* === TECH ELEMENTS === */}
          {/* Circuit lines (moderate) */}
          <mesh position={[0.62, 0.35, 0]}>
            <boxGeometry args={[0.01, 0.03, 2.8]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1.0} />
          </mesh>
          <mesh position={[-0.62, 0.35, 0]}>
            <boxGeometry args={[0.01, 0.03, 2.8]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1.0} />
          </mesh>
          {/* Horizontal circuit cross-connects */}
          <mesh position={[0, 0.02, 0.8]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.01, 0.02, 1.2]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={0.8} />
          </mesh>
          {/* Radar dish on stern cabin */}
          <mesh position={[0, 1.4, -1.5]} rotation={[0.3, 0, 0]}>
            <circleGeometry args={[0.2, 16, 0, Math.PI]} />
            <meshStandardMaterial color={CHROME} side={THREE.DoubleSide} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* LED running lights */}
          <mesh position={[0.5, 0.85, 1.5]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.5, 0.85, 1.5]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0, 1.3, -1.9]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={2} />
          </mesh>
          {/* Antenna */}
          <mesh position={[0.3, 1.8, -1.5]}>
            <cylinderGeometry args={[0.01, 0.01, 0.8, 4]} />
            <meshStandardMaterial color={CHROME} metalness={0.8} />
          </mesh>
          <mesh position={[0.3, 2.2, -1.5]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color={CYAN_DIM} emissive={CYAN_DIM} emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}
      
      {/* =========================================
          TIER 5: QUANTUM ARK — full sci-fi vessel
          ========================================= */}
      {tier === 5 && (
        <group>
          {/* === CHROME HULL — sleek metallic === */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.3, 0.65, 4.5]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.85} roughness={0.15} emissive="#0a0a12" emissiveIntensity={0.3} />
          </mesh>
          {/* Hull contour — tapered edges */}
          <mesh position={[0.65, 0.3, 0]}>
            <boxGeometry args={[0.04, 0.5, 4.2]} />
            <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[-0.65, 0.3, 0]}>
            <boxGeometry args={[0.04, 0.5, 4.2]} />
            <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Bow — sharp chrome point */}
          <mesh position={[0, 0.4, 2.6]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.35, 0.35, 0.6]} />
            <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Deck — metallic with glow seams */}
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[1.2, 0.05, 4.3]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Keel — glowing */}
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.12, 0.04, 4]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} />
          </mesh>
          
          {/* === CIRCUIT VEIN NETWORK (many lines) === */}
          {/* Vertical veins — both sides */}
          {[-0.66, 0.66].map((x, i) => (
            <group key={`veins-${i}`}>
              <mesh position={[x, 0.2, 0]}>
                <boxGeometry args={[0.012, 0.04, 3.8]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.5} />
              </mesh>
              <mesh position={[x, 0.4, 0]}>
                <boxGeometry args={[0.012, 0.03, 3.2]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} />
              </mesh>
              <mesh position={[x, 0.55, 0]}>
                <boxGeometry args={[0.012, 0.025, 2.5]} />
                <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.8} />
              </mesh>
            </group>
          ))}
          {/* Horizontal cross-connects */}
          {[-1.2, -0.4, 0.4, 1.2].map((z, i) => (
            <mesh key={`hline-${i}`} position={[0, 0.02, z]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.01, 0.02, 1.3]} />
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} />
            </mesh>
          ))}
          {/* Deck glow lines */}
          <mesh position={[0.4, 0.68, 0]}>
            <boxGeometry args={[0.01, 0.01, 3.5]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.4, 0.68, 0]}>
            <boxGeometry args={[0.01, 0.01, 3.5]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} />
          </mesh>
          
          {/* === ENERGY SAILS (glowing translucent panels) === */}
          {/* Main energy sail — center */}
          <group position={[0, 0.65, 0.3]}>
            {/* Central mast — chrome pillar */}
            <mesh>
              <cylinderGeometry args={[0.05, 0.07, 4, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Primary energy sail */}
            <mesh position={[0, 0.8, 0.35]}>
              <planeGeometry args={[1.8, 2, 6, 6]} />
              <meshStandardMaterial 
                color={CYAN} 
                emissive={ENERGY_BLUE} 
                emissiveIntensity={0.8} 
                side={THREE.DoubleSide} 
                transparent 
                opacity={0.35} 
              />
            </mesh>
            {/* Secondary energy sail (layered glow) */}
            <mesh position={[0, 0.8, 0.4]}>
              <planeGeometry args={[1.6, 1.8, 4, 4]} />
              <meshStandardMaterial 
                color={SHIELD_CYAN} 
                emissive={CYAN} 
                emissiveIntensity={1.2} 
                side={THREE.DoubleSide} 
                transparent 
                opacity={0.15} 
              />
            </mesh>
            {/* Upper energy sail */}
            <mesh position={[0, 2.2, 0.3]}>
              <planeGeometry args={[1.3, 1.2, 4, 4]} />
              <meshStandardMaterial 
                color={CYAN} 
                emissive={ENERGY_BLUE} 
                emissiveIntensity={0.6} 
                side={THREE.DoubleSide} 
                transparent 
                opacity={0.3} 
              />
            </mesh>
            {/* Horizontal yard beams — chrome */}
            <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 2, 6]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} />
            </mesh>
            <mesh position={[0, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} />
            </mesh>
          </group>
          
          {/* Fore energy sail */}
          <group position={[0, 0.65, 1.8]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.06, 3.2, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.6, 0.3]}>
              <planeGeometry args={[1.4, 1.6, 4, 4]} />
              <meshStandardMaterial color={CYAN} emissive={ENERGY_BLUE} emissiveIntensity={0.7} side={THREE.DoubleSide} transparent opacity={0.3} />
            </mesh>
            <mesh position={[0, 1.8, 0.2]}>
              <planeGeometry args={[1, 0.9, 3, 3]} />
              <meshStandardMaterial color={CYAN} emissive={ENERGY_BLUE} emissiveIntensity={0.5} side={THREE.DoubleSide} transparent opacity={0.25} />
            </mesh>
          </group>
          
          {/* Mizzen energy sail */}
          <group position={[0, 0.65, -1.4]}>
            <mesh>
              <cylinderGeometry args={[0.035, 0.05, 2.8, 8]} />
              <meshStandardMaterial color={CHROME} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.5, 0.25]}>
              <planeGeometry args={[1.2, 1.4, 3, 4]} />
              <meshStandardMaterial color={CYAN} emissive={ENERGY_BLUE} emissiveIntensity={0.6} side={THREE.DoubleSide} transparent opacity={0.28} />
            </mesh>
          </group>
          
          {/* === COMMAND BRIDGE (stern superstructure) === */}
          <mesh position={[0, 1.05, -1.8]}>
            <boxGeometry args={[1, 0.7, 1]} />
            <meshStandardMaterial color={CHROME_DARK} metalness={0.8} roughness={0.15} />
          </mesh>
          {/* Bridge windows (glowing) */}
          <mesh position={[0, 1.15, -1.29]}>
            <boxGeometry args={[0.8, 0.2, 0.02]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} transparent opacity={0.7} />
          </mesh>
          
          {/* === TURTLEAND FIGUREHEAD (glowing) === */}
          <group position={[0, 0.5, 2.8]}>
            <mesh position={[0, 0, 0.15]}>
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshStandardMaterial color="#2d5016" emissive={CYAN} emissiveIntensity={0.8} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.17, 0.28, 8]} />
              <meshStandardMaterial color="#3d6020" emissive={CYAN} emissiveIntensity={0.5} />
            </mesh>
          </group>
          
          {/* === AI NAVIGATION ORB (top of main mast) === */}
          <mesh position={[0, 3.2, 0.3]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={4} transparent opacity={0.9} />
          </mesh>
          {/* Orb halo ring */}
          <mesh position={[0, 3.2, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.015, 8, 32]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.5} transparent opacity={0.6} />
          </mesh>
          
          {/* === ENERGY SHIELD DOME === */}
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[3, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={SHIELD_CYAN} transparent opacity={0.06} side={THREE.DoubleSide} />
          </mesh>
          {/* Shield base ring */}
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3, 0.02, 8, 48]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1} transparent opacity={0.3} />
          </mesh>
          
          {/* === ENGINE GLOW (stern) === */}
          <mesh position={[0.3, 0.3, -2.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={ENGINE_ORANGE} emissive={ENGINE_ORANGE} emissiveIntensity={4} />
          </mesh>
          <mesh position={[-0.3, 0.3, -2.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={ENGINE_ORANGE} emissive={ENGINE_ORANGE} emissiveIntensity={4} />
          </mesh>
          {/* Engine exhaust glow */}
          <mesh position={[0, 0.3, -2.4]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color={ENGINE_ORANGE} emissive={ENGINE_ORANGE} emissiveIntensity={2} transparent opacity={0.3} />
          </mesh>
          
          {/* === FLOATING SENSOR DRONES (small orbs around ship) === */}
          <mesh position={[1.5, 1.2, 0.5]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={3} />
          </mesh>
          <mesh position={[-1.5, 1, -0.3]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.8, 1.8, 1.5]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[-0.8, 1.6, -1.2]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.5} />
          </mesh>
          
          {/* === ANTENNA ARRAYS === */}
          <mesh position={[0.4, 1.5, -1.8]}>
            <cylinderGeometry args={[0.012, 0.012, 1, 4]} />
            <meshStandardMaterial color={CHROME} metalness={0.9} />
          </mesh>
          <mesh position={[0.4, 2, -1.8]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.4, 1.5, -1.8]}>
            <cylinderGeometry args={[0.012, 0.012, 1, 4]} />
            <meshStandardMaterial color={CHROME} metalness={0.9} />
          </mesh>
          <mesh position={[-0.4, 2, -1.8]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2} />
          </mesh>
          
          {/* === GLOWING LANTERNS (upgraded to holo-lights) === */}
          <mesh position={[0.55, 0.85, 2]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={3} />
          </mesh>
          <mesh position={[-0.55, 0.85, 2]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={3} />
          </mesh>
        </group>
      )}
    </group>
  );
}
