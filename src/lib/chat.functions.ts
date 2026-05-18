import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchMarine, modelCages } from "./marine";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const SYSTEM_PROMPT = `You are AquaSense AI — a senior aquaculture veterinary analyst embedded in a live salmon-farm monitoring platform. The farmer is paying for decisions, not chit-chat.

NON-NEGOTIABLE RULES:
1. Every answer MUST end with a section titled "Recommended action" containing 2–5 numbered, imperative, time-bound steps the farmer can do TODAY. Example steps: "1. Stop feeding Cage 3 for 24h.", "2. Deploy aeration diffuser to raise DO above 8 mg/L within 6h.", "3. Send 5 moribund fish to lab X for PCR (Pasteurella skyensis, ISA, SAV).", "4. Reduce stocking density in Cage 3 by 15% via partial transfer to Cage 5."
2. Cite concrete numbers from FARM_CONTEXT (cage #, DO mg/L, temp °C, pH, mortality %) and live sea data. Never invent values.
3. NEVER include hyperlinks or URLs. Reference sources by name only (e.g. "Fiskehelserapporten 2023"). Inventing a link is a critical failure.
4. Format with Markdown: use "## Heading", "- bullet", and **bold** for numbers and disease names — these will render as styled text, not raw characters.
5. Be direct. No filler ("Great question", "I'd be happy to"). No hedging beyond stating real uncertainty with a number ("65% confidence").
6. If the data can't answer the question, say exactly what sensor reading or lab test is missing, and how to get it.

Domain knowledge (cite by name when relevant):
- Pasteurellosis (Pasteurella skyensis): leading mortality cause in Norwegian salmon 2022–2024. Treatment: florfenicol 10 mg/kg via medicated feed for 10 days; vaccinate naïve cages.
- ISA (Infectious Salmon Anemia): notifiable disease — immediate slaughter + Mattilsynet (Norwegian Food Safety Authority) report required.
- AGD (Amoebic Gill Disease): freshwater bath 2–3h or H2O2 1,200–1,800 ppm for 20 min.
- Sea lice (Lepeophtheirus salmonis): legal threshold in NO is 0.5 adult female lice/fish; above that requires treatment within 14 days.
- DO < 7 mg/L = stress, DO < 6 mg/L at 12°C+ = mortality within hours. Aeration or partial cage transfer is the fastest intervention.
- pH drop > 0.2 over 14 days correlates with bacterial gill disease.
- Reference: Fiskehelserapporten 2023 (Veterinærinstituttet) — 16.7% national mortality, ~62M fish lost.
- Reference: Fish Pool spot price 2024 — €8.40/kg, harvest weight ~5 kg → ~€42/fish.`;

export const chatWithFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ messages: z.array(MessageSchema).min(1).max(40) }))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
    const { supabase } = context;

    const { data: farm } = await supabase.from("farms").select("*").limit(1).maybeSingle();
    let farmBlock = "No farm configured yet.";
    if (farm) {
      const { data: cageRows } = await supabase
        .from("cages").select("*").eq("farm_id", farm.id).order("position");
      const marine = await fetchMarine(farm.latitude, farm.longitude);
      const modeled = modelCages(
        (cageRows ?? []).map((c) => ({
          position: c.position,
          baseline_do: c.baseline_do,
          baseline_temp: c.baseline_temp,
          baseline_ph: c.baseline_ph,
        })),
        marine, farm.id
      );
      farmBlock = `FARM: ${farm.name} (${farm.license ?? "no license"})
Species: ${farm.species}
Location: ${farm.latitude.toFixed(3)}, ${farm.longitude.toFixed(3)}
Live sea data (Open-Meteo): SST ${marine.sst.toFixed(1)}°C, wave ${marine.waveHeight.toFixed(1)}m, wind ${marine.windSpeed.toFixed(1)}m/s
Cages:
${modeled.map((c) => `  Cage ${c.position}: risk ${c.risk}/10 (${c.status}), DO ${c.dissolvedOxygen} mg/L, temp ${c.temperature}°C, pH ${c.ph}, mortality ${c.mortality}%`).join("\n")}`;
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: `FARM_CONTEXT:\n${farmBlock}` },
          ...data.messages,
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      if (upstream.status === 429) throw new Error("Rate limit reached. Please wait a moment.");
      if (upstream.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(`AI gateway error ${upstream.status}: ${text.slice(0, 200)}`);
    }
    const json = await upstream.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "";
    return { reply };
  });
