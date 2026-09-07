import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function verifyRetainedAssets(root = projectRoot) {
  const manifest = JSON.parse(await readFile(resolve(root, 'scripts/retained-assets.json'), 'utf8'));
  assert.equal(manifest.schemaVersion, 1, 'Unsupported retained asset manifest');
  assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/, 'Missing source provenance');
  // This reviewed snapshot has five retained files and four unchanged shared files.
  assert.equal(manifest.assets.length, 9, 'The complete nine-asset snapshot is required');
  assert.equal(manifest.assets.filter((asset) => asset.retained === true).length, 5,
    'The five retained files are required');
  const paths = new Set(manifest.assets.map((asset) => asset.path));
  assert.equal(paths.size, manifest.assets.length, 'Duplicate retained asset path');

  for (const asset of manifest.assets) {
    assert.match(asset.path, /^assets\/[A-Za-z0-9_-]+\.(?:js|css|jpg)$/, 'Invalid asset path');
    assert.match(asset.sha256, /^[a-f0-9]{64}$/, 'Invalid asset digest');
    assert.ok(Number.isSafeInteger(asset.bytes) && asset.bytes > 0, 'Invalid asset size');
    assert.equal(typeof asset.retained, 'boolean', 'Invalid retention marker');
    assert.ok(Array.isArray(asset.dependencies), 'Missing dependency list');
    assert.equal(new Set(asset.dependencies).size, asset.dependencies.length, 'Duplicate dependency');
    for (const dependency of asset.dependencies) {
      assert.ok(paths.has(dependency), `Unretained dependency: ${dependency}`);
    }
  }

  async function verifyFile(directory, asset) {
    const file = resolve(root, directory, asset.path);
    assert.ok((await lstat(file)).isFile(), `Asset must be a regular file: ${asset.path}`);
    const bytes = await readFile(file);
    assert.equal(bytes.length, asset.bytes, `Asset size changed: ${asset.path}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256,
      `Asset bytes changed or output collision: ${asset.path}`);
  }

  for (const asset of manifest.assets) {
    if (asset.retained) await verifyFile('public', asset);
    await verifyFile('dist', asset);
  }
  return { assets: manifest.assets.length, retained: 5 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await verifyRetainedAssets();
  console.log(`Verified ${result.assets} compatibility assets, including ${result.retained} retained files.`);
}
