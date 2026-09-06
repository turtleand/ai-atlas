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
  lightningUniform: THREE.IUniform<number>;
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
  uniform float uLightning;
  uniform float uTier;
  uniform float uCalmRadius;
  uniform float uSubmersion;
  ${atmosphereGLSL}
  varying vec3 vWorldPosition;
  varying vec3 vWaveNormal;
  varying float vHeight;
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
  }
  void main() {
    vec2 p=vWorldPosition.xz;
    float distanceToCamera=length(cameraPosition-vWorldPosition);
    float calm=uCalmRadius>0.0?1.0-smoothstep(0.0,uCalmRadius,length(p)):0.0;
    float microFade=(1.0-smoothstep(20.0,65.0,distanceToCamera))*(1.0-calm*0.8);
    // Filter unresolved surface detail at grazing angles. The shared swell
    // normal stays intact while small ripples cease to form distant bands.
    float footprint=max(length(dFdx(p)),length(dFdy(p)));
    microFade*=1.0-smoothstep(0.14,0.65,footprint);
    float warp=noise(p*0.34+vec2(-uTime*0.04,0.0))*2.4;
    vec2 ripplePoint=p+vec2(warp,-warp*0.63);
    float rippleX=noise(ripplePoint*vec2(1.5,0.6)+vec2(uTime*0.08,uTime*0.13))-0.5;
    float rippleZ=noise(ripplePoint*vec2(0.55,1.4)+vec2(13.7-uTime*0.11,29.1))-0.5;
    vec3 normal=normalize(vWaveNormal+vec3(rippleX,0.0,rippleZ)*0.22*microFade);
    if(!gl_FrontFacing)normal=-normal;
    vec3 eye=normalize(cameraPosition-vWorldPosition);
    vec3 light=normalize(vec3(8.0,14.0,6.0));
    float facing=max(dot(normal,light),0.0);
    float fresnel=0.025+0.975*pow(1.0-max(dot(normal,eye),0.0),5.0);
    vec3 reflection=reflect(-eye,normal);
    float skyBand=smoothstep(-0.15,0.45,reflection.y);
    vec3 sky=mix(vec3(0.038,0.088,0.12),vec3(0.065,0.12,0.18),skyBand);
    float cloudOpening=pow(max(dot(reflection,light),0.0),22.0);
    float cloudReflection=noise(reflection.xz*5.0+uTime*0.004);
    sky*=0.62+cloudReflection*0.6;
    sky+=vec3(0.38,0.43,0.48)*cloudOpening;
    sky+=vec3(0.15,0.21,0.3)*uLightning;
    vec3 body=mix(vec3(0.004,0.026,0.041),vec3(0.018,0.092,0.102),0.45+vHeight*0.3);
    vec3 water=mix(body*(0.62+facing*0.38),sky,fresnel*0.88);
    float spec=pow(max(dot(normal,normalize(light+eye)),0.0),100.0);
    water+=vec3(0.35,0.48,0.52)*spec*(0.35+uLightning*1.1);
    float broad=noise(p*0.43+vec2(uTime*0.12,0.0));
    float detail=noise(p*3.8+vec2(-uTime*0.18,uTime*0.08));
    float crest=smoothstep(0.78,1.03,vHeight)*(1.0-calm);
    float foam=smoothstep(0.59,0.85,broad*0.55+detail*0.45)*crest;
    water=mix(water,vec3(0.33,0.46,0.46),foam*0.45);
    water+=vec3(0.075,0.095,0.12)*uLightning*(0.45+fresnel);
    if(uTier>3.5) {
      vec3 energy=mix(vec3(0.02,0.31,0.29),vec3(0.42,0.24,0.065),step(4.5,uTier));
      float radius=length(p);
      float ordered=pow(0.5+0.5*sin(radius*3.7-uTime*0.45),12.0);
      float field=calm*calm*(0.07+ordered*0.18);
      float reflectionStreak=exp(-abs(p.x)*0.7)*exp(-abs(p.y)*0.12);
      water+=energy*(field+reflectionStreak*calm*0.2);
      if(uTier>4.5){
        float anchors=0.0;
        for(int i=0;i<6;i++){
          float a=float(i)*1.04719755;
          vec2 foot=vec2(cos(a),sin(a))*2.556;
          float d=length(p-foot);
          anchors+=exp(-d*d*9.0)*0.32+exp(-d*2.8)*pow(0.5+0.5*sin(d*16.0-uTime*0.6),8.0)*0.04;
        }
        water+=energy*anchors;
      }
    }
    if(!gl_FrontFacing)water*=vec3(0.38,0.62,0.70);
    vec3 aquatic=vec3(0.003,0.019,0.028);
    water=mix(water,aquatic,uSubmersion*(1.0-exp(-distanceToCamera*0.14)));
    float fog=smoothstep(35.0,90.0,distanceToCamera);
    water=mix(water,mix(stormHorizon(uTier,uLightning),aquatic,uSubmersion),fog);
    gl_FragColor=vec4(water,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function Ocean3D({wavePercent,tier,calmRadius,lightningUniform,timeUniform,captureTime,reducedMotion,lowQuality=false}:Ocean3DProps) {
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
    uLightning:lightningUniform,uTier:{value:1},uSubmersion:{value:0},
  },side:THREE.DoubleSide}),[lightningUniform,timeUniform]);
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
