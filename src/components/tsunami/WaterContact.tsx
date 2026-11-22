import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { waveHeightGLSL } from './wave-field';

/** Broken foam sheets and guidance share the geometric water surface. */
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
      uniform float uTime;
      uniform float uTier;
      uniform float uStormIntensity;
      uniform float uLightning;
      varying vec2 vPoint;
      float hash(vec2 p) {
        vec3 q=fract(p.xyx*0.1031);
        q+=dot(q,q.yzx+33.33);
        return fract((q.x+q.y)*q.z);
      }
      float noise(vec2 p) {
        vec2 i=floor(p),f=fract(p);
        f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
      }
      float fragmentFoam(vec2 p,vec2 center,vec2 size,float angle,float breakup) {
        vec2 d=p-center;
        d=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*d;
        float end=1.0-smoothstep(size.y*0.76,size.y+0.11,abs(d.y));
        float distance=abs(abs(d.x)-size.x-(breakup-0.5)*0.085);
        return (1.0-smoothstep(0.014,0.091,distance))*end*breakup;
      }
      void main() {
        if (!gl_FrontFacing) discard;
        bool wreck=uTier<1.5;
        bool sloop=uTier>1.5&&uTier<2.5;
        float angle=wreck?-0.4:sloop?0.6:-0.52;
        float scale=wreck?2.016:sloop?1.224:1.8;
        vec2 p=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*vPoint/scale;
        if (sloop) p.y+=0.12;
        float halfLength=wreck?0.90:sloop?1.20:2.10;
        float halfWidth=wreck?0.34:sloop?0.35:0.58;
        float shape=halfWidth*sqrt(max(0.0,1.0-p.y*p.y/(halfLength*halfLength)));
        float fade=1.0-smoothstep(halfLength*0.85,halfLength+0.13,abs(p.y));
        vec2 flow=p-vec2(uTime*0.15,-uTime*0.08);
        float raft=noise(flow*vec2(5.4,3.1));
        float filaments=noise(flow*vec2(21.0,12.0));
        float fragments=smoothstep(0.30,0.75,raft*0.60+filaments*0.47);
        float edge=abs(abs(p.x)-shape);
        float splitEdge=abs(abs(p.x)-shape-(raft-0.5)*(wreck?0.25:0.09));
        float lace=1.0-smoothstep(0.013,wreck?0.12:0.072,splitEdge);
        float foam=lace*fragments*fade;
        float contact=(1.0-smoothstep(0.020,0.13,edge))*fade*0.17;
        if (wreck) {
          float brokenSide=smoothstep(-0.20,0.12,-p.x);
          float brokenBow=(1.0-smoothstep(0.030,0.20,abs(p.y+0.67+(raft-0.5)*0.23)))
            *(1.0-smoothstep(0.18,0.55,abs(p.x+0.12)));
          foam=max(foam*brokenSide,brokenBow*fragments*0.66);
          contact*=brokenSide;
          foam=max(foam,fragmentFoam(p,vec2(0.72+sin(uTime*0.27)*0.035,-0.23),vec2(0.12,0.61),
            -0.62+sin(uTime*0.19)*0.03,fragments));
          foam=max(foam,fragmentFoam(p,vec2(-0.68+sin(uTime*0.27+2.0)*0.035,-0.88),vec2(0.07,0.345),
            0.59+sin(uTime*0.19+1.0)*0.03,fragments)*0.72);
          foam=max(foam,fragmentFoam(p,vec2(0.70+sin(uTime*0.27+4.0)*0.035,0.73),vec2(0.085,0.25),
            -0.95+sin(uTime*0.19+2.0)*0.03,fragments)*0.52);
        }
        float white=foam*(wreck?0.78:sloop?0.43:0.58)*min(1.0,0.53+uStormIntensity*0.40);
        float alpha=max(contact,white);
        vec3 foamColor=vec3(0.31,0.47,0.49)*(1.0+uLightning*0.24);
        vec3 color=mix(vec3(0.002,0.008,0.011),foamColor,clamp(white/max(alpha,0.001),0.0,1.0));
        if (uTier>2.5) {
          float forward=p.y-2.1;
          float path=1.0-smoothstep(0.012,0.037,abs(p.x-sin(forward*0.75)*0.11));
          float dash=smoothstep(0.2,0.4,sin(forward*6.0-uTime*0.6));
          float guide=path*dash*smoothstep(0.0,0.35,forward)*(1.0-smoothstep(2.0,3.2,forward));
          color=mix(color,vec3(0.04,0.39,0.34),guide);
          alpha=max(alpha,guide*0.42);
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
