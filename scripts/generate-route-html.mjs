import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = resolve(projectRoot, 'dist');
const metadataPath = resolve(projectRoot, 'src/routeMetadata.json');
const templatePath = resolve(distRoot, 'index.html');
const routeMetadata = JSON.parse(await readFile(metadataPath, 'utf8'));
const template = await readFile(templatePath, 'utf8');
const socialImage = 'https://atlas.turtleand.com/social-card.png';

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function structuredData(metadata) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': metadata.schemaType,
    name: metadata.heading,
    description: metadata.description,
    url: metadata.canonical,
    publisher: {
      '@type': 'Person',
      name: 'Turtleand',
      url: 'https://turtleand.com',
    },
  }).replaceAll('<', '\\u003c');
}

function metadataBlock(metadata) {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const canonical = escapeHtml(metadata.canonical);
  const imageAlt = escapeHtml(metadata.heading);

  return `<!-- route-meta:start -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Turtleand AI Atlas" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${socialImage}" />
    <meta property="og:image:alt" content="${imageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${socialImage}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />
    <script id="route-json-ld" type="application/ld+json">${structuredData(metadata)}</script>
    <!-- route-meta:end -->`;
}

function fallbackBlock(metadata) {
  return `<!-- route-fallback:start -->
      <main>
        <h1>${escapeHtml(metadata.heading)}</h1>
        <p>${escapeHtml(metadata.summary)}</p>
        <nav aria-label="AI Atlas entry points">
          <a href="/">AI tool map</a>
          <a href="/ai-impact-map">AI Impact Map</a>
          <a href="/tsunami">AI Tsunami Tracker</a>
          <a href="/productivity-loop">The Turtleand Loop</a>
          <a href="/llms.txt">AI-readable index</a>
        </nav>
      </main>
      <!-- route-fallback:end -->`;
}

function renderRoute(metadata) {
  const withMetadata = template.replace(
    /<!-- route-meta:start -->[\s\S]*?<!-- route-meta:end -->/,
    metadataBlock(metadata),
  );
  return withMetadata.replace(
    /<!-- route-fallback:start -->[\s\S]*?<!-- route-fallback:end -->/,
    fallbackBlock(metadata),
  );
}

for (const [route, metadata] of Object.entries(routeMetadata)) {
  const outputPath = route === '/'
    ? templatePath
    : resolve(distRoot, route.slice(1), 'index.html');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderRoute(metadata));
}
