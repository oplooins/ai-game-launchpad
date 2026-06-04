import type { Appearance, AvatarStyle, CharacterAppearance, EnemyBlueprint, GameBlueprint, GameType, HairStyle, ItemBlueprint, ItemType, MechanicId, ThemeId } from "./schema";

function textOf(value: unknown) {
  try { return JSON.stringify(value || {}).toLowerCase(); } catch { return String(value || "").toLowerCase(); }
}

function isObj(v: unknown): v is Record<string, unknown> { return typeof v === "object" && v !== null && !Array.isArray(v); }

function str(obj: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function color(value: unknown, fallback: string) {
  const v = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

function arr(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  return fallback;
}

function detectTheme(text: string): ThemeId {
  if (/volcano|lava|magma|fire|火山|岩浆|熔岩|火焰/.test(text)) return "volcano";
  if (/ice|frost|snow|冰|雪|霜/.test(text)) return "ice";
  if (/space|galaxy|star|ship|alien|太空|星际|飞船/.test(text)) return "space";
  if (/dungeon|castle|crypt|maze|地牢|城堡|地下|迷宫/.test(text)) return "dungeon";
  if (/forest|jungle|wood|森林|丛林/.test(text)) return "forest";
  if (/factory|robot|machine|工厂|机械/.test(text)) return "factory";
  if (/desert|sand|沙漠/.test(text)) return "desert";
  return "cyberpunk";
}

function detectGameType(text: string): GameType {
  if (/tower|defense|turret|塔防|防御/.test(text)) return "towerDefense";
  if (/card|deck|turn|卡牌|回合/.test(text)) return "cardBattle";
  if (/platform|jump|mario|平台|跳跃|横版/.test(text)) return "platformer";
  if (/runner|run|parkour|跑酷/.test(text)) return "endlessRunner";
  if (/space|ship|alien|太空|飞船|星际/.test(text)) return "spaceShooter";
  if (/dungeon|maze|rpg|地牢|迷宫|冒险/.test(text)) return "dungeonCrawler";
  return "arenaShooter";
}

function paletteFor(theme: ThemeId, obj: Record<string, unknown>) {
  const presets: Record<ThemeId, { primary: string; secondary: string; accent: string; danger: string; surface: string }> = {
    cyberpunk: { primary: "#22d3ee", secondary: "#a855f7", accent: "#f472b6", danger: "#fb7185", surface: "#0f172a" },
    dungeon: { primary: "#f59e0b", secondary: "#78350f", accent: "#fbbf24", danger: "#ef4444", surface: "#2a2118" },
    space: { primary: "#38bdf8", secondary: "#818cf8", accent: "#f472b6", danger: "#fb7185", surface: "#020617" },
    volcano: { primary: "#fb923c", secondary: "#ef4444", accent: "#facc15", danger: "#dc2626", surface: "#2b0b0b" },
    ice: { primary: "#38bdf8", secondary: "#dbeafe", accent: "#ffffff", danger: "#2563eb", surface: "#bfdbfe" },
    forest: { primary: "#22c55e", secondary: "#166534", accent: "#84cc16", danger: "#ef4444", surface: "#052e16" },
    factory: { primary: "#94a3b8", secondary: "#475569", accent: "#f97316", danger: "#ef4444", surface: "#111827" },
    desert: { primary: "#f59e0b", secondary: "#ca8a04", accent: "#fde68a", danger: "#dc2626", surface: "#422006" },
  };
  const base = presets[theme];
  return {
    primary: color(obj.primaryColor || obj.playerColor, base.primary),
    secondary: color(obj.secondaryColor, base.secondary),
    accent: color(obj.accentColor, base.accent),
    danger: base.danger,
    surface: base.surface,
  };
}

function detectAvatarStyle(text: string, explicit?: unknown): AvatarStyle {
  const v = String(explicit || "").toLowerCase();
  if (["chibi", "heroic", "mech", "creature", "sprite"].includes(v)) return v as AvatarStyle;
  if (/q版|q 版|chibi|cute|kawaii|可爱|大头|萌/.test(text)) return "chibi";
  if (/mech|robot|armor|机甲|机器人/.test(text)) return "mech";
  if (/monster|beast|creature|野兽|怪物/.test(text)) return "creature";
  return "chibi";
}

function detectHair(text: string): HairStyle {
  if (/helmet|头盔|盔甲/.test(text)) return "helmet";
  if (/hood|兜帽/.test(text)) return "hood";
  if (/twintail|双马尾/.test(text)) return "twinTails";
  if (/spiky|刺猬|尖发/.test(text)) return "spiky";
  if (/long hair|长发/.test(text)) return "long";
  if (/bob|短发|short hair/.test(text)) return "short";
  return "short";
}

function characterAppearance(obj: Record<string, unknown>, text: string, palette: ReturnType<typeof paletteFor>): CharacterAppearance {
  const ref = isObj(obj.referenceAppearance) ? obj.referenceAppearance : {};
  const char = isObj(obj.character) ? obj.character : {};
  const player = isObj(obj.player) ? obj.player : {};
  const src = { ...ref, ...char, ...player } as Record<string, unknown>;
  return {
    avatarStyle: detectAvatarStyle(text, src.avatarStyle),
    bodyType: ["small", "average", "tall", "heavy", "tiny"].includes(String(src.bodyType)) ? (src.bodyType as CharacterAppearance["bodyType"]) : "small",
    skinColor: color(src.skinColor, "#f5d0a9"),
    hairStyle: ["short", "bob", "long", "spiky", "twinTails", "hood", "helmet", "cap", "none"].includes(String(src.hairStyle)) ? (src.hairStyle as HairStyle) : detectHair(text),
    hairColor: color(src.hairColor, /pink|粉/.test(text) ? "#f472b6" : /blue|蓝/.test(text) ? "#38bdf8" : /white|silver|白|银/.test(text) ? "#e5e7eb" : "#111827"),
    eyeColor: color(src.eyeColor, palette.accent),
    outfitStyle: ["combat", "robe", "armor", "casual", "school", "spaceSuit", "ninja", "fantasy"].includes(String(src.outfitStyle)) ? (src.outfitStyle as CharacterAppearance["outfitStyle"]) : /space|太空/.test(text) ? "spaceSuit" : /ninja|忍者/.test(text) ? "ninja" : /magic|法师|魔法/.test(text) ? "robe" : "combat",
    outfitColor: color(src.outfitColor, palette.primary),
    accessory: ["visor", "glasses", "mask", "cape", "scarf", "headphones", "none"].includes(String(src.accessory)) ? (src.accessory as CharacterAppearance["accessory"]) : /visor|护目|赛博|cyber/.test(text) ? "visor" : "none",
    expression: ["neutral", "happy", "angry", "focused", "surprised"].includes(String(src.expression)) ? (src.expression as CharacterAppearance["expression"]) : /angry|愤怒|boss/.test(text) ? "angry" : "focused",
    referenceImageUrl: typeof src.referenceImageUrl === "string" ? src.referenceImageUrl : typeof obj.referenceImageUrl === "string" ? obj.referenceImageUrl : undefined,
    referenceSummary: typeof src.referenceSummary === "string" ? src.referenceSummary : undefined,
    spriteUrl: typeof src.spriteUrl === "string" ? src.spriteUrl : undefined,
    idleSpriteUrl: typeof src.idleSpriteUrl === "string" ? src.idleSpriteUrl : undefined,
    runSpriteUrl: typeof src.runSpriteUrl === "string" ? src.runSpriteUrl : undefined,
    attackSpriteUrl: typeof src.attackSpriteUrl === "string" ? src.attackSpriteUrl : undefined,
    dashSpriteUrl: typeof src.dashSpriteUrl === "string" ? src.dashSpriteUrl : undefined,
    hurtSpriteUrl: typeof src.hurtSpriteUrl === "string" ? src.hurtSpriteUrl : undefined,
    deathSpriteUrl: typeof src.deathSpriteUrl === "string" ? src.deathSpriteUrl : undefined,
    portraitUrl: typeof src.portraitUrl === "string" ? src.portraitUrl : undefined,
    spriteSheetUrl: typeof src.spriteSheetUrl === "string" ? src.spriteSheetUrl : undefined,
    spriteSheet: isObj(src.spriteSheet) ? src.spriteSheet as CharacterAppearance["spriteSheet"] : undefined,
    assetQuality: src.assetQuality === "image-model" || src.assetQuality === "uploaded" || src.assetQuality === "generated" || src.assetQuality === "procedural" ? src.assetQuality as CharacterAppearance["assetQuality"] : undefined,
    renderPolicy: src.renderPolicy === "strictSprite" || src.renderPolicy === "allowProceduralDraft" ? src.renderPolicy as CharacterAppearance["renderPolicy"] : undefined,
  };
}

function appearance(archetype: Appearance["archetype"], primary: string, secondary: string, accent: string, label?: string, character?: CharacterAppearance): Appearance {
  return {
    archetype,
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: accent,
    label,
    glow: true,
    weapon: archetype === "humanoid" ? "gun" : archetype === "robot" ? "cannon" : undefined,
    character,
  };
}

function mechanicsFor(type: GameType): MechanicId[] {
  if (type === "towerDefense") return ["score", "health", "waves", "towerDefense"];
  if (type === "cardBattle") return ["score", "health", "cardBattle"];
  if (type === "platformer") return ["movement", "platformer", "pickup", "score", "health"];
  if (type === "endlessRunner") return ["movement", "platformer", "pickup", "score", "timer", "health"];
  return ["movement", "shooting", "dash", "pickup", "score", "health", "waves", "bossFight"];
}

function normalizeTemplate(value: unknown, type: GameType) {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("space")) return "spaceShooter";
  if (raw.includes("runner")) return "endlessRunner";
  if (raw.includes("tower")) return "towerDefense";
  if (raw.includes("card")) return "cardBattle";
  if (raw.includes("platform")) return "platformer";
  if (raw.includes("dungeon")) return "dungeonCrawler";
  return type;
}

export function normalizeBlueprint(raw: unknown, titleFallback = "AI Generated Game"): GameBlueprint {
  const obj = isObj(raw) ? raw : {};
  const text = textOf(raw);
  const detectedType = detectGameType(`${text} ${String(obj.template || "")}`);
  const gameType = normalizeTemplate(obj.template, detectedType) as GameType;
  const theme = detectTheme(`${text} ${String(obj.theme || "")}`);
  const palette = paletteFor(theme, obj);
  const difficulty = obj.difficulty === "easy" || obj.difficulty === "hard" ? obj.difficulty : "medium";
  const enemiesText = arr(obj.enemies, [String(obj.enemyName || "Drone"), "Robot Guard", "Beast Raider"]);
  const itemText = arr(obj.items, ["Energy Core", "Health Pack", "Shield Pickup", "Speed Boost"]);
  const character = characterAppearance(obj, text, palette);

  const enemies: EnemyBlueprint[] = [
    { id: "drone", name: enemiesText[0] || "Drone", archetype: "drone", count: gameType === "spaceShooter" ? 7 : 4, hp: 30, speed: 145, attack: "shoot", appearance: appearance("drone", palette.danger, palette.surface, palette.accent, enemiesText[0]) },
    { id: "robot", name: enemiesText[1] || "Robot Guard", archetype: "robot", count: 3, hp: 70, speed: 80, attack: "burst", appearance: appearance("robot", "#94a3b8", palette.surface, palette.danger, enemiesText[1]) },
    { id: "beast", name: enemiesText[2] || "Beast Raider", archetype: "beast", count: 2, hp: 48, speed: 170, attack: "charge", appearance: appearance("beast", "#f97316", palette.surface, palette.accent, enemiesText[2]) },
  ];

  const itemTypes: ItemType[] = ["energyCore", "healthPack", "shield", "speedBoost"];
  const items: ItemBlueprint[] = itemText.slice(0, 6).map((label, index) => {
    const type = itemTypes[index % itemTypes.length];
    const c = type === "healthPack" ? "#22c55e" : type === "shield" ? "#38bdf8" : type === "speedBoost" ? "#facc15" : palette.accent;
    return { id: `${type}-${index}`, type, label, appearance: appearance(type === "shield" ? "hazard" : "bossCore", c, palette.surface, c, label) };
  });

  return {
    schemaVersion: "1.2",
    title: str(obj, ["title"], titleFallback),
    gameType,
    renderMode: obj.renderMode === "threejs" ? "threejs" : gameType === "spaceShooter" || gameType === "arenaShooter" ? "webglLite" : "canvas2d",
    theme,
    difficulty,
    objective: str(obj, ["objective", "goal"], "Survive enemy waves, collect items, and defeat the boss."),
    controls: ["Move: WASD / Arrow Keys", "Attack: Space / Click", "Dash: Shift"],
    mechanics: Array.isArray(obj.mechanics) ? (arr(obj.mechanics, mechanicsFor(gameType)) as MechanicId[]) : mechanicsFor(gameType),
    palette,
    level: {
      width: 1280,
      height: 720,
      lanes: gameType === "towerDefense" ? 3 : undefined,
      obstacles: Array.from({ length: gameType === "platformer" ? 7 : 8 }).map((_, i) => ({
        id: `obs-${i}`,
        x: 220 + ((i * 173) % 760),
        y: 170 + ((i * 97) % 420),
        w: gameType === "platformer" ? 120 : 72,
        h: gameType === "platformer" ? 18 : 28,
        kind: theme === "volcano" ? "lava" : theme === "ice" ? "ice" : theme === "dungeon" ? "pillar" : "wall",
      })),
    },
    player: {
      id: "player",
      name: str(obj, ["playerName", "heroName"], character.avatarStyle === "chibi" ? "Chibi Hero" : "Hero"),
      className: str(obj, ["playerClass", "className"], character.outfitStyle === "ninja" ? "Ninja" : "Adventurer"),
      appearance: appearance("humanoid", palette.primary, palette.secondary, palette.accent, "Player", character),
      hp: difficulty === "hard" ? 90 : 110,
      speed: difficulty === "hard" ? 250 : 225,
    },
    enemies,
    boss: {
      id: "boss",
      name: str(obj, ["bossName", "boss"], theme === "volcano" ? "Magma Tyrant" : theme === "ice" ? "Frost Monarch" : "Final Boss"),
      archetype: "bossCore",
      hp: difficulty === "hard" ? 560 : 420,
      phases: 3,
      attacks: ["beam", "spawn", "shockwave", "burst"],
      appearance: appearance("bossCore", palette.danger, palette.surface, palette.accent, "Boss"),
    },
    items,
  };
}
