import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
};

export function CursorEffect({ type, Bounded }: { type: string; Bounded?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const prevRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      if (Bounded) {
        const R = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(R.width));
        canvas.height = Math.max(1, Math.round(R.height));
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    if (Bounded && canvas.parentElement && typeof ResizeObserver !== "undefined") {
      const RO = new ResizeObserver(resize);
      RO.observe(canvas.parentElement);
    }

    const onMove = (ev: MouseEvent) => {
      let mx = ev.clientX;
      let my = ev.clientY;
      if (Bounded) {
        const R = canvas.getBoundingClientRect();
        mx -= R.left;
        my -= R.top;
        if (mx < 0 || my < 0 || mx > R.width || my > R.height) {
          mouseRef.current = { x: -1000, y: -1000 };
          return;
        }
      }
      const prev = prevRef.current;
      const dx = mx - prev.x;
      const dy = my - prev.y;
      const spd = Math.hypot(dx, dy) || 1;
      const nx = dx / spd;
      const ny = dy / spd;
      prevRef.current = { x: mx, y: my };
      mouseRef.current = { x: mx, y: my };
      if (type === "spark") {
        const n = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const t = Math.random();
          particlesRef.current.push({
            x: mx + (Math.random() - 0.5) * 6,
            y: my + (Math.random() - 0.5) * 6,
            vx: -nx * (0.8 + t * 3.2) + (Math.random() - 0.5) * 1.4,
            vy: -ny * (0.8 + t * 3.2) + (Math.random() - 0.5) * 1.4,
            life: 0,
            maxLife: 18 + Math.random() * 18,
            size: 0.8 + Math.random() * 2,
            hue: 0,
          });
        }
        return;
      }
      for (let i = 0; i < (type === "star" ? 2 : 3); i++) {
        particlesRef.current.push({
          x: mx + (Math.random() - 0.5) * 10,
          y: my + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 1,
          life: 0,
          maxLife: 20 + Math.random() * 20,
          size: type === "star" ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
          hue: Math.random() * 60 + (type === "star" ? 200 : 30),
        });
      }
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx;
        p.y += p.vy;
        if (type === "spark") {
          p.vx *= 0.93;
          p.vy *= 0.93;
        } else {
          p.vy += 0.05;
        }
        p.life++;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0 || p.life >= p.maxLife) { ps.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = alpha;
        if (type === "star") {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 0.1);
          ctx.fillStyle = `hsl(${p.hue}, 100%, 80%)`;
          const s = p.size;
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const a = (j * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = j % 2 === 0 ? s : s * 0.4;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.95)";
          ctx.lineCap = "round";
          ctx.lineWidth = Math.max(0.4, p.size * alpha * 1.4);
          ctx.shadowBlur = 8;
          ctx.shadowColor = "rgba(255,255,255,0.8)";
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (type === "spark" && mouseRef.current.x > -500) {
        const m = mouseRef.current;
        const R = 7 + Math.sin((performance.now() / 1000) * 7) * 1.4;
        ctx.save();
        ctx.translate(m.x, m.y);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 2.2);
        g.addColorStop(0, "rgba(255,255,255,0.45)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, R * 2.2, 0, Math.PI * 2);
        ctx.fill();
        const k = R * 0.2;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.moveTo(0, -R);
        ctx.quadraticCurveTo(k, -k, R, 0);
        ctx.quadraticCurveTo(k, k, 0, R);
        ctx.quadraticCurveTo(-k, k, -R, 0);
        ctx.quadraticCurveTo(-k, -k, 0, -R);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [type, Bounded]);

  return (
    <canvas
      ref={canvasRef}
      className={Bounded ? "absolute inset-0 h-full w-full pointer-events-none" : "fixed inset-0 pointer-events-none z-[9999]"}
    />
  );
}
