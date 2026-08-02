import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { clockParts, dateLabel, gmtLabel, timeLabel, type ClockWidgetConfig } from "../lib/widgets";

export default function ClockWidget({ widget, className = "" }: { widget: ClockWidgetConfig; className?: string }) {
  const [now, setNow] = useState(() => new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [widget.timeZone]);

  const { hours, minutes, seconds } = clockParts(widget.timeZone, now);
  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  const handleMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!widget.mouseFollow || !ref.current) return;
    const el = ref.current;
    el.style.transition = "none";
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const moveX = ((x - centerX) / centerX) * 15;
    const moveY = ((y - centerY) / centerY) * 15;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    el.style.transform = `translate(${moveX}px, ${moveY}px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleLeave = () => {
    if (!ref.current) return;
    const el = ref.current;
    el.style.transition = "transform 0.5s ease-out";
    el.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`flex w-full items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.05] px-8 py-6 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] ${className}`}
      style={{ willChange: widget.mouseFollow ? "transform" : undefined }}
    >
      <div className="relative h-24 w-24 shrink-0 rounded-full border border-white/15 bg-black/30">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={`absolute left-1/2 top-0 w-px ${i % 3 === 0 ? "h-2.5 bg-white/70" : "h-2 bg-white/30"}`}
            style={{ transform: `translateX(-0.5px) rotate(${i * 30}deg)`, transformOrigin: "50% 48px" }}
          />
        ))}
        <div
          className="absolute rounded-full bg-white/90"
          style={{
            left: "50%",
            top: "50%",
            width: 4,
            height: 24,
            marginLeft: -2,
            marginTop: -24,
            transformOrigin: "50% 100%",
            transform: `rotate(${hourAngle}deg)`,
          }}
        />
        <div
          className="absolute rounded-full bg-white/95"
          style={{
            left: "50%",
            top: "50%",
            width: 3,
            height: 36,
            marginLeft: -1.5,
            marginTop: -36,
            transformOrigin: "50% 100%",
            transform: `rotate(${minAngle}deg)`,
          }}
        />
        <div
          className="absolute rounded-full bg-red-500"
          style={{
            left: "50%",
            top: "50%",
            width: 2,
            height: 50,
            marginLeft: -1,
            marginTop: -39,
            transformOrigin: "50% 39px",
            transform: `rotate(${secAngle}deg)`,
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -ml-1.5 -mt-1.5 rounded-full bg-white ring-2 ring-black/40" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-color, #ffffff)", opacity: 0.45 }}>
          {widget.label || widget.timeZone}
        </p>
        <p className="text-3xl font-bold leading-none tabular-nums tracking-tight" style={{ color: "var(--text-color, #ffffff)" }}>
          {timeLabel(widget.timeZone, now)}
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--text-color, #ffffff)", opacity: 0.45 }}>
          {dateLabel(widget.timeZone, now)} <span className="opacity-30">·</span> {gmtLabel(widget.timeZone, now)}
        </p>
      </div>
    </div>
  );
}
