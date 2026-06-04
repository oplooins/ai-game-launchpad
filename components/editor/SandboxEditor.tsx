"use client";

import { useState } from "react";

type SandboxEditorProps = {
  slug: string;
  title: string;
  initialConfig: unknown;
  versions: { id: string; versionNumber: number; changePrompt?: string | null; createdAt: string }[];
};

export function SandboxEditor({ slug, title, initialConfig, versions }: SandboxEditorProps) {
  const [prompt, setPrompt] = useState("Add a fire boss, faster enemies, shield pickup, and a new quest objective.");
  const [configText, setConfigText] = useState(JSON.stringify(initialConfig || {}, null, 2));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  async function updateWorld() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/sandbox/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sandbox update failed");
      setConfigText(JSON.stringify(data.config, null, 2));
      setPreviewKey((value) => value + 1);
      setMessage(`Saved version ${data.versionNumber}. Preview refreshed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function restoreVersion(versionId: string) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/sandbox/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restore failed");
      setConfigText(JSON.stringify(data.config, null, 2));
      setPreviewKey((value) => value + 1);
      setMessage("Version restored. Preview refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restore failed");
    } finally {
      setLoading(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-site.netlify.app";
  const embedCode = `<iframe src="${origin}/play/${slug}" width="960" height="540" allowfullscreen></iframe>`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(360px, .7fr)", gap: 20, alignItems: "start" }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>{title}</strong>
          <div className="row">
            <button className="btn" onClick={() => setPreviewKey((value) => value + 1)}>Refresh preview</button>
            <a href={`/play/${slug}`} target="_blank" style={{ color: "#67e8f9" }}>Open play page</a>
          </div>
        </div>
        <iframe key={previewKey} src={`/play/${slug}?preview=${previewKey}`} title={title} style={{ width: "100%", height: 620, border: 0, display: "block", background: "black" }} />
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <div className="card">
          <p className="eyebrow">AI Sandbox Command</p>
          <h2 style={{ marginTop: 6 }}>Modify this game world</h2>
          <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ minHeight: 140 }} />
          <button className="btn btn-primary" onClick={updateWorld} disabled={loading} style={{ marginTop: 12 }}>
            {loading ? "Updating..." : "Apply AI World Update"}
          </button>
          {message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}
        </div>

        <div className="card">
          <p className="eyebrow">Current Config</p>
          <textarea className="textarea" value={configText} readOnly style={{ minHeight: 260, fontFamily: "monospace", fontSize: 12 }} />
        </div>

        <div className="card">
          <p className="eyebrow">Share / Embed</p>
          <textarea className="textarea" value={embedCode} readOnly style={{ minHeight: 90, fontFamily: "monospace", fontSize: 12 }} />
        </div>

        <div className="card">
          <p className="eyebrow">Versions</p>
          {versions.length === 0 ? <p className="muted">No saved versions yet.</p> : versions.map((version) => (
            <div key={version.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 10 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>v{version.versionNumber}</strong>
                <button className="btn" onClick={() => restoreVersion(version.id)} disabled={loading}>Restore</button>
              </div>
              <p className="muted">{version.changePrompt || "Initial sandbox update"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
