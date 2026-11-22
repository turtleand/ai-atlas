import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWaveHeight, waveHeightGLSL } from './wave-field';
import { atmosphereGLSL } from './atmosphere';
export { getWaveHeight } from './wave-field';

interface Ocean3DProps {
  wavePercent: number;
  tier: number;
  calmRadius?: number;
  seaLoad: THREE.IUniform<number>;
  lightningUniform: THREE.IUniform<number>;
  stormLightDirection: THREE.IUniform<THREE.Vector3>;
  timeUniform?: THREE.IUniform<number>;
  captureTime?: number;
  reducedMotion: boolean;
  lowQuality?: boolean;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uStormIntensity;
  uniform float uCalmRadius;
  varying vec3 vWorldPosition;
  varying vec3 vWaveNormal;
  varying float vHeight;
  ${waveHeightGLSL}
  void main() {
    vec3 p = position;
    p.y = waveHeight(p.xz);
    float e = 0.12;
    float dx = (waveHeight(p.xz + vec2(e,0.0)) - waveHeight(p.xz - vec2(e,0.0))) / (2.0*e);
    float dz = (waveHeight(p.xz + vec2(0.0,e)) - waveHeight(p.xz - vec2(0.0,e))) / (2.0*e);
    vWaveNormal = normalize(mat3(modelMatrix) * vec3(-dx,1.0,-dz));
    vec4 world = modelMatrix * vec4(p,1.0);
    vWorldPosition = world.xyz;
    vHeight = p.y / max(uStormIntensity,0.01);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uStormIntensity;
  uniform float uLightning;
  uniform vec3 uStormLightDirection;
  uniform float uTier;
  uniform float uCalmRadius;
  uniform float uSeaLoad;
  uniform float uSubmersion;
  ${atmosphereGLSL}
  varying vec3 vWorldPosition;
  varying vec3 vWaveNormal;
  varying float vHeight;
  float hash(vec2 p) {
    vec3 q=fract(p.xyx*0.1031);
    q+=dot(q,q.yzx+33.33);
    return fract((q.x+q.y)*q.z);
  }
  float noise(vec2 p) {
    vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
  }
  // Each short streak faces the viewer, but its source stays fixed in the world.
  float reflectedStreak(vec2 point,vec2 source,float width,float reach) {
    vec2 towardCamera=normalize(cameraPosition.xz-source+vec2(0.0001));
    vec2 delta=point-source;
    float along=dot(delta,towardCamera);
    float across=dot(delta,vec2(-towardCamera.y,towardCamera.x));
    float chop=noise(vec2(along*7.8-uTime*1.8,across*2.7));
    float smear=abs(across+(chop-0.5)*width*1.15)/(width*(1.0+max(along,0.0)*0.32));
    return exp(-smear*smear*2.2)*smoothstep(-0.45,0.24,along)
      *(1.0-smoothstep(reach*0.28,reach,along))*smoothstep(0.27,0.73,chop);
  }
  void main() {
    vec2 p=vWorldPosition.xz;
    float radius=length(p);
    vec3 toCamera=cameraPosition-vWorldPosition;
    float distanceToCamera=length(toCamera);
    vec3 eye=toCamera/distanceToCamera;
    float calm=uCalmRadius>0.0?1.0-smoothstep(uCalmRadius*0.47,uCalmRadius*1.17,radius):0.0;
    float wreck=1.0-step(1.5,uTier);
    float sloop=1.0-step(0.5,abs(uTier-2.0));
    float footprint=max(length(dFdx(p)),length(dFdy(p)));

    // Short waves alter reflected light only. The shared geometric swell still
    // owns hull support, shore intersections and camera submersion.
    float warp=noise(p*0.21+vec2(uTime*0.09,-uTime*0.055));
    float crossWarp=noise(p*0.37+vec2(-uTime*0.10,uTime*0.085));
    vec2 waveAxis=vec2(0.28,-0.96);
    vec2 alongCrest=vec2(-waveAxis.y,waveAxis.x);
    vec2 shortAxis=vec2(-0.89,0.46);
    float phase=dot(p,waveAxis)*0.69+uTime*1.30+warp*5.5+crossWarp*1.45;
    float shortPhase=dot(p,shortAxis)*1.66+uTime*1.74+crossWarp*5.0;
    float longChop=sin(phase);
    float crossChop=sin(shortPhase);
    float slope=cos(phase)+0.33*sin(phase*2.0);
    float localDetail=1.0-smoothstep(0.09,0.56,footprint);
    float distantSwell=1.0-smoothstep(0.35,1.35,footprint);
    float gust=0.32+warp*0.44+crossWarp*0.32;
    float steepness=(0.48+wreck*0.12)*min(1.18,uStormIntensity)*gust*(1.0-calm*0.92);
    vec2 shortNormal=(waveAxis*slope*0.32*distantSwell
      +shortAxis*cos(shortPhase)*0.29*localDetail)*steepness;
    vec2 foamUv=vec2(dot(p,alongCrest),dot(p,waveAxis));
    float grain=noise(foamUv*vec2(2.37,5.2)+vec2(crossWarp*3.8,uTime*2.1+warp*1.4));
    shortNormal+=shortAxis*(grain-0.5)*0.15*localDetail*(1.0-calm*0.57);
    float skinDetail=1.0-smoothstep(0.036,0.16,footprint);
    float skin=noise(foamUv*vec2(8.6,17.5)+vec2(grain*2.4+crossWarp*5.9,uTime*3.1+warp*3.2));
    float windRipples=sin(foamUv.y*22.0+skin*4.0+crossWarp*9.2+uTime*3.3);
    shortNormal+=waveAxis*(windRipples*0.043+(skin-0.5)*0.12)*skinDetail*(1.0-calm*0.68);
    vec3 normal=normalize(vWaveNormal-vec3(shortNormal.x,0.0,shortNormal.y));
    if (!gl_FrontFacing) normal=-normal;
    vec3 reflection=reflect(-eye,normal);
    float fresnel=0.025+0.975*pow(1.0-clamp(dot(normal,eye),0.0,1.0),5.0);

    vec3 skylight=normalize(vec3(-0.23,0.21,-1.0));
    float cloudOpening=pow(max(dot(reflection,skylight),0.0),20.0);
    float cloudCover=noise(reflection.xz*4.8+vec2(reflection.y*2.8,uTime*0.009));
    vec3 sky=mix(stormHorizon(uTier,0.0)*0.62,vec3(0.042,0.083,0.115),
      smoothstep(-0.20,0.41,reflection.y))*(0.64+cloudCover*0.66);
    sky+=mix(vec3(0.12,0.158,0.164),vec3(0.063,0.102,0.166),sloop)
      *cloudOpening*(0.25+grain*0.48)*(0.64+localDetail*0.36);

    float face=smoothstep(-0.75,0.94,slope*0.50+0.46*cos(shortPhase));
    float swellShade=clamp(0.40+(face-0.5)*0.44*distantSwell+vHeight*0.14,0.0,1.0);
    vec3 trough=mix(vec3(0.003,0.015,0.021),vec3(0.003,0.011,0.022),sloop);
    vec3 litFace=mix(vec3(0.014,0.067,0.081),vec3(0.016,0.041,0.071),sloop);
    vec3 body=mix(trough,litFace,mix(swellShade,0.22,calm));
    body+=litFace*(skin-0.45)*0.39*skinDetail*(0.5+face*0.5)*(1.0-calm*0.76);
    vec3 water=mix(body,sky,fresnel*0.89);

    float crestCell=noise(foamUv*vec2(0.94,1.92)+vec2(warp*2.3+uTime*0.23,crossWarp*2.2));
    float combinedCrest=longChop*0.72+crossChop*0.28;
    float onCrest=smoothstep(0.60-wreck*0.076,0.92,combinedCrest+(grain-0.5)*0.22);
    float foam=onCrest*smoothstep(0.48,0.81,crestCell*0.68+grain*0.34);
    foam*=mix(0.30+wreck*0.14,0.92,smoothstep(-0.30,0.72,vHeight))*gust;
    // Streaks follow the displaced crest across the water surface.
    float lip = smoothstep(0.57, 1.24, vHeight);
    float nearFoam = 1.0-smoothstep(12.0,43.0,distanceToCamera);
    float cell = noise(foamUv*vec2(0.17,0.27)+vec2(uTime*0.055,-uTime*0.11));
    float gaps = 0.24 + 0.76*smoothstep(0.28,0.70,cell);
    float lace = smoothstep(0.44,0.82,crestCell*0.56 + mix(0.23,grain*0.26+skin*0.29,nearFoam));
    float brokenLip = lip*lace*gaps*(0.29+nearFoam*0.54)*0.86;
    foam = max(foam * 0.58, brokenLip);
    foam*=1.0-smoothstep(0.17,0.76,footprint);
    foam*=mix(1.0,0.33+0.67*smoothstep(0.32,0.66,skin),skinDetail);
    foam*=1.0-calm*0.985;
    water=mix(water,vec3(0.23,0.34,0.38),foam);

    float strike=pow(max(dot(reflection,uStormLightDirection),0.0),38.0);
    float reflectedFlash=strike*(0.15+0.85*grain)*uLightning;
    water+=vec3(0.52,0.66,0.90)*reflectedFlash*(0.30+fresnel*0.70);
    water+=vec3(0.041,0.059,0.084)*foam*uLightning*(0.10+strike*0.58);

    if (uTier>3.5&&calm>0.0) {
      float singularity=step(4.5,uTier);
      vec3 energy=mix(vec3(0.012,0.28,0.26),vec3(0.68,0.35,0.082),singularity);
      float ring=pow(0.5+0.5*sin(radius*3.7-uTime*0.45),12.0);
      float ringStrength=0.58+0.18*singularity;
      float contactGlow=calm*calm*(mix(0.072,0.018,singularity)+ring*ringStrength*mix(0.085,0.018,singularity)*grain);
      float streak=reflectedStreak(p,vec2(0.0),mix(0.23,0.57,singularity),mix(3.4,10.8,singularity))*calm;
      water+=energy*(contactGlow+streak*mix(0.11,0.35,singularity));
      if (uTier>4.5) {
        float anchors=0.0;
        for (int i=0;i<6;i++) {
          float a=float(i)*1.04719755;
          float d=length(p-vec2(cos(a),sin(a))*2.556);
          anchors+=exp(-d*d*12.0)*0.27+exp(-d*3.2)*pow(0.5+0.5*sin(d*19.0-uTime*0.6),8.0)*0.06;
        }
        water+=energy*anchors;
      }
    }
    if (uTier > 3.5 && radius < uCalmRadius*1.25) {
      float singularity = step(4.5, uTier);
      vec3 signal = mix(vec3(0.045,0.23,0.24),vec3(0.26,0.19,0.10),singularity);
      float edge = radius/uCalmRadius;
      float angle = atan(p.y, p.x+0.0001);
      float aperture = smoothstep(0.34,0.62,edge)*(1.0-smoothstep(0.86,1.2,edge));
      float sweeping = sin(radius*1.7 - uTime*0.96 + sin(angle*3.0-uTime*0.31)*0.34);
      float leeward = 0.20 + 0.80*smoothstep(-0.6,0.72,sin(angle*2.0-uTime*0.22));
      float gathering = pow(max(sweeping,0.0),8.0)*leeward*(0.55+0.45*crestCell);
      float phase = 0.35 + 0.65*uSeaLoad;
      water += signal * aperture * gathering * phase * 0.060;

      // The exposed side of the eye picks up a fine edge on the incoming crest.
      float seam = smoothstep(0.78,0.99,edge)*(1.0-smoothstep(1.01,1.22,edge));
      float crest = smoothstep(0.26,0.92,vHeight) * smoothstep(0.38,0.74,crestCell);
      water += vec3(0.14,0.26,0.29) * seam * crest * leeward * 0.38;
    }
    if (sloop>0.0&&radius<4.3) {
      // The sloop's sole lantern is on the port quarter at its existing scale and heading.
      vec2 lamp=vec2(-0.994,-0.952);
      water+=vec3(0.54,0.225,0.043)*reflectedStreak(p,lamp,0.16,1.85)*0.31;
    }

    if (!gl_FrontFacing) water*=vec3(0.38,0.62,0.70);
    vec3 aquatic=vec3(0.003,0.019,0.028);
    water=mix(water,aquatic,uSubmersion*(1.0-exp(-distanceToCamera*0.14)));
    float fog=smoothstep(35.0,90.0,distanceToCamera);
    water=mix(water,mix(stormHorizon(uTier,uLightning),aquatic,uSubmersion),fog);
    gl_FragColor=vec4(water,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function Ocean3D({wavePercent,tier,calmRadius,seaLoad,lightningUniform,stormLightDirection,timeUniform,captureTime,reducedMotion,lowQuality=false}:Ocean3DProps) {
  const intensity=0.5+wavePercent*0.015;
  const geometry=useMemo(()=>{
    const geometry=new THREE.PlaneGeometry(800,800,lowQuality?64:96,lowQuality?64:96);
    geometry.rotateX(-Math.PI/2);
    const positions=geometry.attributes.position;
    // Concentrate vertices where the hulls meet the water, retaining the horizon.
    for(let i=0;i<positions.count;i++) {
      const x=positions.getX(i)/400,z=positions.getZ(i)/400;
      positions.setX(i,Math.sign(x)*Math.pow(Math.abs(x),2.05)*400);
      positions.setZ(i,Math.sign(z)*Math.pow(Math.abs(z),2.05)*400);
    }
    return geometry;
  },[lowQuality]);
  const material=useMemo(()=>new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{
    uTime:timeUniform??{value:0},uStormIntensity:{value:1},uCalmRadius:{value:0},
    uLightning:lightningUniform,uStormLightDirection:stormLightDirection,uTier:{value:1},uSubmersion:{value:0},
    uSeaLoad:seaLoad,
  },side:THREE.DoubleSide}),[lightningUniform,stormLightDirection,timeUniform,seaLoad]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useEffect(()=>()=>material.dispose(),[material]);
  useFrame(({clock,camera})=>{
    if(!timeUniform)material.uniforms.uTime.value=captureTime??clock.getElapsedTime()*(reducedMotion?0.25:1);
    material.uniforms.uStormIntensity.value=intensity;
    material.uniforms.uCalmRadius.value=calmRadius??0;
    material.uniforms.uTier.value=tier;
    const waterDepth=getWaveHeight(camera.position.x,camera.position.z,material.uniforms.uTime.value,intensity,calmRadius??0)-camera.position.y;
    material.uniforms.uSubmersion.value=THREE.MathUtils.smoothstep(waterDepth,-0.035,0.015);
  });
  return <mesh geometry={geometry} material={material} frustumCulled={false}/>;
}
