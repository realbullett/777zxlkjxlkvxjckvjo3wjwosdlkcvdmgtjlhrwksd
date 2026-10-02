import { useEffect, useState } from "react";
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

export default function LastfmCard({ config, instant = false }: { config: LastfmConfig; instant?: boolean }) {
  const [info, setInfo] = useState<FmInfo | null>(null);
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
      className="glass-card w-full rounded-3xl p-6"
    >
      {!info && !failed && (
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-14 w-14 rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
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
          <div className="flex items-center gap-4">
            {info.image ? (
              <img src={info.image} alt="" className="h-14 w-14 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-black" style={{ color: "var(--text-color, #ffffff)" }}>
                {info.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-bold tracking-tight" style={{ color: "var(--text-color, #ffffff)" }}>
                {info.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold" style={{ color: "var(--text-color, #ffffff)", opacity: 0.85 }}>
                <span className="flex items-center gap-1.5">
                  <Headphones size={13} />
                  {info.playcount.toLocaleString("en-US")} scrobbles
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {info.artistCount.toLocaleString("en-US")} artists
                </span>
              </div>
            </div>
          </div>
          <a
            href={`https://www.last.fm/user/${encodeURIComponent(info.name)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition-transform hover:scale-105"
          >
            View Profile
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
          </a>
          {info.tracks.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-color, #ffffff)", opacity: 0.5 }}>
                Recent Tracks
              </p>
              <div className="grid grid-cols-1 gap-x-6 min-[420px]:grid-cols-2">
                {info.tracks.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    {t.image ? (
                      <img src={t.image} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="h-11 w-11 shrink-0 rounded-xl bg-white/10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold leading-tight" style={{ color: "var(--text-color, #ffffff)" }}>
                        {t.nowPlaying ? <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 align-middle" /> : null}{t.name}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--text-color, #ffffff)", opacity: 0.6 }}>
                        {t.artist}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium" style={{ color: "var(--text-color, #ffffff)", opacity: 0.55 }}>
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
