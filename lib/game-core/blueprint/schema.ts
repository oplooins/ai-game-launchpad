export type GameType =
  | "arenaShooter"
  | "spaceShooter"
  | "dungeonCrawler"
  | "endlessRunner"
  | "towerDefense"
  | "cardBattle"
  | "platformer";

export type RenderMode = "canvas2d" | "webglLite" | "threejs";
export type ThemeId = "cyberpunk" | "dungeon" | "space" | "volcano" | "ice" | "forest" | "factory" | "desert";
export type Difficulty = "easy" | "medium" | "hard";
export type AvatarStyle = "chibi" | "heroic" | "mech" | "creature" | "sprite";
export type BodyType = "small" | "average" | "tall" | "heavy" | "tiny";
export type HairStyle = "short" | "bob" | "long" | "spiky" | "twinTails" | "hood" | "helmet" | "cap" | "none";
export type FaceExpression = "neutral" | "happy" | "angry" | "focused" | "surprised";

export type EntityArchetype =
  | "humanoid"
  | "drone"
  | "robot"
  | "beast"
  | "bossCore"
  | "tower"
  | "card"
  | "platform"
  | "hazard";

export type MechanicId =
  | "movement"
  | "shooting"
  | "melee"
  | "dash"
  | "pickup"
  | "health"
  | "score"
  | "waves"
  | "bossFight"
  | "towerDefense"
  | "platformer"
  | "cardBattle"
  | "timer";

export type ItemType = "energyCore" | "healthPack" | "shield" | "speedBoost" | "coin" | "key";

export type CharacterAppearance = {
  avatarStyle: AvatarStyle;
  bodyType: BodyType;
  skinColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeColor: string;
  outfitStyle: "combat" | "robe" | "armor" | "casual" | "school" | "spaceSuit" | "ninja" | "fantasy";
  outfitColor: string;
  accessory?: "visor" | "glasses" | "mask" | "cape" | "scarf" | "headphones" | "none";
  expression: FaceExpression;
  referenceImageUrl?: string;
  referenceSummary?: string;
  spriteUrl?: string;
  idleSpriteUrl?: string;
  runSpriteUrl?: string;
  attackSpriteUrl?: string;
  dashSpriteUrl?: string;
  hurtSpriteUrl?: string;
  deathSpriteUrl?: string;
  portraitUrl?: string;
  spriteSheetUrl?: string;
  spriteSheet?: {
    frameWidth: number;
    frameHeight: number;
    animations: Record<string, { row: number; frames: number; fps: number }>;
  };
  assetQuality?: "procedural" | "generated" | "uploaded" | "image-model";
  renderPolicy?: "strictSprite" | "allowProceduralDraft";
};

export type Appearance = {
  archetype: EntityArchetype;
  label?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  weapon?: "gun" | "blade" | "staff" | "claw" | "cannon";
  spriteUrl?: string;
  portraitUrl?: string;
  glow?: boolean;
  character?: CharacterAppearance;
};

export type PlayerBlueprint = {
  id: string;
  name: string;
  className: string;
  appearance: Appearance;
  hp: number;
  speed: number;
};

export type EnemyBlueprint = {
  id: string;
  name: string;
  archetype: "drone" | "robot" | "beast";
  count: number;
  hp: number;
  speed: number;
  attack: "shoot" | "charge" | "burst" | "contact";
  appearance: Appearance;
};

export type BossBlueprint = {
  id: string;
  name: string;
  archetype: "bossCore" | "robot" | "beast";
  hp: number;
  phases: number;
  attacks: ("beam" | "spawn" | "shockwave" | "missile" | "burst")[];
  appearance: Appearance;
};

export type ItemBlueprint = {
  id: string;
  type: ItemType;
  label: string;
  appearance: Appearance;
};

export type LevelBlueprint = {
  width: number;
  height: number;
  lanes?: number;
  obstacles: { id: string; x: number; y: number; w: number; h: number; kind: "wall" | "pillar" | "crystal" | "lava" | "ice" | "platform" }[];
};

export type GameBlueprint = {
  schemaVersion: "1.2";
  title: string;
  gameType: GameType;
  renderMode: RenderMode;
  theme: ThemeId;
  difficulty: Difficulty;
  objective: string;
  controls: string[];
  mechanics: MechanicId[];
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    surface: string;
  };
  level: LevelBlueprint;
  player: PlayerBlueprint;
  enemies: EnemyBlueprint[];
  boss?: BossBlueprint;
  items: ItemBlueprint[];
};
