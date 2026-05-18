import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Shared sandbox account that anyone can sign into via /demo.
// Read-only nature is enforced by the seeded data — RLS still scopes to this user.
export const DEMO_EMAIL = "demo@aquasense.app";
export const DEMO_PASSWORD = "aquademo-public-2025";

const DEMO_FARM = {
  name: "Hardangerfjord Demo Farm",
  license: "NO-DEMO-001",
  species: "Atlantic Salmon (Salmo salar)",
  latitude: 60.1,
  longitude: 6.0,
  cage_count: 6,
  fish_per_cage: 30000,
};

export const ensureDemoAccount = createServerFn({ method: "POST" })
  .handler(async (): Promise<{ email: string; password: string }> => {
    // 1. Find or create the demo user.
    let userId: string | null = null;
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: "Demo Operator" },
      });
      if (error || !created.user) {
        throw new Error(error?.message ?? "Failed to create demo user");
      }
      userId = created.user.id;
    }

    // 2. Ensure a farm exists for the demo user.
    const { data: farms } = await supabaseAdmin
      .from("farms")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    if (!farms || farms.length === 0) {
      const { data: farm, error: fe } = await supabaseAdmin
        .from("farms")
        .insert({ ...DEMO_FARM, user_id: userId })
        .select()
        .single();
      if (fe || !farm) throw new Error(fe?.message ?? "Failed to seed demo farm");
      const cageRows = Array.from({ length: DEMO_FARM.cage_count }, (_, i) => ({
        farm_id: farm.id,
        position: i + 1,
        fish_count: DEMO_FARM.fish_per_cage,
      }));
      const { error: ce } = await supabaseAdmin.from("cages").insert(cageRows);
      if (ce) throw new Error(ce.message);
    }

    return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
  });
