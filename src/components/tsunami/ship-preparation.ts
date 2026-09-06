import * as THREE from 'three';

export type ShipPreparationRenderer = Pick<THREE.WebGLRenderer,
  'compile' | 'domElement' | 'render' | 'getRenderTarget' | 'setRenderTarget' |
  'getActiveCubeFace' | 'getActiveMipmapLevel' | 'getViewport' | 'setViewport' |
  'getScissor' | 'setScissor' | 'getScissorTest' | 'setScissorTest'> & {
    info: Pick<THREE.WebGLRenderer['info'], 'render' | 'autoReset'>;
    shadowMap: Pick<THREE.WebGLRenderer['shadowMap'], 'needsUpdate'>;
  };

/** Submit the display variants and uploads without touching a canvas pixel. */
export function warmShipModel(
  renderer: ShipPreparationRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  parent: THREE.Group,
  root: THREE.Group,
  activeRoot: THREE.Group | undefined,
) {
  const target = renderer.getRenderTarget();
  const cubeFace = renderer.getActiveCubeFace();
  const mipLevel = renderer.getActiveMipmapLevel();
  const viewport = renderer.getViewport(new THREE.Vector4());
  const scissor = renderer.getScissor(new THREE.Vector4());
  const scissorTest = renderer.getScissorTest();
  const activeVisible = activeRoot?.visible;
  const previousParent = root.parent;
  const previousIndex = previousParent?.children.indexOf(root) ?? -1;
  const culling: Array<[THREE.Object3D, boolean]> = [];
  const shadows: THREE.LightShadow[] = [];
  scene.traverse(object => {
    if (object instanceof THREE.DirectionalLight || object instanceof THREE.PointLight || object instanceof THREE.SpotLight) {
      if (object.castShadow) shadows.push(object.shadow);
    }
  });
  const { calls, triangles, points, lines } = renderer.info.render;
  const autoReset = renderer.info.autoReset;
  try {
    if (activeRoot) activeRoot.visible = false;
    root.traverse(object => {
      culling.push([object, object.frustumCulled]);
      object.frustumCulled = false;
    });
    parent.add(root);
    // A normal render target uses different tone-mapping/color-space programs.
    // A zero-area display scissor retains the real variants and discards pixels.
    renderer.setScissor(0, 0, 0, 0);
    renderer.setScissorTest(true);
    renderer.setRenderTarget(null);
    renderer.shadowMap.needsUpdate = true;
    shadows.forEach(shadow => { shadow.needsUpdate = true; });
    renderer.info.autoReset = false;
    Object.assign(renderer.info.render, { calls: 0, triangles: 0, points: 0, lines: 0 });
    renderer.render(scene, camera);
    return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
  } finally {
    root.removeFromParent();
    if (previousParent) {
      previousParent.add(root);
      previousParent.children.splice(previousParent.children.indexOf(root), 1);
      previousParent.children.splice(previousIndex, 0, root);
    }
    culling.forEach(([object, culled]) => { object.frustumCulled = culled; });
    if (activeRoot && activeVisible !== undefined) activeRoot.visible = activeVisible;
    // Warm shadow maps contain a different ship. Force the selected ship's next
    // ordinary render to refresh them, including lights with autoUpdate disabled.
    renderer.shadowMap.needsUpdate = true;
    shadows.forEach(shadow => { shadow.needsUpdate = true; });
    renderer.info.autoReset = autoReset;
    Object.assign(renderer.info.render, { calls, triangles, points, lines });
    // Keep Three's internal frame ID monotonic: geometry uploads are keyed by it.
    renderer.setViewport(viewport);
    renderer.setScissor(scissor);
    renderer.setScissorTest(scissorTest);
    renderer.setRenderTarget(target, cubeFace, mipLevel);
  }
}
