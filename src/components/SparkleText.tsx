const GLYPHS = ["\u2726", "\u2727"];

export function SparkleText({ text, count = 14 }: { text: string; count?: number }) {
  const n = Math.max(1, Math.min(60, Math.round(count ?? 14)));
  return (
    <span className="relative inline-block sparkle-group">
      {text.split("").map((char, i) => (
        <span key={i} className="relative z-[1] inline-block">{char === " " ? "\u00A0" : char}</span>
      ))}
      <span className="sparkle-layer" aria-hidden="true">
        {Array.from({ length: n }).map((_, i) => (
          <span
            key={i}
            className="sparkle-rise"
            style={{
              left: `${(i * 71 + 13) % 100}%`,
              fontSize: `${8 + ((i * 5) % 9)}px`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            {GLYPHS[i % 2]}
          </span>
        ))}
      </span>
    </span>
  );
}
