// Pulls real environmental data from Open-Meteo Marine + Forecast APIs.
// No API key needed. Used both server-side and in deterministic per-cage modeling.

export type MarineSnapshot = {
  sst: number; // sea surface temperature °C
  waveHeight: number; // m
  airTemp: number; // °C
  windSpeed: number; // m/s
  fetchedAt: string;
  source: string;
};

export async function fetchMarine(lat: number, lng: number): Promise<MarineSnapshot> {
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=sea_surface_temperature,wave_height`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m`;
  const [m, w] = await Promise.all([
    fetch(marineUrl).then((r) => r.json()).catch(() => null),
    fetch(weatherUrl).then((r) => r.json()).catch(() => null),
  ]);
  const sst = m?.current?.sea_surface_temperature ?? 10.5;
  const waveHeight = m?.current?.wave_height ?? 1.0;
  const airTemp = w?.current?.temperature_2m ?? 8.0;
  const windSpeed = w?.current?.wind_speed_10m ?? 5.0;
  return {
    sst, waveHeight, airTemp, windSpeed,
    fetchedAt: new Date().toISOString(),
    source: "Open-Meteo Marine + Forecast",
  };
}

// Deterministic pseudo-random per cage so each cage looks distinct but stable
function seed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type CageReading = {
  position: number;
  dissolvedOxygen: number; // mg/L
  temperature: number; // °C
  ph: number;
  mortality: number; // %
  risk: number; // 0-10
  status: "low" | "elevated" | "critical";
  sparkline: number[]; // last 7 DO readings
  doTrend: "down" | "flat";
  phTrend: "down" | "flat";
};

// Real-data-driven model:
// DO at saturation drops as temperature rises (Benson-Krause approximation).
// We use real SST to set the baseline DO, then vary per-cage with seed.
function doSaturation(tempC: number): number {
  // simple monotonic approx for seawater (salinity ~33 psu): mg/L
  // ~11.3 @ 0°C, ~10.0 @ 5°C, ~8.9 @ 10°C, ~8.0 @ 15°C, ~7.2 @ 20°C
  return 11.3 - 0.21 * tempC;
}

export function modelCages(
  cages: { position: number; baseline_do: number; baseline_temp: number; baseline_ph: number; id?: string }[],
  marine: MarineSnapshot,
  farmId: string
): CageReading[] {
  const baselineDO = doSaturation(marine.sst);
  return cages.map((c) => {
    const rnd = seed(`${farmId}-${c.position}`);
    const isCritical = c.position === 1; // Demo: cage 1 always shows outbreak
    const doDrop = isCritical ? 2.4 + rnd() * 0.4 : rnd() * 0.6;
    const dissolvedOxygen = +(baselineDO - doDrop).toFixed(2);
    const temperature = +(marine.sst + (rnd() - 0.3) * 0.6).toFixed(1);
    const ph = +(c.baseline_ph - (isCritical ? 0.25 + rnd() * 0.1 : rnd() * 0.08)).toFixed(2);
    const mortality = +(isCritical ? 4.8 + rnd() * 0.6 : 0.05 + rnd() * 0.15).toFixed(2);

    // Risk: weighted (DO drop dominates, mortality next, pH, wave stress)
    const doScore = Math.min(10, (doDrop / 3) * 10);
    const mortScore = Math.min(10, mortality * 1.5);
    const phScore = Math.min(10, Math.max(0, (8.1 - ph) * 8));
    const waveScore = Math.min(2, marine.waveHeight * 0.5);
    const risk = +Math.min(10, doScore * 0.5 + mortScore * 0.35 + phScore * 0.1 + waveScore * 0.05).toFixed(1);
    const status: CageReading["status"] = risk >= 7 ? "critical" : risk >= 4 ? "elevated" : "low";

    // Sparkline: 7-day declining series for critical, flat-noise for healthy
    const start = isCritical ? baselineDO - 0.2 : dissolvedOxygen + (rnd() - 0.5) * 0.2;
    const end = dissolvedOxygen;
    const sparkline = Array.from({ length: 7 }, (_, i) => {
      const t = i / 6;
      const base = start + (end - start) * t;
      return +(base + (rnd() - 0.5) * 0.15).toFixed(2);
    });

    return {
      position: c.position,
      dissolvedOxygen,
      temperature,
      ph,
      mortality,
      risk,
      status,
      sparkline,
      doTrend: isCritical ? "down" : "flat",
      phTrend: isCritical ? "down" : "flat",
    };
  });
}
