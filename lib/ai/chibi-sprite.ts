import type { ReferenceAppearance } from "./reference-image";

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c] || c));
}

function validColor(value: unknown, fallback: string) {
  const text = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export type SpritePose = "idle" | "attack" | "dash" | "hurt";

export function createChibiSpriteDataUrl(input: ReferenceAppearance, pose: SpritePose = "idle") {
  const skin = validColor(input.skinColor, "#f5d0a9");
  const hair = validColor(input.hairColor, "#111827");
  const eye = validColor(input.eyeColor, "#38bdf8");
  const outfit = validColor(input.outfitColor, "#22d3ee");
  const accent = input.accessory === "scarf" || input.accessory === "cape" ? "#ef4444" : eye;
  const weapon = pose === "attack" ? "rotate(-25 96 92)" : pose === "dash" ? "rotate(-8 96 92)" : "rotate(8 96 92)";
  const lean = pose === "dash" ? "translate(8 0) skewX(-6)" : pose === "hurt" ? "translate(-4 2) rotate(-4 96 96)" : "";
  const mouth = input.expression === "happy" ? "M83 83 Q96 94 109 83" : input.expression === "surprised" ? "M96 86 m-5 0 a5 6 0 1 0 10 0 a5 6 0 1 0 -10 0" : input.expression === "angry" ? "M87 88 L96 84 L105 88" : "M88 88 Q96 92 104 88";
  const hairExtra = input.hairStyle === "long" ? `<path d="M64 66 C52 92 54 116 73 128 L119 128 C138 112 140 90 128 66 Z" fill="${hair}"/>` : input.hairStyle === "twinTails" ? `<circle cx="55" cy="72" r="16" fill="${hair}"/><circle cx="137" cy="72" r="16" fill="${hair}"/>` : input.hairStyle === "spiky" ? `<path d="M63 58 L72 26 L84 50 L96 22 L108 50 L121 28 L130 60 Z" fill="${hair}"/>` : "";
  const accessory = input.accessory === "visor" || input.accessory === "mask" ? `<rect x="70" y="70" width="52" height="9" rx="4" fill="${eye}" opacity="0.85"/>` : input.accessory === "glasses" ? `<g fill="none" stroke="#111827" stroke-width="4"><rect x="69" y="68" width="20" height="14" rx="4"/><rect x="103" y="68" width="20" height="14" rx="4"/><path d="M89 75 H103"/></g>` : input.accessory === "headphones" ? `<path d="M62 70 C66 36 126 36 130 70" fill="none" stroke="#111827" stroke-width="7"/><rect x="56" y="68" width="11" height="26" rx="5" fill="#111827"/><rect x="125" y="68" width="11" height="26" rx="5" fill="#111827"/>` : "";
  const scarf = input.accessory === "scarf" || input.accessory === "cape" ? `<path d="M73 112 C45 120 34 145 54 157 C76 143 91 130 102 111 Z" fill="#ef4444" opacity="0.95"/>` : "";
  const actionFx = pose === "attack" ? `<path d="M118 78 C161 62 171 92 133 115" fill="none" stroke="${eye}" stroke-width="9" stroke-linecap="round" opacity="0.65"/>` : pose === "dash" ? `<g opacity="0.45" fill="${eye}"><path d="M22 116 H65 V124 H22 Z"/><path d="M35 137 H74 V144 H35 Z"/><path d="M12 154 H62 V161 H12 Z"/></g>` : pose === "hurt" ? `<path d="M60 42 L50 28 M132 42 L142 28" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>` : "";
  const label = esc(`${input.avatarStyle || "chibi"} ${pose}`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="shadow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="96" cy="166" rx="42" ry="11" fill="url(#shadow)"/>
  ${actionFx}
  <g transform="${lean}" filter="url(#glow)">
    ${scarf}
    <path d="M80 122 H112 C119 122 125 129 125 137 V159 H67 V137 C67 129 73 122 80 122 Z" fill="${outfit}"/>
    <path d="M77 132 H115 V146 H77 Z" fill="#0f172a" opacity="0.22"/>
    <path d="M75 159 L66 178 M117 159 L126 178" stroke="${outfit}" stroke-width="10" stroke-linecap="round"/>
    <path d="M63 178 H82 M110 178 H129" stroke="#7c4a24" stroke-width="9" stroke-linecap="round"/>
    <g transform="${weapon}">
      <path d="M118 118 L154 57" stroke="${eye}" stroke-width="8" stroke-linecap="round"/>
      <path d="M111 121 L126 129" stroke="#c084fc" stroke-width="7" stroke-linecap="round"/>
    </g>
    <circle cx="96" cy="78" r="43" fill="${skin}"/>
    ${hairExtra}
    <path d="M55 67 C64 33 127 30 137 68 C121 56 113 48 99 52 C82 46 72 55 55 67 Z" fill="${hair}"/>
    <path d="M61 63 C72 46 80 39 91 52 C77 55 72 65 61 63 Z" fill="${hair}" opacity="0.95"/>
    <path d="M130 64 C116 48 107 41 96 53 C111 55 120 64 130 64 Z" fill="${hair}" opacity="0.95"/>
    <ellipse cx="81" cy="77" rx="8" ry="10" fill="#fff"/><ellipse cx="111" cy="77" rx="8" ry="10" fill="#fff"/>
    <circle cx="82" cy="79" r="4" fill="${eye}"/><circle cx="110" cy="79" r="4" fill="${eye}"/>
    <circle cx="80" cy="75" r="2" fill="#fff"/><circle cx="108" cy="75" r="2" fill="#fff"/>
    <path d="${mouth}" fill="none" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>
    ${accessory}
    <circle cx="96" cy="127" r="5" fill="${eye}"/>
  </g>
  <text x="96" y="188" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569">${label}</text>
</svg>`;
  return svgToDataUrl(svg);
}

export function attachGeneratedSprites<T extends ReferenceAppearance>(appearance: T): T & {
  spriteUrl: string;
  idleSpriteUrl: string;
  attackSpriteUrl: string;
  dashSpriteUrl: string;
  hurtSpriteUrl: string;
} {
  return {
    ...appearance,
    avatarStyle: appearance.avatarStyle === "sprite" ? "sprite" : "chibi",
    spriteUrl: createChibiSpriteDataUrl(appearance, "idle"),
    idleSpriteUrl: createChibiSpriteDataUrl(appearance, "idle"),
    attackSpriteUrl: createChibiSpriteDataUrl(appearance, "attack"),
    dashSpriteUrl: createChibiSpriteDataUrl(appearance, "dash"),
    hurtSpriteUrl: createChibiSpriteDataUrl(appearance, "hurt"),
  };
}
