import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Play, Pause, Music, SkipBack, SkipForward } from "lucide-react";
import { motion, type Variants } from "motion/react";
import { parseSongUrl } from "../lib/song";
import SongPlayer from "./SongPlayer";

const dropContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const dropItem: Variants = {
  hidden: { opacity: 0, y: -28 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 22 } },
};

type TrackInfo = {
  title: string;
  artist: string;
  previewUrl: string;
  duration: number;
  synced: string | null;
  image: string;
  color: string;
  ytId: string;
};

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void; }
}

function loadYTAPI() {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
}

function withAlpha(c: string, a: number): string {
  const m = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/);
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) {
    const hex = c.length === 4 ? c.slice(1).split("").map((x) => x + x).join("") : c.slice(1);
    return `#${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;
  }
  return c;
}

function SpotifyPlayerLyrics({ id, autoPlay = false }: { id: string; autoPlay?: boolean }) {
  const [info, setInfo] = useState<TrackInfo | null>(null);
  const [error, setError] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [useYt, setUseYt] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);
  const startedRef = useRef(false);
  const manualRef = useRef(false);
  const playingRef = useRef(false);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setError(false);
    setPlaying(false);
    setCurrent(-1);
    setTime(0);
    setDuration(0);
    durationRef.current = 0;
    setYtReady(false);
    setUseYt(true);
    fetch(`/api/me?action=track&url=${encodeURIComponent(`https://open.spotify.com/track/${id}`)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d && !d.error && (d.title || d.synced)) setInfo(d);
        else setError(true);
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [id]);

  const lines = info?.synced
    ? info.synced.split("\n").map((l) => l.trim()).filter((l) => /\[.+?\]\s*\S/.test(l))
    : [];

  const timings = lines.map((line) => {
    const m = line.match(/\[(\d+):(\d{1,2})(?:\.(\d{1,3}))?\]/);
    if (!m) return -1;
    const frac = m[3] ? parseInt(m[3], 10) / Math.pow(10, m[3].length) : 0;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + frac;
  });

  const computeLine = (t: number) => {
    let idx = -1;
    for (let i = 0; i < timings.length; i++) {
      if (timings[i] < 0) continue;
      if (timings[i] <= t + 0.25) idx = i;
      else break;
    }
    return idx;
  };

  const ytActive = useYt && !!info?.ytId;

  const play = (fromZero: boolean) => {
    if (ytActive) {
      const pl = ytPlayerRef.current;
      if (!pl) return;
      try {
        if (fromZero) pl.seekTo(0, true);
        pl.playVideo();
        setPlaying(true);
      } catch {}
    } else {
      const a = audioRef.current;
      if (!a) return;
      if (fromZero) a.currentTime = 0;
      a.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const seek = (t: number) => {
    if (ytActive) {
      try { ytPlayerRef.current?.seekTo(t, true); } catch {}
    } else {
      const a = audioRef.current;
      if (a) a.currentTime = t;
    }
    setTime(t);
  };

  const getTime = () => {
    if (ytActive) {
      try { return ytPlayerRef.current?.getCurrentTime() || 0; } catch { return 0; }
    }
    return audioRef.current?.currentTime || 0;
  };

  const skipToLine = (dir: 1 | -1) => {
    const t = getTime();
    let target = -1;
    for (let i = 0; i < timings.length; i++) {
      if (timings[i] < 0) continue;
      if (dir === 1 && timings[i] > t + 0.3) { target = timings[i]; break; }
      if (dir === -1 && timings[i] < t - 0.3) target = timings[i];
    }
    seek(target < 0 ? 0 : target);
    if (!playingRef.current) play(false);
  };

  const onBarClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(frac * duration);
  };

  const pct = duration > 0 ? Math.min(100, Math.max(0, (time / duration) * 100)) : 0;

  useEffect(() => {
    if (!info?.ytId) { ytPlayerRef.current = null; return; }
    let p: any;
    let destroyed = false;
    loadYTAPI().then(() => {
      if (destroyed || !ytHostRef.current) return;
      p = new window.YT.Player(ytHostRef.current, {
        height: "0",
        width: "0",
        videoId: info.ytId,
        playerVars: { autoplay: 0, controls: 0, origin: location.origin, playsinline: 1 },
        events: {
          onReady: () => {
            ytPlayerRef.current = p;
            setYtReady(true);
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) setPlaying(false);
          },
        },
      });
    });
    return () => {
      destroyed = true;
      ytPlayerRef.current = null;
      try { p?.destroy(); } catch {}
    };
  }, [info?.ytId]);

  useEffect(() => {
    if (!info?.ytId) { setUseYt(true); return; }
    setUseYt(true);
    const t = setTimeout(() => {
      if (!ytPlayerRef.current) setUseYt(false);
    }, 7000);
    return () => clearTimeout(t);
  }, [info?.ytId]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = ytActive ? "" : (info?.previewUrl || "");
    a.load();
  }, [info?.previewUrl, ytActive]);

  useEffect(() => {
    if (!autoPlay || startedRef.current) return;
    const ready = ytActive ? ytReady : !!info?.previewUrl;
    if (!ready) return;
    startedRef.current = true;
    play(true);
  }, [autoPlay, ytActive, ytReady, info?.previewUrl]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !manualRef.current && !playingRef.current) {
            startedRef.current = true;
            play(false);
          }
        }
      },
      { threshold: 0.55 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ytActive, ytReady, info?.previewUrl]);

  useEffect(() => {
    if (ytActive) {
      let raf = 0;
      let last = -1;
      let lastSec = -1;
      const tick = () => {
        const pl = ytPlayerRef.current;
        if (pl) {
          try {
            const t = pl.getCurrentTime();
            const idx = computeLine(t);
            if (idx !== last) { last = idx; setCurrent(idx); }
            const s = Math.floor(t);
            if (s !== lastSec) { lastSec = s; setTime(t); }
            const d = pl.getDuration();
            if (d && d !== durationRef.current) { durationRef.current = d; setDuration(d); }
          } catch {}
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    const a = audioRef.current;
    if (!a || lines.length === 0) return;
    const onTime = () => {
      const t = a.currentTime;
      setCurrent(computeLine(t));
      setTime(t);
    };
    const onMeta = () => {
      if (isFinite(a.duration) && a.duration > 0) { durationRef.current = a.duration; setDuration(a.duration); }
    };
    const onEnded = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
    };
  }, [ytActive, lines]);

  useEffect(() => {
    if (current < 0) return;
    const box = boxRef.current;
    if (!box) return;
    const el = box.querySelector(`[data-line="${current}"]`);
    if (!el) return;
    const boxRect = box.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const target = box.scrollTop + (elRect.top - boxRect.top) - box.clientHeight / 2 + elRect.height / 2;
    box.scrollTo({ top: target, behavior: "smooth" });
  }, [current]);

  const toggle = () => {
    manualRef.current = true;
    if (playing) {
      if (ytActive) { try { ytPlayerRef.current?.pauseVideo(); } catch {} }
      else audioRef.current?.pause();
      setPlaying(false);
    } else {
      play(false);
    }
  };

  const canPlay = !!(info?.ytId || info?.previewUrl);

  return (
    <div
      ref={rootRef}
      className="w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
      style={{
        background: info?.color
          ? `linear-gradient(155deg, ${withAlpha(info.color, 0.32)} 0%, rgba(11,11,13,0.94) 58%), #0b0b0d`
          : "#0b0b0d",
      }}
    >
      <div className="flex items-center gap-4 p-5 pb-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          {info?.image ? (
            <img src={info.image} alt={info.title || ""} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/[0.06]">
              <Music size={26} className="text-white/30" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="truncate text-xl font-bold text-white leading-tight">{info?.title || (error ? "lyrics unavailable" : "loading track...")}</p>
          <p className="truncate text-sm text-white/50 mt-1">{info?.artist || "Spotify"}</p>
        </div>
        {canPlay && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => skipToLine(-1)}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white/90"
              title="previous line"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={toggle}
              className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer text-white"
              title={playing ? "pause" : "play"}
            >
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button
              onClick={() => skipToLine(1)}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white/90"
              title="next line"
            >
              <SkipForward size={18} />
            </button>
          </div>
        )}
      </div>
      {canPlay && (
        <div className="flex items-center gap-2 px-5 pb-4">
          <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/40">{fmt(time)}</span>
          <div className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/10" onClick={onBarClick}>
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: info?.color || "#9ca3af", opacity: 0.8 }} />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]"
              style={{ left: `calc(${pct}% - 6px)` }}
            />
          </div>
          <span className="w-9 shrink-0 text-[11px] tabular-nums text-white/40">{fmt(duration)}</span>
        </div>
      )}
      <div className="h-px bg-white/[0.08]" />
      <div className="p-5">
        <div ref={boxRef} className="hide-scrollbar allow-scroll max-h-52 min-h-[80px] overflow-y-auto rounded-xl bg-black/30 px-4 py-3 border border-white/[0.05]">
          {error && <p className="text-xs text-white/40 italic">couldn't load lyrics for this track.</p>}
          {!error && lines.length === 0 && (
            <p className="text-xs text-white/40 italic">no synced lyrics found for this track.</p>
          )}
          <div className="flex flex-col gap-2.5">
            {lines.map((line, i) => {
              const text = line.replace(/\[.+?\]/g, "").trim();
              const active = i === current;
              return (
                <p
                  key={i}
                  data-line={i}
                  className={`text-base leading-snug transition-all duration-200 ${active ? "text-white font-semibold scale-[1.02]" : "text-white/30"}`}
                  style={{ textShadow: active && info?.color ? `0 0 12px ${info.color}` : undefined }}
                >
                  {text || "\u00a0"}
                </p>
              );
            })}
          </div>
        </div>
      </div>
      <div ref={ytHostRef} className="hidden" />
      <audio ref={audioRef} preload="auto" />
    </div>
  );
}

export default function SongPage({ url, autoPlay = false }: { url: string; autoPlay?: boolean }) {
  const parsed = parseSongUrl(url);
  return (
    <motion.div
      variants={dropContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      className="flex flex-col items-start gap-7 w-full max-w-3xl"
    >
      <motion.div variants={dropItem}>
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "var(--text-color, #ffffff)" }}>
          Now Playing
        </h2>
      </motion.div>
      <motion.div variants={dropItem} className="w-full">
        {parsed ? (
          parsed.platform === "spotify" ? (
            <SpotifyPlayerLyrics id={parsed.id} autoPlay={autoPlay} />
          ) : (
            <SongPlayer platform={parsed.platform} id={parsed.id} fill />
          )
        ) : (
          <p className="text-sm text-white/40 italic">add a spotify track link in your dashboard to show live lyrics here.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
