export const SITE_ORIGIN = 'https://atlas.turtleand.com';

export interface RouteMetadata {
  title: string;
  description: string;
  path: string;
}

export const routeMetadata: Record<string, RouteMetadata> = {
  '/': {
    path: '/',
    title: 'AI Atlas by Turtleand',
    description:
      'AI Atlas by Turtleand maps AI tools, use cases, trade-offs, source confidence, and human-centered evaluation for learning, building, research, and automation.',
  },
  '/tsunami': {
    path: '/tsunami',
    title: 'AI Tsunami Simulator by Turtleand',
    description:
      'An interactive Turtleand simulator for exploring how AI capability waves may affect roles, skills, and human adaptation.',
  },
  '/ai-impact-map': {
    path: '/ai-impact-map',
    title: 'AI Impact Map by Turtleand',
    description:
      'A Turtleand signal map for understanding which tasks and roles are most exposed to AI automation, augmentation, and adaptation pressure.',
  },
};

export function getRouteMetadata(pathname: string): RouteMetadata {
  return routeMetadata[pathname] ?? routeMetadata['/'];
}

export function getCanonicalUrl(path: string): string {
  return `${SITE_ORIGIN}${path === '/' ? '/' : path}`;
}
