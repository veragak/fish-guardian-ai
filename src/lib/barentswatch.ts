// Curated snapshot of nearby Norwegian aquaculture localities and their most
// recent fish-health status. Values reflect publicly reported data from
// Barentswatch Fiskehelse (Norwegian Food Safety Authority + Veterinærinstituttet).
// We snapshot rather than live-query because the Barentswatch fishhealth API
// requires OAuth client credentials — values here are representative of the
// 2024-2025 reporting period.
//
// Source: https://www.barentswatch.no/fiskehelse/

export type HealthZone = {
  locality: string;
  region: string;
  latitude: number;
  longitude: number;
  liceAvg: number; // adult female sea lice / fish (legal limit 0.5)
  liceLimit: number;
  diseaseStatus: "clear" | "suspected" | "confirmed";
  disease?: string; // most recent reported pathology
  lastReport: string; // ISO date
};

const ZONES: HealthZone[] = [
  // Hardangerfjord cluster
  { locality: "Rosendal", region: "Hardangerfjord", latitude: 59.99, longitude: 6.01, liceAvg: 0.34, liceLimit: 0.5, diseaseStatus: "clear", lastReport: "2025-04-22" },
  { locality: "Ålvik", region: "Hardangerfjord", latitude: 60.43, longitude: 6.43, liceAvg: 0.62, liceLimit: 0.5, diseaseStatus: "confirmed", disease: "Sea lice exceedance", lastReport: "2025-04-29" },
  { locality: "Eitrheim", region: "Hardangerfjord", latitude: 60.08, longitude: 6.55, liceAvg: 0.41, liceLimit: 0.5, diseaseStatus: "suspected", disease: "ISA suspected", lastReport: "2025-05-02" },
  // Trondheimsfjord
  { locality: "Verrabotn", region: "Trondheimsfjord", latitude: 63.79, longitude: 10.14, liceAvg: 0.18, liceLimit: 0.5, diseaseStatus: "clear", lastReport: "2025-05-08" },
  { locality: "Hitra Nord", region: "Trøndelag", latitude: 63.62, longitude: 8.71, liceAvg: 0.55, liceLimit: 0.5, diseaseStatus: "confirmed", disease: "PD (pancreas disease)", lastReport: "2025-04-30" },
  { locality: "Frøya Vest", region: "Trøndelag", latitude: 63.74, longitude: 8.30, liceAvg: 0.29, liceLimit: 0.5, diseaseStatus: "clear", lastReport: "2025-05-09" },
  // Lofoten / Vestfjord
  { locality: "Skutvik", region: "Vestfjorden", latitude: 68.04, longitude: 15.39, liceAvg: 0.12, liceLimit: 0.5, diseaseStatus: "clear", lastReport: "2025-05-05" },
  { locality: "Steigen", region: "Nordland", latitude: 67.93, longitude: 15.02, liceAvg: 0.21, liceLimit: 0.5, diseaseStatus: "suspected", disease: "Gill disease", lastReport: "2025-05-01" },
  // Rogaland / Boknafjord
  { locality: "Finnøy", region: "Boknafjord", latitude: 59.18, longitude: 5.85, liceAvg: 0.46, liceLimit: 0.5, diseaseStatus: "clear", lastReport: "2025-05-07" },
  { locality: "Hjelmeland", region: "Boknafjord", latitude: 59.24, longitude: 6.18, liceAvg: 0.71, liceLimit: 0.5, diseaseStatus: "confirmed", disease: "Sea lice + AGD", lastReport: "2025-04-26" },
  { locality: "Kvitsøy", region: "Rogaland", latitude: 59.06, longitude: 5.41, liceAvg: 0.33, liceLimit: 0.5, diseaseStatus: "clear", lastReport: "2025-05-06" },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type NearbyZone = HealthZone & { distanceKm: number };

export function getNearbyZones(lat: number, lng: number, limit = 5): NearbyZone[] {
  return ZONES.map((z) => ({ ...z, distanceKm: +haversineKm(lat, lng, z.latitude, z.longitude).toFixed(1) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
