"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { workflowTemplates } from "@/lib/workflow/templates";

const examplePrompts = [
  "Create a cyberpunk WebGL boss fight with neon drones, shield pickups, laser attacks, score, and a final AI overlord.",
  "Create a fantasy dungeon crawler with treasure, skeleton enemies, traps, a dark knight boss, and upgrade items.",
  "Create a tower defense game where robots attack a crystal core and players place laser towers to survive waves.",
];

export default function StudioPage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("quick-game-prototype");
  const [prompt, setPrompt] = useState(examplePrompts[0]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("prompt");
    if (value) setPrompt(value);
  }, []);

  const template = useMemo(
    () => workflowTemplates.find((item) => item.id === templateId) || workflowTemplates[0],
    [templateId]
  );

  async function runWorkflow() {
    setError("");
    setRunning(true);
    setLog(["Starting workflow...", `Template: ${template.name}`, "Running AI generation nodes..."]);

    try {
      const res = await fetch("/api/workflows/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Workflow failed");

      setLog((prev) => [
        ...prev,
        "World generated.",
        "Game template selected.",
        "Playable runtime configured.",
        "Launch page created.",
        "Version snapshot saved.",
        "Redirecting to editor...",
      ]);
      router.push(data.redirectTo || `/editor/${data.game.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="page">
      <Navbar />
      <section className="section">
        <div className="container">
          <p className="eyebrow">Workflow Studio Beta</p>
          <h1 className="h1">Build a playable game through an AI workflow.</h1>
          <p className="lead">
            Combine prompt input, world generation, rules, templates, playable rendering, launch copy,
            sharing, and feedback into one repeatable workflow.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 340px", gap: 20, marginTop: 32, alignItems: "start" }}>
            <aside className="card">
              <h2 style={{ marginTop: 0 }}>Workflow Templates</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {workflowTemplates.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTemplateId(item.id)}
                    className={item.id === templateId ? "btn btn-primary" : "btn"}
                    style={{ textAlign: "left", justifyContent: "flex-start" }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </aside>

            <section className="card">
              <h2 style={{ marginTop: 0 }}>{template.name}</h2>
              <p style={{ color: "#cbd5e1", lineHeight: 1.7 }}>{template.description}</p>

              <label>
                <span className="label">Game idea / workflow prompt</span>
                <textarea className="textarea" value={prompt} onChange={(event) => setPrompt(event.target.value)} style={{ minHeight: 150 }} />
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                {examplePrompts.map((example, index) => (
                  <button key={index} className="btn" onClick={() => setPrompt(example)}>
                    Example {index + 1}
                  </button>
                ))}
              </div>

              <h3 style={{ marginTop: 28 }}>Workflow Nodes</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {template.nodes.map((node, index) => (
                  <div
                    key={node.id}
                    style={{
                      border: "1px solid #1e293b",
                      background: "rgba(15,23,42,0.88)",
                      borderRadius: 16,
                      padding: 16,
                      display: "grid",
                      gridTemplateColumns: "44px 1fr",
                      gap: 14,
                      alignItems: "start",
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        background: "#0e7490",
                        color: "#ecfeff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <strong>{node.label}</strong>
                        <span style={{ color: "#67e8f9", fontSize: 12, textTransform: "uppercase" }}>{node.type}</span>
                      </div>
                      <p style={{ color: "#94a3b8", marginBottom: 0 }}>{node.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {error ? <div className="card" style={{ marginTop: 20, borderColor: "#7f1d1d", color: "#fca5a5" }}>{error}</div> : null}

              <button className="btn btn-primary" disabled={running} onClick={runWorkflow} style={{ marginTop: 22 }}>
                {running ? "Running Workflow..." : "Run Workflow"}
              </button>
            </section>

            <aside className="card">
              <h2 style={{ marginTop: 0 }}>Run Log</h2>
              <div style={{ display: "grid", gap: 8 }}>
                {(log.length ? log : ["Select a workflow template.", "Write a prompt.", "Run the workflow.", "Open the generated game in the editor."]).map((item, index) => (
                  <div key={index} style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.5 }}>
                    <span style={{ color: "#22d3ee" }}>●</span> {item}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: 14, borderRadius: 14, background: "#020617", border: "1px solid #1e293b" }}>
                <strong>Output</strong>
                <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
                  A pending playable game, version snapshot, editor page, shareable launch page, and playable /play route.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
