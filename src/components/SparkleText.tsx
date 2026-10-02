const GLYPHS = ["\u2726", "\u2727"];

export function SparkleText({ text }: { text: string }) {
  return (
    <span className="relative inline-block sparkle-group">
      {text.split("").map((char, i) => (
        <span key={i} className="relative z-[1] inline-block">{char === " " ? "\u00A0" : char}</span>
      ))}
      <span className="sparkle-layer" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
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
