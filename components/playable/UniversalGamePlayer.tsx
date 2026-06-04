"use client";

import { useEffect, useMemo, useRef } from "react";
import { normalizeBlueprint } from "@/lib/game-core/blueprint/normalize";
import type { GameBlueprint } from "@/lib/game-core/blueprint/schema";
import { GameRuntime } from "@/lib/game-core/runtime/GameRuntime";
import type { InputState } from "@/lib/game-core/runtime/GameState";
import type { RendererAdapter } from "@/lib/game-core/renderers/RendererAdapter";
import { Canvas2DRenderer } from "@/lib/game-core/renderers/canvas2d/Canvas2DRenderer";
import { ThreeJSRenderer } from "@/lib/game-core/renderers/three/ThreeJSRenderer";

type Props = {
  rawConfig: unknown;
  title?: string;
  forceRenderMode?: GameBlueprint["renderMode"];
};

function createRenderer(mode: GameBlueprint["renderMode"]): RendererAdapter {
  if (mode === "threejs") return new ThreeJSRenderer();
  // webglLite deliberately uses the same runtime and a canvas renderer for now.
  // Later you can add WebGLLiteRenderer without changing GameRuntime or /play pages.
  return new Canvas2DRenderer();
}

function inputFromKeys(keys: Set<string>, pointer: { down: boolean; x: number; y: number }): InputState {
  return {
    left: keys.has("a") || keys.has("arrowleft"),
    right: keys.has("d") || keys.has("arrowright"),
    up: keys.has("w") || keys.has("arrowup"),
    down: keys.has("s") || keys.has("arrowdown"),
    attack: keys.has(" ") || keys.has("space"),
    dash: keys.has("shift") || keys.has("shiftleft") || keys.has("shiftright"),
    pointerDown: pointer.down,
    pointerX: pointer.x,
    pointerY: pointer.y,
  };
}

export function UniversalGamePlayer({ rawConfig, title, forceRenderMode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const rendererRef = useRef<RendererAdapter | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const pointerRef = useRef({ down: false, x: 0, y: 0 });

  const blueprint = useMemo(() => {
    const normalized = normalizeBlueprint(rawConfig, title || "AI Generated Game");
    if (forceRenderMode) return { ...normalized, renderMode: forceRenderMode };
    return normalized;
  }, [rawConfig, title, forceRenderMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let running = true;
    let last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const logicalWidth = Math.max(760, Math.floor(rect?.width || 960));
      const logicalHeight = Math.max(540, Math.floor(rect?.height || 540));
      canvas.width = Math.floor(logicalWidth * dpr);
      canvas.height = Math.floor(logicalHeight * dpr);
      const runtime = runtimeRef.current;
      runtime?.resize(logicalWidth, logicalHeight);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rendererRef.current?.resize(logicalWidth, logicalHeight);
    };

    const rect = canvas.parentElement?.getBoundingClientRect();
    const initialWidth = Math.max(760, Math.floor(rect?.width || 960));
    const initialHeight = Math.max(540, Math.floor(rect?.height || 540));
    const runtime = new GameRuntime(blueprint, initialWidth, initialHeight);
    const renderer = createRenderer(blueprint.renderMode);
    runtimeRef.current = runtime;
    rendererRef.current = renderer;
    renderer.init(canvas, blueprint);
    resize();
    canvas.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.key.toLowerCase());
      keysRef.current.add(event.code.toLowerCase());
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase());
      keysRef.current.delete(event.code.toLowerCase());
    };
    const onPointerDown = (event: PointerEvent) => {
      canvas.focus();
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = { down: true, x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = event.clientX - rect.left;
      pointerRef.current.y = event.clientY - rect.top;
    };
    const onPointerUp = () => {
      pointerRef.current.down = false;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      runtime.setInput(inputFromKeys(keysRef.current, pointerRef.current));
      runtime.step(dt);
      renderer.render(runtime.state);
      pointerRef.current.down = false;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      renderer.dispose();
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      runtimeRef.current = null;
      rendererRef.current = null;
    };
  }, [blueprint]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,.12)",
          background: "rgba(2,6,23,.92)",
        }}
      >
        <div>
          <strong>{blueprint.title}</strong>
          <span style={{ marginLeft: 10, color: "#67e8f9", fontSize: 12 }}>
            {blueprint.gameType} · {blueprint.theme} · {blueprint.renderMode}
          </span>
        </div>
        <div style={{ color: "#cbd5e1", fontSize: 12 }}>Runtime: Blueprint → GameRuntime → RendererAdapter</div>
      </div>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        onClick={() => canvasRef.current?.focus()}
        style={{
          width: "100%",
          height: "calc(100vh - 48px)",
          minHeight: 540,
          display: "block",
          background: "#020617",
          outline: "none",
          cursor: "crosshair",
        }}
      />
    </div>
  );
}
