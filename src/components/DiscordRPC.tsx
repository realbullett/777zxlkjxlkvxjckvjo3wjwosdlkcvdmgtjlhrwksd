import { useEffect, useState } from "react";

type PresenceRow = {
  discord_id: string;
  username: string | null;
  global_name: string | null;
  display_name: string | null;
  avatar: string | null;
  public_flags: number;
  clan_tag: string | null;
  clan_badge: string | null;
  clan_guild_id: string | null;
  avatar_decoration: string | null;
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
  [1 << 0]: "5e74e9b61934fc1f67c65515d1f7e60d",
  [1 << 1]: "3f9748e53446a137a052f3454e2de41e",
  [1 << 2]: "bf01d1073931f921909045f3a39fd264",
  [1 << 6]: "8a88d63823d8a71cd5e390baa45efa02",
  [1 << 7]: "011940fd013da3f7fb926e4a1cd2e618",
  [1 << 8]: "3aa41de486fa12454c3761e8e223442e",
  [1 << 17]: "6df5892791306f35ec167945a8d002cc",
  [1 << 22]: "6bdc42827a38498929a4920da12695d9",
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
  const badgeBits = [1, 2, 4, 8, 64, 128, 256, 512, 1024, 4096, 16384, 131072, 262144, 524288, 4194304].filter((b) => (flags & b) !== 0);
  const showClan = !!(data.clan_tag && data.clan_badge && data.clan_guild_id);
  const clanBadgeUrl = showClan ? `https://cdn.discordapp.com/guild-tag-badges/${data.clan_guild_id}/${data.clan_badge}.png` : "";
  const decoUrl = data.avatar_decoration ? `https://cdn.discordapp.com/avatar-decoration-presets/${data.avatar_decoration}.png` : "";

  return (
    <div className="w-fit max-w-full">
      <div className="flex items-center gap-3 rounded-[22px] bg-black/45 border border-white/10 px-4 py-2.5 backdrop-blur-md">
        <div className="relative flex-shrink-0">
          <img src={avatarUrl} alt={data.username || ""} className="h-14 w-14 rounded-full" />
          {decoUrl && <img src={decoUrl} alt="" className="pointer-events-none absolute inset-0 h-14 w-14" draggable={false} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          <span
            className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#17130f]"
            style={{ backgroundColor: status.color }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-[17px] font-bold text-white">{data.global_name || data.display_name || data.username || "user"}</span>
            {showClan && (
              <span className="flex shrink-0 items-center gap-1">
                <img src={clanBadgeUrl} alt="" className="h-[18px] w-[18px]" draggable={false} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-[14px] font-semibold text-white/60">{data.clan_tag}</span>
              </span>
            )}
            {badgeBits.map((b) => (
              BADGE_ICONS[b] ? (
                <img key={b} src={`https://cdn.discordapp.com/badge-icons/${BADGE_ICONS[b]}.png`} alt="" className="h-[18px] w-[18px] shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span key={b} className="h-[18px] w-[18px] shrink-0 rounded-[5px] bg-white/20 border border-black/30" />
              )
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-px min-w-0">
            {emoji && (
              emoji.id
                ? <img src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}`} alt={emoji.name || ""} className="h-3.5 w-3.5 shrink-0" />
                : <span className="shrink-0 text-xs">{emoji.name || ""}</span>
            )}
            <span className="truncate text-[13px] text-white/50">{textStatus || activity || "currently doing nothing"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
