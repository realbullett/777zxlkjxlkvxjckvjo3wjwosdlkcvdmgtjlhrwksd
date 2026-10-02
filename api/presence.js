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
  res.status(200).json({ presence: null });
}
