import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { waveHeightGLSL } from './wave-field';

/** Thin, broken foam and guidance belong to the moving ocean, never a hull-attached disk. */
export function WaterContact({tier,timeUniform,lightningUniform,stormIntensity}:{
  tier:number;timeUniform:THREE.IUniform<number>;lightningUniform:THREE.IUniform<number>;stormIntensity:number;
}) {
  const geometry=useMemo(()=>{
    const g=new THREE.PlaneGeometry(15,24,22,36);g.rotateX(-Math.PI/2);return g;
  },[]);
  const material=useMemo(()=>new THREE.ShaderMaterial({
    uniforms:{uTime:timeUniform,uStormIntensity:{value:1},uCalmRadius:{value:0},uTier:{value:1},uLightning:lightningUniform},
    vertexShader:/* glsl */`
      uniform float uTime;uniform float uStormIntensity;uniform float uCalmRadius;
      varying vec2 vPoint;
      ${waveHeightGLSL}
      void main(){vec3 p=position;p.y=waveHeight(p.xz)+0.045;vPoint=p.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}
    `,
    fragmentShader:/* glsl */`
      uniform float uTime;uniform float uTier;uniform float uLightning;varying vec2 vPoint;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);}
      void main(){
        float angle=uTier<1.5?-0.4:uTier<2.5?0.6:-0.52;
        float scale=uTier<1.5?2.016:uTier<2.5?1.224:1.8;
        vec2 p=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*vPoint/scale;
        if(uTier>1.5&&uTier<2.5)p.y+=0.12;
        float halfLength=uTier<1.5?0.85:uTier<2.5?1.2:2.0;
        float width=uTier<1.5?0.34:uTier<2.5?0.35:0.58;
        float shape=width*sqrt(max(0.0,1.0-pow(p.y/halfLength,2.0)));
        float edge=abs(abs(p.x)-shape);
        float breakup=noise(p*18.0+vec2(-uTime*0.4,uTime*0.25));
        float foam=(1.0-smoothstep(0.008,0.065,edge))*smoothstep(0.15,0.6,breakup)*(1.0-smoothstep(halfLength*0.88,halfLength,abs(p.y)));
        float aft=max(0.0,-p.y-halfLength*0.7);
        float wakeEdge=abs(abs(p.x)-(width*0.58+aft*0.32));
        float wake=(1.0-smoothstep(0.025,0.13+aft*0.07,wakeEdge))*exp(-aft*1.4)*step(0.0,-p.y-halfLength*0.7)*breakup;
        if(uTier<1.5){
          // Wreckage leaves separate fragments and a broken contact arc, not a complete vessel wake.
          foam*=smoothstep(-0.12,0.08,-p.x);
          vec2 fragment=p-vec2(0.72+sin(uTime*0.27)*0.035,-0.23);
          float a=-0.62+sin(uTime*0.19)*0.03;
          fragment=mat2(cos(a),sin(a),-sin(a),cos(a))*fragment;
          float edgeFoam=(1.0-smoothstep(0.012,0.06,abs(abs(fragment.x)-0.12)))*(1.0-smoothstep(0.48,0.65,abs(fragment.y)))*breakup;
          foam=max(foam,edgeFoam*0.8);
          wake=0.0;
        }
        float contact=(1.0-smoothstep(0.025,0.12,edge))*(1.0-smoothstep(halfLength*0.9,halfLength,abs(p.y)))*0.22;
        float white=foam*0.62+wake*0.23;
        float alpha=max(contact,white)*(uTier<1.5?1.2:1.0);
        vec3 color=mix(vec3(0.002,0.009,0.012),vec3(0.37,0.52,0.54)*(1.0+uLightning*0.6),clamp(white/max(alpha,0.001),0.0,1.0));
        if(uTier>2.5){
          float forward=p.y-2.1;
          float path=1.0-smoothstep(0.012,0.037,abs(p.x-sin(forward*0.75)*0.11));
          float dash=smoothstep(0.2,0.4,sin(forward*6.0-uTime*0.6));
          float guide=path*dash*smoothstep(0.0,0.35,forward)*(1.0-smoothstep(2.0,3.2,forward));
          color=mix(color,vec3(0.04,0.55,0.48),guide);alpha=max(alpha,guide*0.5);
        }
        gl_FragColor=vec4(color,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  }),[timeUniform,lightningUniform]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useEffect(()=>()=>material.dispose(),[material]);
  useFrame(()=>{material.uniforms.uStormIntensity.value=stormIntensity;material.uniforms.uTier.value=tier;});
  return tier<=3?<mesh geometry={geometry} material={material} frustumCulled={false}/>:null;
}
