import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { random, islandPoint, type AtlasScene } from "./atlas-model";

type V3 = [number, number, number];
export function buildAtlasGeometry(scene: AtlasScene) {
  const pieces: THREE.BufferGeometry[] = [];
  const matrix = new THREE.Matrix4(),
    rotation = new THREE.Quaternion();
  function add(
    geometry: THREE.BufferGeometry,
    color: string,
    position: V3 = [0, 0, 0],
    scale: V3 = [1, 1, 1],
    angles: V3 = [0, 0, 0],
  ) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    geometry.dispose();
    for (const key of Object.keys(g.attributes))
      if (!["position", "normal"].includes(key)) g.deleteAttribute(key);
    const c = new THREE.Color(color),
      colors = new Float32Array(g.getAttribute("position").count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = c.r;
      colors[i + 1] = c.g;
      colors[i + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    rotation.setFromEuler(new THREE.Euler(...angles));
    matrix.compose(
      new THREE.Vector3(...position),
      rotation,
      new THREE.Vector3(...scale),
    );
    g.applyMatrix4(matrix);
    pieces.push(g);
  }
  const trees: {
    x: number;
    y: number;
    z: number;
    angle: number;
    size: number;
  }[] = [];
  for (const island of scene.islands) {
    const c = island.center,
      rng = random(island.seed),
      base = 22;
    for (const [scale, y, height, color] of [
      [1, 0, 5, "#c5bb91"],
      [0.9, 5, 8, island.palette.land],
      [0.67, 13, 8, island.palette.raised],
    ] as const) {
      const shape = new THREE.Shape(
        island.coast.map(
          (p) =>
            new THREE.Vector2(
              c.x + (p.x - c.x) * scale,
              -(c.y + (p.y - c.y) * scale),
            ),
        ),
      );
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false,
        curveSegments: 1,
      });
      geo.rotateX(-Math.PI / 2);
      add(geo, color, [0, y, 0]);
    }
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: string,
    ) =>
      add(new THREE.BoxGeometry(w, h, d), color, [c.x + x, base + y, c.y + z]);
    const roof = (
      x: number,
      y: number,
      z: number,
      r: number,
      h: number,
      color: string,
      sides = 4,
    ) =>
      add(
        new THREE.ConeGeometry(r, h, sides),
        color,
        [c.x + x, base + y, c.y + z],
        [1, 1, 1],
        [0, Math.PI / 4, 0],
      );
    const dome = (x: number, y: number, z: number, r: number, color: string) =>
      add(
        new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        color,
        [c.x + x, base + y, c.y + z],
      );
    const cream = "#ded3af",
      dark = "#345954",
      accent = island.accent;
    switch (island.landmark) {
      case "pavilion":
        add(new THREE.CylinderGeometry(53, 55, 4, 8), cream, [c.x, base, c.y]);
        for (const x of [-30, 30])
          for (const z of [-24, 24]) box(x, 20, z, 5, 40, 5, cream);
        roof(0, 51, 0, 65, 25, accent, 6);
        break;
      case "pigment":
        for (let n = 0; n < 3; n++) {
          box(
            (n - 1) * 34,
            8 + n * 5,
            0,
            30,
            16 + n * 10,
            53,
            ["#ba8891", "#d2b277", "#84b9b1"][n],
          );
          box((n - 1) * 34, 18 + n * 10, 0, 23, 3, 38, cream);
        }
        break;
      case "cinema":
        box(0, 26, -10, 87, 54, 6, cream);
        box(0, 29, -5.9, 72, 38, 2, "#284c61");
        add(
          new THREE.ConeGeometry(9, 3, 3),
          accent,
          [c.x, base + 29, c.y - 3],
          [1, 1, 1],
          [Math.PI / 2, 0, 0],
        );
        for (let n = 0; n < 3; n++)
          box(0, 3, 20 + n * 15, 70 - n * 10, 6, 7, "#b1ae8b");
        break;
      case "workshop":
        box(0, 17, 0, 69, 34, 46, cream);
        roof(0, 47, 0, 56, 27, dark);
        box(28, 39, -13, 9, 33, 11, accent);
        box(12, 12, 24, 18, 24, 2, dark);
        for (const x of [-23, -6]) box(x, 22, 24, 10, 10, 2, accent);
        break;
      case "observatory":
        add(new THREE.CylinderGeometry(32, 35, 32, 12), cream, [
          c.x,
          base + 16,
          c.y,
        ]);
        dome(0, 32, 0, 34, accent);
        add(
          new THREE.CylinderGeometry(6, 9, 43, 8),
          cream,
          [c.x + 19, base + 59, c.y - 2],
          [1, 1, 1],
          [0, 0, -0.85],
        );
        add(
          new THREE.CylinderGeometry(5, 5, 2, 8),
          dark,
          [c.x + 35, base + 73, c.y - 2],
          [1, 1, 1],
          [0, 0, -0.85],
        );
        box(0, 13, 34, 14, 26, 2, dark);
        break;
      case "library":
        box(0, 15, 0, 83, 30, 47, cream);
        roof(0, 39, 0, 63, 19, dark);
        for (const x of [-29, -15, 15, 29]) box(x, 16, 24, 6, 19, 2, dark);
        box(0, 13, 26, 12, 26, 4, accent);
        break;
      case "utilities":
        for (let n = -1; n <= 1; n++) {
          box(n * 28, 22, 0, 21, 44, 31, cream);
          for (let k = 0; k < 3; k++)
            box(n * 28, 12 + k * 10, 16, 13, 3, 2, dark);
          box(n * 28, 44, 0, 13, 2, 23, accent);
        }
        break;
      case "harbor":
        box(0, 24, 0, 25, 48, 24, cream);
        roof(0, 57, 0, 24, 19, accent);
        box(0, 39, 13, 16, 12, 2, "#e8c477");
        box(0, 2, 31, 96, 4, 12, "#baaa7e");
        for (const x of [-33, 33]) roof(x, 13, 28, 15, 26, accent, 3);
        break;
      case "jetty":
        box(-13, 12, -4, 35, 24, 32, cream);
        roof(-13, 33, -4, 33, 18, accent);
        box(17, 0, 26, 84, 4, 16, "#b7a37a");
        box(42, 19, 26, 2, 38, 2, dark);
        box(48, 32, 26, 12, 9, 1, accent);
        break;
    }
    add(new THREE.CylinderGeometry(62, 66, 5, 8), "#334d56", [c.x, base, c.y]);
    for (const x of [-46, 46]) box(x, 4, 23, 16, 2, 4, accent);
    if (island.landmark === "pavilion" || island.landmark === "harbor") {
      box(0, 80, 0, 3, 34, 3, dark);
      add(new THREE.OctahedronGeometry(6), accent, [c.x, base + 99, c.y]);
      box(0, 87, 0, 34, 2, 2, accent);
    }
    if (island.landmark === "pigment")
      for (let n = -1; n <= 1; n++)
        add(
          new THREE.OctahedronGeometry(15),
          accent,
          [c.x + n * 34, base + 48 + n * 5, c.y],
          [0.65, 1.5, 0.65],
        );
    if (island.landmark === "cinema") {
      box(-49, 34, -10, 4, 72, 4, accent);
      box(49, 34, -10, 4, 72, 4, accent);
      box(0, 70, -10, 102, 3, 4, accent);
    }
    if (island.landmark === "workshop") {
      box(30, 54, -13, 13, 58, 16, dark);
      for (let n = 0; n < 3; n++) box(30, 55 + n * 8, -4, 9, 3, 2, accent);
      box(-35, 6, 29, 43, 7, 19, dark);
      for (let n = 0; n < 4; n++) box(-50 + n * 10, 10, 29, 2, 2, 19, accent);
    }
    if (island.landmark === "observatory") {
      add(
        new THREE.TorusGeometry(37, 1.7, 4, 24),
        accent,
        [c.x, base + 32, c.y],
        [1, 1, 1],
        [Math.PI / 2, 0, 0],
      );
      box(-42, 28, 0, 2, 65, 2, dark);
      box(-42, 63, 0, 12, 2, 2, accent);
    }
    if (island.landmark === "library") {
      box(-6, 57, 0, 22, 3, 25, accent);
      box(7, 62, 0, 22, 3, 25, accent);
      for (const x of [-29, -15, 15, 29]) box(x, 28, 24, 6, 2, 2, accent);
    }
    if (island.landmark === "utilities")
      for (let n = -1; n <= 1; n++) box(n * 28, 54, 0, 2, 22, 2, accent);
    if (island.landmark === "harbor")
      for (const x of [-33, 33]) {
        box(x, 19, 28, 17, 38, 17, dark);
        box(x, 40, 28, 19, 3, 19, accent);
      }
    if (island.landmark === "jetty") {
      box(38, 35, 26, 4, 70, 4, dark);
      box(52, 68, 26, 31, 5, 5, cream);
      box(65, 45, 26, 1, 44, 1, accent);
      box(65, 17, 26, 16, 16, 16, accent);
    }
    add(
      new THREE.BoxGeometry(30, 3, 17),
      "#baab86",
      [island.jetty.x, 5, island.jetty.y],
      [1, 1, 1],
      [0, -island.rotation, 0],
    );
    for (let n = 0; n < 7; n++) {
      const a = rng() * Math.PI * 2,
        r = island.radius * (0.6 + rng() * 0.12);
      const p = islandPoint(island, Math.cos(a) * r, Math.sin(a) * r * 0.7);
      trees.push({
        x: p.x,
        y: 14,
        z: p.y,
        angle: rng() * 6,
        size: 0.75 + rng() * 0.45,
      });
    }
  }
  const terrain = pieces.length
    ? mergeGeometries(pieces)
    : new THREE.BufferGeometry();
  pieces.forEach((g) => g.dispose());
  return { terrain, trees };
}

