import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type PresenceRow = {
  discord_id: string;
  username: string | null;
  global_name: string | null;
  display_name: string | null;
  avatar: string | null;
  public_flags: number;
  status: string;
  custom_status: string | null;
  custom_status_emoji: string | null;
  activity_name: string | null;
  updated_at: string;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  online: { label: "online", color: "#23a559" },
  idle: { label: "idle", color: "#f0b232" },
  dnd: { label: "busy", color: "#f23f43" },
  offline: { label: "invisible", color: "#80848e" },
};

const DISCORD_BADGES: Array<{ bit: number; label: string; bg: string }> = [
  { bit: 1 << 0, label: "Staff", bg: "#5865F2" },
  { bit: 1 << 1, label: "Partner", bg: "#9B59B6" },
  { bit: 1 << 2, label: "HypeSquad Events", bg: "#F47FFF" },
  { bit: 1 << 3, label: "Bug Hunter Level 1", bg: "#3BA55D" },
  { bit: 1 << 6, label: "HypeSquad Bravery", bg: "#F47FFF" },
  { bit: 1 << 7, label: "HypeSquad Brilliance", bg: "#A3B9FF" },
  { bit: 1 << 8, label: "HypeSquad Balance", bg: "#45DDC0" },
  { bit: 1 << 9, label: "Early Supporter", bg: "#FAA61A" },
  { bit: 1 << 10, label: "Team User", bg: "#5865F2" },
  { bit: 1 << 12, label: "Bug Hunter Level 2", bg: "#C9B84C" },
  { bit: 1 << 14, label: "Verified Bot Developer", bg: "#3BA55D" },
  { bit: 1 << 16, label: "Certified Moderator", bg: "#45DDC0" },
  { bit: 1 << 17, label: "Bot HTTP Interactions", bg: "#5865F2" },
  { bit: 1 << 18, label: "Active Developer", bg: "#3BA55D" },
];

export default function DiscordRPC({ discordId, wide = false }: { discordId: string; wide?: boolean }) {
  const [data, setData] = useState<PresenceRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const load = () =>
      supabase
        .from("discord_presence")
        .select("*")
        .eq("discord_id", discordId)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && data) setData(data);
        });
    const start = () => {
      load();
      timer = setInterval(() => {
        if (!document.hidden) load();
      }, 60000);
    };
    const onVis = () => { if (!document.hidden) load(); };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelled = true; if (timer) clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [discordId]);

  if (!data) return null;

  const status = STATUS_META[data.status] || STATUS_META.offline;
  const avatarUrl = data.avatar
    ? `https://cdn.discordapp.com/avatars/${data.discord_id}/${data.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${Number(data.discord_id) % 5}.png`;
  const flags = Number(data.public_flags || 0);
  const badges = DISCORD_BADGES.filter((b) => (flags & b.bit) !== 0);
  const textStatus = data.custom_status;
  const activity = data.activity_name;
  let emoji: { id: string | null; name: string | null; animated?: boolean } | null = null;
  if (data.custom_status_emoji) {
    try {
      emoji = JSON.parse(data.custom_status_emoji);
    } catch {}
  }

  return (
    <div className={`w-full mx-auto ${wide ? "h-full" : "max-w-xs"}`}>
      <div className={`flex items-center gap-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] px-5 py-4 backdrop-blur-sm ${wide ? "h-full" : ""}`}>
        <div className="relative flex-shrink-0">
          <img src={avatarUrl} alt={data.username || ""} className={`${wide ? "h-12 w-12" : "h-10 w-10"} rounded-full`} />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#101014]"
            style={{ backgroundColor: status.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`truncate font-semibold text-white/90 ${wide ? "text-base" : "text-sm"}`}>{data.global_name || data.display_name || data.username || "user"}</span>
            {badges.map((b) => (
              <span key={b.bit} title={b.label} className={`${wide ? "h-3.5 w-3.5" : "h-3 w-3"} shrink-0 rounded-[4px] border border-black/30`} style={{ backgroundColor: b.bg }} />
            ))}
          </div>
          {(textStatus || emoji) && (
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              {emoji && (
                emoji.id
                  ? <img src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`} alt={emoji.name || ""} className="h-3.5 w-3.5 shrink-0" />
                  : <span className="shrink-0 text-[10px]">{emoji.name || ""}</span>
              )}
              {textStatus && <span className={`truncate text-white/50 font-medium ${wide ? "text-xs" : "text-[10px]"}`}>{textStatus}</span>}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          {activity && <span className={`truncate text-white/40 ${wide ? "max-w-[240px] text-xs" : "max-w-[90px] text-[10px]"}`}>{activity}</span>}
        </div>
      </div>
    </div>
  );
}
