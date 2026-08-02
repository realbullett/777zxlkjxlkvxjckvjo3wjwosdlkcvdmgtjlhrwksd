export function SparkleText({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <span key={i} className="relative inline-block sparkle-group">
          <span className="relative z-[1]">{char === " " ? "\u00A0" : char}</span>
          <span className="sparkle-layer" aria-hidden="true">
            <span className="sparkle-dot" style={{ top: "8%", left: "5%", animationDelay: `${i * 0.06 + 0}s` }} />
            <span className="sparkle-dot" style={{ top: "35%", left: "35%", animationDelay: `${i * 0.06 + 0.06}s` }} />
            <span className="sparkle-dot" style={{ top: "65%", left: "10%", animationDelay: `${i * 0.06 + 0.12}s` }} />
            <span className="sparkle-dot" style={{ top: "15%", left: "70%", animationDelay: `${i * 0.06 + 0.18}s` }} />
            <span className="sparkle-dot" style={{ top: "55%", left: "75%", animationDelay: `${i * 0.06 + 0.24}s` }} />
            <span className="sparkle-dot" style={{ top: "85%", left: "45%", animationDelay: `${i * 0.06 + 0.3}s` }} />
          </span>
        </span>
      ))}
    </>
  );
}
