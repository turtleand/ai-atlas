import { STROKE_RATE } from "./journey";
import { buildSeaGeometry } from "./atlas-sea-geometry";
import { featureMotion } from "./atlas-features";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildAtlasGeometry, buildTurtle } from "./atlas-geometry";
import type { AtlasThreeProps } from "./atlas-renderer";
import { freshTiming, sampleQuality } from "./quality";
extend({
  AmbientLight: THREE.AmbientLight,
  DirectionalLight: THREE.DirectionalLight,
  Mesh: THREE.Mesh,
  PlaneGeometry: THREE.PlaneGeometry,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  InstancedMesh: THREE.InstancedMesh,
});
export function AtlasWorld({
  scene,
  view,
  driver,
  active,
  onReady,
  onFail,
  onSlow,
  low,
  setLow,
  onFrame,
  onStats,
}: AtlasThreeProps & {
  low: boolean;
  setLow: () => void;
  onFrame: () => void;
  onStats: (stats: Record<string, unknown>) => void;
}) {
  const { gl, camera, invalidate, scene: world } = useThree();
  const authored = useMemo(() => buildAtlasGeometry(scene), [scene]);
  const turtle = useMemo(() => buildTurtle(), []);
  const terrainMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ vertexColors: true }),
    [],
  );
  const sea = useMemo(
    () => buildSeaGeometry(scene, terrainMaterial),
    [scene, terrainMaterial],
  );
  const trunkMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#a2946b" }),
    [],
  );
  const leafMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ color: "#416a48" }),
    [],
  );
  const trunkGeometry = useMemo(
    () => new THREE.CylinderGeometry(1.8, 2.7, 26, 5),
    [],
  );
  const leafGeometry = useMemo(() => new THREE.SphereGeometry(1, 6, 3), []);
  const trunk = useRef<THREE.InstancedMesh>(null),
    leaves = useRef<THREE.InstancedMesh>(null);
  const coastGeometry = useMemo(() => {
    const geometries = scene.islands.map((i) => {
      const shape = new THREE.Shape(
        i.coast.map(
          (p) =>
            new THREE.Vector2(
              i.center.x + (p.x - i.center.x) * 1.2,
              -(i.center.y + (p.y - i.center.y) * 1.2),
            ),
        ),
      );
      const geometry = new THREE.ShapeGeometry(shape);
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, -0.1, 0);
      return geometry;
    });
    const merged = geometries.length
      ? mergeGeometries(geometries)
      : new THREE.BufferGeometry();
    geometries.forEach((g) => g.dispose());
    return merged;
  }, [scene]);
  // The shared flat ocean avoids a full-screen animated fragment shader.
  const water = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#173e48", toneMapped: false }),
    [],
  );
  const wakeGeometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 18 }, () => new THREE.Vector3()),
      ),
    [],
  );
  const wakeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#9fd4bf",
        transparent: true,
        opacity: 0.4,
      }),
    [],
  );
  const wakeLine = useMemo(
    () => new THREE.Line(wakeGeometry, wakeMaterial),
    [wakeGeometry, wakeMaterial],
  );
  const routeGeometry = useMemo(
    () =>
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(512 * 3), 3),
      ),
    [],
  );
  const routeMaterial = useMemo(
    () =>
      new THREE.LineDashedMaterial({
        color: "#a3c8b4",
        transparent: true,
        opacity: 0.35,
        dashSize: 6,
        gapSize: 12,
      }),
    [],
  );
  const routeLine = useMemo(
    () => new THREE.Line(routeGeometry, routeMaterial),
    [routeGeometry, routeMaterial],
  );
  const routeRef = useRef<unknown>(null);
  const frameSamples = useRef<number[]>([]);
  const timing = useRef(freshTiming());
  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.position.set(
      view.center.x,
      900 * 0.72,
      view.center.y + 900 * Math.sqrt(1 - 0.72 * 0.72),
    );
    cam.lookAt(view.center.x, 0, view.center.y);
    cam.zoom = view.zoom;
    cam.near = 0.1;
    cam.far = 5000;
    cam.updateProjectionMatrix();
    invalidate();
    // Offscreen resize needs a presentation frame after the camera/buffer update,
    // including when the journey is paused and no pose messages will follow.
    const frame = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(frame);
  }, [camera, view, invalidate, gl, water]);
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    let index = 0;
    authored.trees.forEach((t, n) => {
      dummy.position.set(t.x, t.y + 13 * t.size, t.z);
      dummy.rotation.set(0.08, 0, 0.12);
      dummy.scale.set(t.size, t.size, t.size);
      dummy.updateMatrix();
      trunk.current?.setMatrixAt(n, dummy.matrix);
      for (let k = 0; k < 4; k++) {
        if (low && k % 2) continue;
        const a = t.angle + (k * Math.PI) / 2;
        dummy.position.set(
          t.x + Math.cos(a) * 8,
          t.y + 25 * t.size,
          t.z + Math.sin(a) * 8,
        );
        dummy.rotation.set(0, -a, 0.12);
        dummy.scale.set(15 * t.size, 1.8, 4.3 * t.size);
        dummy.updateMatrix();
        leaves.current?.setMatrixAt(index++, dummy.matrix);
      }
    });
    if (trunk.current) {
      trunk.current.instanceMatrix.needsUpdate = true;
      trunk.current.computeBoundingSphere();
    }
    if (leaves.current) {
      leaves.current.instanceMatrix.needsUpdate = true;
      leaves.current.computeBoundingSphere();
    }
    invalidate();
  }, [authored, invalidate, low]);
  useEffect(() => {
    let disposed = false,
      frame = 0;
    const lost = (event: Event) => {
      event.preventDefault();
      if (!disposed) onFail(new Error("WebGL context lost"));
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    // Compile only after opt-in. The SVG and HTML controls stay usable until ready.
    frame = requestAnimationFrame(() => {
      gl.compileAsync(world, camera)
        .then(() => {
          if (!disposed) {
            invalidate();
            frame = requestAnimationFrame(() => {
              if (!disposed) onReady();
            });
          }
        })
        .catch((error) => {
          if (!disposed) onFail(error);
        });
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      gl.domElement.removeEventListener("webglcontextlost", lost);
    };
  }, [gl, world, camera, invalidate, onReady, onFail]);
  useEffect(
    () =>
      driver.subscribe(() => {
        invalidate();
      }),
    [driver, invalidate],
  );
  useEffect(() => {
    timing.current = freshTiming();
    frameSamples.current = [];
    invalidate();
  }, [active, low, invalidate]);
  useFrame(() => {
    const j = driver.ref.current;
    if (routeRef.current !== j.path) {
      routeRef.current = j.path;
      const points = routeGeometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const count = Math.min(j.path.length, 512);
      for (let n = 0; n < count; n++)
        points.setXYZ(n, j.path[n].x, 1, j.path[n].y);
      points.needsUpdate = true;
      routeGeometry.setDrawRange(0, count);
      routeGeometry.computeBoundingSphere();
      routeLine.computeLineDistances();
    }
    sea.roots.forEach((root, n) => {
      root.position.y = featureMotion(scene.features[n], j.time);
    });
    turtle.root.position.set(
      j.position.x,
      Math.sin(j.time * 2) * 0.3,
      j.position.y,
    );
    turtle.root.rotation.y = -j.heading;
    const scale = Math.min(1.15, Math.max(0.62, 0.32 / view.zoom));
    turtle.root.scale.setScalar(scale);
    turtle.paddles.forEach((p, n) => {
      p.rotation.y =
        Math.sin(j.time * STROKE_RATE + (n % 2 ? 0 : 1)) *
        (n % 2 ? 0.3 : 0.12) *
        (n < 2 ? -1 : 1) *
        (j.phase === "visit" ? 0.18 : 1);
    });
    const history = j.wake.slice(-18);
    const positions = wakeGeometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    for (let n = 0; n < 18; n++) {
      const p = history[Math.min(n, history.length - 1)] ?? j.position;
      positions.setXYZ(n, p.x, 2, p.y);
    }
    positions.needsUpdate = true;
    wakeGeometry.computeBoundingSphere();
    if (active) {
      const now = performance.now(),
        stats = timing.current;
      if (stats.last) {
        if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1") {
          frameSamples.current.push(now - stats.last);
          if (frameSamples.current.length > 180) frameSamples.current.shift();
        }
      }
      const decision = sampleQuality(stats, now, low);
      if (decision === "reduce") setLow();
      if (decision === "pause") onSlow();
    }
    if (import.meta.env.DEV || import.meta.env.VITE_ATLAS_QA === "1") {
      const frames = [...frameSamples.current].sort((a, b) => a - b);
      onStats({
        view: { zoom: view.zoom, width: view.width, height: view.height },
        camera: {
          zoom: camera.zoom,
          left: (camera as THREE.OrthographicCamera).left,
          top: (camera as THREE.OrthographicCamera).top,
        },
        buffer: { width: gl.domElement.width, height: gl.domElement.height },
        frameMedian: frames[Math.floor(frames.length * 0.5)] ?? null,
        frameP95: frames[Math.floor(frames.length * 0.95)] ?? null,
        frameSamples: frames.length,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        dpr: gl.getPixelRatio(),
        low,
        phase: j.phase,
        position: j.position,
        time: j.time,
      });
    }
    onFrame();
  });
  useEffect(
    () => () => {
      sea.dispose();
      authored.terrain.dispose();
      coastGeometry.dispose();
      terrainMaterial.dispose();
      trunkMaterial.dispose();
      leafMaterial.dispose();
      trunkGeometry.dispose();
      leafGeometry.dispose();
      water.dispose();
      turtle.dispose();
      wakeGeometry.dispose();
      wakeMaterial.dispose();
      routeGeometry.dispose();
      routeMaterial.dispose();
    },
    [
      authored,
      sea,
      coastGeometry,
      terrainMaterial,
      trunkMaterial,
      leafMaterial,
      trunkGeometry,
      leafGeometry,
      water,
      turtle,
      wakeGeometry,
      wakeMaterial,
      routeGeometry,
      routeMaterial,
    ],
  );
  return (
    <>
      {sea.roots.map((root, n) => (
        <primitive key={scene.features[n].id} object={root} dispose={null} />
      ))}
      <ambientLight intensity={1.45} />
      <directionalLight
        position={[-400, 900, -500]}
        intensity={2}
        color="#f5e6c5"
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[scene.width / 2, -1, scene.height / 2]}
        material={water}
      >
        <planeGeometry args={[scene.width * 5, scene.height * 5]} />
      </mesh>
      <mesh geometry={coastGeometry}>
        <meshBasicMaterial color="#477e79" transparent opacity={0.58} />
      </mesh>
      <mesh geometry={authored.terrain} material={terrainMaterial} />
      <instancedMesh
        ref={trunk}
        args={[trunkGeometry, trunkMaterial, authored.trees.length]}
      />
      <instancedMesh
        ref={leaves}
        args={[leafGeometry, leafMaterial, authored.trees.length * 4]}
        count={authored.trees.length * (low ? 2 : 4)}
      />
      <primitive object={turtle.root} dispose={null} />
      <primitive object={wakeLine} dispose={null} />
      <primitive object={routeLine} dispose={null} />
    </>
  );
}
