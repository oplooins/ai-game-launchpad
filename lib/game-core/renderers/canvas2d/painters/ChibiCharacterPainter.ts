import type { Actor, GameState } from "../../../runtime/GameState";
import type { CharacterAppearance } from "../../../blueprint/schema";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function strokeRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

function getAppearance(actor: Actor, state: GameState): CharacterAppearance {
  const source = actor.kind === "player" ? state.blueprint.player.appearance.character : undefined;
  return source || {
    avatarStyle: "chibi",
    bodyType: "small",
    skinColor: "#f5d0a9",
    hairStyle: "short",
    hairColor: "#111827",
    eyeColor: state.blueprint.palette.accent,
    outfitStyle: "combat",
    outfitColor: state.blueprint.palette.primary,
    accessory: "visor",
    expression: "focused",
  };
}

export class ChibiCharacterPainter {
  paint(ctx: CanvasRenderingContext2D, actor: Actor, state: GameState) {
    const c = getAppearance(actor, state);
    const p = state.blueprint.palette;
    const dir = actor.vx >= 0 ? 1 : -1;
    const bob = Math.sin(state.frame / 8) * 1.5;

    ctx.save();
    ctx.translate(actor.x, actor.y + bob);
    ctx.shadowColor = c.eyeColor || p.accent;
    ctx.shadowBlur = c.avatarStyle === "chibi" ? 18 : 12;
    if (actor.hitFlash > 0) ctx.globalAlpha = 0.55 + Math.sin(state.frame) * 0.25;

    if (c.referenceImageUrl) this.paintReferenceAura(ctx, c, state.frame);

    // Chibi proportions: huge head, small body, tiny legs.
    this.paintShadow(ctx);
    this.paintLegs(ctx, c, dir);
    this.paintBody(ctx, c, p);
    this.paintHead(ctx, c);
    this.paintHair(ctx, c);
    this.paintFace(ctx, c);
    this.paintAccessory(ctx, c);
    this.paintWeapon(ctx, c, p, dir);

    ctx.restore();
  }

  private paintShadow(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(0, 28, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private paintReferenceAura(ctx: CanvasRenderingContext2D, c: CharacterAppearance, frame: number) {
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(frame / 15) * 0.05;
    ctx.strokeStyle = c.eyeColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -12, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private paintLegs(ctx: CanvasRenderingContext2D, c: CharacterAppearance, dir: number) {
    ctx.strokeStyle = c.outfitColor;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, 10); ctx.lineTo(-12, 28);
    ctx.moveTo(8, 10); ctx.lineTo(12, 28);
    ctx.stroke();

    ctx.fillStyle = "#111827";
    roundRect(ctx, -18 * dir, 25, 14, 6, 3);
    roundRect(ctx, 4 * dir, 25, 14, 6, 3);
  }

  private paintBody(ctx: CanvasRenderingContext2D, c: CharacterAppearance, p: GameState["blueprint"]["palette"]) {
    ctx.fillStyle = c.outfitColor || p.primary;
    roundRect(ctx, -18, -2, 36, 30, 10);

    ctx.fillStyle = c.outfitStyle === "armor" ? "rgba(255,255,255,.35)" : c.outfitStyle === "robe" ? "rgba(0,0,0,.18)" : p.secondary;
    roundRect(ctx, -13, 4, 26, 14, 6);

    if (c.outfitStyle === "spaceSuit" || c.outfitStyle === "armor") {
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2;
      strokeRoundRect(ctx, -18, -2, 36, 30, 10);
    }

    if (c.accessory === "cape" || c.accessory === "scarf") {
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(-16, 2);
      ctx.lineTo(-35, 20);
      ctx.lineTo(-18, 30);
      ctx.closePath();
      ctx.fill();
    }
  }

  private paintHead(ctx: CanvasRenderingContext2D, c: CharacterAppearance) {
    ctx.fillStyle = c.skinColor;
    ctx.beginPath();
    ctx.ellipse(0, -28, 24, 23, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private paintHair(ctx: CanvasRenderingContext2D, c: CharacterAppearance) {
    if (c.hairStyle === "none") return;
    ctx.fillStyle = c.hairColor;
    if (c.hairStyle === "helmet") {
      ctx.beginPath();
      ctx.arc(0, -33, 25, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-24, -35, 48, 12);
      return;
    }
    if (c.hairStyle === "hood") {
      ctx.beginPath();
      ctx.ellipse(0, -30, 27, 27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.skinColor;
      ctx.beginPath();
      ctx.ellipse(0, -27, 20, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (c.hairStyle === "twinTails") {
      ctx.beginPath();
      ctx.arc(-26, -22, 10, 0, Math.PI * 2);
      ctx.arc(26, -22, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    if (c.hairStyle === "long") {
      ctx.beginPath();
      ctx.ellipse(0, -23, 28, 29, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, -39, 24, Math.PI, Math.PI * 2);
    ctx.fill();
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7, -42);
      ctx.lineTo(i * 7 + (c.hairStyle === "spiky" ? 5 : 1), -21);
      ctx.lineTo(i * 7 + 9, -39);
      ctx.closePath();
      ctx.fill();
    }
  }

  private paintFace(ctx: CanvasRenderingContext2D, c: CharacterAppearance) {
    const eyeY = -31;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.ellipse(-8, eyeY, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, eyeY, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.eyeColor;
    ctx.beginPath(); ctx.arc(-8, eyeY + 1, 2.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, eyeY + 1, 2.7, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (c.expression === "happy") ctx.arc(0, -21, 7, 0, Math.PI);
    else if (c.expression === "angry") { ctx.moveTo(-5, -21); ctx.lineTo(0, -24); ctx.lineTo(5, -21); }
    else if (c.expression === "surprised") ctx.arc(0, -21, 3, 0, Math.PI * 2);
    else { ctx.moveTo(-5, -20); ctx.lineTo(5, -20); }
    ctx.stroke();
  }

  private paintAccessory(ctx: CanvasRenderingContext2D, c: CharacterAppearance) {
    if (c.accessory === "visor" || c.accessory === "mask") {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = c.eyeColor;
      ctx.fillRect(-16, -35, 32, 6);
      ctx.restore();
    }
    if (c.accessory === "glasses") {
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -36, 11, 8);
      ctx.strokeRect(4, -36, 11, 8);
      ctx.beginPath(); ctx.moveTo(-4, -32); ctx.lineTo(4, -32); ctx.stroke();
    }
    if (c.accessory === "headphones") {
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, -33, 24, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#111827";
      roundRect(ctx, -27, -32, 7, 14, 3);
      roundRect(ctx, 20, -32, 7, 14, 3);
    }
  }

  private paintWeapon(ctx: CanvasRenderingContext2D, c: CharacterAppearance, p: GameState["blueprint"]["palette"], dir: number) {
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (c.outfitStyle === "ninja") {
      ctx.moveTo(15 * dir, -2); ctx.lineTo(38 * dir, -24);
    } else if (c.outfitStyle === "robe") {
      ctx.moveTo(16 * dir, -4); ctx.lineTo(36 * dir, -4);
      ctx.moveTo(34 * dir, -14); ctx.lineTo(34 * dir, 12);
    } else {
      ctx.moveTo(16 * dir, 0); ctx.lineTo(40 * dir, -8);
    }
    ctx.stroke();
  }
}
