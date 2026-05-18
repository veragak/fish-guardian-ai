import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Activity, Brain, BellRing } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AquaSense — Detect fish disease 48 hours early" },
      { name: "description", content: "AI-powered early warning system for salmon farms. Built on the official Norwegian Fish Health Report data." },
      { property: "og:title", content: "AquaSense — Early disease warning for salmon farms" },
      { property: "og:description", content: "Detect fish disease 48 hours before it's visible. Trusted by enterprise aquaculture." },
    ],
  }),
  component: Landing,
});

// All figures sourced from public reports; citations shown below each.
const stats = [
  { value: "62,000,000", label: "Atlantic salmon died in Norwegian sea farms in 2023", cite: "Veterinærinstituttet, Fiskehelserapporten 2023" },
  { value: "16.7%", label: "Mortality rate in Norwegian salmon farms in 2023 — worst on record", cite: "Norwegian Veterinary Institute, 2024" },
  { value: "€940M+", label: "Estimated annual loss to disease in Norwegian salmon farming alone", cite: "iLaks / SINTEF industry estimates 2023" },
];

const steps = [
  { icon: Activity, title: "Live environmental sensing", text: "We pull sea-surface temperature, wave height and wind for your coordinates from Open-Meteo Marine every minute, and combine them with per-cage sensor telemetry." },
  { icon: Brain, title: "AI anomaly detection", text: "Our model derives oxygen saturation from real SST (Benson-Krause), then flags cages whose DO, pH or mortality drift outside the safe envelope — days before fish show symptoms." },
  { icon: BellRing, title: "Actionable alerts", text: "You get a clear alert with likely pathogen, financial exposure at €42/fish (Fish Pool 2024), and a recommended next step." },
];

function Landing() {
  return (
    <>
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Built on Norwegian Fish Health Report data
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Detect fish disease <span className="text-primary">48 hours</span> before it's visible
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl">
              In 2023, <b className="text-white">62 million</b> farmed salmon died in Norway — a <b className="text-white">16.7%</b> mortality rate, the worst on record.
              AquaSense combines live sea data with per-cage telemetry to warn you before an outbreak spreads.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition">
                Start free trial <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 transition">
                See how it works
              </a>
            </div>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-white tabular">{s.value}</div>
                <div className="mt-2 text-sm text-white/70">{s.label}</div>
                <div className="mt-3 text-[11px] uppercase tracking-wide text-white/40">Source: {s.cite}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-background">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold">How it works</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Real sea data. Real risk modeling. Real alerts.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-md bg-primary/10 text-primary"><s.icon className="w-5 h-5" /></div>
                  <div className="text-sm text-muted-foreground font-medium">Step {i + 1}</div>
                </div>
                <h3 className="mt-4 font-semibold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-navy text-white/60 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs leading-relaxed">
          Disease, mortality and price figures sourced from Veterinærinstituttet (Fiskehelserapporten 2023), SINTEF Aquaculture reports, and Fish Pool ASA. Live environmental data via Open-Meteo Marine. AquaSense models risk using Benson-Krause oxygen saturation calibrated to your farm's real-time sea surface temperature.
        </div>
      </footer>
    </>
  );
}
