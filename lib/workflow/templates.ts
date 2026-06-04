export type WorkflowNode = {
  id: string;
  label: string;
  type: string;
  description: string;
  params?: Record<string, string | number | boolean>;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
};

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "quick-game-prototype",
    name: "Quick Game Prototype",
    description: "Turn one idea into launch copy, a playable game config, and a publishable game page.",
    nodes: [
      { id: "prompt", type: "input", label: "Prompt Input", description: "Capture the creator's game idea." },
      { id: "world", type: "ai", label: "AI World Builder", description: "Generate theme, mood, objective, enemies, items, and boss concept." },
      { id: "template", type: "logic", label: "Template Selector", description: "Choose Canvas/WebGL runtime based on genre and complexity." },
      { id: "config", type: "ai", label: "Game Config Generator", description: "Create structured runtime config for the playable prototype." },
      { id: "launch", type: "ai", label: "Launch Page Generator", description: "Generate title, description, tags, SEO, AI score, and publish pack." },
      { id: "publish", type: "output", label: "Publish Game", description: "Create a pending game ready for review and sharing." },
    ],
  },
  {
    id: "sandbox-adventure",
    name: "Sandbox Adventure",
    description: "Generate a configurable world with quests, enemies, items, and AI-editable objectives.",
    nodes: [
      { id: "prompt", type: "input", label: "World Prompt", description: "Describe the world, player fantasy, and target gameplay." },
      { id: "world", type: "ai", label: "World Generator", description: "Build theme, biome, factions, hazards, quests, and tone." },
      { id: "entities", type: "ai", label: "Enemies / Items / Boss", description: "Generate enemy roster, pickups, boss behavior, and rewards." },
      { id: "rules", type: "logic", label: "Rules Builder", description: "Create score, health, collision, enemy wave, and victory rules." },
      { id: "renderer", type: "runtime", label: "Playable Renderer", description: "Render the sandbox with the Canvas/WebGL runtime." },
      { id: "versions", type: "output", label: "Version Snapshot", description: "Save the first editable version for future AI changes." },
    ],
  },
  {
    id: "boss-fight-generator",
    name: "Boss Fight Generator",
    description: "Create an arena battle with a themed boss, enemy waves, scoring, and shareable launch page.",
    nodes: [
      { id: "prompt", type: "input", label: "Boss Prompt", description: "Describe the boss, arena, attacks, and player fantasy." },
      { id: "boss", type: "ai", label: "Boss Designer", description: "Generate boss name, mechanics, phases, and counterplay." },
      { id: "arena", type: "logic", label: "Arena Rules", description: "Build player attacks, hazards, boss waves, score, and survival goal." },
      { id: "renderer", type: "runtime", label: "WebGL Arena Renderer", description: "Use the arena runtime with neon depth effects." },
      { id: "launch", type: "ai", label: "Launch Copy", description: "Generate store copy and share text." },
    ],
  },
  {
    id: "tower-defense-builder",
    name: "Tower Defense Builder",
    description: "Create a tower defense prototype with enemy lanes, waves, towers, upgrades, and score.",
    nodes: [
      { id: "prompt", type: "input", label: "Defense Theme", description: "Describe what players defend and what enemies attack." },
      { id: "lanes", type: "logic", label: "Lane Generator", description: "Create path layout, wave count, and pacing." },
      { id: "towers", type: "ai", label: "Tower / Enemy Generator", description: "Generate tower types, enemy types, upgrades, and boss wave." },
      { id: "renderer", type: "runtime", label: "Canvas Tower Defense", description: "Render playable tower defense runtime." },
      { id: "publish", type: "output", label: "Publish & Share", description: "Create a launch page, embed code, and feedback loop." },
    ],
  },
  {
    id: "launch-page-only",
    name: "Launch Page Only",
    description: "Use an existing game URL and generate a polished launch page, SEO pack, and share kit.",
    nodes: [
      { id: "url", type: "input", label: "Existing Play URL", description: "Use a hosted HTML5/WebGL game URL." },
      { id: "copy", type: "ai", label: "Store Copy Generator", description: "Generate title, tags, description, and SEO metadata." },
      { id: "quality", type: "ai", label: "AI Quality Score", description: "Score the page and suggest improvements." },
      { id: "share", type: "output", label: "Share Pack", description: "Generate Reddit, X, Product Hunt, and embed copy." },
    ],
  },
];

export function getWorkflowTemplate(id: string) {
  return workflowTemplates.find((template) => template.id === id) || workflowTemplates[0];
}

export function createWorkflowNodes(templateId: string, prompt: string) {
  const template = getWorkflowTemplate(templateId);
  return template.nodes.map((node, index) => ({
    ...node,
    status: "ready",
    order: index + 1,
    output: index === 0 ? prompt : "",
  }));
}
