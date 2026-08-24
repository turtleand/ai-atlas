import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routeMetadataData from '../routeMetadata.json';

interface RouteMetadataEntry {
  title: string;
  description: string;
  canonical: string;
  heading: string;
  summary: string;
  schemaType: string;
}

const routeMetadata = routeMetadataData as Record<string, RouteMetadataEntry>;
const socialImage = 'https://atlas.turtleand.com/social-card.png';

function normalizePathname(pathname: string) {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '');
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function updateCanonical(canonical: string | null) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    existing?.remove();
    return;
  }

  const element = existing ?? document.createElement('link');
  element.rel = 'canonical';
  element.href = canonical;
  if (!existing) document.head.append(element);
}

function updateStructuredData(metadata: RouteMetadataEntry | null) {
  let script = document.getElementById('route-json-ld') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'route-json-ld';
    script.type = 'application/ld+json';
    document.head.append(script);
  }

  script.textContent = JSON.stringify(metadata ? {
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
  } : {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Page Not Found',
  });
}

export function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = routeMetadata[normalizePathname(pathname)] ?? null;
    const title = metadata?.title ?? 'Page Not Found | Turtleand AI Atlas';
    const description = metadata?.description ?? 'The requested AI Atlas page could not be found.';
    const canonical = metadata?.canonical ?? null;
    const url = canonical ?? window.location.href;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', metadata ? 'index,follow,max-image-preview:large' : 'noindex,follow');
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', 'Turtleand AI Atlas');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', socialImage);
    upsertMeta('property', 'og:image:alt', metadata?.heading ?? 'Turtleand AI Atlas');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', socialImage);
    upsertMeta('name', 'twitter:image:alt', metadata?.heading ?? 'Turtleand AI Atlas');
    updateCanonical(canonical);
    updateStructuredData(metadata);
  }, [pathname]);

  return null;
}
