import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "700", "900"], subsets: ["latin"] });

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
const SCENE_LEN = 380; // ~12.6s each before transition overlap
const TRANS_LEN = 20;
// 10 scenes with 9 transitions: 10*380 - 9*20 = 3620 frames ≈ 120.6s
export const TOTAL_FRAMES = SCENE_LEN * 10 - TRANS_LEN * 9;

// Brand palette
const NAVY = "#0A1628";
const BLUE = "#0EA5E9";
const CORAL = "#E85D3A";
const GREEN = "#22C55E";
const WHITE = "#FFFFFF";
const SLATE = "#94A3B8";

const baseText: React.CSSProperties = { fontFamily, color: WHITE, letterSpacing: "-0.02em" };

// ============ Shared helpers ============
const useFadeInOut = (inFrames = 18, outStart = SCENE_LEN - 24) => {
  const f = useCurrentFrame();
  return interpolate(f, [0, inFrames, outStart, SCENE_LEN], [0, 1, 1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
};

// Subtle drifting deep-ocean background gradient
const OceanBG: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 60) * 40;
  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${50 + drift / 4}% ${40 + drift / 6}%, rgba(14,165,233,${0.18 * intensity}) 0%, rgba(10,22,40,0) 55%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${30 - drift / 5}% 80%, rgba(14,165,233,${0.08 * intensity}) 0%, rgba(10,22,40,0) 50%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Floating particles for ocean feel
const Particles: React.FC<{ count?: number; color?: string }> = ({ count = 30, color = BLUE }) => {
  const f = useCurrentFrame();
  const dots = Array.from({ length: count }, (_, i) => {
    const seed = i * 137.5;
    const x = (Math.sin(seed) * 0.5 + 0.5) * WIDTH;
    const y0 = (Math.cos(seed * 1.3) * 0.5 + 0.5) * HEIGHT;
    const y = (y0 + f * (0.3 + (i % 5) * 0.2)) % HEIGHT;
    const size = 2 + (i % 4);
    const op = 0.15 + ((i % 7) / 30);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          opacity: op,
          filter: "blur(0.5px)",
        }}
      />
    );
  });
  return <AbsoluteFill>{dots}</AbsoluteFill>;
};

