import type { Tool } from "../../utils/parseTools";

const catalogNotes: Readonly<Record<string, string>> = {
  chatgpt: "Brainstorming and first drafts.",
  claude: "Thinking through complex questions.",
  grok: "Comparing chatbot responses.",
  gemini: "Quick searches and prompts with images.",
  sesame: "Trying voice-first conversations.",
  "nano-banana": "Iterating on Turtleand’s avatar.",
  "chatgpt-image": "Refining avatar concepts in conversation.",
  recraft: "Creating and refining the Turtleand logo.",
  "adobe-express": "Removing backgrounds from avatar assets.",
  "gemini-drawing": "Turning rough sketches into illustrations.",
  sora: "Exploring clips for the Turtleand channel.",
  "veo-3": "Creating clips for the Turtleand channel.",
  "hailuo-minimax": "Trying different video styles.",
  "github-copilot": "Pair programming and reviewing changes.",
  "claude-code": "Debugging and refactoring in the terminal.",
  cursor: "Exploring code in an AI-assisted editor.",
  "sourcegraph-deepsearch": "Finding patterns in large codebases.",
  "sourcegraph-amp": "Exploring agent-assisted coding workflows.",
  "openai-codex": "Exploring coding workflows with an agent.",
  "chatgpt-deep-search": "Researching topics with cited sources.",
  "perplexity-comet": "Exploring AI-assisted browsing.",
  notebooklm: "Turning documents into study material.",
  gamma: "Shaping ideas into a presentation.",
  "llama-cpp": "Running model inference locally.",
  "hugging-face": "Finding and trying models.",
  "google-ai-studio": "Experimenting with Gemini models.",
  "hermes-agent": "Working with a persistent assistant.",
  openclaw: "Historical entry from the Atlas.",
  ntfy: "Receiving workflow notifications.",
};

export function toolNote(tool: Tool) {
  return catalogNotes[tool.id] ?? tool.description;
}
