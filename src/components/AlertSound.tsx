import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

/**
 * When `active` is true, speaks the provided `speech` text aloud
 * via ElevenLabs and repeats every 25s. User must click "Enable sound"
 * once to satisfy the browser autoplay policy.
 */
export function AlertSound({ active, speech }: { active: boolean; speech: string }) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("aquasense.alarm") === "on";
  });
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    };
  }, []);

  useEffect(() => {
    if (!enabled || !active || !speech) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    let cancelled = false;

    const speak = async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        // Reuse cached audio if the alert text hasn't changed.
        if (lastSpokenRef.current !== speech || !audioRef.current?.src) {
          const res = await fetch("/api/elevenlabs/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: speech }),
          });
          if (!res.ok) throw new Error(`TTS ${res.status}`);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
          const a = new Audio(url);
          audioRef.current = a;
          lastSpokenRef.current = speech;
        }
        if (!cancelled && audioRef.current) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
        }
      } catch {
        // Fallback: short beep so the operator still hears something.
        try {
          const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
          const ctx = new Ctx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square"; osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
          osc.connect(gain).connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 0.3);
        } catch { /* ignore */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    speak();
    timerRef.current = window.setInterval(speak, 25_000);
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [enabled, active, speech]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("aquasense.alarm", next ? "on" : "off");
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-2.5 py-1.5 shrink-0"
      aria-label={enabled ? "Mute spoken alerts" : "Enable spoken alerts"}
      title={enabled ? "Mute spoken alerts" : "Enable spoken alerts"}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      {enabled ? "Voice on" : "Enable voice"}
    </button>
  );
}
