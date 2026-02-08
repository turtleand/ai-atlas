import YAML from 'yaml';

export interface RelatedLink {
  title: string;
  url: string;
}

export interface Tool {
  id: string;
  name: string;
  url: string;
  description: string;
  usage?: string;
  related?: RelatedLink[];
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  tools: Tool[];
}

interface YAMLTool {
  name: string;
  url: string;
  description: string;
  usage?: string;
  related?: RelatedLink[];
  tags?: string[];
}

interface YAMLCategory {
  name: string;
  tools: YAMLTool[];
}

interface YAMLData {
  categories: YAMLCategory[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function parseToolsYaml(yamlContent: string): Category[] {
  const data: YAMLData = YAML.parse(yamlContent);
  
  return data.categories.map(cat => ({
    id: slugify(cat.name),
    name: cat.name,
    tools: cat.tools.map(tool => ({
      id: slugify(tool.name),
      name: tool.name,
      url: tool.url,
      description: tool.description,
      usage: tool.usage?.trim(),
      related: tool.related,
      tags: tool.tags,
    })),
  })).filter(c => c.tools.length > 0);
}

// Keep legacy parser for backwards compatibility
export function parseToolsMarkdown(markdown: string): Category[] {
  const categories: Category[] = [];
  let currentCategory: Category | null = null;

  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

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

  return categories.filter(c => c.tools.length > 0);
}
