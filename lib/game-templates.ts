export type GameTemplateId =
  | "webgl-arena"
  | "webgl-space"
  | "canvas-runner"
  | "canvas-dungeon"
  | "canvas-tower-defense"
  | "canvas-card-battle"
  | "canvas-platformer";

export type GeneratedGameConfig = {
  template: GameTemplateId;
  title: string;
  theme: string;
  objective: string;
  playerName: string;
  enemyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  difficulty: "easy" | "medium" | "hard";
  worldName: string;
  mechanics: string[];
};

export const GAME_TEMPLATES: Record<GameTemplateId, { label: string; mode: "webgl" | "canvas"; description: string }> = {
  "webgl-arena": {
    label: "WebGL Arena Fighter",
    mode: "webgl",
    description: "3D-styled arena combat with WebGL shader background, enemies, health bars, dash, and attack timing.",
  },
  "webgl-space": {
    label: "WebGL Space Shooter",
    mode: "webgl",
    description: "WebGL neon space shooter with star field, projectiles, waves, enemy drones, and score loop.",
  },
  "canvas-runner": {
    label: "Canvas Endless Runner",
    mode: "canvas",
    description: "Fast 2D runner with jump, slide, coins, obstacles, distance score, and escalating speed.",
  },
  "canvas-dungeon": {
    label: "Canvas Dungeon Crawler",
    mode: "canvas",
    description: "Top-down dungeon prototype with room movement, treasure, monsters, attacks, and health pickups.",
  },
  "canvas-tower-defense": {
    label: "Canvas Tower Defense",
    mode: "canvas",
    description: "Lane-defense prototype with waves, base health, turrets, enemies, and upgrade pacing.",
  },
  "canvas-card-battle": {
    label: "Canvas Card Battle",
    mode: "canvas",
    description: "Turn-based card battle prototype with attack cards, shields, enemy intent, and score loop.",
  },
  "canvas-platformer": {
    label: "Canvas Platformer",
    mode: "canvas",
    description: "Side-scrolling platform prototype with jumps, platforms, enemies, collectibles, and hazards.",
  },
};

export function safeTemplate(value: unknown): GameTemplateId {
  if (value === "webgl-arena" || value === "webgl-space" || value === "canvas-runner" || value === "canvas-dungeon" || value === "canvas-tower-defense" || value === "canvas-card-battle" || value === "canvas-platformer") {
    return value;
  }
  return "webgl-arena";
}

export function configFromJson(value: unknown): GeneratedGameConfig {
  const obj = typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const template = safeTemplate(obj.template);
  const difficulty = obj.difficulty === "easy" || obj.difficulty === "medium" || obj.difficulty === "hard" ? obj.difficulty : "medium";
  const mechanics = Array.isArray(obj.mechanics) ? obj.mechanics.map(String).filter(Boolean).slice(0, 6) : [];

  return {
    template,
    title: String(obj.title || GAME_TEMPLATES[template].label),
    theme: String(obj.theme || "neon fantasy prototype"),
    objective: String(obj.objective || "Survive, score points, and defeat the enemy wave."),
    playerName: String(obj.playerName || "Hero"),
    enemyName: String(obj.enemyName || "Rival"),
    primaryColor: String(obj.primaryColor || "#22d3ee"),
    secondaryColor: String(obj.secondaryColor || "#a78bfa"),
    accentColor: String(obj.accentColor || "#f97316"),
    difficulty,
    worldName: String(obj.worldName || "Prototype Arena"),
    mechanics: mechanics.length ? mechanics : ["Move", "Attack", "Score", "Survive"],
  };
}

