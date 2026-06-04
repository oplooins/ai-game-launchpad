import type { GameBlueprint } from "../../blueprint/schema";
import type { GameState } from "../../runtime/GameState";
import type { RendererAdapter } from "../RendererAdapter";

// 3D-ready adapter stub. It intentionally has no three.js dependency yet.
// Later you can replace this class with a real Three.js implementation while keeping GameRuntime unchanged.
export class ThreeJSRenderer implements RendererAdapter {
  readonly id = "threejs" as const;
  private fallbackCanvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D | null;
  private blueprint?: GameBlueprint;

  init(canvas: HTMLCanvasElement, blueprint: GameBlueprint) {
    this.fallbackCanvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.blueprint = blueprint;
  }

  resize() {}

  render(state: GameState) {
    if (!this.ctx || !this.fallbackCanvas) return;
    this.ctx.fillStyle = "#020617";
    this.ctx.fillRect(0, 0, this.fallbackCanvas.width, this.fallbackCanvas.height);
    this.ctx.fillStyle = "#e2e8f0";
    this.ctx.font = "bold 22px Arial";
    this.ctx.fillText("Three.js renderer adapter reserved", 32, 52);
    this.ctx.font = "14px Arial";
    this.ctx.fillText(`Runtime still active: ${state.blueprint.title}`, 32, 82);
  }

  dispose() {
    this.ctx = null;
    this.fallbackCanvas = undefined;
    this.blueprint = undefined;
  }
}
