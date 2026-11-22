import { readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
const entry = Object.keys(manifest).find((key) => manifest[key].isEntry);
assert(entry, "The home entry must exist");

const islandRenderer = /(?:^|\/)(?:AtlasThree|AtlasWorld|atlas\.worker)(?:[.-]|$)/;
assert(
  !Object.entries(manifest).some(
    ([key, chunk]) => islandRenderer.test(key) || islandRenderer.test(chunk.file),
  ) && !readdirSync("dist/assets").some((file) => islandRenderer.test(file)),
  "The 2D-only Islands build must not emit its 3D renderer or worker",
);

function graph(key, seen = new Set()) {
  if (seen.has(key)) return seen;
  seen.add(key);
  for (const dependency of manifest[key].imports ?? []) graph(dependency, seen);
  return seen;
}
const initial = graph(entry);
assert(
  ![...initial].some((key) => /BufferGeometryUtils/.test(key)),
  "Three.js must stay outside the initial graph",
);
const size = (file) => gzipSync(readFileSync(`dist/${file}`)).length;
const homeJs = [...initial].reduce((n, key) => n + size(manifest[key].file), 0);
const styles = new Set([...initial].flatMap((key) => manifest[key].css ?? []));
const homeCss = [...styles].reduce((n, file) => n + size(file), 0);
const report = {
  homeJs,
  homeCss,
  initial: [...initial].map((key) => manifest[key].file),
  limits: { homeJs: 135000, homeCss: 5000 },
};
console.log(JSON.stringify(report, null, 2));
for (const key of ["homeJs", "homeCss"])
  assert(report[key] <= report.limits[key], `${key} exceeds its gzip budget`);