export function chooseTemplate(idea: string): GameTemplateId {
  const text = idea.toLowerCase();
  if (/(space|ship|shooter|bullet|laser|alien|星|飞船|射击)/i.test(text)) return "webgl-space";
  if (/(runner|run|jump|parkour|obstacle|跑酷|跳跃|障碍)/i.test(text)) return "canvas-runner";
  if (/(tower|defense|turret|防御|炮塔|塔防)/i.test(text)) return "canvas-tower-defense";
  if (/(card|deck|turn|牌|卡牌|回合)/i.test(text)) return "canvas-card-battle";
  if (/(platform|platformer|mario|jump|平台|横版)/i.test(text)) return "canvas-platformer";
  if (/(dungeon|maze|rpg|crawler|treasure|地牢|迷宫|冒险|宝藏)/i.test(text)) return "canvas-dungeon";
  if (/(fight|fighter|combat|battle|arena|boss|格斗|战斗|双人|单人)/i.test(text)) return "webgl-arena";
  return "webgl-arena";
}

export function fallbackGameConfig(idea: string, title?: string): GeneratedGameConfig {
  const template = chooseTemplate(idea);
  const text = idea.toLowerCase();
  const isHard = /(hard|boss|survive|困难|高难|boss)/i.test(text);
  const isEasy = /(easy|casual|simple|轻松|简单)/i.test(text);
  const difficulty: GeneratedGameConfig["difficulty"] = isHard ? "hard" : isEasy ? "easy" : "medium";

  return {
    template,
    title: title || GAME_TEMPLATES[template].label,
    theme: text.includes("cyber") || text.includes("neon") || text.includes("赛博") ? "cyber neon" : text.includes("fantasy") || text.includes("冒险") ? "fantasy adventure" : "arcade prototype",
    objective:
      template === "webgl-space"
        ? "Pilot through enemy waves, fire energy shots, and survive as long as possible."
        : template === "canvas-runner"
          ? "Run forward, dodge hazards, collect coins, and keep your combo alive."
          : template === "canvas-dungeon"
            ? "Explore rooms, collect treasure, defeat monsters, and survive the dungeon."
            : template === "canvas-tower-defense"
              ? "Defend the base, place tactical pressure, and survive enemy waves."
              : template === "canvas-card-battle"
                ? "Play attack and shield turns, defeat the rival, and manage resources."
                : template === "canvas-platformer"
                  ? "Jump across platforms, collect items, avoid hazards, and reach the goal."
                  : "Defeat enemies in the arena, manage health, and chain attacks for a higher score.",
    playerName: template === "webgl-space" ? "Star Pilot" : template === "canvas-runner" ? "Runner" : template === "canvas-card-battle" ? "Card Hero" : "Hero",
    enemyName: template === "webgl-space" ? "Drone Swarm" : template === "canvas-runner" ? "Hazards" : template === "canvas-dungeon" ? "Dungeon Beasts" : template === "canvas-tower-defense" ? "Wave Raiders" : template === "canvas-card-battle" ? "Rival Deck" : template === "canvas-platformer" ? "Platform Guards" : "Shadow Fighter",
    primaryColor: template.includes("webgl") ? "#22d3ee" : "#34d399",
    secondaryColor: template === "webgl-space" ? "#818cf8" : "#a78bfa",
    accentColor: template === "canvas-runner" ? "#facc15" : "#fb7185",
    difficulty,
    worldName: template === "webgl-space" ? "Nebula Gate" : template === "canvas-runner" ? "Velocity Road" : template === "canvas-dungeon" ? "Crystal Dungeon" : template === "canvas-tower-defense" ? "Defense Grid" : template === "canvas-card-battle" ? "Card Arena" : template === "canvas-platformer" ? "Sky Platforms" : "Duel Arena",
    mechanics:
      template === "webgl-space"
        ? ["Arrow keys move", "Space fires", "Enemy waves", "Score multiplier"]
        : template === "canvas-runner"
          ? ["Jump", "Slide", "Collect coins", "Avoid obstacles"]
          : template === "canvas-dungeon"
            ? ["WASD movement", "Attack nearby enemies", "Collect treasure", "Health pickups"]
            : template === "canvas-tower-defense"
              ? ["Defend base", "Enemy waves", "Turret pressure", "Score rewards"]
              : template === "canvas-card-battle"
                ? ["Attack card", "Shield turn", "Enemy intent", "Resource loop"]
                : template === "canvas-platformer"
                  ? ["Move", "Jump", "Collect items", "Avoid hazards"]
                  : ["Move", "Attack", "Dash", "Defeat enemy waves"],
  };
}
