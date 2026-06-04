# Strict Art Runtime

This build adds a strict art pipeline for character rendering.

## What is strict now

The reference-image pipeline is not allowed to silently fall back to procedural chibi art by default.

Flow:

1. Upload reference image
2. Vision model extracts non-identifying character appearance
3. Image model generates:
   - idleSpriteUrl
   - runSpriteUrl
   - attackSpriteUrl
   - dashSpriteUrl
   - hurtSpriteUrl
   - deathSpriteUrl
   - portraitUrl
4. Canvas2DRenderer draws the sprite asset with `drawImage`
5. If `renderPolicy: "strictSprite"` is set and the image is missing, the renderer shows a red missing-sprite badge instead of drawing procedural fallback.

## Environment

Required for strict asset generation:

```env
OPENAI_API_KEY=...
OPENAI_IMAGE_MODEL=gpt-image-1
STRICT_CHARACTER_ASSETS=true
```

Development-only fallback can be enabled with:

```env
STRICT_CHARACTER_ASSETS=false
```

Do not use development fallback for production if the product promise is "reference-image driven character art".

## Why Canvas is still used

Canvas remains the game world renderer:
- map
- collision feedback
- enemies
- bullets
- effects
- HUD

Character identity is rendered with sprite assets via `spriteUrl`.
