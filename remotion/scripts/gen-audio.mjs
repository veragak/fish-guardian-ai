// Generate voiceover + motivational music via ElevenLabs.
// Outputs:
//   remotion/public/voiceover.mp3
//   remotion/public/music.mp3
//   remotion/public/audio-meta.json  (voiceover duration in seconds)
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "../public");
await fs.mkdir(PUBLIC, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("ELEVENLABS_API_KEY missing");

// ---- Narration script (~120s @ ~150wpm) ----
const NARRATION = `In Norway's coldest fjords, sixty-two million salmon died last year. Not from predators. Not from storms. From disease that nobody saw coming.

By the time farmers spot the warning signs, it is already too late. Entire pens are lost in days. Nine hundred and forty million euros — gone. Every single year.

We knew there had to be a better way. So we built one.

This is AquaSense. We detect fish disease forty-eight hours before it becomes visible.

How? Four live signals from every cage, every minute. Dissolved oxygen. Sea temperature. pH levels. Mortality rate. Our AI watches the patterns humans miss.

When risk rises in a single cage, farmers get an alert on their phone — in time to act. Isolate the cage. Adjust feeding. Call the vet. Save the fish.

Our what-if simulator shows the difference clearly. Act in forty-eight hours, only three percent loss. Wait twelve hours, thirty-four percent. Do nothing — ninety-two percent of the cage is gone.

This is not just technology. This is the future of aquaculture. Built for the farmers who feed the world. For an industry worth twenty billion euros. For oceans that deserve smarter care.

AquaSense. Fifteen hundred euros per cage, per year. Pilots launch in Q2 twenty twenty-six. Commercial rollout in Q1 twenty twenty-seven.

Built by Vera, Maggie, and Rishi. Because losing sixty-two million salmon a year is not a future we accept.

Visit aquasense dot app. Let's protect what feeds us.`;

// ---- 1. Voiceover (Brian — warm, motivational) ----
const VOICE_ID = "nPczCjzI2devNBz1zQrb"; // Brian
console.log("Generating voiceover...");
const ttsRes = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: NARRATION,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.55,
        use_speaker_boost: true,
        speed: 1.0,
      },
    }),
  }
);
if (!ttsRes.ok) throw new Error(`TTS failed: ${ttsRes.status} ${await ttsRes.text()}`);
const ttsBuf = Buffer.from(await ttsRes.arrayBuffer());
await fs.writeFile(path.join(PUBLIC, "voiceover.mp3"), ttsBuf);
console.log(`  voiceover.mp3 — ${(ttsBuf.length / 1024).toFixed(0)} KB`);

// ---- 2. Music (motivational cinematic instrumental, ~125s) ----
console.log("Generating music...");
const MUSIC_PROMPT =
  "Uplifting cinematic motivational instrumental for a tech startup pitch video. Soft inspiring piano intro that builds into warm orchestral strings, gentle electronic pulse, and hopeful uplifting crescendo. Hopeful, optimistic, modern, polished. No vocals. Ocean-inspired, calm but powerful and building.";
const musicRes = await fetch("https://api.elevenlabs.io/v1/music", {
  method: "POST",
  headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: MUSIC_PROMPT,
    music_length_ms: 125000,
  }),
});
if (!musicRes.ok) throw new Error(`Music failed: ${musicRes.status} ${await musicRes.text()}`);
const musicBuf = Buffer.from(await musicRes.arrayBuffer());
await fs.writeFile(path.join(PUBLIC, "music.mp3"), musicBuf);
console.log(`  music.mp3 — ${(musicBuf.length / 1024).toFixed(0)} KB`);

// ---- 3. Measure voiceover duration via ffprobe ----
const voPath = path.join(PUBLIC, "voiceover.mp3");
const probe = execSync(
  `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voPath}"`
).toString().trim();
const durationSec = parseFloat(probe);
console.log(`  voiceover duration: ${durationSec.toFixed(2)}s`);

await fs.writeFile(
  path.join(PUBLIC, "audio-meta.json"),
  JSON.stringify({ voiceoverDurationSec: durationSec }, null, 2)
);
console.log("Done.");
