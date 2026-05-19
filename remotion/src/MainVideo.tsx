import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  staticFile,
  Sequence,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Inter";

import { SCENE_DURS, TOTAL_FRAMES as GEN_TOTAL } from "./scene-timing";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "700", "900"], subsets: ["latin"] });

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
const TRANS = 12;

// Per-scene durations come from gen-audio.mjs — each scene matches its voiceover line.
export const TOTAL_FRAMES = GEN_TOTAL - TRANS * (SCENE_DURS.length - 1);

// Brand palette
const NAVY = "#0A1628";
const BLUE = "#0EA5E9";
const CORAL = "#E85D3A";
const GREEN = "#22C55E";
const WHITE = "#FFFFFF";
const SLATE = "#94A3B8";
const AMBER = "#FACC15";

const baseText: React.CSSProperties = { fontFamily, color: WHITE, letterSpacing: "-0.02em" };

// ============ Photo background helper ============
const PhotoBG: React.FC<{ src: string; overlay?: number; kenBurns?: number }> = ({ src, overlay = 0.55, kenBurns = 0.08 }) => {
  const { f, dur } = useProgress();
  const scale = 1 + (f / dur) * kenBurns;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(10,22,40,${overlay * 0.7}) 0%, rgba(10,22,40,${overlay}) 60%, rgba(10,22,40,${overlay + 0.15}) 100%)` }} />
    </AbsoluteFill>
  );
};

// ============ Shared ============
const useProgress = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return { f, p: f / durationInFrames, dur: durationInFrames };
};

const OceanBG: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 50) * 40;
  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${50 + drift / 4}% ${40 + drift / 6}%, rgba(14,165,233,${0.2 * intensity}) 0%, rgba(10,22,40,0) 55%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${30 - drift / 5}% 80%, rgba(14,165,233,${0.1 * intensity}) 0%, rgba(10,22,40,0) 50%)` }} />
    </AbsoluteFill>
  );
};

const Particles: React.FC<{ count?: number; color?: string }> = ({ count = 30, color = BLUE }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: count }, (_, i) => {
        const seed = i * 137.5;
        const x = (Math.sin(seed) * 0.5 + 0.5) * WIDTH;
        const y0 = (Math.cos(seed * 1.3) * 0.5 + 0.5) * HEIGHT;
        const y = (y0 + f * (0.4 + (i % 5) * 0.25)) % HEIGHT;
        const size = 2 + (i % 4);
        const op = 0.15 + ((i % 7) / 30);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color, opacity: op, filter: "blur(0.5px)" }} />;
      })}
    </AbsoluteFill>
  );
};

