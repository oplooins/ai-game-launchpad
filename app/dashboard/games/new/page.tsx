"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

const initialForm = {
  title: "AI Prototype Arena",
  category: "Action",
  shortDescription: "A playable browser prototype generated from an idea.",
  description: "A playable HTML5/WebGL prototype with AI generated launch copy and game configuration.",
  tags: "HTML5, WebGL, AI Game, Indie",
  coverImage: "https://placehold.co/1200x630/png",
  playUrl: "",
  gameTemplate: "webgl-arena",
  gameConfig: JSON.stringify({ template: "webgl-arena", title: "AI Prototype Arena" }, null, 2),
  seoTitle: "Play AI Prototype Arena Online",
  promoLine: "Play an AI-generated browser prototype instantly.",
  imagePrompt: "AI generated WebGL game cover art, high contrast, modern indie poster",
  aiQualityScore: "72",
  aiQualitySummary: "Ready for playable prototype testing. Add stronger art before public promotion.",
  aiSeoChecklist: "Use a clear genre keyword\nKeep the short description under 160 characters\nAdd 3-6 tags\nUse a 1200x630 cover image",
  aiImprovementTips: "Replace the placeholder cover\nAdd a clearer player goal\nTest the generated play loop",
  aiPublishPack: JSON.stringify({
    twitter: "I generated a playable browser game prototype from a short idea.",
    reddit: "I built an AI-assisted HTML5/WebGL playable prototype and I am looking for feedback.",
    productHunt: "An AI launch builder that turns game ideas into playable HTML5 prototypes and launch pages.",
    shortVideoScript: "Show the idea, show generated game, show play loop, then CTA: try it in browser.",
    chinesePost: "我用 AI 生成了一个可试玩网页游戏原型，欢迎测试反馈。",
    englishPost: "I generated a playable browser game prototype and launch page from a short idea.",
  }, null, 2),
};

type FormState = typeof initialForm;

type GenerateResponse = {
  title?: string;
  category?: string;
  shortDescription?: string;
  description?: string;
  tags?: string[];
  seoTitle?: string;
  promoLine?: string;
  imagePrompt?: string;
  qualityScore?: number;
  qualitySummary?: string;
  seoChecklist?: string[];
  improvementTips?: string[];
  publishPack?: Record<string, string>;
};

type PlayableResponse = {
  template?: string;
  config?: Record<string, unknown>;
  error?: string;
};

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function safeJson(value: string) {
  try { return JSON.parse(value); } catch { return {}; }
}

