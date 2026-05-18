import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowDown, ArrowRight } from "lucide-react";
import { cages, type Cage } from "../data/cages";
import { Sparkline } from "../components/Sparkline";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Dashboard — AquaSense" },
      { name: "description", content: "Real-time health monitoring across every cage at Hardangerfjord Site A." },
      { property: "og:title", content: "AquaSense Live Dashboard" },
      { property: "og:description", content: "Real-time disease risk monitoring for salmon cages." },
    ],
  }),
  component: Dashboard,
});

const metrics = [
  { value: "6", label: "Active Cages" },
  { value: "1", label: "Critical Alerts", tone: "danger" as const },
  { value: "190,430", label: "Fish at risk" },
  { value: "€2,400,000", label: "Estimated loss if untreated", tone: "danger" as const },
];

function Dashboard() {
  return (
    <div>
      {/* Critical alert banner */}
      <div className="bg-destructive text-destructive-foreground">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="text-sm leading-relaxed">
            <span className="font-bold">CRITICAL ALERT — Cage-1:</span>{" "}
            Dissolved oxygen dropped 27% over 15 days. Early Pasteurellosis detected.
            Contact your veterinarian immediately.{" "}
            <span className="font-semibold">Estimated exposure: €2,400,000</span>
          </div>
        </div>
      </div>

      {/* Site bar */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <div className="font-semibold">Hardangerfjord Site A</div>
          <div className="text-muted-foreground">License NOR-42540</div>
          <div className="text-muted-foreground">Atlantic Salmon <span className="italic">(Salmo salar)</span></div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Live
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border bg-card p-5">
              <div className={`text-2xl md:text-3xl font-bold tracking-tight tabular ${m.tone === "danger" ? "text-destructive" : ""}`}>
                {m.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Cage grid */}
        <div className="mt-10 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Cage health</h2>
            <p className="text-sm text-muted-foreground">Last updated 12 seconds ago</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cages.map((c) => <CageCard key={c.id} cage={c} />)}
        </div>
      </div>
    </div>
  );
}

function CageCard({ cage }: { cage: Cage }) {
  const critical = cage.status === "critical";
  return (
    <div className={`rounded-xl border bg-card p-5 ${critical ? "ring-2 ring-destructive/30 border-destructive/40" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="font-semibold">Cage {cage.id}</div>
        {critical ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-bold uppercase tracking-wide">
            Critical
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-bold uppercase tracking-wide">
            Low
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className={`text-3xl font-bold tabular ${critical ? "text-destructive" : ""}`}>{cage.risk.toFixed(1)}</div>
        <div className="text-xs text-muted-foreground">/ 10 risk score</div>
      </div>

      <div className={critical ? "text-destructive" : "text-foreground/70"}>
        <Sparkline data={cage.sparkline} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-y-2 gap-x-3 text-sm">
        <Row label="Dissolved O₂" value={`${cage.dissolvedOxygen.toFixed(2)} mg/L`} trend={cage.doTrend === "down" ? "down" : undefined} danger={critical} />
        <Row label="Temp" value={`${cage.temperature.toFixed(1)}°C`} />
        <Row label="pH" value={cage.ph.toFixed(2)} trend={cage.phTrend === "down" ? "down" : undefined} danger={critical} />
        <Row label="Mortality" value={`${cage.mortality.toFixed(2)}%`} danger={critical} />
      </dl>

      {critical && (
        <Link
          to="/ai-assistant"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          View AI Analysis <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function Row({ label, value, trend, danger }: { label: string; value: string; trend?: "down"; danger?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`tabular font-medium flex items-center gap-1 ${danger && trend ? "text-destructive" : ""}`}>
        {value}
        {trend === "down" && <ArrowDown className="w-3.5 h-3.5" />}
      </dd>
    </div>
  );
}
