export function PanelTracer({ Type, Color, Speed }: { Type: string | null; Color: string | null; Speed: number | null }) {
  const Lap = (100 - (Speed ?? 50)) * 0.12 + 3;
  const T = Type || "pulse";
  if (T === "pulse") {
    const C = Color || "#3b82f6";
    return <span className="pulse-dot" style={{ backgroundColor: C, boxShadow: `0 0 8px 2px ${C}, 0 0 18px 6px ${C}`, animationDuration: `${Lap}s, 1.2s` }} />;
  }
  const C = Color || (T === "lightning" ? "#38bdf8" : T === "flowers" ? "#f472b6" : T === "snow" ? "#e0f2ff" : T === "fire" ? "#f97316" : T === "stars" ? "#fde047" : "#f9a8d4");
  const Glow = `drop-shadow(0 0 3px ${C}) drop-shadow(0 0 8px ${C})`;
  const Cls = T === "lightning" ? "edge-orbit-flicker" : T === "fire" ? "edge-orbit-flame" : T === "stars" ? "edge-orbit-twinkle" : T === "hearts" ? "edge-orbit-beat" : "edge-orbit-spin";
  const Dur = T === "lightning" ? `${Lap}s, 0.85s` : T === "fire" ? `${Lap}s, 0.5s` : T === "hearts" ? `${Lap}s, 1.2s` : `${Lap}s, 3s`;
  return (
    <span className={`edge-tracer ${Cls}`} style={{ animationDuration: Dur }}>
      {T === "lightning" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" style={{ filter: Glow }}>
          <path d="M13 2 4 14h6l-2 8 9-12h-6l2-8z" fill={C} stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      ) : T === "flowers" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" style={{ filter: Glow }}>
          {[0, 72, 144, 216, 288].map((A) => (
            <ellipse key={A} cx="12" cy="6.5" rx="3.2" ry="5" fill={C} transform={`rotate(${A} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="3.4" fill="#ffd166" />
        </svg>
      ) : T === "snow" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" style={{ filter: Glow }}>
          <g stroke={C} strokeWidth="1.6" strokeLinecap="round">
            {[0, 60, 120].map((A) => (
              <line key={A} x1="12" y1="3" x2="12" y2="21" transform={`rotate(${A} 12 12)`} />
            ))}
          </g>
        </svg>
      ) : T === "fire" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" style={{ filter: Glow }}>
          <path d="M12 2.5c2.6 3.2 5.5 6 5.5 9.7A5.5 5.5 0 0 1 6.5 12.2c0-1.8.7-3.3 1.7-4.8.3 1.4 1.1 2.3 2.2 2.7-.7-2.4-.2-4.9 1.6-7.6z" fill={C} />
          <path d="M12.3 9.8c1.2 1.7 2.4 3 2.4 4.9a2.7 2.7 0 1 1-5.4 0c0-1.2.5-2.1 1.2-3.1.3.7.9 1.1 1.5 1.3-.3-1 0-2 .3-3.1z" fill="#fbbf24" />
        </svg>
      ) : T === "stars" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" style={{ filter: Glow }}>
          <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill={C} />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" style={{ filter: Glow }}>
          <path d="M12 21s-8.2-5.4-8.2-11A4.7 4.7 0 0 1 12 6.6 4.7 4.7 0 0 1 20.2 10c0 5.6-8.2 11-8.2 11z" fill={C} />
        </svg>
      )}
    </span>
  );
}
