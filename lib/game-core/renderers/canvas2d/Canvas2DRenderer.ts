import type { GameBlueprint } from "../../blueprint/schema";
import type { Actor, Effect, GameState } from "../../runtime/GameState";
import type { RendererAdapter } from "../RendererAdapter";
import { themeVisuals, ThemePainter } from "./ThemePainter";
import { ChibiCharacterPainter } from "./painters/ChibiCharacterPainter";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pct: number, fg: string, bg = "#7f1d1d") {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), h);
}

export class Canvas2DRenderer implements RendererAdapter {
  readonly id = "canvas2d" as const;
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D | null;
  private blueprint?: GameBlueprint;
  private themePainter = new ThemePainter();
  private chibiPainter = new ChibiCharacterPainter();
  private spriteCache = new Map<string, HTMLImageElement>();

  init(canvas: HTMLCanvasElement, blueprint: GameBlueprint) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.blueprint = blueprint;
  }

  resize() {}

  render(state: GameState) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const { width, height, blueprint } = state;
    this.themePainter.paint(ctx, width, height, blueprint, state.frame);
    this.paintLevel(ctx, state);
    if (blueprint.gameType === "cardBattle") this.paintCardBattle(ctx, state);
    if (blueprint.gameType === "towerDefense") this.paintTowers(ctx, state);
    for (const pickup of state.pickups) if (pickup.alive) this.paintPickup(ctx, pickup, state);
    for (const enemy of state.enemies) if (enemy.alive) this.paintActor(ctx, enemy, state);
    if (state.boss?.alive) this.paintActor(ctx, state.boss, state);
    for (const p of state.projectiles) if (p.alive) this.paintProjectile(ctx, p, state);
    this.paintActor(ctx, state.player, state);
    for (const effect of state.effects) this.paintEffect(ctx, effect);
    this.paintHud(ctx, state);
    if (state.status !== "playing") this.paintEnd(ctx, state);
  }

  dispose() {
    this.ctx = null;
    this.canvas = undefined;
    this.blueprint = undefined;
    this.spriteCache.clear();
  }

  private getSprite(url?: string) {
    if (!url) return null;
    const cached = this.spriteCache.get(url);
    if (cached) return cached;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    this.spriteCache.set(url, img);
    return img;
  }

  private paintSpriteIfReady(ctx: CanvasRenderingContext2D, actor: Actor, url?: string, size = 92) {
    const img = this.getSprite(url);
    if (!img || !img.complete || img.naturalWidth <= 0) return false;
    const aspect = img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
    const h = size;
    const w = size * aspect;
    ctx.save();
    ctx.translate(actor.x, actor.y);
    if (actor.vx < -0.05) ctx.scale(-1, 1);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(0, actor.r + 8, actor.r * 1.25, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowColor = String(actor.data?.accentColor || "#67e8f9");
    ctx.shadowBlur = 16;
    ctx.drawImage(img, -w / 2, -h * 0.72, w, h);
    ctx.restore();
    return true;
  }

  private paintLevel(ctx: CanvasRenderingContext2D, state: GameState) {
    const theme = themeVisuals[state.blueprint.theme] || themeVisuals.cyberpunk;
    ctx.save();
    ctx.fillStyle = `${theme.obstacle}cc`;
    ctx.strokeStyle = `${theme.glow}55`;
    for (const o of state.blueprint.level.obstacles) {
      roundRect(ctx, o.x, o.y, o.w, o.h, 8);
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      if (o.kind === "lava") {
        ctx.fillStyle = "rgba(249,115,22,.45)";
        ctx.fillRect(o.x + 6, o.y + 6, o.w - 12, Math.max(3, o.h - 12));
        ctx.fillStyle = `${theme.obstacle}cc`;
      }
      if (o.kind === "ice") {
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.beginPath(); ctx.moveTo(o.x + 8, o.y + 8); ctx.lineTo(o.x + o.w - 8, o.y + o.h - 8); ctx.stroke();
        ctx.strokeStyle = `${theme.glow}55`;
      }
    }
    if (state.blueprint.gameType === "platformer" || state.blueprint.gameType === "endlessRunner") {
      ctx.fillStyle = `${theme.glow}55`;
      ctx.fillRect(0, state.height - 60, state.width, 8);
    }
    ctx.restore();
  }

  private paintActor(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    if (actor.kind === "player") return this.paintPlayer(ctx, actor, state);
    if (actor.kind === "boss") return this.paintBoss(ctx, actor, state);
    if (actor.archetype === "drone") return this.paintDrone(ctx, actor, state);
    if (actor.archetype === "robot") return this.paintRobot(ctx, actor, state);
    if (actor.archetype === "beast") return this.paintBeast(ctx, actor, state);
  }

  private paintPlayer(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const character = state.blueprint.player.appearance.character;
    const spriteUrl =
      character?.dashSpriteUrl && Math.abs(actor.vx) + Math.abs(actor.vy) > 1.6
        ? character.dashSpriteUrl
        : actor.cooldown > 0.08 && character?.attackSpriteUrl
          ? character.attackSpriteUrl
          : character?.idleSpriteUrl || character?.spriteUrl || state.blueprint.player.appearance.spriteUrl;

    const strictSprite = character?.renderPolicy === "strictSprite";

    // Highest priority: real/generated sprite assets. In strict mode, never use procedural fallback.
    if (spriteUrl && this.paintSpriteIfReady(ctx, actor, spriteUrl, 108)) return;

    if (strictSprite) {
      this.paintMissingStrictSprite(ctx, actor, state);
      return;
    }

    // Draft-only fallback. This is not used for strict published art assets.
    if (!character || character.avatarStyle === "chibi" || character.avatarStyle === "sprite") {
      return this.chibiPainter.paint(ctx, actor, state);
    }
    if (character.avatarStyle === "mech") return this.paintMechHero(ctx, actor, state);
    if (character.avatarStyle === "creature") return this.paintCreatureHero(ctx, actor, state);
    return this.chibiPainter.paint(ctx, actor, state);
  }

  private paintMissingStrictSprite(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    ctx.save();
    ctx.translate(actor.x, actor.y);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(15,23,42,.92)";
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#f43f5e";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, -10, actor.r * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SPRITE", 0, -18);
    ctx.fillText("MISSING", 0, -4);

    ctx.fillStyle = "#fca5a5";
    ctx.font = "9px Arial";
    ctx.fillText("strict mode", 0, 13);
    ctx.restore();

    if (state.frame % 60 === 0) {
      console.warn("Strict character renderer: sprite asset missing or not loaded; procedural fallback is disabled.");
    }
  }

  private paintMechHero(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const p = state.blueprint.palette;
    ctx.save(); ctx.translate(actor.x, actor.y); ctx.shadowColor = p.accent; ctx.shadowBlur = 16;
    ctx.fillStyle = p.primary; roundRect(ctx, -19, -26, 38, 52, 8);
    ctx.fillStyle = p.secondary; roundRect(ctx, -14, -36, 28, 18, 6);
    ctx.fillStyle = p.accent; ctx.fillRect(-9, -31, 18, 4);
    ctx.fillStyle = p.danger; ctx.fillRect(-31, -10, 12, 24); ctx.fillRect(19, -10, 12, 24);
    ctx.strokeStyle = p.accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(28, -2); ctx.lineTo(50, -10); ctx.stroke();
    ctx.restore();
  }

  private paintCreatureHero(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const p = state.blueprint.palette;
    ctx.save(); ctx.translate(actor.x, actor.y); ctx.shadowColor = p.accent; ctx.shadowBlur = 12;
    ctx.fillStyle = p.primary; ctx.beginPath(); ctx.ellipse(0, 0, 23, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.accent; ctx.beginPath(); ctx.moveTo(10, -17); ctx.lineTo(30, -28); ctx.lineTo(20, -8); ctx.fill();
    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(8, -6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = p.primary; ctx.lineWidth = 4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-8, 10 * s); ctx.lineTo(-20, 22 * s); ctx.moveTo(8, 10 * s); ctx.lineTo(22, 20 * s); ctx.stroke(); }
    ctx.restore();
  }

  private paintDrone(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const p = state.blueprint.palette;
    ctx.save(); ctx.translate(actor.x, actor.y); ctx.shadowColor = p.danger; ctx.shadowBlur = 12 + actor.hitFlash * 35;
    ctx.fillStyle = p.danger; ctx.beginPath(); ctx.arc(0, 0, actor.r * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.accent; ctx.fillRect(-actor.r * 1.45, -6, actor.r, 12); ctx.fillRect(actor.r * 0.45, -6, actor.r, 12);
    ctx.fillStyle = "#fff7ed"; ctx.fillRect(-5, -3, 10, 6);
    ctx.fillStyle = p.secondary; ctx.beginPath(); ctx.arc(0, actor.r * .75, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); this.paintHealth(ctx, actor);
  }

  private paintRobot(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const p = state.blueprint.palette;
    ctx.save(); ctx.translate(actor.x, actor.y); ctx.shadowColor = p.danger; ctx.shadowBlur = 10 + actor.hitFlash * 30;
    ctx.fillStyle = "#94a3b8"; roundRect(ctx, -actor.r * 0.65, -actor.r * 0.85, actor.r * 1.3, actor.r * 1.45, 6);
    ctx.fillStyle = p.danger; ctx.fillRect(-actor.r * 1.05, -8, actor.r * 0.4, 18); ctx.fillRect(actor.r * 0.65, -8, actor.r * 0.4, 18);
    ctx.fillStyle = "#020617"; ctx.fillRect(-9, -13, 7, 5); ctx.fillRect(3, -13, 7, 5);
    ctx.strokeStyle = p.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(actor.r * 0.65, 1); ctx.lineTo(actor.r * 1.25, 1); ctx.stroke();
    ctx.restore(); this.paintHealth(ctx, actor);
  }

  private paintBeast(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const p = state.blueprint.palette;
    ctx.save(); ctx.translate(actor.x, actor.y); ctx.shadowColor = p.accent; ctx.shadowBlur = 10 + actor.hitFlash * 30;
    ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.ellipse(0, 0, actor.r * 0.95, actor.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.accent; ctx.beginPath(); ctx.moveTo(actor.r * 0.55, -actor.r * 0.55); ctx.lineTo(actor.r * 1.15, -actor.r * 0.15); ctx.lineTo(actor.r * 0.55, actor.r * 0.05); ctx.fill();
    ctx.strokeStyle = "#fed7aa"; ctx.lineWidth = 4;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-8, 8 * s); ctx.lineTo(-18, 20 * s); ctx.moveTo(8, 8 * s); ctx.lineTo(20, 20 * s); ctx.stroke(); }
    ctx.restore(); this.paintHealth(ctx, actor);
  }

  private paintBoss(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const p = state.blueprint.palette;
    ctx.save(); ctx.translate(actor.x, actor.y); ctx.shadowColor = p.accent; ctx.shadowBlur = 28 + Math.sin(state.frame / 10) * 8;
    ctx.strokeStyle = p.accent; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, actor.r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = p.primary; ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) { const a = state.frame / 35 + i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * actor.r * 0.5, Math.sin(a) * actor.r * 0.5); ctx.lineTo(Math.cos(a) * actor.r * 1.45, Math.sin(a) * actor.r * 1.45); ctx.stroke(); }
    ctx.fillStyle = p.danger; ctx.beginPath(); ctx.arc(0, 0, actor.r * 0.58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#020617"; ctx.beginPath(); ctx.arc(0, 0, actor.r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 12px Arial"; ctx.fillText("BOSS", 0, 4); ctx.textAlign = "left";
    ctx.restore();
  }

  private paintPickup(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const p = state.blueprint.palette;
    ctx.save(); ctx.translate(actor.x, actor.y); ctx.shadowColor = p.accent; ctx.shadowBlur = 14;
    const pulse = 1 + Math.sin(state.frame / 10 + actor.x) * 0.12;
    if (actor.archetype === "healthPack") { ctx.fillStyle = "#22c55e"; roundRect(ctx, -12 * pulse, -12 * pulse, 24 * pulse, 24 * pulse, 5); ctx.fillStyle = "white"; ctx.fillRect(-2, -8, 4, 16); ctx.fillRect(-8, -2, 16, 4); }
    else if (actor.archetype === "shield") { ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(13, -3); ctx.lineTo(8, 14); ctx.lineTo(0, 18); ctx.lineTo(-8, 14); ctx.lineTo(-13, -3); ctx.closePath(); ctx.fill(); }
    else if (actor.archetype === "speedBoost") { ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.moveTo(-12, 12); ctx.lineTo(0, -14); ctx.lineTo(1, 0); ctx.lineTo(14, -14); ctx.lineTo(2, 14); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(0, 0, 12 * pulse, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  private paintProjectile(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const c = String(actor.data?.color || state.blueprint.palette.accent);
    ctx.save(); ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(actor.x, actor.y, actor.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  private paintEffect(ctx: CanvasRenderingContext2D, e: Effect) {
    const t = Math.max(0, e.life / e.maxLife);
    ctx.save(); ctx.globalAlpha = t; ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 16;
    if (e.kind === "text") { ctx.font = "bold 16px Arial"; ctx.fillText(e.text || "", e.x, e.y - (1 - t) * 28); }
    else { ctx.beginPath(); ctx.arc(e.x, e.y, (e.r || 24) * (1.25 - t * 0.25), 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  private paintHealth(ctx: CanvasRenderingContext2D, actor: Actor) { bar(ctx, actor.x - actor.r, actor.y + actor.r + 8, actor.r * 2, 5, actor.hp / actor.maxHp, "#22c55e"); }

  private paintHud(ctx: CanvasRenderingContext2D, state: GameState) {
    const b = state.blueprint;
    const char = b.player.appearance.character;
    ctx.save();
    ctx.fillStyle = "rgba(2,6,23,.84)"; roundRect(ctx, 16, 16, 470, 118, 14);
    ctx.fillStyle = "white"; ctx.font = "bold 18px Arial"; ctx.fillText(b.title.slice(0, 38), 32, 44);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px Arial"; ctx.fillText(`${b.gameType} · ${b.theme} · ${char?.avatarStyle || "runtime"} renderer`, 32, 65);
    if (char?.referenceSummary) ctx.fillText(`Ref: ${char.referenceSummary.slice(0, 55)}`, 32, 82);
    bar(ctx, 32, 96, 160, 12, state.player.hp / state.player.maxHp, "#22c55e");
    ctx.fillStyle = "white"; ctx.font = "12px Arial"; ctx.fillText(`HP ${Math.max(0, Math.round(state.player.hp))}/${state.player.maxHp}`, 200, 107);
    ctx.fillText(`Score ${Math.round(state.score)}`, 32, 127); ctx.fillText(`Wave ${state.wave}`, 130, 127); ctx.fillText(`Objective: ${b.objective.slice(0, 40)}`, 210, 127);
    if (state.boss?.alive) { ctx.fillStyle = "rgba(2,6,23,.84)"; roundRect(ctx, state.width / 2 - 230, 18, 460, 48, 12); ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 13px Arial"; ctx.fillText(state.boss.label, state.width / 2, 39); ctx.textAlign = "left"; bar(ctx, state.width / 2 - 180, 48, 360, 10, state.boss.hp / state.boss.maxHp, "#f43f5e"); }
    ctx.fillStyle = "rgba(2,6,23,.78)"; roundRect(ctx, state.width - 255, 16, 235, 80, 14); ctx.fillStyle = "white"; ctx.font = "bold 13px Arial"; ctx.fillText("Controls", state.width - 235, 42); ctx.fillStyle = "#cbd5e1"; ctx.font = "12px Arial"; ctx.fillText("Move: WASD / Arrows", state.width - 235, 62); ctx.fillText("Attack: Space / Click · Dash: Shift", state.width - 235, 80);
    ctx.restore();
  }

  private paintTowers(ctx: CanvasRenderingContext2D, state: GameState) { ctx.save(); ctx.fillStyle = state.blueprint.palette.primary; ctx.strokeStyle = state.blueprint.palette.accent; for (const tower of state.towers) { ctx.beginPath(); ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } ctx.restore(); }

  private paintCardBattle(ctx: CanvasRenderingContext2D, state: GameState) {
    ctx.save(); ctx.fillStyle = "rgba(2,6,23,.72)"; roundRect(ctx, 90, state.height - 150, state.width - 180, 115, 18); ctx.fillStyle = "white"; ctx.font = "bold 18px Arial"; ctx.fillText("Card Battle Runtime", 120, state.height - 112);
    const cards = ["Attack", "Shield", "Burst"];
    cards.forEach((c, i) => { ctx.fillStyle = i === 0 ? state.blueprint.palette.accent : state.blueprint.palette.surface; roundRect(ctx, 120 + i * 120, state.height - 95, 92, 62, 12); ctx.fillStyle = "white"; ctx.font = "bold 13px Arial"; ctx.fillText(c, 142 + i * 120, state.height - 59); }); ctx.restore();
  }

  private paintEnd(ctx: CanvasRenderingContext2D, state: GameState) {
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect(0, 0, state.width, state.height); ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 44px Arial"; ctx.fillText(state.status === "won" ? "MISSION COMPLETE" : "GAME OVER", state.width / 2, state.height / 2 - 20); ctx.font = "18px Arial"; ctx.fillText(`Score: ${Math.round(state.score)} · Refresh to play again`, state.width / 2, state.height / 2 + 24); ctx.restore();
  }
}
