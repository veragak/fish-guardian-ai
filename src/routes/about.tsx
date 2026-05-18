import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AquaSense" },
      { name: "description", content: "AquaSense is an AI-powered early disease warning system for industrial salmon farms." },
      { property: "og:title", content: "About AquaSense" },
      { property: "og:description", content: "Why we built an AI early warning system for salmon aquaculture." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="bg-background">
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-xs uppercase tracking-widest text-primary font-semibold">About</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">A €6 billion problem, solved with data.</h1>
        <div className="mt-8 space-y-5 text-base text-muted-foreground leading-relaxed">
          <p>
            Every year, the global aquaculture industry loses an estimated €6 billion to fish disease. Outbreaks
            spread silently — by the time symptoms appear in a cage, it's already too late.
          </p>
          <p>
            AquaSense combines continuous water-quality sensing with anomaly-detection models trained on a decade
            of Norwegian fish-health data. We surface disease signatures days before they're visible — giving farm
            operators, veterinarians and welfare officers a real intervention window.
          </p>
          <p>
            Our models are calibrated against the official <em>Fiskehelserapporten</em> dataset published annually
            by the Norwegian Veterinary Institute, the most comprehensive fish-health registry in the world.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/dashboard" className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            View Live Dashboard
          </Link>
          <Link to="/ai-assistant" className="rounded-md border px-5 py-3 text-sm font-semibold hover:bg-accent">
            Try the AI Assistant
          </Link>
        </div>
      </section>
    </div>
  );
}
