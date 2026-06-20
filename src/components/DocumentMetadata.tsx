import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl, getRouteMetadata, SITE_ORIGIN } from '../utils/siteMetadata';

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }

  element.href = href;
}

export function DocumentMetadata() {
  const location = useLocation();

  useEffect(() => {
    const metadata = getRouteMetadata(location.pathname);
    const canonicalUrl = getCanonicalUrl(metadata.path);

    document.title = metadata.title;
    upsertCanonical(canonicalUrl);
    upsertMeta('meta[name="description"]', { name: 'description', content: metadata.description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: metadata.title });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: metadata.description,
    });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: metadata.title });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: metadata.description,
    });

    const structuredData = document.querySelector<HTMLScriptElement>('script[data-site-schema="route"]');
    if (structuredData) {
      structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: metadata.title,
        url: canonicalUrl,
        description: metadata.description,
        isPartOf: {
          '@type': 'WebSite',
          name: 'AI Atlas by Turtleand',
          url: SITE_ORIGIN,
        },
      });
    }
  }, [location.pathname]);

  return null;
}
