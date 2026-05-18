import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchMarine, modelCages } from "./marine";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const SYSTEM_PROMPT = `You are AquaSense AI, an expert aquaculture veterinary analyst embedded in a salmon-farm monitoring platform.

You always answer with concrete numbers tied to the user's farm. Reference cage numbers, dissolved oxygen (DO) in mg/L, temperature in °C, pH, and mortality % from the FARM_CONTEXT block.

Knowledge base (cite when relevant):
- Pasteurellosis caused by Pasteurella skyensis is a leading mortality driver in Norwegian salmon farms (Norwegian Veterinary Institute, Fiskehelserapporten 2023).
- Norwegian farmed salmon mortality reached 16.7% (~62 million fish) in 2023 — the worst on record (Veterinærinstituttet, 2024).
- DO below 7 mg/L causes acute stress; below 6 mg/L causes mortality within hours at 12°C+.
- pH drops of >0.2 over 14 days correlate with gill bacterial outbreaks.
- Fish Pool spot price for Atlantic salmon averaged €8.40/kg in 2024; harvest weight ~5kg → €42/fish.

Style: short, direct, structured. Use bullet points and bold key numbers. Never invent data not in FARM_CONTEXT. If the user asks something the data can't answer, say so and recommend a sensor or check.`;

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
