# AI Game LaunchPad v1.2 Chibi Reference Runtime


AI Game LaunchPad is a workflow-based AI studio for turning game ideas into playable HTML5/WebGL prototypes, launch pages, leaderboards, and shareable game experiences.

> ChatGPT gives you code. AI Game LaunchPad gives you a playable, editable, shareable game workflow.

## Live Demo

Set your deployed URL after deployment.

## What is new in v1.0

v1.0 combines the earlier v0.7 AI Sandbox Engine, v0.8 Creator Platform, and v0.9 Beta features into one Workflow Studio:

- `/studio` Workflow Studio page
- Workflow templates: Quick Game Prototype, Sandbox Adventure, Boss Fight, Tower Defense, Launch Page Only
- Workflow nodes: Prompt Input, AI World Builder, Template Selector, Game Config Generator, Playable Renderer, Launch Page Generator, Publish & Share
- Workflow and WorkflowRun database models
- AI-generated playable game config
- `/play/[slug]` playable Canvas/WebGL-style runtime
- `/editor/[slug]` sandbox editor
- GameVersion history
- Score leaderboard model and API
- Favorites, reviews, dashboard stats
- Generation usage limits
- Pricing page
- Share and iframe embed support

## Core flow

```txt
Prompt
→ Workflow Studio
→ AI world / rules / template / launch page nodes
→ Playable game
→ Editor
→ Version history
→ Launch page
→ Share / embed
→ Scores and feedback
```

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run build
npm run dev
```

## Environment variables

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_SECRET=""
FREE_DAILY_GENERATIONS="3"
CREATOR_DAILY_GENERATIONS="25"
PRO_DAILY_GENERATIONS="100"
```

## Deployment

For Netlify, set:

```txt
Build command: npx prisma generate && npm run build
```

Add your environment variables in Netlify Project Configuration. Do not commit `.env`.

## Product positioning

AI Game LaunchPad is not trying to be a full Unity/Roblox replacement. It is a workflow studio for generating playable HTML5/WebGL-style prototypes, editing game worlds with AI, and publishing shareable game pages for feedback.


## v1.2 Renderer Upgrade

This build adds a universal runtime with a dedicated Q/chibi character renderer, reference-image-to-avatar schema support, and a backend reference image analyzer endpoint. The renderer is still procedural Canvas2D today, but the Runtime → RendererAdapter split keeps the path open for Three.js rendering later.

Key files:

- `lib/game-core/blueprint/schema.ts`
- `lib/game-core/blueprint/normalize.ts`
- `lib/game-core/renderers/canvas2d/painters/ChibiCharacterPainter.ts`
- `lib/game-core/renderers/canvas2d/Canvas2DRenderer.ts`
- `app/api/ai/analyze-reference-image/route.ts`
- `components/playable/UniversalGamePlayer.tsx`

Reference images are analyzed into non-identifying character traits such as hair style, outfit color, accessory, and expression. The system does not identify people.

## v1.2.1 SpriteUrl Character Pipeline

This build adds a spriteUrl-first character rendering path. Reference analysis now returns generated SVG sprite data URLs for idle/attack/dash/hurt poses. Canvas2DRenderer draws spriteUrl assets first, then falls back to procedural chibi only when no sprite is available.


## Strict Art Runtime

This build includes a strict spriteUrl character art pipeline. Reference images are analyzed, image-model character assets are generated, and the Canvas renderer draws sprite assets directly. Procedural fallback is disabled by default for strict character art.
