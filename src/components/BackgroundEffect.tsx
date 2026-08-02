import { useMemo, useRef, useEffect } from "react";

function accentColor(alpha: number) {
  if (typeof window === "undefined") return `rgba(96, 165, 250, ${alpha})`;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--bg-effect-color").trim();
  const m = v.match(/[\d.]+/g);
  if (m && m.length >= 3) return `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${alpha})`;
  return `rgba(96, 165, 250, ${alpha})`;
}

function RainStreak({ i }: { i: number }) {
  const style = useMemo(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * -100}%`,
    width: `${1 + Math.random() * 1.5}px`,
    height: `${40 + Math.random() * 60}px`,
    opacity: 0.2 + Math.random() * 0.4,
    animationDuration: `${0.3 + Math.random() * 0.3}s`,
    animationDelay: `${Math.random() * 0.5}s`,
  } as React.CSSProperties), [i]);
  return <div className="rain-streak" style={style} />;
}

function SnowFlake({ i }: { i: number }) {
  const size = 3 + Math.random() * 5;
  const style = useMemo(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * -100}%`,
    width: `${size}px`,
    height: `${size}px`,
    opacity: 0.3 + Math.random() * 0.5,
    animationDuration: `${4 + Math.random() * 6}s`,
    animationDelay: `${Math.random() * 8}s`,
  } as React.CSSProperties), [i]);
  return <div className="snow-flake" style={style} />;
}

export function RainEffect() {
  return (
    <div className="bg-effect-overlay">
      {Array.from({ length: 150 }).map((_, i) => (
        <RainStreak key={i} i={i} />
      ))}
    </div>
  );
}

export function SnowEffect() {
  return (
    <div className="bg-effect-overlay">
      {Array.from({ length: 120 }).map((_, i) => (
        <SnowFlake key={i} i={i} />
      ))}
    </div>
  );
}

export function AuroraEffect() {
  return (
    <div className="bg-effect-overlay">
      <div className="aurora-layer aurora-layer-1" />
      <div className="aurora-layer aurora-layer-2" />
      <div className="aurora-layer aurora-layer-3" />
    </div>
  );
}

export function TvStaticEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const draw = () => {
      if (!running) return;
      const { width, height } = canvas;
      if (!width || !height) { requestAnimationFrame(draw); return; }
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(draw);
    };
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-1 opacity-30"
    />
  );
}

export function ParticlesEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const color = accentColor(1);
    const parts = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 1 + Math.random() * 3,
      vy: -(0.2 + Math.random() * 0.8),
      vx: (Math.random() - 0.5) * 0.3,
      a: 0.15 + Math.random() * 0.4,
      tw: 0.002 + Math.random() * 0.01,
      ph: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    let running = true;
    const draw = () => {
      if (!running) return;
      t++;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        ctx.globalAlpha = Math.max(0.05, p.a + Math.sin(t * p.tw + p.ph) * 0.2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = p.r * 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      requestAnimationFrame(draw);
    };
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-80"
    />
  );
}

export function GalaxyEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const accent = accentColor(0.5);
    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.4 + Math.random() * 1.6,
      base: 0.2 + Math.random() * 0.6,
      speed: 0.02 + Math.random() * 0.08,
      tw: 0.01 + Math.random() * 0.03,
      ph: Math.random() * Math.PI * 2,
      tinted: Math.random() < 0.3,
    }));

    let t = 0;
    let running = true;
    const draw = () => {
      if (!running) return;
      t++;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        s.x -= s.speed;
        if (s.x < -5) { s.x = width + 5; s.y = Math.random() * height; }
        const alpha = Math.max(0.05, s.base + Math.sin(t * s.tw + s.ph) * 0.25);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.tinted ? accent : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
    />
  );
}

const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテト0123456789$@#%&*+=;:<>?";
const MATRIX_FONT = 16;

export function MatrixEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const randChar = () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    const spacing = MATRIX_FONT + 6;
    const cols = Array.from({ length: Math.ceil(canvas.width / spacing) }, () => ({
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 1.5,
      active: Math.random() < 0.45,
    }));
    const color = accentColor(0.7);

    let running = true;
    const draw = () => {
      if (!running) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${MATRIX_FONT}px monospace`;
      ctx.fillStyle = color;
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        const x = i * spacing;
        if (!col.active) {
          if (Math.random() < 0.02) {
            col.active = true;
            col.y = -MATRIX_FONT * 2 - Math.random() * 120;
            col.speed = 0.5 + Math.random() * 1.5;
          }
          continue;
        }
        ctx.globalAlpha = 0.9;
        ctx.fillText(randChar(), x, col.y);
        ctx.globalAlpha = 0.35;
        ctx.fillText(randChar(), x, col.y - MATRIX_FONT);
        ctx.globalAlpha = 0.14;
        ctx.fillText(randChar(), x, col.y - MATRIX_FONT * 2);
        col.y += col.speed;
        if (col.y - MATRIX_FONT * 2 > height) {
          col.y = -MATRIX_FONT * 2;
          col.speed = 0.5 + Math.random() * 1.5;
          col.active = Math.random() < 0.45;
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-60"
    />
  );
}

export function SpotlightEffect() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    const el = overlayRef.current;
    if (!el) return;
    el.style.background = "radial-gradient(650px circle at 50% 30%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 65%)";
    const move = (e: MouseEvent) => {
      el.style.background = `radial-gradient(650px circle at ${e.clientX}px ${e.clientY}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 65%)`;
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return <div ref={overlayRef} className="absolute inset-0 pointer-events-none z-[1]" />;
}
