import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AquaSense" },
      { name: "description", content: "Why AquaSense exists, and the public datasets we build on." },
    ],
  }),
  component: About,
});

const sources = [
  { name: "Fiskehelserapporten 2023", org: "Norwegian Veterinary Institute (Veterinærinstituttet)", url: "https://www.vetinst.no/rapporter-og-publikasjoner/rapporter/2024/fish-health-report-2023" },
  { name: "Open-Meteo Marine API", org: "Open-Meteo (CC-BY 4.0)", url: "https://open-meteo.com/en/docs/marine-weather-api" },
  { name: "BarentsWatch Fish Health", org: "BarentsWatch, Norwegian government", url: "https://www.barentswatch.no/en/fishhealth/" },
  { name: "Fish Pool ASA — Salmon spot index", org: "Fish Pool ASA", url: "https://fishpool.eu/" },
];

function About() {
  return (
    <div className="bg-background">
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-xs uppercase tracking-widest text-primary font-semibold">About</div>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">A €940 million problem, modeled with public data.</h1>

        <div className="mt-8 space-y-5 text-base text-muted-foreground leading-relaxed">
          <p>
            In 2023, <b className="text-foreground">62 million</b> Atlantic salmon died in Norwegian sea-cages — a national mortality rate of
            <b className="text-foreground"> 16.7%</b>, the worst since records began. The Norwegian Veterinary Institute's
            <em> Fiskehelserapporten</em> attributes the bulk of those losses to disease, sea-lice treatments and
            environmental stress that builds invisibly over days before fish show symptoms.
          </p>
          <p>
            AquaSense was built on the premise that this is a data problem, not a biology problem. Sea-surface temperature,
            wave height, and wind drive dissolved-oxygen saturation in salmon cages — and dissolved oxygen below 7 mg/L is the
            single best leading indicator of an outbreak. We pull that environmental signal live from Open-Meteo Marine for
            your exact coordinates and combine it with per-cage telemetry to surface risk 48 hours early.
          </p>
          <p>
            The mock telemetry in this demo is calibrated to the real cage-failure patterns published by the Norwegian
            Veterinary Institute. The numbers you see for sea temperature, wave height and wind are <b className="text-foreground">real</b>,
            updated every minute, for whichever fjord you select during onboarding.
          </p>
        </div>

        <h2 className="mt-12 text-xl font-bold tracking-tight">Data sources</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.name} className="rounded-lg border bg-card px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-foreground">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.org}</div>
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline shrink-0">Visit →</a>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/auth" className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Try it on your farm
          </Link>
          <Link to="/dashboard" className="rounded-md border px-5 py-3 text-sm font-semibold hover:bg-accent">
            View Live Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
