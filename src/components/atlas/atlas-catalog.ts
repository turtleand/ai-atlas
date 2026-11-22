import { getToolStatus, type Category, type Tool } from "../../utils/parseTools";
import { createScene } from "./atlas-model";

const collectionStatuses = ["active", "experimental", "archive"] as const;
type CollectionStatus = (typeof collectionStatuses)[number];

export function createAtlasCatalog(categories: readonly Category[]) {
  const collection: Record<CollectionStatus, Category[]> = {
    active: [],
    experimental: [],
    archive: [],
  };
  const charted: Category[] = [];
  const experimentalFallback = new Set<string>();

  for (const category of categories) {
    const tools: Record<CollectionStatus, Tool[]> = {
      active: [],
      experimental: [],
      archive: [],
    };
    for (const tool of category.tools) {
      const status = getToolStatus(tool);
      if (status !== "pending") tools[status].push(tool);
    }
    for (const status of collectionStatuses) {
      if (tools[status].length) {
        collection[status].push({ ...category, tools: tools[status] });
      }
    }
    if (tools.active.length) {
      charted.push({ ...category, tools: tools.active });
    } else if (tools.experimental.length) {
      charted.push({ ...category, tools: tools.experimental });
      experimentalFallback.add(category.id);
    }
  }

  return { scene: createScene(charted), collection, experimentalFallback };
}
