import { useEffect, useState } from "react";

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

const BADGE_ICONS: Record<number, string> = {
  [1 << 6]: "8a88d63823d8a71cd5e390baa45efa02",
};

export default function DiscordRPC({ discordId, wide = false }: { discordId: string; wide?: boolean }) {
  const [data, setData] = useState<PresenceRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const load = () =>
      fetch(`/api/presence?discord_id=${encodeURIComponent(discordId)}`).then(async (R) => {
        const J = await R.json().catch(() => null);
        if (!cancelled && J?.presence) setData(J.presence);
      }).catch(() => {});
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
  const textStatus = data.custom_status;
  const activity = data.activity_name;
  let emoji: { id: string | null; name: string | null; animated?: boolean } | null = null;
  if (data.custom_status_emoji) {
    try {
      emoji = JSON.parse(data.custom_status_emoji);
    } catch {}
  }
  const badgeBits = [1, 2, 4, 8, 64, 128, 256, 512, 1024, 4096, 16384, 131072, 262144, 524288].filter((b) => (flags & b) !== 0);

  return (
    <div className={`w-full mx-auto ${wide ? "" : "max-w-xs"}`}>
      <div className={`flex items-center gap-4 rounded-[26px] bg-black/45 border border-white/10 px-5 py-4 backdrop-blur-md ${wide ? "h-full" : ""}`}>
        <div className="relative flex-shrink-0">
          <img src={avatarUrl} alt={data.username || ""} className={`${wide ? "h-[72px] w-[72px]" : "h-16 w-16"} rounded-full`} />
          <span
            className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-[3px] border-[#17130f]"
            style={{ backgroundColor: status.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`truncate font-semibold text-white ${wide ? "text-xl" : "text-[18px]"}`} style={{ fontWeight: 550 }}>{data.global_name || data.display_name || data.username || "user"}</span>
            {badgeBits.map((b) => (
              BADGE_ICONS[b] ? (
                <img key={b} src={`https://cdn.discordapp.com/badge-icons/${BADGE_ICONS[b]}.png`} alt="" className={`${wide ? "h-5 w-5" : "h-[18px] w-[18px]"} shrink-0`} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span key={b} className={`${wide ? "h-5 w-5" : "h-[18px] w-[18px]"} shrink-0 rounded-[5px] bg-white/20 border border-black/30`} />
              )
            ))}
          </div>
          {(textStatus || emoji || activity) && (
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              {emoji && (
                emoji.id
                  ? <img src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`} alt={emoji.name || ""} className="h-3.5 w-3.5 shrink-0" />
                  : <span className="shrink-0 text-xs">{emoji.name || ""}</span>
              )}
              <span className={`truncate text-white/50 ${wide ? "text-sm" : "text-[13.5px]"}`}>{textStatus || activity}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
