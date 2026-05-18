import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { createFarm, getMyFarm } from "@/lib/farm.functions";
import { Waves, MapPin } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your farm — AquaSense" }] }),
  component: Onboarding,
});

const PRESETS = [
  { name: "Hardangerfjord", lat: 60.1, lng: 6.0 },
  { name: "Trondheimsfjord", lat: 63.6, lng: 10.2 },
  { name: "Vestfjorden (Lofoten)", lat: 68.2, lng: 14.5 },
  { name: "Boknafjord (Rogaland)", lat: 59.2, lng: 5.7 },
];

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const create = useServerFn(createFarm);
  const fetchFarm = useServerFn(getMyFarm);

  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  const [cageCount, setCageCount] = useState(6);
  const [fishPerCage, setFishPerCage] = useState(30000);
  const [loc, setLoc] = useState(PRESETS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    fetchFarm().then((f) => { if (f) navigate({ to: "/dashboard" }); });
  }, [user, loading, navigate, fetchFarm]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await create({ data: { name, license: license || null, species: "Atlantic Salmon (Salmo salar)", latitude: loc.lat, longitude: loc.lng, cage_count: cageCount, fish_per_cage: fishPerCage } });
      await router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      setError(e?.message ?? "Could not create farm");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-navy text-navy-foreground py-12 px-6">
      <div className="mx-auto max-w-2xl">
        <div className="inline-flex items-center gap-2 text-white/80">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-primary/15 text-primary"><Waves className="w-4 h-4" /></span>
          <span className="font-semibold">AquaSense setup</span>
        </div>
        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">Tell us about your farm</h1>
        <p className="mt-2 text-white/60">We'll pull live sea-surface temperature, wave height, and wind for your coordinates from Open-Meteo and model risk per cage.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <Field label="Farm name"><input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Hardangerfjord Site A" /></Field>
          <Field label="License (optional)"><input maxLength={60} value={license} onChange={(e) => setLicense(e.target.value)} className={input} placeholder="NOR-42540" /></Field>

          <div>
            <div className="text-xs text-white/60 mb-2 font-medium flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location</div>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button type="button" key={p.name} onClick={() => setLoc(p)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${loc.name === p.name ? "border-primary bg-primary/10 text-white" : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/5"}`}>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-white/50 tabular">{p.lat.toFixed(2)}°N, {p.lng.toFixed(2)}°E</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="How many cages?">
              <input type="number" min={1} max={60} required value={cageCount} onChange={(e) => setCageCount(+e.target.value)} className={input} />
            </Field>
            <Field label="Fish per cage">
              <input type="number" min={100} max={200000} step={500} required value={fishPerCage} onChange={(e) => setFishPerCage(+e.target.value)} className={input} />
            </Field>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">{error}</div>}
          <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {busy ? "Setting up your farm…" : "Create farm & go to dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}

const input = "w-full rounded-md bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs text-white/60 mb-1.5 font-medium">{label}</div>{children}</label>;
}
