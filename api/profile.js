import { GetTurso, HasTurso, PublicProfileCols } from "./_lib/turso.js";
export default async function handler(req, res) {
  const Name = String(req.query.username || req.query.u || "").trim().toLowerCase();
  if (!Name) { res.status(400).json({ error: "Missing username" }); return; }
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    const Prof = await Db.execute({
      sql: `SELECT ${PublicProfileCols} FROM users WHERE username = ? OR alias = ? LIMIT 2`,
      args: [Name, Name]
    });
    const Rows = Prof.rows || [];
    const Match = Rows.find((R) => String(R.username || "").toLowerCase() === Name) || Rows[0];
    if (!Match) { res.status(404).json({ error: "Not found" }); return; }
    const Uid = Match.id;
    const [CountRs, BadgeRs, LinkRs, AssetRs] = await Promise.all([
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT badge FROM badges WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT platform, url FROM links WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT type, url FROM assets WHERE user_id = ?", args: [Uid] })
    ]);
    res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({
      source: "turso",
      user: Match,
      views: Number(CountRs.rows?.[0]?.c || 0),
      badges: (BadgeRs.rows || []).map((R) => R.badge),
      links: Object.fromEntries((LinkRs.rows || []).map((R) => [R.platform, R.url])),
      assets: AssetRs.rows || []
    });
  } catch (Err) {
    console.error("profile turso fail:", Err);
    res.status(500).json({ error: "Failed" });
  }
}