export default function NewGamePage() {
  const router = useRouter();
  const [idea, setIdea] = useState("Create a complex fantasy fighting game with single-player and two-player style, enemy waves, upgrades, and an adventure theme.");
  const [form, setForm] = useState<FormState>(initialForm);
  const [referenceImageDataUrl, setReferenceImageDataUrl] = useState("");
  const [referenceAppearance, setReferenceAppearance] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const prompt = new URLSearchParams(window.location.search).get("prompt");
    if (prompt) setIdea(prompt);
  }, []);


  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function onReferenceImage(file?: File) {
    if (!file) return;
    if (file.size > 3_000_000) {
      setError("Reference image must be under 3MB for this prototype.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReferenceImageDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function analyzeReferenceImage() {
    if (!referenceImageDataUrl) return null;
    const res = await fetch("/api/ai/analyze-reference-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl: referenceImageDataUrl, prompt: idea }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Reference image analysis failed");
    setReferenceAppearance(data.appearance || null);
    return data.appearance || null;
  }

  async function generateAiGame() {
    setError("");
    setLoading(true);
    try {
      const copyRes = await fetch("/api/ai/generate-store-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const copy: GenerateResponse & { error?: string } = await copyRes.json();
      if (!copyRes.ok) throw new Error(copy.error || "Launch copy generation failed");

      const analyzedAppearance = referenceImageDataUrl ? await analyzeReferenceImage() : referenceAppearance;

      const playableRes = await fetch("/api/ai/generate-playable-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, title: copy.title, referenceAppearance: analyzedAppearance || undefined }),
      });
      const playable: PlayableResponse = await playableRes.json();
      if (!playableRes.ok) throw new Error(playable.error || "Playable game generation failed");

      setForm((prev) => ({
        ...prev,
        title: copy.title || prev.title,
        category: copy.category || prev.category,
        shortDescription: copy.shortDescription || prev.shortDescription,
        description: copy.description || prev.description,
        tags: Array.isArray(copy.tags) ? copy.tags.join(", ") : prev.tags,
        coverImage: prev.coverImage,
        playUrl: "",
        gameTemplate: playable.template || prev.gameTemplate,
        gameConfig: playable.config ? JSON.stringify(playable.config, null, 2) : prev.gameConfig,
        seoTitle: copy.seoTitle || prev.seoTitle,
        promoLine: copy.promoLine || prev.promoLine,
        imagePrompt: copy.imagePrompt || prev.imagePrompt,
        aiQualityScore: String(copy.qualityScore ?? prev.aiQualityScore),
        aiQualitySummary: copy.qualitySummary || prev.aiQualitySummary,
        aiSeoChecklist: Array.isArray(copy.seoChecklist) ? copy.seoChecklist.join("\n") : prev.aiSeoChecklist,
        aiImprovementTips: Array.isArray(copy.improvementTips) ? copy.improvementTips.join("\n") : prev.aiImprovementTips,
        aiPublishPack: copy.publishPack ? JSON.stringify(copy.publishPack, null, 2) : prev.aiPublishPack,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI game generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function publishGame() {
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        playUrl: form.playUrl.trim(),
        gameConfig: safeJson(form.gameConfig),
        aiQualityScore: Number(form.aiQualityScore) || 0,
        aiSeoChecklist: lines(form.aiSeoChecklist),
        aiImprovementTips: lines(form.aiImprovementTips),
        aiPublishPack: safeJson(form.aiPublishPack),
      };
      const res = await fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      router.push("/dashboard/review");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <Navbar />
      <section className="section">
        <div className="container" style={{ maxWidth: 980 }}>
          <p className="eyebrow">AI Playable Game Generator</p>
          <h1 className="h1">Create an AI Playable Game</h1>
          <p className="lead">Generate launch copy plus a playable WebGL or Canvas prototype. If WebGL is not supported, Canvas templates still run.</p>
          {error && <div className="card" style={{ borderColor: "#7f1d1d", color: "#fca5a5" }}>{error}</div>}

          <div className="card" style={{ marginTop: 24 }}>
            <h2>1. Game Idea</h2>
            <textarea className="textarea" value={idea} onChange={(e) => setIdea(e.target.value)} />
            <div style={{ marginTop: 16, padding: 14, border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, background: "rgba(15,23,42,.55)" }}>
              <h3 style={{ marginTop: 0 }}>Optional Reference Character Image</h3>
              <p className="muted">Upload a character reference. The backend analyzes it, generates strict spriteUrl character assets, and the Canvas renderer draws those sprites directly. No procedural fallback is used for strict sprite assets.</p>
              <input className="input" type="file" accept="image/*" onChange={(e) => onReferenceImage(e.target.files?.[0])} />
              {referenceImageDataUrl && (
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 12 }}>
                  <img src={referenceImageDataUrl} alt="Reference preview" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)" }} />
                  <button className="btn" type="button" onClick={analyzeReferenceImage} disabled={loading}>Analyze Reference Image</button>
                </div>
              )}
              {referenceAppearance && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                    {typeof referenceAppearance.idleSpriteUrl === "string" && (
                      <div style={{ textAlign: "center" }}>
                        <img src={referenceAppearance.idleSpriteUrl} alt="Idle sprite" style={{ width: 88, height: 88, objectFit: "contain", background: "#020617", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)" }} />
                        <div className="muted" style={{ fontSize: 11 }}>idle</div>
                      </div>
                    )}
                    {typeof referenceAppearance.attackSpriteUrl === "string" && (
                      <div style={{ textAlign: "center" }}>
                        <img src={referenceAppearance.attackSpriteUrl} alt="Attack sprite" style={{ width: 88, height: 88, objectFit: "contain", background: "#020617", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)" }} />
                        <div className="muted" style={{ fontSize: 11 }}>attack</div>
                      </div>
                    )}
                    {typeof referenceAppearance.dashSpriteUrl === "string" && (
                      <div style={{ textAlign: "center" }}>
                        <img src={referenceAppearance.dashSpriteUrl} alt="Dash sprite" style={{ width: 88, height: 88, objectFit: "contain", background: "#020617", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)" }} />
                        <div className="muted" style={{ fontSize: 11 }}>dash</div>
                      </div>
                    )}
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", marginTop: 12, fontSize: 12, color: "#cbd5e1", maxHeight: 260, overflow: "auto" }}>{JSON.stringify(referenceAppearance, null, 2)}</pre>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={generateAiGame} disabled={loading} style={{ marginTop: 14 }}>
              {loading ? "Generating..." : "Generate AI Playable Game"}
            </button>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h2>2. Launch Page</h2>
            <div className="form-grid">
              {Object.entries({ title: "Title", category: "Category", shortDescription: "Short Description", tags: "Tags", coverImage: "Cover Image URL", seoTitle: "SEO Title", promoLine: "Promo Line", imagePrompt: "Image Prompt" }).map(([field, label]) => (
                <label key={field}>
                  <span className="label">{label}</span>
                  <input className="input" value={form[field as keyof FormState]} onChange={(e) => update(field as keyof FormState, e.target.value)} />
                </label>
              ))}
              <label>
                <span className="label">External Play URL Optional</span>
                <input className="input" placeholder="Leave blank to use generated /play/[slug]" value={form.playUrl} onChange={(e) => update("playUrl", e.target.value)} />
              </label>
              <label>
                <span className="label">Description</span>
                <textarea className="textarea" value={form.description} onChange={(e) => update("description", e.target.value)} />
              </label>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h2>3. Playable Game Config</h2>
            <div className="form-grid">
              <label>
                <span className="label">Game Template</span>
                <select className="input" value={form.gameTemplate} onChange={(e) => update("gameTemplate", e.target.value)}>
                  <option value="webgl-arena">WebGL Arena Fighter</option>
                  <option value="webgl-space">WebGL Space Shooter</option>
                  <option value="canvas-runner">Canvas Endless Runner</option>
                  <option value="canvas-dungeon">Canvas Dungeon Crawler</option>
                  <option value="canvas-tower-defense">Canvas Tower Defense</option>
                  <option value="canvas-card-battle">Canvas Card Battle</option>
                  <option value="canvas-platformer">Canvas Platformer</option>
                </select>
              </label>
              <label>
                <span className="label">Game Config JSON</span>
                <textarea className="textarea" value={form.gameConfig} onChange={(e) => update("gameConfig", e.target.value)} style={{ minHeight: 220 }} />
              </label>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <h2>4. AI Quality & Publish Pack</h2>
            <div className="form-grid">
              <label><span className="label">Quality Score</span><input className="input" value={form.aiQualityScore} onChange={(e) => update("aiQualityScore", e.target.value)} /></label>
              <label><span className="label">Quality Summary</span><input className="input" value={form.aiQualitySummary} onChange={(e) => update("aiQualitySummary", e.target.value)} /></label>
              <label><span className="label">SEO Checklist</span><textarea className="textarea" value={form.aiSeoChecklist} onChange={(e) => update("aiSeoChecklist", e.target.value)} /></label>
              <label><span className="label">Improvement Tips</span><textarea className="textarea" value={form.aiImprovementTips} onChange={(e) => update("aiImprovementTips", e.target.value)} /></label>
              <label><span className="label">Publish Pack JSON</span><textarea className="textarea" value={form.aiPublishPack} onChange={(e) => update("aiPublishPack", e.target.value)} /></label>
              <button className="btn btn-green" onClick={publishGame} disabled={loading}>{loading ? "Working..." : "Publish as Pending"}</button>
            </div>
          </div>
          <p className="muted"><Link href="/dashboard">Back to dashboard</Link></p>
        </div>
      </section>
    </main>
  );
}
