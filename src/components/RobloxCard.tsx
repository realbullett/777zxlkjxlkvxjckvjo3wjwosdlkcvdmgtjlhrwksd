import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { RobloxConfig } from "../lib/widgets";

type RobloxInfo = {
  id: number;
  name: string;
  displayName: string;
  created: string;
  avatar: string;
  friends: number | null;
  followers: number | null;
};

function Compact(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  const v = Number(n);
  if (v >= 1000000) { const r = Math.round(v / 100000) / 10; return `${Number.isInteger(r) ? r : r}M`; }
  if (v >= 1000) { const r = Math.round(v / 100) / 10; return `${Number.isInteger(r) ? r : r}K`; }
  return String(v);
}

function RobloxLogo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <mask id="rbx-hole">
        <rect width="24" height="24" fill="#fff" />
        <rect x="9" y="9" width="6" height="6" fill="#000" />
      </mask>
      <g transform="rotate(12 12 12)">
        <rect x="4" y="4" width="16" height="16" rx="3.5" fill="#fff" mask="url(#rbx-hole)" />
      </g>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" style={{ verticalAlign: "-1px", opacity: 0.7 }}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1-3.8 3.8-5.5 7.5-5.5s6.5 1.7 7.5 5.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" style={{ verticalAlign: "-1px", opacity: 0.7 }}>
      <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0113 0C18.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.3" r="2.2" />
    </svg>
  );
}

export default function RobloxCard({ config, instant = false }: { config: RobloxConfig; instant?: boolean }) {
  const [info, setInfo] = useState<RobloxInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [avSrc, setAvSrc] = useState<string | null>(null);
  const [avDead, setAvDead] = useState(false);
  const username = (config.username || "").trim().replace(/^@/, "");

  useEffect(() => {
    if (!username) return;
    let alive = true;
    setInfo(null);
    setFailed(false);
    setAvSrc(null);
    setAvDead(false);
    fetch(`/api/me?action=roblox&user=${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (!j || !j.name) { setFailed(true); return; }
        setInfo(j as RobloxInfo);
        setAvSrc(j.avatar || null);
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [username]);

  if (!username) return null;

  const profUrl = info ? `https://www.roblox.com/users/${info.id}/profile` : "";
  const fbUrl = info ? `https://www.roblox.com/headshot/thumb?userId=${info.id}&x=180&y=180&format=png` : "";

  return (
    <motion.div
      initial={instant ? false : { opacity: 0, y: -28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="w-full rounded-[10px] p-3"
      style={{ background: "rgba(10,10,10,.6)", backdropFilter: "blur(8px)" }}
    >
      {!info && !failed && (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-11 w-11 rounded-lg bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      )}
      {failed && (
        <p className="text-sm" style={{ color: "var(--text-color, #ffffff)", opacity: 0.5 }}>
          couldn't load this roblox user — check the username
        </p>
      )}
      {info && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <RobloxLogo />
            <a href={profUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
              <p className="truncate text-[11px] hover:underline" style={{ color: "var(--text-color, #ffffff)", opacity: 0.55 }}>
                @{info.name}
              </p>
            </a>
          </div>
          <div className="flex items-center gap-3">
            {avSrc && !avDead ? (
              <img
                src={avSrc}
                alt=""
                className="h-11 w-11 shrink-0 rounded-lg object-cover"
                style={{ background: "#1e1e1e" }}
                onError={() => {
                  if (avSrc !== fbUrl && fbUrl) setAvSrc(fbUrl);
                  else setAvDead(true);
                }}
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-black" style={{ background: "#1e1e1e", color: "var(--text-color, #ffffff)" }}>
                {info.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <a href={profUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                <p className="truncate text-xl font-extrabold tracking-tight hover:underline" style={{ color: "var(--text-color, #ffffff)" }}>
                  {info.displayName}
                </p>
              </a>
              <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-color, #ffffff)", opacity: 0.55 }}>
                <PersonIcon /> {Compact(info.friends)} friends <span className="mx-1">•</span> <PinIcon /> {Compact(info.followers)} followers
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
