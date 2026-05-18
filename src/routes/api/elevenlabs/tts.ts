import { createFileRoute } from "@tanstack/react-router";

// George — a clear, calm male voice well-suited for safety/operations alerts.
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

export const Route = createFileRoute("/api/elevenlabs/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: { text?: unknown; voiceId?: unknown };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const text = typeof body.text === "string" ? body.text.trim() : "";
        if (!text || text.length > 1500) {
          return new Response(JSON.stringify({ error: "text required (1–1500 chars)" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const voiceId = typeof body.voiceId === "string" && body.voiceId ? body.voiceId : DEFAULT_VOICE_ID;

        const upstream = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_turbo_v2_5",
              voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true, speed: 1.0 },
            }),
          },
        );

        if (!upstream.ok) {
          const err = await upstream.text();
          return new Response(JSON.stringify({ error: err.slice(0, 300) || `TTS failed: ${upstream.status}` }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const audio = await upstream.arrayBuffer();
        return new Response(audio, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
