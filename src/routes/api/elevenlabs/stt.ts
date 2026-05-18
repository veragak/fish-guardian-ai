import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/elevenlabs/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
        }

        const form = await request.formData();
        const audio = form.get("audio");
        if (!audio || typeof audio === "string") {
          return Response.json({ error: "audio file required (field 'audio')" }, { status: 400 });
        }
        const incoming = audio as File;
        if (incoming.size < 3000) {
          return Response.json({ error: "audio too short — click the mic, speak for a second, then click stop" }, { status: 400 });
        }
        if (incoming.size > 10 * 1024 * 1024) {
          return Response.json({ error: "audio too large (>10MB)" }, { status: 413 });
        }

        // Preserve original mime type & pick a matching extension so ElevenLabs can decode it.
        const mime = incoming.type || "audio/webm";
        const ext = mime.includes("wav") ? "wav"
          : mime.includes("ogg") ? "ogg"
          : mime.includes("mp4") || mime.includes("m4a") ? "m4a"
          : mime.includes("mpeg") || mime.includes("mp3") ? "mp3"
          : "webm";
        const bytes = await incoming.arrayBuffer();
        const rebuilt = new File([bytes], `speech.${ext}`, { type: mime });

        const upstreamForm = new FormData();
        upstreamForm.append("file", rebuilt);
        upstreamForm.append("model_id", "scribe_v1");

        const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Accept": "application/json" },
          body: upstreamForm,
        });

        if (!upstream.ok) {
          const err = await upstream.text();
          return Response.json({ error: err.slice(0, 300) || `STT failed: ${upstream.status}` }, { status: upstream.status });
        }

        const json = await upstream.json();
        const text: string = typeof json?.text === "string" ? json.text : "";
        return Response.json({ text });
      },
    },
  },
});
