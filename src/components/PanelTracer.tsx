import { useEffect, useRef, useState } from "react";

type Pt = { X: number; Y: number; NX: number; NY: number };

const DEFAULTS: Record<string, string> = {
  lightning: "#38bdf8",
  fire: "#f97316",
  flowers: "#f472b6",
  snow: "#e0f2ff",
  stars: "#fde047",
  hearts: "#f9a8d4",
};

function BuildPath(W: number, H: number, R: number) {
  const Pts: Pt[] = [];
  const Step = 0.1;
  const Add = (X: number, Y: number, NX: number, NY: number) => Pts.push({ X, Y, NX, NY });
  for (let X = R; X <= W - R; X += 2) Add(X, 1, 0, -1);
  for (let A = -Math.PI / 2; A <= 0; A += Step) Add(W - R + Math.cos(A) * R, R + Math.sin(A) * R, Math.cos(A), Math.sin(A));
  for (let Y = R; Y <= H - R; Y += 2) Add(W - 1, Y, 1, 0);
  for (let A = 0; A <= Math.PI / 2; A += Step) Add(W - R + Math.cos(A) * R, H - R + Math.sin(A) * R, Math.cos(A), Math.sin(A));
  for (let X = W - R; X >= R; X -= 2) Add(X, H - 1, 0, 1);
  for (let A = Math.PI / 2; A <= Math.PI; A += Step) Add(R + Math.cos(A) * R, H - R + Math.sin(A) * R, Math.cos(A), Math.sin(A));
  for (let Y = H - R; Y >= R; Y -= 2) Add(1, Y, -1, 0);
  for (let A = Math.PI; A <= Math.PI * 1.5; A += Step) Add(R + Math.cos(A) * R, R + Math.sin(A) * R, Math.cos(A), Math.sin(A));
  if (!Pts.length) Pts.push({ X: 0, Y: 0, NX: 0, NY: 0 });
  return Pts;
}

function Rand(Seed: number) {
  const X = Math.sin(Seed * 12.9898) * 43758.5453;
  return X - Math.floor(X);
}

function DrawFlower(Ctx: CanvasRenderingContext2D, X: number, Y: number, Size: number, Spin: number, Base: string) {
  const Tilt = 0.55 + 0.45 * Math.abs(Math.sin(Spin * 0.7));
  Ctx.save();
  Ctx.translate(X, Y);
  Ctx.rotate(Spin);
  Ctx.scale(1, Tilt);
  Ctx.shadowColor = Base;
  Ctx.shadowBlur = 16;
  for (const Side of [-1, 1]) {
    Ctx.save();
    Ctx.rotate(Side * 1.15);
    const LG = Ctx.createLinearGradient(0, Size * 0.2, Side * Size * 0.9, Size * 0.95);
    LG.addColorStop(0, "rgba(134,239,172,0.95)");
    LG.addColorStop(1, "rgba(21,94,50,0.45)");
    Ctx.fillStyle = LG;
    Ctx.beginPath();
    Ctx.ellipse(Side * Size * 0.45, Size * 0.85, Size * 0.5, Size * 0.2, Side * 0.5, 0, Math.PI * 2);
    Ctx.fill();
    Ctx.restore();
  }
  for (let I = 0; I < 8; I++) {
    Ctx.save();
    Ctx.rotate((I / 8) * Math.PI * 2 + 0.18);
    const G = Ctx.createRadialGradient(0, -Size * 0.98, 1, 0, -Size * 0.5, Size);
    G.addColorStop(0, "#ffffff");
    G.addColorStop(0.32, I % 2 ? "#ffeaf4" : Base);
    G.addColorStop(0.78, Base);
    G.addColorStop(1, "rgba(90,10,50,0.42)");
    Ctx.fillStyle = G;
    Ctx.beginPath();
    Ctx.ellipse(0, -Size * 0.7, Size * 0.34, Size * 0.72, 0, 0, Math.PI * 2);
    Ctx.fill();
    Ctx.strokeStyle = "rgba(255,255,255,0.22)";
    Ctx.lineWidth = 0.8;
    Ctx.beginPath();
    Ctx.moveTo(0, -Size * 0.2);
    Ctx.lineTo(0, -Size * 1.3);
    Ctx.stroke();
    Ctx.restore();
  }
  const C = Ctx.createRadialGradient(-Size * 0.16, -Size * 0.16, 1, 0, 0, Size * 0.44);
  C.addColorStop(0, "#fffbe0");
  C.addColorStop(0.45, "#ffd166");
  C.addColorStop(1, "#a86b08");
  Ctx.fillStyle = C;
  Ctx.beginPath();
  Ctx.arc(0, 0, Size * 0.37, 0, Math.PI * 2);
  Ctx.fill();
  Ctx.fillStyle = "rgba(255,255,255,0.85)";
  Ctx.beginPath();
  Ctx.ellipse(-Size * 0.13, -Size * 0.15, Size * 0.1, Size * 0.06, -0.6, 0, Math.PI * 2);
  Ctx.fill();
  Ctx.restore();
}

