import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { AtlasScene } from "./atlas-model";

// One vertex-colored mesh per feature; the whole creature bobs inside its fixed footprint.
export function buildSeaGeometry(scene: AtlasScene, material: THREE.Material) {
  const geometries: THREE.BufferGeometry[] = [];
  const roots = scene.features.map((f) => {
    const pieces: THREE.BufferGeometry[] = [];
    const add = (
      geometry: THREE.BufferGeometry,
      color: string,
      x = 0,
      y = 0,
      z = 0,
      sx = 1,
      sy = 1,
      sz = 1,
      rx = 0,
      ry = 0,
      rz = 0,
    ) => {
      const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
      geometry.dispose();
      g.deleteAttribute("uv");
      g.rotateX(rx);
      g.rotateY(ry);
      g.rotateZ(rz);
      g.scale(sx, sy, sz);
      g.translate(x, y, z);
      const c = new THREE.Color(color),
        colors = new Float32Array(g.getAttribute("position").count * 3);
      for (let n = 0; n < colors.length; n += 3) {
        colors[n] = c.r;
        colors[n + 1] = c.g;
        colors[n + 2] = c.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      pieces.push(g);
    };
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      c = f.color,
    ) => add(new THREE.BoxGeometry(w, h, d), c, x, y, z);
    const orb = (
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      c = f.color,
    ) => add(new THREE.SphereGeometry(1, 12, 8), c, x, y, z, sx, sy, sz);
    const line = (points: number[][], color = f.color, r = 1.8) => {
      const curve = new THREE.CatmullRomCurve3(
        points.map(
          (p) => new THREE.Vector3(...(p as [number, number, number])),
        ),
      );
      add(new THREE.TubeGeometry(curve, 16, r, 5, false), color);
    };
    const dark = "#294650",
      metal = "#56656a";
    if (f.id === "hallucinations") {
      orb(-5, 8, 0, 40, 18, 24, "#415c68");
      add(
        new THREE.ConeGeometry(21, 26, 3),
        metal,
        -48,
        5,
        0,
        1,
        1,
        1,
        0,
        0,
        Math.PI / 2,
      );
      orb(22, 20, 15, 6, 6, 3, "#c1ded2");
      orb(24, 21, 17, 2, 3, 1, dark);
      orb(33, 8, 0, 5, 8, 14, dark);
      line([
        [0, 23, 0],
        [6, 61, 0],
        [36, 61, 0],
        [42, 37, 0],
      ]);
      add(new THREE.OctahedronGeometry(10), "#a3c9c4", 42, 34, 0);
      for (let n = 0; n < 3; n++) box(35, 10, -8 + n * 8, 4, 5, 2, "#b7c1b2");
    }
    if (f.id === "containment") {
      line(
        [
          [-44, 1, 14],
          [-26, 15, 7],
          [-24, 43, -5],
          [-8, 53, -5],
          [5, 30, 0],
          [21, 2, 12],
          [43, 7, 4],
        ],
        "#627c6b",
        9,
      );
      orb(-8, 52, -4, 14, 10, 12, "#738774");
      orb(0, 55, 6, 3, 2, 2, "#ddc194");
      for (const [x, z] of [
        [-50, -25],
        [-50, 25],
        [45, -25],
      ])
        box(x, 20, z, 4, 40, 4, "#70989d");
      line(
        [
          [-50, 40, 25],
          [-50, 40, -25],
          [-30, 40, -25],
        ],
        "#9cbbb7",
        2,
      );
      line(
        [
          [12, 40, -25],
          [45, 40, -25],
          [45, 22, 6],
        ],
        "#9cbbb7",
        2,
      );
      line(
        [
          [-50, 1, 25],
          [0, 1, 40],
          [50, 1, 25],
        ],
        "#70989d",
        2,
      );
    }
    if (f.id === "compute") {
      box(0, 4, 0, 108, 10, 47, dark);
      for (let n = -1; n <= 1; n++) {
        box(n * 27, 21, 0, 20, 32, 25, metal);
        box(n * 27, 24, 13, 11, 21, 2, "#263942");
        box(n * 27, 15, 14, 11, 3, 2, "#ab9268");
      }
      box(-45, 31, -4, 12, 38, 19, metal);
      box(-45, 47, 6, 7, 4, 1, f.color);
    }
    if (f.id === "debt") {
      for (let n = 0; n < 5; n++)
        add(
          new THREE.ConeGeometry(14, 30 + (n % 2) * 14, 5),
          "#79675b",
          -42 + n * 21,
          10,
          (n % 2) * 19 - 9,
          1,
          1,
          1,
          0,
          n,
          0,
        );
      box(-18, 18, 2, 19, 31, 17, metal);
      line(
        [
          [-57, 4, 19],
          [-42, 21, -9],
          [-17, 10, 16],
          [10, 28, -8],
          [40, 2, 20],
        ],
        "#b18b71",
        3,
      );
      line(
        [
          [-40, 4, -20],
          [-10, 9, 25],
          [35, 14, 15],
          [51, 5, -10],
        ],
        "#967f70",
        2,
      );
      add(
        new THREE.TorusGeometry(14, 3, 5, 14),
        f.color,
        28,
        12,
        14,
        1,
        1,
        1,
        Math.PI / 4,
      );
    }
    if (f.id === "reviews") {
      box(0, 2, 0, 110, 5, 35, metal);
      box(-42, 29, 0, 6, 58, 7);
      box(-19, 56, 0, 50, 7, 9);
      box(40, 16, 0, 6, 32, 7);
      box(33, 35, 0, 19, 6, 8);
      box(-23, 41, 6, 18, 22, 2, dark);
      box(-23, 46, 8, 10, 2, 1);
      box(-23, 40, 8, 10, 2, 1);
      box(10, 10, 7, 17, 17, 17, "#a69772");
      box(46, 4, 24, 14, 10, 14, "#a69772");
    }
    if (f.id === "understanding") {
      const points = Array.from({ length: 65 }, (_, n) => {
        const a = (n / 64) * Math.PI * 4.7,
          r = 5 + n * 0.57;
        return [Math.cos(a) * r, 26 + Math.sin(a) * r, 0];
      });
      line(points, "#7798a3", 2.4);
      for (let n = 0; n < 10; n++) {
        const a = (n / 10) * Math.PI * 2;
        line(
          [
            [Math.cos(a) * 26, 26 + Math.sin(a) * 26, 0],
            [Math.cos(a) * 43, 26 + Math.sin(a) * 43, 0],
          ],
          "#557580",
          1,
        );
      }
      for (let n = 0; n < 3; n++)
        line(
          [
            [28, 5, n * 6],
            [46, 7, n * 7 + 2],
            [63, 3, n * 9 - 4],
          ],
          "#7798a3",
          1.3,
        );
    }
    if (f.id === "burnout") {
      add(
        new THREE.SphereGeometry(36, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        "#725f70",
        0,
        21,
        0,
        1,
        0.8,
        0.75,
      );
      add(
        new THREE.TorusGeometry(31, 2, 5, 16),
        "#bd938e",
        0,
        21,
        0,
        1,
        1,
        0.75,
        Math.PI / 2,
      );
      for (let n = 0; n < 6; n++) {
        const a = (n * Math.PI) / 3,
          x = Math.cos(a) * 27,
          z = Math.sin(a) * 20;
        line(
          [
            [x, 21, z],
            [x * 1.2, 7, z * 1.2],
            [x * 1.4, 2, z * 1.5],
            [x * 1.7, 1, z * 1.9],
          ],
          n % 2 ? "#b08a8a" : "#65535e",
          2,
        );
      }
      orb(0, 19, 0, 13, 11, 13, "#583f4a");
      for (let n = -1; n <= 1; n++) box(n * 12, 42, 13, 5, 3, 6, "#c49b86");
    }
    const geometry = mergeGeometries(pieces);
    pieces.forEach((g) => g.dispose());
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(f.center.x, 0, f.center.y);
    return mesh;
  });
  return { roots, dispose: () => geometries.forEach((g) => g.dispose()) };
}
