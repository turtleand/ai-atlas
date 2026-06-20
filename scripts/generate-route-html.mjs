import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const distDir = new URL('../dist/', import.meta.url);

const routes = [
  {
    path: '/tsunami',
    title: 'AI Tsunami Simulator by Turtleand',
    description:
      'An interactive Turtleand simulator for exploring how AI capability waves may affect roles, skills, and human adaptation.',
    heading: 'AI Tsunami Simulator by Turtleand',
    summary:
      'Explore how AI capability waves may affect roles, skills, and human adaptation across changing technology conditions.',
  },
  {
    path: '/ai-impact-map',
    title: 'AI Impact Map by Turtleand',
    description:
      'A Turtleand signal map for understanding which tasks and roles are most exposed to AI automation, augmentation, and adaptation pressure.',
    heading: 'AI Impact Map by Turtleand',
    summary:
      'Map task and role exposure to AI automation, augmentation, and adaptation pressure with a conservative Turtleand signal lens.',
  },
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function replaceMeta(html, selector, content) {
  const escaped = escapeHtml(content);
  if (selector.startsWith('name:')) {
    const name = selector.slice(5);
    return html.replace(
      new RegExp(`<meta name="${name}" content="[^"]*" \\/>`),
      `<meta name="${name}" content="${escaped}" />`,
    );
  }

  const property = selector.slice(9);
  return html.replace(
    new RegExp(`<meta property="${property}" content="[^"]*" \\/>`),
    `<meta property="${property}" content="${escaped}" />`,
  );
}

function routeHtml(baseHtml, route) {
  const canonical = `https://atlas.turtleand.com${route.path}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: route.title,
    url: canonical,
    description: route.description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'AI Atlas by Turtleand',
      url: 'https://atlas.turtleand.com/',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Turtleand',
      url: 'https://turtleand.com/',
    },
  };

  let html = baseHtml
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<h1>.*?<\/h1>/, `<h1>${escapeHtml(route.heading)}</h1>`)
    .replace(
      /<p>\s*AI Atlas is Turtleand's tool cartography[\s\S]*?clearer judgment\.\s*<\/p>/,
      `<p>${escapeHtml(route.summary)}</p>`,
    )
    .replace(
      /<script type="application\/ld\+json" data-site-schema="route">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" data-site-schema="route">${escapeJsonForHtml(schema)}</script>`,
    );

  html = replaceMeta(html, 'name:description', route.description);
  html = replaceMeta(html, 'property:og:url', canonical);
  html = replaceMeta(html, 'property:og:title', route.title);
  html = replaceMeta(html, 'property:og:description', route.description);
  html = replaceMeta(html, 'name:twitter:title', route.title);
  html = replaceMeta(html, 'name:twitter:description', route.description);

  return html;
}

const baseHtml = await readFile(new URL('index.html', distDir), 'utf8');

for (const route of routes) {
  const outputPath = join(distDir.pathname, route.path, 'index.html');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, routeHtml(baseHtml, route));
}
