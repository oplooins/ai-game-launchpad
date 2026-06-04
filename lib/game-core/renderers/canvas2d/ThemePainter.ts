import type { GameBlueprint, ThemeId } from "../../blueprint/schema";

export const themeVisuals: Record<ThemeId, { bg1: string; bg2: string; grid: string; glow: string; obstacle: string; text: string }> = {
  cyberpunk: { bg1: "#090018", bg2: "#020617", grid: "#22d3ee", glow: "#22d3ee", obstacle: "#312e81", text: "#e0f2fe" },
  dungeon: { bg1: "#1f1b16", bg2: "#090604", grid: "#5b4636", glow: "#f59e0b", obstacle: "#3f2f22", text: "#fde68a" },
  space: { bg1: "#020617", bg2: "#111827", grid: "#818cf8", glow: "#38bdf8", obstacle: "#1e293b", text: "#dbeafe" },
  volcano: { bg1: "#3b0a0a", bg2: "#0c0303", grid: "#f97316", glow: "#fb923c", obstacle: "#7f1d1d", text: "#ffedd5" },
  ice: { bg1: "#dbeafe", bg2: "#60a5fa", grid: "#eff6ff", glow: "#ffffff", obstacle: "#93c5fd", text: "#082f49" },
  forest: { bg1: "#052e16", bg2: "#02140a", grid: "#22c55e", glow: "#84cc16", obstacle: "#166534", text: "#dcfce7" },
  factory: { bg1: "#111827", bg2: "#020617", grid: "#94a3b8", glow: "#f97316", obstacle: "#334155", text: "#e5e7eb" },
  desert: { bg1: "#78350f", bg2: "#1c1003", grid: "#f59e0b", glow: "#fde68a", obstacle: "#92400e", text: "#fffbeb" },
};

export class ThemePainter {
  paint(ctx: CanvasRenderingContext2D, width: number, height: number, blueprint: GameBlueprint, frame: number) {
    const theme = themeVisuals[blueprint.theme] || themeVisuals.cyberpunk;
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, theme.bg1);
    g.addColorStop(1, theme.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    if (blueprint.theme === "space") this.paintStars(ctx, width, height, frame);
    if (blueprint.theme === "dungeon") this.paintDungeon(ctx, width, height, frame);
    if (blueprint.theme === "volcano") this.paintVolcano(ctx, width, height, frame);
    if (blueprint.theme === "ice") this.paintIce(ctx, width, height, frame);
    if (blueprint.theme === "forest") this.paintForest(ctx, width, height, frame);
    if (blueprint.theme === "factory") this.paintFactory(ctx, width, height, frame);
    if (blueprint.theme === "desert") this.paintDesert(ctx, width, height, frame);
    if (blueprint.theme === "cyberpunk") this.paintCyberGrid(ctx, width, height, frame, theme.grid, theme.glow);

    this.paintArenaBorder(ctx, width, height, theme.glow);
  }

  private paintCyberGrid(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number, grid: string, glow: string) {
    ctx.save();
    ctx.strokeStyle = `${grid}33`;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 58) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 58) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    ctx.strokeStyle = `${glow}88`;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 120 + Math.sin(frame / 40) * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private paintStars(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    ctx.save();
    for (let i = 0; i < 110; i++) {
      ctx.globalAlpha = 0.25 + (i % 7) / 10;
      ctx.fillStyle = "white";
      ctx.fillRect((i * 97 + frame * 0.3) % width, (i * 57) % height, 2, 2);
    }
    ctx.globalAlpha = 1;
    this.paintCyberGrid(ctx, width, height, frame, "#818cf8", "#38bdf8");
    ctx.restore();
  }

  private paintDungeon(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    ctx.save();
    ctx.strokeStyle = "rgba(91,70,54,.55)";
    for (let x = 0; x < width; x += 64) for (let y = 0; y < height; y += 64) ctx.strokeRect(x, y, 64, 64);
    for (let i = 0; i < 8; i++) {
      const x = 120 + i * 140;
      const y = 100 + ((i * 73) % Math.max(200, height - 220));
      ctx.fillStyle = "#5b341d";
      ctx.fillRect(x - 7, y - 18, 14, 36);
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x, y - 22, 8 + Math.sin(frame / 10 + i) * 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  private paintVolcano(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    ctx.save();
    ctx.strokeStyle = "#f9731688";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#f97316";
    ctx.shadowBlur = 14;
    for (let i = 0; i < 12; i++) {
      const x = (i * 137) % width;
      const y = 120 + ((i * 89 + Math.sin(frame / 28 + i) * 14) % Math.max(220, height - 160));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 54, y + 20); ctx.lineTo(x + 105, y - 12); ctx.stroke();
    }
    ctx.restore();
  }

  private paintIce(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const x = (i * 91) % width;
      const y = (i * 141) % height;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70, y + 24); ctx.lineTo(x + 18, y + 86); ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.14)";
    for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc((i * 117 + frame * 0.2) % width, (i * 79) % height, 20 + (i % 3) * 8, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  private paintForest(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    ctx.save();
    ctx.fillStyle = "rgba(34,197,94,.18)";
    for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc((i * 89) % width, 110 + ((i * 107) % (height - 160)), 22, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  private paintFactory(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    ctx.save();
    ctx.strokeStyle = "rgba(148,163,184,.22)";
    for (let x = 0; x < width; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, height); ctx.stroke(); }
    ctx.restore();
  }

  private paintDesert(ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    ctx.save();
    ctx.strokeStyle = "rgba(253,230,138,.28)";
    for (let y = 120; y < height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y + Math.sin(frame / 40 + y) * 8); ctx.quadraticCurveTo(width / 2, y + 20, width, y); ctx.stroke(); }
    ctx.restore();
  }

  private paintArenaBorder(ctx: CanvasRenderingContext2D, width: number, height: number, glow: string) {
    ctx.save();
    ctx.strokeStyle = `${glow}66`;
    ctx.lineWidth = 3;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    ctx.strokeRect(24, 118, width - 48, height - 142);
    ctx.restore();
  }
}
