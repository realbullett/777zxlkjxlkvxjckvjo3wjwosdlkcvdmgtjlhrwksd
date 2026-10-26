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
        WHERE u.views_blacklisted = 0 AND u.suspended = 0 AND u.hidden = 0 ${MonthFilter}
        GROUP BY pv.user_id ORDER BY views DESC LIMIT 100`,
      args: []
    });
    const rows = Rs.rows || [];
    const ids = [];
    for (const r of rows) ids.push(r.user_id);
    let badgeMap = {};
    let avMap = {};
    try {
      if (ids.length) {
        const placeholders = ids.map(() => "?").join(",");
        const [bRs, pRs, aRs] = await Promise.all([
          Db.execute({ sql: `SELECT user_id, badge FROM badges WHERE user_id IN (${placeholders})`, args: ids }),
          Db.execute({ sql: `SELECT user_id, badge FROM badge_prefs WHERE user_id IN (${placeholders}) AND hidden = 1`, args: ids }),
          Db.execute({ sql: `SELECT user_id, url FROM assets WHERE user_id IN (${placeholders}) AND type = 'profile_avatar'`, args: ids }),
        ]);
        for (const r of (aRs.rows || [])) avMap[r.user_id] = r.url;
        const hidden = new Set((pRs.rows || []).map((r) => `${r.user_id}:${r.badge}`));
        for (const r of (bRs.rows || [])) {
          if (hidden.has(`${r.user_id}:${r.badge}`)) continue;
          (badgeMap[r.user_id] = badgeMap[r.user_id] || []).push(r.badge);
        }
      }
    } catch {}
    const entries = rows.map((r) => ({ ...r, avatar_url: avMap[r.user_id] || r.avatar_url, badges: badgeMap[r.user_id] || [] }));
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=600");
    res.status(200).json({ source: "turso", entries });
  } catch (Err) {
    console.error("leaderboard turso fail:", Err);
    res.status(500).json({ error: "Leaderboard failed" });
  }
}