// ============ SCENE 1 — HOOK ============
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const num = Math.round(interpolate(f, [20, 110], [0, 62_000_000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const textOp = interpolate(f, [10, 40], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(f, [60, 90], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  const scale = interpolate(f, [0, 200], [1.05, 1.15]);
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: out }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <OceanBG intensity={1.4} />
        <Particles count={50} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ ...baseText, fontWeight: 900, fontSize: 220, opacity: textOp, fontVariantNumeric: "tabular-nums" }}>
          {num.toLocaleString("en-US")}
        </div>
        <div style={{ ...baseText, color: SLATE, fontWeight: 400, fontSize: 36, opacity: subOp, letterSpacing: "0.02em" }}>
          farmed salmon died in Norway in 2023
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ SCENE 2 — PROBLEM ============
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  // Animated underwater light shafts
  const shaft = (i: number) => {
    const x = 200 + i * 320;
    const sway = Math.sin(f / 40 + i) * 30;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x + sway,
          top: -100,
          width: 180,
          height: HEIGHT + 200,
          background: `linear-gradient(180deg, rgba(14,165,233,0.25) 0%, rgba(14,165,233,0.02) 70%, transparent 100%)`,
          transform: `rotate(${-8 + i}deg)`,
          filter: "blur(20px)",
        }}
      />
    );
  };
  const textOp = interpolate(f, [40, 80], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  const slide = interpolate(f, [40, 80], [40, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#031523", opacity: out }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, #0b3a5c 0%, #031523 70%)` }} />
      {[0, 1, 2, 3, 4, 5].map(shaft)}
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "120px 140px" }}>
        <div style={{ ...baseText, fontWeight: 700, fontSize: 90, opacity: textOp, transform: `translateY(${slide}px)`, lineHeight: 1.05, maxWidth: 1400 }}>
          By the time farmers see it,
          <br />
          <span style={{ color: CORAL }}>it's already too late.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ SCENE 3 — COST ============
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const num = Math.round(interpolate(f, [20, 200], [0, 940_000_000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const captionOp = interpolate(f, [210, 240], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: out }}>
      <OceanBG intensity={0.6} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 28 }}>
        <div style={{ ...baseText, color: SLATE, fontSize: 28, letterSpacing: "0.3em", textTransform: "uppercase" }}>The cost</div>
        <div style={{ ...baseText, color: BLUE, fontWeight: 900, fontSize: 200, fontVariantNumeric: "tabular-nums", textShadow: `0 0 80px rgba(14,165,233,0.4)` }}>
          €{num.toLocaleString("en-US")}
        </div>
        <div style={{ ...baseText, color: SLATE, fontSize: 32, opacity: captionOp, maxWidth: 1200, textAlign: "center" }}>
          lost to disease every year — Norwegian salmon farming alone
        </div>
        <div style={{ ...baseText, color: SLATE, fontSize: 18, opacity: captionOp * 0.7, marginTop: 60 }}>
          Source: SINTEF / Veterinærinstituttet, 2023
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ SCENE 4 — INTRO ============
const Scene4: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  const wordScale = spring({ frame: f - 10, fps, config: { damping: 18, stiffness: 120 } });
  const underline = interpolate(f, [40, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp = interpolate(f, [110, 150], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: out }}>
      <OceanBG intensity={0.8} />
      <Particles count={20} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <div style={{ ...baseText, fontWeight: 900, fontSize: 220, transform: `scale(${0.6 + wordScale * 0.4})`, opacity: wordScale }}>
          AquaSense
        </div>
        <div style={{ width: 600, height: 6, background: `rgba(14,165,233,0.15)`, marginTop: 10, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${underline * 100}%`, height: "100%", background: BLUE, boxShadow: `0 0 24px ${BLUE}` }} />
        </div>
        <div style={{ ...baseText, color: SLATE, fontSize: 40, opacity: tagOp, marginTop: 40, letterSpacing: "0.01em" }}>
          Detect fish disease 48 hours before it's visible.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ SCENE 5 — SENSORS ============
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const headerOp = interpolate(f, [10, 40], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  const items = ["Dissolved oxygen", "Sea-surface temperature", "pH", "Mortality rate"];
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: out }}>
      <OceanBG intensity={0.5} />
      <AbsoluteFill style={{ padding: "140px 160px", flexDirection: "column", gap: 50 }}>
        <div style={{ ...baseText, color: BLUE, fontSize: 26, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 700, opacity: headerOp }}>
          Four live signals · per cage · every minute
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 20 }}>
          {items.map((label, i) => {
            const start = 50 + i * 35;
            const op = interpolate(f, [start, start + 25], [0, 1], { extrapolateRight: "clamp" });
            const x = interpolate(f, [start, start + 25], [-60, 0], { extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 32, opacity: op, transform: `translateX(${x}px)` }}>
                <div style={{ ...baseText, color: BLUE, fontWeight: 900, fontSize: 60, fontVariantNumeric: "tabular-nums", width: 80 }}>
                  0{i + 1}
                </div>
                <div style={{ width: 8, height: 60, background: BLUE, borderRadius: 4, boxShadow: `0 0 16px ${BLUE}` }} />
                <div style={{ ...baseText, fontWeight: 500, fontSize: 64 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ SCENE 6 — DASHBOARD ============
const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  const cards = Array.from({ length: 6 });
  const pulse = 0.5 + 0.5 * Math.sin(f / 6);
  const captionOp = interpolate(f, [200, 240], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: out }}>
      <OceanBG intensity={0.4} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 50 }}>
        <div style={{ ...baseText, color: SLATE, fontSize: 24, letterSpacing: "0.3em", textTransform: "uppercase" }}>Live Dashboard</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 360px)", gridTemplateRows: "repeat(2, 220px)", gap: 32 }}>
          {cards.map((_, i) => {
            const start = 15 + i * 12;
            const s = spring({ frame: f - start, fps: 30, config: { damping: 16 } });
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
                  {isAlert ? "8.7" : (1 + (i * 0.4)).toFixed(1)}
                </div>
                <div style={{ ...baseText, color: SLATE, fontSize: 18 }}>{isAlert ? "Risk · ELEVATED" : "Risk · safe"}</div>
              </div>
            );
          })}
        </div>
        <div style={{ ...baseText, fontSize: 32, opacity: captionOp, marginTop: 20 }}>
          <span style={{ color: GREEN }}>Green is safe.</span>{" "}
          <span style={{ color: CORAL }}>Coral means act now.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ SCENE 7 — ALERT ============
const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(f / 10);
  const cardScale = spring({ frame: f - 10, fps: 30, config: { damping: 14, stiffness: 110 } });
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  // Countdown hours animating from 72 → 48
  const hours = Math.round(interpolate(f, [40, 140], [72, 48], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: out }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(232,93,58,${0.15 + pulse * 0.2}) 0%, rgba(10,22,40,0) 60%)` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{
          background: "rgba(15,33,56,0.85)",
          border: `4px solid ${CORAL}`,
          borderRadius: 24,
          padding: "80px 120px",
          transform: `scale(${0.7 + cardScale * 0.3})`,
          opacity: cardScale,
          boxShadow: `0 0 ${60 + pulse * 60}px rgba(232,93,58,${0.4 + pulse * 0.3})`,
          textAlign: "center",
        }}>
          <div style={{ ...baseText, color: CORAL, fontSize: 24, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700 }}>
            Elevated risk · Cage 1
          </div>
          <div style={{ ...baseText, fontWeight: 900, fontSize: 200, marginTop: 20, fontVariantNumeric: "tabular-nums" }}>
            {hours}<span style={{ fontSize: 100, color: SLATE, marginLeft: 12 }}>h</span>
          </div>
          <div style={{ ...baseText, color: SLATE, fontSize: 28, marginTop: 16 }}>
            before clinical symptoms appear
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ SCENE 8 — SIMULATOR ============
const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  const headerOp = interpolate(f, [10, 40], [0, 1], { extrapolateRight: "clamp" });
  const sliderPos = interpolate(f, [50, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t * (3 - 2 * t) });
  const bars = [
    { delay: 60, h: 80, color: GREEN, label: "Act in 48h", value: "3%" },
    { delay: 130, h: 240, color: "#FACC15", label: "Act in 12h", value: "34%" },
    { delay: 200, h: 460, color: CORAL, label: "No action", value: "92%" },
  ];
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: out }}>
      <OceanBG intensity={0.5} />
      <AbsoluteFill style={{ padding: "100px 160px", flexDirection: "column", gap: 50 }}>
        <div style={{ ...baseText, fontWeight: 700, fontSize: 64, opacity: headerOp }}>What if you act earlier?</div>

        {/* Slider */}
        <div style={{ position: "relative", height: 60, marginTop: 10 }}>
          <div style={{ position: "absolute", top: 28, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 28, left: 0, width: `${sliderPos * 100}%`, height: 4, background: BLUE, borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 14, left: `calc(${sliderPos * 100}% - 16px)`, width: 32, height: 32, borderRadius: "50%", background: WHITE, boxShadow: `0 0 20px ${BLUE}` }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 50, ...baseText, color: SLATE, fontSize: 22 }}>
            <span>Act in 48h</span><span>Act in 12h</span><span>No action</span>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: 520, marginTop: 30 }}>
          {bars.map((b, i) => {
            const grow = interpolate(f, [b.delay, b.delay + 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
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

// ============ SCENE 9 — WHO IT'S FOR ============
const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  const textOp = interpolate(f, [30, 70], [0, 1], { extrapolateRight: "clamp" });
  const slide = interpolate(f, [30, 70], [40, 0], { extrapolateRight: "clamp" });
  // Sunset-on-water composition
  const drift = Math.sin(f / 50) * 30;
  return (
    <AbsoluteFill style={{ background: "#1a0d08", opacity: out }}>
      {/* Sky */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, #1a0d08 0%, #6b2818 35%, #d97842 55%, #f4b266 65%, #2c3e50 75%, #0a1628 100%)` }} />
      {/* Sun */}
      <div style={{ position: "absolute", left: WIDTH / 2 - 120 + drift, top: HEIGHT * 0.55, width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(circle, #fde68a 0%, #f59e0b 40%, rgba(245,158,11,0) 70%)`, filter: "blur(2px)" }} />
      {/* Water shimmer */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: HEIGHT * 0.3, background: `linear-gradient(180deg, rgba(245,158,11,0.4) 0%, rgba(10,22,40,0.9) 70%, #0a1628 100%)` }} />
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{
          position: "absolute",
          left: 0, right: 0,
          bottom: 80 + i * 50 + Math.sin(f / 20 + i) * 8,
          height: 2,
          background: `rgba(245,158,11,${0.5 - i * 0.08})`,
          filter: "blur(1px)",
        }} />
      ))}
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 140px 140px" }}>
        <div style={{ ...baseText, fontSize: 28, color: BLUE, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 700, opacity: textOp, transform: `translateY(${slide}px)` }}>
          Built for
        </div>
        <div style={{ ...baseText, fontWeight: 700, fontSize: 88, opacity: textOp, transform: `translateY(${slide}px)`, marginTop: 16, lineHeight: 1.05, maxWidth: 1400 }}>
          the people who feed the world.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ SCENE 10 — CTA + CREDITS ============
const Scene10: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = useCurrentFrame();
  const wordmark = spring({ frame: f - 10, fps, config: { damping: 18, stiffness: 110 } });
  const tagOp = interpolate(f, [70, 110], [0, 1], { extrapolateRight: "clamp" });
  const btnScale = spring({ frame: f - 130, fps, config: { damping: 14 } });
  const creditsOp = interpolate(f, [180, 220], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [SCENE_LEN - 30, SCENE_LEN], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: out }}>
      <OceanBG intensity={1} />
      <Particles count={40} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 32 }}>
        <div style={{ ...baseText, fontWeight: 900, fontSize: 200, transform: `scale(${0.7 + wordmark * 0.3})`, opacity: wordmark }}>
          AquaSense
        </div>
        <div style={{ ...baseText, color: SLATE, fontSize: 36, opacity: tagOp }}>
          See your farm at aquasense.app
        </div>
        <div style={{
          marginTop: 20,
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
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 60, right: 80, ...baseText, color: SLATE, fontSize: 22, opacity: creditsOp, textAlign: "right" }}>
        <div style={{ fontSize: 14, letterSpacing: "0.25em", textTransform: "uppercase", color: BLUE, marginBottom: 6 }}>Built by</div>
        Vera · Maggie · Rishi
      </div>
    </AbsoluteFill>
  );
};

// ============ MAIN ============
export const MainVideo: React.FC = () => {
  const fade1 = { presentation: fade(), timing: linearTiming({ durationInFrames: TRANS_LEN }) };
  const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10];
  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <TransitionSeries>
        {scenes.map((Comp, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={SCENE_LEN}>
              <Comp />
            </TransitionSeries.Sequence>
            {i < scenes.length - 1 && (
              <TransitionSeries.Transition {...fade1} />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
