import crypto from "crypto";
import { GetTurso, HasTurso } from "./_lib/turso.js";

const Secret = process.env.SESSION_SECRET || "sire-dev-secret-do-not-use-in-prod";

function UnsignToken(Token) {
  try {
    const Payload = Buffer.from(Token, "base64url").toString();
    const Colon = Payload.indexOf(":");
    if (Colon === -1) return null;
    const Uid = Payload.slice(0, Colon);
    const Sig = Payload.slice(Colon + 1);
    const Expected = crypto.createHmac("sha256", Secret).update(Uid).digest("hex");
    if (Sig !== Expected || !Uid) return null;
    return Number(Uid);
  } catch { return null; }
}

function IsoDaysAgo(Days) {
  return new Date(Date.now() - Days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function handler(req, res) {
  const Uid = UnsignToken(req.query.sessionToken || req.query.s);
  if (!Uid) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!HasTurso()) { res.status(500).json({ error: "No DB configured" }); return; }
  try {
    const Db = GetTurso();
    const SevenAgo = IsoDaysAgo(7);
    const [TotalRs, RecentRs, DayRs, VisitorRs, UserRs] = await Promise.all([
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [Uid, SevenAgo] }),
      Db.execute({ sql: "SELECT viewed_at FROM page_views WHERE user_id = ? AND viewed_at >= ?", args: [Uid, SevenAgo] }),
      Db.execute({ sql: "SELECT visitor_id FROM page_views WHERE user_id = ?", args: [Uid] }),
      Db.execute({ sql: "SELECT COUNT(*) AS c FROM users", args: [] })
    ]);
    const ByDay = {};
    for (const Row of DayRs.rows || []) {
      const Label = new Date(Row.viewed_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      ByDay[Label] = (ByDay[Label] || 0) + 1;
    }
    const Labels = [];
    for (let i = 6; i >= 0; i--) {
      const D = new Date();
      D.setDate(D.getDate() - i);
      Labels.push(D.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    }
    const UniqueSet = new Set((VisitorRs.rows || []).map((R) => R.visitor_id).filter(Boolean));
    res.status(200).json({
      totalViews: Number(TotalRs.rows?.[0]?.c || 0),
      recentViews: Number(RecentRs.rows?.[0]?.c || 0),
      daily: Labels.map((L) => ({ date: L, count: ByDay[L] || 0 })),
      uniqueVisitors: UniqueSet.size,
      totalUsers: Number(UserRs.rows?.[0]?.c || 0)
    });
  } catch (Err) {
    res.status(500).json({ error: "Failed" });
  }
}
