import { useEffect, useRef, useState } from "react";

type Vfx = {
  Color: string;
  Inner: string;
  Tail: number;
  Width: number;
  Blur: number;
  Class: string;
  Beat: string;
};

const EFFECTS: Record<string, Vfx> = {
  lightning: { Color: "#38bdf8", Inner: "#ffffff", Tail: 26, Width: 2.2, Blur: 1, Class: "edge-flicker-fx", Beat: "0.42s" },
  fire: { Color: "#f97316", Inner: "#fbbf24", Tail: 36, Width: 7, Blur: 5, Class: "edge-flame-fx", Beat: "0.45s" },
  snow: { Color: "#e0f2ff", Inner: "#ffffff", Tail: 20, Width: 3.6, Blur: 3, Class: "edge-twinkle-fx", Beat: "1.6s" },
  flowers: { Color: "#f472b6", Inner: "#ffd166", Tail: 26, Width: 5, Blur: 4, Class: "edge-bloom-fx", Beat: "2.2s" },
  stars: { Color: "#fde047", Inner: "#ffffff", Tail: 14, Width: 3, Blur: 3, Class: "edge-twinkle-fx", Beat: "0.9s" },
  hearts: { Color: "#f9a8d4", Inner: "#ff8fab", Tail: 22, Width: 4.5, Blur: 3, Class: "edge-beat-fx", Beat: "1.1s" },
};

export function PanelTracer({ Type, Color, Speed }: { Type: string | null; Color: string | null; Speed: number | null }) {
  const Lap = (100 - (Speed ?? 50)) * 0.12 + 3;
  const T = Type || "pulse";
  const BoxRef = useRef<HTMLDivElement>(null);
  const [Size, setSize] = useState({ W: 0, H: 0 });

  useEffect(() => {
    const El = BoxRef.current;
    if (!El) return;
    setSize({ W: El.clientWidth, H: El.clientHeight });
    const RO = new ResizeObserver(() => setSize({ W: El.clientWidth, H: El.clientHeight }));
    RO.observe(El);
    return () => RO.disconnect();
  }, []);

  if (T === "pulse") {
    const C = Color || "#3b82f6";
    return <span className="pulse-dot" style={{ backgroundColor: C, boxShadow: `0 0 8px 2px ${C}, 0 0 18px 6px ${C}`, animationDuration: `${Lap}s, 1.2s` }} />;
  }

  const Fx = EFFECTS[T] || EFFECTS.stars;
  const C = Color || Fx.Color;
  const { W, H } = Size;
  const R = 25;
  const Path = `M ${R} 1 H ${W - R} A ${R - 1} ${R - 1} 0 0 1 ${W - 1} ${R} V ${H - R} A ${R - 1} ${R - 1} 0 0 1 ${W - R} ${H - 1} H ${R} A ${R - 1} ${R - 1} 0 0 1 1 ${H - R} V ${R} A ${R - 1} ${R - 1} 0 0 1 ${R} 1 Z`;
  const Dash = `${Fx.Tail} ${100 - Fx.Tail}`;
  const Head = `${Math.max(4, Fx.Tail * 0.35)} ${100 - Math.max(4, Fx.Tail * 0.35)}`;

  return (
    <div ref={BoxRef} className="pointer-events-none absolute inset-0">
      {W > 0 && H > 0 ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className={Fx.Class} style={{ animationDuration: Fx.Beat, overflow: "visible" }}>
          <path d={Path} pathLength={100} fill="none" stroke={C} strokeWidth={Fx.Width + Fx.Blur} strokeLinecap="round" strokeDasharray={Dash} opacity={0.35} filter={`blur(${Fx.Blur}px)`} className="edge-trail" style={{ animationDuration: `${Lap}s` }} />
          <path d={Path} pathLength={100} fill="none" stroke={C} strokeWidth={Fx.Width} strokeLinecap="round" strokeDasharray={Dash} opacity={0.95} className="edge-trail" style={{ animationDuration: `${Lap}s` }} />
          <path d={Path} pathLength={100} fill="none" stroke={Fx.Inner} strokeWidth={Math.max(1, Fx.Width * 0.35)} strokeLinecap="round" strokeDasharray={Head} className="edge-trail" style={{ animationDuration: `${Lap}s` }} />
        </svg>
      ) : null}
    </div>
  );
}
