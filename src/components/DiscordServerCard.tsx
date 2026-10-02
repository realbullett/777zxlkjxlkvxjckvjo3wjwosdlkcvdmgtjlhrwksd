import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { DiscordServerConfig } from "../lib/widgets";

type ServerInfo = {
  name: string;
  icon: string;
  online: number;
  members: number;
};

export default function DiscordServerCard({ config, instant = false }: { config: DiscordServerConfig; instant?: boolean }) {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const code = (config.inviteCode || "").trim();

  useEffect(() => {
    if (!code) return;
    let alive = true;
    setInfo(null);
    setFailed(false);
    fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (!j || !j.guild) { setFailed(true); return; }
        setInfo({
          name: String(j.guild.name || "discord server"),
          icon: j.guild.icon ? `https://cdn.discordapp.com/icons/${j.guild.id}/${j.guild.icon}.png?size=128` : "",
          online: Number(j.approximate_presence_count || 0),
          members: Number(j.approximate_member_count || 0),
        });
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [code]);

  if (!code) return null;

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
          couldn't load this discord server — check the invite link
        </p>
      )}
      {info && (
        <div>
          <div className="flex items-center gap-4">
            {info.icon ? (
              <img src={info.icon} alt="" className="h-14 w-14 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl font-black" style={{ color: "var(--text-color, #ffffff)" }}>
                {info.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-bold tracking-tight" style={{ color: "var(--text-color, #ffffff)" }}>
                {info.name}
              </p>
              <div className="mt-1 flex items-center gap-4 text-sm font-semibold" style={{ color: "var(--text-color, #ffffff)", opacity: 0.85 }}>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {info.online.toLocaleString("en-US")} online
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/50" />
                  {info.members.toLocaleString("en-US")} members
                </span>
              </div>
            </div>
          </div>
          <a
            href={`https://discord.gg/${encodeURIComponent(code)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition-transform hover:scale-105"
          >
            Join Server
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
          </a>
        </div>
      )}
    </motion.div>
  );
}
