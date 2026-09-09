import { readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
const entry = Object.keys(manifest).find((key) => manifest[key].isEntry);
const three = Object.keys(manifest).find((key) =>
  key.endsWith("/AtlasThree.tsx"),
);
assert(entry && three, "Both home and deferred 3D entries must exist");
function graph(key, seen = new Set()) {
  if (seen.has(key)) return seen;
  seen.add(key);
  for (const dependency of manifest[key].imports ?? []) graph(dependency, seen);
  return seen;
}
const initial = graph(entry),
  deferred = [...graph(three)].filter((key) => !initial.has(key));
assert(
  !initial.has(three),
  "3D must never be eagerly loaded by the home entry",
);
assert(
  ![...initial].some((key) => /BufferGeometryUtils|AtlasThree/.test(key)),
  "Three.js must stay outside the initial graph",
);
const size = (file) => gzipSync(readFileSync(`dist/${file}`)).length;
const homeJs = [...initial].reduce((n, key) => n + size(manifest[key].file), 0);
const styles = new Set([...initial].flatMap((key) => manifest[key].css ?? []));
const homeCss = [...styles].reduce((n, file) => n + size(file), 0);
const workers = readdirSync("dist/assets")
  .filter((file) => /^atlas\.worker-.*\.js$/.test(file))
  .map((file) => `assets/${file}`);
assert(
  workers.length === 1,
  "The isolated renderer must be one bounded worker bundle",
);
const threeJs =
  deferred.reduce((n, key) => n + size(manifest[key].file), 0) +
  workers.reduce((n, file) => n + size(file), 0);
const report = {
  homeJs,
  homeCss,
  threeJs,
  initial: [...initial].map((key) => manifest[key].file),
  deferred: [...deferred.map((key) => manifest[key].file), ...workers],
  limits: { homeJs: 135000, homeCss: 5000, threeJs: 350000 },
};
console.log(JSON.stringify(report, null, 2));
for (const key of ["homeJs", "homeCss", "threeJs"])
  assert(report[key] <= report.limits[key], `${key} exceeds its gzip budget`);
