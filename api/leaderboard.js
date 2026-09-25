import { GetTurso, HasTurso } from "../lib/turso.js";
export default async function handler(req, res) {
  const Period = String(req.query.period || "all").toLowerCase() === "month" ? "month" : "all";
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    const MonthFilter = Period === "month" ? "AND pv.viewed_at >= strftime('%Y-%m-01T00:00:00.000Z','now')" : "";
    const Rs = await Db.execute({
      sql: `SELECT pv.user_id, u.username, u.avatar_url, COUNT(*) AS views
        FROM page_views pv JOIN users u ON u.id = pv.user_id
        WHERE u.views_blacklisted = 0 ${MonthFilter}
        GROUP BY pv.user_id ORDER BY views DESC LIMIT 100`,
      args: []
    });
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=600");
    res.status(200).json({ source: "turso", entries: Rs.rows || [] });
  } catch (Err) {
    console.error("leaderboard turso fail:", Err);
    res.status(500).json({ error: "Leaderboard failed" });
  }
}
