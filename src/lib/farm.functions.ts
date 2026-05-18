import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchMarine, modelCages, type CageReading, type MarineSnapshot } from "./marine";
import { getNearbyZones, type NearbyZone } from "./barentswatch";

export type FarmDashboard = {
  farm: {
    id: string;
    name: string;
    license: string | null;
    species: string;
    latitude: number;
    longitude: number;
    cage_count: number;
    fish_per_cage: number;
  };
  marine: MarineSnapshot;
  cages: (CageReading & { fish_count: number; id: string })[];
  totals: {
    fish: number;
    critical: number;
    estimatedLossEUR: number;
  };
  nearbyZones: NearbyZone[];
};

export const getMyFarm = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: farm } = await supabase.from("farms").select("*").limit(1).maybeSingle();
    return farm
      ? {
          id: farm.id,
          name: farm.name,
          license: farm.license,
          species: farm.species,
          latitude: farm.latitude,
          longitude: farm.longitude,
          cage_count: farm.cage_count,
          fish_per_cage: farm.fish_per_cage,
        }
      : null;
  });

export const createFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      name: z.string().min(1).max(120),
      license: z.string().max(60).optional().nullable(),
      species: z.string().max(80).default("Atlantic Salmon (Salmo salar)"),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      cage_count: z.number().int().min(1).max(60),
      fish_per_cage: z.number().int().min(100).max(200000),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: farm, error } = await supabase
      .from("farms")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error || !farm) throw new Error(error?.message ?? "Failed to create farm");

    const cageRows = Array.from({ length: data.cage_count }, (_, i) => ({
      farm_id: farm.id,
      position: i + 1,
      fish_count: data.fish_per_cage,
    }));
    const { error: ce } = await supabase.from("cages").insert(cageRows);
    if (ce) throw new Error(ce.message);
    return { id: farm.id };
  });

export const getFarmDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FarmDashboard | null> => {
    const { supabase } = context;
    const { data: farm } = await supabase.from("farms").select("*").limit(1).maybeSingle();
    if (!farm) return null;
    const { data: cageRows } = await supabase
      .from("cages")
      .select("*")
      .eq("farm_id", farm.id)
      .order("position");

    const marine = await fetchMarine(farm.latitude, farm.longitude);
    const modeled = modelCages(
      (cageRows ?? []).map((c) => ({
        position: c.position,
        baseline_do: c.baseline_do,
        baseline_temp: c.baseline_temp,
        baseline_ph: c.baseline_ph,
        id: c.id,
      })),
      marine,
      farm.id
    );
    const enriched = modeled.map((m, i) => ({
      ...m,
      id: cageRows?.[i]?.id ?? "",
      fish_count: cageRows?.[i]?.fish_count ?? farm.fish_per_cage,
    }));
    const critical = enriched.filter((c) => c.status === "critical").length;
    const fishAtRisk = enriched.filter((c) => c.status !== "low").reduce((a, c) => a + c.fish_count, 0);
    // Salmon market value (Fish Pool 2024 avg ~ €8.40 / kg, 5kg harvest weight): €42/fish
    const estimatedLossEUR = Math.round(fishAtRisk * 42);

    return {
      farm: {
        id: farm.id,
        name: farm.name,
        license: farm.license,
        species: farm.species,
        latitude: farm.latitude,
        longitude: farm.longitude,
        cage_count: farm.cage_count,
        fish_per_cage: farm.fish_per_cage,
      },
      marine,
      cages: enriched,
      totals: {
        fish: enriched.reduce((a, c) => a + c.fish_count, 0),
        critical,
        estimatedLossEUR,
      },
      nearbyZones: getNearbyZones(farm.latitude, farm.longitude, 5),
    };
  });
