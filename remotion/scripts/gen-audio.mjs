// Per-scene voiceover chunks → exact sync with visuals.
// Outputs:
//   remotion/public/voiceover.mp3   (concatenated, with small gaps)
//   remotion/public/music.mp3       (length-matched motivational instrumental)
//   remotion/src/scene-timing.ts    (per-scene frame durations consumed by MainVideo)
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "../public");
const SRC = path.resolve(__dirname, "../src");
const TMP = path.resolve(__dirname, "../.tmp-audio");
await fs.mkdir(PUBLIC, { recursive: true });
await fs.mkdir(TMP, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("ELEVENLABS_API_KEY missing");

const FPS = 30;
const VOICE_ID = "nPczCjzI2devNBz1zQrb"; // Brian — warm motivational
const GAP_SEC = 0.55; // small breathing room between scenes
const PAD_END_SEC = 3.8; // tail after final line — ensures "now" finishes cleanly
const TARGET_TOTAL_SEC = 122; // ~2:02 so final words have room

// ---- Per-scene narration (1 chunk per scene, matches the visuals) ----
const CHUNKS = [
  "In Norway's coldest fjords, sixty-two million salmon died last year. Not from predators. Not from storms. From disease that nobody saw coming. Entire farms, wiped out overnight.",
  "By the time farmers spot the warning signs, it is already too late. Whole pens are lost in days. Decades of work, gone in a single week.",
  "Nine hundred and forty million euros — lost to disease every single year. In Norwegian salmon farming alone.",
  "There had to be a better way. So we built one.",
  "This is AquaSense. We detect fish disease forty-eight hours before it becomes visible. Two full days of warning, where today there is none.",
  "Four live signals, from every cage, every minute. Dissolved oxygen. Sea temperature. pH levels. Mortality rate. Our AI watches the patterns humans miss.",
  "When risk rises in a single cage, farmers get an instant alert on their phone. Pinpointing the exact cage that needs attention.",
  "Forty-eight hours of head start. Time to isolate the cage, adjust feeding, call the vet, and save the fish.",
  "Act in forty-eight hours, only three percent loss. Wait twelve hours, thirty-four percent. Do nothing, and ninety-two percent of the cage is gone. Early action saves the fish, and saves the farm.",
  "A twenty billion euro global industry, racing to feed a growing planet. Built for the farmers who are doing it.",
  "So what comes next? Our road ahead starts with partnering with a handful of pilot farms, where we train and refine our model under real ocean conditions. From there, we roll out gradually, earning trust one farm at a time. Step by step, fjord by fjord, until every farmer, everywhere, has the warning they truly deserve.",
  "AquaSense. Let's protect what feeds us. Built with care by Vera, Maggie, and Rishi. The future of aquaculture starts now. Visit aquasense dot app.",
];

// ---- Helper ----
async function tts(text, prev, next, idx) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        previous_text: prev || undefined,
        next_text: next || undefined,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.45,
          use_speaker_boost: true,
          speed: 1.0, // regular pace
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`TTS ${idx} failed: ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function probeDur(file) {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
  ).toString().trim();
  return parseFloat(out);
}

// ---- 1. Generate all chunks (batched to respect concurrency limit) ----
console.log("Generating", CHUNKS.length, "voice chunks...");
const BATCH = 4;
const buffers = new Array(CHUNKS.length);
for (let i = 0; i < CHUNKS.length; i += BATCH) {
  const batch = CHUNKS.slice(i, i + BATCH);
  const out = await Promise.all(
    batch.map((text, j) => tts(text, CHUNKS[i + j - 1] || "", CHUNKS[i + j + 1] || "", i + j))
  );
  out.forEach((b, j) => (buffers[i + j] = b));
}

// Save raw, then re-encode each chunk to a clean 44.1kHz stereo MP3 with a tiny
// fade in/out so concat boundaries don't click or truncate the last phoneme.
const chunkDurations = [];
const chunkPaths = [];
for (let i = 0; i < buffers.length; i++) {
  const raw = path.join(TMP, `raw-${String(i).padStart(2, "0")}.mp3`);
  await fs.writeFile(raw, buffers[i]);
  const rawDur = probeDur(raw);
  const p = path.join(TMP, `chunk-${String(i).padStart(2, "0")}.mp3`);
  // 40ms fade in + 60ms fade out, normalized sample rate, append 120ms of silence
  // inside the chunk so the trailing consonant is never clipped by the concat seam.
  const fadeOutStart = Math.max(0, rawDur - 0.06).toFixed(3);
  execSync(
    `ffmpeg -y -i "${raw}" -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k -af "afade=t=in:st=0:d=0.04,afade=t=out:st=${fadeOutStart}:d=0.06,apad=pad_dur=0.12" "${p}" 2>/dev/null`
  );
  const d = probeDur(p);
  chunkDurations.push(d);
  chunkPaths.push(p);
  console.log(`  chunk ${i + 1}: ${d.toFixed(2)}s — "${CHUNKS[i].slice(0, 60)}..."`);
}

const speechTotal = chunkDurations.reduce((a, b) => a + b, 0);
const baseGapsTotal = GAP_SEC * (CHUNKS.length - 1) + PAD_END_SEC;
const baselineTotal = speechTotal + baseGapsTotal;
console.log(`Baseline total: ${baselineTotal.toFixed(2)}s (target ${TARGET_TOTAL_SEC}s)`);

// Distribute remaining time to reach exactly 120s by lengthening per-scene gaps.
// Each scene_i gap_i = base + extra (only after non-last scenes).
const remaining = Math.max(0, TARGET_TOTAL_SEC - baselineTotal);
const extraPerGap = remaining / (CHUNKS.length - 1);
console.log(`Extra padding per gap: ${extraPerGap.toFixed(3)}s`);

// ---- 2. Build silence files (one per gap) ----
async function makeSilence(seconds, outPath) {
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t ${seconds.toFixed(3)} -q:a 9 -acodec libmp3lame "${outPath}" 2>/dev/null`
  );
}

