import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const routeMetadata = JSON.parse(await readFile(resolve('src/routeMetadata.json'), 'utf8'));

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

for (const [route, metadata] of Object.entries(routeMetadata)) {
  const outputPath = route === '/'
    ? resolve('dist/index.html')
    : resolve('dist', route.slice(1), 'index.html');
  const html = await readFile(outputPath, 'utf8');
  const expected = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `content="${escapeHtml(metadata.description)}"`,
    `href="${metadata.canonical}"`,
    `property="og:url" content="${metadata.canonical}"`,
    `<h1>${escapeHtml(metadata.heading)}</h1>`,
  ];

  for (const marker of expected) {
    if (!html.includes(marker)) {
      throw new Error(`${outputPath} is missing ${marker}`);
    }
  }
}

const notFound = await readFile(resolve('dist/404.html'), 'utf8');
if (!notFound.includes('content="noindex,follow"')) {
  throw new Error('dist/404.html must be noindex');
}

const redirects = await readFile(resolve('dist/_redirects'), 'utf8');
if (redirects.includes('/*    /index.html   200') || !redirects.includes('/* /404.html 404')) {
  throw new Error('dist/_redirects must use the real 404 fallback');
}

process.stdout.write(`Verified ${Object.keys(routeMetadata).length} route shells and the 404 fallback.\n`);
