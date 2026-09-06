import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { verifyRetainedAssets } from './verify-retained-assets.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'atlas-assets-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'scripts'));
  await mkdir(join(root, 'public/assets'), { recursive: true });
  await mkdir(join(root, 'dist/assets'), { recursive: true });
  const assets = [];
  for (let index = 0; index < 9; index++) {
    const bytes = Buffer.from(`export const value = ${index};`);
    const asset = { path: `assets/chunk-${index}.js`, bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'), retained: index < 5,
      dependencies: index === 0 ? ['assets/chunk-1.js'] : [] };
    assets.push(asset);
    await writeFile(join(root, 'dist', asset.path), bytes);
    if (asset.retained) await writeFile(join(root, 'public', asset.path), bytes);
  }
  const manifest = { schemaVersion: 1, sourceCommit: 'a'.repeat(40), assets };
  const save = () => writeFile(join(root, 'scripts/retained-assets.json'), JSON.stringify(manifest));
  await save();
  return { root, manifest, save };
}

test('accepts a complete exact retained and shared graph', async (t) => {
  const { root } = await fixture(t);
  assert.deepEqual(await verifyRetainedAssets(root), { assets: 9, retained: 5 });
});

test('rejects a missing retained output as on a deployment without compatibility assets', async (t) => {
  const { root } = await fixture(t);
  await rm(join(root, 'dist/assets/chunk-0.js'));
  await assert.rejects(verifyRetainedAssets(root));
});

test('rejects a removed retained source even if stale output still exists', async (t) => {
  const { root } = await fixture(t);
  await rm(join(root, 'public/assets/chunk-0.js'));
  await assert.rejects(verifyRetainedAssets(root));
});

test('rejects a same-size output collision on a shared filename', async (t) => {
  const { root } = await fixture(t);
  const file = join(root, 'dist/assets/chunk-8.js');
  const bytes = await readFile(file);
  bytes[bytes.length - 2] = '9'.charCodeAt(0);
  await writeFile(file, bytes);
  await assert.rejects(verifyRetainedAssets(root), /bytes changed or output collision/);
});

test('rejects truncated output', async (t) => {
  const { root } = await fixture(t);
  await writeFile(join(root, 'dist/assets/chunk-0.js'), 'export');
  await assert.rejects(verifyRetainedAssets(root), /size changed/);
});

test('rejects a truncated manifest', async (t) => {
  const { root, manifest, save } = await fixture(t);
  manifest.assets.pop();
  await save();
  await assert.rejects(verifyRetainedAssets(root), /nine-asset snapshot/);
});

test('rejects duplicate paths', async (t) => {
  const { root, manifest, save } = await fixture(t);
  manifest.assets[8].path = manifest.assets[7].path;
  await save();
  await assert.rejects(verifyRetainedAssets(root), /Duplicate retained asset path/);
});

test('rejects a dependency absent from the retained graph', async (t) => {
  const { root, manifest, save } = await fixture(t);
  manifest.assets[0].dependencies.push('assets/missing.js');
  await save();
  await assert.rejects(verifyRetainedAssets(root), /Unretained dependency/);
});