// fade in 0→0.08, hold, fade out 0.92→1
const useShellOpacity = () => {
  const { p } = useProgress();
  return interpolate(p, [0, 0.06, 0.94, 1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

// ============ 1 — HOOK ============
const Scene1: React.FC = () => {
  const { f, dur } = useProgress();
  const op = useShellOpacity();
  const num = Math.round(interpolate(f, [10, dur * 0.5], [0, 62_000_000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const subOp = interpolate(f, [dur * 0.45, dur * 0.6], [0, 1], { extrapolateRight: "clamp" });
  const scale = 1 + (f / dur) * 0.1;
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <PhotoBG src="norway-fjord.jpg" overlay={0.6} kenBurns={0.12} />
      </AbsoluteFill>
      <Particles count={30} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ ...baseText, fontWeight: 900, fontSize: 240, fontVariantNumeric: "tabular-nums", textShadow: "0 4px 40px rgba(0,0,0,0.6)" }}>
          {num.toLocaleString("en-US")}
        </div>
        <div style={{ ...baseText, color: WHITE, fontWeight: 400, fontSize: 38, opacity: subOp, letterSpacing: "0.02em", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
          farmed salmon died in Norway in 2023
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 2 — PROBLEM ============
const Scene2: React.FC = () => {
  const { f, dur } = useProgress();
  const op = useShellOpacity();
  const textOp = interpolate(f, [dur * 0.1, dur * 0.3], [0, 1], { extrapolateRight: "clamp" });
  const slide = interpolate(f, [dur * 0.1, dur * 0.3], [40, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <PhotoBG src="salmon-underwater.jpg" overlay={0.65} kenBurns={0.1} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "120px 140px" }}>
        <div style={{ ...baseText, fontWeight: 700, fontSize: 92, opacity: textOp, transform: `translateY(${slide}px)`, lineHeight: 1.05, maxWidth: 1500, textShadow: "0 4px 30px rgba(0,0,0,0.8)" }}>
          By the time farmers see it,<br />
          <span style={{ color: CORAL }}>it's already too late.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 3 — COST ============
const Scene3: React.FC = () => {
  const { f, dur } = useProgress();
  const op = useShellOpacity();
  const num = Math.round(interpolate(f, [10, dur * 0.7], [0, 940_000_000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const captionOp = interpolate(f, [dur * 0.55, dur * 0.7], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <OceanBG intensity={0.6} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 28 }}>
        <div style={{ ...baseText, color: SLATE, fontSize: 26, letterSpacing: "0.35em", textTransform: "uppercase" }}>The cost</div>
        <div style={{ ...baseText, color: CORAL, fontWeight: 900, fontSize: 210, fontVariantNumeric: "tabular-nums", textShadow: `0 0 80px rgba(232,93,58,0.4)` }}>
          €{num.toLocaleString("en-US")}
        </div>
        <div style={{ ...baseText, color: SLATE, fontSize: 32, opacity: captionOp, maxWidth: 1300, textAlign: "center" }}>
          lost to disease every year — Norwegian salmon farming alone
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 4 — BRIDGE ("We built a better way") ============
const Scene4: React.FC = () => {
  const { f, dur } = useProgress();
  const op = useShellOpacity();
  const op1 = interpolate(f, [dur * 0.1, dur * 0.3], [0, 1], { extrapolateRight: "clamp" });
  const op2 = interpolate(f, [dur * 0.45, dur * 0.65], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <OceanBG intensity={0.8} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 30, textAlign: "center" }}>
        <div style={{ ...baseText, fontWeight: 500, fontSize: 64, opacity: op1, color: SLATE }}>There had to be a better way.</div>
        <div style={{ ...baseText, fontWeight: 900, fontSize: 96, opacity: op2, color: BLUE }}>So we built one.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 5 — INTRO AQUASENSE ============
const Scene5: React.FC = () => {
  const { f, dur } = useProgress();
  const { fps } = useVideoConfig();
  const op = useShellOpacity();
  const wordScale = spring({ frame: f - 5, fps, config: { damping: 16, stiffness: 120 } });
  const underline = interpolate(f, [dur * 0.15, dur * 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp = interpolate(f, [dur * 0.45, dur * 0.65], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <OceanBG intensity={0.9} />
      <Particles count={25} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <div style={{ ...baseText, fontWeight: 900, fontSize: 240, transform: `scale(${0.6 + wordScale * 0.4})`, opacity: wordScale }}>
          AquaSense
        </div>
        <div style={{ width: 640, height: 6, background: `rgba(14,165,233,0.15)`, marginTop: 14, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${underline * 100}%`, height: "100%", background: BLUE, boxShadow: `0 0 28px ${BLUE}` }} />
        </div>
        <div style={{ ...baseText, color: SLATE, fontSize: 42, opacity: tagOp, marginTop: 40 }}>
          Detect fish disease <span style={{ color: BLUE, fontWeight: 700 }}>48 hours</span> before it's visible.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 6 — SENSORS ============
const Scene6: React.FC = () => {
  const { f, dur } = useProgress();
  const op = useShellOpacity();
  const headerOp = interpolate(f, [10, 40], [0, 1], { extrapolateRight: "clamp" });
  const items = ["Dissolved oxygen", "Sea-surface temperature", "pH levels", "Mortality rate"];
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <OceanBG intensity={0.5} />
      <AbsoluteFill style={{ padding: "130px 160px", flexDirection: "column", gap: 50 }}>
        <div style={{ ...baseText, color: BLUE, fontSize: 26, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 700, opacity: headerOp }}>
          Four live signals · per cage · every minute
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 20 }}>
          {items.map((label, i) => {
            const start = dur * (0.12 + i * 0.18);
            const op2 = interpolate(f, [start, start + 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
            const x = interpolate(f, [start, start + 20], [-60, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 32, opacity: op2, transform: `translateX(${x}px)` }}>
                <div style={{ ...baseText, color: BLUE, fontWeight: 900, fontSize: 64, fontVariantNumeric: "tabular-nums", width: 90 }}>0{i + 1}</div>
                <div style={{ width: 8, height: 64, background: BLUE, borderRadius: 4, boxShadow: `0 0 16px ${BLUE}` }} />
                <div style={{ ...baseText, fontWeight: 500, fontSize: 66 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 7 — DASHBOARD ============
const Scene7: React.FC = () => {
  const { f, dur } = useProgress();
  const { fps } = useVideoConfig();
  const op = useShellOpacity();
  const cards = Array.from({ length: 6 });
  const pulse = 0.5 + 0.5 * Math.sin(f / 6);
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <OceanBG intensity={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}>
        <div style={{ ...baseText, color: SLATE, fontSize: 24, letterSpacing: "0.3em", textTransform: "uppercase" }}>Live Dashboard</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 360px)", gridTemplateRows: "repeat(2, 220px)", gap: 28 }}>
          {cards.map((_, i) => {
            const start = dur * (0.08 + i * 0.06);
            const s = spring({ frame: f - start, fps, config: { damping: 16 } });
            const isAlert = i === 0;
            const accent = isAlert ? CORAL : GREEN;
            return (
              <div key={i} style={{
                background: "#0F2138",
                border: `2px solid ${isAlert ? CORAL : "rgba(34,197,94,0.4)"}`,
                borderRadius: 16,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transform: `scale(${0.7 + s * 0.3})`,
                opacity: s,
                boxShadow: isAlert ? `0 0 ${40 + pulse * 40}px rgba(232,93,58,${0.3 + pulse * 0.4})` : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ ...baseText, color: SLATE, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Cage {i + 1}</div>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: accent, boxShadow: `0 0 12px ${accent}` }} />
                </div>
                <div style={{ ...baseText, fontWeight: 900, fontSize: 56, color: accent, fontVariantNumeric: "tabular-nums" }}>
                  {isAlert ? "8.7" : (1 + i * 0.4).toFixed(1)}
                </div>
                <div style={{ ...baseText, color: SLATE, fontSize: 18 }}>{isAlert ? "Risk · ELEVATED" : "Risk · safe"}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 8 — ALERT 48h ============
const Scene8: React.FC = () => {
  const { f, dur } = useProgress();
  const { fps } = useVideoConfig();
  const op = useShellOpacity();
  const pulse = 0.5 + 0.5 * Math.sin(f / 8);
  const cardScale = spring({ frame: f - 5, fps, config: { damping: 14, stiffness: 110 } });
  const hours = Math.round(interpolate(f, [dur * 0.2, dur * 0.75], [72, 48], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(232,93,58,${0.15 + pulse * 0.2}) 0%, rgba(10,22,40,0) 60%)` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{
          background: "rgba(15,33,56,0.85)",
          border: `4px solid ${CORAL}`,
          borderRadius: 24,
          padding: "70px 110px",
          transform: `scale(${0.7 + cardScale * 0.3})`,
          opacity: cardScale,
          boxShadow: `0 0 ${60 + pulse * 60}px rgba(232,93,58,${0.4 + pulse * 0.3})`,
          textAlign: "center",
        }}>
          <div style={{ ...baseText, color: CORAL, fontSize: 22, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700 }}>
            Elevated risk · Cage 1
          </div>
          <div style={{ ...baseText, fontWeight: 900, fontSize: 200, marginTop: 12, fontVariantNumeric: "tabular-nums" }}>
            {hours}<span style={{ fontSize: 100, color: SLATE, marginLeft: 12 }}>h</span>
          </div>
          <div style={{ ...baseText, color: SLATE, fontSize: 28, marginTop: 10 }}>
            head start before symptoms appear
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 9 — SIMULATOR ============
const Scene9: React.FC = () => {
  const { f, dur } = useProgress();
  const op = useShellOpacity();
  const headerOp = interpolate(f, [10, 40], [0, 1], { extrapolateRight: "clamp" });
  const sliderPos = interpolate(f, [dur * 0.15, dur * 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t * (3 - 2 * t) });
  const bars = [
    { delay: dur * 0.18, h: 80, color: GREEN, label: "Act in 48h", value: "3%" },
    { delay: dur * 0.38, h: 240, color: AMBER, label: "Act in 12h", value: "34%" },
    { delay: dur * 0.58, h: 460, color: CORAL, label: "No action", value: "92%" },
  ];
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <OceanBG intensity={0.5} />
      <AbsoluteFill style={{ padding: "90px 160px", flexDirection: "column", gap: 40 }}>
        <div style={{ ...baseText, fontWeight: 700, fontSize: 64, opacity: headerOp }}>What if you act earlier?</div>
        <div style={{ position: "relative", height: 60, marginTop: 6 }}>
          <div style={{ position: "absolute", top: 28, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 28, left: 0, width: `${sliderPos * 100}%`, height: 4, background: BLUE, borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 14, left: `calc(${sliderPos * 100}% - 16px)`, width: 32, height: 32, borderRadius: "50%", background: WHITE, boxShadow: `0 0 20px ${BLUE}` }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 50, ...baseText, color: SLATE, fontSize: 22 }}>
            <span>Act in 48h</span><span>Act in 12h</span><span>No action</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: 520, marginTop: 20 }}>
          {bars.map((b, i) => {
            const grow = interpolate(f, [b.delay, b.delay + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 220 }}>
                <div style={{ ...baseText, color: b.color, fontWeight: 900, fontSize: 64, opacity: grow, fontVariantNumeric: "tabular-nums" }}>{b.value}</div>
                <div style={{ width: 160, height: b.h * grow, background: b.color, borderRadius: 12, boxShadow: `0 0 24px ${b.color}66` }} />
                <div style={{ ...baseText, color: SLATE, fontSize: 22, opacity: grow }}>{b.label}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 10 — MARKET / WHO IT'S FOR ============
const Scene10: React.FC = () => {
  const { f, dur } = useProgress();
  const op = useShellOpacity();
  const headerOp = interpolate(f, [dur * 0.05, dur * 0.2], [0, 1], { extrapolateRight: "clamp" });
  const num = Math.round(interpolate(f, [dur * 0.25, dur * 0.6], [0, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const subOp = interpolate(f, [dur * 0.55, dur * 0.7], [0, 1], { extrapolateRight: "clamp" });
  const farmerOp = interpolate(f, [dur * 0.7, dur * 0.85], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <PhotoBG src="norway-coast.jpg" overlay={0.6} kenBurns={0.1} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24 }}>
        <div style={{ ...baseText, color: BLUE, fontSize: 24, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700, opacity: headerOp, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
          The opportunity
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <div style={{ ...baseText, fontWeight: 900, fontSize: 220, color: WHITE, fontVariantNumeric: "tabular-nums", textShadow: "0 4px 40px rgba(0,0,0,0.7)" }}>€{num}B</div>
        </div>
        <div style={{ ...baseText, color: WHITE, fontSize: 32, opacity: subOp, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>global aquaculture industry</div>
        <div style={{ ...baseText, fontSize: 30, opacity: farmerOp, marginTop: 30, textAlign: "center", maxWidth: 1300, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
          Built for <span style={{ color: BLUE, fontWeight: 700 }}>the people who feed the world.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 11 — PRICING / ROADMAP ============
const Scene11: React.FC = () => {
  const { f, dur } = useProgress();
  const { fps } = useVideoConfig();
  const op = useShellOpacity();
  const priceScale = spring({ frame: f - 5, fps, config: { damping: 14 } });
  const r1 = interpolate(f, [dur * 0.4, dur * 0.55], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const r2 = interpolate(f, [dur * 0.6, dur * 0.75], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <OceanBG intensity={0.5} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}>
        <div style={{ ...baseText, color: SLATE, fontSize: 24, letterSpacing: "0.3em", textTransform: "uppercase" }}>Pricing</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, transform: `scale(${0.7 + priceScale * 0.3})`, opacity: priceScale }}>
          <div style={{ ...baseText, fontWeight: 900, fontSize: 200, color: BLUE }}>€1,500</div>
        </div>
        <div style={{ ...baseText, color: SLATE, fontSize: 30 }}>per cage · per year</div>
        <div style={{ display: "flex", gap: 60, marginTop: 30 }}>
          <div style={{ ...baseText, fontSize: 28, opacity: r1, textAlign: "center" }}>
            <div style={{ color: GREEN, fontWeight: 700, fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase" }}>Q2 2026</div>
            <div style={{ marginTop: 8 }}>Pilots launch</div>
          </div>
          <div style={{ width: 2, height: 70, background: SLATE, opacity: 0.3 }} />
          <div style={{ ...baseText, fontSize: 28, opacity: r2, textAlign: "center" }}>
            <div style={{ color: GREEN, fontWeight: 700, fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase" }}>Q1 2027</div>
            <div style={{ marginTop: 8 }}>Commercial rollout</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 12 — CTA + CREDITS ============
const Scene12: React.FC = () => {
  const { f, dur } = useProgress();
  const { fps } = useVideoConfig();
  const op = useShellOpacity();
  const wordmark = spring({ frame: f - 5, fps, config: { damping: 18, stiffness: 110 } });
  const tagOp = interpolate(f, [dur * 0.25, dur * 0.4], [0, 1], { extrapolateRight: "clamp" });
  const btnScale = spring({ frame: f - dur * 0.45, fps, config: { damping: 14 } });
  const creditsOp = interpolate(f, [dur * 0.55, dur * 0.7], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: op }}>
      <OceanBG intensity={1} />
      <Particles count={45} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 28 }}>
        <div style={{ ...baseText, fontWeight: 900, fontSize: 200, transform: `scale(${0.7 + wordmark * 0.3})`, opacity: wordmark }}>
          AquaSense
        </div>
        <div style={{ ...baseText, color: SLATE, fontSize: 34, opacity: tagOp }}>
          Let's protect what feeds us.
        </div>
        <div style={{
          marginTop: 16,
          background: BLUE,
          color: NAVY,
          padding: "20px 56px",
          borderRadius: 999,
          fontFamily,
          fontWeight: 700,
          fontSize: 32,
          transform: `scale(${0.6 + btnScale * 0.4})`,
          opacity: btnScale,
          boxShadow: `0 12px 40px rgba(14,165,233,0.5)`,
        }}>
          aquasense.app
        </div>
        <div style={{ ...baseText, opacity: creditsOp, marginTop: 50, textAlign: "center" }}>
          <div style={{ fontSize: 14, letterSpacing: "0.3em", textTransform: "uppercase", color: BLUE, marginBottom: 10 }}>Built by</div>
          <div style={{ fontSize: 38, fontWeight: 700 }}>Vera · Maggie · Rishi</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ MAIN ============
const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10, Scene11, Scene12];

export const MainVideo: React.FC = () => {
  const fadeT = { presentation: fade(), timing: linearTiming({ durationInFrames: TRANS }) };
  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <TransitionSeries>
        {SCENES.map((Comp, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={SCENE_DURS[i]}>
              <Comp />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 && <TransitionSeries.Transition {...fadeT} />}
          </React.Fragment>
        ))}
      </TransitionSeries>

      {/* Motivational background music — ducked under voice */}
      <Audio src={staticFile("music.mp3")} volume={0.18} />

      {/* AI narration */}
      <Audio src={staticFile("voiceover.mp3")} volume={1} />
    </AbsoluteFill>
  );
};
