import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Plays a repeating two-tone alarm beep using the Web Audio API
 * whenever `active` is true. The user must click "Enable sound" once
 * (browser autoplay policy). Persists preference in localStorage.
 */
export function AlertSound({ active }: { active: boolean }) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("aquasense.alarm") === "on";
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !active) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    if (!ctxRef.current) {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      ctxRef.current = new Ctx();
    }
    const ctx = ctxRef.current;
    const beep = (freq: number, when: number, dur = 0.18) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + when);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + when + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + when + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + dur + 0.02);
    };
    const fire = () => { beep(880, 0); beep(660, 0.22); };
    fire();
    timerRef.current = window.setInterval(fire, 4000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [enabled, active]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("aquasense.alarm", next ? "on" : "off");
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-2.5 py-1.5"
      aria-label={enabled ? "Mute critical alerts" : "Enable critical alert sound"}
      title={enabled ? "Mute critical alerts" : "Enable critical alert sound"}
    >
      {enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      {enabled ? "Sound on" : "Enable sound"}
    </button>
  );
}
