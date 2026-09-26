import { GetTurso, HasTurso } from "../lib/turso.js";

export default async function handler(req, res) {
  const DiscordId = String(req.query.discord_id || req.query.discordId || "").trim();
  if (!DiscordId) { res.status(400).json({ error: "Missing discord_id" }); return; }
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    const Rs = await Db.execute({ sql: "SELECT * FROM discord_presence WHERE discord_id = ? LIMIT 1", args: [DiscordId] });
    if (Rs.rows?.[0]) { res.status(200).json({ presence: Rs.rows[0] }); return; }
  } catch (Err) {
    console.error("presence db error:", Err);
  }
  try {
    const Lanyard = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(DiscordId)}`, { signal: AbortSignal.timeout(8000) });
    const Lj = await Lanyard.json().catch(() => null);
    const Ld = Lj?.success ? Lj.data : null;
    if (!Ld) { res.status(200).json({ presence: null }); return; }
    const Acts = Array.isArray(Ld.activities) ? Ld.activities : [];
    const Custom = Acts.find((a) => a?.type === 4) || null;
    const Game = Acts.find((a) => a?.type === 0) || null;
    const U = Ld.discord_user || {};
    res.status(200).json({
      presence: {
        discord_id: String(U.id || DiscordId),
        username: U.username || null,
        global_name: U.global_name || U.display_name || null,
        display_name: U.display_name || null,
        avatar: U.avatar || null,
        public_flags: 0,
        status: Ld.discord_status || "offline",
        custom_status: Custom?.state || null,
        custom_status_emoji: Custom?.emoji ? JSON.stringify({ id: Custom.emoji.id || null, name: Custom.emoji.name || null, animated: !!Custom.emoji.animated }) : null,
        activity_name: Game?.name || null,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (Err) {
    console.error("presence lanyard error:", Err);
    res.status(200).json({ presence: null });
  }
}
