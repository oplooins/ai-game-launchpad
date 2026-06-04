import type { EnemyBlueprint, GameBlueprint, ItemBlueprint } from "../blueprint/schema";

export type Actor = {
  id: string;
  kind: "player" | "enemy" | "boss" | "pickup" | "projectile" | "tower" | "card" | "platform";
  archetype: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  vx: number;
  vy: number;
  alive: boolean;
  cooldown: number;
  hitFlash: number;
  data?: Record<string, unknown>;
};

export type Effect = { id: string; kind: "explosion" | "text" | "trail"; x: number; y: number; life: number; maxLife: number; color: string; text?: string; r?: number };

export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
  dash: boolean;
  pointerDown: boolean;
  pointerX: number;
  pointerY: number;
};

export type GameState = {
  blueprint: GameBlueprint;
  width: number;
  height: number;
  frame: number;
  time: number;
  status: "playing" | "won" | "lost";
  score: number;
  wave: number;
  player: Actor;
  enemies: Actor[];
  boss?: Actor;
  pickups: Actor[];
  projectiles: Actor[];
  towers: Actor[];
  cards: Actor[];
  effects: Effect[];
};

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function actorFromEnemy(enemy: EnemyBlueprint, index: number, width: number, height: number): Actor {
  const r = enemy.archetype === "robot" ? 24 : enemy.archetype === "beast" ? 22 : 17;
  return {
    id: `${enemy.id}-${index}`,
    kind: "enemy",
    archetype: enemy.archetype,
    label: enemy.name,
    x: 340 + ((index * 137) % Math.max(360, width - 480)),
    y: 150 + ((index * 89) % Math.max(260, height - 260)),
    w: r * 2,
    h: r * 2,
    r,
    hp: enemy.hp,
    maxHp: enemy.hp,
    speed: enemy.speed,
    vx: 0,
    vy: 0,
    alive: true,
    cooldown: 0.5 + (index % 3) * 0.35,
    hitFlash: 0,
    data: { source: enemy },
  };
}

export function actorFromPickup(item: ItemBlueprint, index: number, width: number, height: number): Actor {
  return {
    id: `${item.id}-${index}`,
    kind: "pickup",
    archetype: item.type,
    label: item.label,
    x: 160 + ((index * 193) % Math.max(500, width - 280)),
    y: 170 + ((index * 111) % Math.max(280, height - 260)),
    w: 24,
    h: 24,
    r: 13,
    hp: 1,
    maxHp: 1,
    speed: 0,
    vx: 0,
    vy: 0,
    alive: true,
    cooldown: 0,
    hitFlash: 0,
    data: { source: item },
  };
}

export function createInitialState(blueprint: GameBlueprint, width = 960, height = 540): GameState {
  const enemies = blueprint.enemies.flatMap((enemy) => Array.from({ length: enemy.count }).map((_, index) => actorFromEnemy(enemy, index + enemiesCountBefore(blueprint.enemies, enemy.id), width, height)));
  const pickups = blueprint.items.flatMap((item, itemIndex) => Array.from({ length: item.type === "energyCore" || item.type === "coin" ? 4 : 1 }).map((_, n) => actorFromPickup(item, itemIndex * 4 + n, width, height)));
  const player: Actor = {
    id: "player",
    kind: "player",
    archetype: blueprint.player.appearance.archetype,
    label: blueprint.player.name,
    x: blueprint.gameType === "endlessRunner" || blueprint.gameType === "platformer" ? 130 : 140,
    y: blueprint.gameType === "endlessRunner" || blueprint.gameType === "platformer" ? height - 120 : height / 2,
    w: 34,
    h: 52,
    r: 23,
    hp: blueprint.player.hp,
    maxHp: blueprint.player.hp,
    speed: blueprint.player.speed,
    vx: 1,
    vy: 0,
    alive: true,
    cooldown: 0,
    hitFlash: 0,
    data: { source: blueprint.player },
  };
  const boss = blueprint.boss
    ? {
        id: "boss",
        kind: "boss" as const,
        archetype: blueprint.boss.archetype,
        label: blueprint.boss.name,
        x: width - 155,
        y: height / 2,
        w: 96,
        h: 96,
        r: 48,
        hp: blueprint.boss.hp,
        maxHp: blueprint.boss.hp,
        speed: 60,
        vx: 0,
        vy: 0,
        alive: true,
        cooldown: 1.2,
        hitFlash: 0,
        data: { source: blueprint.boss, phase: 1 },
      }
    : undefined;

  return { blueprint, width, height, frame: 0, time: 0, status: "playing", score: 0, wave: 1, player, enemies, boss, pickups, projectiles: [], towers: [], cards: [], effects: [] };
}

function enemiesCountBefore(enemies: EnemyBlueprint[], idValue: string) {
  let count = 0;
  for (const enemy of enemies) {
    if (enemy.id === idValue) return count;
    count += enemy.count;
  }
  return count;
}

export function makeProjectile(from: Actor, targetX: number, targetY: number, owner: "player" | "enemy" | "boss", color: string, damage: number, speed = 640): Actor {
  const dx = targetX - from.x;
  const dy = targetY - from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  return { id: id("projectile"), kind: "projectile", archetype: owner, label: "shot", x: from.x + (dx / len) * 28, y: from.y + (dy / len) * 28, w: 12, h: 12, r: owner === "player" ? 7 : 6, hp: 1, maxHp: 1, speed, vx: (dx / len) * speed, vy: (dy / len) * speed, alive: true, cooldown: 1.4, hitFlash: 0, data: { owner, color, damage } };
}

export function makeEffect(kind: Effect["kind"], x: number, y: number, color: string, options?: { text?: string; r?: number; life?: number }): Effect {
  const life = options?.life ?? (kind === "text" ? 0.9 : 0.35);
  return { id: id("effect"), kind, x, y, life, maxLife: life, color, text: options?.text, r: options?.r ?? 22 };
}
