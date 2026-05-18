import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles, Mic, Square, Volume2, VolumeX, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth-context";
import { chatWithFarm } from "@/lib/chat.functions";

type WindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function mergeFloat32Chunks(chunks: Float32Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function downsampleBuffer(samples: Float32Array, inputSampleRate: number, targetSampleRate = 16000) {
  if (inputSampleRate <= targetSampleRate) return samples;

  const ratio = inputSampleRate / targetSampleRate;
  const length = Math.round(samples.length / ratio);
  const downsampled = new Float32Array(length);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < downsampled.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < samples.length; i += 1) {
      accum += samples[i];
      count += 1;
    }

    downsampled[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return downsampled;
}

function encodeWavBlob(chunks: Float32Array[], inputSampleRate: number) {
  const merged = mergeFloat32Chunks(chunks);
  const samples = downsampleBuffer(merged, inputSampleRate);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 16000 * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — AquaSense" }] }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's happening in Cage 1?",
  "Which cages are highest risk right now?",
  "What's the financial exposure if I do nothing?",
  "What action do you recommend in the next 24 hours?",
];

function AssistantPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const send = useServerFn(chatWithFarm);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi — I'm AquaSense AI. I can see your live cage data, sea conditions, and risk scores. What would you like to investigate?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState<boolean>(() => typeof window !== "undefined" && localStorage.getItem("aquasense.voice") === "on");
  const [startingRecording, setStartingRecording] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(16000);
  const heardAudioRef = useRef(false);
  const recordingActiveRef = useRef(false);
  const recordingTimerRef = useRef<number | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const speak = useCallback(async (text: string) => {
    try {
      // Strip markdown so the voice reads cleanly.
      const clean = text.replace(/[#*_`>]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").replace(/\n{2,}/g, ". ").slice(0, 1400);
      const res = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); }
      const a = new Audio(url);
      ttsAudioRef.current = a;
      await a.play();
    } catch { /* ignore TTS errors */ }
  }, []);

  const submit = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setBusy(true);
    try {
      const { reply } = await send({ data: { messages: next.map((m) => ({ role: m.role, content: m.content })) } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (voiceOn) speak(reply);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI request failed");
    } finally { setBusy(false); }
  }, [input, busy, messages, send, voiceOn, speak]);

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    localStorage.setItem("aquasense.voice", next ? "on" : "off");
    if (!next && ttsAudioRef.current) ttsAudioRef.current.pause();
  };

  const recordStartRef = useRef<number>(0);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const cleanupRecording = useCallback(async () => {
    clearRecordingTimer();
    recordingActiveRef.current = false;

    processorRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    monitorGainRef.current?.disconnect();

    processorRef.current = null;
    sourceNodeRef.current = null;
    monitorGainRef.current = null;

    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        /* noop */
      }
      audioContextRef.current = null;
    }
  }, [clearRecordingTimer]);

  useEffect(() => () => {
    void cleanupRecording();
    clearRecordingTimer();
    ttsAudioRef.current?.pause();
  }, [cleanupRecording, clearRecordingTimer]);

  const startRecording = async () => {
    if (recording || startingRecording || busy || transcribing) return;
    setError(null);
    setStartingRecording(true);
    try {
      if (audioContextRef.current || audioStreamRef.current) {
        await cleanupRecording();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const AudioContextCtor = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;

      if (!AudioContextCtor) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const context = new AudioContextCtor();
      if (context.state === "suspended") {
        await context.resume();
      }

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(1024, 1, 1);
      const monitorGain = context.createGain();
      monitorGain.gain.value = 0;

      pcmChunksRef.current = [];
      sampleRateRef.current = context.sampleRate;
      heardAudioRef.current = false;
      recordingActiveRef.current = true;

      processor.onaudioprocess = (event) => {
        if (!recordingActiveRef.current) return;

        const input = event.inputBuffer.getChannelData(0);
        const copy = new Float32Array(input.length);
        copy.set(input);
        pcmChunksRef.current.push(copy);

        let peak = 0;
        let energy = 0;
        for (let i = 0; i < input.length; i += 1) {
          const amplitude = Math.abs(input[i]);
          peak = Math.max(peak, amplitude);
          energy += amplitude * amplitude;
        }
        const rms = Math.sqrt(energy / input.length);
        if (peak > 0.006 || rms > 0.002) {
          heardAudioRef.current = true;
        }
      };

      source.connect(processor);
      processor.connect(monitorGain);
      monitorGain.connect(context.destination);

      audioStreamRef.current = stream;
      audioContextRef.current = context;
      sourceNodeRef.current = source;
      processorRef.current = processor;
      monitorGainRef.current = monitorGain;

      recordStartRef.current = Date.now();
      setRecordingSeconds(0);
      clearRecordingTimer();
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(Math.max(0, Math.floor((Date.now() - recordStartRef.current) / 1000)));
      }, 250);
      setRecording(true);
    } catch (e: unknown) {
      await cleanupRecording();
      setRecording(false);
      if (e instanceof DOMException) {
        if (e.name === "NotAllowedError") setError("Microphone access is blocked — allow mic access in your browser and try again.");
        else if (e.name === "NotFoundError") setError("No microphone was found on this device.");
        else if (e.name === "NotReadableError") setError("Your microphone is busy in another app or browser tab.");
        else setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "Microphone permission denied or unavailable.");
      }
    } finally {
      setStartingRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    const elapsed = Date.now() - recordStartRef.current;
    const doStop = async () => {
      setRecording(false);
      clearRecordingTimer();
      setRecordingSeconds(Math.max(1, Math.round(elapsed / 1000)));
      recordingActiveRef.current = false;

      const chunks = [...pcmChunksRef.current];
      await cleanupRecording();
      const blob = encodeWavBlob(chunks, sampleRateRef.current);

      if (elapsed < 700 || blob.size < 2500) {
        setError("Recording was too short — click the mic, speak, then click stop.");
        return;
      }

      setTranscribing(true);
      try {
        const form = new FormData();
        form.append("audio", blob, "speech.wav");
        const res = await fetch("/api/elevenlabs/stt", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? `STT ${res.status}`);
        const text: string = (json.text ?? "").trim();
        if (text) submit(text);
        else setError("Couldn't hear anything — try again a bit louder.");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Transcription failed");
      } finally {
        setTranscribing(false);
      }
    };

    if (elapsed < 700) {
      window.setTimeout(() => { void doStop(); }, 700 - elapsed);
    } else {
      void doStop();
    }
  };

  if (loading || !user) return <div className="bg-navy text-white/70 min-h-[calc(100vh-4rem)] grid place-items-center">Loading…</div>;

  return (
    <div className="bg-navy text-navy-foreground min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-md bg-primary/15 text-primary"><Sparkles className="w-5 h-5" /></div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">AquaSense AI Assistant</h1>
            <p className="text-sm text-white/60">Reads your live cage data and sea conditions before every answer</p>
          </div>
          <button
            onClick={toggleVoice}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-2.5 py-1.5"
            title={voiceOn ? "Mute spoken replies" : "Speak replies aloud"}
          >
            {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {voiceOn ? "Voice on" : "Voice off"}
          </button>
        </div>
      </div>

      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-6 pb-40 space-y-4">
          {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.content} />)}
          {busy && <Bubble role="assistant" text="…analyzing your farm data" pulsing />}
          {error && <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2">{error}</div>}
          {recording && (
            <div className="text-sm text-white/70">Recording… {recordingSeconds}s</div>
          )}
          {messages.length <= 1 && !busy && (
            <div className="pt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => submit(s)} className="rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm text-white/85 px-3 py-1.5">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-white/10 bg-navy/95 backdrop-blur">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="mx-auto w-full max-w-3xl px-6 py-4 flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={startingRecording ? "Starting microphone…" : recording ? "Listening… click stop when done" : transcribing ? "Transcribing…" : "Ask about your farm, your cages, or disease risks…"}
            disabled={recording || startingRecording || transcribing}
            className="flex-1 resize-none rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={busy || startingRecording || transcribing}
            aria-label={recording ? "Stop recording" : "Start voice input"}
             title={recording ? "Click to stop and send" : "Click to start, speak, then click again to stop"}
            className={`grid place-items-center w-11 h-11 rounded-lg border transition disabled:opacity-50 ${recording ? "bg-destructive border-destructive text-destructive-foreground animate-pulse" : "bg-white/5 border-white/15 text-white hover:bg-white/10"}`}
          >
            {startingRecording || transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> : recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button type="submit" disabled={busy || recording || startingRecording || transcribing} aria-label="Send"
            className="grid place-items-center w-11 h-11 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, text, pulsing }: { role: "user" | "assistant"; text: string; pulsing?: boolean }) {
  const isUser = role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-3 text-sm whitespace-pre-wrap">{text}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className={`max-w-[90%] rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/10 text-white px-4 py-3 text-sm leading-relaxed ${pulsing ? "animate-pulse" : ""}`}>
        <div className="space-y-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-primary [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-semibold [&_h3]:text-white [&_strong]:text-white [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1 [&_em]:italic [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
