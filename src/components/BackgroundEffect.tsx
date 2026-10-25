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

export function FireEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; };
    resize();
    const color = accentColor(1);
    const parts = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 40,
      r: 1.5 + Math.random() * 3,
      vy: -(0.6 + Math.random() * 1.6),
      vx: (Math.random() - 0.5) * 0.6,
      life: Math.random(),
      decay: 0.004 + Math.random() * 0.008,
      hue: 15 + Math.random() * 35,
    }));
    let running = true;
    const draw = () => {
      if (!running) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vy *= 0.995;
        if (p.life <= 0 || p.y < -20) {
          p.x = Math.random() * width;
          p.y = height + Math.random() * 30;
          p.life = 0.7 + Math.random() * 0.3;
          p.vy = -(0.6 + Math.random() * 1.6);
          p.vx = (Math.random() - 0.5) * 0.6;
          p.r = 1.5 + Math.random() * 3;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue}, 100%, 65%, 1)`);
        g.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
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
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-80" />;
}

export function StarsEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; };
    resize();
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.3 + Math.random() * 1.4,
      base: 0.2 + Math.random() * 0.7,
      tw: 0.01 + Math.random() * 0.04,
      ph: Math.random() * Math.PI * 2,
      tinted: Math.random() < 0.25,
    }));
    const accent = accentColor(0.6);
    let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    let t = 0;
    let running = true;
    const draw = () => {
      if (!running) return;
      t++;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const alpha = Math.max(0.05, s.base + Math.sin(t * s.tw + s.ph) * 0.3);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.tinted ? accent : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!shoot && Math.random() < 0.003) {
        shoot = { x: Math.random() * width * 0.6, y: Math.random() * height * 0.4, vx: 6 + Math.random() * 4, vy: 2 + Math.random() * 2, life: 1 };
      }
      if (shoot) {
        shoot.x += shoot.vx;
        shoot.y += shoot.vy;
        shoot.life -= 0.02;
        ctx.globalAlpha = Math.max(0, shoot.life);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(shoot.x, shoot.y);
        ctx.lineTo(shoot.x - shoot.vx * 6, shoot.y - shoot.vy * 6);
        ctx.stroke();
        if (shoot.life <= 0 || shoot.x > width || shoot.y > height) shoot = null;
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
}

export function BubblesEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; };
    resize();
    const bubbles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 6 + Math.random() * 18,
      vy: -(0.2 + Math.random() * 0.6),
      vx: (Math.random() - 0.5) * 0.2,
      wob: Math.random() * Math.PI * 2,
      ws: 0.01 + Math.random() * 0.02,
      a: 0.15 + Math.random() * 0.25,
    }));
    let running = true;
    const draw = () => {
      if (!running) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const b of bubbles) {
        b.x += b.vx + Math.sin(b.wob) * 0.3;
        b.y += b.vy;
        b.wob += b.ws;
        if (b.y + b.r < -10) { b.y = height + b.r + Math.random() * 40; b.x = Math.random() * width; }
        ctx.globalAlpha = b.a;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = b.a * 0.35;
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
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
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-70" />;
}

export function FogEffect() {
  return (
    <div className="bg-effect-overlay">
      <div className="fog-layer fog-layer-1" />
      <div className="fog-layer fog-layer-2" />
      <div className="fog-layer fog-layer-3" />
    </div>
  );
}

export function HeartsEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; };
    resize();
    const accent = accentColor(0.7);
    const hearts = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 80,
      s: 8 + Math.random() * 14,
      vy: -(0.4 + Math.random() * 0.9),
      vx: (Math.random() - 0.5) * 0.4,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.02,
      a: 0.25 + Math.random() * 0.4,
    }));
    const drawHeart = (x: number, y: number, s: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.25);
      ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.25);
      ctx.bezierCurveTo(x - s * 0.5, y + s * 0.55, x, y + s * 0.75, x, y + s);
      ctx.bezierCurveTo(x, y + s * 0.75, x + s * 0.5, y + s * 0.55, x + s * 0.5, y + s * 0.25);
      ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.25);
      ctx.closePath();
    };
    let running = true;
    const draw = () => {
      if (!running) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const h of hearts) {
        h.x += h.vx;
        h.y += h.vy;
        h.rot += h.vr;
        if (h.y + h.s < -20) { h.y = height + h.s + Math.random() * 60; h.x = Math.random() * width; }
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rot);
        ctx.globalAlpha = h.a;
        ctx.fillStyle = accent;
        drawHeart(0, -h.s / 2, h.s);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-70" />;
}

export function LeavesEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; };
    resize();
    const leaves = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height,
      s: 6 + Math.random() * 12,
      vy: 0.6 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.04,
      hue: 25 + Math.random() * 45,
      wob: Math.random() * Math.PI * 2,
    }));
    let running = true;
    const draw = () => {
      if (!running) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const l of leaves) {
        l.x += l.vx + Math.sin(l.wob) * 0.4;
        l.y += l.vy;
        l.rot += l.vr;
        l.wob += 0.02;
        if (l.y > height + 20) { l.y = -20; l.x = Math.random() * width; }
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = `hsla(${l.hue}, 70%, 45%, 0.85)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, l.s, l.s * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `hsla(${l.hue}, 70%, 30%, 0.6)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-l.s, 0);
        ctx.lineTo(l.s, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-80" />;
}

export function LightningEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; };
    resize();
    let flash = 0;
    let bolt: { pts: { x: number; y: number }[]; life: number } | null = null;
    let running = true;
    const makeBolt = (w: number, h: number) => {
      const pts = [{ x: Math.random() * w, y: 0 }];
      let x = pts[0].x, y = 0;
      while (y < h) {
        x += (Math.random() - 0.5) * 60;
        y += 20 + Math.random() * 40;
        pts.push({ x, y });
      }
      return { pts, life: 1 };
    };
    const draw = () => {
      if (!running) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      if (!bolt && Math.random() < 0.004) {
        bolt = makeBolt(width, height);
        flash = 0.6;
      }
      if (bolt) {
        ctx.globalAlpha = bolt.life;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#aaddff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(bolt.pts[0].x, bolt.pts[0].y);
        for (let i = 1; i < bolt.pts.length; i++) ctx.lineTo(bolt.pts[i].x, bolt.pts[i].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        bolt.life -= 0.06;
        if (bolt.life <= 0) bolt = null;
      }
      if (flash > 0) {
        ctx.globalAlpha = flash * 0.25;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        flash -= 0.05;
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-90" />;
}

export function WavesEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; };
    resize();
    const accent = accentColor(0.5);
    let t = 0;
    let running = true;
    const draw = () => {
      if (!running) return;
      t += 0.02;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const waves = [
        { amp: height * 0.06, freq: 0.012, speed: 1, y: height * 0.5, alpha: 0.35 },
        { amp: height * 0.04, freq: 0.02, speed: 1.4, y: height * 0.55, alpha: 0.25 },
        { amp: height * 0.08, freq: 0.008, speed: 0.7, y: height * 0.45, alpha: 0.18 },
      ];
      for (const w of waves) {
        ctx.globalAlpha = w.alpha;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 4) {
          const y = w.y + Math.sin(x * w.freq + t * w.speed) * w.amp;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => { running = false; ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-80" />;
}
