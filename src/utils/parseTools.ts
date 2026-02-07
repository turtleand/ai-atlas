export interface Tool {
  id: string;
  name: string;
  url: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  tools: Tool[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function parseToolsMarkdown(markdown: string): Category[] {
  const categories: Category[] = [];
  let currentCategory: Category | null = null;

  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Category heading
    const headingMatch = trimmed.match(/^##\s+(.+)$/);
    if (headingMatch) {
      currentCategory = {
        id: slugify(headingMatch[1]),
        name: headingMatch[1],
        tools: [],
      };
      categories.push(currentCategory);
      continue;
    }

    // Tool line
    const toolMatch = trimmed.match(/^-\s+(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
    if (toolMatch && currentCategory) {
      currentCategory.tools.push({
        id: slugify(toolMatch[1]),
        name: toolMatch[1],
        url: toolMatch[2].trim(),
        description: toolMatch[3].trim(),
      });
    }
  }

  // Filter out empty categories
  return categories.filter(c => c.tools.length > 0);
}
