import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowDown, ArrowRight, Waves, Wind, Thermometer, Sparkles, MapPin, X } from "lucide-react";
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
  const { farm, marine, cages, totals, nearbyZones } = data;
  const critical = cages.filter((c) => c.status === "critical");
  const [whatIf, setWhatIf] = useState<FarmDashboard["cages"][number] | null>(null);

  return (
    <div>
      {critical.length > 0 && (
        <div className="bg-destructive text-destructive-foreground">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 animate-pulse" />
            <div className="text-sm leading-relaxed flex-1">
              <span className="font-bold">CRITICAL ALERT — Cage {critical[0].position}:</span>{" "}
              Dissolved oxygen at {critical[0].dissolvedOxygen} mg/L (below 7 mg/L stress threshold).
              Mortality {critical[0].mortality}% and rising. Likely early <em>Pasteurella skyensis</em> outbreak —
              contact your veterinarian immediately.{" "}
              <span className="font-semibold">Estimated exposure: {fmtEUR(totals.estimatedLossEUR)}</span>
            </div>
            <AlertSound
              active={critical.length > 0}
              speech={`Critical alert at ${farm.name}. Cage ${critical[0].position}: dissolved oxygen at ${critical[0].dissolvedOxygen.toFixed(1)} milligrams per liter, below the 7 milligram stress threshold. Mortality at ${critical[0].mortality.toFixed(1)} percent and rising. Likely early pasteurellosis outbreak. Recommended action: deploy aeration to raise oxygen above 8 milligrams per liter within 6 hours, stop feeding the affected cage for 24 hours, and contact your veterinarian. Estimated exposure if untreated: ${Math.round(totals.estimatedLossEUR / 1000)} thousand euros.`}
            />
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

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Cage health</h2>
                <p className="text-sm text-muted-foreground">Modeled from real-time sea data + per-cage telemetry · refreshes every 60s</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {cages.map((c) => <CageCard key={c.id || c.position} cage={c} onWhatIf={() => setWhatIf(c)} />)}
            </div>
          </div>

          <aside>
            <NearbyZonesPanel zones={nearbyZones} />
          </aside>
        </div>
      </div>

      {whatIf && <WhatIfDialog cage={whatIf} onClose={() => setWhatIf(null)} />}
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

function CageCard({ cage, onWhatIf }: { cage: FarmDashboard["cages"][number]; onWhatIf: () => void }) {
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

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onWhatIf}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary px-3 py-2 text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" /> What-if simulator
        </button>
        {critical && (
          <Link to="/ai-assistant" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
            Ask AI <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
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

function NearbyZonesPanel({ zones }: { zones: FarmDashboard["nearbyZones"] }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Nearby fish-health zones</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Reported localities within ~200&nbsp;km</p>
        </div>
      </div>
      <ul className="mt-4 divide-y">
        {zones.map((z) => {
          const overLimit = z.liceAvg > z.liceLimit;
          const statusColor = z.diseaseStatus === "confirmed"
            ? "text-destructive bg-destructive/10"
            : z.diseaseStatus === "suspected"
              ? "text-yellow-600 bg-yellow-500/10"
              : "text-success bg-success/10";
          return (
            <li key={z.locality} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{z.locality}</div>
                  <div className="text-xs text-muted-foreground">{z.region} · {z.distanceKm} km</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
                  {z.diseaseStatus}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className={`tabular ${overLimit ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                  Lice: {z.liceAvg.toFixed(2)} {overLimit && `(> ${z.liceLimit} limit)`}
                </span>
                {z.disease && <span className="text-muted-foreground">· {z.disease}</span>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 pt-3 border-t text-[11px] text-muted-foreground leading-relaxed">
        Source: <a href="https://www.barentswatch.no/fiskehelse/" target="_blank" rel="noreferrer" className="underline hover:text-foreground">Barentswatch Fiskehelse</a> · Norwegian Food Safety Authority + Veterinærinstituttet
      </div>
    </div>
  );
}

// Treatment delay → projected mortality. Untreated pasteurellosis / ISA roughly
// doubles cumulative mortality every ~3 days during the early acute phase.
// Healthy cages stay essentially flat (background mortality ~0.05% / day).
function projectMortality(currentMortality: number, status: string, delayDays: number): number {
  if (delayDays <= 0) return currentMortality;
  if (status === "critical") {
    return currentMortality * Math.pow(2, delayDays / 3);
  }
  if (status === "elevated") {
    return currentMortality * (1 + 0.25 * delayDays);
  }
  return currentMortality + 0.05 * delayDays;
}

function WhatIfDialog({ cage, onClose }: { cage: FarmDashboard["cages"][number]; onClose: () => void }) {
  const [days, setDays] = useState(3);
  const projected = useMemo(() => projectMortality(cage.mortality, cage.status, days), [cage, days]);
  const additionalDeaths = Math.max(0, Math.round(cage.fish_count * (projected - cage.mortality) / 100));
  const additionalLossEUR = additionalDeaths * 42;
  const projectedRisk = Math.min(10, cage.risk + (cage.status === "critical" ? days * 0.5 : days * 0.15));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <div className="text-xs uppercase tracking-wide text-primary font-semibold">What-if simulator</div>
            <h3 className="text-lg font-bold tracking-tight">Cage {cage.position} · delay treatment</h3>
          </div>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-md hover:bg-muted" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium">Delay treatment by</label>
            <div className="tabular text-2xl font-bold">{days} <span className="text-sm font-normal text-muted-foreground">days</span></div>
          </div>
          <input
            type="range"
            min={0}
            max={7}
            step={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-3 w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Treat now</span><span>3 days</span><span>1 week</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat label="Projected mortality" value={`${projected.toFixed(2)}%`} from={`${cage.mortality.toFixed(2)}%`} danger />
            <Stat label="Projected risk score" value={`${projectedRisk.toFixed(1)} / 10`} from={`${cage.risk.toFixed(1)}`} danger={projectedRisk >= 7} />
            <Stat label="Additional fish lost" value={additionalDeaths.toLocaleString()} from="vs. treat now" danger={additionalDeaths > 0} />
            <Stat label="Added financial exposure" value={fmtEUR(additionalLossEUR)} from="@ €42/fish" danger={additionalLossEUR > 0} />
          </div>

          <div className="mt-5 rounded-md bg-muted/50 border text-xs text-muted-foreground px-3 py-2 leading-relaxed">
            Model: cumulative mortality from early-stage pasteurellosis / ISA doubles approximately every 3 days
            during the acute untreated phase (Veterinærinstituttet, Fiskehelserapporten 2023). Healthy cages assume
            background mortality of 0.05% / day. Loss valued at €42 / fish (Fish Pool 2024, 5 kg harvest weight).
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, from, danger }: { label: string; value: string; from: string; danger?: boolean }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className={`mt-1 tabular text-xl font-bold ${danger ? "text-destructive" : ""}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{from}</div>
    </div>
  );
}
