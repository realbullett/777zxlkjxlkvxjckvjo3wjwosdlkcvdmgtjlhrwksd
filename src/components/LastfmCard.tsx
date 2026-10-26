import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Headphones, Users } from "lucide-react";
import type { LastfmConfig } from "../lib/widgets";

type Track = {
  name: string;
  artist: string;
  image: string;
  uts: number;
  nowPlaying: boolean;
};

type FmInfo = {
  name: string;
  playcount: number;
  artistCount: number;
  image: string;
  tracks: Track[];
};

export function timeAgo(uts: number): string {
  const s = Math.max(1, Math.floor(Date.now() / 1000) - uts);
  if (s < 60) return `${s} second${s === 1 ? "" : "s"} ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  return `${Math.floor(mo / 12)} year${Math.floor(mo / 12) === 1 ? "" : "s"} ago`;
}

function SafeImg({ src, ClassName, Fallback }: { src: string; ClassName: string; Fallback: ReactNode }) {
  const [dead, setDead] = useState(false);
  if (!src || dead) return <>{Fallback}</>;
  return <img src={src} alt="" className={ClassName} onError={() => setDead(true)} />;
}

export default function LastfmCard({ config, instant = false }: { config: LastfmConfig; instant?: boolean }) {  const [info, setInfo] = useState<FmInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const username = (config.username || "").trim();

  useEffect(() => {
    if (!username) return;
    let alive = true;
    setInfo(null);
    setFailed(false);
    fetch(`/api/me?action=lastfm&user=${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (!j || !j.name) { setFailed(true); return; }
        setInfo(j as FmInfo);
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [username]);

  if (!username) return null;

  return (
    <motion.div
      initial={instant ? false : { opacity: 0, y: -28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="glass-card w-full rounded-2xl p-4"
    >
      {!info && !failed && (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-white/10" />
            <div className="h-2.5 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      )}
      {failed && (
        <p className="text-sm" style={{ color: "var(--text-color, #ffffff)", opacity: 0.5 }}>
          couldn't load this last.fm profile — check the username
        </p>
      )}
      {info && (
        <div>
          <div className="flex items-center gap-3">
            <SafeImg
              src={info.image}
              ClassName="h-10 w-10 rounded-xl object-cover"
              Fallback={
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-base font-black" style={{ color: "var(--text-color, #ffffff)" }}>
                  {info.name.charAt(0).toUpperCase()}
                </div>
              }
            />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight" style={{ color: "var(--text-color, #ffffff)" }}>
                {info.name}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-semibold" style={{ color: "var(--text-color, #ffffff)", opacity: 0.85 }}>
                <span className="flex items-center gap-1">
                  <Headphones size={11} />
                  {info.playcount.toLocaleString("en-US")} scrobbles
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {info.artistCount.toLocaleString("en-US")} artists
                </span>
              </div>
            </div>
          </div>
          <a
            href={`https://www.last.fm/user/${encodeURIComponent(info.name)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10.5px] font-bold text-black transition-transform hover:scale-105"
          >
            View Profile
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
          </a>
          {info.tracks.length > 0 && (
            <div className="mt-3.5">
              <p className="mb-1.5 text-[11px] font-bold" style={{ color: "var(--text-color, #ffffff)", opacity: 0.85 }}>
                Recent tracks
              </p>
              <div className="grid grid-cols-1 gap-x-5 min-[420px]:grid-cols-2">
                {info.tracks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5">
                    <SafeImg
                      src={t.image}
                      ClassName="h-8 w-8 shrink-0 rounded-lg object-cover"
                      Fallback={<div className="h-8 w-8 shrink-0 rounded-lg bg-white/10" />}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold leading-tight" style={{ color: "var(--text-color, #ffffff)" }}>
                        {t.nowPlaying ? <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 align-middle" /> : null}{t.name}
                      </p>
                      <p className="truncate text-[10.5px]" style={{ color: "var(--text-color, #ffffff)", opacity: 0.6 }}>
                        {t.artist}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium" style={{ color: "var(--text-color, #ffffff)", opacity: 0.55 }}>
                      {t.nowPlaying ? "now" : t.uts ? timeAgo(t.uts) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