// Build the concat list: chunk, silence, chunk, silence, ..., chunk, tailSilence
const listLines = [];
for (let i = 0; i < chunkPaths.length; i++) {
  listLines.push(`file '${chunkPaths[i]}'`);
  if (i < chunkPaths.length - 1) {
    // Hold the road-ahead scene longer before the AquaSense outro lands.
    const extraHold = i === 10 ? 2.0 : i === 9 ? 1.8 : 0;
    const gap = GAP_SEC + extraPerGap + extraHold;
    const silPath = path.join(TMP, `gap-${String(i).padStart(2, "0")}.mp3`);
    await makeSilence(gap, silPath);
    listLines.push(`file '${silPath}'`);
  }
}
const tailPath = path.join(TMP, "tail.mp3");
await makeSilence(PAD_END_SEC, tailPath);
listLines.push(`file '${tailPath}'`);

const listPath = path.join(TMP, "concat.txt");
await fs.writeFile(listPath, listLines.join("\n"));

// ---- 3. Concat into final voiceover (re-encode to eliminate frame-boundary clicks) ----
const voPath = path.join(PUBLIC, "voiceover.mp3");
execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k -af "aresample=44100,afade=t=in:st=0:d=0.05" "${voPath}" 2>/dev/null`);
const voDur = probeDur(voPath);
console.log(`Final voiceover: ${voDur.toFixed(2)}s`);
console.log(`Final voiceover: ${voDur.toFixed(2)}s`);

// ---- 4. Per-scene frame durations ----
// scene_i covers chunk_i + the gap that follows it (or final pad)
const sceneSeconds = chunkDurations.map((d, i) => {
  if (i === chunkDurations.length - 1) return d + PAD_END_SEC;
  const extraHold = i === 10 ? 2.0 : i === 9 ? 1.8 : 0;
  return d + GAP_SEC + extraPerGap + extraHold;
});
const sceneFrames = sceneSeconds.map((s) => Math.round(s * FPS));
const totalFrames = sceneFrames.reduce((a, b) => a + b, 0);
console.log(
  `Scene frames: [${sceneFrames.join(", ")}] = ${totalFrames} frames (${(totalFrames / FPS).toFixed(2)}s)`
);

await fs.writeFile(
  path.join(SRC, "scene-timing.ts"),
  `// AUTO-GENERATED by scripts/gen-audio.mjs — do not edit by hand.
export const SCENE_DURS: readonly number[] = ${JSON.stringify(sceneFrames)};
export const TOTAL_FRAMES = ${totalFrames};
`
);

// ---- 5. Music: length-matched motivational instrumental ----
console.log("Generating music...");
const musicMs = Math.min(180000, Math.round((totalFrames / FPS + 2) * 1000));
const musicRes = await fetch("https://api.elevenlabs.io/v1/music", {
  method: "POST",
  headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt:
      "Uplifting cinematic motivational instrumental for a tech startup pitch video. Soft inspiring piano intro that builds into warm orchestral strings, gentle electronic pulse, and a hopeful uplifting crescendo. Hopeful, optimistic, modern, polished. No vocals. Ocean-inspired, calm but powerful and building.",
    music_length_ms: musicMs,
  }),
});
if (!musicRes.ok) throw new Error(`Music failed: ${musicRes.status} ${await musicRes.text()}`);
await fs.writeFile(path.join(PUBLIC, "music.mp3"), Buffer.from(await musicRes.arrayBuffer()));
console.log("Music saved.");

console.log("\nAll set.");
