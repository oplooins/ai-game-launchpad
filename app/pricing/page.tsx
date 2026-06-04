import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For testing the core idea.",
    features: ["3 generations/day", "3 saved public games", "Basic Canvas/WebGL templates", "Launch pages with reviews", "Platform watermark"],
  },
  {
    name: "Creator",
    price: "$9/mo",
    description: "For creators who need repeatable game prototypes.",
    features: ["300 generations/month", "50 saved games", "AI Sandbox Editor", "Version history", "Share links", "Basic leaderboard"],
  },
  {
    name: "Pro",
    price: "$19/mo",
    description: "For advanced users and small studios.",
    features: ["Advanced WebGL templates", "BYOK support", "Embed iframe", "More generation credits", "Analytics-ready dashboard", "Priority models later"],
  },
];

export default function PricingPage() {
  return (
    <main className="page">
      <Navbar />
      <section className="section">
        <div className="container">
          <p className="eyebrow">v0.9 Beta pricing draft</p>
          <h1 className="h1">Free to try. Built to become a creator platform.</h1>
          <p className="lead">
            This page defines the product direction. Payments can be added later with Stripe. The current build already includes usage tracking hooks and plan limits.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 28 }}>
            {plans.map((plan) => (
              <div key={plan.name} className="card">
                <p className="eyebrow">{plan.name}</p>
                <h2 style={{ fontSize: 42, margin: "8px 0" }}>{plan.price}</h2>
                <p className="muted">{plan.description}</p>
                <ul style={{ lineHeight: 2, color: "#cbd5e1", paddingLeft: 20 }}>
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <Link className="btn btn-primary" href="/dashboard/games/new">Start generating</Link>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 24 }}>
            <h2 style={{ marginTop: 0 }}>Commercial direction</h2>
            <p className="muted" style={{ lineHeight: 1.8 }}>
              Do not sell API access. Sell the workflow: playable generation, editing, versioning, sharing, leaderboards, feedback, and publishing. BYOK should be a Pro feature, not the default business model.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
