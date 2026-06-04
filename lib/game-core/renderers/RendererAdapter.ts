import type { GameBlueprint } from "../blueprint/schema";
import type { GameState } from "../runtime/GameState";

export interface RendererAdapter {
  readonly id: "canvas2d" | "webglLite" | "threejs";
  init(canvas: HTMLCanvasElement, blueprint: GameBlueprint): void;
  resize(width: number, height: number): void;
  render(state: GameState): void;
  dispose(): void;
}
