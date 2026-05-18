import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowDown, ArrowRight, Waves, Wind, Thermometer } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getFarmDashboard, type FarmDashboard } from "@/lib/farm.functions";
import { Sparkline } from "../components/Sparkline";
import { AlertSound } from "../components/AlertSound";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Dashboard — AquaSense" },
      { name: "description", content: "Live disease-risk monitoring across every cage on your farm." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchDashboard = useServerFn(getFarmDashboard);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => fetchDashboard(),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!isLoading && user && data === null) navigate({ to: "/onboarding" });
  }, [data, isLoading, user, navigate]);

  if (loading || isLoading || !user) return <div className="mx-auto max-w-7xl px-6 py-20 text-muted-foreground">Loading your farm…</div>;
  if (error) return <div className="mx-auto max-w-7xl px-6 py-20 text-destructive">Could not load farm: {(error as Error).message}</div>;
  if (!data) return null;
  return <DashboardView data={data} />;
}

function fmtEUR(n: number) { return "€" + n.toLocaleString("en-US"); }

function DashboardView({ data }: { data: FarmDashboard }) {
  const { farm, marine, cages, totals } = data;
  const critical = cages.filter((c) => c.status === "critical");
  return (
    <div>
      {critical.length > 0 && (
        <div className="bg-destructive text-destructive-foreground">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-sm leading-relaxed">
              <span className="font-bold">CRITICAL ALERT — Cage {critical[0].position}:</span>{" "}
              Dissolved oxygen at {critical[0].dissolvedOxygen} mg/L (below 7 mg/L stress threshold).
              Mortality {critical[0].mortality}% and rising. Likely early <em>Pasteurella skyensis</em> outbreak —
              contact your veterinarian immediately.{" "}
              <span className="font-semibold">Estimated exposure: {fmtEUR(totals.estimatedLossEUR)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <div className="font-semibold">{farm.name}</div>
          {farm.license && <div className="text-muted-foreground">License {farm.license}</div>}
          <div className="text-muted-foreground">{farm.species}</div>
          <div className="text-muted-foreground tabular">{farm.latitude.toFixed(2)}°N, {farm.longitude.toFixed(2)}°E</div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Live data from Open-Meteo
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Live environmental band */}
        <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-primary" /><span className="text-muted-foreground">Sea surface</span><b className="tabular">{marine.sst.toFixed(1)}°C</b></div>
          <div className="flex items-center gap-2"><Waves className="w-4 h-4 text-primary" /><span className="text-muted-foreground">Wave height</span><b className="tabular">{marine.waveHeight.toFixed(1)} m</b></div>
          <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-primary" /><span className="text-muted-foreground">Wind</span><b className="tabular">{marine.windSpeed.toFixed(1)} m/s</b></div>
          <div className="ml-auto text-xs text-muted-foreground">Source: {marine.source}</div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={String(cages.length)} label="Active cages" />
          <Metric value={String(totals.critical)} label="Critical alerts" tone={totals.critical > 0 ? "danger" : undefined} />
          <Metric value={totals.fish.toLocaleString()} label="Fish under monitoring" />
          <Metric value={fmtEUR(totals.estimatedLossEUR)} label="Est. exposure if untreated" tone={totals.critical > 0 ? "danger" : undefined} />
        </div>

        <div className="mt-10 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Cage health</h2>
            <p className="text-sm text-muted-foreground">Modeled from real-time sea data + per-cage telemetry · refreshes every 60s</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cages.map((c) => <CageCard key={c.id || c.position} cage={c} />)}
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label, tone }: { value: string; label: string; tone?: "danger" }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className={`text-2xl md:text-3xl font-bold tracking-tight tabular ${tone === "danger" ? "text-destructive" : ""}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

function CageCard({ cage }: { cage: FarmDashboard["cages"][number] }) {
  const critical = cage.status === "critical";
  const elevated = cage.status === "elevated";
  return (
    <div className={`rounded-xl border bg-card p-5 ${critical ? "ring-2 ring-destructive/30 border-destructive/40" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="font-semibold">Cage {cage.position}</div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${critical ? "bg-destructive/10 text-destructive" : elevated ? "bg-yellow-500/10 text-yellow-600" : "bg-success/10 text-success"}`}>
          {cage.status}
        </span>
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
        <Link to="/ai-assistant" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Ask AI for analysis <ArrowRight className="w-4 h-4" />
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
        {value}{trend === "down" && <ArrowDown className="w-3.5 h-3.5" />}
      </dd>
    </div>
  );
}