function DrawHeart(Ctx: CanvasRenderingContext2D, X: number, Y: number, S: number, Base: string, Alpha: number) {
  Ctx.save();
  Ctx.globalAlpha = Alpha;
  Ctx.shadowColor = Base;
  Ctx.shadowBlur = 18;
  Ctx.beginPath();
  Ctx.moveTo(X, Y + S * 0.4);
  Ctx.bezierCurveTo(X - S * 1.1, Y - S * 0.5, X - S * 0.6, Y - S * 1.15, X, Y - S * 0.5);
  Ctx.bezierCurveTo(X + S * 0.6, Y - S * 1.15, X + S * 1.1, Y - S * 0.5, X, Y + S * 0.4);
  const G = Ctx.createLinearGradient(X - S, Y - S, X + S, Y + S);
  G.addColorStop(0, "#ffffff");
  G.addColorStop(0.26, "#ffe3ef");
  G.addColorStop(0.62, Base);
  G.addColorStop(1, "rgba(140,20,80,0.9)");
  Ctx.fillStyle = G;
  Ctx.fill();
  Ctx.shadowBlur = 0;
  Ctx.fillStyle = "rgba(255,255,255,0.85)";
  Ctx.beginPath();
  Ctx.ellipse(X - S * 0.42, Y - S * 0.58, S * 0.18, S * 0.1, -0.55, 0, Math.PI * 2);
  Ctx.fill();
  Ctx.restore();
}

function DrawFlake(Ctx: CanvasRenderingContext2D, X: number, Y: number, S: number, Spin: number, Alpha: number) {
  Ctx.save();
  Ctx.translate(X, Y);
  Ctx.rotate(Spin);
  Ctx.strokeStyle = `rgba(224,242,255,${Alpha})`;
  Ctx.lineWidth = Math.max(1, S * 0.11);
  Ctx.lineCap = "round";
  for (let I = 0; I < 6; I++) {
    Ctx.save();
    Ctx.rotate((I / 6) * Math.PI * 2);
    Ctx.beginPath();
    Ctx.moveTo(0, 0);
    Ctx.lineTo(0, -S);
    Ctx.moveTo(0, -S * 0.55);
    Ctx.lineTo(-S * 0.25, -S * 0.78);
    Ctx.moveTo(0, -S * 0.55);
    Ctx.lineTo(S * 0.25, -S * 0.78);
    Ctx.stroke();
    Ctx.restore();
  }
  Ctx.restore();
}

