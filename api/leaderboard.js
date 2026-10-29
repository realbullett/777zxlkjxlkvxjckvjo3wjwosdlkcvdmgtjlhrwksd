import { GetTurso, HasTurso } from "../lib/turso.js";
export default async function handler(req, res) {
  const Period = String(req.query.period || "all").toLowerCase() === "month" ? "month" : "all";
  const Sort = String(req.query.sort || "views").toLowerCase() === "likes" ? "likes" : "views";
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    const MonthFilter = Period === "month" ? "AND pv.viewed_at >= strftime('%Y-%m-01T00:00:00.000Z','now')" : "";
    const VoteFilter = Period === "month" ? "AND pv.created_at >= strftime('%Y-%m-01T00:00:00.000Z','now')" : "";
    const Where = "u.views_blacklisted = 0 AND u.suspended = 0 AND u.hidden = 0";
    const [ViewRs, LikeRs] = await Promise.all([
      Db.execute({ sql: `SELECT pv.user_id, COUNT(*) AS c FROM page_views pv JOIN users u ON u.id = pv.user_id WHERE ${Where} ${MonthFilter} GROUP BY pv.user_id`, args: [] }),
      Db.execute({ sql: `SELECT pv.user_id, COUNT(*) AS c FROM profile_votes pv JOIN users u ON u.id = pv.user_id WHERE ${Where} AND pv.vote = 1 ${VoteFilter} GROUP BY pv.user_id`, args: [] }),
    ]);
    const ViewCount = new Map();
    for (const r of ViewRs.rows || []) ViewCount.set(r.user_id, Number(r.c) || 0);
    const LikeCount = new Map();
    for (const r of LikeRs.rows || []) LikeCount.set(r.user_id, Number(r.c) || 0);
    let rows = Array.from(new Set([...ViewCount.keys(), ...LikeCount.keys()]), (user_id) => ({ user_id, views: ViewCount.get(user_id) || 0, likes: LikeCount.get(user_id) || 0 }));
    if (Period === "all") {
      try {
        const ByViews = [...rows].sort((A, B) => B.views - A.views);
        await Db.execute({ sql: "DELETE FROM badges WHERE badge IN ('gold','silver','bronze')" });
        for (let I = 0; I < Math.min(3, ByViews.length); I++) {
          await Db.execute({ sql: "INSERT OR IGNORE INTO badges (user_id, badge) VALUES (?, ?)", args: [ByViews[I].user_id, ["gold", "silver", "bronze"][I]] });
        }
      } catch {}
      try {
        await Db.execute({ sql: "DELETE FROM badges WHERE badge = 'mostliked'" });
        let MlRow = null;
        for (const R of rows) if (!MlRow || R.likes > MlRow.likes) MlRow = R;
        if (MlRow && MlRow.likes > 0) {
          await Db.execute({ sql: "INSERT OR IGNORE INTO badges (user_id, badge) VALUES (?, 'mostliked')", args: [MlRow.user_id] });
        }
      } catch {}
    }
    rows.sort((A, B) => Sort === "likes" ? B.likes - A.likes : B.views - A.views);
    rows = rows.slice(0, 100);
    const ids = [];
    for (const r of rows) ids.push(r.user_id);
    const fields = {};
    let badgeMap = {};
    let avMap = {};
    let bgMap = {};
    try {
      if (ids.length) {
        const placeholders = ids.map(() => "?").join(",");
        const [fRs, bRs, pRs, aRs, bgRs] = await Promise.all([
          Db.execute({ sql: `SELECT id, username, alias, description, avatar_url FROM users WHERE id IN (${placeholders})`, args: ids }),
          Db.execute({ sql: `SELECT user_id, badge FROM badges WHERE user_id IN (${placeholders})`, args: ids }),
          Db.execute({ sql: `SELECT user_id, badge FROM badge_prefs WHERE user_id IN (${placeholders}) AND hidden = 1`, args: ids }),
          Db.execute({ sql: `SELECT user_id, url FROM assets WHERE user_id IN (${placeholders}) AND type = 'profile_avatar'`, args: ids }),
          Db.execute({ sql: `SELECT user_id, url FROM assets WHERE user_id IN (${placeholders}) AND type = 'background'`, args: ids }),
        ]);
        for (const r of (fRs.rows || [])) fields[r.id] = r;
        for (const r of (aRs.rows || [])) avMap[r.user_id] = r.url;
        for (const r of (bgRs.rows || [])) bgMap[r.user_id] = r.url;
        const hidden = new Set((pRs.rows || []).map((r) => `${r.user_id}:${r.badge}`));
        for (const r of (bRs.rows || [])) {
          if (hidden.has(`${r.user_id}:${r.badge}`)) continue;
          (badgeMap[r.user_id] = badgeMap[r.user_id] || []).push(r.badge);
        }
      }
    } catch {}
    const entries = rows.map((r) => ({
      user_id: r.user_id,
      username: fields[r.user_id]?.username || "unknown",
      alias: fields[r.user_id]?.alias || null,
      description: fields[r.user_id]?.description || null,
      avatar_url: avMap[r.user_id] || fields[r.user_id]?.avatar_url || null,
      views: r.views,
      likes: r.likes,
      bg: bgMap[r.user_id] || null,
      badges: badgeMap[r.user_id] || [],
    }));
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=600");
    res.status(200).json({ source: "turso", entries });
  } catch (Err) {
    console.error("leaderboard turso fail:", Err);
    res.status(500).json({ error: "Leaderboard failed" });
  }
}