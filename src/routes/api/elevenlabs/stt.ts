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
        const blob = audio as Blob;
        if (blob.size > 10 * 1024 * 1024) {
          return Response.json({ error: "audio too large (>10MB)" }, { status: 413 });
        }

        const upstreamForm = new FormData();
        upstreamForm.append("file", audio, "speech.webm");
        upstreamForm.append("model_id", "scribe_v2");
        upstreamForm.append("tag_audio_events", "false");
        upstreamForm.append("diarize", "false");

        const upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": apiKey },
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