function DrawStar(Ctx: CanvasRenderingContext2D, X: number, Y: number, S: number, Spin: number, Alpha: number) {
  Ctx.save();
  Ctx.translate(X, Y);
  Ctx.rotate(Spin);
  const G = Ctx.createRadialGradient(0, 0, 0, 0, 0, S);
  G.addColorStop(0, `rgba(255,255,255,${Alpha})`);
  G.addColorStop(0.4, `rgba(253,224,71,${Alpha * 0.8})`);
  G.addColorStop(1, "rgba(253,224,71,0)");
  Ctx.fillStyle = G;
  Ctx.beginPath();
  for (let I = 0; I < 8; I++) {
    const A = (I / 8) * Math.PI * 2;
    const R = I % 2 === 0 ? S : S * 0.3;
    const PX = Math.cos(A) * R;
    const PY = Math.sin(A) * R;
    if (I === 0) Ctx.moveTo(PX, PY);
    else Ctx.lineTo(PX, PY);
  }
  Ctx.closePath();
  Ctx.fill();
  Ctx.restore();
}

export function PanelTracer({ Type, Color, Speed }: { Type: string | null; Color: string | null; Speed: number | null }) {
  const Lap = (100 - (Speed ?? 50)) * 0.12 + 3;
  const T = Type || "pulse";
  const BoxRef = useRef<HTMLDivElement>(null);
  const CanvasRef = useRef<HTMLCanvasElement>(null);
  const [Size, setSize] = useState({ W: 0, H: 0 });

  useEffect(() => {
    const El = BoxRef.current;
    if (!El) return;
    const RO = new ResizeObserver(() => setSize({ W: El.clientWidth, H: El.clientHeight }));
    RO.observe(El);
    setSize({ W: El.clientWidth, H: El.clientHeight });
    return () => RO.disconnect();
  }, []);

  useEffect(() => {
    if (T === "pulse") return;
    const Canvas = CanvasRef.current;
    if (!Canvas || !Size.W || !Size.H) return;
    const Ctx = Canvas.getContext("2d");
    if (!Ctx) return;
    const Dpr = Math.min(2, window.devicePixelRatio || 1);
    Canvas.width = Size.W * Dpr;
    Canvas.height = Size.H * Dpr;
    Canvas.style.width = `${Size.W}px`;
    Canvas.style.height = `${Size.H}px`;
    Ctx.setTransform(Dpr, 0, 0, Dpr, 0, 0);

    const C = Color || DEFAULTS[T] || "#38bdf8";
    const Pts = BuildPath(Size.W, Size.H, 26);
    const Len = Pts.length;
    const At = (S: number) => Pts[((Math.floor(S) % Len) + Len) % Len];
    const Outline = new Path2D();
    Pts.forEach((P, I) => (I === 0 ? Outline.moveTo(P.X, P.Y) : Outline.lineTo(P.X, P.Y)));
    Outline.closePath();
    const SpeedMul = (100 - (Speed ?? 50)) / 60 + 0.35;
    let Rq = 0;
    let Prev = performance.now();

    type Particle = { X: number; Y: number; NX: number; NY: number; Life: number; Max: number; Size: number; Seed: number; S: number; Vs: number; Spin: number };
    const Parts: Particle[] = [];
    const Make = (S: number, Max: number, Size: number): Particle => {
      const P = At(S);
      return { X: P.X, Y: P.Y, NX: P.NX, NY: P.NY, Life: 0, Max, Size, Seed: Math.random() * 1000, S, Vs: 0, Spin: Math.random() * 6.28 };
    };

    if (T === "flowers") {
      const N = Math.max(6, Math.round(Len / 55));
      for (let I = 0; I < N; I++) Parts.push(Make((I / N) * Len, 1e9, 12 + Math.random() * 8));
    } else if (T === "snow") {
      const N = Math.max(14, Math.round(Len / 16));
      for (let I = 0; I < N; I++) {
        const P = Make(Math.random() * Len, 1e9, 0);
        P.Vs = (Math.random() - 0.5) * 0.05;
        Parts.push(P);
      }
    } else if (T === "stars") {
      const N = Math.max(10, Math.round(Len / 26));
      for (let I = 0; I < N; I++) {
        const P = Make(Math.random() * Len, 1e9, 0);
        P.Vs = (Math.random() - 0.5) * 0.04;
        Parts.push(P);
      }
    } else if (T === "hearts") {
      const N = Math.max(8, Math.round(Len / 70));
      for (let I = 0; I < N; I++) Parts.push(Make((I / N) * Len, 1e9, 0));
    }

    let NextStrike = 0;
    let Strike: { S: number; Len: number; Seed: number; Age: number } | null = null;

    const Frame = (Now: number) => {
      const Dt = Math.min(0.05, (Now - Prev) / 1000);
      Prev = Now;
      const Time = Now / 1000;
      Ctx.clearRect(0, 0, Size.W, Size.H);

      if (T === "fire") {
        const Emit = Math.max(6, Math.round(Len / 18));
        for (let I = 0; I < Emit; I++) {
          const P = Make(Math.random() * Len, 0.55 + Math.random() * 0.7, 3 + Math.random() * 7);
          P.NX = P.NX + (Math.random() - 0.5) * 0.5;
          P.NY = P.NY + (Math.random() - 0.5) * 0.5;
          Parts.push(P);
        }
        Ctx.save();
        Ctx.globalCompositeOperation = "lighter";
        Ctx.lineWidth = 2.5;
        Ctx.strokeStyle = `rgba(255,120,30,${0.16 + Math.sin(Time * 9) * 0.05})`;
        Ctx.shadowColor = "#ff7a18";
        Ctx.shadowBlur = 18;
        Ctx.beginPath();
        for (let I = 0; I <= Len; I += 6) {
          const P = At(I);
          if (I === 0) Ctx.moveTo(P.X, P.Y);
          else Ctx.lineTo(P.X, P.Y);
        }
        Ctx.closePath();
        Ctx.stroke();
        Ctx.shadowBlur = 0;
        for (let I = Parts.length - 1; I >= 0; I--) {
          const P = Parts[I];
          P.Life += Dt;
          if (P.Life >= P.Max) { Parts.splice(I, 1); continue; }
          const R = P.Life / P.Max;
          const Drift = 1 + R * 9;
          const X = P.X + P.NX * Drift * 2 + (Rand(P.Seed + Time * 2) - 0.5) * R * 6;
          const Y = P.Y + P.NY * Drift * 2 + (Rand(P.Seed * 2 + Time * 2) - 0.5) * R * 6;
          const Rad = P.Size * (1 - R * 0.65);
          const G = Ctx.createRadialGradient(X, Y, 0, X, Y, Rad);
          if (R < 0.3) {
            G.addColorStop(0, "rgba(255,255,235,0.95)");
            G.addColorStop(0.5, "rgba(255,214,90,0.8)");
            G.addColorStop(1, "rgba(255,120,20,0)");
          } else if (R < 0.65) {
            G.addColorStop(0, "rgba(255,196,60,0.85)");
            G.addColorStop(0.6, "rgba(255,110,20,0.6)");
            G.addColorStop(1, "rgba(180,30,0,0)");
          } else {
            G.addColorStop(0, "rgba(255,90,20,0.4)");
            G.addColorStop(1, "rgba(90,10,0,0)");
          }
          Ctx.fillStyle = G;
          Ctx.beginPath();
          Ctx.arc(X, Y, Rad, 0, Math.PI * 2);
          Ctx.fill();
        }
        Ctx.restore();
      }

      if (T === "lightning") {
        if (!Strike && Time > NextStrike) {
          Strike = { S: Math.random() * Len, Len: Len * (0.1 + Math.random() * 0.18), Seed: Math.random() * 1000, Age: 0 };
          NextStrike = Time + 0.35 + Math.random() * 1.1;
        }
        Parts.length = 0;
        if (Strike) {
          Strike.Age += Dt;
          const Fade = Math.max(0, 1 - Strike.Age / 0.3);
          if (Fade <= 0) Strike = null;
          if (Strike) {
            const Ca = Fade;
            const Bolt = (Start: number, Length: number, Amp: number, Seed: number, Width: number, Stroke: string, Blur: number) => {
              const Steps = Math.max(8, Math.floor(Length / 4.5));
              Ctx.save();
              Ctx.strokeStyle = Stroke;
              Ctx.lineWidth = Width;
              Ctx.lineCap = "round";
              Ctx.lineJoin = "round";
              Ctx.shadowColor = C;
              Ctx.shadowBlur = Blur;
              Ctx.beginPath();
              for (let I = 0; I <= Steps; I++) {
                const P = At(Start + (I / Steps) * Length);
                const Env = Math.sin((I / Steps) * Math.PI);
                const J = (Rand(Seed + I * 3.7) - 0.5) * Amp * Env;
                const Rise = (Rand(Seed + I * 9.1) - 0.5) * Amp * 0.5 * Env;
                const X = P.X + P.NX * (J + Rise);
                const Y = P.Y + P.NY * (J + Rise);
                if (I === 0) Ctx.moveTo(X, Y);
                else Ctx.lineTo(X, Y);
              }
              Ctx.stroke();
              Ctx.restore();
            };
            Ctx.save();
            Ctx.globalCompositeOperation = "lighter";
            Ctx.strokeStyle = `rgba(56,189,248,${0.06 * Ca})`;
            Ctx.lineWidth = 10;
            Ctx.shadowColor = C;
            Ctx.shadowBlur = 34;
            Ctx.stroke(Outline);
            Ctx.strokeStyle = `rgba(186,230,253,${0.28 * Ca})`;
            Ctx.lineWidth = 2;
            Ctx.shadowBlur = 18;
            Ctx.stroke(Outline);
            Ctx.shadowBlur = 0;
            for (let L = 0; L < 3; L++) {
              const Lp = 1 - L * 0.28;
              Bolt(Strike.S, Strike.Len * Lp, 20 - L * 4, Strike.Seed + L * 41, L === 0 ? 14 : 8, `rgba(56,189,248,${(L === 0 ? 0.22 : 0.13) * Ca})`, 30);
            }
            Bolt(Strike.S, Strike.Len, 20, Strike.Seed, 6, `rgba(125,211,252,${0.7 * Ca})`, 16);
            Bolt(Strike.S, Strike.Len, 20, Strike.Seed, 2.2, `rgba(255,255,255,${Ca})`, 8);
            for (let B = 0; B < 6; B++) {
              const BS = Strike.S + Strike.Len * (0.08 + B * 0.15);
              const P = At(BS);
              const Dx = (Rand(Strike.Seed + B * 7) - 0.5) * 30;
              const Dy = (Rand(Strike.Seed + B * 11) - 0.5) * 30;
              Ctx.strokeStyle = `rgba(186,230,253,${0.5 * Ca})`;
              Ctx.lineWidth = 1.6;
              Ctx.shadowColor = C;
              Ctx.shadowBlur = 12;
              Ctx.beginPath();
              Ctx.moveTo(P.X, P.Y);
              let BX = P.X;
              let BY = P.Y;
              for (let K = 0; K < 5; K++) {
                BX += Dx / 5 + (Rand(Strike.Seed + B * 7 + K) - 0.5) * 12 + P.NX * 3;
                BY += Dy / 5 + (Rand(Strike.Seed + B * 11 + K) - 0.5) * 12 + P.NY * 3;
                Ctx.lineTo(BX, BY);
              }
              Ctx.stroke();
            }
            for (let Sp = 0; Sp < 14; Sp++) {
              const P = At(Strike.S + Strike.Len * Rand(Strike.Seed + Sp * 3.3));
              const X = P.X + (Rand(Strike.Seed + Sp) - 0.5) * 40;
              const Y = P.Y + (Rand(Strike.Seed + Sp * 2) - 0.5) * 40;
              const G = Ctx.createRadialGradient(X, Y, 0, X, Y, 2.4);
              G.addColorStop(0, `rgba(255,255,255,${0.9 * Ca})`);
              G.addColorStop(1, "rgba(56,189,248,0)");
              Ctx.fillStyle = G;
              Ctx.beginPath();
              Ctx.arc(X, Y, 2.4, 0, Math.PI * 2);
              Ctx.fill();
            }
            Ctx.restore();
          }
        }
        if (!Strike) {
          const P = At((Time * 260 * SpeedMul) % Len);
          Ctx.save();
          Ctx.globalCompositeOperation = "lighter";
          const G = Ctx.createRadialGradient(P.X, P.Y, 0, P.X, P.Y, 14);
          G.addColorStop(0, "rgba(255,255,255,0.95)");
          G.addColorStop(0.35, "rgba(56,189,248,0.7)");
          G.addColorStop(1, "rgba(56,189,248,0)");
          Ctx.fillStyle = G;
          Ctx.beginPath();
          Ctx.arc(P.X, P.Y, 14, 0, Math.PI * 2);
          Ctx.fill();
          Ctx.strokeStyle = "rgba(125,211,252,0.35)";
          Ctx.lineWidth = 2;
          Ctx.shadowColor = C;
          Ctx.shadowBlur = 14;
          Ctx.beginPath();
          Ctx.arc(P.X, P.Y, 6, 0, Math.PI * 2);
          Ctx.stroke();
          Ctx.restore();
        }
      }

      if (T === "flowers") {
        for (const P of Parts) {
          P.S += Dt * 18 * SpeedMul;
          const Q = At(P.S);
          const Bob = Math.sin(Time * 1.2 + P.Seed) * 3;
          DrawFlower(Ctx, Q.X + Q.NX * (7 + Bob), Q.Y + Q.NY * (7 + Bob), P.Size, Time * 1.1 + P.Seed, C);
        }
      }

      if (T === "snow") {
        for (const P of Parts) {
          P.S += (P.Vs * 60 + 10) * Dt * SpeedMul;
          const Q = At(P.S);
          const Fl = 0.55 + 0.45 * Math.sin(Time * 2 + P.Seed);
          DrawFlake(Ctx, Q.X + Q.NX * 5, Q.Y + Q.NY * 5, 4 + Fl * 4, Time * 0.8 + P.Seed, 0.35 + Fl * 0.5);
        }
      }

      if (T === "stars") {
        Ctx.save();
        Ctx.globalCompositeOperation = "lighter";
        for (const P of Parts) {
          P.S += P.Vs * 60 * Dt * SpeedMul;
          const Q = At(P.S);
          const Tw = 0.4 + 0.6 * Math.pow(Math.abs(Math.sin(Time * 1.6 + P.Seed)), 3);
          DrawStar(Ctx, Q.X + Q.NX * 4, Q.Y + Q.NY * 4, 4 + Tw * 7, Time * 0.4 + P.Seed, Tw);
        }
        Ctx.restore();
      }

      if (T === "hearts") {
        for (const P of Parts) {
          P.S += Dt * 24 * SpeedMul;
          const Q = At(P.S);
          const Bob = Math.sin(Time * 1.6 + P.Seed);
          DrawHeart(Ctx, Q.X + Q.NX * (10 + Bob * 3), Q.Y + Q.NY * (10 + Bob * 3), 11 + Rand(P.Seed) * 3, C, 0.75 + 0.25 * Bob);
        }
      }

      Rq = requestAnimationFrame(Frame);
    };
    Rq = requestAnimationFrame(Frame);
    return () => cancelAnimationFrame(Rq);
  }, [T, Color, Speed, Size.W, Size.H, Lap]);

  if (T === "pulse") {
    const C = Color || "#3b82f6";
    return <span className="pulse-dot" style={{ backgroundColor: C, boxShadow: `0 0 8px 2px ${C}, 0 0 18px 6px ${C}`, animationDuration: `${Lap}s, 1.2s` }} />;
  }

  return (
    <div ref={BoxRef} className="pointer-events-none absolute inset-0">
      <canvas ref={CanvasRef} className="pointer-events-none absolute left-0 top-0" />
    </div>
  );
}
