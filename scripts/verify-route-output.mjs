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

for (const [route, entry] of Object.entries(routeMetadata)) {
  const metadata = typeof entry === 'string' ? routeMetadata[entry] : entry;
  if (!metadata || typeof metadata !== 'object') {
    throw new Error(`Invalid metadata for ${route}`);
  }
  const outputPath = route === '/'
    ? resolve('dist/index.html')
    : resolve('dist', route.slice(1), 'index.html');
  const html = await readFile(outputPath, 'utf8');
  const expected = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `content="${escapeHtml(metadata.description)}"`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" />`,
    `property="og:url" content="${metadata.canonical}"`,
    `<h1>${escapeHtml(metadata.heading)}</h1>`,
    '<a href="/islands/">AI tool map</a>',
    '<a href="/tsunami/">AI Tsunami Tracker</a>',
  ];

  for (const marker of expected) {
    if (!html.includes(marker)) {
      throw new Error(`${outputPath} is missing ${marker}`);
    }
  }
  if (html.match(/<link\b[^>]*\brel="canonical"/g)?.length !== 1) {
    throw new Error(`${outputPath} must contain one canonical link`);
  }
}

const notFound = await readFile(resolve('dist/404.html'), 'utf8');
if (!notFound.includes('content="noindex,follow"')) {
  throw new Error('dist/404.html must be noindex');
}

const redirects = await readFile(resolve('dist/_redirects'), 'utf8');
const landingRoute = routeMetadata['/'];
if (typeof landingRoute === 'string') {
  const landingPath = new URL(routeMetadata[landingRoute].canonical).pathname;
  const rootRule = redirects.split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .find(([from]) => from === '/' || from === '/*');
  if (rootRule?.join(' ') !== `/ ${landingPath} 302!`) {
    throw new Error(`dist/_redirects must force a temporary root redirect to ${landingPath}`);
  }
}
if (redirects.includes('/*    /index.html   200') || !redirects.includes('/* /404.html 404')) {
  throw new Error('dist/_redirects must use the real 404 fallback');
}

process.stdout.write(`Verified ${Object.keys(routeMetadata).length} route shells and the 404 fallback.\n`);
