import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Activity, Brain, BellRing } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AquaSense — Detect fish disease 48 hours early" },
      { name: "description", content: "AI-powered early warning system for salmon farms. Monitor dissolved oxygen, temperature and pH across every cage in real time." },
      { property: "og:title", content: "AquaSense — Early disease warning for salmon farms" },
      { property: "og:description", content: "Detect fish disease 48 hours before it's visible. Trusted by enterprise aquaculture." },
    ],
  }),
  component: Landing,
});

const stats = [
  { value: "€6,000,000,000", label: "Lost annually to fish disease worldwide" },
  { value: "48 hours", label: "Average early warning window" },
  { value: "73%", label: "Reduction in antibiotic use with early detection" },
];

const steps = [
  { icon: Activity, title: "Continuous sensing", text: "Sensors monitor dissolved oxygen, temperature and pH across every cage 24/7." },
  { icon: Brain, title: "AI anomaly detection", text: "Our AI detects anomalies invisible to the human eye — before fish show symptoms." },
  { icon: BellRing, title: "Actionable alerts", text: "You receive an alert with exact cause and recommended action." },
];

function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live across 47 Norwegian farms
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Detect fish disease <span className="text-primary">48 hours</span> before it's visible
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl">
              AquaSense monitors dissolved oxygen, temperature and pH across your salmon farm — alerting you before a €2M outbreak spreads.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
              >
                View Live Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Stat cards */}
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-white tabular">{s.value}</div>
                <div className="mt-2 text-sm text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold">How it works</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">From sensor to intervention in seconds</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-md bg-primary/10 text-primary">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Step {i + 1}</div>
                </div>
                <h3 className="mt-4 font-semibold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white/60 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs">
          Data modeled on Norwegian Fiskehelserapporten 2022 — the official national fish health report.
        </div>
      </footer>
    </>
  );
}