export function buildTurtle() {
  const root = new THREE.Group(),
    paddles: THREE.Group[] = [],
    materials: THREE.Material[] = [],
    geometries: THREE.BufferGeometry[] = [];
  const material = (color: string) => {
    const m = new THREE.MeshLambertMaterial({ color });
    materials.push(m);
    return m;
  };
  const skin = material("#a7c48b"),
    shell = material("#80905b"),
    seam = material("#395f4a"),
    glow = material("#92dfc1"),
    dark = material("#28494d"),
    eye = material("#edead4");
  function mesh(
    g: THREE.BufferGeometry,
    m: THREE.Material,
    position: V3,
    scale: V3 = [1, 1, 1],
    parent: THREE.Object3D = root,
  ) {
    geometries.push(g);
    const v = new THREE.Mesh(g, m);
    v.position.set(...position);
    v.scale.set(...scale);
    parent.add(v);
    return v;
  }
  const orb = (
    pos: V3,
    size: V3,
    m: THREE.Material,
    parent: THREE.Object3D = root,
  ) => mesh(new THREE.SphereGeometry(1, 12, 8), m, pos, size, parent);
  orb([-2, 4, 0], [25, 5, 18], skin);
  orb([-4, 7, 0], [23, 9, 16], shell);
  // Follow the dome: flat rings and traces disappear inside the shell at normal scale.
  const shellPoint = (x: number, z: number) =>
    new THREE.Vector3(
      x,
      7.5 + 9 * Math.sqrt(Math.max(0, 1 - ((x + 4) / 23) ** 2 - (z / 16) ** 2)),
      z,
    );
  const seams: THREE.BufferGeometry[] = [];
  for (const x of [-15, -4, 7]) {
    const points = Array.from({ length: 6 }, (_, n) => {
      const a = (n * Math.PI) / 3;
      return shellPoint(x + Math.cos(a) * 6.3, Math.sin(a) * 7.5);
    });
    seams.push(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points, true, "centripetal"),
        24,
        0.45,
        4,
        true,
      ),
    );
  }
  mesh(mergeGeometries(seams), seam, [0, 0, 0]);
  seams.forEach((g) => g.dispose());
  for (const side of [-1, 1])
    for (const front of [false, true]) {
      const paddle = new THREE.Group();
      paddle.position.set(front ? 12 : -13, 3, side * 12);
      root.add(paddle);
      paddles.push(paddle);
      const fin = orb(
        [front ? 8 : -6, 0, side * 8],
        [front ? 15 : 10, 2.5, 5.3],
        skin,
        paddle,
      );
      fin.rotation.y = side * (front ? -0.65 : 0.5);
      if (front && side === -1) {
        mesh(
          new THREE.BoxGeometry(7, 3, 5),
          dark,
          [9, 3, -6],
          [1, 1, 1],
          paddle,
        );
        mesh(
          new THREE.BoxGeometry(4.5, 0.5, 3),
          glow,
          [9, 4.6, -6],
          [1, 1, 1],
          paddle,
        );
      }
    }
  orb([29, 5, 0], [11, 6, 8], skin);
  orb([-29, 3, 0], [9, 2, 3], skin);
  for (const side of [-1, 1]) {
    orb([32, 8, side * 5.5], [3, 2.2, 2.2], eye);
    orb([33.5, 8.5, side * 5.7], [1.5, 1.5, 1.5], dark);
  }
  const band = mesh(
    new THREE.TorusGeometry(7.3, 1.3, 4, 12, Math.PI),
    dark,
    [24, 7, 0],
  );
  band.rotation.y = Math.PI / 2;
  orb([24, 7, -7], [3.3, 3, 2], dark);
  orb([24, 7, -8.5], [2, 2, 0.8], glow);
  const traces = [
    [
      [-18, -3],
      [-12, -3],
      [-12, -6],
      [-7, -6],
    ],
    [
      [-8, 5],
      [0, 5],
      [0, 1],
      [9, 1],
      [9, -3],
      [15, -3],
    ],
  ].map(
    (points) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          points.map(([x, z]) => shellPoint(x, z)),
          false,
          "centripetal",
        ),
        24,
        0.55,
        4,
        false,
      ),
  );
  mesh(mergeGeometries(traces), glow, [0, 0, 0]);
  traces.forEach((g) => g.dispose());
  return {
    root,
    paddles,
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
